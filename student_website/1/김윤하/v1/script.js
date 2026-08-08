// ==========================================
// 파스텔 블록 깨기 게임 로직 (v1)
// ==========================================

// 캔버스 및 렌더링 컨텍스트 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// HTML 엘리먼트 가져오기
const scoreDisplay = document.getElementById('scoreDisplay');
const blocksDisplay = document.getElementById('blocksDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const startOverlay = document.getElementById('startOverlay');
const startGameBtn = document.getElementById('startGameBtn');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnLaunch = document.getElementById('btnLaunch');

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

    if (type === 'paddle') {
      // 바 튕김 소리 (부드러운 통 소리)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'block') {
      // 블록 깨짐 소리 (밝고 경쾌한 톡!)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'wall') {
      // 벽 튕김 소리 (낮은 톡)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'lose') {
      // 공 놓침 소리
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      // 승리 팡파르 소리
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(freq, now + idx * 0.12);
        g.gain.setValueAtTime(0.3, now + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2);
        o.start(now + idx * 0.12);
        o.stop(now + idx * 0.12 + 0.2);
      });
    }
  } catch (e) {
    // 사운드 차단 시 무시
  }
}

// ------------------------------------------
// 게임 상수 및 파스텔 컬러 설정
// ------------------------------------------
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 550;

const PADDLE_WIDTH = 130;
const PADDLE_HEIGHT = 18;
const PADDLE_SPEED = 8.5;

const BALL_RADIUS = 10;
const INITIAL_BALL_SPEED = 6.5;

const BLOCK_ROWS = 5;
const BLOCK_COLS = 8;
const BLOCK_WIDTH = 85;
const BLOCK_HEIGHT = 26;
const BLOCK_PADDING = 10;
const BLOCK_OFFSET_TOP = 60;
const BLOCK_OFFSET_LEFT = 25;

// 각 줄별 파스텔 블록 색상
const ROW_COLORS = [
  '#ffb7c5', // 1줄: 파스텔 분홍
  '#ffcfd2', // 2줄: 파스텔 피치
  '#fbf8cc', // 3줄: 파스텔 노랑
  '#b9fbc0', // 4줄: 파스텔 민트
  '#a0c4ff'  // 5줄: 파스텔 하늘
];

// ------------------------------------------
// 게임 상태 변수
// ------------------------------------------
let score = 0;
let lives = 3;
let remainingBlocks = 0;
let isGameRunning = false;
let isBallLaunched = false;
let animationId = null;

// 조작 상태
const keys = {
  left: false,
  right: false
};

// 패들 객체
const paddle = {
  x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
  y: CANVAS_HEIGHT - 40,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  dx: 0
};

// 공 객체
const ball = {
  x: 0,
  y: 0,
  radius: BALL_RADIUS,
  dx: 0,
  dy: 0,
  speed: INITIAL_BALL_SPEED
};

// 블록 배열
let blocks = [];

// 파티클 (블록 깨짐 효과)
let particles = [];

// ------------------------------------------
// 게임 초기화 함수
// ------------------------------------------
function initGame() {
  score = 0;
  lives = 3;
  updateUI();
  createBlocks();
  resetPaddleAndBall();
}

function createBlocks() {
  blocks = [];
  remainingBlocks = BLOCK_ROWS * BLOCK_COLS;

  for (let r = 0; r < BLOCK_ROWS; r++) {
    blocks[r] = [];
    for (let c = 0; c < BLOCK_COLS; c++) {
      const blockX = c * (BLOCK_WIDTH + BLOCK_PADDING) + BLOCK_OFFSET_LEFT;
      const blockY = r * (BLOCK_HEIGHT + BLOCK_PADDING) + BLOCK_OFFSET_TOP;
      blocks[r][c] = {
        x: blockX,
        y: blockY,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: ROW_COLORS[r],
        status: 1 // 1: 존재함, 0: 깨짐
      };
    }
  }
  blocksDisplay.textContent = remainingBlocks;
}

function resetPaddleAndBall() {
  paddle.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
  paddle.y = CANVAS_HEIGHT - 40;
  
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius - 2;
  ball.dx = 0;
  ball.dy = 0;
  isBallLaunched = false;
}

function launchBall() {
  if (!isGameRunning || isBallLaunched) return;
  initAudio();
  isBallLaunched = true;
  // 무작위 좌우 방향 살짝 주기
  const angle = (Math.random() * 0.4 - 0.2) + Math.PI / 4; 
  const direction = Math.random() < 0.5 ? -1 : 1;
  ball.dx = direction * ball.speed * Math.sin(angle);
  ball.dy = -ball.speed * Math.cos(angle);
}

// ------------------------------------------
// 파티클 효과 (블록 깨질 때 튀는 가루)
// ------------------------------------------
function createParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x + BLOCK_WIDTH / 2,
      y: y + BLOCK_HEIGHT / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      radius: Math.random() * 4 + 2,
      color: color,
      alpha: 1,
      life: 0.92
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha *= p.life;

    if (p.alpha < 0.05) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  });
}

// ------------------------------------------
// 화면 그리기 (Draw functions)
// ------------------------------------------
function drawPaddle() {
  ctx.save();
  ctx.fillStyle = '#8e94f2'; // 부드러운 라벤더 패들
  ctx.shadowColor = 'rgba(142, 148, 242, 0.4)';
  ctx.shadowBlur = 8;
  
  // 둥근 둥근 모서리 패들그리기
  const r = 9;
  ctx.beginPath();
  ctx.moveTo(paddle.x + r, paddle.y);
  ctx.lineTo(paddle.x + paddle.width - r, paddle.y);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + r);
  ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - r);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - r, paddle.y + paddle.height);
  ctx.lineTo(paddle.x + r, paddle.y + paddle.height);
  ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - r);
  ctx.lineTo(paddle.x, paddle.y + r);
  ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + r, paddle.y);
  ctx.closePath();
  ctx.fill();

  // 패들 하이라이트 선
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(paddle.x + 10, paddle.y + 3, paddle.width - 20, 3);
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ff758f'; // 분홍빛 사탕 공
  ctx.shadowColor = 'rgba(255, 117, 143, 0.4)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.closePath();

  // 공에 반사광 입히기
  ctx.beginPath();
  ctx.arc(ball.x - 3, ball.y - 3, ball.radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();
  ctx.closePath();
  ctx.restore();
}

function drawBlocks() {
  for (let r = 0; r < BLOCK_ROWS; r++) {
    for (let c = 0; c < BLOCK_COLS; c++) {
      const b = blocks[r][c];
      if (b.status === 1) {
        ctx.save();
        ctx.fillStyle = b.color;
        
        // 블록 둥근 형태그리기
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(b.x + radius, b.y);
        ctx.lineTo(b.x + b.width - radius, b.y);
        ctx.quadraticCurveTo(b.x + b.width, b.y, b.x + b.width, b.y + radius);
        ctx.lineTo(b.x + b.width, b.y + b.height - radius);
        ctx.quadraticCurveTo(b.x + b.width, b.y + b.height, b.x + b.width - radius, b.y + b.height);
        ctx.lineTo(b.x + radius, b.y + b.height);
        ctx.quadraticCurveTo(b.x, b.y + b.height, b.x, b.y + b.height - radius);
        ctx.lineTo(b.x, b.y + radius);
        ctx.quadraticCurveTo(b.x, b.y, b.x + radius, b.y);
        ctx.closePath();
        ctx.fill();

        // 윗부분 밝은 입체감 효과
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(b.x + 4, b.y + 2, b.width - 8, 4);

        ctx.restore();
      }
    }
  }
}

// ------------------------------------------
// 충돌 감지 및 위치 업데이트
// ------------------------------------------
function movePaddle() {
  if (keys.left) {
    paddle.x -= PADDLE_SPEED;
  }
  if (keys.right) {
    paddle.x += PADDLE_SPEED;
  }

  // 화면 밖 나가지 못하게 제한
  if (paddle.x < 10) paddle.x = 10;
  if (paddle.x + paddle.width > CANVAS_WIDTH - 10) {
    paddle.x = CANVAS_WIDTH - 10 - paddle.width;
  }
}

function moveBall() {
  if (!isBallLaunched) {
    // 발사 전에는 패들 위에 공이 붙어 다님
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 2;
    return;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  // 벽 충돌 (좌, 우)
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.dx = -ball.dx;
    playSound('wall');
  } else if (ball.x + ball.radius > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - ball.radius;
    ball.dx = -ball.dx;
    playSound('wall');
  }

  // 천장 충돌
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
    playSound('wall');
  }

  // 패들 충돌 감지
  if (
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width
  ) {
    // 공이 패들의 어느 위치에 맞아도 입사각에 따라 다르게 반사
    const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const maxAngle = Math.PI / 3; // 최대 60도 꺾임
    const angle = hitPoint * maxAngle;

    const currentSpeed = Math.hypot(ball.dx, ball.dy);
    ball.dx = currentSpeed * Math.sin(angle);
    ball.dy = -currentSpeed * Math.cos(angle);
    ball.y = paddle.y - ball.radius - 1;

    playSound('paddle');
  }

  // 바닥에 떨어진 경우 (실패!)
  if (ball.y - ball.radius > CANVAS_HEIGHT) {
    lives--;
    updateUI();
    playSound('lose');

    if (lives <= 0) {
      endGame(false);
    } else {
      resetPaddleAndBall();
    }
  }
}

function checkBlockCollisions() {
  if (!isBallLaunched) return;

  for (let r = 0; r < BLOCK_ROWS; r++) {
    for (let c = 0; c < BLOCK_COLS; c++) {
      const b = blocks[r][c];
      if (b.status === 1) {
        // 공과 블록 충돌 (AABB)
        if (
          ball.x + ball.radius > b.x &&
          ball.x - ball.radius < b.x + b.width &&
          ball.y + ball.radius > b.y &&
          ball.y - ball.radius < b.y + b.height
        ) {
          b.status = 0; // 블록 깨부수기
          score += 10;
          remainingBlocks--;
          updateUI();

          createParticles(b.x, b.y, b.color);
          playSound('block');

          // 충돌 방향 감지하여 튕겨나가기
          const overlapLeft = ball.x + ball.radius - b.x;
          const overlapRight = b.x + b.width - (ball.x - ball.radius);
          const overlapTop = ball.y + ball.radius - b.y;
          const overlapBottom = b.y + b.height - (ball.y - ball.radius);

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapTop || minOverlap === overlapBottom) {
            ball.dy = -ball.dy;
          } else {
            ball.dx = -ball.dx;
          }

          // 승리 조건 검사
          if (remainingBlocks === 0) {
            endGame(true);
          }

          return; // 한 프레임당 블록 1개만 처리
        }
      }
    }
  }
}

// ------------------------------------------
// UI 업데이트 & 게임 종료 처리
// ------------------------------------------
function updateUI() {
  scoreDisplay.textContent = score;
  blocksDisplay.textContent = remainingBlocks;

  let hearts = '';
  for (let i = 0; i < lives; i++) {
    hearts += '❤️';
  }
  livesDisplay.textContent = hearts || '💀';
}

function endGame(isWin) {
  isGameRunning = false;
  cancelAnimationFrame(animationId);

  finalScore.textContent = score;
  resultModal.classList.remove('hidden');

  if (isWin) {
    resultTitle.textContent = '🎉 축하합니다! 완승!';
    resultMessage.textContent = '모든 파스텔 블록을 다 깼어요! 최고예요!';
    playSound('win');
  } else {
    resultTitle.textContent = '💔 게임 오버!';
    resultMessage.textContent = '공이 아래로 떨어졌어요. 다시 한번 도전해볼까요?';
  }
}

// ------------------------------------------
// 메인 게임 루프
// ------------------------------------------
function gameLoop() {
  // 배경 클리어
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (isGameRunning) {
    movePaddle();
    moveBall();
    checkBlockCollisions();
    updateParticles();
  }

  // 그리기 작업
  drawBlocks();
  drawPaddle();
  drawBall();
  drawParticles();

  if (isGameRunning) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

// ------------------------------------------
// 이벤트 리스너 (키보드 & 터치 및 모바일 조작)
// ------------------------------------------
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = true;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = true;
  } else if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    if (!isBallLaunched && isGameRunning) {
      launchBall();
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = false;
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = false;
  }
});

// 모바일 버튼 조작
btnLeft.addEventListener('pointerdown', () => { keys.left = true; });
btnLeft.addEventListener('pointerup', () => { keys.left = false; });
btnLeft.addEventListener('pointerleave', () => { keys.left = false; });

btnRight.addEventListener('pointerdown', () => { keys.right = true; });
btnRight.addEventListener('pointerup', () => { keys.right = false; });
btnRight.addEventListener('pointerleave', () => { keys.right = false; });

btnLaunch.addEventListener('click', () => {
  if (!isBallLaunched && isGameRunning) {
    launchBall();
  }
});

// 마우스/터치 드래그로 패들 직접 이동 지원
canvas.addEventListener('pointermove', (e) => {
  if (!isGameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;
  
  paddle.x = mouseX - paddle.width / 2;
  if (paddle.x < 10) paddle.x = 10;
  if (paddle.x + paddle.width > CANVAS_WIDTH - 10) {
    paddle.x = CANVAS_WIDTH - 10 - paddle.width;
  }
});

canvas.addEventListener('pointerdown', () => {
  if (isGameRunning && !isBallLaunched) {
    launchBall();
  }
});

// 시작 버튼 & 다시 시작 버튼
startGameBtn.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  initGame();
  isGameRunning = true;
  gameLoop();
});

restartBtn.addEventListener('click', () => {
  resultModal.classList.add('hidden');
  initGame();
  isGameRunning = true;
  gameLoop();
});

// 음향 켜기/끄기 토글
soundToggleBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    soundToggleBtn.textContent = '🔊 소리 켜짐';
    initAudio();
  } else {
    soundToggleBtn.textContent = '🔇 소리 끔';
  }
});

// 시작 시 1회 렌더링
initGame();
drawBlocks();
drawPaddle();
drawBall();
