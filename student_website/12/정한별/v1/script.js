// Web Audio API 효과음 생성 클래스
class SoundManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    // 벽 또는 바 튕김 소리
    playBounce() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    // 블록 깨지는 소리
    playBreak() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // 게임 오버 소리
    playGameOver() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    // 승리 효과음
    playVictory() {
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.1);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + index * 0.1 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + index * 0.1);
            osc.stop(this.ctx.currentTime + index * 0.1 + 0.2);
        });
    }
}

const sounds = new SoundManager();

// HTML 요소 가져오기
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const finalScoreEl = document.getElementById('finalScore');
const victoryScoreEl = document.getElementById('victoryScore');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const victoryScreen = document.getElementById('victoryScreen');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// 게임 상태 변수
let score = 0;
let lives = 3;
let isPlaying = false;
let animationFrameId = null;

// 파티클 (블록 조각) 효과 배열
let particles = [];

// 바 (Paddle) 설정
const paddle = {
    width: 130,
    height: 18,
    x: (canvas.width - 130) / 2,
    y: canvas.height - 35,
    speed: 8,
    dx: 0
};

// 공 (Ball) 설정
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 9,
    speed: 5.5,
    dx: 4,
    dy: -4
};

// 블록 설정
const brickConfig = {
    rowCount: 5,
    columnCount: 8,
    padding: 12,
    offsetTop: 50,
    offsetLeft: 35,
    height: 24,
    colors: [
        '#ef476f', // 1행: 핑크레드
        '#ffd166', // 2행: 노랑
        '#06d6a0', // 3행: 녹색
        '#118ab2', // 4행: 파랑
        '#073b4c'  // 5행: 다크블루 (퍼플로 변경)
    ]
};

// 계산된 블록 너비
brickConfig.width = (canvas.width - (brickConfig.offsetLeft * 2) - (brickConfig.padding * (brickConfig.columnCount - 1))) / brickConfig.columnCount;

let bricks = [];

// 블록 초기화
function initBricks() {
    bricks = [];
    for (let r = 0; r < brickConfig.rowCount; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickConfig.columnCount; c++) {
            bricks[r][c] = {
                x: 0,
                y: 0,
                status: 1, // 1: 깰 수 있음, 0: 깨짐
                color: brickConfig.colors[r % brickConfig.colors.length],
                points: (brickConfig.rowCount - r) * 10
            };
        }
    }
}

// 키보드 조작 처리
const keys = {
    left: false,
    right: false
};

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

// 마우스 / 터치 조작 지원
canvas.addEventListener('mousemove', (e) => {
    if (!isPlaying) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddle.x = mouseX - paddle.width / 2;

    // 화면 밖 조절
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
});

// 모바일 터치 버튼 이벤트
let touchLeftInterval = null;
let touchRightInterval = null;

function setupTouchBtn(btn, direction) {
    const start = (e) => {
        e.preventDefault();
        sounds.init();
        if (direction === 'left') keys.left = true;
        if (direction === 'right') keys.right = true;
    };
    const end = (e) => {
        e.preventDefault();
        if (direction === 'left') keys.left = false;
        if (direction === 'right') keys.right = false;
    };

    btn.addEventListener('touchstart', start);
    btn.addEventListener('touchend', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
}

setupTouchBtn(leftBtn, 'left');
setupTouchBtn(rightBtn, 'right');

// 공과 바 위치 리셋
function resetBallAndPaddle() {
    paddle.x = (canvas.width - paddle.width) / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    
    // 랜덤 반사 각도 생성
    const angle = (Math.random() * 0.6 - 0.3); // 약간의 변화
    ball.dx = ball.speed * Math.sin(angle) + (Math.random() > 0.5 ? 3.5 : -3.5);
    ball.dy = -Math.abs(ball.speed);
}

// 블록 조각 파티클 생성
function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
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
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();

        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.03;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 바(Paddle) 그리기
function drawPaddle() {
    ctx.save();
    ctx.shadowColor = '#06d6a0';
    ctx.shadowBlur = 12;
    
    // 두꺼운 둥근 사각형
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#4cc9f0');
    gradient.addColorStop(1, '#480ca8');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 10);
    ctx.fill();

    // 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// 공(Ball) 그리기
function drawBall() {
    ctx.save();
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 15;

    const gradient = ctx.createRadialGradient(
        ball.x - 2, ball.y - 2, 1,
        ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#ffd166');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 블록(Bricks) 그리기
function drawBricks() {
    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                const brickX = c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft;
                const brickY = r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop;
                b.x = brickX;
                b.y = brickY;

                ctx.save();
                ctx.fillStyle = b.color;
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickConfig.width, brickConfig.height, 6);
                ctx.fill();

                // 상단 입체 하이라이트
                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.beginPath();
                ctx.roundRect(brickX + 2, brickY + 2, brickConfig.width - 4, brickConfig.height / 2 - 2, 4);
                ctx.fill();

                ctx.restore();
            }
        }
    }
}

// 충돌 검사 (공과 블록)
function collisionDetection() {
    let hitABrick = false;

    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.columnCount; c++) {
            const b = bricks[r][c];
            if (b.status === 1) {
                // 공이 블록 영역 안에 들어갔는지 체크
                if (
                    ball.x + ball.radius > b.x &&
                    ball.x - ball.radius < b.x + brickConfig.width &&
                    ball.y + ball.radius > b.y &&
                    ball.y - ball.radius < b.y + brickConfig.height
                ) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += b.points;
                    scoreEl.textContent = score;

                    createParticles(b.x + brickConfig.width / 2, b.y + brickConfig.height / 2, b.color);
                    sounds.playBreak();
                    hitABrick = true;
                    break;
                }
            }
        }
        if (hitABrick) break;
    }

    // 남은 블록 개수 확인하여 승리 판정
    let remainingBricks = 0;
    for (let r = 0; r < brickConfig.rowCount; r++) {
        for (let c = 0; c < brickConfig.columnCount; c++) {
            if (bricks[r][c].status === 1) remainingBricks++;
        }
    }

    if (remainingBricks === 0) {
        gameVictory();
    }
}


// 바 이동 처리
function movePaddle() {
    if (keys.left) {
        paddle.x -= paddle.speed;
    }
    if (keys.right) {
        paddle.x += paddle.speed;
    }

    // 경계 체크
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
}

// 공 이동 및 벽/바 충돌 처리
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 좌우 벽 충돌
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
        sounds.playBounce();
    }

    // 천장 충돌
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
        sounds.playBounce();
    }

    // 바(Paddle) 충돌
    if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        // 공이 바 어디에 맞았는지에 따라 반사 각도 조절!
        const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const maxAngle = Math.PI / 3; // 최대 60도
        const bounceAngle = hitPoint * maxAngle;

        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = currentSpeed * Math.sin(bounceAngle);
        ball.dy = -currentSpeed * Math.cos(bounceAngle);

        sounds.playBounce();
    }

    // 바닥 추락 (게임오버 / 목숨 차감)
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        livesEl.textContent = lives;

        if (lives <= 0) {
            gameOver();
        } else {
            sounds.playGameOver();
            resetBallAndPaddle();
        }
    }
}

// 게임 업데이트 루프
function update() {
    if (!isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawPaddle();
    drawBall();
    drawParticles();

    movePaddle();
    moveBall();
    collisionDetection();

    animationFrameId = requestAnimationFrame(update);
}

// 게임 시작
function startGame() {
    sounds.init();
    score = 0;
    lives = 3;
    scoreEl.textContent = score;
    livesEl.textContent = lives;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');

    initBricks();
    resetBallAndPaddle();

    isPlaying = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    update();
}

// 게임 오버 처리
function gameOver() {
    isPlaying = false;
    sounds.playGameOver();
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// 승리 처리
function gameVictory() {
    isPlaying = false;
    sounds.playVictory();
    victoryScoreEl.textContent = score;
    victoryScreen.classList.remove('hidden');
}

// 버튼 이벤트 연결
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

// 시작 시 캔버스 초기 그리기
initBricks();
drawBricks();
drawPaddle();
drawBall();
