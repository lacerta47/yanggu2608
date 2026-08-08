// 우주 블록깨기 게임 (v1)

// HTML 요소 가져오기
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreText = document.getElementById('scoreText');
const livesText = document.getElementById('livesText');

const gameModal = document.getElementById('gameModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalBtn = document.getElementById('modalBtn');

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnLaunch = document.getElementById('btnLaunch');

// 웹 오디오 API (효과음 생성용)
let audioCtx = null;

function playSound(type) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'bounce') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'lose') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    // 오디오 미지원 환경 예외 처리
  }
}

// 게임 변수 및 상태
let score = 0;
let lives = 3;
let gameState = 'START'; // START, PLAYING, GAMEOVER, VICTORY

// 방향키 상태
let rightPressed = false;
let leftPressed = false;

// 배경 우주 별 60개 생성
const stars = [];
for (let i = 0; i < 60; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    alpha: Math.random() * 0.8 + 0.2,
    speed: Math.random() * 0.3 + 0.1
  });
}

// 파티클 (블록 부서질 때 튀는 조각들)
let particles = [];

function createParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 4 + 2,
      color: color,
      life: 1.0,
      decay: Math.random() * 0.03 + 0.02
    });
  }
}

// 바 (우주선 Paddle)
const paddle = {
  width: 110,
  height: 16,
  x: (canvas.width - 110) / 2,
  y: canvas.height - 35,
  speed: 8,
  dx: 0
};

// 공 (우주 에너지고원 Ball)
const ball = {
  x: canvas.width / 2,
  y: paddle.y - 12,
  radius: 8,
  speed: 6,
  dx: 0,
  dy: 0,
  isAttached: true
};

// 블록 (Space Gemstone Bricks) 설정
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 84;
const brickHeight = 22;
const brickPadding = 10;
const brickOffsetTop = 50;
const brickOffsetLeft = 27;

const brickColors = [
  { fill: '#ff4757', stroke: '#ff6b81' }, // 1행: 루비 레드
  { fill: '#ffa502', stroke: '#eccc68' }, // 2행: 토파즈 오렌지
  { fill: '#2ed573', stroke: '#7bed9f' }, // 3행: 에메랄드 그린
  { fill: '#1e90ff', stroke: '#70a1ff' }, // 4행: 사파이어 블루
  { fill: '#9b59b6', stroke: '#be2edd' }  // 5행: 자수정 퍼플
];

let bricks = [];

function initBricks() {
  bricks = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[r] = [];
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[r][c] = {
        x: 0,
        y: 0,
        status: 1, // 1: 존재, 0: 깨짐
        color: brickColors[r]
      };
    }
  }
}

// 키보드 조작 이벤트
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
    rightPressed = true;
  } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
    leftPressed = true;
  } else if (e.key === ' ' || e.key === 'Spacebar') {
    launchBall();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
    rightPressed = false;
  } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
    leftPressed = false;
  }
});

// 모바일 및 마우스 터치 조작 지원
let touchStartX = null;
canvas.addEventListener('pointerdown', (e) => {
  touchStartX = e.clientX;
  launchBall();
});

canvas.addEventListener('pointermove', (e) => {
  if (gameState === 'PLAYING') {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (e.clientX - rect.left) * scaleX;
    paddle.x = canvasX - paddle.width / 2;

    // 바 경계 제한
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

    if (ball.isAttached) {
      ball.x = paddle.x + paddle.width / 2;
    }
  }
});

// 모바일 버튼 조작 이벤트
btnLeft.addEventListener('pointerdown', () => { leftPressed = true; });
btnLeft.addEventListener('pointerup', () => { leftPressed = false; });
btnLeft.addEventListener('pointerleave', () => { leftPressed = false; });

btnRight.addEventListener('pointerdown', () => { rightPressed = true; });
btnRight.addEventListener('pointerup', () => { rightPressed = false; });
btnRight.addEventListener('pointerleave', () => { rightPressed = false; });

btnLaunch.addEventListener('click', launchBall);

// 공 발사 함수
function launchBall() {
  if (ball.isAttached && gameState === 'PLAYING') {
    ball.isAttached = false;
    ball.dx = (Math.random() - 0.5) * 4; // 약간 좌우로 튀게 지정
    ball.dy = -ball.speed;
    playSound('bounce');
  }
}

// 공과 바 리셋
function resetBallAndPaddle() {
  paddle.x = (canvas.width - paddle.width) / 2;
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius;
  ball.dx = 0;
  ball.dy = 0;
  ball.isAttached = true;
}

// 새 게임 시작
function startNewGame() {
  score = 0;
  lives = 3;
  scoreText.textContent = score;
  livesText.textContent = lives;
  initBricks();
  resetBallAndPaddle();
  gameState = 'PLAYING';
  gameModal.classList.add('hidden');
}

modalBtn.addEventListener('click', () => {
  startNewGame();
});

// 충돌 감지 로직
function collisionDetection() {
  let remainingBricks = 0;

  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < brickColumnCount; c++) {
      const b = bricks[r][c];
      if (b.status === 1) {
        remainingBricks++;

        // 공과 블록의 충돌 계산
        if (
          ball.x + ball.radius > b.x &&
          ball.x - ball.radius < b.x + brickWidth &&
          ball.y + ball.radius > b.y &&
          ball.y - ball.radius < b.y + brickHeight
        ) {
          ball.dy = -ball.dy;
          b.status = 0;
          score += 10;
          scoreText.textContent = score;

          // 파티클 및 효과음
          createParticles(b.x + brickWidth / 2, b.y + brickHeight / 2, b.color.fill);
          playSound('hit');

          // 전부 깨뜨렸을 때 승리!
          if (remainingBricks - 1 === 0) {
            gameState = 'VICTORY';
            playSound('win');
            showModal('🎉 축하합니다! 승리하셨어요!', `모든 블록을 깨뜨려 우주를 구했어요!\n최종 점수: ${score}점`);
          }
        }
      }
    }
  }
}

// 모달 표시 함수
function showModal(title, msg) {
  modalTitle.textContent = title;
  modalMessage.textContent = msg;
  modalBtn.textContent = '다시 도전하기!';
  gameModal.classList.remove('hidden');
}

// 게임 업데이트 로직
function update() {
  if (gameState !== 'PLAYING') return;

  // 바 이동
  if (rightPressed && paddle.x < canvas.width - paddle.width) {
    paddle.x += paddle.speed;
  } else if (leftPressed && paddle.x > 0) {
    paddle.x -= paddle.speed;
  }

  // 공이 바 위에 붙어 있는 경우
  if (ball.isAttached) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    return;
  }

  // 공 이동
  ball.x += ball.dx;
  ball.y += ball.dy;

  // 공 벽면 반사 (좌, 우)
  if (ball.x + ball.radius > canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.dx = -ball.dx;
    playSound('bounce');
  } else if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.dx = -ball.dx;
    playSound('bounce');
  }

  // 공 천장 반사
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
    playSound('bounce');
  }

  // 공이 바와 부딪힐 때
  if (
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width
  ) {
    playSound('bounce');
    // 부딪힌 위치에 따라 반사 각도 조절
    const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.dx = hitPoint * 7;
    ball.dy = -Math.abs(ball.dy);
  }

  // 공이 아래로 떨어졌을 때 (목숨 차감)
  if (ball.y - ball.radius > canvas.height) {
    lives--;
    livesText.textContent = lives;
    playSound('lose');

    if (lives <= 0) {
      gameState = 'GAMEOVER';
      showModal('💥 게임 오버', `아쉽게도 공을 놓쳤어요!\n최종 점수: ${score}점`);
    } else {
      resetBallAndPaddle();
    }
  }

  // 블록 충돌 체크
  collisionDetection();
}

// 게임 그리기 로직 (Rendering)
function draw() {
  // 캔버스 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 우주 배경 별 그리기 및 위치 업데이트
  for (let s of stars) {
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();

    s.y += s.speed;
    if (s.y > canvas.height) s.y = 0;
  }

  // 2. 블록 그리기
  for (let r = 0; r < brickRowCount; r++) {
    for (let c = 0; c < brickColumnCount; c++) {
      const b = bricks[r][c];
      if (b.status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        b.x = brickX;
        b.y = brickY;

        // 보석 블록 그림자 glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color.fill;

        ctx.fillStyle = b.color.fill;
        ctx.beginPath();
        ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 6);
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = b.color.stroke;
        ctx.stroke();

        ctx.shadowBlur = 0; // 그림자 초기화
      }
    }
  }

  // 3. 파티클 그리기 및 위치 업데이트
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // 4. 바 (우주선) 그리기
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00f2fe';
  ctx.fillStyle = '#00f2fe';
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
  ctx.fill();

  // 바 테두리 덮어쓰기
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 5. 공 (우주 에너지고원) 그리기
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ffdd59';
  ctx.fillStyle = '#ffdd59';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// 메인 루프 (Main Loop)
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// 게임 초기화 및 첫 프레임 시작
initBricks();
gameLoop();
