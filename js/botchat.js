/* Wire Py's panel to the offline retriever. No cloud calls. */
import { createRetriever } from "../shared/pybot-chat/engine.js";
import { chatMarkup, paintChat, chatInput, syncSend, flagEmpty } from "../shared/pybot-chat/ui.js";
import { progressInfo, firstUnvisited } from "./shell.js";
import { state as xpState } from "./xp.js";
import { py } from "./pycustom.js";
import { speakAnswer } from "./voice.js";
import { reduced } from "./prefs.js";

const EXAMPLES = ["Where do I start?", "What is a list?", "How do I run code?", "Show downloads"];
const messages = [];
let retriever = null;
let loadFailed = false;
let loading = null;
let bound = false;
let mouthTimer = 0;
let lastAsk = "";
let lastAt = 0;

export function chatHtml() {
  return chatMarkup(EXAMPLES);
}

function rootOf(panel) {
  return panel.querySelector("[data-py-chat]");
}

export function hydrateChat(panel) {
  paintChat(rootOf(panel), messages, false);
}

function loadIndex() {
  if (retriever || loadFailed) return Promise.resolve(retriever);
  if (!loading) {
    const url = new URL("./content/pybot-index.json", import.meta.url);
    loading = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("index");
        return res.json();
      })
      .then((data) => {
        retriever = createRetriever(data);
        return retriever;
      })
      .catch(() => {
        loadFailed = true;
        retriever = null;
        return null;
      });
  }
  return loading;
}

function progress() {
  const info = progressInfo();
  const next = firstUnvisited();
  const xp = xpState();
  return {
    done: info.done,
    total: info.total,
    xpLevel: Number.isFinite(xp.level) ? xp.level : 1,
    nextHref: next ? next.href : "",
    nextTitle: next ? next.title : "",
  };
}

function push(msg) {
  messages.push(msg);
  if (messages.length > 40) messages.splice(0, messages.length - 40);
  const panel = document.getElementById("bot-panel");
  if (panel) {
    paintChat(rootOf(panel), messages, false);
    const quick = panel.querySelector(".py-quick");
    if (quick) quick.open = messages.length === 0;
  }
}

function botMessage(result) {
  const title = result.hits && result.hits[0] && result.hits[0].title;
  return {
    role: "bot",
    text: result.text,
    href: result.href,
    link: result.link,
    example: result.example,
    act: result.act,
    closest: result.closest,
    follow: result.follow,
    followQ: result.followQ,
    chips: result.chips || [],
    from: title || "this lab",
  };
}

function pulse(text, aloud) {
  const bot = document.getElementById("lab-bot");
  if (bot) bot.classList.remove("is-parked");
  if (aloud || py().voice) {
    speakAnswer(text);
    return;
  }
  document.dispatchEvent(new CustomEvent("lab:speech", { detail: { state: "start", text: String(text || "").slice(0, 80) } }));
  window.clearTimeout(mouthTimer);
  mouthTimer = window.setTimeout(() => {
    document.dispatchEvent(new CustomEvent("lab:speech", { detail: { state: "end", text: "" } }));
  }, reduced() ? 700 : 1200);
}

function reveal(text) {
  pulse(text, false);
}

async function answer(raw) {
  const question = String(raw || "").trim();
  const panel = document.getElementById("bot-panel");
  if (!question) {
    flagEmpty(rootOf(panel));
    return;
  }
  const now = Date.now();
  if (question === lastAsk && now - lastAt < 350) return;
  lastAsk = question;
  lastAt = now;
  push({ role: "user", text: question });
  const input = chatInput(panel);
  if (input) input.value = "";
  syncSend(rootOf(panel));
  const engine = await loadIndex();
  if (!engine) {
    const text = "The lesson index did not load. I will not invent an answer. Use Search.";
    push({ role: "bot", text, act: "search", from: "this lab" });
    reveal(text);
    return;
  }
  const result = engine.ask(question, { progress });
  push(botMessage(result));
  reveal(result.text);
}

function scrollAct(kind) {
  const sel = kind === "video" ? "#clips" : "#audio-lessons";
  window.setTimeout(() => {
    document.querySelector(sel)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
  }, 350);
}

function listen(panel) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input = chatInput(panel);
  if (!Rec) {
    push({ role: "bot", text: "This browser has no speech recognition. Type the question instead.", from: "this lab" });
    input?.focus();
    return;
  }
  const rec = new Rec();
  rec.lang = "en-US";
  rec.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript || "";
    if (input) input.value = text;
    answer(text);
  };
  rec.onerror = () => {
    push({ role: "bot", text: "I could not hear that. Type the question instead.", from: "this lab" });
    input?.focus();
  };
  try {
    rec.start();
    push({ role: "bot", text: "Listening. Ask about a lesson in this lab.", from: "this lab" });
  } catch (err) {
    push({ role: "bot", text: "The mic did not start. Type the question instead.", from: "this lab" });
    input?.focus();
  }
}

function clearChat(panel) {
  messages.splice(0, messages.length);
  retriever?.reset();
  messages.push({
    role: "bot",
    text: "Chat cleared. Ask me about a lesson in this lab.",
    from: "this lab",
    follow: "Where do I start?",
    followQ: "Where do I start?",
  });
  paintChat(rootOf(panel), messages, false);
  chatInput(panel)?.focus();
}

export function initBotChat(panel) {
  if (!messages.length) {
    messages.push({
      role: "bot",
      text: "Ask me about a lesson, a game, or where to start.",
      from: "this lab",
      follow: "Where do I start?",
      followQ: "Where do I start?",
    });
  }
  loadIndex();
  if (bound) return;
  bound = true;
  panel.addEventListener("submit", (event) => {
    const form = event.target.closest(".py-chat-form");
    if (!form) return;
    event.preventDefault();
    const input = chatInput(panel);
    answer(input ? input.value : "");
  });
  panel.addEventListener("click", (event) => {
    const ask = event.target.closest("[data-py-ask]");
    if (ask) {
      event.preventDefault();
      answer(ask.dataset.pyAsk || ask.textContent);
      return;
    }
    const copy = event.target.closest("[data-py-copy]");
    if (copy) {
      event.preventDefault();
      const msg = messages[Number(copy.dataset.pyCopy)];
      const text = msg && msg.example ? msg.example : "";
      if (text && navigator.clipboard) navigator.clipboard.writeText(text).then(() => { copy.textContent = "Copied"; });
      return;
    }
    const read = event.target.closest("[data-py-read]");
    if (read) {
      event.preventDefault();
      const msg = messages[Number(read.dataset.pyRead)];
      if (!msg) return;
      const spoken = msg.example ? `${msg.text} ${msg.example}` : msg.text;
      pulse(spoken, true);
      return;
    }
    if (event.target.closest("[data-py-clear]")) {
      event.preventDefault();
      clearChat(panel);
      return;
    }
    if (event.target.closest("[data-py-mic]")) {
      event.preventDefault();
      listen(panel);
      return;
    }
    const act = event.target.closest("[data-py-act]");
    if (act && (act.dataset.pyAct === "audio" || act.dataset.pyAct === "video")) scrollAct(act.dataset.pyAct);
  });
  panel.addEventListener("input", (event) => {
    if (event.target && event.target.id === "py-chat-input") syncSend(rootOf(panel));
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    const input = chatInput(panel);
    if (!input || event.target !== input) return;
    event.preventDefault();
    answer(input.value);
  });
}
