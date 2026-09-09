 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, CheckCircle2, ChevronDown, Clock3, Download,
  File, FileImage, FileText, Folder, FolderPlus, Grid2X2, Home,
  Link2, List, MessageSquare, MoreHorizontal, Plus, Search,
  Settings, Shield, Sparkles, StickyNote, Task, Upload, Users,
  X, Check, Trash2, Pencil, ExternalLink
} from "lucide-react";

const initialFiles = [
  { id: 1, name: "Arkspace project brief.pdf", type: "pdf", size: "2.4 MB", folder: "Project", updated: "Today" },
  { id: 2, name: "UI wireframes.png", type: "image", size: "1.8 MB", folder: "Design", updated: "Yesterday" },
  { id: 3, name: "database-schema.txt", type: "text", size: "8 KB", folder: "Project", updated: "Aug 28" },
  { id: 4, name: "README.md", type: "text", size: "5 KB", folder: "Project", updated: "Aug 27" }
];

const initialTasks = [
  { id: 1, title: "Finish workspace UI", status: "In progress", assignee: "You" },
  { id: 2, title: "Prepare hackathon resources", status: "Todo", assignee: "Rahul" },
  { id: 3, title: "Review project brief", status: "Done", assignee: "You" }
];

function FileIcon({ type }) {
  if (type === "image") return <FileImage size={20} />;
  if (type === "text") return <FileText size={20} />;
  return <FileText size={20} />;
}

export default function HomePage() {
  const [active, setActive] = useState("Overview");
  const [files, setFiles] = useState(initialFiles);
  const [tasks, setTasks] = useState(initialTasks);
  const [notes, setNotes] = useState([
    { id: 1, title: "Project ideas", body: "Build a private workspace for college teams." },
    { id: 2, title: "Next steps", body: "Connect database and cloud storage after the UI." }
  ]);
  const [resources, setResources] = useState([
    { id: 1, title: "Next.js Docs", url: "https://nextjs.org" },
    { id: 2, title: "Vercel", url: "https://vercel.com" }
  ]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState(["Project", "Design", "Resources"]);
  const [preview, setPreview] = useState(null);
  const [chat, setChat] = useState([
    { id: 1, user: "Rahul", text: "The new UI looks clean 🔥", time: "2:10 PM" },
    { id: 2, user: "You", text: "Thanks! Database comes next.", time: "2:12 PM" }
  ]);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("arkspace-files");
    if (saved) setFiles(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("arkspace-files", JSON.stringify(files));
  }, [files]);

  const filteredFiles = useMemo(
    () => files.filter(f => f.name.toLowerCase().includes(query.toLowerCase())),
    [files, query]
  );

  function notify(text) {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  }

  function uploadFiles(list) {
    const incoming = Array.from(list).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : f.type.includes("text") ? "text" : "pdf",
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      folder: "Project",
      updated: "Just now",
      localUrl: URL.createObjectURL(f)
    }));
    setFiles(prev => [...incoming, ...prev]);
    setShowUpload(false);
    notify(`${incoming.length} file${incoming.length > 1 ? "s" : ""} added`);
  }

  function deleteFile(id) {
    setFiles(prev => prev.filter(f => f.id !== id));
    setPreview(null);
    notify("File removed");
  }

  function addFolder() {
    if (!folderName.trim()) return;
    setFolders(prev => [...prev, folderName.trim()]);
    setFolderName("");
    setShowNewFolder(false);
    notify("Folder created");
  }

  function addTask() {
    const title = prompt("Task name");
    if (!title?.trim()) return;
    setTasks(prev => [{ id: Date.now(), title: title.trim(), status: "Todo", assignee: "You" }, ...prev]);
    notify("Task added");
  }

  function addNote() {
    const title = prompt("Note title");
    if (!title?.trim()) return;
    setNotes(prev => [{ id: Date.now(), title: title.trim(), body: "Write your shared note here…" }, ...prev]);
    notify("Note created");
  }

  function addResource() {
    const title = prompt("Resource name");
    if (!title?.trim()) return;
    const url = prompt("URL");
    if (!url?.trim()) return;
    setResources(prev => [{ id: Date.now(), title: title.trim(), url: url.trim() }, ...prev]);
    notify("Resource added");
  }

  function sendMessage() {
    if (!message.trim()) return;
    setChat(prev => [...prev, { id: Date.now(), user: "You", text: message.trim(), time: "Now" }]);
    setMessage("");
  }

  const nav = [
    ["Overview", Home], ["Files", Folder], ["Chat", MessageSquare],
    ["Notes", StickyNote], ["Tasks", CheckCircle2], ["Resources", Link2],
    ["Members", Users], ["Activity", Activity]
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">A</div><div><strong>Arkspace</strong><span>Private workspace</span></div></div>
        <button className="workspace-switch"><span className="workspace-avatar">A</span><span className="workspace-text"><b>Arkspace Team</b><small>Private workspace</small></span><ChevronDown size={16}/></button>
        <nav>
          {nav.map(([label, Icon]) => (
            <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}>
              <Icon size={18}/><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Shield size={18}/><span>Privacy</span></button>
          <button className="nav-item" onClick={() => setActive("Settings")}><Settings size={18}/><span>Settings</span></button>
          <div className="user-mini"><div className="avatar">AT</div><div><b>ANKIT</b><small>Owner</small></div><MoreHorizontal size={18}/></div>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark">A</div><strong>Arkspace</strong></div>
          <div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search files, notes, tasks..." /></div>
          <div className="top-actions"><button className="icon-btn"><Bell size={19}/></button><div className="avatar">AT</div></div>
        </header>

        <div className="content">
          {active === "Overview" && <>
            <div className="hero">
              <div><div className="eyebrow"><Sparkles size={15}/> PRIVATE TEAM SPACE</div><h1>Good to see you, ANKIT.</h1><p>Everything your team needs, in one private place.</p></div>
              <button className="primary" onClick={() => setShowUpload(true)}><Upload size={17}/> Upload file</button>
            </div>
            <div className="stats">
              <div><span>Files</span><b>{files.length}</b><small>Shared with team</small></div>
              <div><span>Folders</span><b>{folders.length}</b><small>Organized spaces</small></div>
              <div><span>Tasks</span><b>{tasks.filter(t => t.status !== "Done").length}</b><small>Need attention</small></div>
              <div><span>Members</span><b>4</b><small>Private workspace</small></div>
            </div>
            <div className="section-head"><div><h2>Recent files</h2><p>Your team's latest files</p></div><button className="ghost" onClick={() => setActive("Files")}>View all</button></div>
            <div className="file-grid">
              {files.slice(0, 4).map(f => <FileCard key={f.id} file={f} onPreview={() => setPreview(f)} onDelete={() => deleteFile(f.id)} />)}
            </div>
            <div className="two-col">
              <div className="panel"><div className="panel-head"><div><h3>Tasks</h3><p>Keep the team moving</p></div><button className="small-btn" onClick={addTask}><Plus size={15}/></button></div>{tasks.map(t => <TaskRow key={t.id} task={t} />)}</div>
              <div className="panel"><div className="panel-head"><div><h3>Activity</h3><p>Latest workspace activity</p></div></div><ActivityRow icon={<Upload size={15}/>} text="You uploaded a new file" time="2m ago"/><ActivityRow icon={<CheckCircle2 size={15}/>} text="Rahul completed a task" time="18m ago"/><ActivityRow icon={<StickyNote size={15}/>} text="You created a shared note" time="1h ago"/></div>
            </div>
          </>}

          {active === "Files" && <FilesPage files={filteredFiles} folders={folders} view={view} setView={setView} onUpload={() => setShowUpload(true)} onFolder={() => setShowNewFolder(true)} onPreview={setPreview} onDelete={deleteFile} />}
          {active === "Chat" && <ChatPage chat={chat} message={message} setMessage={setMessage} sendMessage={sendMessage}/>}
          {active === "Notes" && <NotesPage notes={notes} addNote={addNote}/>}
          {active === "Tasks" && <TasksPage tasks={tasks} addTask={addTask} setTasks={setTasks}/>}
          {active === "Resources" && <ResourcesPage resources={resources} addResource={addResource}/>}
          {active === "Members" && <MembersPage/>}
          {active === "Activity" && <ActivityPage/>}
          {active === "Settings" && <SettingsPage/>}
        </div>
      </section>

      {showUpload && <Modal title="Upload files" close={() => setShowUpload(false)}><div className="dropzone"><Upload size={30}/><h3>Choose files</h3><p>Files are stored locally in this V1 demo.</p><label className="primary upload-label">Choose files<input type="file" multiple onChange={e => uploadFiles(e.target.files)}/></label></div></Modal>}
      {showNewFolder && <Modal title="New folder" close={() => setShowNewFolder(false)}><input className="modal-input" autoFocus value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Folder name"/><button className="primary full" onClick={addFolder}>Create folder</button></Modal>}
      {preview && <Modal title={preview.name} close={() => setPreview(null)}><div className="preview-box">{preview.type === "image" && preview.localUrl ? <img src={preview.localUrl} alt="" /> : <><FileText size={44}/><h3>{preview.name}</h3><p>{preview.size} · {preview.folder}</p><button className="ghost" onClick={() => notify("Download is available for local uploads") }><Download size={16}/> Download</button></>}</div><button className="danger full" onClick={() => deleteFile(preview.id)}><Trash2 size={16}/> Delete file</button></Modal>}
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </main>
  );
}

function FileCard({ file, onPreview, onDelete }) {
  return <div className="file-card" onClick={onPreview}><div className="file-thumb"><FileIcon type={file.type}/></div><div className="file-info"><b>{file.name}</b><span>{file.size} · {file.updated}</span></div><button className="mini-delete" onClick={e => {e.stopPropagation(); onDelete();}}><Trash2 size={15}/></button></div>
}

function FilesPage({files, folders, view, setView, onUpload, onFolder, onPreview, onDelete}) {
  return <><div className="page-title"><div><div className="eyebrow">WORKSPACE FILES</div><h1>Files</h1><p>Keep project files organized and easy to find.</p></div><div className="actions"><button className="ghost" onClick={onFolder}><FolderPlus size={17}/> New folder</button><button className="primary" onClick={onUpload}><Upload size={17}/> Upload</button></div></div>
    <div className="folder-row">{folders.map(f => <div className="folder-chip" key={f}><Folder size={18}/><b>{f}</b><span>›</span></div>)}</div>
    <div className="toolbar"><span>{files.length} files</span><div className="view-switch"><button className={view==="grid"?"selected":""} onClick={()=>setView("grid")}><Grid2X2 size={17}/></button><button className={view==="list"?"selected":""} onClick={()=>setView("list")}><List size={17}/></button></div></div>
    {view==="grid" ? <div className="file-grid">{files.map(f=><FileCard key={f.id} file={f} onPreview={()=>onPreview(f)} onDelete={()=>onDelete(f.id)}/>)}</div> :
    <div className="list-panel">{files.map(f=><div className="list-file" key={f.id} onClick={()=>onPreview(f)}><FileIcon type={f.type}/><div><b>{f.name}</b><small>{f.folder} · {f.size}</small></div><span>{f.updated}</span><button onClick={e=>{e.stopPropagation();onDelete(f.id)}}><Trash2 size={16}/></button></div>)}</div>}
  </>
}

function ChatPage({chat,message,setMessage,sendMessage}) {
  return <><div className="page-title"><div><div className="eyebrow">TEAM DISCUSSION</div><h1>Chat</h1><p>Talk with your workspace members.</p></div></div><div className="chat-panel"><div className="chat-top"><div className="online-dot"></div><b>Arkspace Team</b><span>4 members</span></div><div className="messages">{chat.map(m=><div className={m.user==="You"?"message mine":"message"} key={m.id}><div className="avatar small">{m.user==="You"?"AT":m.user.slice(0,2).toUpperCase()}</div><div><b>{m.user}</b><p>{m.text}</p><small>{m.time}</small></div></div>)}</div><div className="chat-input"><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Message your team..."/><button className="primary" onClick={sendMessage}>Send</button></div></div></>
}
function NotesPage({notes,addNote}) { return <><PageHead label="SHARED NOTES" title="Notes" text="Write ideas and keep team knowledge together." action={addNote} actionText="New note"/><div className="note-grid">{notes.map(n=><div className="note-card" key={n.id}><div className="note-icon"><StickyNote size={18}/></div><h3>{n.title}</h3><p>{n.body}</p><small>Edited just now</small></div>)}</div></> }
function TasksPage({tasks,addTask,setTasks}) { return <><PageHead label="TEAM TASKS" title="Tasks" text="Plan work and track progress." action={addTask} actionText="Add task"/><div className="kanban">{["Todo","In progress","Done"].map(status=><div className="kanban-col" key={status}><h3>{status}<span>{tasks.filter(t=>t.status===status).length}</span></h3>{tasks.filter(t=>t.status===status).map(t=><div className="task-card" key={t.id}><b>{t.title}</b><small>{t.assignee}</small><select value={t.status} onChange={e=>setTasks(prev=>prev.map(x=>x.id===t.id?{...x,status:e.target.value}:x))}><option>Todo</option><option>In progress</option><option>Done</option></select></div>)}</div>)}</div></> }
function ResourcesPage({resources,addResource}) { return <><PageHead label="TEAM RESOURCES" title="Resources" text="Save useful links for your workspace." action={addResource} actionText="Add resource"/><div className="resource-list">{resources.map(r=><a className="resource" href={r.url} target="_blank" key={r.id}><div className="resource-icon"><Link2 size={19}/></div><div><b>{r.title}</b><small>{r.url}</small></div><ExternalLink size={17}/></a>)}</div></> }
function MembersPage() { return <><PageHead label="WORKSPACE MEMBERS" title="Members" text="Manage who has access to this private space." action={()=>alert("Invite link UI — database comes in V2")} actionText="Invite member"/><div className="members"><Member initials="AT" name="ANKIT" role="Owner"/><Member initials="RA" name="Rahul" role="Editor"/><Member initials="PS" name="Priya" role="Editor"/><Member initials="AM" name="Aman" role="Viewer"/></div></> }
function Member({initials,name,role}) { return <div className="member"><div className="avatar">{initials}</div><div><b>{name}</b><small>{role}</small></div><span className="status-pill">Active</span></div> }
function ActivityPage() { return <><PageHead label="WORKSPACE HISTORY" title="Activity" text="See what your team has been doing."/><div className="activity-panel"><ActivityRow icon={<Upload size={15}/>} text="ANKIT uploaded Arkspace project brief.pdf" time="2 minutes ago"/><ActivityRow icon={<CheckCircle2 size={15}/>} text="Rahul completed Prepare presentation" time="18 minutes ago"/><ActivityRow icon={<StickyNote size={15}/>} text="ANKIT created Project ideas note" time="1 hour ago"/><ActivityRow icon={<Users size={15}/>} text="Priya joined the workspace" time="Yesterday"/></div></> }
function SettingsPage() { return <><PageHead label="WORKSPACE SETTINGS" title="Settings" text="Configure your Arkspace workspace."/><div className="settings-panel"><Setting title="Workspace privacy" text="Only invited members can access this workspace."/><Setting title="Notifications" text="Receive updates about files, tasks and messages."/><Setting title="Appearance" text="Use system theme or switch between light and dark mode."/><Setting title="Data & storage" text="V1 uses browser-local storage. Cloud storage will be connected in V2."/></div></> }
function Setting({title,text}) { return <div className="setting"><div><b>{title}</b><p>{text}</p></div><button className="toggle on"><span></span></button></div> }
function ActivityRow({icon,text,time}) { return <div className="activity-row"><div className="activity-icon">{icon}</div><div><b>{text}</b><small>{time}</small></div></div> }
function TaskRow({task}) { return <div className="task-row"><span className={"task-dot "+task.status.replace(" ","-").toLowerCase()}></span><div><b>{task.title}</b><small>{task.assignee} · {task.status}</small></div></div> }
function PageHead({label,title,text,action,actionText}) { return <div className="page-title"><div><div className="eyebrow">{label}</div><h1>{title}</h1><p>{text}</p></div>{action&&<button className="primary" onClick={action}><Plus size={17}/>{actionText}</button>}</div> }
function Modal({title,close,children}) { return <div className="modal-backdrop" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={close}><X size={18}/></button></div>{children}</div></div> }