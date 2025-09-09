// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";

export const metadata: Metadata = {
  title: "معلّم الرياضيات الذكي",
  description: "تدريب ممتع للصف الأول والثاني بالعربية",
};

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "600", "700", "800"], // regular → extra-bold
  variable: "--font-cairo",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          defer
          data-domain="tutor-mvp-blush.vercel.app"
          src="https://plausible.io/js/script.js"
        ></script>
      </head>
      <body
        className={`${cairo.variable} min-h-dvh bg-gradient-to-b from-sky-50 via-white to-emerald-50 text-neutral-900`}
        style={{ fontFamily: "var(--font-cairo), system-ui, Segoe UI, Tahoma" }}
      >
        <main className="mx-auto max-w-3xl p-6 md:p-10">{children}</main>
      </body>
    </html>
  );
}
