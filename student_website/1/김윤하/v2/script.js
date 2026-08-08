// ==========================================
// 바다 속 오드아이 고양이 달리기 로직 (v2)
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
      // 통통 튀는 고양이 점프 소리 (뾰롱~)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'score') {
      // 장애물 통과 성공음 (+3점)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'hit') {
      // 부딪혔을 때 부딪힘 소리
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // 사운드 차단 시 예외 무시
  }
}

// ------------------------------------------
// 게임 상수 및 설정 (캔버스 800 x 450)
// ------------------------------------------
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

// 바닥 레이아웃: 화면 높이의 1/3 (150px)은 노란색 모래 바닥!
const SAND_HEIGHT = CANVAS_HEIGHT / 3; // 150px
const GROUND_Y = CANVAS_HEIGHT - SAND_HEIGHT; // y = 300

// 고양이 설정
const CAT_WIDTH = 55;
const CAT_HEIGHT = 45;
const GRAVITY = 0.65;
const JUMP_FORCE = -13.5;

// 게임 상태 변수
let isGameRunning = false;
let score = 0;
let clearedObstacles = 0;
let gameSpeed = 5.5;
let baseSpeed = 5.5;
let frameCount = 0;
let animationId = null;

// 흰색 오드아이 고양이 객체
const cat = {
  x: 100,
  y: GROUND_Y - CAT_HEIGHT,
  width: CAT_WIDTH,
  height: CAT_HEIGHT,
  vy: 0,
  isJumping: false,
  legFrame: 0
};

// 장애물 배열 및 스폰 관리
let obstacles = [];
let nextObstacleTimer = 0;

// 바닷속 수중 효과 (물방울 파티클)
let bubbles = [];
for (let i = 0; i < 20; i++) {
  bubbles.push({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * GROUND_Y,
    radius: Math.random() * 4 + 2,
    speed: Math.random() * 1 + 0.5
  });
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
  nextObstacleTimer = 80;

  cat.y = GROUND_Y - cat.height;
  cat.vy = 0;
  cat.isJumping = false;

  updateUI();
}

function updateUI() {
  scoreDisplay.textContent = score + '점';
  clearedDisplay.textContent = clearedObstacles + '개';
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
// 장애물 생성 (조개 껍데기, 미역, 산호초 3종)
// ------------------------------------------
function spawnObstacle() {
  const types = ['shell', 'seaweed', 'coral'];
  const type = types[Math.floor(Math.random() * types.length)];

  let width = 35;
  let height = 40;

  if (type === 'shell') {
    width = 36;
    height = 30;
  } else if (type === 'seaweed') {
    width = 30;
    height = 55;
  } else if (type === 'coral') {
    width = 42;
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
// 렌더링 함수들 (바다, 모래사장, 고양이, 장애물)
// ------------------------------------------

// 1. 바다(상단 2/3) 및 노란색 모래 바닥(하단 1/3) 그리기
function drawBackground() {
  // 상단 2/3: 살랑거리는 바닷속 배경 (그라데이션)
  const seaGradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  seaGradient.addColorStop(0, '#bde0fe');
  seaGradient.addColorStop(1, '#70d6ff');
  ctx.fillStyle = seaGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

  // 하단 1/3: 따스한 노란색 모래 바닥!
  const sandGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
  sandGradient.addColorStop(0, '#ffea00');
  sandGradient.addColorStop(0.1, '#ffd000');
  sandGradient.addColorStop(1, '#ffb703');
  ctx.fillStyle = sandGradient;
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, SAND_HEIGHT);

  // 바다와 모래 경계선의 부드러운 웨이브 파도 효과
  ctx.fillStyle = '#ffea00';
  ctx.beginPath();
  const waveOffset = (frameCount * gameSpeed * 0.05) % 40;
  for (let x = -40; x <= CANVAS_WIDTH + 40; x += 20) {
    const waveY = GROUND_Y + Math.sin((x + waveOffset) * 0.05) * 4;
    if (x === -40) ctx.moveTo(x, waveY);
    else ctx.lineTo(x, waveY);
  }
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 10);
  ctx.lineTo(0, GROUND_Y + 10);
  ctx.closePath();
  ctx.fill();

  // 모래 질감 점들
  ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
  const sandDotOffset = (frameCount * gameSpeed) % 80;
  for (let i = 0; i < 15; i++) {
    const dotX = (i * 60 - sandDotOffset + CANVAS_WIDTH) % CANVAS_WIDTH;
    const dotY = GROUND_Y + 25 + (i % 4) * 25;
    ctx.fillRect(dotX, dotY, 4, 3);
  }

  // 바닷속 물방울 보글보글 애니메이션
  bubbles.forEach(b => {
    b.y -= b.speed;
    if (b.y < 0) b.y = GROUND_Y - 5;

    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });
}

// 2. 흰색 오드아이 고양이 캐릭터 그리기 🐱
function drawCat() {
  const x = cat.x;
  const y = cat.y;
  const w = cat.width;
  const h = cat.height;

  ctx.save();

  // 고양이 하단 그림자 (모래 위)
  if (!cat.isJumping) {
    ctx.fillStyle = 'rgba(180, 100, 20, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, GROUND_Y - 2, w * 0.45, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 고양이 몸통 (하얀 복슬복슬 털)
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 4;

  // 타원형 몸통
  ctx.beginPath();
  ctx.ellipse(x + w * 0.45, y + h * 0.6, w * 0.38, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  // 고양이 머리
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.38, h * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // 고양이 귀 2개 (왼쪽 귀, 오른쪽 귀)
  // 왼쪽 귀
  ctx.beginPath();
  ctx.moveTo(x + w * 0.58, y + h * 0.22);
  ctx.lineTo(x + w * 0.64, y - h * 0.08);
  ctx.lineTo(x + w * 0.76, y + h * 0.12);
  ctx.closePath();
  ctx.fill();

  // 오른쪽 귀
  ctx.beginPath();
  ctx.moveTo(x + w * 0.74, y + h * 0.12);
  ctx.lineTo(x + w * 0.84, y - h * 0.06);
  ctx.lineTo(x + w * 0.90, y + h * 0.22);
  ctx.closePath();
  ctx.fill();

  // 핑크색 안쪽 귀
  ctx.fillStyle = '#ffc6ff';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.62, y + h * 0.18);
  ctx.lineTo(x + w * 0.66, y - h * 0.02);
  ctx.lineTo(x + w * 0.73, y + h * 0.12);
  ctx.closePath();
  ctx.fill();

  // ⭐ 오드아이 고양이 핵심! (왼쪽 눈: 오션 블루 💙, 오른쪽 눈: 호박색 골드 💛)
  const eyeY = y + h * 0.35;
  const leftEyeX = x + w * 0.68;
  const rightEyeX = x + w * 0.83;

  // 왼쪽 눈 (파란색 #0096c7)
  ctx.fillStyle = '#0096c7';
  ctx.beginPath();
  ctx.arc(leftEyeX, eyeY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 오른쪽 눈 (노란색/호박색 #ffb703)
  ctx.fillStyle = '#ffb703';
  ctx.beginPath();
  ctx.arc(rightEyeX, eyeY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 눈동자 하이라이트 (반사광)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(leftEyeX - 1.5, eyeY - 1.5, 1.5, 0, Math.PI * 2);
  ctx.arc(rightEyeX - 1.5, eyeY - 1.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 핑크색 코 & 볼터치
  ctx.fillStyle = '#ffadad';
  ctx.beginPath();
  ctx.arc(x + w * 0.76, eyeY + 4, 2, 0, Math.PI * 2); // 코
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.65, eyeY + 7, 3, 0, Math.PI * 2); // 볼터치 1
  ctx.arc(x + w * 0.86, eyeY + 7, 3, 0, Math.PI * 2); // 볼터치 2
  ctx.fill();

  // 살랑거리는 고양이 꼬리
  const tailAngle = Math.sin(frameCount * 0.2) * 0.3;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.55);
  ctx.quadraticCurveTo(
    x - 10,
    y + h * 0.2 + tailAngle * 10,
    x - 12,
    y - 2 + tailAngle * 15
  );
  ctx.stroke();

  // 달리는 다리 애니메이션 (4개 다리 퐁당퐁당)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  const legCycle = cat.isJumping ? 0 : Math.sin(frameCount * 0.3) * 12;

  // 앞다리 2개
  ctx.beginPath();
  ctx.moveTo(x + w * 0.62, y + h * 0.75);
  ctx.lineTo(x + w * 0.62 + legCycle, y + h + 2);
  ctx.moveTo(x + w * 0.72, y + h * 0.75);
  ctx.lineTo(x + w * 0.72 - legCycle, y + h + 2);
  // 뒷다리 2개
  ctx.moveTo(x + w * 0.25, y + h * 0.75);
  ctx.lineTo(x + w * 0.25 - legCycle, y + h + 2);
  ctx.moveTo(x + w * 0.38, y + h * 0.75);
  ctx.lineTo(x + w * 0.38 + legCycle, y + h + 2);
  ctx.stroke();

  ctx.restore();
}

// 3. 장애물 3종 그리기 (조개 껍데기, 미역, 산호초)
function drawObstacles() {
  obstacles.forEach(obs => {
    ctx.save();
    const x = obs.x;
    const y = obs.y;
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'shell') {
      // 🐚 조개 껍데기 (분홍빛 알조개)
      ctx.fillStyle = '#ffb5a7';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h, w / 2, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // 조개 껍데기 줄무늬
      ctx.strokeStyle = '#f8ad9d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h);
      ctx.lineTo(x + w / 2, y + 4);
      ctx.moveTo(x + w / 2, y + h);
      ctx.lineTo(x + 6, y + 10);
      ctx.moveTo(x + w / 2, y + h);
      ctx.lineTo(x + w - 6, y + 10);
      ctx.stroke();

      // 조개 속 진주
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h - 6, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (obs.type === 'seaweed') {
      // 🌿 출렁이는 초록 미역
      ctx.fillStyle = '#52b788';
      const wave = Math.sin(frameCount * 0.15 + x) * 6;

      ctx.beginPath();
      ctx.moveTo(x + 5, y + h);
      ctx.quadraticCurveTo(x + 15 + wave, y + h * 0.5, x + 5 + wave, y);
      ctx.quadraticCurveTo(x + 25 + wave, y + h * 0.5, x + 20, y + h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#74c69d';
      ctx.beginPath();
      ctx.moveTo(x + 15, y + h);
      ctx.quadraticCurveTo(x + 25 - wave, y + h * 0.6, x + 18 - wave, y + 10);
      ctx.quadraticCurveTo(x + 30 - wave, y + h * 0.6, x + 28, y + h);
      ctx.closePath();
      ctx.fill();

    } else if (obs.type === 'coral') {
      // 🪸 알록달록 산호초
      ctx.fillStyle = '#f72585';
      
      // 줄기 1
      ctx.beginPath();
      ctx.arc(x + 12, y + 12, 10, 0, Math.PI * 2);
      ctx.arc(x + 28, y + 16, 9, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 28, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(x + 8, y + 20, w - 16, h - 20);

      // 밝은 핑크 하이라이트
      ctx.fillStyle = '#7209b7';
      ctx.beginPath();
      ctx.arc(x + 12, y + 12, 4, 0, Math.PI * 2);
      ctx.arc(x + 28, y + 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

// ------------------------------------------
// 업데이트 및 충돌 검사
// ------------------------------------------
function updateGame() {
  frameCount++;

  // 달릴수록 속도가 조금씩 증가 (점점 빨라짐!)
  gameSpeed += 0.0012;

  // 고양이 수직 운동 (점프 및 중력)
  cat.y += cat.vy;
  cat.vy += GRAVITY;

  // 바닥(1/3 모래선) 착지 감지
  if (cat.y >= GROUND_Y - cat.height) {
    cat.y = GROUND_Y - cat.height;
    cat.vy = 0;
    cat.isJumping = false;
  }

  // 장애물 이동 및 스폰 처리
  nextObstacleTimer -= 1;
  if (nextObstacleTimer <= 0) {
    spawnObstacle();
    // 속도가 빨라질수록 스폰 간격을 살짝 조정
    const randomGap = Math.random() * 50 + 65;
    nextObstacleTimer = randomGap / (gameSpeed / baseSpeed);
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= gameSpeed;

    // 점수 획득 감지: 장애물을 무사히 넘어갔을 때 +3점! ⭐
    if (!obs.passed && obs.x + obs.width < cat.x) {
      obs.passed = true;
      score += 3;
      clearedObstacles += 1;
      updateUI();
      playSound('score');
    }

    // 화면 밖으로 나간 장애물 제거
    if (obs.x + obs.width < -30) {
      obstacles.splice(i, 1);
    }

    // 충돌 감지 (Hitbox)
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
// 게임 루프 & 종료 처리
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
      // 게임 오버 상태이거나 시작 전일 때 스페이스바로 즉시 재시작!
      startGame();
    } else {
      triggerJump();
    }
  }
});

// 모바일 버튼 & 터치 / 마우스 클릭
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

// 초기 배경 및 캐릭터 렌더링
initGame();
drawBackground();
drawCat();
