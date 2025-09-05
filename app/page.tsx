import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">معلّم الرياضيات الذكي (نسخة مبسّطة)</h1>
      <p className="text-sm text-neutral-600">ابدأ تدريب "تكوين العشرة" للصف الثاني.</p>
      <Link
        href="/lesson/addition-20"
        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white shadow"
      >
        ابدأ الدرس الآن →
      </Link>
    </section>
  );
}
