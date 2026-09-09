import "./globals.css";

export const metadata = {
  title: "Arkspace V2",
  description: "Private collaborative workspace for friends and teams"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}