/* Local retrieval for a lab chat bot. No network, no model.
   Tokenise, stem, synonyms, BM25, and a short fuzzy pass for typos.
   Answers are excerpts the caller stored in the index. This file does not invent text. */

const STOP = new Set(`a an the and or to of for in on with is are was be do does did how what why when where who you i me my it this that from as at by not can your about into than then just like using use used please tell want need something thing things really very know code python lab learn learning work works write writing make makes lesson page explain mean means show ask asking have has could would should will its if`.split(" "));

const KIND_WEIGHT = {
  lesson: 1.22,
  guide: 1.08,
  glossary: 1.14,
  slide: 1.04,
  section: 1.0,
  quiz: 0.8,
  hint: 0.72,
  download: 0.92,
  game: 0.9,
  media: 0.96,
  page: 0.94,
  level: 0.9,
  diagram: 0.98,
};

const MIN_SCORE = 1.45;

export function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/f-strings?/g, " fstring ")
    .replace(/t-strings?/g, " tstring ")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(word) {
  if (word.length < 4) return word;
  if (word.length === 4) {
    if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    return word;
  }
  if (word.endsWith("ies") && word.length > 5 && word !== "series") return `${word.slice(0, -3)}y`;
  if (word.endsWith("ing") && word.length > 6) {
    let base = word.slice(0, -3);
    if (base.length > 3 && base.at(-1) === base.at(-2)) base = base.slice(0, -1);
    return base;
  }
  if (word.endsWith("ed") && word.length > 5) return word.slice(0, -2);
  if (/(ches|shes|sses|xes|zes|oes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function canon(word, syn) {
  if (!word) return "";
  if (syn[word]) return syn[word];
  const stemmed = stem(word);
  if (syn[stemmed]) return syn[stemmed];
  return stemmed;
}

export function tokens(text, syn = {}, cap = 3) {
  const counts = new Map();
  const out = [];
  const parts = normalize(text).split(" ");
  for (const raw of parts) {
    if (!raw || STOP.has(raw)) continue;
    const term = canon(raw, syn);
    if (!term || term.length < 2 || STOP.has(term)) continue;
    const seen = counts.get(term) || 0;
    if (seen >= cap) continue;
    counts.set(term, seen + 1);
    out.push(term);
  }
  return out;
}

function distance(a, b, max) {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  const row = new Array(bl + 1);
  for (let j = 0; j <= bl; j += 1) row[j] = j;
  for (let i = 1; i <= al; i += 1) {
    let prev = row[0];
    row[0] = i;
    let best = row[0];
    for (let j = 1; j <= bl; j += 1) {
      const cur = row[j];
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
      row[j] = next;
      if (next < best) best = next;
    }
    if (best > max) return max + 1;
  }
  return row[bl];
}

function fuzzy(word, pool) {
  if (word.length < 5) return "";
  const max = word.length >= 8 ? 2 : 1;
  let best = "";
  let bestD = max + 1;
  const first = word[0];
  for (const cand of pool) {
    if (cand[0] !== first) continue;
    if (Math.abs(cand.length - word.length) > max) continue;
    const dist = distance(word, cand, max);
    if (dist < bestD) {
      bestD = dist;
      best = cand;
      if (dist === 0) break;
    }
  }
  return bestD <= max ? best : "";
}

function queryTokens(text, syn, pool) {
  const out = [];
  const known = new Set(pool);
  for (const raw of normalize(text).split(" ")) {
    if (!raw || STOP.has(raw)) continue;
    let word = raw;
    const direct = canon(word, syn);
    const knownDirect = known.has(word) || known.has(stem(word)) || known.has(direct) || Boolean(syn[word]);
    if (!knownDirect && word.length >= 6) {
      const fix = fuzzy(word, pool);
      if (fix) word = fix;
    }
    const term = canon(word, syn);
    if (!term || term.length < 2 || STOP.has(term)) continue;
    out.push(term);
  }
  return out;
}

function count(list) {
  const tf = new Map();
  for (const term of list) tf.set(term, (tf.get(term) || 0) + 1);
  return tf;
}

function bm25(terms, tf, dl, avgdl, nDocs, df) {
  const k1 = 1.2;
  const b = 0.75;
  let score = 0;
  const seen = new Set();
  for (const term of terms) {
    if (seen.has(term)) continue;
    seen.add(term);
    const freq = tf.get(term) || 0;
    if (!freq) continue;
    const n = df.get(term) || 0;
    const idf = Math.log(1 + (nDocs - n + 0.5) / (n + 0.5));
    const norm = freq * (k1 + 1) / (freq + k1 * (1 - b + b * (dl / avgdl)));
    score += idf * norm;
  }
  return score;
}

function frameOf(text) {
  const q = normalize(text);
  if (/^how (do|does|to|can)\b/.test(q)) return "how do";
  if (/^show\b/.test(q)) return "show";
  return "what is";
}

function injection(q) {
  return /\b(ignore (your |all |the )?(rules|instructions|prompt)|disregard (your |the )?(rules|instructions)|you are now|system prompt|jailbreak|reveal your (prompt|instructions|rules)|forget (your |previous |all )?(instructions|rules)|act as |developer mode)\b/.test(q);
}

function clip(text, max = 280) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  if (stop > 80) return cut.slice(0, stop + 1);
  return `${cut.slice(0, max - 1).trim()}…`;
}

function emptyAnswer(partial) {
  return {
    mode: "fallback",
    intent: "",
    text: "",
    href: "",
    link: "",
    example: "",
    follow: "",
    followQ: "",
    act: "",
    hits: [],
    closest: [],
    ...partial,
  };
}

export function createRetriever(index) {
  const syn = index && index.syn ? index.syn : {};
  const docs = (index && index.docs ? index.docs : []).map((doc) => {
    const body = Array.isArray(doc.w) ? doc.w : [];
    const title = Array.isArray(doc.tw) ? doc.tw : [];
    return {
      ...doc,
      body,
      title,
      tf: count(body),
      ttf: count(title),
      dl: body.length || 1,
      tdl: title.length || 1,
      titleNorm: normalize(doc.ti),
    };
  });
  const df = new Map();
  const tdf = new Map();
  const pool = [];
  const seenPool = new Set();
  const addPool = (term) => {
    if (!term || term.length < 4 || seenPool.has(term)) return;
    seenPool.add(term);
    pool.push(term);
  };
  docs.forEach((doc) => {
    new Set(doc.body).forEach((term) => {
      df.set(term, (df.get(term) || 0) + 1);
      addPool(term);
    });
    new Set(doc.title).forEach((term) => {
      tdf.set(term, (tdf.get(term) || 0) + 1);
      addPool(term);
    });
  });
  Object.keys(syn).forEach(addPool);
  const nDocs = docs.length || 1;
  const avgdl = docs.reduce((sum, doc) => sum + doc.dl, 0) / nDocs || 1;
  const avgtdl = docs.reduce((sum, doc) => sum + doc.tdl, 0) / nDocs || 1;
  let memory = null;

  function search(text, limit = 3) {
    const qTerms = queryTokens(text, syn, pool);
    const qset = new Set(qTerms);
    const nq = normalize(text);
    const ranked = [];
    for (const doc of docs) {
      if (!qTerms.length) break;
      let score = bm25(qTerms, doc.tf, doc.dl, avgdl, nDocs, df);
      score += 2.1 * bm25(qTerms, doc.ttf, doc.tdl, avgtdl, nDocs, tdf);
      const titleHits = new Set(doc.title.filter((term) => qset.has(term)));
      const uniqueQ = [...qset];
      const matched = uniqueQ.filter((term) => doc.tf.has(term) || doc.ttf.has(term));
      score += titleHits.size * 6;
      if (doc.titleNorm.length >= 6 && ` ${nq} `.includes(` ${doc.titleNorm} `)) score += 16;
      else if (doc.title.length === 1 && qset.has(doc.title[0]) && doc.title[0].length >= 3) score += 9;
      else if (doc.title.length >= 2 && doc.title.every((term) => qset.has(term))) score += 9;
      if (uniqueQ.length >= 2 && matched.length === uniqueQ.length) score += 5;
      if (uniqueQ.length >= 2 && matched.length < uniqueQ.length) score *= 0.42;
      if (uniqueQ.length >= 3 && matched.length * 2 < uniqueQ.length) score *= 0.3;
      const askingHint = /^(a )?hints?\b|\b(show|give)( me)? (a )?hints?\b/.test(nq);
      if (doc.k === "hint" && !askingHint) score *= 0.15;
      const defines = /^(what is|what are|what does|how do|how does|explain|define|meaning of)\b/.test(nq);
      const titled = doc.titleNorm.length >= 6 && ` ${nq} `.includes(` ${doc.titleNorm} `);
      if ((doc.k === "glossary" || doc.k === "quiz" || doc.k === "hint") && titleHits.size === 0) score *= 0.5;
      if (defines && doc.k === "glossary" && titleHits.size) score += 3.2;
      if (defines && doc.k === "lesson") score += 2.4;
      if (defines && (doc.k === "game" || doc.k === "media" || doc.k === "hint") && !titled) score *= 0.35;
      score *= KIND_WEIGHT[doc.k] || 1;
      if (score > 0) ranked.push({ doc, score });
    }
    ranked.sort((a, b) => b.score - a.score || String(a.doc.ti).localeCompare(String(b.doc.ti)));
    return ranked.slice(0, limit).map((row) => ({
      href: row.doc.h,
      title: row.doc.ti,
      score: Math.round(row.score * 100) / 100,
      kind: row.doc.k,
      section: row.doc.s || "",
      id: row.doc.i,
    }));
  }

  function docBy(pred) {
    return docs.find(pred) || null;
  }

  function fromDoc(doc, mode, intent, follow, followQ) {
    const link = doc.k === "lesson" ? "Open this lesson" : "Open this page";
    return emptyAnswer({
      mode,
      intent,
      text: clip(doc.ex),
      href: doc.h,
      link,
      example: "",
      follow: follow || doc.fu || "",
      followQ: followQ || doc.fq || "",
      act: doc.act || "",
      hits: [{ href: doc.h, title: doc.ti, score: 1, kind: doc.k, section: doc.s || "", id: doc.i }],
    });
  }

  function remember(doc, raw) {
    memory = {
      href: doc.h,
      title: doc.ti,
      example: doc.eg || "",
      frame: frameOf(raw),
      kind: doc.k,
      act: doc.act || "",
      link: doc.k === "lesson" ? "Open this lesson" : "Open this page",
    };
  }

  function intentAnswer(name, doc, text, extra = {}) {
    const answer = doc ? fromDoc(doc, "intent", name, extra.follow, extra.followQ) : emptyAnswer({ mode: "intent", intent: name, text });
    if (text) answer.text = text;
    if (extra.href) answer.href = extra.href;
    if (extra.link) answer.link = extra.link;
    if (extra.act) answer.act = extra.act;
    if (extra.follow) answer.follow = extra.follow;
    if (extra.followQ) answer.followQ = extra.followQ;
    if (doc) remember(doc, extra.raw || name);
    return answer;
  }

  function listTitles(kind, max = 6) {
    return docs.filter((doc) => doc.k === kind).slice(0, max).map((doc) => doc.ti);
  }

  function route(raw, host) {
    const q = normalize(raw);
    if (!q) return emptyAnswer({ text: "Type a question about a lesson in this lab." });
    if (injection(q)) {
      memory = null;
      return emptyAnswer({
        mode: "fallback",
        intent: "injection",
        text: "I don't have that yet. I only answer from this lab's lessons, and I can't change that. Try a Python question, or use Search.",
        follow: "Where do I start?",
        followQ: "Where do I start?",
        act: "search",
      });
    }
    if (/^(hi|hello|hey|hiya|howdy|yo|good morning|good afternoon|good evening)[. ]*$/.test(q)) {
      return emptyAnswer({
        mode: "greet",
        intent: "greet",
        text: "Hello. I look up pages in this lab. Ask where to start, or about lists, functions, or errors.",
        follow: "Where do I start?",
        followQ: "Where do I start?",
      });
    }
    if (/^(thanks|thank you|thx|bye|goodbye|see you|how are you|who are you|what is your name|whats your name|good job)[. ]*$/.test(q)) {
      const who = /who are you|your name/.test(q);
      const bye = /^(bye|goodbye|see you)/.test(q);
      const thanks = /thank|thx|good job/.test(q);
      let text = "I'm here. Ask me about a topic this lab teaches.";
      if (who) text = "I am Py, the lab bot in Cypher Monkey's Python Lab. I answer only from this lab's lessons, and I can be wrong.";
      else if (bye) text = "See you in the lab. The lessons stay on this device.";
      else if (thanks) text = "You're welcome. Open a lesson when you want to try it.";
      else if (/how are you/.test(q)) text = "Ready when you are. Ask about a Python topic from this lab.";
      return emptyAnswer({
        mode: "smalltalk",
        intent: "smalltalk",
        text,
        follow: "How do I run code?",
        followQ: "How do I run code?",
      });
    }
    if (memory && /^(show|give)( me)?( an)? example[. ]*$/.test(q)) {
      if (!memory.example) {
        return emptyAnswer({
          mode: "answer",
          intent: "example",
          text: `The page “${memory.title}” has no short example stored in the chat index. Open it to read the full text.`,
          href: memory.href,
          link: memory.link,
          follow: "Where do I start?",
          followQ: "Where do I start?",
        });
      }
      return emptyAnswer({
        mode: "answer",
        intent: "example",
        text: `An example from “${memory.title}”.`,
        href: memory.href,
        link: memory.link,
        example: memory.example,
        act: memory.act,
        follow: "Where do I start?",
        followQ: "Where do I start?",
      });
    }
    if (memory && /^(open it|open that|go there|take me there)[. ]*$/.test(q)) {
      return emptyAnswer({
        mode: "intent",
        intent: "open",
        text: `Opening “${memory.title}”.`,
        href: memory.href,
        link: memory.link,
        act: memory.act,
      });
    }
    let searchText = raw;
    const follow = q.match(/^(?:and |what about |how about |ok and )(.+)$/);
    if (follow && memory) {
      const rest = follow[1].replace(/[?.!]+/g, "").trim();
      searchText = `${memory.frame} ${rest}`;
    }
    if (/\b(play|open|start)\b.*\b(game|games)\b|\bgames\b[. ]*$|what games/.test(q)) {
      const named = gameNamed(q);
      if (named) return intentAnswer("game", named, clip(named.ex), { raw, follow: "Show downloads", followQ: "Show downloads" });
      const games = docBy((doc) => doc.h === "#/games" || (doc.k === "section" && doc.s === "games"));
      const names = listTitles("game", 8);
      const text = names.length
        ? `Games in this lab: ${names.join(", ")}.`
        : "The Games section has short puzzles that run in the browser.";
      return intentAnswer("game", games, text, { href: "#/games", link: "Open games", raw, follow: "How do I run code?", followQ: "How do I run code?" });
    }
    const namedGame = /\b(play|open|game)\b/.test(q) ? gameNamed(q) : gameNamed(q, true);
    if (namedGame && /\b(play|open|game|start)\b/.test(q)) {
      return intentAnswer("game", namedGame, clip(namedGame.ex), { raw });
    }
    if (/\b(audio|listen|spoken|hear the|play audio|sound lesson)\b/.test(q)) {
      const media = docs.filter((doc) => doc.k === "media" && doc.act === "audio");
      const text = media.length
        ? `Spoken audio in this lab: ${media.map((doc) => doc.ti).join("; ")}.`
        : "This lab has short spoken lessons on the home page.";
      return intentAnswer("audio", media[0] || null, text, {
        href: "#/",
        link: "Open the audio lessons",
        act: "audio",
        raw,
        follow: "Show the videos",
        followQ: "Show the videos",
      });
    }
    if (/\b(video|videos|clip|clips|animation|gif)\b/.test(q)) {
      const media = docs.filter((doc) => doc.k === "media" && doc.act === "video");
      const text = media.length
        ? `Short clips in this lab: ${media.map((doc) => doc.ti).join("; ")}.`
        : "Short clips and animated explainers are on the home page.";
      return intentAnswer("video", media[0] || null, text, {
        href: "#/",
        link: "Open the clips",
        act: "video",
        raw,
        follow: "Play audio",
        followQ: "Play audio",
      });
    }
    if (/\b(download|downloads|cheat sheet|cheatsheet|cheatsheets)\b/.test(q)) {
      const rows = docs.filter((doc) => doc.k === "download");
      const text = rows.length
        ? `Downloads in this lab: ${rows.map((doc) => doc.ti).join("; ")}.`
        : "Cheat sheets and level files are on the downloads page.";
      const page = docBy((doc) => doc.h === "#/downloads") || rows[0];
      return intentAnswer("downloads", page, text, {
        href: "#/downloads",
        link: "Open downloads",
        raw,
        follow: "How do I run code?",
        followQ: "How do I run code?",
      });
    }
    if (/\b(where (do|should) i start|how do i (start|begin)|getting started|first lesson|start here)\b/.test(q)) {
      const doc = docBy((item) => item.i === "lesson:start/how-to-use") || docBy((item) => item.h === "#/section/start");
      const text = doc ? `Start with “${doc.ti}”. ${clip(doc.ex, 220)}` : "Start with the Start Here section.";
      return intentAnswer("start", doc, text, { raw, follow: "How do I run code?", followQ: "How do I run code?" });
    }
    if (/\b(what level am i|whats my level|what is my level|my progress|how far am i|how many lessons have i)\b/.test(q)) {
      const info = host && typeof host.progress === "function" ? host.progress() : null;
      const done = info && Number.isFinite(info.done) ? info.done : 0;
      const total = info && Number.isFinite(info.total) ? info.total : 0;
      const xpLevel = info && Number.isFinite(info.xpLevel) ? info.xpLevel : 1;
      let text = `On this device the XP counter is level ${xpLevel}. `;
      text += total ? `You have opened ${done} of ${total} lessons. ` : "I can't see a lesson count yet. ";
      text += "That is browser storage, not a judgement of your skill.";
      const next = info && info.nextHref ? info : null;
      return emptyAnswer({
        mode: "intent",
        intent: "level",
        text,
        href: next ? next.nextHref : "#/section/start",
        link: next ? "Open the next unopened lesson" : "Open Start Here",
        follow: "Where do I start?",
        followQ: "Where do I start?",
      });
    }
    if (/\b(how do i run|run my code|run the code|run code|practice desk|where can i run|where do i run)\b/.test(q)) {
      const doc = docBy((item) => item.i === "lesson:start/runtime") || docBy((item) => item.h === "#/practice");
      const text = doc
        ? `Run code on the practice desk. ${clip(doc.ex, 220)}`
        : "The practice desk runs Python in this browser. Your code stays on the page.";
      return intentAnswer("run", doc, text, {
        href: "#/practice",
        link: "Open the practice desk",
        raw,
        follow: "Where do I start?",
        followQ: "Where do I start?",
      });
    }
    if (/^(help|help me|help please)[. ]*$/.test(q) || /how (do i|to) use (this )?(site|lab)/.test(q)) {
      const doc = docBy((item) => item.i === "lesson:start/how-to-use");
      const text = doc
        ? `Help for this lab starts at “${doc.ti}”. ${clip(doc.ex, 200)}`
        : "Open How to use this lab, or press Help in the footer.";
      return intentAnswer("help", doc, text, { raw, follow: "Where do I start?", followQ: "Where do I start?" });
    }
    return { searchText };
  }

  function gameNamed(q, bare = false) {
    const rows = docs.filter((doc) => doc.k === "game");
    let best = null;
    for (const doc of rows) {
      const name = doc.titleNorm;
      if (!name || name.length < 4) continue;
      if (q.includes(name) || (!bare && name.split(" ").some((part) => part.length > 4 && q.includes(part)))) best = doc;
    }
    return best;
  }

  function ask(raw, host) {
    const routed = route(String(raw || "").slice(0, 400), host || {});
    if (!routed.searchText) return routed;
    const qTerms = queryTokens(routed.searchText, syn, pool);
    const knownTerms = qTerms.filter((term) => df.has(term));
    const unknownTerms = qTerms.filter((term) => !df.has(term));
    if (qTerms.length && unknownTerms.length >= knownTerms.length) {
      return emptyAnswer({
        mode: "fallback",
        intent: "fallback",
        text: "I don't have that yet. I only answer from this lab's lessons. You can also use Search.",
        act: "search",
        follow: "Where do I start?",
        followQ: "Where do I start?",
      });
    }
    const hits = search(routed.searchText, 3);
    const top = hits[0];
    const topDoc = top ? docs.find((doc) => doc.i === top.id) : null;
    if (!top || !topDoc || top.score < MIN_SCORE) {
      const closest = search(routed.searchText, 4)
        .filter((hit) => hit.kind === "lesson" || hit.kind === "guide" || hit.kind === "glossary")
        .slice(0, 2)
        .map((hit) => ({ href: hit.href, title: hit.title }));
      const tail = closest.length
        ? ` Closest pages: ${closest.map((item) => item.title).join("; ")}.`
        : "";
      return emptyAnswer({
        mode: "fallback",
        intent: "fallback",
        text: `I don't have that yet.${tail} I only answer from this lab's lessons. You can also use Search.`,
        act: "search",
        closest,
        hits,
        follow: closest[0] ? `What about ${closest[0].title}?` : "Where do I start?",
        followQ: closest[0] ? closest[0].title : "Where do I start?",
      });
    }
    const second = hits[1];
    const follow = topDoc.eg
      ? "Show an example"
      : (second && second.href !== top.href ? `What about ${second.title}?` : (topDoc.fu || "Where do I start?"));
    const followQ = topDoc.eg
      ? "Show an example"
      : (second && second.href !== top.href ? second.title : (topDoc.fq || "Where do I start?"));
    remember(topDoc, raw);
    return emptyAnswer({
      mode: "answer",
      intent: "",
      text: clip(topDoc.ex),
      href: topDoc.h,
      link: topDoc.k === "lesson" ? "Open this lesson" : "Open this page",
      example: "",
      follow,
      followQ,
      act: topDoc.act || "",
      hits,
    });
  }

  return {
    ask,
    search,
    reset() { memory = null; },
  };
}
