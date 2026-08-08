// DOM 요소
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const appleCountElement = document.getElementById('appleCount');
const snakeLengthElement = document.getElementById('snakeLength');
const speedLevelElement = document.getElementById('speedLevel');

const startModal = document.getElementById('startModal');
const gameOverModal = document.getElementById('gameOverModal');
const victoryModal = document.getElementById('victoryModal');
const gameOverReason = document.getElementById('gameOverReason');

const startButton = document.getElementById('startButton');
const restartButtonGameOver = document.getElementById('restartButtonGameOver');
const restartButtonVictory = document.getElementById('restartButtonVictory');

const finalLengthGameOver = document.getElementById('finalLengthGameOver');
const finalApplesVictory = document.getElementById('finalApplesVictory');

// 터치/버튼 조작 요소
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

// 8x8 격자 크기 지정
const GRID_SIZE = 8;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE; // 64칸
const CANVAS_SIZE = 512;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 64px 당 1칸

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// 게임 내부 상태 변수
let gameState = 'STOPPED'; // 'STOPPED', 'RUNNING', 'GAMEOVER', 'VICTORY'
let gameTimer = null;

let snake = [];
let direction = { x: 1, y: 0 }; // 초기 방향: 오른쪽
let nextDirection = { x: 1, y: 0 };

let apple = { x: 0, y: 0 };
let applesEaten = 0;

// 속도 관리 (초보자도 쉽게 할 수 있게 느리고 여유롭게 조정!)
const INITIAL_SPEED = 500; // 0.5초당 1칸 이동 (매우 천천히 움직여서 쉬워요)
const MIN_SPEED = 200;     // 가장 빨라져도 여유로운 속도
const SPEED_DECREMENT = 5;  // 사과를 먹어도 조금씩만 빨라져요
let currentSpeed = INITIAL_SPEED;
let speedLevel = 1;

// 1. 뱀 및 게임 초기화
function initGame() {
  // 5칸 파란색 뱀 생성 (x: 0~4, y: 3 위치에서 오른쪽 진행)
  snake = [
    { x: 4, y: 3 }, // 머리
    { x: 3, y: 3 },
    { x: 2, y: 3 },
    { x: 1, y: 3 },
    { x: 0, y: 3 }  // 꼬리
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  applesEaten = 0;
  currentSpeed = INITIAL_SPEED;
  speedLevel = 1;

  spawnApple();
  updateScoreUI();
}

// 2. 사과 생성 (뱀 몸통이 없는 빈 칸에 생성)
function spawnApple() {
  // 뱀이 안 차있는 모든 빈 칸 찾기
  const emptyCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const isSnakeCell = snake.some(segment => segment.x === c && segment.y === r);
      if (!isSnakeCell) {
        emptyCells.push({ x: c, y: r });
      }
    }
  }

  // 만약 빈 칸이 없으면 (64칸 전체 차지시 승리)
  if (emptyCells.length === 0) {
    handleVictory();
    return;
  }

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  apple = emptyCells[randomIndex];
}

// 3. UI 갱신
function updateScoreUI() {
  appleCountElement.textContent = `${applesEaten}개`;
  snakeLengthElement.textContent = `${snake.length} / ${TOTAL_CELLS}칸`;
  speedLevelElement.textContent = `${speedLevel}단계`;
}

// 4. 방향 변경 요청 처리 (반대 방향 전환 방지)
function changeDirection(newDir) {
  if (gameState !== 'RUNNING') return;
  // 현재 방향의 반대로 가려고 하는 경우 무시
  if (newDir.x === -direction.x && newDir.y === -direction.y) return;
  nextDirection = newDir;
}

// 5. 게임 메인 이동 및 물리 업데이트
function update() {
  if (gameState !== 'RUNNING') return;

  direction = { ...nextDirection };

  const head = snake[0];
  const newHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  // 벽 충돌 체크 (머리가 8x8 범위를 벗어난 경우)
  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    handleGameOver("벽에 머리가 부딪혔어요!");
    return;
  }

  // 자기 몸통 충돌 체크
  const isSelfCollision = snake.some(segment => segment.x === newHead.x && segment.y === newHead.y);
  if (isSelfCollision) {
    handleGameOver("뱀 머리가 자기 몸통에 부딪혔어요!");
    return;
  }

  // 뱀 머리 이동
  snake.unshift(newHead);

  // 사과 먹기 판정
  if (newHead.x === apple.x && newHead.y === apple.y) {
    applesEaten++;

    // 사과 먹을 때마다 속도 증가 (인터벌 감소)
    if (currentSpeed > MIN_SPEED) {
      currentSpeed = Math.max(MIN_SPEED, currentSpeed - SPEED_DECREMENT);
      speedLevel = Math.floor((INITIAL_SPEED - currentSpeed) / SPEED_DECREMENT) + 1;
      
      // 타이머 재설정
      clearInterval(gameTimer);
      gameTimer = setInterval(gameLoop, currentSpeed);
    }

    updateScoreUI();

    // 승리 판정 (뱀 길이가 64칸 가득 참)
    if (snake.length === TOTAL_CELLS) {
      handleVictory();
      return;
    } else {
      spawnApple();
    }
  } else {
    // 사과를 안 먹었으면 꼬리 자르기 (길이 유지)
    snake.pop();
  }
}

// 6. 화면 그리기 (초록 배경, 파란 뱀, 빨간 사과)
function render() {
  // A. 초록색 체커보드 격자 배경 그리기
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const isEven = (r + c) % 2 === 0;
      ctx.fillStyle = isEven ? '#15803d' : '#166534';
      ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  // B. 사과 그리기 (빨간 구형 + 초록 잎사귀)
  if (snake.length < TOTAL_CELLS) {
    const appleCenterX = apple.x * CELL_SIZE + CELL_SIZE / 2;
    const appleCenterY = apple.y * CELL_SIZE + CELL_SIZE / 2;
    const appleRadius = CELL_SIZE * 0.38;

    // 사과 몸통
    ctx.beginPath();
    ctx.arc(appleCenterX, appleCenterY, appleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // 사과 잎사귀
    ctx.beginPath();
    ctx.ellipse(appleCenterX + 4, appleCenterY - appleRadius + 2, 6, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.closePath();
  }

  // C. 파란색 뱀 그리기
  snake.forEach((segment, index) => {
    const segX = segment.x * CELL_SIZE;
    const segY = segment.y * CELL_SIZE;
    const padding = 3;

    ctx.beginPath();
    // 머리는 좀 더 밝은 파란색, 몸통은 진한 파란색
    if (index === 0) {
      ctx.fillStyle = '#60a5fa'; // 머리
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = '#2563eb'; // 몸통
    }

    ctx.roundRect(segX + padding, segY + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.closePath();

    // 뱀 머리에 눈 그리기
    if (index === 0) {
      ctx.fillStyle = '#ffffff';
      const eyeOffset = CELL_SIZE / 4;
      const eyeRadius = 4;

      let eye1X = segX + CELL_SIZE / 2;
      let eye1Y = segY + CELL_SIZE / 2;
      let eye2X = segX + CELL_SIZE / 2;
      let eye2Y = segY + CELL_SIZE / 2;

      if (direction.x === 1) { // 오른쪽
        eye1X = segX + CELL_SIZE - eyeOffset; eye1Y = segY + eyeOffset;
        eye2X = segX + CELL_SIZE - eyeOffset; eye2Y = segY + CELL_SIZE - eyeOffset;
      } else if (direction.x === -1) { // 왼쪽
        eye1X = segX + eyeOffset; eye1Y = segY + eyeOffset;
        eye2X = segX + eyeOffset; eye2Y = segY + CELL_SIZE - eyeOffset;
      } else if (direction.y === -1) { // 위쪽
        eye1X = segX + eyeOffset; eye1Y = segY + eyeOffset;
        eye2X = segX + CELL_SIZE - eyeOffset; eye2Y = segY + eyeOffset;
      } else if (direction.y === 1) { // 아래쪽
        eye1X = segX + eyeOffset; eye1Y = segY + CELL_SIZE - eyeOffset;
        eye2X = segX + CELL_SIZE - eyeOffset; eye2Y = segY + CELL_SIZE - eyeOffset;
      }

      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();

      // 검은 눈동자
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeRadius / 2, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeRadius / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
  });
}

// 7. 게임 루프 실행 함수
function gameLoop() {
  update();
  render();
}

// 8. 게임 오버 처리
function handleGameOver(reasonText) {
  gameState = 'GAMEOVER';
  clearInterval(gameTimer);
  gameOverReason.textContent = reasonText;
  finalLengthGameOver.textContent = snake.length;
  gameOverModal.classList.remove('hidden');
}

// 9. 게임 승리 처리
function handleVictory() {
  gameState = 'VICTORY';
  clearInterval(gameTimer);
  finalApplesVictory.textContent = applesEaten;
  victoryModal.classList.remove('hidden');
}

// 10. 게임 시작 함수
function startGame() {
  initGame();
  startModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');
  victoryModal.classList.add('hidden');
  gameState = 'RUNNING';

  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(gameLoop, currentSpeed);
  render();
}

// 키보드 조작 이벤트 연결
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      changeDirection({ x: 0, y: -1 });
      e.preventDefault();
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      changeDirection({ x: 0, y: 1 });
      e.preventDefault();
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      changeDirection({ x: -1, y: 0 });
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      changeDirection({ x: 1, y: 0 });
      e.preventDefault();
      break;
  }
});

// 모바일 D-Pad 버튼 조작 이벤트 연결
btnUp.addEventListener('click', () => changeDirection({ x: 0, y: -1 }));
btnDown.addEventListener('click', () => changeDirection({ x: 0, y: 1 }));
btnLeft.addEventListener('click', () => changeDirection({ x: -1, y: 0 }));
btnRight.addEventListener('click', () => changeDirection({ x: 1, y: 0 }));

// 마우스 이동 조작 (마우스 커서 방향으로 뱀이 머리를 돌려 따라옴)
canvas.addEventListener('mousemove', (e) => {
  if (gameState !== 'RUNNING') return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_SIZE / rect.width;
  const scaleY = CANVAS_SIZE / rect.height;

  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  const head = snake[0];
  const headCenterX = head.x * CELL_SIZE + CELL_SIZE / 2;
  const headCenterY = head.y * CELL_SIZE + CELL_SIZE / 2;

  const diffX = mouseX - headCenterX;
  const diffY = mouseY - headCenterY;

  if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        changeDirection({ x: 1, y: 0 }); // 오른쪽
      } else {
        changeDirection({ x: -1, y: 0 }); // 왼쪽
      }
    } else {
      if (diffY > 0) {
        changeDirection({ x: 0, y: 1 }); // 아래쪽
      } else {
        changeDirection({ x: 0, y: -1 }); // 위쪽
      }
    }
  }
});

// 모바일 터치 이동 조작 (손가락 위치를 따라 뱀이 이동)
canvas.addEventListener('touchmove', (e) => {
  if (gameState !== 'RUNNING' || e.touches.length === 0) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_SIZE / rect.width;
  const scaleY = CANVAS_SIZE / rect.height;

  const touchX = (touch.clientX - rect.left) * scaleX;
  const touchY = (touch.clientY - rect.top) * scaleY;

  const head = snake[0];
  const headCenterX = head.x * CELL_SIZE + CELL_SIZE / 2;
  const headCenterY = head.y * CELL_SIZE + CELL_SIZE / 2;

  const diffX = touchX - headCenterX;
  const diffY = touchY - headCenterY;

  if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        changeDirection({ x: 1, y: 0 });
      } else {
        changeDirection({ x: -1, y: 0 });
      }
    } else {
      if (diffY > 0) {
        changeDirection({ x: 0, y: 1 });
      } else {
        changeDirection({ x: 0, y: -1 });
      }
    }
  }
  e.preventDefault();
}, { passive: false });

// 시작/다시하기 버튼 연결
startButton.addEventListener('click', startGame);
restartButtonGameOver.addEventListener('click', startGame);
restartButtonVictory.addEventListener('click', startGame);

// 초기 화면 렌더링
initGame();
render();
