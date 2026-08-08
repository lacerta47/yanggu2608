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
    duckHeight: 28,
    vy: 0,
    gravity: 0.65,
    jumpPower: -12.5,
    isJumping: false,
    isDucking: false,
    legFrame: 0
};

// 장애물 및 배경 요소 배열
let obstacles = [];
let clouds = [];
let particles = []; // 신기록 축하 폭죽용

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
            y: Math.random() * 90 + 30,
            width: Math.random() * 40 + 50,
            speed: Math.random() * 0.8 + 0.5
        });
    }
}

// 장애물 만들기 (선인장 및 날아다니는 익룡)
function createObstacle() {
    const minInterval = Math.max(55, 105 - Math.floor(score / 60));
    if (frameCount % minInterval === 0 && Math.random() < 0.8) {
        const rand = Math.random();
        
        if (rand < 0.35 && score > 80) {
            // 🦅 익룡 장애물 (오직 숙이기만으로 통과할 수 있는 높이!)
            obstacles.push({
                x: CANVAS_WIDTH,
                y: GROUND_Y - 58, // 높이 공중에 떠서 날아옴 (숙이면 머리 위로 지남!)
                width: 44,
                height: 26,
                type: 'pterodactyl',
                wingFrame: 0
            });
        } else if (rand < 0.7) {
            // 🌵 외두기 선인장
            obstacles.push({
                x: CANVAS_WIDTH,
                y: GROUND_Y - 45,
                width: 24,
                height: 45,
                type: 'single'
            });
        } else {
            // 🌵🌵 두두기/키큰 선인장
            obstacles.push({
                x: CANVAS_WIDTH,
                y: GROUND_Y - 52,
                width: 44,
                height: 52,
                type: 'double'
            });
        }
    }
}

// 폭죽 이펙트
function createConfetti() {
    for (let i = 0; i < 45; i++) {
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

// 티라노 공룡 그리기
function drawDino() {
    ctx.save();

    const x = dino.x;
    const y = dino.y;
    const w = dino.width;
    const h = dino.height;

    const dinoColor = '#10b981';
    const eyeColor = '#0f172a';

    ctx.fillStyle = dinoColor;

    if (dino.isDucking) {
        // 엎드려 숙인 공룡 (높이가 28px로 낮아져 익룡을 싹 피해갑니다!)
        ctx.fillRect(x, y + 4, w, h - 4); // 몸통
        ctx.fillRect(x + w - 16, y, 20, 14); // 머리
        ctx.fillStyle = eyeColor;
        ctx.fillRect(x + w - 6, y + 3, 4, 4); // 눈
        ctx.fillStyle = dinoColor;

        // 숙인 채 달리는 발 동작
        if (Math.floor(frameCount / 6) % 2 === 0) {
            ctx.fillRect(x + 10, y + h, 6, 6);
            ctx.fillRect(x + 28, y + h, 6, 2);
        } else {
            ctx.fillRect(x + 10, y + h, 6, 2);
            ctx.fillRect(x + 28, y + h, 6, 6);
        }
    } else {
        // 서 있는 공룡
        ctx.fillRect(x + 14, y, 28, 22);
        ctx.fillRect(x + 32, y + 10, 12, 10);
        
        ctx.fillStyle = eyeColor;
        ctx.fillRect(x + 30, y + 4, 4, 4);

        ctx.fillStyle = dinoColor;
        ctx.fillRect(x, y + 18, 26, 24);
        ctx.fillRect(x + 24, y + 26, 8, 4);
        ctx.fillRect(x - 8, y + 20, 10, 12);

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

// 장애물 그리기 (선인장 & 날아다니는 익룡)
function drawObstacle(obs) {
    ctx.save();

    if (obs.type === 'pterodactyl') {
        // 🦅 익룡 그리기
        ctx.fillStyle = '#f59e0b'; // 주황빛 익룡

        const wingUp = Math.floor(frameCount / 8) % 2 === 0;

        // 익룡 몸통 & 부리
        ctx.fillRect(obs.x + 10, obs.y + 8, 24, 12);
        ctx.fillRect(obs.x + 32, obs.y + 4, 12, 8); // 머리
        ctx.fillRect(obs.x - 4, obs.y + 10, 14, 6); // 꼬리

        // 눈
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(obs.x + 38, obs.y + 6, 3, 3);
        ctx.fillStyle = '#f59e0b';

        // 날개 펄럭임 애니메이션
        if (wingUp) {
            ctx.fillRect(obs.x + 14, obs.y - 10, 12, 18); // 위 날개
        } else {
            ctx.fillRect(obs.x + 14, obs.y + 16, 12, 14); // 아래 날개
        }
    } else {
        // 🌵 선인장 그리기
        ctx.fillStyle = '#22c55e';

        ctx.fillRect(obs.x + 8, obs.y, obs.width - 16, obs.height);
        ctx.fillRect(obs.x, obs.y + 12, 10, 6);
        ctx.fillRect(obs.x, obs.y + 6, 6, 12);

        ctx.fillRect(obs.x + obs.width - 10, obs.y + 18, 10, 6);
        ctx.fillRect(obs.x + obs.width - 6, obs.y + 10, 6, 14);

        if (obs.type === 'double') {
            ctx.fillRect(obs.x + 26, obs.y + 6, 12, obs.height - 6);
        }
    }

    ctx.restore();
}

// 구름 그리기
function drawCloud(cloud) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
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

    ctx.fillStyle = '#64748b';
    const offsetX = (frameCount * gameSpeed) % 24;
    for (let x = -offsetX; x < CANVAS_WIDTH; x += 24) {
        ctx.fillRect(x, GROUND_Y + 8, 10, 3);
        ctx.fillRect(x + 12, GROUND_Y + 18, 6, 2);
    }

    ctx.restore();
}

// 충돌 검사 (히트박스)
function checkCollision(dinoObj, obs) {
    const paddingX = 5;
    const paddingY = 4;
    return (
        dinoObj.x + paddingX < obs.x + obs.width &&
        dinoObj.x + dinoObj.width - paddingX > obs.x &&
        dinoObj.y + paddingY < obs.y + obs.height &&
        dinoObj.y + dinoObj.height - paddingY > obs.y
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

// 업데이트 루프
function update() {
    if (gameState !== 'RUNNING') return;

    frameCount++;
    score++;
    currentScoreEl.textContent = Math.floor(score / 5);
    gameSpeed = 6 + Math.floor(score / 300) * 0.5;

    // 공룡 중력 및 점프
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

    // 구름 이동
    createCloud();
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= clouds[i].speed;
        if (clouds[i].x + clouds[i].width < 0) {
            clouds.splice(i, 1);
        }
    }

    // 장애물 이동 및 충돌
    createObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;

        if (checkCollision(dino, obstacles[i])) {
            gameOver(obstacles[i].type);
            break;
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

// 게임 오버
function gameOver(causeType) {
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

    modalIcon.textContent = isNewRecord ? '🏆' : (causeType === 'pterodactyl' ? '🦅' : '💥');
    modalTitle.textContent = isNewRecord ? '축하합니다!' : '게임 오버!';
    modalTitle.style.color = isNewRecord ? '#f59e0b' : '#ef4444';
    
    let causeMessage = causeType === 'pterodactyl' ? '날아오는 익룡과 부딪혔어요! B 키(숙이기)로 피해야 해요!' : '선인장에 부딪혔어요!';
    modalMessage.textContent = isNewRecord
        ? `와우! 최고 기록을 깨뜨렸어요! (최종 점수: ${finalScore}점)`
        : `${causeMessage} (점수: ${finalScore}점)`;

    if (isNewRecord) {
        newRecordBadge.classList.remove('hidden');
    } else {
        newRecordBadge.classList.add('hidden');
    }

    resultModal.classList.remove('hidden');
}

// 그리기 루프
function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    clouds.forEach(drawCloud);
    drawGround();
    obstacles.forEach(drawObstacle);
    drawDino();
    handleParticles();
}

// 게임 메인 루프
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

gameLoop();
