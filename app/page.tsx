import Link from "next/link";

export default function Home() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl p-8 text-right">
      <h1 className="text-2xl font-bold">معلّم الرياضيات الذكي</h1>
      <p className="mt-2">ابدأ تدريب «تكوين العشرة» للصف الثاني.</p>
      <Link
        href="/lesson/addition-20"
        className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-white"
      >
        ابدأ الدرس
      </Link>
    </main>
  );
}
