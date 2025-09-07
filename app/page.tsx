// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <section
      dir="rtl"
      className="text-right rounded-[2rem] bg-white/80 ring-1 ring-black/5 shadow-xl p-8 md:p-10"
    >
      <div className="rounded-[2rem] bg-gradient-to-l from-emerald-500 to-sky-500 text-white p-6 md:p-8 shadow mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
          <span>🤖</span> <span>معلّم الرياضيات الذكي</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2 drop-shadow">
          تعلّم الحساب — بطريقة ممتعة!
        </h1>
        <p className="opacity-90 mt-1">
          مخصّص للصّف الأول والثاني — باللغة العربية.
        </p>
        <div className="mt-4">
          <Link
            href="/lesson/addition-20"
            className="inline-block rounded-2xl bg-white text-emerald-700 font-semibold px-5 py-3 shadow hover:bg-emerald-50 active:scale-95"
          >
            ابدأ درس «تكوين العشرة»
          </Link>
        </div>
      </div>

      <ul className="grid gap-3 md:grid-cols-3 text-sm">
        <li className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
          🎧 نطق عربي واضح
        </li>
        <li className="rounded-xl bg-sky-50 p-4 ring-1 ring-sky-100">
          🧠 تدريبات بسيطة ومتدرجة
        </li>
        <li className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
          📊 يحفظ تقدّمك محليًا
        </li>
      </ul>
    </section>
  );
}
