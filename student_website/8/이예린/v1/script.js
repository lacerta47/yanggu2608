// 캔버스 및 디바이스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI 요소
const scoreText = document.getElementById('score-text');
const highScoreText = document.getElementById('high-score-text');
const livesText = document.getElementById('lives-text');
const startOverlay = document.getElementById('start-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const victoryOverlay = document.getElementById('victory-overlay');
const finalScoreSpan = document.getElementById('final-score');
const victoryScoreSpan = document.getElementById('victory-score');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const victoryRestartBtn = document.getElementById('victory-restart-btn');

const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnSound = document.getElementById('btn-sound');

// Web Audio API 효과음 시스템
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'paddle') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'brick') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === 'wall') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'gameover') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'victory') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554, now + 0.1);
            osc.frequency.setValueAtTime(659, now + 0.2);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        }
    } catch (e) {
        // 음향 재생 예외 무시
    }
}

// 게임 상태 변수
let gameState = 'INIT'; // 'INIT', 'PLAYING', 'GAMEOVER', 'VICTORY'
let score = 0;
let highScore = localStorage.getItem('neon_highscore') ? parseInt(localStorage.getItem('neon_highscore')) : 0;
let lives = 3;

highScoreText.textContent = highScore;

// 패들 객체
const paddle = {
    width: 130,
    height: 16,
    x: (canvas.width - 130) / 2,
    y: canvas.height - 35,
    speed: 9,
    dx: 0,
    color: '#00f3ff'
};

// 공 객체
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 9,
    speed: 7.5,
    dx: 5,
    dy: -5,
    color: '#ffffff'
};

// 블록 설정
const brickConfig = {
    rowCount: 5,
    columnCount: 8,
    padding: 10,
    offsetTop: 60,
    offsetLeft: 35,
    width: 82,
    height: 24,
    colors: [
        '#ff0055', // 분홍 (1행)
        '#ffaa00', // 주황 (2행)
        '#ffe600', // 노랑 (3행)
        '#00ff66', // 연두 (4행)
        '#00f3ff'  // 청록 (5행)
    ],
    scores: [50, 40, 30, 20, 10]
};

let bricks = [];
let particles = [];

// 블록 초기화 함수
function initBricks() {
    bricks = [];
    for (let r = 0; r < brickConfig.rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const brickX = c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft;
            const brickY = r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop;
            bricks[r][c] = {
                x: brickX,
                y: brickY,
                status: 1,
                color: brickConfig.colors[r],
                score: brickConfig.scores[r]
            };
        }
    }
}

// 이펙트 파티클 생성 함수
function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 2,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            color: color,
            alpha: 1,
            life: 1
        });
    }
}

// 이펙트 파티클 업데이트 및 그린
function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.04;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 조작 이벤트 처리 (키보드)
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', (e) => {
    initAudio();
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        leftPressed = false;
    }
});

// 마우스 / 터치 조작 지원
canvas.addEventListener('mousemove', (e) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) * (canvas.width / rect.width);
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
}, { passive: true });

// 화면 버튼 조작
btnLeft.addEventListener('mousedown', () => { initAudio(); leftPressed = true; });
btnLeft.addEventListener('mouseup', () => { leftPressed = false; });
btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); leftPressed = true; });
btnLeft.addEventListener('touchend', () => { leftPressed = false; });

btnRight.addEventListener('mousedown', () => { initAudio(); rightPressed = true; });
btnRight.addEventListener('mouseup', () => { rightPressed = false; });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); rightPressed = true; });
btnRight.addEventListener('touchend', () => { rightPressed = false; });

btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    btnSound.textContent = soundEnabled ? '🔊 효과음 켜짐' : '🔇 효과음 끔';
});

// 공 위치 리셋
function resetBallAndPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;

    // 공 발사 각도 랜덤성 부여
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI; 
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
}

// 게임 시작
function startGame() {
    initAudio();
    score = 0;
    lives = 3;
    scoreText.textContent = score;
    updateLivesUI();
    initBricks();
    resetBallAndPaddle();

    startOverlay.classList.remove('active');
    startOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    gameState = 'PLAYING';
}

// 하트 라이프 UI 업데이트
function updateLivesUI() {
    livesText.textContent = '♥'.repeat(lives);
}

// 충돌 탐지 함수
function collisionDetection() {
    let activeBricksCount = 0;

    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                activeBricksCount++;
                if (
                    ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + brickConfig.width &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + brickConfig.height
                ) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += b.score;
                    scoreText.textContent = score;

                    if (score > highScore) {
                        highScore = score;
                        highScoreText.textContent = highScore;
                        localStorage.setItem('neon_highscore', highScore);
                    }

                    playSound('brick');
                    createParticles(b.x + brickConfig.width / 2, b.y + brickConfig.height / 2, b.color);

                    // 블록을 다 깼는지 체크
                    if (activeBricksCount - 1 === 0) {
                        gameState = 'VICTORY';
                        victoryScoreSpan.textContent = score;
                        victoryOverlay.classList.remove('hidden');
                        victoryOverlay.classList.add('active');
                        playSound('victory');
                    }
                }
            }
        }
    }
}

// 패들 그리기
function drawPaddle() {
    ctx.save();
    ctx.fillStyle = paddle.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddle.color;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();
    ctx.restore();
}

// 공 그리기
function drawBall() {
    ctx.save();
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f3ff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 블록 그리기
function drawBricks() {
    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                ctx.save();
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = b.color;
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, brickConfig.width, brickConfig.height, 4);
                ctx.fill();
                ctx.restore();
            }
        }
    }
}

// 별빛 배경 그리디 효과
function drawBackground() {
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 격자선 효과
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 위치 업데이트 및 물리 로직
function update() {
    if (gameState !== 'PLAYING') return;

    // 패들 이동
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }

    // 공 이동
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 좌우 벽 충돌
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
        playSound('wall');
    }

    // 위쪽 벽 충돌
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
        playSound('wall');
    }

    // 패들 충돌
    if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        playSound('paddle');
        // 패들의 어느 부위에 맞았는지에 따라 반사 각도 조정
        const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const maxAngle = Math.PI / 3; // 최대 60도
        const angle = hitPoint * maxAngle;

        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
    }

    // 아래로 떨어진 경우
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateLivesUI();
        playSound('wall');

        if (lives <= 0) {
            gameState = 'GAMEOVER';
            finalScoreSpan.textContent = score;
            gameoverOverlay.classList.remove('hidden');
            gameoverOverlay.classList.add('active');
            playSound('gameover');
        } else {
            resetBallAndPaddle();
        }
    }

    collisionDetection();
}

// 메인 렌더링 루프
function render() {
    drawBackground();
    drawBricks();
    drawPaddle();
    drawBall();
    updateAndDrawParticles();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 버튼 이벤트 리스너 등록
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
victoryRestartBtn.addEventListener('click', startGame);

// 초기화 실행
initBricks();
gameLoop();
