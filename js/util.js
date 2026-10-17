export function codeBlock(source) {
  return `<pre><code>${esc(source)}</code></pre>`;
}

export function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

export function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    /* Private mode can refuse storage. The page still works. */
  }
}

export const THEME_KEY = "pythonlab.theme";
export const PROGRESS_KEY = "pythonlab.progress.v1";

export function progress() {
  return readStore(PROGRESS_KEY, { lessons: {}, quizzes: {} });
}

export function markLesson(id, state) {
  const data = progress();
  data.lessons[id] = state;
  writeStore(PROGRESS_KEY, data);
}

export function markQuiz(id, score, total) {
  const data = progress();
  data.quizzes[id] = { score, total };
  writeStore(PROGRESS_KEY, data);
}
