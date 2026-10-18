let active = null;
let token = 0;

function speechEvent(state, text) {
  document.dispatchEvent(new CustomEvent("lab:speech", { detail: { state, text: text || "" } }));
}

export function stopSpeech() {
  token += 1;
  active = null;
  document.querySelectorAll(".is-reading").forEach((node) => node.classList.remove("is-reading"));
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      /* Some browsers throw if speech was never started. */
    }
  }
  const button = document.querySelector("[data-speech]");
  if (button) button.textContent = "Read aloud";
  speechEvent("end", "");
}

function speakChunk(text, myToken) {
  return new Promise((resolve) => {
    if (myToken !== token) {
      resolve(false);
      return;
    }
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      resolve(false);
      return;
    }
    let utterance;
    try {
      utterance = new SpeechSynthesisUtterance(text);
    } catch (err) {
      resolve(false);
      return;
    }
    utterance.rate = 1;
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      resolve(false);
    }
  });
}

export async function readAloud(button) {
  if (active) {
    stopSpeech();
    return;
  }
  const blocks = [...document.querySelectorAll("[data-speak]")];
  const textBlocks = blocks.length
    ? blocks.map((node) => ({ node, text: node.innerText.trim() })).filter((item) => item.text)
    : [{ node: null, text: document.querySelector("h1")?.innerText || "" }];
  if (!textBlocks.length || !("speechSynthesis" in window)) {
    const note = document.querySelector("[data-speech-note]");
    if (note) note.textContent = "This browser does not provide speech synthesis.";
    return;
  }
  const myToken = token + 1;
  token = myToken;
  active = myToken;
  button.textContent = "Stop reading";
  speechEvent("start", textBlocks[0]?.text || "");
  for (const block of textBlocks) {
    if (myToken !== token) return;
    block.node?.classList.add("is-reading");
    const ok = await speakChunk(block.text, myToken);
    block.node?.classList.remove("is-reading");
    if (!ok && myToken === token) {
      const note = document.querySelector("[data-speech-note]");
      if (note) note.textContent = "Speech stopped before the end of the page. You can keep reading on screen.";
      break;
    }
  }
  if (myToken === token) stopSpeech();
}

export function bindSpeech(button) {
  button?.addEventListener("click", () => {
    readAloud(button);
  });
}
