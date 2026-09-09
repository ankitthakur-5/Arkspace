import "./globals.css";

export const metadata = {
  title: "Arkspace — Private workspace",
  description: "A private workspace for files, notes, tasks, chat and resources."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}