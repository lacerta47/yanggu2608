// 🎮 네온 우주 블록 깨기 게임 스크립트 (v1)

// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI 엘리먼트
const scoreValEl = document.getElementById('score-val');
const highscoreValEl = document.getElementById('highscore-val');
const bricksValEl = document.getElementById('bricks-val');

const startModal = document.getElementById('start-modal');
const gameoverModal = document.getElementById('gameover-modal');
const victoryModal = document.getElementById('victory-modal');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const victoryRestartBtn = document.getElementById('victory-restart-btn');

const gameoverScoreEl = document.getElementById('gameover-score');
const victoryScoreEl = document.getElementById('victory-score');

const touchLeftBtn = document.getElementById('touch-left');
const touchRightBtn = document.getElementById('touch-right');

// Web Audio API 사운드 효과
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'paddle') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'brick') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'gameover') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.5);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.12);
            osc.frequency.setValueAtTime(800, now + 0.24);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {
        // 사운드 재생 에러시 무시
    }
}

// 게임 상태 변수
let score = 0;
let highScore = localStorage.getItem('neon_block_highscore') || 0;
let remainingBricks = 0;
let gameState = 'INIT'; // INIT, PLAYING, GAMEOVER, VICTORY
let animationId = null;

highscoreValEl.textContent = highScore;

// 바 (Paddle) 설정
const paddle = {
    width: 120,
    height: 16,
    x: (canvas.width - 120) / 2,
    y: canvas.height - 35,
    speed: 8,
    dx: 0
};

// 공 (Ball) 설정
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 9,
    speed: 6.5,
    dx: 4,
    dy: -5
};

// 블록 (Bricks) 설정
const brickConfig = {
    rowCount: 5,
    colCount: 8,
    padding: 10,
    offsetTop: 60,
    offsetLeft: 35,
    colors: ['#ff007f', '#ff7700', '#ffe600', '#00f3ff', '#9d4edd'],
    scores: [50, 40, 30, 20, 10]
};

// 블록의 가로/세로 크기 자동 계산
brickConfig.width = Math.floor((canvas.width - (brickConfig.offsetLeft * 2) - (brickConfig.padding * (brickConfig.colCount - 1))) / brickConfig.colCount);
brickConfig.height = 22;

let bricks = [];

// 파티클 (파괴 이펙트) 배열
let particles = [];

function createBricks() {
    bricks = [];
    remainingBricks = brickConfig.rowCount * brickConfig.colCount;
    for (let r = 0; r < brickConfig.rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickConfig.colCount; c++) {
            const brickX = brickConfig.offsetLeft + c * (brickConfig.width + brickConfig.padding);
            const brickY = brickConfig.offsetTop + r * (brickConfig.height + brickConfig.padding);
            bricks[r][c] = {
                x: brickX,
                y: brickY,
                status: 1,
                color: brickConfig.colors[r],
                score: brickConfig.scores[r]
            };
        }
    }
    bricksValEl.textContent = remainingBricks;
}

// 조작 입력 처리
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
        rightPressed = true;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
        leftPressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
        rightPressed = false;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
        leftPressed = false;
    }
});

// 모바일 터치 버튼 이벤트
touchLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); leftPressed = true; });
touchLeftBtn.addEventListener('touchend', (e) => { e.preventDefault(); leftPressed = false; });
touchLeftBtn.addEventListener('mousedown', () => { leftPressed = true; });
touchLeftBtn.addEventListener('mouseup', () => { leftPressed = false; });

touchRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); rightPressed = true; });
touchRightBtn.addEventListener('touchend', (e) => { e.preventDefault(); rightPressed = false; });
touchRightBtn.addEventListener('mousedown', () => { rightPressed = true; });
touchRightBtn.addEventListener('mouseup', () => { rightPressed = false; });

// 파티클 생성
function spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 2,
            color: color,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            alpha: 1
        });
    }
}

// 파티클 그리기 및 업데이트
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.03;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }
}

// 바 그리기
function drawPaddle() {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// 공 그리기
function drawBall() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// 블록 그리기
function drawBricks() {
    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.colCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(b.x, b.y, brickConfig.width, brickConfig.height, 4);
                ctx.fillStyle = b.color;
                ctx.shadowColor = b.color;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();
            }
        }
    }
}

// 배경 스타 예쁜 우주 이펙트 그리기
function drawBackground() {
    ctx.fillStyle = '#080a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 연한 격자 그리드
    ctx.save();
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
    ctx.restore();
}

// 충돌 감지 처리
function collisionDetection() {
    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.colCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                if (
                    ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + brickConfig.width &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + brickConfig.height
                ) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += b.score;
                    remainingBricks--;
                    scoreValEl.textContent = score;
                    bricksValEl.textContent = remainingBricks;

                    // 파티클 및 사운드 효과
                    spawnParticles(b.x + brickConfig.width / 2, b.y + brickConfig.height / 2, b.color);
                    playSound('brick');

                    // 최고 점수 갱신
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('neon_block_highscore', highScore);
                        highscoreValEl.textContent = highScore;
                    }

                    // 승리 체크
                    if (remainingBricks === 0) {
                        triggerVictory();
                    }
                    return;
                }
            }
        }
    }
}

// 공과 바의 움직임 업데이트
function update() {
    if (gameState !== 'PLAYING') return;

    // 바 이동
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }

    // 공 위치 업데이트
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 왼쪽 / 오른쪽 벽 충돌
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }

    // 천장 충돌
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // 바 충돌 (부딪히는 위치에 따라 반사 각도 조절)
    if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        // 공이 바에 반사되는 위치 (-1 ~ 1)
        let hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        let angle = hitPoint * (Math.PI / 3); // 최대 60도 각도

        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);

        playSound('paddle');
    }

    // 바닥 충돌 -> 게임 오버
    if (ball.y + ball.radius > canvas.height) {
        triggerGameOver();
        return;
    }

    // 블록 충돌 체크
    collisionDetection();
}

// 메인 게임 루프
function draw() {
    drawBackground();
    drawBricks();
    drawPaddle();
    drawBall();
    updateParticles();

    update();

    if (gameState === 'PLAYING') {
        animationId = requestAnimationFrame(draw);
    }
}

// 게임 시작
function startGame() {
    initAudio();
    score = 0;
    scoreValEl.textContent = score;

    paddle.x = (canvas.width - paddle.width) / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -5;

    particles = [];
    createBricks();

    gameState = 'PLAYING';
    startModal.classList.remove('active');
    gameoverModal.classList.remove('active');
    victoryModal.classList.remove('active');

    if (animationId) cancelAnimationFrame(animationId);
    draw();
}

// 게임 오버 처리
function triggerGameOver() {
    gameState = 'GAMEOVER';
    playSound('gameover');
    gameoverScoreEl.textContent = score;
    gameoverModal.classList.add('active');
}

// 승리 처리
function triggerVictory() {
    gameState = 'VICTORY';
    playSound('win');
    victoryScoreEl.textContent = score;
    victoryModal.classList.add('active');
}

// 버튼 이벤트 리스너 등록
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
victoryRestartBtn.addEventListener('click', startGame);

// 초기 상태 캔버스 배경 그리기
drawBackground();
createBricks();
drawBricks();
drawPaddle();
drawBall();
