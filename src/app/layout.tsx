import "./globals.css";

export const metadata = {
  title: "Wakaya",
  description: "Wakaya hospitality site and reservations monitor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
