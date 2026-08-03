const game = document.getElementById("game");
const player = document.getElementById("player");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const pauseBtn = document.getElementById("pauseBtn");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");

const state = {
  running: false,
  gameOver: false,
  score: 0,
  bestScore: Number(localStorage.getItem("dodge-best-score") || 0),
  playerX: 0,
  playerSpeed: 8,
  blocks: [],
  keys: {
    left: false,
    right: false
  },
  lastTime: 0,
  spawnTimer: 0,
  spawnDelay: 900,
  speed: 4
};

bestScoreEl.textContent = state.bestScore;

function getGameBounds() {
  return game.getBoundingClientRect();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updatePlayerPosition() {
  const bounds = getGameBounds();
  const playerWidth = player.offsetWidth;
  const x = clamp(state.playerX, 0, bounds.width - playerWidth);
  player.style.left = `${x}px`;
  player.style.transform = "none";
}

function resetPlayer() {
  const bounds = getGameBounds();
  state.playerX = bounds.width / 2 - player.offsetWidth / 2;
  updatePlayerPosition();
}

function setOverlay(visible, title = "", text = "", buttonText = "Start Game") {
  overlay.classList.toggle("hidden", !visible);
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = buttonText;
}

function resetGame() {
  state.running = false;
  state.gameOver = false;
  state.score = 0;
  state.blocks.forEach(block => block.element.remove());
  state.blocks = [];
  state.spawnTimer = 0;
  state.spawnDelay = 900;
  state.speed = 4;
  scoreEl.textContent = "0";
  resetPlayer();
  setOverlay(true, "Ready?", "Press Start to begin. Use ← → or A/D to dodge the falling blocks.", "Start Game");
}

function startGame() {
  if (state.running) return;
  if (state.gameOver) {
    resetGame();
  }
  state.running = true;
  setOverlay(true, "Go!", "Dodge the blocks and survive as long as you can.", "Resume");
  overlay.classList.add("hidden");
  game.focus();
  state.lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  state.running = false;
  state.gameOver = true;

  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    localStorage.setItem("dodge-best-score", String(state.bestScore));
    bestScoreEl.textContent = state.bestScore;
  }

  setOverlay(
    true,
    "Game Over",
    `Your score: ${state.score}. Press Start to play again.`,
    "Play Again"
  );
}

function createBlock() {
  const bounds = getGameBounds();
  const block = document.createElement("div");
  block.className = "block";

  const size = 28 + Math.random() * 20;
  const x = Math.random() * (bounds.width - size);
  block.style.width = `${size}px`;
  block.style.height = `${size}px`;
  block.style.left = `${x}px`;

  game.appendChild(block);

  state.blocks.push({
    element: block,
    x,
    y: -size,
    size,
    speed: state.speed + Math.random() * 2.5
  });
}

function rectsOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function checkCollision() {
  const playerRect = player.getBoundingClientRect();

  return state.blocks.some(block => {
    const blockRect = block.element.getBoundingClientRect();
    return rectsOverlap(playerRect, blockRect);
  });
}

function updateBlocks(delta) {
  state.spawnTimer += delta;

  if (state.spawnTimer >= state.spawnDelay) {
    state.spawnTimer = 0;
    createBlock();

    if (state.spawnDelay > 360) state.spawnDelay -= 12;
    if (state.speed < 10) state.speed += 0.08;
  }

  const bounds = getGameBounds();

  state.blocks = state.blocks.filter(block => {
    block.y += block.speed * (delta / 16.67);
    block.element.style.transform = `translateY(${block.y}px)`;

    if (block.y > bounds.height + 80) {
      block.element.remove();
      state.score += 1;
      scoreEl.textContent = String(state.score);
      return false;
    }

    return true;
  });
}

function updatePlayer(delta) {
  const bounds = getGameBounds();
  const movement = state.playerSpeed * (delta / 16.67);

  if (state.keys.left) state.playerX -= movement;
  if (state.keys.right) state.playerX += movement;

  state.playerX = clamp(state.playerX, 0, bounds.width - player.offsetWidth);
  updatePlayerPosition();
}

function loop(timestamp) {
  if (!state.running) return;

  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;

  updatePlayer(delta);
  updateBlocks(delta);

  if (checkCollision()) {
    endGame();
    return;
  }

  requestAnimationFrame(loop);
}

function moveLeft() {
  state.keys.left = true;
  setTimeout(() => (state.keys.left = false), 120);
}

function moveRight() {
  state.keys.right = true;
  setTimeout(() => (state.keys.right = false), 120);
}

window.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    state.keys.left = true;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    state.keys.right = true;
  }
  if ((event.key === " " || event.key === "Enter") && !state.running) {
    event.preventDefault();
    startGame();
  }
  if (event.key === "Escape") {
    resetGame();
  }
});

window.addEventListener("keyup", event => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    state.keys.left = false;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    state.keys.right = false;
  }
});

startBtn.addEventListener("click", () => {
  if (state.gameOver) {
    resetGame();
  }
  overlay.classList.add("hidden");
  state.running = true;
  game.focus();
  state.lastTime = performance.now();
  requestAnimationFrame(loop);
});

leftBtn.addEventListener("pointerdown", moveLeft);
rightBtn.addEventListener("pointerdown", moveRight);
pauseBtn.addEventListener("click", resetGame);

window.addEventListener("resize", () => {
  updatePlayerPosition();
});

bestScoreEl.textContent = state.bestScore;
resetGame();
