const canvas = document.getElementById("signal-field");
const ctx = canvas.getContext("2d");
const bottomPets = document.getElementById("bottom-pets");
const petButtons = [...document.querySelectorAll(".pixel-pet")];

const state = {
  width: 0,
  height: 0,
  ratio: Math.min(window.devicePixelRatio || 1, 2),
  cells: [],
  ripples: [],
  bots: [],
  mouse: { x: 0.67, y: 0.38 },
};

let touchStartY = null;
let lastTouchY = null;
let bottomRevealProgress = 0;

const BOTTOM_REVEAL_DISTANCE = 320;

const palette = [
  "rgba(11,34,66,0.07)",
  "rgba(11,34,66,0.045)",
  "rgba(11,34,66,0.032)",
  "rgba(138,143,149,0.052)",
];

const sprites = {
  rabbit: [
    "0000DDD0000DDD0000",
    "00DLLD000000DLLD00",
    "0DLBLD000000DLBLD0",
    "0DLBLD000000DLBLD0",
    "00DLLLDDDDDDLLLD00",
    "0DLLLLLLLLLLLLLLD0",
    "0DLLLDLLLLLDLLLD00",
    "0DLLLDLLLLLDLLLD00",
    "0DLBLLLLLLLLLBLD00",
    "0DLLLLLLLLLLLLLD00",
    "0DLLLLLLLLLLLLLLD0",
    "00DLLLLLLLLLLLLD00",
    "000DLLLLLLLLLLD000",
    "000DLLLLLLLLLLD000",
    "00DLLLLLLLLLLLLD00",
    "0DLLLLLLLLLLLLLLD0",
    "0DLLLLLLLLLLLLLLD0",
    "00DLLLLLLLLLLLLD00",
    "00DLLLDDDDDDLLLD00",
    "0000DD000000DD0000",
  ],
  cat: [
    "0000000000000000000000000000",
    "00000000D0000000000D00000000",
    "0000000DLD00000000DLD0000000",
    "000000DLLD00000000DLLD000000",
    "00000DLSLD00000000DLSLD00000",
    "00000DDLLLLLLLLLLLLLLDD00000",
    "0000DLLLLLLLLLLLLLLLLLLD0000",
    "0000DLLLLLDLLLLLLDLLLLLD0000",
    "0000DLLLBBLLLLLLLLBBLLLD0000",
    "0000DLLLLLLLLMMLLLLLLLLD0000",
    "0000DLLLLLLLMLLMLLLLLLLD0000",
    "0000DLLLLLLLLLLLLLLLLLLD0000",
    "00000DDLLLLLLLLLLLLLLDD00000",
    "000000000DDDDDDDDDD000000000",
    "00000000DLLLLLLLLLLDDDDD0000",
    "00000000DLLLLLLLLLLDLLLDDD00",
    "00000000DLLLLLLLLLLD0LLMLDD0",
    "00000000DLLLLLLLLLLD00LLLLD0",
    "00000000DLLLLLLLLLLD00LLMLD0",
    "00000000DLLLLLLLLLLD00LLLDD0",
    "000000000DDLLLLLLDD000DDDD00",
    "000000000DDDD00DDDD000000000",
    "0000000000000000000000000000",
    "0000000000000000000000000000",
    "0000000000000000000000000000",
    "0000000000000000000000000000",
    "0000000000000000000000000000",
    "0000000000000000000000000000",
  ],
};

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(state.width * state.ratio);
  canvas.height = Math.floor(state.height * state.ratio);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);

  const count = Math.max(30, Math.min(68, Math.floor((state.width * state.height) / 23500)));
  state.cells = Array.from({ length: count }, (_, i) => ({
    x: (i * 73) % state.width,
    y: (i * 179) % state.height,
    size: 2 + (i % 5) * 2,
    phase: i * 0.53,
    color: palette[i % palette.length],
  }));
}

function renderSprites() {
  document.querySelectorAll(".sprite-grid").forEach((grid) => {
    const rows = sprites[grid.dataset.sprite];
    if (!rows) return;

    grid.innerHTML = "";
    grid.style.setProperty("--pet-cols", rows[0].length);
    grid.style.setProperty("--pet-rows", rows.length);
    rows.forEach((row) => {
      [...row].forEach((cell) => {
        const pixel = document.createElement("span");
        if (cell === "D") pixel.className = "p-dark";
        if (cell === "M") pixel.className = "p-mid";
        if (cell === "L") pixel.className = "p-light";
        if (cell === "S") pixel.className = "p-soft";
        if (cell === "B") pixel.className = "p-blush";
        grid.append(pixel);
      });
    });
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function px(value, unit = 4) {
  return Math.round(value / unit) * unit;
}

function color(alpha) {
  return `rgba(11,34,66,${alpha})`;
}

function drawPixelRing(x, y, radius, alpha) {
  const step = 8;
  const size = 3;
  const r = px(radius, 4);
  ctx.fillStyle = color(alpha);

  for (let dx = -r; dx <= r; dx += step) {
    ctx.fillRect(px(x + dx), px(y - r), size, size);
    ctx.fillRect(px(x + dx), px(y + r), size, size);
  }

  for (let dy = -r + step; dy <= r - step; dy += step) {
    ctx.fillRect(px(x - r), px(y + dy), size, size);
    ctx.fillRect(px(x + r), px(y + dy), size, size);
  }
}

function drawRipple(ripple, time) {
  const progress = (time - ripple.born) / ripple.duration;
  if (progress < 0 || progress > 1) return;

  const ease = 1 - Math.pow(1 - progress, 3);
  const alpha = (1 - progress) * 0.18;
  drawPixelRing(ripple.x, ripple.y, 10 + ease * 92, alpha);
  drawPixelRing(ripple.x, ripple.y, 22 + ease * 56, alpha * 0.7);

  if (progress < 0.45) {
    ctx.fillStyle = color((0.45 - progress) * 0.22);
    ctx.fillRect(px(ripple.x - 4), px(ripple.y - 4), 8, 8);
  }
}

function rect(x, y, w, h, alpha, shade = 0) {
  const shades = [
    [11, 34, 66],
    [23, 57, 103],
    [250, 247, 238],
  ];
  const [r, g, b] = shades[shade];
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawRobot(bot, time) {
  const age = time - bot.born;
  if (age < 0 || age > bot.life) return;

  const progress = age / bot.life;
  const intro = clamp(age / 620, 0, 1);
  const outro = progress > 0.78 ? clamp((1 - progress) / 0.22, 0, 1) : 1;
  const alpha = Math.min(intro, outro);
  const dissolve = progress > 0.78 ? clamp((progress - 0.78) / 0.22, 0, 1) : 0;
  const walk = Math.sin(age * 0.006 + bot.seed);
  const x = bot.x + Math.sin(age * 0.0014 + bot.seed) * 46 + Math.sin(age * 0.0031) * 8;
  const y = bot.y + Math.cos(age * 0.0011 + bot.seed) * 18 + dissolve * 18;
  const scale = (2.15 + Math.sin(age * 0.004) * 0.08) * (0.78 + intro * 0.22) * (1 - dissolve * 0.36);
  const unit = scale;
  const left = px(x - 6.5 * unit, 2);
  const top = px(y - 8 * unit, 2);
  const a = alpha * 0.82;

  const p = (col, row, w = 1, h = 1, shade = 0, localAlpha = 1) => {
    rect(left + col * unit, top + row * unit, w * unit, h * unit, a * localAlpha, shade);
  };

  p(6, 0, 1, 2, 0, 0.72);
  p(5, 1, 3, 1, 0, 0.46);
  p(3, 2, 7, 5, 0);
  p(2, 3, 1, 3, 1, 0.82);
  p(10, 3, 1, 3, 1, 0.82);
  p(4, 4, 1, 1, 2, 0.94);
  p(8, 4, 1, 1, 2, 0.94);
  p(5, 6, 3, 1, 1, 0.58);
  p(2, 8, 9, 5, 0, 0.9);
  p(4, 9, 5, 1, 2, 0.22);
  p(0, 9, 2, 1, 1, 0.72);
  p(11, 9, 2, 1, 1, 0.72);
  p(1, 10, 1, 2, 0, 0.72);
  p(11, 10, 1, 2, 0, 0.72);
  p(3, 13, 2, 2, 0, 0.86);
  p(8, 13, 2, 2, 0, 0.86);

  if (walk > 0) {
    p(3, 15, 3, 1, 0, 0.7);
    p(7, 15, 2, 1, 0, 0.52);
  } else {
    p(4, 15, 2, 1, 0, 0.52);
    p(8, 15, 3, 1, 0, 0.7);
  }

  if (dissolve > 0) {
    ctx.fillStyle = color((1 - dissolve) * 0.16);
    for (let i = 0; i < 14; i += 1) {
      const drift = i * 0.72 + bot.seed;
      const sx = left + Math.sin(drift) * 26 * dissolve + ((i % 5) - 2) * unit;
      const sy = top + 7 * unit + Math.cos(drift * 1.7) * 22 * dissolve + (i % 4) * unit;
      ctx.fillRect(px(sx, 2), px(sy, 2), 3, 3);
    }
  }
}

function spawnEasterEgg(event) {
  const now = performance.now();
  const x = event.clientX;
  const y = event.clientY;

  state.ripples.push({ x, y, born: now, duration: 1200 });
  state.bots.push({
    x,
    y,
    born: now + 300,
    life: 7600,
    seed: Math.random() * Math.PI * 2,
  });

  state.ripples = state.ripples.slice(-8);
  state.bots = state.bots.slice(-4);
}

function isAtPageBottom() {
  const scrollElement = document.scrollingElement || document.documentElement;
  const scrollTop = scrollElement.scrollTop;
  const viewport = window.innerHeight;
  const height = scrollElement.scrollHeight;
  return scrollTop + viewport >= height - 6;
}

function revealBottomPets() {
  if (!bottomPets || bottomPets.classList.contains("is-visible")) return;
  bottomPets.classList.add("is-visible");
  bottomPets.setAttribute("aria-hidden", "false");
}

function resetBottomRevealProgress() {
  bottomRevealProgress = 0;
}

function advanceBottomRevealProgress(amount) {
  if (!bottomPets || bottomPets.classList.contains("is-visible")) return;
  bottomRevealProgress += amount;
  if (bottomRevealProgress >= BOTTOM_REVEAL_DISTANCE) {
    revealBottomPets();
  }
}

function handleBottomWheel(event) {
  if (event.deltaY <= 0 || !isAtPageBottom()) {
    resetBottomRevealProgress();
    return;
  }

  advanceBottomRevealProgress(Math.min(event.deltaY, 120));
}

function handleBottomKey(event) {
  const keys = ["ArrowDown", "PageDown", "End", " "];
  if (keys.includes(event.key) && isAtPageBottom()) {
    advanceBottomRevealProgress(110);
  }
}

function handleTouchStart(event) {
  touchStartY = event.touches[0]?.clientY ?? null;
  lastTouchY = touchStartY;
}

function handleTouchMove(event) {
  if (touchStartY === null || lastTouchY === null) return;
  const currentY = event.touches[0]?.clientY ?? touchStartY;
  const downwardDistance = lastTouchY - currentY;
  lastTouchY = currentY;

  if (downwardDistance <= 0 || !isAtPageBottom()) {
    resetBottomRevealProgress();
    return;
  }

  advanceBottomRevealProgress(downwardDistance * 1.35);
}

function showPetMessage() {
  revealBottomPets();
  bottomPets?.classList.add("is-thanked");
}

function draw(time) {
  const t = time * 0.001;
  ctx.clearRect(0, 0, state.width, state.height);

  const step = 24;
  ctx.strokeStyle = "rgba(11,34,66,0.018)";
  ctx.lineWidth = 1;
  for (let x = 0; x < state.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, state.height);
    ctx.stroke();
  }
  for (let y = 0; y < state.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(state.width, y + 0.5);
    ctx.stroke();
  }

  state.cells.forEach((cell, i) => {
    const pulse = Math.sin(t * 1.7 + cell.phase);
    const mx = (state.mouse.x - 0.5) * (i % 3);
    const my = (state.mouse.y - 0.5) * (i % 4);
    const x = Math.round(cell.x + pulse * 3 + mx * 5);
    const y = Math.round(cell.y + Math.cos(t + cell.phase) * 2 + my * 4);
    const on = (Math.floor(t * 2 + i) % 9) !== 0;
    if (!on) return;
    ctx.fillStyle = cell.color;
    ctx.fillRect(x, y, cell.size, cell.size);
  });

  state.ripples.forEach((ripple) => drawRipple(ripple, time));
  state.bots.forEach((bot) => drawRobot(bot, time));
  state.ripples = state.ripples.filter((ripple) => time - ripple.born < ripple.duration);
  state.bots = state.bots.filter((bot) => time - bot.born < bot.life);

  const scanY = Math.round((t * 62) % state.height);
  ctx.fillStyle = "rgba(11,34,66,0.016)";
  ctx.fillRect(0, scanY, state.width, 1);

  ctx.fillStyle = "rgba(11,34,66,0.014)";
  const blockX = Math.round(state.mouse.x * state.width / 16) * 16;
  const blockY = Math.round(state.mouse.y * state.height / 16) * 16;
  ctx.fillRect(blockX - 24, blockY - 24, 48, 48);

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  state.mouse.x = event.clientX / Math.max(window.innerWidth, 1);
  state.mouse.y = event.clientY / Math.max(window.innerHeight, 1);
});
window.addEventListener("dblclick", spawnEasterEgg);
window.addEventListener("wheel", handleBottomWheel, { passive: true });
window.addEventListener("keydown", handleBottomKey);
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchmove", handleTouchMove, { passive: true });
petButtons.forEach((button) => button.addEventListener("click", showPetMessage));

renderSprites();
resize();
requestAnimationFrame(draw);
