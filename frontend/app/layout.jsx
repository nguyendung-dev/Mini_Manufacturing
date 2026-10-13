import '../src/index.css';

export const metadata = {
  title: 'HT softtech ERP - Quản Trị Sản Xuất & Kho Xưởng Gỗ Nội Thất',
  description: 'Hệ thống điều hành sản xuất và kho vật tư xưởng mộc, nội thất gỗ tự nhiên & gỗ công nghiệp',
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
