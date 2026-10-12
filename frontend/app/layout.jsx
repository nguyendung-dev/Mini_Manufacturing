import '../src/index.css';

export const metadata = {
  title: 'VinaTech ERP - Quản Trị Sản Xuất & Kho Xưởng',
  description: 'Hệ thống điều hành sản xuất và kho vật tư cơ khí chế tạo',
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
