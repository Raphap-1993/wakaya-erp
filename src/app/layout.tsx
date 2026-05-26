export const metadata = {
  title: 'Wakaya ERP',
  description: 'Scaffolding neutral del proyecto sobre Node + Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
