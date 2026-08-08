// ==========================================
// 🚀 우주 블록깨기 게임 (v1) - JavaScript
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI 엘리먼트
const scoreText = document.getElementById('scoreText');
const livesText = document.getElementById('livesText');
const bricksText = document.getElementById('bricksText');

const overlayScreen = document.getElementById('overlayScreen');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const startButton = document.getElementById('startButton');

const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

// 게임 진행 상태
const GAME_STATE = {
    IDLE: 'IDLE',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER',
    VICTORY: 'VICTORY'
};
let currentState = GAME_STATE.IDLE;

// 게임 속성
let score = 0;
let lives = 3;
let animationFrameId = null;

// 바(Paddle) 설정
const paddle = {
    width: 120,
    height: 16,
    x: (canvas.width - 120) / 2,
    y: canvas.height - 35,
    speed: 8,
    dx: 0,
    color: '#00f2fe'
};

// 공(Ball) 설정
const ball = {
    radius: 9,
    x: canvas.width / 2,
    y: canvas.height - 50,
    speed: 5.5,
    dx: 4,
    dy: -4,
    color: '#ffffff'
};

// 블록(Bricks) 설정
const brickConfig = {
    rowCount: 4,
    columnCount: 7,
    padding: 12,
    offsetTop: 60,
    offsetLeft: 45,
    width: 0, // 계산됨
    height: 24
};
// 블록 너비 자동 계산
brickConfig.width = (canvas.width - (brickConfig.offsetLeft * 2) - (brickConfig.padding * (brickConfig.columnCount - 1))) / brickConfig.columnCount;

let bricks = [];
const rowColors = ['#ff2a75', '#e040fb', '#00e5ff', '#76ff03'];

// 배경 별(Stars) 및 파티클(Particles)
let stars = [];
let particles = [];

// 키보드 상태
const keys = {
    left: false,
    right: false
};

// ==========================================
// 🔊 효과음 (Web Audio API 활용 - 사운드 생성)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
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
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'break') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
    } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// ==========================================
// 🌌 게임 요소 초기화
// ==========================================

// 배경 별 생성
function initStars() {
    stars = [];
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random()
        });
    }
}

// 블록 배열 생성
function initBricks() {
    bricks = [];
    for (let r = 0; r < brickConfig.rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const brickX = brickConfig.offsetLeft + c * (brickConfig.width + brickConfig.padding);
            const brickY = brickConfig.offsetTop + r * (brickConfig.height + brickConfig.padding);
            bricks[r][c] = {
                x: brickX,
                y: brickY,
                status: 1,
                color: rowColors[r % rowColors.length]
            };
        }
    }
}

// 공 위치 초기화
function resetBallAndPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * (3.5 + Math.random() * 1.5);
    ball.dy = -4.5;
}

// 파티클 폭발 효과 생성
function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3 + 1,
            color: color,
            alpha: 1,
            life: 25
        });
    }
}

// ==========================================
// 🎨 그리기 연산 (Draw functions)
// ==========================================

// 배경 그리기 (우주 별빛 효과)
function drawBackground() {
    ctx.fillStyle = '#050716';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // 별 약간씩 반짝이기
        star.alpha += (Math.random() - 0.5) * 0.05;
        if (star.alpha < 0.2) star.alpha = 0.2;
        if (star.alpha > 1) star.alpha = 1;
    });
}

// 바(Paddle) 그리기
function drawPaddle() {
    ctx.save();
    // 네온 글로우 효과
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddle.color;

    // 모서리가 둥근 슬림 바
    ctx.fillStyle = paddle.color;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();

    // 바 내부 미세 빛 표현
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.roundRect(paddle.x + 10, paddle.y + 3, paddle.width - 20, 3, 2);
    ctx.fill();

    ctx.restore();
}

// 공(Ball) 그리기
function drawBall() {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f2fe';

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.closePath();

    ctx.restore();
}

// 블록(Bricks) 그리기
function drawBricks() {
    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                ctx.save();
                ctx.shadowBlur = 8;
                ctx.shadowColor = b.color;

                ctx.fillStyle = b.color;
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, brickConfig.width, brickConfig.height, 5);
                ctx.fill();

                // 블록 윗부분 하이라이트
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.roundRect(b.x + 2, b.y + 2, brickConfig.width - 4, 4, 2);
                ctx.fill();

                ctx.restore();
            }
        }
    }
}

// 파티클 효과 업데이트 및 그리기
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        p.alpha = p.life / 25;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ==========================================
// ⚙️ 업데이트 & 충돌 판정
// ==========================================

function updatePaddle() {
    if (keys.left && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keys.right && paddle.x + paddle.width < canvas.width) {
        paddle.x += paddle.speed;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 좌우 벽 충돌
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.dx = -ball.dx;
        playSound('bounce');
    } else if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.dx = -ball.dx;
        playSound('bounce');
    }

    // 천장 충돌
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy = -ball.dy;
        playSound('bounce');
    }

    // 바(Paddle) 충돌
    if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        // 공이 어디 부딪쳤는지 위치에 따라 튕기는 각도 조정
        const hitPoint = ball.x - (paddle.x + paddle.width / 2);
        const normalizedHitPoint = hitPoint / (paddle.width / 2); // -1 ~ 1
        const maxAngle = Math.PI / 3; // 최대 60도
        const bounceAngle = normalizedHitPoint * maxAngle;

        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = currentSpeed * Math.sin(bounceAngle);
        ball.dy = -currentSpeed * Math.cos(bounceAngle);

        ball.y = paddle.y - ball.radius;
        playSound('bounce');
    }

    // 바닥 추락 -> 기회 차감
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        livesText.textContent = lives;
        playSound('lose');

        if (lives <= 0) {
            triggerGameOver();
        } else {
            resetBallAndPaddle();
        }
    }
}

// 블록 충돌 판정
function checkBrickCollisions() {
    let remainingCount = 0;

    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                remainingCount++;

                // AABB 충돌 체크
                if (
                    ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + brickConfig.width &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + brickConfig.height
                ) {
                    b.status = 0;
                    score += 10;
                    scoreText.textContent = score;

                    createExplosion(b.x + brickConfig.width / 2, b.y + brickConfig.height / 2, b.color);
                    playSound('break');

                    // 튕기는 방향 전환
                    ball.dy = -ball.dy;

                    remainingCount--;
                }
            }
        }
    }

    bricksText.textContent = remainingCount;

    // 모든 블록을 깼을 때 승리!
    if (remainingCount === 0 && currentState === GAME_STATE.PLAYING) {
        triggerVictory();
    }
}

// ==========================================
// 🎮 게임 상태 제어
// ==========================================

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawBricks();
    drawPaddle();
    drawBall();
    updateAndDrawParticles();

    if (currentState === GAME_STATE.PLAYING) {
        updatePaddle();
        updateBall();
        checkBrickCollisions();
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    lives = 3;
    scoreText.textContent = score;
    livesText.textContent = lives;

    initBricks();
    resetBallAndPaddle();

    let totalBricks = brickConfig.rowCount * brickConfig.columnCount;
    bricksText.textContent = totalBricks;

    currentState = GAME_STATE.PLAYING;
    overlayScreen.classList.add('hidden');
}

function triggerGameOver() {
    currentState = GAME_STATE.GAMEOVER;
    overlayTitle.textContent = '💔 게임 오버';
    overlayMessage.textContent = `공을 놓쳤어요! 최종 점수: ${score}점`;
    startButton.textContent = '다시 도전하기';
    overlayScreen.classList.remove('hidden');
}

function triggerVictory() {
    currentState = GAME_STATE.VICTORY;
    playSound('win');
    overlayTitle.textContent = '🎉 승리했습니다!';
    overlayMessage.textContent = `축하합니다! 모든 블록을 파괴했어요! 점수: ${score}점`;
    startButton.textContent = '한 번 더 하기';
    overlayScreen.classList.remove('hidden');
}

// ==========================================
// ⌨️ 키보드 & 터치 이벤트 리스너
// ==========================================

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
    }
});

// 모바일 및 마우스 터치 조작
btnLeft.addEventListener('mousedown', () => keys.left = true);
btnLeft.addEventListener('mouseup', () => keys.left = false);
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });

btnRight.addEventListener('mousedown', () => keys.right = true);
btnRight.addEventListener('mouseup', () => keys.right = false);
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });

// 캔버스 마우스 이동 조작 지원
canvas.addEventListener('mousemove', (e) => {
    if (currentState !== GAME_STATE.PLAYING) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddle.x = mouseX - paddle.width / 2;

    // 화면 밖 조절
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
});

// 캔버스 터치 이동 조작 지원
canvas.addEventListener('touchmove', (e) => {
    if (currentState !== GAME_STATE.PLAYING) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;
    paddle.x = touchX - paddle.width / 2;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
});

// 시작 버튼 클릭
startButton.addEventListener('click', () => {
    startGame();
});

// 초기화 execution
initStars();
initBricks();
resetBallAndPaddle();
gameLoop();
