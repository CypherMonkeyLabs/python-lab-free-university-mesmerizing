let stopCurrent = () => {};

import { win } from "./xp.js";
import { isPlay, mountPlay } from "./play.js";
import { iconSvg } from "./icons.js";

const GAME_ICONS = {
  guess: "guess",
  snake: "snake",
  adventure: "adventure",
  blocks: "blocks",
  turtle: "turtle",
  loops: "loop",
  lists: "list",
  order: "sorter",
  pong: "pong",
  "dict-puzzle": "hash-lab",
  complexity: "big-o",
};

function paintGameIcons() {
  if (location.hash !== "#/games") return;
  document.querySelectorAll('#main a[href^="#/games/"]').forEach((link) => {
    const id = (link.getAttribute("href") || "").split("/").pop();
    const name = GAME_ICONS[id];
    const svg = link.querySelector(".ico svg");
    if (!name || !svg || svg.dataset.icon === name) return;
    svg.outerHTML = iconSvg(name, 24);
  });
}

function watchGameIcons() {
  const main = document.getElementById("main");
  if (!main) return;
  const paint = () => paintGameIcons();
  const observer = new MutationObserver(paint);
  observer.observe(main, { childList: true, subtree: true });
  window.addEventListener("hashchange", paint);
  paint();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchGameIcons);
else watchGameIcons();

export function stopGame() {
  stopCurrent();
  stopCurrent = () => {};
}

export function mountGame(id, root) {
  stopGame();
  if (id === "guess") stopCurrent = mountGuess(root);
  else if (id === "snake") stopCurrent = mountSnake(root);
  else if (id === "adventure") stopCurrent = mountAdventure(root);
  else if (isPlay(id)) stopCurrent = mountPlay(id, root);
}

function mountGuess(root) {
  root.innerHTML = `
    <p data-speak>The desk picked an integer from 1 to 100. Each answer says higher or lower. Seven careful guesses are always enough, because 2 to the 7th is 128.</p>
    <p class="guess-status" aria-live="polite">No guess yet.</p>
    <form class="guess-row">
      <label class="muted" for="guess-input">Your guess</label>
      <input id="guess-input" inputmode="numeric" autocomplete="off" required>
      <button class="primary" type="submit">Guess</button>
      <button type="button" class="text-btn" id="guess-new">New number</button>
    </form>
    <p class="muted">Guesses: <span id="guess-count">0</span></p>`;
  let secret = 1 + Math.floor(Math.random() * 100);
  let count = 0;
  const status = root.querySelector(".guess-status");
  const countEl = root.querySelector("#guess-count");
  const form = root.querySelector("form");
  const reset = () => {
    secret = 1 + Math.floor(Math.random() * 100);
    count = 0;
    countEl.textContent = "0";
    status.textContent = "A new integer is waiting.";
    form.reset();
  };
  root.querySelector("#guess-new").addEventListener("click", reset);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = Number(root.querySelector("#guess-input").value);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      status.textContent = "Enter an integer from 1 to 100.";
      return;
    }
    count += 1;
    countEl.textContent = String(count);
    if (value === secret) { status.textContent = `Yes. ${value} was the number, in ${count} guesses.`; win("guess", 15); }
    else if (value < secret) status.textContent = `${value} is lower than the secret.`;
    else status.textContent = `${value} is higher than the secret.`;
  });
  return () => {};
}

function mountSnake(root) {
  root.innerHTML = `
    <p>Steer the snake to the brass square. It grows when you eat. Arrow keys work after you focus the board. The buttons work without a keyboard.</p>
    <canvas id="snake-canvas" width="320" height="320" tabindex="0" aria-label="Snake board"></canvas>
    <div class="dir-pad" aria-label="Direction">
      <button type="button" class="up" data-dir="up">Up</button>
      <button type="button" class="left" data-dir="left">Left</button>
      <button type="button" class="down" data-dir="down">Down</button>
      <button type="button" class="right" data-dir="right">Right</button>
    </div>
    <p aria-live="polite">Length <span id="snake-score">3</span>. <button type="button" class="text-btn" id="snake-again">Play again</button></p>`;
  const canvas = root.querySelector("#snake-canvas");
  const score = root.querySelector("#snake-score");
  const ctx = canvas.getContext("2d");
  const cols = 16;
  let alive = true;
  let frame = 0;
  let raf = 0;
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let snake = [{ x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }];
  let food = { x: 10, y: 8 };

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * cols) };
    } while (snake.some((part) => part.x === food.x && part.y === food.y));
  }

  function turn(name) {
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const candidate = map[name];
    if (!candidate) return;
    if (candidate.x === -dir.x && candidate.y === -dir.y) return;
    nextDir = candidate;
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= cols || snake.some((part) => part.x === head.x && part.y === head.y)) {
      alive = false;
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) placeFood();
    else snake.pop();
    score.textContent = String(snake.length);
    if (snake.length >= 8) win("snake", 25, "arcade-pro");
  }

  const BODY = ["#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#fb7185"];
  function draw() {
    const size = canvas.width / cols;
    ctx.fillStyle = "#12142b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(127, 140, 255, 0.25)";
    for (let i = 1; i < cols; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, canvas.height);
      ctx.moveTo(0, i * size);
      ctx.lineTo(canvas.width, i * size);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffd43b";
    ctx.fillRect(food.x * size + 2, food.y * size + 2, size - 4, size - 4);
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? "#ff5da2" : BODY[index % BODY.length];
      ctx.fillRect(part.x * size + 1, part.y * size + 1, size - 2, size - 2);
    });
    if (!alive) {
      ctx.fillStyle = "#fff6e8";
      ctx.font = "20px sans-serif";
      ctx.fillText("The snake stopped.", 16, canvas.height / 2);
    }
  }

  function loop() {
    frame += 1;
    if (alive && frame % 8 === 0) tick();
    draw();
    raf = requestAnimationFrame(loop);
  }

  const onKey = (event) => {
    const keys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (!keys[event.key]) return;
    event.preventDefault();
    turn(keys[event.key]);
  };
  canvas.addEventListener("keydown", onKey);
  root.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      canvas.focus();
      turn(button.dataset.dir);
    });
  });
  let touch = null;
  canvas.addEventListener("pointerdown", (event) => {
    touch = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (!touch) return;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    if (Math.abs(dx) + Math.abs(dy) < 16) return;
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? "right" : "left");
    else turn(dy > 0 ? "down" : "up");
  });
  root.querySelector("#snake-again").addEventListener("click", () => {
    alive = true;
    dir = { x: 1, y: 0 };
    nextDir = dir;
    snake = [{ x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }];
    placeFood();
    score.textContent = "3";
  });
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

const ROOM_TEMPLATE = {
  hall: {
    text: "You are in the hall of the lab. A desk is west. Shelves are north. A garden door is east.",
    exits: { north: "stacks", east: "garden", west: "desk" },
    items: [],
  },
  stacks: {
    text: "Shelves of modules. A thin book is titled Beacon.",
    exits: { south: "hall" },
    items: ["book"],
  },
  garden: {
    text: "Raised beds, and something metallic labeled beacon.py under a leaf.",
    exits: { west: "hall" },
    items: ["beacon"],
  },
  desk: {
    text: "A reader waits with an empty import line. The hall is east.",
    exits: { east: "hall" },
    items: [],
  },
};

function mountAdventure(root) {
  root.innerHTML = `
    <p>The lab's reader is missing a module named beacon. Find it and use it at the desk. Commands: look, go, take, use, inventory, help.</p>
    <div class="log" id="adv-log" aria-live="polite"></div>
    <form class="adv-row">
      <label class="muted" for="adv-input">Command</label>
      <input id="adv-input" autocomplete="off">
      <button class="primary" type="submit">Do</button>
    </form>`;
  const rooms = Object.fromEntries(Object.entries(ROOM_TEMPLATE).map(([id, room]) => [id, {
    ...room,
    exits: { ...room.exits },
    items: [...room.items],
  }]));
  const state = { room: "hall", inventory: new Set(), won: false };
  const log = root.querySelector("#adv-log");
  const write = (text) => {
    const line = document.createElement("p");
    line.textContent = text;
    log.append(line);
    log.scrollTop = log.scrollHeight;
  };
  const here = () => rooms[state.room];
  const look = () => {
    const room = here();
    const items = room.items.length ? ` You can take: ${room.items.join(", ")}.` : "";
    const exits = ` Doors: ${Object.keys(room.exits).join(", ")}.`;
    write(room.text + items + exits);
  };
  write("Import Error: the beacon module is somewhere in the building.");
  look();
  root.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = root.querySelector("#adv-input");
    const raw = input.value.trim();
    input.value = "";
    if (!raw) return;
    write("> " + raw);
    if (state.won) {
      write("The reader already has beacon. Type help if you want the command list.");
      return;
    }
    const [verb, ...rest] = raw.toLowerCase().split(/\s+/);
    const noun = rest.join(" ");
    const alias = { n: "north", s: "south", e: "east", w: "west", i: "inventory" };
    const word = alias[verb] || verb;
    if (word === "help") {
      write("look. go north. take beacon. use beacon. inventory.");
      return;
    }
    if (word === "look") {
      look();
      return;
    }
    if (word === "inventory") {
      write(state.inventory.size ? `You hold ${[...state.inventory].join(", ")}.` : "Your hands are empty.");
      return;
    }
    if (word === "go" || ["north", "south", "east", "west"].includes(word)) {
      const dir = word === "go" ? noun : word;
      const next = here().exits[dir];
      if (!next) {
        write("There is no door that way.");
        return;
      }
      state.room = next;
      write(`You go ${dir}.`);
      look();
      return;
    }
    if (word === "take") {
      const name = noun.replace(".py", "");
      const room = here();
      if (!room.items.includes(name)) {
        write("You do not see that here.");
        return;
      }
      room.items = room.items.filter((item) => item !== name);
      state.inventory.add(name);
      if (name === "book") write("The book says: beacon is a module. It likes soil.");
      else write(`You take ${name}.`);
      return;
    }
    if (word === "use" || word === "import") {
      const name = (noun || "beacon").replace(".py", "");
      if (!state.inventory.has(name)) {
        write("You are not holding that.");
        return;
      }
      if (name === "beacon" && state.room === "desk") {
        state.won = true;
        win("adventure", 30);
        write("import beacon is accepted. The reader wakes up. You did it.");
        return;
      }
      if (name === "book") {
        write("The book says: beacon is a module. It likes soil.");
        return;
      }
      write("Nothing here knows what to do with that.");
      return;
    }
    write("The lab does not know that command. Try help.");
  });
  return () => {};
}
