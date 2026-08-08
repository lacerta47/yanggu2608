// 캔버스 및 DOM 요소 참조
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const startOverlay = document.getElementById('startOverlay');
const resultModal = document.getElementById('resultModal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const newRecordBadge = document.getElementById('newRecordBadge');
const restartBtn = document.getElementById('restartBtn');
const jumpBtn = document.getElementById('jumpBtn');
const slideBtn = document.getElementById('slideBtn');

// 캔버스 기본 규격
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 250; // 바닥 선 위치

// 게임 상태 관리 ('READY', 'RUNNING', 'GAME_OVER')
let gameState = 'READY';

// 점수 상태
let score = 0;
let highScore = parseInt(localStorage.getItem('dino_high_score') || '0', 10);
let gameSpeed = 6;
let frameCount = 0;
let animationId = null;

// 공룡 (T-Rex) 객체
const dino = {
    x: 80,
    y: GROUND_Y - 54,
    width: 44,
    height: 54,
    normalHeight: 54,
    duckHeight: 30,
    vy: 0,
    gravity: 0.65,
    jumpPower: -12.5,
    isJumping: false,
    isDucking: false,
    legFrame: 0
};

// 장애물 (선인장) 및 구름 배열
let obstacles = [];
let clouds = [];
let particles = []; // 폭죽 이펙트용

// 키 누름 상태
const keys = {
    space: false,
    down: false
};

// 최고 점수 표시 업데이트
highScoreEl.textContent = highScore;

// 이벤트 리스너 등록
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('click', handleCanvasClick);
restartBtn.addEventListener('click', resetGame);

// 모바일 버튼 조작
jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerJump(); });
jumpBtn.addEventListener('mousedown', () => { triggerJump(); });

slideBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startDuck(); });
slideBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopDuck(); });
slideBtn.addEventListener('mousedown', () => { startDuck(); });
slideBtn.addEventListener('mouseup', () => { stopDuck(); });

function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (gameState === 'READY') {
            startGame();
        } else if (gameState === 'RUNNING') {
            triggerJump();
        } else if (gameState === 'GAME_OVER') {
            resetGame();
        }
    }

    if (e.code === 'ArrowDown' || e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (gameState === 'RUNNING') {
            startDuck();
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown' || e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S') {
        if (gameState === 'RUNNING') {
            stopDuck();
        }
    }
}

function handleCanvasClick() {
    if (gameState === 'READY') {
        startGame();
    } else if (gameState === 'RUNNING') {
        triggerJump();
    }
}

// 점프 동작
function triggerJump() {
    if (!dino.isJumping) {
        dino.vy = dino.jumpPower;
        dino.isJumping = true;
        // 점프할 때는 숙이기 해제
        if (dino.isDucking) {
            stopDuck();
        }
    }
}

// 숙이기 (슬라이딩) 동작
function startDuck() {
    if (!dino.isDucking && !dino.isJumping) {
        dino.isDucking = true;
        dino.height = dino.duckHeight;
        dino.y = GROUND_Y - dino.duckHeight;
    }
}

function stopDuck() {
    if (dino.isDucking) {
        dino.isDucking = false;
        dino.height = dino.normalHeight;
        dino.y = GROUND_Y - dino.normalHeight;
    }
}

// 게임 시작
function startGame() {
    gameState = 'RUNNING';
    startOverlay.classList.add('hidden');
}

// 게임 리셋
function resetGame() {
    gameState = 'RUNNING';
    score = 0;
    gameSpeed = 6;
    frameCount = 0;
    obstacles = [];
    clouds = [];
    particles = [];
    
    dino.y = GROUND_Y - dino.normalHeight;
    dino.vy = 0;
    dino.isJumping = false;
    dino.isDucking = false;
    dino.height = dino.normalHeight;

    currentScoreEl.textContent = '0';
    resultModal.classList.add('hidden');
    newRecordBadge.classList.add('hidden');
}

// 구름 만들기
function createCloud() {
    if (Math.random() < 0.015) {
        clouds.push({
            x: CANVAS_WIDTH,
            y: Math.random() * 100 + 30,
            width: Math.random() * 40 + 50,
            speed: Math.random() * 0.8 + 0.5
        });
    }
}

// 장애물 (선인장) 만들기
function createObstacle() {
    // 프레임 및 난이도에 따라 생성
    const minInterval = Math.max(60, 110 - Math.floor(score / 50));
    if (frameCount % minInterval === 0 && Math.random() < 0.75) {
        const types = ['single', 'double', 'tall'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let width = 24;
        let height = 45;

        if (type === 'double') {
            width = 46;
            height = 45;
        } else if (type === 'tall') {
            width = 28;
            height = 55;
        }

        obstacles.push({
            x: CANVAS_WIDTH,
            y: GROUND_Y - height,
            width: width,
            height: height,
            type: type
        });
    }
}

// 신기록 축하 폭죽 파티클 생성
function createConfetti() {
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            dx: (Math.random() - 0.5) * 12,
            dy: (Math.random() - 0.7) * 10,
            color: `hsl(${Math.random() * 360}, 90%, 60%)`,
            size: Math.random() * 6 + 4,
            life: 60
        });
    }
}

// 티라노 공룡 (T-Rex) 그리기
function drawDino() {
    ctx.save();

    const x = dino.x;
    const y = dino.y;
    const w = dino.width;
    const h = dino.height;

    // 공룡 기본 색상 (초록 도트 스타일)
    const dinoColor = '#10b981';
    const eyeColor = '#0f172a';

    ctx.fillStyle = dinoColor;

    if (dino.isDucking) {
        // 숙인 공룡 (긴 형태)
        ctx.fillRect(x, y + 8, w, h - 8); // 몸통
        ctx.fillRect(x + w - 16, y, 20, 16); // 머리
        ctx.fillStyle = eyeColor;
        ctx.fillRect(x + w - 6, y + 4, 4, 4); // 눈
        ctx.fillStyle = dinoColor;

        // 숙였을 때 달리는 다리
        if (Math.floor(frameCount / 6) % 2 === 0) {
            ctx.fillRect(x + 10, y + h, 6, 6);
            ctx.fillRect(x + 30, y + h, 6, 2);
        } else {
            ctx.fillRect(x + 10, y + h, 6, 2);
            ctx.fillRect(x + 30, y + h, 6, 6);
        }
    } else {
        // 서 있는 / 점프하는 공룡
        // 머리 & 주둥이
        ctx.fillRect(x + 14, y, 28, 22);
        ctx.fillRect(x + 32, y + 10, 12, 10);
        
        // 눈
        ctx.fillStyle = eyeColor;
        ctx.fillRect(x + 30, y + 4, 4, 4);

        // 몸통
        ctx.fillStyle = dinoColor;
        ctx.fillRect(x, y + 18, 26, 24);
        
        // 귀여운 손 (앞다리)
        ctx.fillRect(x + 24, y + 26, 8, 4);

        // 꼬리
        ctx.fillRect(x - 8, y + 20, 10, 12);

        // 다리 동작 (지면에 있을 때 발을 번갈아 움직임)
        if (dino.isJumping) {
            ctx.fillRect(x + 4, y + 42, 6, 12);
            ctx.fillRect(x + 16, y + 42, 6, 12);
        } else {
            if (Math.floor(frameCount / 5) % 2 === 0) {
                ctx.fillRect(x + 4, y + 42, 6, 12);
                ctx.fillRect(x + 16, y + 42, 6, 6);
            } else {
                ctx.fillRect(x + 4, y + 42, 6, 6);
                ctx.fillRect(x + 16, y + 42, 6, 12);
            }
        }
    }

    ctx.restore();
}

// 선인장 그리기
function drawCactus(obs) {
    ctx.save();
    ctx.fillStyle = '#22c55e'; // 선인장 초록색

    // 줄기
    ctx.fillRect(obs.x + 8, obs.y, obs.width - 16, obs.height);

    // 가지 1 (왼쪽)
    ctx.fillRect(obs.x, obs.y + 12, 10, 6);
    ctx.fillRect(obs.x, obs.y + 6, 6, 12);

    // 가지 2 (오른쪽)
    ctx.fillRect(obs.x + obs.width - 10, obs.y + 18, 10, 6);
    ctx.fillRect(obs.x + obs.width - 6, obs.y + 10, 6, 14);

    // 두 개짜리 선인장이면 두 번째 줄기 추가
    if (obs.type === 'double') {
        ctx.fillRect(obs.x + 26, obs.y + 5, 12, obs.height - 5);
    }

    ctx.restore();
}

// 구름 그리기
function drawCloud(cloud) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, 14, 0, Math.PI * 2);
    ctx.arc(cloud.x + 15, cloud.y - 8, 18, 0, Math.PI * 2);
    ctx.arc(cloud.x + 32, cloud.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 바닥선 그리기
function drawGround() {
    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // 점선 점들 달리는 효과
    ctx.fillStyle = '#64748b';
    const offsetX = (frameCount * gameSpeed) % 24;
    for (let x = -offsetX; x < CANVAS_WIDTH; x += 24) {
        ctx.fillRect(x, GROUND_Y + 8, 10, 3);
        ctx.fillRect(x + 12, GROUND_Y + 18, 6, 2);
    }

    ctx.restore();
}

// 충돌 검사
function checkCollision(dinoObj, obs) {
    // 여유 유격 (Hitbox padding)
    const padding = 6;
    return (
        dinoObj.x + padding < obs.x + obs.width &&
        dinoObj.x + dinoObj.width - padding > obs.x &&
        dinoObj.y + padding < obs.y + obs.height &&
        dinoObj.y + dinoObj.height - padding > obs.y
    );
}

// 폭죽 처리
function handleParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 게임 업데이트 루프
function update() {
    if (gameState !== 'RUNNING') return;

    frameCount++;

    // 점수 및 속도 증가
    score++;
    currentScoreEl.textContent = Math.floor(score / 5);
    
    // 일정 점수마다 게임 속도 조금씩 상승
    gameSpeed = 6 + Math.floor(score / 300) * 0.5;

    // 공룡 중력 및 점프 처리
    if (dino.isJumping) {
        dino.y += dino.vy;
        dino.vy += dino.gravity;

        const currentGroundY = GROUND_Y - (dino.isDucking ? dino.duckHeight : dino.normalHeight);
        if (dino.y >= currentGroundY) {
            dino.y = currentGroundY;
            dino.isJumping = false;
            dino.vy = 0;
        }
    }

    // 구름 생성 및 이동
    createCloud();
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= clouds[i].speed;
        if (clouds[i].x + clouds[i].width < 0) {
            clouds.splice(i, 1);
        }
    }

    // 장애물 생성 및 이동
    createObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;

        // 충돌 발생 시 게임 오버
        if (checkCollision(dino, obstacles[i])) {
            gameOver();
            break;
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

// 게임 오버 처리
function gameOver() {
    gameState = 'GAME_OVER';
    const finalScore = Math.floor(score / 5);
    let isNewRecord = false;

    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('dino_high_score', highScore.toString());
        highScoreEl.textContent = highScore;
        isNewRecord = true;
        createConfetti();
    }

    // 결과 팝업 표시
    modalIcon.textContent = isNewRecord ? '🏆' : '💥';
    modalTitle.textContent = isNewRecord ? '축하합니다!' : '게임 오버!';
    modalTitle.style.color = isNewRecord ? '#f59e0b' : '#ef4444';
    
    modalMessage.textContent = isNewRecord
        ? `와우! 최고 기록을 깨뜨렸어요! (최종 점수: ${finalScore}점)`
        : `선인장에 부딪혔어요! (점수: ${finalScore}점)`;

    if (isNewRecord) {
        newRecordBadge.classList.remove('hidden');
    } else {
        newRecordBadge.classList.add('hidden');
    }

    resultModal.classList.remove('hidden');
}

// 메인 그리기 루프
function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 구름 그리기
    clouds.forEach(drawCloud);

    // 바닥 그리기
    drawGround();

    // 장애물 그리기
    obstacles.forEach(drawCactus);

    // 공룡 그리기
    drawDino();

    // 폭죽 이펙트 그리기
    handleParticles();
}

// 메인 루프
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// 게임 렌더링 루프 시작
gameLoop();
