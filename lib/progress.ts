// /lib/progress.ts
export type Progress = {
  attempts: number;
  correct: number;
  lastSeen: string; // ISO timestamp
};

const PROGRESS_KEY = "tutor.progress.v1";
const VOICE_KEY = "tutor.voice.v1";

function readAll(): Record<string, Progress> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch { return {}; }
}
function writeAll(map: Record<string, Progress>) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
}

export function loadProgress(objectiveCode: string): Progress {
  const all = readAll();
  return all[objectiveCode] || { attempts: 0, correct: 0, lastSeen: new Date().toISOString() };
}

export function saveAttempt(objectiveCode: string, correct: boolean) {
  const all = readAll();
  const p = all[objectiveCode] || { attempts: 0, correct: 0, lastSeen: new Date().toISOString() };
  p.attempts += 1;
  if (correct) p.correct += 1;
  p.lastSeen = new Date().toISOString();
  all[objectiveCode] = p;
  writeAll(all);
  return p;
}

export function resetProgress(objectiveCode: string) {
  const all = readAll();
  all[objectiveCode] = { attempts: 0, correct: 0, lastSeen: new Date().toISOString() };
  writeAll(all);
}

export function saveVoice(name: string) {
  localStorage.setItem(VOICE_KEY, name);
}
export function loadVoice(): string | null {
  return localStorage.getItem(VOICE_KEY);
}
