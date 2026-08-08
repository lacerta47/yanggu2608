// DOM 요소 가져오기
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const remainingBricksElement = document.getElementById('remainingBricks');

const startModal = document.getElementById('startModal');
const gameOverModal = document.getElementById('gameOverModal');
const victoryModal = document.getElementById('victoryModal');

const startButton = document.getElementById('startButton');
const restartButtonGameOver = document.getElementById('restartButtonGameOver');
const restartButtonVictory = document.getElementById('restartButtonVictory');

const finalScoreGameOver = document.getElementById('finalScoreGameOver');
const finalScoreVictory = document.getElementById('finalScoreVictory');

// 게임 내부 좌표계 설정 (800 x 500)
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// 키보드 상태 관리
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  KeyA: false,
  KeyD: false
};

// 게임 변수
let animationFrameId = null;
let gameState = 'STOPPED'; // 'STOPPED', 'RUNNING', 'GAMEOVER', 'VICTORY'
let score = 0;

// 바 (Paddle) 객체 (초보자도 쉽게 받을 수 있게 넓게 변경!)
const paddle = {
  width: 180,
  height: 16,
  x: (CANVAS_WIDTH - 180) / 2,
  y: CANVAS_HEIGHT - 35,
  speed: 9,
  color: '#38bdf8',
  borderRadius: 8
};

// 공 (Ball) 객체 (느리고 여유롭게 움직이도록 조정!)
const ball = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT - 55,
  radius: 9,
  dx: 3,
  dy: -3.5,
  speed: 3.8,
  color: '#fbbf24'
};

// 블록 (Bricks) 설정
const brickConfig = {
  rows: 5,
  cols: 8,
  padding: 12,
  offsetTop: 50,
  offsetLeft: 45,
  height: 24,
  colors: ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#60a5fa']
};

// 계산된 블록 너비: (전체 너비 - 여백) / 열 수
const brickWidth = (CANVAS_WIDTH - (brickConfig.offsetLeft * 2) - (brickConfig.padding * (brickConfig.cols - 1))) / brickConfig.cols;

let bricks = [];
let totalBricksCount = 0;
let remainingBricksCount = 0;

// 1. 블록 배열 초기화
function initBricks() {
  bricks = [];
  totalBricksCount = brickConfig.rows * brickConfig.cols;
  remainingBricksCount = totalBricksCount;

  for (let r = 0; r < brickConfig.rows; r++) {
    bricks[r] = [];
    for (let c = 0; c < brickConfig.cols; c++) {
      const brickX = brickConfig.offsetLeft + c * (brickWidth + brickConfig.padding);
      const brickY = brickConfig.offsetTop + r * (brickConfig.height + brickConfig.padding);

      bricks[r][c] = {
        x: brickX,
        y: brickY,
        width: brickWidth,
        height: brickConfig.height,
        color: brickConfig.colors[r % brickConfig.colors.length],
        status: 1 // 1: 존재함, 0: 파괴됨
      };
    }
  }

  updateScoreUI();
}

// 2. 바 및 공 초기 위치 설정
function resetPositions() {
  paddle.x = (CANVAS_WIDTH - paddle.width) / 2;
  paddle.y = CANVAS_HEIGHT - 35;

  ball.x = CANVAS_WIDTH / 2;
  ball.y = paddle.y - ball.radius - 2;

  // 무작위 좌우 방향 출발 각도 지정
  const randomDirection = Math.random() < 0.5 ? -1 : 1;
  ball.dx = ball.speed * 0.7 * randomDirection;
  ball.dy = -ball.speed;
}

// 3. 게임 전체 초기화
function initGame() {
  score = 0;
  initBricks();
  resetPositions();
  updateScoreUI();
}

// UI 갱신 함수
function updateScoreUI() {
  scoreElement.textContent = score;
  remainingBricksElement.textContent = remainingBricksCount;
}

// 4. 바 그리기
function drawPaddle() {
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, paddle.borderRadius);
  ctx.fillStyle = paddle.color;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();
}

// 5. 공 그리기
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();
}

// 6. 블록 그리기
function drawBricks() {
  for (let r = 0; r < brickConfig.rows; r++) {
    for (let c = 0; c < brickConfig.cols; c++) {
      const b = bricks[r][c];
      if (b.status === 1) {
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 6);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
      }
    }
  }
}

// 7. 공과 블록 충돌 처리
function collisionDetection() {
  for (let r = 0; r < brickConfig.rows; r++) {
    for (let c = 0; c < brickConfig.cols; c++) {
      const b = bricks[r][c];
      if (b.status === 1) {
        // 공의 구형 충돌 범위 체크
        if (
          ball.x + ball.radius > b.x &&
          ball.x - ball.radius < b.x + b.width &&
          ball.y + ball.radius > b.y &&
          ball.y - ball.radius < b.y + b.height
        ) {
          ball.dy = -ball.dy; // 공 반사
          b.status = 0; // 블록 파괴
          score += 10;
          remainingBricksCount--;

          updateScoreUI();

          // 승리 판정 (모든 블록 파괴시)
          if (remainingBricksCount === 0) {
            handleVictory();
          }
          return;
        }
      }
    }
  }
}

// 8. 게임 상태 업데이트 및 이동 로직
function update() {
  if (gameState !== 'RUNNING') return;

  // 키보드로 바 이동
  if ((keys.ArrowLeft || keys.KeyA) && paddle.x > 0) {
    paddle.x -= paddle.speed;
  }
  if ((keys.ArrowRight || keys.KeyD) && paddle.x < CANVAS_WIDTH - paddle.width) {
    paddle.x += paddle.speed;
  }

  // 공 이동
  ball.x += ball.dx;
  ball.y += ball.dy;

  // 좌우 벽 충돌
  if (ball.x + ball.radius > CANVAS_WIDTH || ball.x - ball.radius < 0) {
    ball.dx = -ball.dx;
  }

  // 위쪽 벽 충돌
  if (ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
  }

  // 바(Paddle) 충돌 판정
  if (
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
  ) {
    // 바의 부딪힌 위치에 따라 공 튕김 각도 계산 (중앙에서 멀수록 더 기울어져 튕김)
    const hitPoint = ball.x - (paddle.x + paddle.width / 2);
    const normalizedHitPoint = hitPoint / (paddle.width / 2);
    const maxBounceAngle = Math.PI / 3; // 60도

    const bounceAngle = normalizedHitPoint * maxBounceAngle;
    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

    ball.dx = currentSpeed * Math.sin(bounceAngle);
    ball.dy = -currentSpeed * Math.cos(bounceAngle);
    ball.y = paddle.y - ball.radius;
  }

  // 바닥으로 공 떨어짐 (게임 오버)
  if (ball.y + ball.radius > CANVAS_HEIGHT) {
    handleGameOver();
    return;
  }

  // 블록 충돌 체크
  collisionDetection();
}

// 9. 화면 그리기 함수
function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBricks();
  drawPaddle();
  drawBall();
}

// 10. 메인 루프
function gameLoop() {
  update();
  render();

  if (gameState === 'RUNNING') {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

// 11. 승리 처리
function handleVictory() {
  gameState = 'VICTORY';
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  finalScoreVictory.textContent = score;
  victoryModal.classList.remove('hidden');
}

// 12. 패배 처리 (게임 오버)
function handleGameOver() {
  gameState = 'GAMEOVER';
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  finalScoreGameOver.textContent = score;
  gameOverModal.classList.remove('hidden');
}

// 13. 게임 시작 함수
function startGame() {
  initGame();
  startModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');
  victoryModal.classList.add('hidden');
  gameState = 'RUNNING';
  gameLoop();
}

// 이벤트 리스너 등록
// 키보드 조작
window.addEventListener('keydown', (e) => {
  if (e.code in keys) {
    keys[e.code] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code in keys) {
    keys[e.code] = false;
  }
});

// 마우스 & 터치 좌표를 캔버스 비율에 맞게 변환하는 함수
function getCanvasX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  return (clientX - rect.left) * scaleX;
}

// 마우스 조작
canvas.addEventListener('mousemove', (e) => {
  if (gameState !== 'RUNNING') return;
  const canvasX = getCanvasX(e.clientX);
  paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, canvasX - paddle.width / 2));
});

// 터치 조작 (모바일)
canvas.addEventListener('touchmove', (e) => {
  if (gameState !== 'RUNNING' || e.touches.length === 0) return;
  const touchX = getCanvasX(e.touches[0].clientX);
  paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, touchX - paddle.width / 2));
  e.preventDefault(); // 스크롤 방지
}, { passive: false });

// 버튼 이벤트 연결
startButton.addEventListener('click', startGame);
restartButtonGameOver.addEventListener('click', startGame);
restartButtonVictory.addEventListener('click', startGame);

// 초기 화면 렌더링
initGame();
render();
