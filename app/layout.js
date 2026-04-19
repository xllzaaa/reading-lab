import "./globals.css";

export const metadata = {
  title: "Vibe Coding Todos",
  description: "Minimal Next.js todo app for vibe coding",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
