export const metadata = {
  title: "Tutor MVP (Arabic)",
  description: "Grade 1–2 Arabic math tutor — minimal MVP",
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-dvh bg-neutral-50 text-neutral-900">
        <main className="mx-auto max-w-3xl p-6">{children}</main>
      </body>
    </html>
  );
}
