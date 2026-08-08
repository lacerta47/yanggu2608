// ==========================================
// 픽셀 바다 오드아이 고양이 달리기 로직 (v3)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('scoreDisplay');
const speedDisplay = document.getElementById('speedDisplay');
const clearedDisplay = document.getElementById('clearedDisplay');

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
      // 픽셀 사운드 뾰롱~ (레트로 8비트 피치 램프)
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'score') {
      // 픽셀 아이템/장애물 통과음 (+3점 딩동!)
      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.07); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'hit') {
      // 부딪혔을 때 8비트 파괴음
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.22);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
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

// 바닥 레이아웃: 화면 높이 1/3 (150px) 노란색 모래 바닥!
const SAND_HEIGHT = CANVAS_HEIGHT / 3; // 150px
const GROUND_Y = CANVAS_HEIGHT - SAND_HEIGHT; // y = 300

// 픽셀 고양이 설정
const CAT_WIDTH = 58;
const CAT_HEIGHT = 46;
const GRAVITY = 0.68;
const JUMP_FORCE = -13.8;

// 게임 상태 변수
let isGameRunning = false;
let score = 0;
let clearedObstacles = 0;
let gameSpeed = 6.0;
let baseSpeed = 6.0;
let frameCount = 0;
let animationId = null;

// 픽셀 흰색 오드아이 고양이 객체
const cat = {
  x: 100,
  y: GROUND_Y - CAT_HEIGHT,
  width: CAT_WIDTH,
  height: CAT_HEIGHT,
  vy: 0,
  isJumping: false,
  legPhase: 0
};

// 장애물 배열 및 더 많아진 스폰 타이머
let obstacles = [];
let nextObstacleTimer = 0;

// ------------------------------------------
// 🐟 바닷속 헤엄치는 픽셀 물고기 모임 (배경 요소)
// ------------------------------------------
let fishes = [];
const FISH_COLORS = ['#ff758f', '#ffb703', '#48cae4', '#7209b7', '#52b788'];

function initFishes() {
  fishes = [];
  for (let i = 0; i < 8; i++) {
    fishes.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * (GROUND_Y - 80) + 30,
      speed: (Math.random() * 1.5 + 0.8) * (Math.random() < 0.5 ? 1 : -1),
      size: Math.floor(Math.random() * 3) + 2, // 픽셀 배율 2 ~ 4
      color: FISH_COLORS[i % FISH_COLORS.length],
      seed: Math.random() * 100
    });
  }
}

// ------------------------------------------
// 게임 초기화
// ------------------------------------------
function initGame() {
  score = 0;
  clearedObstacles = 0;
  gameSpeed = baseSpeed;
  frameCount = 0;
  obstacles = [];
  nextObstacleTimer = 45; // v2보다 더 촘촘하고 자주 스폰!

  cat.y = GROUND_Y - cat.height;
  cat.vy = 0;
  cat.isJumping = false;

  initFishes();
  updateUI();
}

function updateUI() {
  scoreDisplay.textContent = score;
  clearedDisplay.textContent = clearedObstacles;
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
// 장애물 생성 (장애물 종류 3종 & 높아진 밀도)
// ------------------------------------------
function spawnObstacle() {
  const types = ['shell', 'seaweed', 'coral'];
  const type = types[Math.floor(Math.random() * types.length)];

  let width = 36;
  let height = 40;

  if (type === 'shell') {
    width = 38;
    height = 32;
  } else if (type === 'seaweed') {
    width = 32;
    height = 56;
  } else if (type === 'coral') {
    width = 44;
    height = 48;
  }

  obstacles.push({
    x: CANVAS_WIDTH + 20,
    y: GROUND_Y - height,
    width: width,
    height: height,
    type: type,
    passed: false
  });
}

// ------------------------------------------
// 픽셀 렌더링 도우미 (Pixel Grid Drawing)
// ------------------------------------------
function drawPixelRect(px, py, pw, ph, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(px), Math.floor(py), Math.floor(pw), Math.floor(ph));
}

// ------------------------------------------
// 렌더링 함수들 (픽셀 바다, 픽셀 모래, 물고기, 고양이, 장애물)
// ------------------------------------------

// 1. 픽셀 바다 & 1/3 모래사장 & 헤엄치는 물고기 🐟
function drawBackground() {
  // 상단 2/3: 픽셀 타일 바다 배경
  const seaColor = '#0077b6';
  ctx.fillStyle = seaColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

  // 바닷속 픽셀 잔물결 층
  ctx.fillStyle = '#0096c7';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 70);
  ctx.fillStyle = '#03045e';
  ctx.fillRect(0, GROUND_Y - 25, CANVAS_WIDTH, 25);

  // 🐟 헤엄치는 픽셀 물고기 애니메이션
  fishes.forEach(f => {
    f.x += f.speed;
    if (f.speed > 0 && f.x > CANVAS_WIDTH + 40) f.x = -40;
    if (f.speed < 0 && f.x < -40) f.x = CANVAS_WIDTH + 40;

    const fx = Math.floor(f.x);
    const fy = Math.floor(f.y + Math.sin(frameCount * 0.1 + f.seed) * 5);
    const p = f.size; // 픽셀 블록 크기
    const dir = f.speed > 0 ? 1 : -1;

    ctx.save();
    // 물고기 몸통 (픽셀 파츠)
    drawPixelRect(fx, fy, p * 5, p * 3, f.color);
    drawPixelRect(fx + (dir > 0 ? p * 4 : -p), fy + p, p, p, '#ffffff'); // 눈
    drawPixelRect(fx + (dir > 0 ? p * 4.5 : -p * 0.5), fy + p, p * 0.5, p * 0.5, '#000000'); // 눈동자

    // 물고기 꼬리 지느러미 꼬물꼬물
    const tailWiggle = Math.floor(Math.sin(frameCount * 0.3 + f.seed) * p);
    const tailX = dir > 0 ? fx - p * 2 : fx + p * 5;
    drawPixelRect(tailX, fy - p + tailWiggle, p * 2, p * 5, f.color);

    // 물고기가 뿜는 작은 픽셀 공기방울
    if (frameCount % 20 === 0) {
      drawPixelRect(fx + (dir > 0 ? p * 6 : -p * 2), fy - p, p, p, 'rgba(255, 255, 255, 0.6)');
    }

    ctx.restore();
  });

  // 하단 1/3: 픽셀 노란색 모래 바닥 (SAND_HEIGHT = 150px)
  drawPixelRect(0, GROUND_Y, CANVAS_WIDTH, SAND_HEIGHT, '#ffb703');
  
  // 모래 레이어 깊이감 픽셀 블록들
  drawPixelRect(0, GROUND_Y, CANVAS_WIDTH, 8, '#fb8500');
  drawPixelRect(0, GROUND_Y + 40, CANVAS_WIDTH, 6, '#e09f3e');
  drawPixelRect(0, GROUND_Y + 90, CANVAS_WIDTH, 6, '#d4a373');

  // 모래 위 알갱이 픽셀 도트
  const sandDotOffset = Math.floor((frameCount * gameSpeed * 0.5) % 60);
  ctx.fillStyle = '#d4a373';
  for (let i = 0; i < 20; i++) {
    const dx = (i * 45 - sandDotOffset + CANVAS_WIDTH) % CANVAS_WIDTH;
    const dy = GROUND_Y + 15 + (i % 5) * 24;
    ctx.fillRect(dx, dy, 6, 4);
  }
}

// 2. 픽셀 흰색 오드아이 고양이 & 자연스러운 4족 보행 관절 애니메이션 🐱
function drawCat() {
  const x = Math.floor(cat.x);
  const y = Math.floor(cat.y);
  const p = 3; // 픽셀 기본 유닛 크기 (3px)

  ctx.save();

  // 착지 픽셀 그림자
  if (!cat.isJumping) {
    drawPixelRect(x + 6, GROUND_Y - 4, 46, 4, 'rgba(180, 100, 20, 0.3)');
  }

  // A. 픽셀 하얀 고양이 몸통
  drawPixelRect(x + 12, y + 12, 34, 22, '#ffffff'); // 중선 몸통
  drawPixelRect(x + 16, y + 8, 26, 6, '#ffffff');  // 등 위쪽

  // B. 픽셀 귀여운 머리
  drawPixelRect(x + 36, y + 2, 20, 20, '#ffffff');

  // C. 픽셀 귀 (왼쪽 귀, 오른쪽 귀)
  drawPixelRect(x + 36, y - 6, 6, 8, '#ffffff');
  drawPixelRect(x + 48, y - 6, 6, 8, '#ffffff');
  // 분홍 귓속
  drawPixelRect(x + 38, y - 4, 3, 5, '#ffb5a7');
  drawPixelRect(x + 50, y - 4, 3, 5, '#ffb5a7');

  // D. ⭐ 오드아이 픽셀 눈! (왼쪽 눈: 파랑 #00b4d8 / 오른쪽 눈: 노랑 #ffb703)
  const eyeY = y + 8;
  // 왼쪽 눈 (파란색)
  drawPixelRect(x + 40, eyeY, 4, 6, '#00b4d8');
  drawPixelRect(x + 41, eyeY + 1, 2, 2, '#ffffff'); // 반사광

  // 오른쪽 눈 (노란색)
  drawPixelRect(x + 48, eyeY, 4, 6, '#ffb703');
  drawPixelRect(x + 49, eyeY + 1, 2, 2, '#ffffff'); // 반사광

  // 핑크 픽셀 코 & 뺨
  drawPixelRect(x + 54, eyeY + 5, 3, 3, '#ff758f'); // 코
  drawPixelRect(x + 42, eyeY + 8, 4, 2, '#ffb5a7'); // 볼터치 1
  drawPixelRect(x + 50, eyeY + 8, 4, 2, '#ffb5a7'); // 볼터치 2

  // E. 픽셀 꼬리 (살랑살랑 애니메이션)
  const tailWave = Math.floor(Math.sin(frameCount * 0.25) * 4);
  drawPixelRect(x + 4, y + 10 + tailWave, 8, 4, '#ffffff');
  drawPixelRect(x, y + 2 + tailWave, 6, 9, '#ffffff');

  // F. 🐾 자연스러운 4족 보행 픽셀 다리 관절 애니메이션 (4Leg Gait trot)
  // 점프 중에는 다리를 귀엽게 접고, 달릴 때는 4개 다리가 상호 교차 운동!
  const legCycle = cat.isJumping ? 0 : frameCount * 0.35;

  // 4개 다리 위치 계산 (앞왼쪽, 앞오른쪽, 뒤왼쪽, 뒤오른쪽)
  const frontLeftOffset = Math.sin(legCycle) * 7;
  const frontRightOffset = Math.sin(legCycle + Math.PI) * 7;
  const backLeftOffset = Math.sin(legCycle + Math.PI) * 7;
  const backRightOffset = Math.sin(legCycle) * 7;

  const legY = y + 32;

  if (cat.isJumping) {
    // 점프 자세: 다리를 웅크림
    drawPixelRect(x + 14, legY, 5, 8, '#e0e0e0');
    drawPixelRect(x + 22, legY, 5, 8, '#ffffff');
    drawPixelRect(x + 34, legY, 5, 8, '#e0e0e0');
    drawPixelRect(x + 42, legY, 5, 8, '#ffffff');
  } else {
    // 자연스러운 4족 달리기 (교차 트롯 가이트)
    // 1. 뒤쪽 레이어 다리 (살짝 어둡게 음영)
    drawPixelRect(x + 14 + backLeftOffset, legY, 5, 12, '#d6d6d6'); // 뒤왼다리
    drawPixelRect(x + 36 + frontLeftOffset, legY, 5, 12, '#d6d6d6'); // 앞왼다리

    // 2. 앞쪽 레이어 다리 (하얀색)
    drawPixelRect(x + 20 + backRightOffset, legY, 5, 12, '#ffffff'); // 뒤오른다리
    drawPixelRect(x + 42 + frontRightOffset, legY, 5, 12, '#ffffff'); // 앞오른다리

    // 발가락 픽셀 젤리 포인트
    drawPixelRect(x + 14 + backLeftOffset, legY + 10, 5, 3, '#ffc6ff');
    drawPixelRect(x + 20 + backRightOffset, legY + 10, 5, 3, '#ffc6ff');
    drawPixelRect(x + 36 + frontLeftOffset, legY + 10, 5, 3, '#ffc6ff');
    drawPixelRect(x + 42 + frontRightOffset, legY + 10, 5, 3, '#ffc6ff');
  }

  ctx.restore();
}

// 3. 픽셀 장애물 3종 (조개, 미역, 산호초)
function drawObstacles() {
  obstacles.forEach(obs => {
    ctx.save();
    const x = Math.floor(obs.x);
    const y = Math.floor(obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'shell') {
      // 🐚 픽셀 조개 껍데기
      drawPixelRect(x + 4, y + 8, w - 8, h - 8, '#ffb5a7');
      drawPixelRect(x + 8, y + 2, w - 16, 6, '#ffb5a7');
      drawPixelRect(x + 12, y + 14, 4, 12, '#f8ad9d');
      drawPixelRect(x + 22, y + 14, 4, 12, '#f8ad9d');
      // 픽셀 진주
      drawPixelRect(x + 16, y + 16, 6, 6, '#ffffff');

    } else if (obs.type === 'seaweed') {
      // 🌿 픽셀 출렁이는 미역
      const wave = Math.floor(Math.sin(frameCount * 0.2 + x) * 4);

      drawPixelRect(x + 6 + wave, y, 10, h, '#52b788');
      drawPixelRect(x + 14 - wave, y + 10, 10, h - 10, '#74c69d');
      drawPixelRect(x + 2 + wave, y + 20, 8, h - 20, '#2d6a4f');

    } else if (obs.type === 'coral') {
      // 🪸 픽셀 산호초
      drawPixelRect(x + 6, y + 16, w - 12, h - 16, '#f72585');
      // 픽셀 뿔 3개
      drawPixelRect(x + 4, y, 10, 18, '#f72585');
      drawPixelRect(x + 18, y + 6, 10, 14, '#b5179e');
      drawPixelRect(x + 30, y + 2, 10, 16, '#7209b7');
      // 픽셀 포인트 도트
      drawPixelRect(x + 6, y + 4, 4, 4, '#4cc9f0');
      drawPixelRect(x + 32, y + 6, 4, 4, '#4cc9f0');
    }

    ctx.restore();
  });
}

// ------------------------------------------
// 업데이트 및 충돌 검사
// ------------------------------------------
function updateGame() {
  frameCount++;

  // 점점 빨라지는 속도 엔진!
  gameSpeed += 0.0015;

  // 고양이 수직 점프 및 중력
  cat.y += cat.vy;
  cat.vy += GRAVITY;

  // 바닥 (GROUND_Y = 300) 착지 감지
  if (cat.y >= GROUND_Y - cat.height) {
    cat.y = GROUND_Y - cat.height;
    cat.vy = 0;
    cat.isJumping = false;
  }

  // 장애물 더 자주 스폰 (nextObstacleTimer)
  nextObstacleTimer -= 1;
  if (nextObstacleTimer <= 0) {
    spawnObstacle();
    // v3 장애물 스폰 밀도 대폭 증가!
    const minGap = 42;
    const maxGap = 75;
    const randomGap = (Math.random() * (maxGap - minGap) + minGap);
    nextObstacleTimer = randomGap / (gameSpeed / baseSpeed);
  }

  // 장애물 이동 및 점수/충돌 처리
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    // 장애물을 무사히 건넜을 때 +3점 획득! ⭐
    if (!obs.passed && obs.x + obs.width < cat.x) {
      obs.passed = true;
      score += 3;
      clearedObstacles += 1;
      updateUI();
      playSound('score');
    }

    // 화면 밖 장애물 제거
    if (obs.x + obs.width < -30) {
      obstacles.splice(i, 1);
    }

    // 픽셀 충돌 검사 (Hitbox)
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

  finalScore.textContent = score;
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
