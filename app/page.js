"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  CheckSquare,
  File,
  FileText,
  Folder,
  HardDrive,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shield,
  Upload,
  Users,
  X
} from "lucide-react";
import { supabase } from "../lib/supabase";

const nav = [
  ["Files", File],
  ["Tasks", CheckSquare],
  ["Notes", FileText],
  ["Chat", MessageSquare],
  ["Members", Users],
  ["Activity", Activity],
  ["Settings", Settings]
];

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(Boolean(supabase));
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [page, setPage] = useState("Files");
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadData();
    else {
      setWorkspace(null);
      setWorkspaces([]);
      setFiles([]);
      setMembers([]);
      setTasks([]);
      setNotes([]);
    }
  }, [session]);

  async function loadData() {
    if (!supabase || !session) return;
    setBusy(true);
    try {
      const { data: memberships, error } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(id,name,owner_id,created_at)")
        .eq("user_id", session.user.id);

      if (error) throw error;

      const ws = (memberships || []).map((m) => ({ ...m.workspaces, role: m.role })).filter(Boolean);
      setWorkspaces(ws);
      const selected = workspace && ws.find((w) => w.id === workspace.id);
      const current = selected || ws[0] || null;

      if (current) {
        setWorkspace(current);
        const [fileRes, memberRes, taskRes, noteRes] = await Promise.all([
          supabase.from("files").select("*").eq("workspace_id", current.id).order("created_at", { ascending: false }),
          supabase.from("workspace_members").select("workspace_id,user_id,role").eq("workspace_id", current.id),
          supabase.from("tasks").select("*").eq("workspace_id", current.id).order("created_at", { ascending: false }),
          supabase.from("notes").select("*").eq("workspace_id", current.id).order("updated_at", { ascending: false })
        ]);
        if (fileRes.error) throw fileRes.error;
        setFiles(fileRes.data || []);
        setMembers(memberRes.data || []);
        setTasks(taskRes.data || []);
        setNotes(noteRes.data || []);
      } else {
        setFiles([]);
        setMembers([]);
        setTasks([]);
        setNotes([]);
      }
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function authSubmit(e) {
    e.preventDefault();
    if (!supabase) return;
    setAuthMessage("");
    const result = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) setAuthMessage(result.error.message);
    else if (authMode === "signup" && !result.data.session) setAuthMessage("Account created. Check your email if confirmation is enabled.");
  }

  async function selectWorkspace(workspaceId) {
    const next = workspaces.find((item) => item.id === workspaceId) || null;
    setWorkspace(next);
    setFiles([]);
    setMembers([]);
    setTasks([]);
    setNotes([]);
    if (next) await loadWorkspaceData(next.id);
  }

  async function loadWorkspaceData(workspaceId) {
    if (!supabase) return;
    setBusy(true);
    try {
      const [fileRes, memberRes, taskRes, noteRes] = await Promise.all([
        supabase.from("files").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
        supabase.from("workspace_members").select("workspace_id,user_id,role").eq("workspace_id", workspaceId),
        supabase.from("tasks").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
        supabase.from("notes").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false })
      ]);
      if (fileRes.error) throw fileRes.error;
      if (memberRes.error) throw memberRes.error;
      if (taskRes.error) throw taskRes.error;
      if (noteRes.error) throw noteRes.error;
      setFiles(fileRes.data || []);
      setMembers(memberRes.data || []);
      setTasks(taskRes.data || []);
      setNotes(noteRes.data || []);
    } catch (e) { setNotice(e.message); }
    finally { setBusy(false); }
  }

  async function createWorkspace(e) {
    e.preventDefault();
    if (!workspaceName.trim() || !supabase || !session) return;
    setBusy(true);
    try {
      const workspaceId = crypto.randomUUID();
      const name = workspaceName.trim();

      const { error: createError } = await supabase
        .from("workspaces")
        .insert({ id: workspaceId, name, owner_id: session.user.id });
      if (createError) throw createError;

      const { error: memberError } = await supabase.from("workspace_members").insert({
        workspace_id: workspaceId,
        user_id: session.user.id,
        role: "owner"
      });
      if (memberError) throw memberError;

      setWorkspaceName("");
      setShowWorkspace(false);
      setNotice("Workspace created.");
      await loadData();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length || !workspace || !supabase) return;

    setBusy(true);
    try {
      for (const file of selected) {
        const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
        const path = `${workspace.id}/${crypto.randomUUID()}-${safeName}`;
        const upload = await supabase.storage.from("workspace-files").upload(path, file, {
          upsert: false,
          contentType: file.type || "application/octet-stream"
        });
        if (upload.error) throw upload.error;

        const insert = await supabase.from("files").insert({
          workspace_id: workspace.id,
          uploader_id: session.user.id,
          name: file.name,
          storage_path: path,
          size: file.size,
          mime_type: file.type || "application/octet-stream"
        });
        if (insert.error) throw insert.error;
      }
      setNotice("File uploaded successfully.");
      await loadData();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function downloadFile(item) {
    if (!supabase) return;
    const { data, error } = await supabase.storage.from("workspace-files").download(item.storage_path);
    if (error) return setNotice(error.message);
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addTask() {
    if (!workspace || !supabase) return;
    const title = window.prompt("Task title");
    if (!title?.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      workspace_id: workspace.id,
      title: title.trim(),
      status: "todo",
      created_by: session.user.id
    });
    if (error) setNotice(error.message);
    else await loadData();
  }

  async function addNote() {
    if (!workspace || !supabase) return;
    const title = window.prompt("Note title", "New note");
    if (!title?.trim()) return;
    const { error } = await supabase.from("notes").insert({
      workspace_id: workspace.id,
      title: title.trim(),
      content: "",
      created_by: session.user.id
    });
    if (error) setNotice(error.message);
    else await loadData();
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setWorkspace(null);
  }

  const filteredFiles = useMemo(
    () => files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [files, search]
  );

  if (!configured) return <SetupScreen />;

  if (loading) return <div className="center-screen">Loading Arkspace…</div>;

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand"><HardDrive size={24} /> Arkspace</div>
          <h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">Your private workspace for files and collaboration.</p>
          <form onSubmit={authSubmit}>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {authMessage && <div className="error">{authMessage}</div>}
            <button className="primary full">{authMode === "login" ? "Log in" : "Sign up"}</button>
          </form>
          <button className="link-btn" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthMessage(""); }}>
            {authMode === "login" ? "Create a new account" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><HardDrive size={23} /> Arkspace <span>V2</span></div>

        <div className="workspace-picker">
          <small>WORKSPACE</small>
          <select value={workspace?.id || ""} onChange={(e) => selectWorkspace(e.target.value)}>
            {!workspaces.length && <option value="">No workspace</option>}
            {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button className="secondary full" onClick={() => setShowWorkspace(true)}><Plus size={16}/> New workspace</button>
        </div>

        <nav>
          {nav.map(([name, Icon]) => (
            <button key={name} className={page === name ? "nav-item active" : "nav-item"} onClick={() => setPage(name)}>
              <Icon size={18}/>{name}
            </button>
          ))}
        </nav>

        <button className="nav-item logout" onClick={signOut}><LogOut size={18}/> Log out</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>{workspace?.name || "Arkspace"}</h2>
            <p>{workspace ? `${workspace.role} workspace` : "Create your first workspace"}</p>
          </div>
          <div className="top-actions">
            <span className="user-pill">{session.user.email}</span>
          </div>
        </header>

        {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}><X size={16}/></button></div>}

        {!workspace ? (
          page === "Files" ? <EmptyWorkspace onCreate={() => setShowWorkspace(true)} /> :
          page === "Chat" ? <Coming title="Chat is ready for the next step" text="Create a workspace first. Real-time chat will be added in the next V2 step." icon={MessageSquare}/> :
          page === "Activity" ? <Coming title="No activity yet" text="Create a workspace first. Activity tracking will appear here." icon={Activity}/> :
          page === "Settings" ? <Coming title="Workspace settings" text="Create a workspace first. Permissions and storage controls are planned for V2.2." icon={Settings}/> :
          <div className="empty-state"><Shield size={42}/><h2>{page}</h2><p>Create a workspace first to use {page.toLowerCase()}.</p><button className="primary" onClick={() => setShowWorkspace(true)}><Plus size={17}/> Create workspace</button></div>
        ) : (
          <>
            {page === "Files" && (
              <section>
                <div className="section-head">
                  <div><h1>Files</h1><p>Permanent cloud storage for your workspace.</p></div>
                  <label className="upload-btn"><Upload size={17}/> Upload<input type="file" multiple onChange={uploadFiles}/></label>
                </div>
                <div className="toolbar">
                  <Search size={18}/>
                  <input placeholder="Search files…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="stats">
                  <Stat label="Files" value={files.length}/>
                  <Stat label="Members" value={members.length}/>
                  <Stat label="Tasks" value={tasks.length}/>
                  <Stat label="Notes" value={notes.length}/>
                </div>
                {busy && <p className="muted">Working…</p>}
                <div className="file-grid">
                  {filteredFiles.map((item) => (
                    <div className="file-card" key={item.id}>
                      <div className="file-icon"><File size={23}/></div>
                      <strong>{item.name}</strong>
                      <span>{formatBytes(item.size)}</span>
                      <button className="secondary" onClick={() => downloadFile(item)}><ArrowDownToLine size={16}/> Download</button>
                    </div>
                  ))}
                </div>
                {!filteredFiles.length && <Empty title="No files yet" text="Upload your first workspace file."/>}
              </section>
            )}

            {page === "Tasks" && <DataPage title="Tasks" text="Shared tasks saved in your database." action="+ Add task" onAction={addTask}>
              <div className="list">{tasks.map(t => <div className="list-row" key={t.id}><CheckSquare size={18}/><div><strong>{t.title}</strong><span>{t.status}</span></div></div>)}</div>
              {!tasks.length && <Empty title="No tasks" text="Add a task to start your team board."/>}
            </DataPage>}

            {page === "Notes" && <DataPage title="Notes" text="Shared notes for your workspace." action="+ New note" onAction={addNote}>
              <div className="list">{notes.map(n => <div className="list-row" key={n.id}><FileText size={18}/><div><strong>{n.title}</strong><span>Updated {new Date(n.updated_at).toLocaleString()}</span></div></div>)}</div>
              {!notes.length && <Empty title="No notes" text="Create a shared note."/>}
            </DataPage>}

            {page === "Chat" && <Coming title="Chat is next" text="The V2 database foundation is ready. Real-time workspace chat will be added in the next V2 step." icon={MessageSquare}/>}
            {page === "Members" && <DataPage title="Members" text="People with access to this workspace.">
              <div className="list">{members.map(m => <div className="list-row" key={m.user_id}><Users size={18}/><div><strong>{m.user_id}</strong><span>{m.role}</span></div></div>)}</div>
            </DataPage>}
            {page === "Activity" && <Coming title="Activity feed" text="We'll record uploads, tasks, notes and membership changes in the next V2 step." icon={Activity}/>}
            {page === "Settings" && <Coming title="Workspace settings" text="Permissions, invites and storage controls are planned for V2.2." icon={Settings}/>}
          </>
        )}
      </main>

      {showWorkspace && <div className="modal-backdrop"><div className="modal">
        <button className="modal-close" onClick={() => setShowWorkspace(false)}><X/></button>
        <h2>Create workspace</h2>
        <p className="muted">Make a private space for your team.</p>
        <form onSubmit={createWorkspace}>
          <label>Workspace name<input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="My Team" autoFocus required /></label>
          <button className="primary full" disabled={busy}>Create workspace</button>
        </form>
      </div></div>}
    </div>
  );
}

function SetupScreen() {
  return <div className="center-screen"><div className="setup-card"><Shield size={34}/><h1>Connect Supabase</h1><p>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to Vercel Environment Variables, then redeploy.</p><p className="muted">Run the SQL in <code>supabase/schema.sql</code> first.</p></div></div>;
}

function EmptyWorkspace({ onCreate }) {
  return <div className="empty-state"><Folder size={42}/><h2>No workspace yet</h2><p>Create your private workspace to start storing files.</p><button className="primary" onClick={onCreate}><Plus size={17}/> Create workspace</button></div>;
}

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function DataPage({ title, text, action, onAction, children }) {
  return <section><div className="section-head"><div><h1>{title}</h1><p>{text}</p></div>{action && <button className="primary" onClick={onAction}>{action}</button>}</div>{children}</section>;
}

function Empty({ title, text }) {
  return <div className="empty-state small"><File size={30}/><h3>{title}</h3><p>{text}</p></div>;
}

function Coming({ title, text, icon: Icon }) {
  return <div className="empty-state"><Icon size={42}/><h2>{title}</h2><p>{text}</p></div>;
}