/* Voice picker. File voices are Piper waveforms. "This device" uses speechSynthesis. */
import { readStore, writeStore } from "./util.js";

const KEY = "pythonlab.voice.v1";
const playing = new Set();
let synthOn = false;
let caption = "";
let catalog = null;

const FALLBACK = {
  engine: "piper",
  voices: [
    {
      id: "ljspeech",
      kind: "file",
      label: "Linda · United States",
      detail: "Piper en_US-ljspeech-medium, trained from scratch on the public-domain LJ Speech dataset",
      licence: "LJ Speech is public domain in the US. Keith Ito: “There are no restrictions on its use.” Recordings by Linda Johnson for LibriVox. Piper engine is MIT. Weights are not shipped.",
      preview: "media/voice-preview-ljspeech.mp3",
      files: {
        syntax: "media/audio-syntax.mp3",
        structures: "media/audio-structures.mp3",
        async: "media/audio-async.mp3",
        interview: "media/audio-interview.mp3",
      },
    },
    {
      id: "norman",
      kind: "file",
      label: "Norman · United States",
      detail: "Piper en_US-norman-medium, trained from scratch on public-domain LibriVox recordings",
      licence: "LibriVox recordings are public domain in the US. LibriVox: “anyone can use all our recordings however they wish (even to sell them).” Piper engine is MIT. Weights are not shipped.",
      preview: "media/voice-preview-norman.mp3",
      files: {
        syntax: "media/audio-syntax-norman.mp3",
        structures: "media/audio-structures-norman.mp3",
        async: "media/audio-async-norman.mp3",
        interview: "media/audio-interview-norman.mp3",
      },
    },
    {
      id: "cori",
      kind: "file",
      label: "Cori · Britain",
      detail: "Piper en_GB-cori-medium, trained from scratch on public-domain LibriVox recordings",
      licence: "LibriVox recordings are public domain in the US. LibriVox: “anyone can use all our recordings however they wish (even to sell them).” Piper engine is MIT. Weights are not shipped.",
      preview: "media/voice-preview-cori.mp3",
      files: {
        syntax: "media/audio-syntax-cori.mp3",
        structures: "media/audio-structures-cori.mp3",
        async: "media/audio-async-cori.mp3",
        interview: "media/audio-interview-cori.mp3",
      },
    },
    {
      id: "device",
      kind: "synth",
      label: "This device",
      detail: "The browser speechSynthesis voice. Quality depends on the operating system.",
      licence: "No audio file is shipped. Speech comes from the visitor's device.",
      preview: "",
      files: {},
    },
  ],
};

function savedId() {
  const stored = readStore(KEY, null);
  return stored && typeof stored.id === "string" ? stored.id : "ljspeech";
}

function current(voices) {
  return voices.find((voice) => voice.id === savedId()) || voices[0];
}

function syncSpeaking() {
  const node = document.getElementById("lab-bot");
  if (!node) return;
  const on = playing.size > 0 || synthOn;
  node.classList.toggle("is-speaking", on);
  node.dataset.state = on ? "speaking" : "idle";
  let cap = node.querySelector(".bot-caption");
  if (!cap) {
    cap = document.createElement("p");
    cap.className = "bot-caption";
    cap.setAttribute("role", "status");
    node.appendChild(cap);
  }
  cap.textContent = on ? caption : "";
}

function remember(id) {
  writeStore(KEY, { id });
}

function applyFiles(voice) {
  document.querySelectorAll("audio[data-voice-slot]").forEach((audio) => {
    const slot = audio.dataset.voiceSlot;
    const next = voice.files?.[slot];
    if (!next || audio.getAttribute("src") === next) return;
    const was = !audio.paused;
    audio.src = next;
    if (was) audio.play().catch(() => {});
  });
}

function creditsHtml(voices) {
  const recorded = voices.filter((voice) => voice.kind === "file");
  const items = recorded.map((voice) => `<li><strong>${voice.label}</strong> — ${voice.detail}. ${voice.licence}</li>`).join("");
  return `<section class="voice-credits" id="voice-credits">
    <h3>Voice credits</h3>
    <p>The recorded clips are waveforms made with Piper. The Piper engine is MIT, copyright 2022 Michael Hansen. The voice weights are not stored in this site.</p>
    <ul>${items}</ul>
    <p>Linda’s clips use the LJ Speech dataset (public domain; recordings by Linda Johnson for LibriVox, alignment by Keith Ito). Norman and Cori were trained from scratch on LibriVox recordings (public domain in the US). LibriVox does not require a credit and prefers one. This device uses the browser speech engine and ships no file. Dataset pages and the copied licence sentences are on <a href="#/sources">Sources</a> and in <a href="licenses/piper-voices.txt">licenses/piper-voices.txt</a>.</p>
  </section>`;
}

function pickerHtml(voices, selected) {
  const options = voices.map((voice) => `<label><input type="radio" name="lab-voice" value="${voice.id}" ${voice.id === selected.id ? "checked" : ""}> ${voice.label}</label>`).join("");
  return `<fieldset class="voice-picker">
    <legend>Voice</legend>
    <div class="voice-options">${options}</div>
    <button type="button" class="text-btn" data-voice-preview>Play this voice</button>
    <p class="voice-licence">${selected.detail}. ${selected.licence}</p>
  </fieldset>`;
}

function mountPickers() {
  if (!catalog) return;
  const voices = catalog.voices;
  const selected = current(voices);
  document.querySelectorAll(".audio-section").forEach((section) => {
    const picker = pickerHtml(voices, selected);
    const box = section.querySelector(".voice-picker");
    if (!box) section.insertAdjacentHTML("afterbegin", picker);
    else box.outerHTML = picker;
    const credits = creditsHtml(voices);
    const existing = section.querySelector(".voice-credits");
    if (!existing) section.querySelector(".voice-picker").insertAdjacentHTML("afterend", credits);
    else existing.outerHTML = credits;
  });
  if (selected.kind === "file") applyFiles(selected);
}

function previewEl() {
  let audio = document.getElementById("lab-voice-preview");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "lab-voice-preview";
    audio.hidden = true;
    audio.preload = "auto";
    document.body.appendChild(audio);
  }
  return audio;
}

function speakDevice(text) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    caption = "This browser has no speech synthesis. Pick a recorded voice.";
    synthOn = false;
    syncSpeaking();
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  const voices = window.speechSynthesis.getVoices?.() || [];
  const match = voices.find((voice) => /en(-|_)?(US|GB|AU)/i.test(voice.lang));
  if (match) utter.voice = match;
  synthOn = true;
  caption = text.slice(0, 80);
  syncSpeaking();
  const done = () => {
    synthOn = false;
    syncSpeaking();
  };
  utter.onend = done;
  utter.onerror = done;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
  window.setTimeout(() => {
    if (synthOn && !window.speechSynthesis.speaking) done();
  }, Math.min(8000, 600 + text.length * 70));
}

function playPreview() {
  const voice = current(catalog.voices);
  switch (voice.kind) {
    case "file": {
      const audio = previewEl();
      audio.src = voice.preview;
      caption = voice.label;
      audio.play().catch(() => {
        caption = "The preview did not start. Try again, or use This device.";
        syncSpeaking();
      });
      break;
    }
    case "synth":
      speakDevice("Cypher Monkey, Python Lab. This is the voice on this device.");
      break;
    default: {
      const unknown = voice.kind;
      caption = unknown ? `Unknown voice kind ${unknown}` : "";
      syncSpeaking();
    }
  }
}

function onPlay(event) {
  const el = event.target;
  if (!(el instanceof HTMLMediaElement)) return;
  if (el.id === "lab-voice-preview") caption = current(catalog?.voices || FALLBACK.voices).label;
  else caption = el.closest("article, figure")?.querySelector("h3, figcaption")?.textContent?.trim().slice(0, 80) || "Playing";
  playing.add(el);
  syncSpeaking();
}

function onStop(event) {
  const el = event.target;
  if (!(el instanceof HTMLMediaElement)) return;
  if (!el.paused && !el.ended) return;
  playing.delete(el);
  syncSpeaking();
}

export function speakAnswer(text) {
  const voices = (catalog || FALLBACK).voices;
  const selected = current(voices);
  speakDevice(String(text || "").slice(0, 500));
  return { kind: selected.kind };
}

export function initVoice() {
  catalog = FALLBACK;
  mountPickers();
  fetch("media/voices.json").then((res) => (res.ok ? res.json() : null)).then((data) => {
    if (data?.voices?.length >= 3) {
      catalog = data;
      mountPickers();
    }
  }).catch(() => {});

  document.addEventListener("play", onPlay, true);
  document.addEventListener("pause", onStop, true);
  document.addEventListener("ended", onStop, true);
  document.addEventListener("lab:speech", (event) => {
    if (event.detail?.state === "start") {
      synthOn = true;
      caption = String(event.detail.text || "Reading aloud").slice(0, 80);
    } else {
      synthOn = false;
    }
    syncSpeaking();
  });
  document.addEventListener("lab:world", mountPickers);
  document.addEventListener("change", (event) => {
    const input = event.target.closest(".voice-picker input[name='lab-voice']");
    if (!input || !catalog) return;
    remember(input.value);
    mountPickers();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-voice-preview]")) return;
    playPreview();
  });
}
