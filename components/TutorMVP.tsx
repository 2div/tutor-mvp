"use client";
import React, { useMemo, useState, useEffect } from "react";
import type { Progress } from "../lib/progress";
import {
  loadProgress,
  saveAttempt,
  loadVoice,
  saveVoice,
} from "../lib/progress";

/**
 * Tutor MVP — Lesson Runner (Arabic, Grade 1–2 Math)
 * - Modes: "intro" → "explain" → "practice" → "summary"
 * - Voice picker (Arabic TTS via Web Speech API) + remembers choice
 * - Local progress: attempts/correct saved per objective in localStorage
 * - Kid-friendly UI + Arabic math speech normalization
 */

type Choice = { text_ar: string; correct: boolean };
type PracticeItem = { stem_ar: string; choices: Choice[]; explain_ar: string };

const SEED: {
  meta: {
    grade: number;
    subject: string;
    unit: string;
    lesson: number;
    objective_code: string;
  };
  concept: { text_ar: string; examples: string[]; check_question: string };
  practice: PracticeItem[];
} = {
  meta: {
    grade: 2,
    subject: "math",
    unit: "addition-within-20",
    lesson: 3,
    objective_code: "G2.MATH.ADD.20",
  },
  concept: {
    text_ar:
      "لتسهيل 9 + 7 نكَوِّن عشرة أولًا: 9 + 1 = 10، يتبقى 6، إذًا 10 + 6 = 16. جرّب نفس الفكرة مع 8 + 6!",
    examples: [
      "8 + 6 = 14 (8 + 2 = 10 ثم +4)",
      "7 + 5 = 12 (7 + 3 = 10 ثم +2)",
    ],
    check_question: "احسب بسرعة: 9 + 7 = ؟",
  },
  practice: [
    {
      stem_ar: "اختر الناتج الصحيح: 9 + 7 = ؟",
      choices: [
        { text_ar: "15", correct: false },
        { text_ar: "16", correct: true },
        { text_ar: "18", correct: false },
      ],
      explain_ar: "نكوّن 10 من 9 بإضافة 1، يتبقى 6 → 10 + 6 = 16.",
    },
    {
      stem_ar: "8 + 6 = ؟ باستخدام تكوين العشرة",
      choices: [
        { text_ar: "13", correct: false },
        { text_ar: "14", correct: true },
        { text_ar: "15", correct: false },
      ],
      explain_ar: "8 + 2 = 10 ثم نضيف 4 → 14.",
    },
  ],
};

/* ------------------------------ TTS Hook ------------------------------ */
function useArabicTTS() {
  // --- Normalize math speech (operators -> Arabic words)
  const normalizeArabicMathSpeech = (text: string) => {
    let t = String(text);
    const pairs: Array<[string, string]> = [
      ["→", " ثم "],
      ["⇒", " ثم "],
      ["->", " ثم "],
      ["=>", " ثم "],
      ["×", " ضرب "],
      ["x", " ضرب "],
      ["X", " ضرب "],
      ["*", " ضرب "],
      ["+", " زائد "],
      ["-", " ناقص "],
      ["−", " ناقص "],
      ["/", " على "],
      ["÷", " على "],
      ["=", " يساوي "],
      ["%", " بالمائة "],
    ];
    for (const [a, b] of pairs) t = t.split(a).join(b);
    t = t.split(" يساوي ").join("، يساوي، ");
    while (t.includes("  ")) t = t.replace("  ", " ");
    return t.trim();
  };

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Poll voices until available (Android often delays voice list)
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    let tries = 0;
    const maxTries = 30; // ~3s
    const tick = () => {
      const all = synth.getVoices();
      if (all && all.length > 0) {
        setVoices(all);
        setReady(true);
        // remember voice from previous session
        const remembered = loadVoice();
        const ar = all.find((v) => v.lang?.toLowerCase().startsWith("ar"));
        if (remembered && all.some((v) => v.name === remembered)) {
          setSelectedVoice(remembered);
        } else if (ar) {
          setSelectedVoice(ar.name);
        } else {
          // fall back to any voice to avoid silent failure
          setSelectedVoice(all[0].name);
        }
      } else if (tries++ < maxTries) {
        setTimeout(tick, 100);
      } else {
        setVoices([]);
        setReady(true); // give up but mark ready
      }
    };
    tick();

    // also update if browser fires onvoiceschanged
    const handler = () => tick();
    synth.onvoiceschanged = handler;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  // Persist choice
  useEffect(() => {
    if (selectedVoice) saveVoice(selectedVoice);
  }, [selectedVoice]);

  // Resume on user interaction / tab visibility (mobile quirk)
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const resume = () => {
      try {
        synth.resume();
      } catch {}
    };
    const onVis = () => {
      if (document.visibilityState === "visible") resume();
    };

    document.addEventListener("click", resume, { once: false });
    document.addEventListener("touchstart", resume, { once: false });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("click", resume);
      document.removeEventListener("touchstart", resume);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const speak = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const u = new SpeechSynthesisUtterance(normalizeArabicMathSpeech(text));
      u.rate = 0.95;
      u.pitch = 1.05;
      u.volume = 1.0;

      const list = synth.getVoices();
      const byName = list.find((v) => v.name === selectedVoice || "");
      const ar = list.find((v) => v.lang?.toLowerCase().startsWith("ar"));
      u.voice = byName || ar || list[0];
      u.lang = u.voice?.lang || "ar-SA";

      synth.cancel(); // ensure fresh start
      synth.speak(u);
    } catch {}
  };

  const arabicVoices = useMemo(
    () => voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("ar")),
    [voices],
  );

  return {
    speak,
    voices: arabicVoices,
    selectedVoice,
    setSelectedVoice,
    ready,
  };
}

/* ------------------------------ UI ------------------------------ */
export default function TutorMVP() {
  const [mode, setMode] = useState<
    "intro" | "explain" | "practice" | "summary"
  >("intro");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // progress per objective (localStorage)
  const OBJ = SEED.meta.objective_code;
  const [stored, setStored] = useState<Progress>(() => loadProgress(OBJ));

  const { speak, voices, selectedVoice, setSelectedVoice } = useArabicTTS();

  useEffect(() => {
    if (mode === "explain") {
      speak(`اليوم سنتعلم إستراتيجية تكوين العشرة. ${SEED.concept.text_ar}`);
    }
  }, [mode, speak]); // include speak to satisfy exhaustive-deps

  const currentQ = SEED.practice[qIndex];

  const next = () => {
    // log attempt if user selected something
    if (selected != null) {
      const wasCorrect = !!currentQ.choices[selected]?.correct;
      const updated = saveAttempt(OBJ, wasCorrect);
      setStored(updated);
      if (wasCorrect) setScore((s) => s + 1);
    }

    if (qIndex < SEED.practice.length - 1) {
      setQIndex((i) => i + 1);
      setSelected(null);
    } else {
      setMode("summary");
    }
  };

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-3xl p-8 md:p-10 text-right rounded-[2rem] border-2 border-emerald-100 shadow-2xl
                 bg-gradient-to-b from-sky-50 via-white to-emerald-50"
    >
      {/* Header with voice picker */}
      <header className="mb-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-emerald-500 to-sky-500 p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
                <span>🤖</span>
                <span>معلّم الرياضيات الذكي</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold drop-shadow">
                تكوين العشرة — تدريب ممتع!
              </h1>
              <p className="text-sm/6 opacity-90">
                الصف {SEED.meta.grade} • {SEED.meta.subject} • {SEED.meta.unit}{" "}
                • الدرس {SEED.meta.lesson}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs opacity-90">الصوت:</label>
              <select
                dir="ltr"
                className="rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-sm text-white placeholder-white/80 backdrop-blur"
                value={selectedVoice || ""}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {voices.length === 0 && (
                  <option className="text-black">System default</option>
                )}
                {voices.map((v) => (
                  <option key={v.name} value={v.name} className="text-black">
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <button
                onClick={() => speak("مرحباً! هذا اختبار للصوت العربي.")}
                className="rounded-full bg-white/20 px-4 py-1.5 text-sm shadow hover:bg-white/30 active:scale-95 transition"
              >
                جرّب
              </button>
            </div>
          </div>
        </div>
      </header>

      {mode === "intro" && (
        <section className="rounded-[2rem] ring-1 ring-black/5 bg-white shadow-xl p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold">أهلاً بك 👋</h2>
          <p className="text-lg leading-8">
            سنتدرّب اليوم على الجمع حتى 20 باستخدام طريقة{" "}
            <span className="font-semibold">«تكوين العشرة»</span>.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setMode("explain")}
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              ابدأ الشرح
            </button>
          </div>
        </section>
      )}

      {mode === "explain" && (
        <section className="space-y-4 rounded-[2rem] ring-1 ring-black/5 bg-white shadow-xl p-6 md:p-8">
          <h2 className="text-xl font-semibold">الشرح</h2>
          <p className="text-lg leading-8">{SEED.concept.text_ar}</p>
          <ul className="list-disc pr-5 space-y-1 text-sm">
            {SEED.concept.examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
          <div className="mt-2 rounded-xl bg-amber-50 p-4 text-sm">
            <p className="font-medium">سؤال سريع للتأكد:</p>
            <p>{SEED.concept.check_question}</p>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => setMode("practice")}
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              ابدأ التدريب
            </button>
            <button
              onClick={() => speak(SEED.concept.text_ar)}
              className="px-5 py-3 rounded-2xl bg-white border border-emerald-200 shadow hover:bg-emerald-50 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              🔊 استمع للشرح
            </button>
          </div>
        </section>
      )}

      {mode === "practice" && (
        <section className="rounded-[2rem] ring-1 ring-black/5 bg-white shadow-xl p-6 md:p-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">تدريب</h2>
            <span className="text-sm text-gray-600">
              سؤال {qIndex + 1} من {SEED.practice.length}
            </span>
          </div>

          {/* Progress dots */}
          <div
            className="mb-4 flex items-center justify-center gap-2"
            aria-hidden
          >
            {SEED.practice.map((_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full ${i === qIndex ? "bg-emerald-600" : "bg-neutral-300"}`}
              />
            ))}
          </div>

          <p className="mb-4 text-lg leading-8">{currentQ.stem_ar}</p>

          <div className="space-y-2">
            {currentQ.choices.map((c, idx) => {
              const isSelected = selected === idx;
              const correct = c.correct;
              const show = selected != null;
              const color = show
                ? correct
                  ? "bg-emerald-50 border-emerald-500"
                  : isSelected
                    ? "bg-rose-50 border-rose-500"
                    : "bg-white border-neutral-200"
                : isSelected
                  ? "bg-emerald-50 border-emerald-600"
                  : "bg-white border-neutral-200";

              return (
                <button
                  key={idx}
                  onClick={() => setSelected(idx)}
                  className={`w-full rounded-2xl border px-5 py-4 text-right text-xl transition hover:shadow-lg active:scale-[0.99] ${color}`}
                  disabled={selected != null}
                >
                  <span className="text-lg">{c.text_ar}</span>
                </button>
              );
            })}
          </div>

          {selected != null && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">
              <p className="font-medium">التفسير:</p>
              <p>{currentQ.explain_ar}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">النتيجة: {score} ✅</span>
            <button
              onClick={next}
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              disabled={selected == null}
            >
              التالي
            </button>
          </div>
        </section>
      )}

      {mode === "summary" && (
        <section className="rounded-[2rem] ring-1 ring-black/5 bg-white shadow-xl p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold">أحسنت! 🎉</h2>
          <p className="mb-2">أنهيت تدريب «تكوين العشرة».</p>
          <p className="mb-1">
            نتيجتك الآن: {score} من {SEED.practice.length}
          </p>
          <p className="text-sm text-gray-600">
            إجمالي المحاولات (على هذا الجهاز): {stored.attempts} — الصحيحة:{" "}
            {stored.correct}
            {stored.attempts > 0 && (
              <>
                {" "}
                — الدقة: {Math.round((stored.correct / stored.attempts) * 100)}%
              </>
            )}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setMode("practice");
                setQIndex(0);
                setScore(0);
                setSelected(null);
              }}
              className="px-5 py-3 rounded-2xl bg-white border border-emerald-200 shadow hover:bg-emerald-50 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              أعد التدريب
            </button>
            <button
              onClick={() => {
                setMode("intro");
                setQIndex(0);
                setScore(0);
                setSelected(null);
              }}
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              الرجوع للرئيسية
            </button>
          </div>
        </section>
      )}

      <footer className="mt-8 text-xs text-gray-500">
        <p>إصدار تجريبي — لاحقًا سنربطه بقاعدة معرفة (RAG) وتتبّع تقدّم.</p>
      </footer>
    </div>
  );
}
