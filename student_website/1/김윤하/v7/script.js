// ==========================================
// 오드아이 고양이 달리기 & 돌고래 슬라이딩 로직 (v7)
// 난이도 하향 조정 + 귀여운 돌고래 장애물 및 충돌 검사
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
// 게임 상수 및 하향 조정된 난이도 설정
// ------------------------------------------
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

const SAND_HEIGHT = CANVAS_HEIGHT / 3; // 150px
const GROUND_Y = CANVAS_HEIGHT - SAND_HEIGHT; // y = 300

const NORMAL_CAT_HEIGHT = 46;
const SLIDE_CAT_HEIGHT = 24;
const CAT_WIDTH = 58;
const GRAVITY = 0.65;
const JUMP_FORCE = -13.5;

// ⭐ 난이도 하향 조정: 초기 속도를 6.0 -> 4.5로 낮추고 속도 증가도 천천히!
const INITIAL_BASE_SPEED = 4.5;
let isGameRunning = false;
let distanceRan = 0;
let score = 0;
let highScore = 0;
let gameSpeed = INITIAL_BASE_SPEED;
let baseSpeed = INITIAL_BASE_SPEED;
let frameCount = 0;
let animationId = null;

let isDownKeyPressed = false;

try {
  const saved = localStorage.getItem('catDinoHighScore');
  if (saved) highScore = parseInt(saved, 10) || 0;
} catch (e) {}

// 오드아이 고양이 객체
const cat = {
  x: 100,
  y: GROUND_Y - NORMAL_CAT_HEIGHT,
  width: CAT_WIDTH,
  height: NORMAL_CAT_HEIGHT,
  vy: 0,
  isJumping: false,
  isSliding: false
};

// 장애물 배열 및 스폰 관리
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
      speed: (Math.random() * 1.2 + 0.6) * (Math.random() < 0.5 ? 1 : -1),
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
  nextObstacleTimer = 60; // 초반 여유로운 스폰 타이머

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
// 점프 처리
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
// 🐬 장애물 스폰 (바닥 장애물 3종 + 위로 다니는 귀여운 돌고래 🐬)
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
    type = 'dolphin'; // 🐬 위로 다니는 귀여운 돌고래!
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
  } else if (type === 'dolphin') {
    // 🐬 돌고래는 위로 다니며 여유있게 떠다님 (y = GROUND_Y - 82px)
    width = 64;
    height = 36;
    spawnY = GROUND_Y - 82; // 밑의 여유 공간 46px -> 슬라이딩(24px)으로 통과! 서있으면 부딪힘!
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

  // 헤엄치는 물고기들
  fishes.forEach(f => {
    f.x += f.speed;
    if (f.speed > 0 && f.x > CANVAS_WIDTH + 50) f.x = -50;
    if (f.speed < 0 && f.x < -50) f.x = CANVAS_WIDTH + 50;

    const fx = Math.floor(f.x);
    const fy = Math.floor(f.y + Math.sin(frameCount * 0.1 + f.seed) * 5);
    const dir = f.speed > 0 ? 1 : -1;

    ctx.save();
    if (f.type === 'nemo') {
      drawPixelRect(fx, fy, 20, 12, '#ff6b35');
      drawPixelRect(fx + 6, fy, 4, 12, '#ffffff');
      drawPixelRect(fx + 14, fy, 3, 12, '#ffffff');
      drawPixelRect(fx + (dir > 0 ? 16 : 2), fy + 3, 3, 3, '#000000');
    } else if (f.type === 'jelly') {
      const jellyBob = Math.floor(Math.sin(frameCount * 0.18 + f.seed) * 4);
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

// 3. 🐬 귀여운 픽셀 돌고래 장애물 & 바닥 장애물
function drawObstacles() {
  obstacles.forEach(obs => {
    ctx.save();
    const x = Math.floor(obs.x);
    const y = Math.floor(obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'dolphin') {
      // 🐬 귀여운 분홍/청록 픽셀 돌고래!
      // 몸통
      drawPixelRect(x + 12, y + 4, w - 24, h - 8, '#48cae4');
      drawPixelRect(x + 20, y, w - 36, 4, '#48cae4'); // 등
      drawPixelRect(x + 16, y + h - 6, w - 32, 6, '#caf0f8'); // 배 (하얀 연청록)

      // 귀여운 돌고래 부둥코 (주둥이)
      drawPixelRect(x + w - 14, y + 10, 14, 12, '#48cae4');
      drawPixelRect(x + w - 6, y + 16, 6, 6, '#48cae4');

      // 등 지느러미
      drawPixelRect(x + 24, y - 8, 10, 10, '#00b4d8');

      // 꼬리 지느러미
      drawPixelRect(x - 8, y + 6, 12, 16, '#48cae4');
      drawPixelRect(x - 14, y + 2, 8, 8, '#00b4d8');
      drawPixelRect(x - 14, y + 16, 8, 8, '#00b4d8');

      // 돌고래 귀여운 웃는 눈 & 핑크 뺨
      drawPixelRect(x + w - 22, y + 8, 4, 4, '#000000');
      drawPixelRect(x + w - 21, y + 9, 2, 2, '#ffffff'); // 반사광
      drawPixelRect(x + w - 26, y + 14, 4, 3, '#ffb5a7'); // 볼터치

      // 돌고래가 튀기는 예쁜 물방울
      const splash = Math.sin(frameCount * 0.25 + x) * 3;
      drawPixelRect(x + w - 2, y - 6 + splash, 4, 4, '#caf0f8');
      drawPixelRect(x + 12, y - 10 + splash, 3, 3, '#90e0ef');

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
// 컨트롤 업데이트 (아래 방향키 슬라이딩)
// ------------------------------------------
function updateControls() {
  if (!isGameRunning) return;

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
    if (cat.isSliding) {
      cat.isSliding = false;
      cat.height = NORMAL_CAT_HEIGHT;
      cat.y = GROUND_Y - NORMAL_CAT_HEIGHT;
    }
  }
}

// ------------------------------------------
// 메인 게임 업데이트 & 완화된 속도/스폰 조절
// ------------------------------------------
function updateGame() {
  frameCount++;

  // ⭐ 완화된 난이도: 속도 증가율을 0.0015 -> 0.0006으로 2배 이상 완화!
  gameSpeed += 0.0006;

  updateControls();

  // 거리 점수
  distanceRan += gameSpeed * 0.12;
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

  // 점프
  cat.y += cat.vy;
  cat.vy += GRAVITY;

  // 착지
  if (cat.y >= GROUND_Y - cat.height) {
    cat.y = GROUND_Y - cat.height;
    cat.vy = 0;
    cat.isJumping = false;
  }

  // ⭐ 완화된 장애물 여유 스폰 (minGap = 65, 여유있게 피함)
  nextObstacleTimer -= 1;
  if (nextObstacleTimer <= 0) {
    spawnObstacle();

    let minGap = 65;
    let maxGap = 100;

    if (gameSpeed >= 6.5) {
      const speedFactor = (gameSpeed - 6.5) * 6;
      minGap = 75 + speedFactor;
      maxGap = 115 + speedFactor;
    }

    const randomGap = (Math.random() * (maxGap - minGap) + minGap);
    nextObstacleTimer = randomGap / (gameSpeed / baseSpeed);
  }

  // 장애물 이동 및 ⭐ 충돌 검사 (돌고래 포함!)
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    if (obs.x + obs.width < -40) {
      obstacles.splice(i, 1);
    }

    // ⭐ AABB Hitbox 충돌 검사 (돌고래와 부딪히면 당연히 GAME OVER!)
    const padding = 5;
    if (
      cat.x + padding < obs.x + obs.width - padding &&
      cat.x + cat.width - padding > obs.x + padding &&
      cat.y + padding < obs.y + obs.height - padding &&
      cat.y + cat.height - padding > obs.y + padding
    ) {
      // 💥 부딪힘! 게임 오버!
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
// 키보드 이벤트
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

// 모바일 컨트롤러
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
