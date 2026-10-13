import '../src/index.css';

export const metadata = {
  title: 'QL Xưởng Gỗ',
  description: 'Hệ thống Quản trị Sản xuất & Kho Xưởng Gỗ',
  icons: {
    icon: 'data:,',
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-slate-100 text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
