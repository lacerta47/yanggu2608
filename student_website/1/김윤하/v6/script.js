// ==========================================
// 오드아이 고양이 달리기 & 슬라이딩 로직 (v6)
// 키 조작: 스페이스바 = 점프 / 아래 방향키(▼) = 슬라이딩
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('scoreDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const speedDisplay = document.getElementById('speedDisplay');

const startOverlay = document.getElementById('startOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const btnJump = document.getElementById('btnJump');
const btnSlide = document.getElementById('btnSlide');

// ------------------------------------------
// 웹 오디오 API (사운드 효과 생성기)
// ------------------------------------------
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.13);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'slide') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'checkpoint') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // 예외 무시
  }
}

// ------------------------------------------
// 게임 상수 및 설정
// ------------------------------------------
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

const SAND_HEIGHT = CANVAS_HEIGHT / 3; // 150px
const GROUND_Y = CANVAS_HEIGHT - SAND_HEIGHT; // y = 300

const NORMAL_CAT_HEIGHT = 46;
const SLIDE_CAT_HEIGHT = 24;
const CAT_WIDTH = 58;
const GRAVITY = 0.68;
const JUMP_FORCE = -13.8;

// 게임 상태 변수
let isGameRunning = false;
let distanceRan = 0;
let score = 0;
let highScore = 0;
let gameSpeed = 6.0;
let baseSpeed = 6.0;
let frameCount = 0;
let animationId = null;

// 키 상태 관리 (아래 방향키 = 슬라이딩)
let isDownKeyPressed = false;

try {
  const saved = localStorage.getItem('catDinoHighScore');
  if (saved) highScore = parseInt(saved, 10) || 0;
} catch (e) {}

// 귀여운 오드아이 고양이 객체
const cat = {
  x: 100,
  y: GROUND_Y - NORMAL_CAT_HEIGHT,
  width: CAT_WIDTH,
  height: NORMAL_CAT_HEIGHT,
  vy: 0,
  isJumping: false,
  isSliding: false
};

// 장애물 배열 및 타이머
let obstacles = [];
let nextObstacleTimer = 0;

// 바닷속 친구들 & 모래사장 데코레이션
let fishes = [];
let sandDecorations = [];

function initFishes() {
  fishes = [];
  const types = ['nemo', 'jelly', 'dory', 'yellow'];
  for (let i = 0; i < 9; i++) {
    fishes.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * (GROUND_Y - 90) + 30,
      type: types[i % types.length],
      speed: (Math.random() * 1.4 + 0.7) * (Math.random() < 0.5 ? 1 : -1),
      seed: Math.random() * 100
    });
  }
}

function initSandDecorations() {
  sandDecorations = [];
  for (let x = 20; x < CANVAS_WIDTH + 800; x += Math.random() * 90 + 70) {
    const types = ['starfish', 'tinyShell', 'pebble', 'sparkle'];
    sandDecorations.push({
      x: x,
      y: GROUND_Y + 15 + Math.random() * 100,
      type: types[Math.floor(Math.random() * types.length)],
      color: ['#ff758f', '#ffb703', '#e76f51', '#4cc9f0'][Math.floor(Math.random() * 4)]
    });
  }
}

// ------------------------------------------
// 게임 초기화
// ------------------------------------------
function initGame() {
  distanceRan = 0;
  score = 0;
  gameSpeed = baseSpeed;
  frameCount = 0;
  obstacles = [];
  nextObstacleTimer = 45;

  cat.height = NORMAL_CAT_HEIGHT;
  cat.y = GROUND_Y - cat.height;
  cat.vy = 0;
  cat.isJumping = false;
  cat.isSliding = false;

  isDownKeyPressed = false;

  initFishes();
  initSandDecorations();
  updateUI();
}

function padZero(num, size = 5) {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

function updateUI() {
  scoreDisplay.textContent = padZero(score);
  highScoreDisplay.textContent = padZero(highScore);
  const speedRatio = (gameSpeed / baseSpeed).toFixed(1);
  speedDisplay.textContent = speedRatio + 'x';
}

// ------------------------------------------
// 점프 처리 (스페이스바)
// ------------------------------------------
function triggerJump() {
  if (!isGameRunning) return;
  if (!cat.isJumping && !cat.isSliding) {
    initAudio();
    cat.vy = JUMP_FORCE;
    cat.isJumping = true;
    playSound('jump');
  }
}

// ------------------------------------------
// 장애물 스폰 (바닥 장애물 + 위로 다니는 고래 🐋)
// ------------------------------------------
function spawnObstacle() {
  const rand = Math.random();
  let type = 'shell';

  if (rand < 0.35) {
    type = 'shell';
  } else if (rand < 0.65) {
    type = 'seaweed';
  } else if (rand < 0.82) {
    type = 'coral';
  } else {
    type = 'whale'; // 🐋 위로 다니는 고래!
  }

  let width = 38;
  let height = 34;
  let spawnY = GROUND_Y - height;

  if (type === 'shell') {
    width = 38; height = 34; spawnY = GROUND_Y - height;
  } else if (type === 'seaweed') {
    width = 34; height = 58; spawnY = GROUND_Y - height;
  } else if (type === 'coral') {
    width = 46; height = 50; spawnY = GROUND_Y - height;
  } else if (type === 'whale') {
    // 고래는 위로 다님 (y = GROUND_Y - 78px) -> 아래 방향키 슬라이딩으로 통과!
    width = 65;
    height = 36;
    spawnY = GROUND_Y - 78;
  }

  obstacles.push({
    x: CANVAS_WIDTH + 20,
    y: spawnY,
    width: width,
    height: height,
    type: type
  });
}

function drawPixelRect(px, py, pw, ph, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(px), Math.floor(py), Math.floor(pw), Math.floor(ph));
}

// ------------------------------------------
// 렌더링 함수들
// ------------------------------------------

// 1. 바다 & 모래사장
function drawBackground() {
  ctx.fillStyle = '#0077b6';
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
  ctx.fillStyle = '#0096c7';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 75);
  ctx.fillStyle = '#03045e';
  ctx.fillRect(0, GROUND_Y - 25, CANVAS_WIDTH, 25);

  // 물고기들
  fishes.forEach(f => {
    f.x += f.speed;
    if (f.speed > 0 && f.x > CANVAS_WIDTH + 50) f.x = -50;
    if (f.speed < 0 && f.x < -50) f.x = CANVAS_WIDTH + 50;

    const fx = Math.floor(f.x);
    const fy = Math.floor(f.y + Math.sin(frameCount * 0.12 + f.seed) * 6);
    const dir = f.speed > 0 ? 1 : -1;

    ctx.save();
    if (f.type === 'nemo') {
      drawPixelRect(fx, fy, 20, 12, '#ff6b35');
      drawPixelRect(fx + 6, fy, 4, 12, '#ffffff');
      drawPixelRect(fx + 14, fy, 3, 12, '#ffffff');
      drawPixelRect(fx + (dir > 0 ? 16 : 2), fy + 3, 3, 3, '#000000');
    } else if (f.type === 'jelly') {
      const jellyBob = Math.floor(Math.sin(frameCount * 0.2 + f.seed) * 4);
      drawPixelRect(fx, fy + jellyBob, 16, 10, '#f72585');
      drawPixelRect(fx + 2, fy - 3 + jellyBob, 12, 4, '#ff758f');
      drawPixelRect(fx + 2, fy + 10 + jellyBob, 3, 6, '#b5179e');
    } else if (f.type === 'dory') {
      drawPixelRect(fx, fy, 22, 14, '#48cae4');
      drawPixelRect(fx + 4, fy + 3, 8, 8, '#023e8a');
      drawPixelRect(dir > 0 ? fx - 5 : fx + 22, fy + 3, 5, 8, '#ffb703');
    } else {
      drawPixelRect(fx, fy, 16, 10, '#ffb703');
    }
    ctx.restore();
  });

  // 노란 모래 바닥
  drawPixelRect(0, GROUND_Y, CANVAS_WIDTH, SAND_HEIGHT, '#ffb703');
  drawPixelRect(0, GROUND_Y, CANVAS_WIDTH, 8, '#fb8500');
  drawPixelRect(0, GROUND_Y + 45, CANVAS_WIDTH, 6, '#e09f3e');

  // 모래사장 데코레이션
  sandDecorations.forEach(dec => {
    dec.x -= gameSpeed * 0.8;
    if (dec.x < -40) dec.x += CANVAS_WIDTH + 800;

    const dx = Math.floor(dec.x);
    const dy = Math.floor(dec.y);

    if (dec.type === 'starfish') {
      drawPixelRect(dx, dy, 12, 12, dec.color);
      drawPixelRect(dx + 4, dy - 3, 4, 4, dec.color);
      drawPixelRect(dx + 4, dy + 11, 4, 4, dec.color);
    } else if (dec.type === 'tinyShell') {
      drawPixelRect(dx, dy, 10, 8, '#ffc6ff');
    } else if (dec.type === 'pebble') {
      drawPixelRect(dx, dy, 12, 6, '#94a3b8');
    } else {
      const spark = Math.sin(frameCount * 0.2 + dx) > 0 ? '#ffffff' : '#fbbf24';
      drawPixelRect(dx, dy, 4, 4, spark);
    }
  });
}

// 2. 🎀 오드아이 고양이 그리기
function drawCat() {
  const x = Math.floor(cat.x);
  const y = Math.floor(cat.y);

  ctx.save();

  if (cat.isSliding) {
    // 💨 슬라이딩 자세
    drawPixelRect(x, GROUND_Y - 3, 62, 3, 'rgba(180, 100, 20, 0.35)');
    drawPixelRect(x, y + 4, 52, 18, '#ffffff');

    drawPixelRect(x + 36, y, 20, 18, '#ffffff');
    drawPixelRect(x + 34, y - 4, 5, 6, '#ffffff');
    drawPixelRect(x + 48, y - 4, 5, 6, '#ffffff');
    drawPixelRect(x + 36, y - 2, 3, 4, '#ffb5a7');
    drawPixelRect(x + 46, y - 2, 3, 4, '#ffb5a7');

    drawPixelRect(x + 40, y + 4, 4, 5, '#00b4d8');
    drawPixelRect(x + 48, y + 4, 4, 5, '#ffb703');
    drawPixelRect(x + 41, y + 5, 1, 1, '#ffffff');
    drawPixelRect(x + 49, y + 5, 1, 1, '#ffffff');

    drawPixelRect(x + 53, y + 8, 3, 2, '#ff758f');
    drawPixelRect(x + 42, y + 10, 4, 2, '#ffadad');

    drawPixelRect(x - 10, y + 6, 12, 4, '#ffffff');
    drawPixelRect(x - 12, y + 4, 4, 4, '#ff758f');

    const dustX = x - (frameCount % 3) * 8;
    drawPixelRect(dustX, GROUND_Y - 8, 6, 4, 'rgba(255, 255, 255, 0.7)');
    drawPixelRect(dustX - 8, GROUND_Y - 5, 4, 3, 'rgba(255, 255, 255, 0.5)');

  } else {
    // 🏃‍♂️ 서서 달리는 자세
    if (!cat.isJumping) {
      drawPixelRect(x + 6, GROUND_Y - 4, 46, 4, 'rgba(180, 100, 20, 0.3)');
    }

    drawPixelRect(x + 12, y + 12, 34, 22, '#ffffff');
    drawPixelRect(x + 16, y + 8, 26, 6, '#ffffff');
    drawPixelRect(x + 36, y + 2, 20, 20, '#ffffff');

    drawPixelRect(x + 36, y - 6, 6, 8, '#ffffff');
    drawPixelRect(x + 48, y - 6, 6, 8, '#ffffff');
    drawPixelRect(x + 38, y - 4, 3, 5, '#ffb5a7');
    drawPixelRect(x + 50, y - 4, 3, 5, '#ffb5a7');

    const eyeY = y + 8;
    drawPixelRect(x + 40, eyeY, 5, 7, '#00b4d8');
    drawPixelRect(x + 41, eyeY + 1, 2, 2, '#ffffff');
    drawPixelRect(x + 48, eyeY, 5, 7, '#ffb703');
    drawPixelRect(x + 49, eyeY + 1, 2, 2, '#ffffff');

    drawPixelRect(x + 55, eyeY + 5, 3, 2, '#ff758f');
    drawPixelRect(x + 42, eyeY + 8, 4, 2, '#ffadad');

    const tailWave = Math.floor(Math.sin(frameCount * 0.25) * 4);
    drawPixelRect(x + 4, y + 10 + tailWave, 8, 4, '#ffffff');
    drawPixelRect(x, y + 2 + tailWave, 6, 9, '#ffffff');
    drawPixelRect(x - 2, y + tailWave, 4, 4, '#ff758f');

    const legCycle = cat.isJumping ? 0 : frameCount * 0.35;
    const frontLeftOffset = Math.sin(legCycle) * 7;
    const frontRightOffset = Math.sin(legCycle + Math.PI) * 7;
    const backLeftOffset = Math.sin(legCycle + Math.PI) * 7;
    const backRightOffset = Math.sin(legCycle) * 7;
    const legY = y + 32;

    if (cat.isJumping) {
      drawPixelRect(x + 14, legY, 5, 8, '#e2e8f0');
      drawPixelRect(x + 22, legY, 5, 8, '#ffffff');
      drawPixelRect(x + 34, legY, 5, 8, '#e2e8f0');
      drawPixelRect(x + 42, legY, 5, 8, '#ffffff');
    } else {
      drawPixelRect(x + 14 + backLeftOffset, legY, 5, 12, '#cbd5e1');
      drawPixelRect(x + 36 + frontLeftOffset, legY, 5, 12, '#cbd5e1');
      drawPixelRect(x + 20 + backRightOffset, legY, 5, 12, '#ffffff');
      drawPixelRect(x + 42 + frontRightOffset, legY, 5, 12, '#ffffff');
      drawPixelRect(x + 14 + backLeftOffset, legY + 10, 5, 3, '#ffc6ff');
      drawPixelRect(x + 20 + backRightOffset, legY + 10, 5, 3, '#ffc6ff');
      drawPixelRect(x + 36 + frontLeftOffset, legY + 10, 5, 3, '#ffc6ff');
      drawPixelRect(x + 42 + frontRightOffset, legY + 10, 5, 3, '#ffc6ff');
    }
  }

  ctx.restore();
}

// 3. 🐋 장애물 (위로 다니는 고래 & 바닥 장애물)
function drawObstacles() {
  obstacles.forEach(obs => {
    ctx.save();
    const x = Math.floor(obs.x);
    const y = Math.floor(obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'whale') {
      // 🐋 위로 다니는 파란 고래
      drawPixelRect(x + 8, y, w - 16, h, '#3a86ff');
      drawPixelRect(x + 16, y - 6, w - 32, 6, '#3a86ff');
      drawPixelRect(x + 12, y + h - 8, w - 24, 8, '#80b918');

      drawPixelRect(x - 8, y + 4, 10, 16, '#3a86ff');
      drawPixelRect(x - 12, y + 2, 6, 8, '#0077b6');
      drawPixelRect(x - 12, y + 14, 6, 8, '#0077b6');

      drawPixelRect(x + w - 18, y + 10, 4, 4, '#ffffff');
      drawPixelRect(x + w - 16, y + 11, 2, 2, '#000000');

      const waterSplash = Math.sin(frameCount * 0.3 + x) * 4;
      drawPixelRect(x + 24, y - 14 + waterSplash, 4, 8, '#48cae4');
      drawPixelRect(x + 28, y - 18 + waterSplash, 4, 6, '#90e0ef');

    } else if (obs.type === 'shell') {
      drawPixelRect(x + 4, y + 8, w - 8, h - 8, '#ffb5a7');
      drawPixelRect(x + 8, y + 2, w - 16, 6, '#ffb5a7');
      drawPixelRect(x + 12, y + 14, 4, 12, '#f8ad9d');
      drawPixelRect(x + 22, y + 14, 4, 12, '#f8ad9d');
      drawPixelRect(x + 12, y + 8, 3, 3, '#000000');
      drawPixelRect(x + 24, y + 8, 3, 3, '#000000');
      drawPixelRect(x + 16, y + 16, 6, 6, '#ffffff');
      drawPixelRect(x + 16, y, 6, 4, '#ff477e');

    } else if (obs.type === 'seaweed') {
      const wave = Math.floor(Math.sin(frameCount * 0.2 + x) * 4);
      drawPixelRect(x + 6 + wave, y, 10, h, '#52b788');
      drawPixelRect(x + 14 - wave, y + 10, 10, h - 10, '#74c69d');
      drawPixelRect(x + 2 + wave, y + 20, 8, h - 20, '#2d6a4f');
      drawPixelRect(x + 8 + wave, y + 14, 2, 2, '#000000');
      drawPixelRect(x + 12 + wave, y + 14, 2, 2, '#000000');

    } else if (obs.type === 'coral') {
      drawPixelRect(x + 6, y + 16, w - 12, h - 16, '#f72585');
      drawPixelRect(x + 4, y, 10, 18, '#f72585');
      drawPixelRect(x + 18, y + 6, 10, 14, '#b5179e');
      drawPixelRect(x + 30, y + 2, 10, 16, '#7209b7');
      drawPixelRect(x + 18, y + 22, 8, 8, '#ffb703');
    }

    ctx.restore();
  });
}

// ------------------------------------------
// 아래 방향키(▼) 슬라이딩 상태 처리
// ------------------------------------------
function updateControls() {
  if (!isGameRunning) return;

  // 아래 방향키를 누르고 있으면 슬라이딩!
  if (isDownKeyPressed) {
    if (!cat.isJumping) {
      if (!cat.isSliding) {
        cat.isSliding = true;
        cat.height = SLIDE_CAT_HEIGHT;
        cat.y = GROUND_Y - SLIDE_CAT_HEIGHT;
        playSound('slide');
      }
    }
  } else {
    // 방향키를 떼면 정상 서 있는 자세로 복귀
    if (cat.isSliding) {
      cat.isSliding = false;
      cat.height = NORMAL_CAT_HEIGHT;
      cat.y = GROUND_Y - NORMAL_CAT_HEIGHT;
    }
  }
}

// ------------------------------------------
// 메인 게임 업데이트
// ------------------------------------------
function updateGame() {
  frameCount++;
  gameSpeed += 0.0015;

  updateControls();

  // 거리 점수
  distanceRan += gameSpeed * 0.15;
  const newScore = Math.floor(distanceRan);

  if (Math.floor(newScore / 100) > Math.floor(score / 100) && newScore > 0) {
    playSound('checkpoint');
  }

  score = newScore;
  if (score > highScore) {
    highScore = score;
    try {
      localStorage.setItem('catDinoHighScore', highScore);
    } catch (e) {}
  }
  updateUI();

  // 점프 처리
  cat.y += cat.vy;
  cat.vy += GRAVITY;

  // 착지
  if (cat.y >= GROUND_Y - cat.height) {
    cat.y = GROUND_Y - cat.height;
    cat.vy = 0;
    cat.isJumping = false;
  }

  // 속도가 빨라지면 장애물 간격 확장
  nextObstacleTimer -= 1;
  if (nextObstacleTimer <= 0) {
    spawnObstacle();

    let minGap = 42;
    let maxGap = 72;

    if (gameSpeed >= 8.0) {
      const speedFactor = (gameSpeed - 8.0) * 8;
      minGap = 65 + speedFactor;
      maxGap = 105 + speedFactor;
    }

    const randomGap = (Math.random() * (maxGap - minGap) + minGap);
    nextObstacleTimer = randomGap / (gameSpeed / baseSpeed);
  }

  // 장애물 이동 및 충돌 검사
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    if (obs.x + obs.width < -40) {
      obstacles.splice(i, 1);
    }

    // Hitbox 충돌 검사
    const padding = 6;
    if (
      cat.x + padding < obs.x + obs.width - padding &&
      cat.x + cat.width - padding > obs.x + padding &&
      cat.y + padding < obs.y + obs.height - padding &&
      cat.y + cat.height - padding > obs.y + padding
    ) {
      // 💥 충돌! 게임 오버!
      gameOver();
      return;
    }
  }
}

// ------------------------------------------
// 게임 루프 & 종료
// ------------------------------------------
function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (isGameRunning) {
    updateGame();
  }

  drawBackground();
  drawObstacles();
  drawCat();

  if (isGameRunning) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function gameOver() {
  isGameRunning = false;
  cancelAnimationFrame(animationId);
  playSound('hit');

  finalScore.textContent = padZero(score);
  resultModal.classList.remove('hidden');
}

function startGame() {
  startOverlay.classList.add('hidden');
  resultModal.classList.add('hidden');
  initGame();
  isGameRunning = true;
  gameLoop();
}

// ------------------------------------------
// ⭐ 키보드 이벤트: 스페이스바 = 점프 / 아래 방향키(▼) = 슬라이딩
// ------------------------------------------
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    if (!isGameRunning) {
      startGame();
    } else {
      triggerJump();
    }
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    if (isGameRunning) {
      isDownKeyPressed = true;
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    isDownKeyPressed = false;
  }
});

// 모바일 전용 버튼 (점프 / 슬라이드)
btnJump.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!isGameRunning) startGame();
  else triggerJump();
});

btnSlide.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (isGameRunning) {
    isDownKeyPressed = true;
  }
});

btnSlide.addEventListener('pointerup', (e) => {
  e.preventDefault();
  isDownKeyPressed = false;
});

btnSlide.addEventListener('pointerleave', (e) => {
  e.preventDefault();
  isDownKeyPressed = false;
});

startGameBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundToggleBtn.textContent = '🔊 소리 켜짐';
    initAudio();
  } else {
    soundToggleBtn.textContent = '🔇 소리 끔';
  }
});

// 초기 렌더링
initGame();
drawBackground();
drawCat();
