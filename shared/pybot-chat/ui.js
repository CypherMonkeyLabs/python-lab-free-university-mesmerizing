/* Chat log for a lab bot panel. The host owns the answers.
   This file only paints messages and reports what the visitor typed. */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const AVATAR = `<svg class="py-avatar" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
  <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="1.8"/>
  <circle cx="12" cy="14" r="1.6" fill="currentColor"/>
  <circle cx="20" cy="14" r="1.6" fill="currentColor"/>
  <path d="M11 20c1.4 1.6 8.6 1.6 10 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

export function chatMarkup(examples) {
  const chips = (examples || []).slice(0, 4).map((item) => (
    `<button type="button" class="py-chip" data-py-ask="${escapeAttr(item)}">${escapeText(item)}</button>`
  )).join("");
  return `<div class="py-chat" data-py-chat>
    <p class="py-chat-beta"><span class="py-beta-badge">Beta</span> Beta: scripted offline helper, may miss questions</p>
    <div class="py-chat-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Chat with Py"></div>
    <p class="py-chat-try">Try asking</p>
    <div class="py-chat-examples" role="group" aria-label="Suggested questions">${chips}</div>
    <div class="py-chat-chips" role="group" aria-label="Suggested questions"></div>
    <p class="py-chat-hint" id="py-chat-hint">Ask about a lesson, a game, or where to start.</p>
    <p class="py-chat-status" id="py-chat-status" role="status"></p>
    <form class="py-chat-form">
      <label class="visually-hidden" for="py-chat-input">Ask Py about this lab</label>
      <button type="button" class="py-mic" data-py-mic aria-label="Voice input">${micIcon()}</button>
      <input id="py-chat-input" type="text" name="q" autocomplete="off" enterkeyhint="send" maxlength="400" placeholder="Ask about a lesson" spellcheck="true" aria-describedby="py-chat-hint">
      <button type="submit" class="py-send" aria-label="Send" disabled>${sendIcon()}</button>
    </form>
    <button type="button" class="bp-link" data-py-clear>Clear chat</button>
  </div>`;
}

function micIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>`;
}

function sendIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14M13 6l6 6-6 6"/></svg>`;
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

function escapeAttr(value) {
  return escapeText(value).replace(/`/g, "&#96;");
}

function linkLabel(href) {
  return String(href || "").includes("/lesson/") ? "Open lesson →" : "Open page →";
}

export function paintChat(root, messages, busy) {
  if (!root) return;
  const log = root.querySelector(".py-chat-log");
  const chips = root.querySelector(".py-chat-chips");
  if (!log || !chips) return;
  log.replaceChildren();
  messages.forEach((msg, index) => {
    const item = el("article", `py-msg py-msg-${msg.role}`);
    if (msg.role === "bot") {
      const head = el("div", "py-msg-head");
      head.innerHTML = AVATAR;
      const body = el("div", "py-msg-body");
      body.appendChild(el("p", "py-msg-text", msg.text));
      if (msg.example) {
        const wrap = el("div", "py-code");
        const pre = el("pre", "py-msg-code");
        pre.appendChild(el("code", "", msg.example));
        const copy = el("button", "py-copy", "Copy");
        copy.type = "button";
        copy.dataset.pyCopy = String(index);
        wrap.append(pre, copy);
        body.appendChild(wrap);
      }
      const actions = el("div", "py-actions");
      if (msg.href) {
        const link = el("a", "py-msg-link py-act py-act-primary", linkLabel(msg.href));
        link.href = msg.href;
        if (msg.act) link.dataset.pyAct = msg.act;
        actions.appendChild(link);
      }
      if (msg.closest) {
        msg.closest.forEach((hit) => {
          const link = el("a", "py-msg-link py-msg-near", hit.title);
          link.href = hit.href;
          actions.appendChild(link);
        });
      }
      if (msg.text) {
        const read = el("button", "py-act py-act-ghost py-read", "Read aloud");
        read.type = "button";
        read.dataset.pyRead = String(index);
        read.title = "Read this answer with the browser voice. Recorded voices are the fixed audio lessons.";
        actions.appendChild(read);
      }
      if (actions.childElementCount) body.appendChild(actions);
      body.appendChild(el("p", "py-msg-from", `From: ${msg.from || "this lab"}`));
      head.appendChild(body);
      item.appendChild(head);
    } else {
      item.appendChild(el("p", "py-msg-text", msg.text));
    }
    log.appendChild(item);
  });
  if (busy) log.appendChild(el("p", "py-msg py-msg-bot py-msg-wait", "Looking through the lab…"));
  log.scrollTop = log.scrollHeight;
  const last = [...messages].reverse().find((msg) => msg.role === "bot" && (msg.follow || (msg.chips && msg.chips.length)));
  chips.replaceChildren();
  const extra = last && Array.isArray(last.chips) ? last.chips.slice(0, 4) : [];
  extra.forEach((chip) => {
    const btn = el("button", "py-chip", chip.label || chip.q);
    btn.type = "button";
    btn.dataset.pyAsk = chip.q || chip.label;
    chips.appendChild(btn);
  });
  if (last && last.follow && chips.childElementCount < 4) {
    const btn = el("button", "py-chip py-chip-accent", last.follow);
    btn.type = "button";
    btn.dataset.pyAsk = last.followQ || last.follow;
    chips.appendChild(btn);
  }
}

export function chatInput(root) {
  return root ? root.querySelector("#py-chat-input") : null;
}

export function syncSend(root) {
  if (!root) return;
  const input = chatInput(root);
  const send = root.querySelector(".py-send");
  if (send && input) send.disabled = !String(input.value || "").trim();
}

export function flagEmpty(root) {
  if (!root) return;
  const form = root.querySelector(".py-chat-form");
  const status = root.querySelector("#py-chat-status");
  if (status) status.textContent = "Type a question first.";
  if (!form) return;
  form.classList.add("is-error");
  window.setTimeout(() => form.classList.remove("is-error"), 1500);
}
