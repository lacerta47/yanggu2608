// 캔버스 및 UI 요소 가져오기
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const blockCountElement = document.getElementById('block-count');
const resultModal = document.getElementById('resultModal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const restartBtn = document.getElementById('restartBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// 게임 설정 상수
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 16;
const BALL_RADIUS = 9;

const BLOCK_ROWS = 5;
const BLOCK_COLS = 8;
const BLOCK_PADDING = 12;
const BLOCK_OFFSET_TOP = 60;
const BLOCK_OFFSET_LEFT = 45;
const BLOCK_HEIGHT = 24;
const BLOCK_WIDTH = (CANVAS_WIDTH - (BLOCK_OFFSET_LEFT * 2) - (BLOCK_PADDING * (BLOCK_COLS - 1))) / BLOCK_COLS;

// 블록 색상 팔레트
const ROW_COLORS = [
    '#f43f5e', // 빨강 (1줄)
    '#fb923c', // 주황 (2줄)
    '#facc15', // 노랑 (3줄)
    '#4ade80', // 초록 (4줄)
    '#38bdf8'  // 파랑 (5줄)
];

// 게임 상태 변수
let score = 0;
let remainingBlocks = 0;
let isGameOver = false;
let isGameWon = false;
let animationId = null;

// 조작 상태
let rightPressed = false;
let leftPressed = false;

// 막대기 (Paddle) 객체
const paddle = {
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    y: CANVAS_HEIGHT - 35,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 8,
    dx: 0
};

// 공 (Ball) 객체
const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    radius: BALL_RADIUS,
    speed: 6,
    dx: 4,
    dy: -5
};

// 파티클 (이펙트) 배열
let particles = [];

// 블록 배열
let blocks = [];

// 키보드 이벤트 리스너
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

// 마우스 / 터치 조작 (캔버스 위에서 이동)
canvas.addEventListener('mousemove', mouseMoveHandler);
canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });

// 모바일 버튼 조작 이벤트
leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); leftPressed = true; });
leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); leftPressed = false; });
leftBtn.addEventListener('mousedown', () => { leftPressed = true; });
leftBtn.addEventListener('mouseup', () => { leftPressed = false; });

rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); rightPressed = true; });
rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); rightPressed = false; });
rightBtn.addEventListener('mousedown', () => { rightPressed = true; });
rightBtn.addEventListener('mouseup', () => { rightPressed = false; });

restartBtn.addEventListener('click', initGame);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const relativeX = (e.clientX - rect.left) * scaleX;
    
    if (relativeX > 0 && relativeX < CANVAS_WIDTH) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

function touchMoveHandler(e) {
    if (e.touches.length > 0) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const relativeX = (e.touches[0].clientX - rect.left) * scaleX;
        
        if (relativeX > 0 && relativeX < CANVAS_WIDTH) {
            paddle.x = relativeX - paddle.width / 2;
        }
    }
}

// 게임 초기화
function initGame() {
    score = 0;
    isGameOver = false;
    isGameWon = false;
    particles = [];

    // 막대기 초기화
    paddle.x = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;

    // 공 초기화
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT - 50;
    const initialAngle = (Math.random() * 0.6 - 0.3); // 약간의 랜덤 각도
    ball.dx = 5 * Math.sin(initialAngle) || 4;
    ball.dy = -5;

    // 블록 만들기
    blocks = [];
    remainingBlocks = BLOCK_ROWS * BLOCK_COLS;
    
    for (let r = 0; r < BLOCK_ROWS; r++) {
        blocks[r] = [];
        for (let c = 0; c < BLOCK_COLS; c++) {
            const blockX = BLOCK_OFFSET_LEFT + c * (BLOCK_WIDTH + BLOCK_PADDING);
            const blockY = BLOCK_OFFSET_TOP + r * (BLOCK_HEIGHT + BLOCK_PADDING);
            blocks[r][c] = {
                x: blockX,
                y: blockY,
                status: 1, // 1: 존재함, 0: 깨짐
                color: ROW_COLORS[r]
            };
        }
    }

    // UI 업데이트
    updateUI();
    resultModal.classList.add('hidden');

    // 이전 애니메이션 멈추고 다시 시작
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    gameLoop();
}

// UI 텍스트 갱신
function updateUI() {
    scoreElement.textContent = score;
    blockCountElement.textContent = remainingBlocks;
}

// 파티클 생성 (블록 조각 이펙트)
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 2,
            color: color,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            life: 25
        });
    }
}

// 파티클 그리기 및 업데이트
function handleParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 25;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.closePath();

        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 충돌 검사 (공과 블록)
function collisionDetection() {
    for (let r = 0; r < BLOCK_ROWS; r++) {
        for (let c = 0; c < BLOCK_COLS; c++) {
            const b = blocks[r][c];
            if (b.status === 1) {
                if (
                    ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + BLOCK_WIDTH &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + BLOCK_HEIGHT
                ) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    remainingBlocks--;
                    
                    // 조각 튀는 이펙트
                    createParticles(b.x + BLOCK_WIDTH / 2, b.y + BLOCK_HEIGHT / 2, b.color);
                    
                    updateUI();

                    // 모든 블록을 깼을 때 승리!
                    if (remainingBlocks === 0) {
                        isGameWon = true;
                        showResultModal(true);
                    }
                }
            }
        }
    }
}

// 공 그리기
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#38bdf8';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // 초기화
}

// 막대기 그리기
function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#38bdf8';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

// 블록들 그리기
function drawBlocks() {
    for (let r = 0; r < BLOCK_ROWS; r++) {
        for (let c = 0; c < BLOCK_COLS; c++) {
            if (blocks[r][c].status === 1) {
                const b = blocks[r][c];
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, BLOCK_WIDTH, BLOCK_HEIGHT, 6);
                ctx.fillStyle = b.color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// 게임 요소 위치 업데이트
function update() {
    if (isGameOver || isGameWon) return;

    // 막대기 이동
    if (rightPressed && paddle.x < CANVAS_WIDTH - paddle.width) {
        paddle.x += paddle.speed;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }

    // 공 위치 이동
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 공-좌우 벽 충돌
    if (ball.x + ball.radius > CANVAS_WIDTH || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }

    // 공-천장 충돌
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // 공-막대기 충돌
    if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        // 공이 막대기의 어디에 닿았는지에 따라 튕겨 나가는 각도 조정
        const hitPoint = ball.x - (paddle.x + paddle.width / 2);
        const normalizedHitPoint = hitPoint / (paddle.width / 2); // -1 ~ 1
        const maxAngle = Math.PI / 3; // 최대 60도
        const bounceAngle = normalizedHitPoint * maxAngle;
        
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.sin(bounceAngle);
        ball.dy = -speed * Math.cos(bounceAngle);

        // 공이 막대기에 묻히는 것을 방지
        ball.y = paddle.y - ball.radius;
    }

    // 공-바닥 충돌 (게임 오버)
    if (ball.y + ball.radius > CANVAS_HEIGHT) {
        isGameOver = true;
        showResultModal(false);
    }

    // 공-블록 충돌 검사
    collisionDetection();
}

// 결과 창 보여주기 (승리 / 패배)
function showResultModal(won) {
    if (won) {
        modalIcon.textContent = '🎉';
        modalTitle.textContent = '축하합니다! 승리!';
        modalTitle.style.color = '#10b981';
        modalMessage.textContent = `모든 블록을 완벽하게 깨뜨렸어요! (최종 점수: ${score}점)`;
    } else {
        modalIcon.textContent = '😭';
        modalTitle.textContent = '게임 오버';
        modalTitle.style.color = '#f43f5e';
        modalMessage.textContent = `공이 바닥으로 떨어졌어요. 다시 도전해 보세요! (점수: ${score}점)`;
    }
    resultModal.classList.remove('hidden');
}

// 화면 그리기 루프
function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBlocks();
    drawPaddle();
    drawBall();
    handleParticles();
}

// 게임 메인 루프
function gameLoop() {
    update();
    draw();
    if (!isGameOver && !isGameWon) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// 게임 최초 실행
initGame();
