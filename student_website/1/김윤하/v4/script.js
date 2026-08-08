// ==========================================
// 귀여운 바다 오드아이 고양이 달리기 로직 (v4)
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
      // 8비트 레트로 귀여운 점프음
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.13);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'checkpoint') {
      // 100점 달성 시 띵동 소리 (공룡 게임 방식!)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'hit') {
      // 부딪혔을 때 쿵 소리
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // 차단 시 예외 무시
  }
}

// ------------------------------------------
// 게임 상수 및 설정
// ------------------------------------------
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

// 바닥 레이아웃: 화면 높이 1/3 (150px) 노란 모래 바닥!
const SAND_HEIGHT = CANVAS_HEIGHT / 3; // 150px
const GROUND_Y = CANVAS_HEIGHT - SAND_HEIGHT; // y = 300

// 고양이 물리 설정
const CAT_WIDTH = 58;
const CAT_HEIGHT = 46;
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

// 로컬 스토리지 하이스코어 불러오기
try {
  const saved = localStorage.getItem('catDinoHighScore');
  if (saved) highScore = parseInt(saved, 10) || 0;
} catch (e) {}

// 귀여운 오드아이 고양이 객체
const cat = {
  x: 100,
  y: GROUND_Y - CAT_HEIGHT,
  width: CAT_WIDTH,
  height: CAT_HEIGHT,
  vy: 0,
  isJumping: false,
  blinkTimer: 0
};

// 장애물 배열 및 스폰 관리
let obstacles = [];
let nextObstacleTimer = 0;

// ------------------------------------------
// 🐟 디테일하고 귀여운 바닷속 친구들 (물고기, 해파리 등)
// ------------------------------------------
let fishes = [];
const FISH_TYPES = ['nemo', 'jelly', 'dory', 'yellow'];

function initFishes() {
  fishes = [];
  for (let i = 0; i < 9; i++) {
    fishes.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * (GROUND_Y - 90) + 30,
      type: FISH_TYPES[i % FISH_TYPES.length],
      speed: (Math.random() * 1.4 + 0.7) * (Math.random() < 0.5 ? 1 : -1),
      seed: Math.random() * 100
    });
  }
}

// ------------------------------------------
// 🐚 화려하게 꾸며진 모래사장 데코레이션 요소
// ------------------------------------------
let sandDecorations = [];
function initSandDecorations() {
  sandDecorations = [];
  // 모래사장에 일정 간격으로 불가사리, 조개, 조약돌 배치
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

  cat.y = GROUND_Y - cat.height;
  cat.vy = 0;
  cat.isJumping = false;
  cat.blinkTimer = 0;

  initFishes();
  initSandDecorations();
  updateUI();
}

// 5자리 숫자 0 채우기 (공룡 게임 점수 표시 방식: 00120)
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
// 점프 제어
// ------------------------------------------
function triggerJump() {
  if (!isGameRunning) return;
  if (!cat.isJumping) {
    initAudio();
    cat.vy = JUMP_FORCE;
    cat.isJumping = true;
    playSound('jump');
  }
}

// ------------------------------------------
// 장애물 생성 (디테일해진 조개, 미역, 산호초)
// ------------------------------------------
function spawnObstacle() {
  const types = ['shell', 'seaweed', 'coral'];
  const type = types[Math.floor(Math.random() * types.length)];

  let width = 38;
  let height = 36;

  if (type === 'shell') {
    width = 38;
    height = 34;
  } else if (type === 'seaweed') {
    width = 34;
    height = 58;
  } else if (type === 'coral') {
    width = 46;
    height = 50;
  }

  obstacles.push({
    x: CANVAS_WIDTH + 20,
    y: GROUND_Y - height,
    width: width,
    height: height,
    type: type
  });
}

// ------------------------------------------
// 픽셀 렌더링 도우미 함수
// ------------------------------------------
function drawPixelRect(px, py, pw, ph, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(px), Math.floor(py), Math.floor(pw), Math.floor(ph));
}

// ------------------------------------------
// 렌더링 함수들
// ------------------------------------------

// 1. 픽셀 바다 & 1/3 꾸며진 모래사장 & 귀여운 바닷속 물고기들 🐟
function drawBackground() {
  // 상단 2/3: 바다 배경
  ctx.fillStyle = '#0077b6';
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
  ctx.fillStyle = '#0096c7';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 75);
  ctx.fillStyle = '#03045e';
  ctx.fillRect(0, GROUND_Y - 25, CANVAS_WIDTH, 25);

  // 🐟 디테일한 바닷속 픽셀 친구들 (니모, 해파리, 도리)
  fishes.forEach(f => {
    f.x += f.speed;
    if (f.speed > 0 && f.x > CANVAS_WIDTH + 50) f.x = -50;
    if (f.speed < 0 && f.x < -50) f.x = CANVAS_WIDTH + 50;

    const fx = Math.floor(f.x);
    const fy = Math.floor(f.y + Math.sin(frameCount * 0.12 + f.seed) * 6);
    const dir = f.speed > 0 ? 1 : -1;

    ctx.save();
    if (f.type === 'nemo') {
      // 🐠 픽셀 니모 흰동가리 (주황 + 흰 줄무늬)
      drawPixelRect(fx, fy, 20, 12, '#ff6b35');
      drawPixelRect(fx + 6, fy, 4, 12, '#ffffff'); // 줄무늬 1
      drawPixelRect(fx + 14, fy, 3, 12, '#ffffff'); // 줄무늬 2
      // 귀여운 눈
      drawPixelRect(fx + (dir > 0 ? 16 : 2), fy + 3, 3, 3, '#000000');
      drawPixelRect(fx + (dir > 0 ? 17 : 3), fy + 3, 1, 1, '#ffffff');
      // 꼬리
      drawPixelRect(dir > 0 ? fx - 4 : fx + 20, fy + 2, 4, 8, '#ff6b35');

    } else if (f.type === 'jelly') {
      // 🪼 픽셀 귀여운 통통 해파리
      const jellyBob = Math.floor(Math.sin(frameCount * 0.2 + f.seed) * 4);
      drawPixelRect(fx, fy + jellyBob, 16, 10, '#f72585');
      drawPixelRect(fx + 2, fy - 3 + jellyBob, 12, 4, '#ff758f');
      // 다리 3개
      drawPixelRect(fx + 2, fy + 10 + jellyBob, 3, 6, '#b5179e');
      drawPixelRect(fx + 7, fy + 10 - jellyBob, 3, 7, '#b5179e');
      drawPixelRect(fx + 12, fy + 10 + jellyBob, 3, 6, '#b5179e');
      // 깜찍한 눈
      drawPixelRect(fx + 4, fy + 3 + jellyBob, 2, 2, '#ffffff');
      drawPixelRect(fx + 10, fy + 3 + jellyBob, 2, 2, '#ffffff');

    } else if (f.type === 'dory') {
      // 🐟 파랑 픽셀 도리 물고기
      drawPixelRect(fx, fy, 22, 14, '#48cae4');
      drawPixelRect(fx + 4, fy + 3, 8, 8, '#023e8a');
      drawPixelRect(dir > 0 ? fx - 5 : fx + 22, fy + 3, 5, 8, '#ffb703'); // 노란 꼬리
      // 눈
      drawPixelRect(fx + (dir > 0 ? 16 : 3), fy + 3, 3, 3, '#000000');
    } else {
      // 노란 사탕 물고기
      drawPixelRect(fx, fy, 16, 10, '#ffb703');
      drawPixelRect(dir > 0 ? fx - 4 : fx + 16, fy + 2, 4, 6, '#fb8500');
      drawPixelRect(fx + (dir > 0 ? 12 : 2), fy + 2, 2, 2, '#000000');
    }

    // 헤엄치며 뿜는 공기방울
    if (frameCount % 25 === 0) {
      drawPixelRect(fx + (dir > 0 ? 24 : -6), fy - 4, 3, 3, 'rgba(255, 255, 255, 0.7)');
    }

    ctx.restore();
  });

  // 하단 1/3: 노란 모래 바닥 (SAND_HEIGHT = 150px)
  drawPixelRect(0, GROUND_Y, CANVAS_WIDTH, SAND_HEIGHT, '#ffb703');
  drawPixelRect(0, GROUND_Y, CANVAS_WIDTH, 8, '#fb8500');
  drawPixelRect(0, GROUND_Y + 45, CANVAS_WIDTH, 6, '#e09f3e');
  drawPixelRect(0, GROUND_Y + 95, CANVAS_WIDTH, 6, '#d4a373');

  // 🌟 모래사장 꾸미기 요소 (불가사리, 조개, 조약돌)
  sandDecorations.forEach(dec => {
    // 배경 이동
    dec.x -= gameSpeed * 0.8;
    if (dec.x < -40) dec.x += CANVAS_WIDTH + 800;

    const dx = Math.floor(dec.x);
    const dy = Math.floor(dec.y);

    if (dec.type === 'starfish') {
      // ⭐ 픽셀 불가사리
      drawPixelRect(dx, dy, 12, 12, dec.color);
      drawPixelRect(dx + 4, dy - 3, 4, 4, dec.color);
      drawPixelRect(dx + 4, dy + 11, 4, 4, dec.color);
      drawPixelRect(dx - 3, dy + 4, 4, 4, dec.color);
      drawPixelRect(dx + 11, dy + 4, 4, 4, dec.color);
    } else if (dec.type === 'tinyShell') {
      // 🐚 꼬마 픽셀 조개
      drawPixelRect(dx, dy, 10, 8, '#ffc6ff');
      drawPixelRect(dx + 2, dy - 2, 6, 3, '#ffc6ff');
      drawPixelRect(dx + 4, dy + 2, 2, 4, '#ffffff');
    } else if (dec.type === 'pebble') {
      // 🪨 조약돌
      drawPixelRect(dx, dy, 12, 6, '#94a3b8');
      drawPixelRect(dx + 2, dy - 2, 8, 3, '#cbd5e1');
    } else {
      // ✨ 반짝이는 금모래 알갱이
      const spark = Math.sin(frameCount * 0.2 + dx) > 0 ? '#ffffff' : '#fbbf24';
      drawPixelRect(dx, dy, 4, 4, spark);
    }
  });
}

// 2. 🎀 슈퍼 귀여운 흰색 오드아이 고양이 🐱
function drawCat() {
  const x = Math.floor(cat.x);
  const y = Math.floor(cat.y);
  const p = 3;

  ctx.save();

  // 그림자
  if (!cat.isJumping) {
    drawPixelRect(x + 6, GROUND_Y - 4, 46, 4, 'rgba(180, 100, 20, 0.3)');
  }

  // A. 복슬복슬 흰 몸통
  drawPixelRect(x + 12, y + 12, 34, 22, '#ffffff');
  drawPixelRect(x + 16, y + 8, 26, 6, '#ffffff');

  // B. 귀여운 동글 머리
  drawPixelRect(x + 36, y + 2, 20, 20, '#ffffff');

  // C. 귀 2개 (분홍 귓속)
  drawPixelRect(x + 36, y - 6, 6, 8, '#ffffff');
  drawPixelRect(x + 48, y - 6, 6, 8, '#ffffff');
  drawPixelRect(x + 38, y - 4, 3, 5, '#ffb5a7');
  drawPixelRect(x + 50, y - 4, 3, 5, '#ffb5a7');

  // D. ⭐ 반짝이는 오드아이 눈 (왼쪽: 오션블루 💙 / 오른쪽: 호박골드 💛)
  const eyeY = y + 8;
  const isBlinking = frameCount % 120 > 115; // 가끔 깜빡임!

  if (isBlinking) {
    // 깜빡이는 귀여운 눈 (^ ^)
    drawPixelRect(x + 40, eyeY + 2, 5, 2, '#4a5568');
    drawPixelRect(x + 48, eyeY + 2, 5, 2, '#4a5568');
  } else {
    // 왼쪽 눈 (오션 블루)
    drawPixelRect(x + 40, eyeY, 5, 7, '#00b4d8');
    drawPixelRect(x + 41, eyeY + 1, 2, 2, '#ffffff'); // 반사광 1
    drawPixelRect(x + 43, eyeY + 4, 1, 1, '#ffffff'); // 반사광 2

    // 오른쪽 눈 (호박 골드)
    drawPixelRect(x + 48, eyeY, 5, 7, '#ffb703');
    drawPixelRect(x + 49, eyeY + 1, 2, 2, '#ffffff'); // 반사광 1
    drawPixelRect(x + 51, eyeY + 4, 1, 1, '#ffffff'); // 반사광 2
  }

  // 핑크 픽셀 코, 수염, 볼터치
  drawPixelRect(x + 55, eyeY + 5, 3, 2, '#ff758f'); // 코
  drawPixelRect(x + 42, eyeY + 8, 4, 2, '#ffadad'); // 볼터치 1
  drawPixelRect(x + 50, eyeY + 8, 4, 2, '#ffadad'); // 볼터치 2

  // 귀여운 고양이 수염 (= ^ • ^ =)
  drawPixelRect(x + 56, eyeY + 4, 4, 1, '#cbd5e1');
  drawPixelRect(x + 56, eyeY + 7, 4, 1, '#cbd5e1');

  // E. 꼬리 끝 핑크 리본 🎀
  const tailWave = Math.floor(Math.sin(frameCount * 0.25) * 4);
  drawPixelRect(x + 4, y + 10 + tailWave, 8, 4, '#ffffff');
  drawPixelRect(x, y + 2 + tailWave, 6, 9, '#ffffff');
  // 꼬리 끝 리본
  drawPixelRect(x - 2, y + tailWave, 4, 4, '#ff758f');

  // F. 🐾 4족 보행 픽셀 다리 관절 (핑크 젤리 발가락)
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

    // 핑크 젤리 발바닥
    drawPixelRect(x + 14 + backLeftOffset, legY + 10, 5, 3, '#ffc6ff');
    drawPixelRect(x + 20 + backRightOffset, legY + 10, 5, 3, '#ffc6ff');
    drawPixelRect(x + 36 + frontLeftOffset, legY + 10, 5, 3, '#ffc6ff');
    drawPixelRect(x + 42 + frontRightOffset, legY + 10, 5, 3, '#ffc6ff');
  }

  ctx.restore();
}

// 3. 🎀 디테일하고 귀여운 장애물 3종 (리본 조개, 웃는 미역, 불가사리 산호초)
function drawObstacles() {
  obstacles.forEach(obs => {
    ctx.save();
    const x = Math.floor(obs.x);
    const y = Math.floor(obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'shell') {
      // 🎀 귀여운 눈과 리본이 달린 펄 조개
      drawPixelRect(x + 4, y + 8, w - 8, h - 8, '#ffb5a7');
      drawPixelRect(x + 8, y + 2, w - 16, 6, '#ffb5a7');
      drawPixelRect(x + 12, y + 14, 4, 12, '#f8ad9d');
      drawPixelRect(x + 22, y + 14, 4, 12, '#f8ad9d');

      // 조개의 귀여운 까만 눈 (^ ^)
      drawPixelRect(x + 12, y + 8, 3, 3, '#000000');
      drawPixelRect(x + 24, y + 8, 3, 3, '#000000');

      // 픽셀 진주 & 리본
      drawPixelRect(x + 16, y + 16, 6, 6, '#ffffff');
      drawPixelRect(x + 16, y, 6, 4, '#ff477e'); // 상단 분홍 리본

    } else if (obs.type === 'seaweed') {
      // 🌿 표정이 있는 귀여운 미역 (^ w ^)
      const wave = Math.floor(Math.sin(frameCount * 0.2 + x) * 4);

      drawPixelRect(x + 6 + wave, y, 10, h, '#52b788');
      drawPixelRect(x + 14 - wave, y + 10, 10, h - 10, '#74c69d');
      drawPixelRect(x + 2 + wave, y + 20, 8, h - 20, '#2d6a4f');

      // 미역의 귀여운 얼굴 표정
      drawPixelRect(x + 8 + wave, y + 14, 2, 2, '#000000');
      drawPixelRect(x + 12 + wave, y + 14, 2, 2, '#000000');
      drawPixelRect(x + 10 + wave, y + 17, 2, 1, '#ff758f');

    } else if (obs.type === 'coral') {
      // 🪸 불가사리가 달린 알록달록 버섯 산호초
      drawPixelRect(x + 6, y + 16, w - 12, h - 16, '#f72585');
      drawPixelRect(x + 4, y, 10, 18, '#f72585');
      drawPixelRect(x + 18, y + 6, 10, 14, '#b5179e');
      drawPixelRect(x + 30, y + 2, 10, 16, '#7209b7');

      // 붙어있는 귀여운 노란 픽셀 불가사리
      drawPixelRect(x + 18, y + 22, 8, 8, '#ffb703');
      drawPixelRect(x + 20, y + 20, 4, 4, '#ffb703');
    }

    ctx.restore();
  });
}

// ------------------------------------------
// 업데이트 & 공룡 게임 방식 거리 점수 계산
// ------------------------------------------
function updateGame() {
  frameCount++;

  // 점점 빨라지는 속도
  gameSpeed += 0.0015;

  // 🦖 공룡 게임 방식: 달리면서 거리에 따라 점수 지속 상승!
  distanceRan += gameSpeed * 0.15;
  const newScore = Math.floor(distanceRan);

  // 100점 단위로 띵동 사운드 효과 (공룡 게임 체크포인트!)
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

  // 고양이 수직 점프 운동
  cat.y += cat.vy;
  cat.vy += GRAVITY;

  // 바닥 (GROUND_Y = 300) 착지
  if (cat.y >= GROUND_Y - cat.height) {
    cat.y = GROUND_Y - cat.height;
    cat.vy = 0;
    cat.isJumping = false;
  }

  // 장애물 스폰 타이머
  nextObstacleTimer -= 1;
  if (nextObstacleTimer <= 0) {
    spawnObstacle();
    const minGap = 40;
    const maxGap = 72;
    const randomGap = (Math.random() * (maxGap - minGap) + minGap);
    nextObstacleTimer = randomGap / (gameSpeed / baseSpeed);
  }

  // 장애물 이동 및 충돌 검사
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    // 화면 밖 장애물 제거
    if (obs.x + obs.width < -30) {
      obstacles.splice(i, 1);
    }

    // 충돌 검사
    const padding = 7;
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
// 메인 게임 루프 & 종료 처리
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
// 이벤트 리스너 (스페이스바 점프 & 재시작)
// ------------------------------------------
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();

    if (!isGameRunning) {
      startGame();
    } else {
      triggerJump();
    }
  }
});

btnJump.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!isGameRunning) {
    startGame();
  } else {
    triggerJump();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!isGameRunning) {
    startGame();
  } else {
    triggerJump();
  }
});

startGameBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// 사운드 토글
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
