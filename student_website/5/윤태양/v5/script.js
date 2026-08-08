// 캔버스 및 DOM 요소 참조
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const shieldCountEl = document.getElementById('shieldCount');
const startOverlay = document.getElementById('startOverlay');
const resultModal = document.getElementById('resultModal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const newRecordBadge = document.getElementById('newRecordBadge');
const restartBtn = document.getElementById('restartBtn');
const jumpBtn = document.getElementById('jumpBtn');
const slideBtn = document.getElementById('slideBtn');

// 캔버스 규격
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 250;

// 게임 상태 ('READY', 'RUNNING', 'GAME_OVER')
let gameState = 'READY';

// 점수 및 속도 (기본 달리기 속도를 8.5로 시원하게 상향!)
let score = 0;
let highScore = parseInt(localStorage.getItem('dino_high_score') || '0', 10);
let baseSpeed = 8.5;
let frameCount = 0;
let animationId = null;

// 목숨/보호막 및 버프 상태
let shieldsCount = 0; // 보호막 (목숨 개수)
let invulnerableTimer = 0; // 보호막 깨진 후 무적 무적 깜빡임 타이머
let isMilkActive = false; // 무적 우유
let milkTimer = 0;

// 공룡 객체
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
    isDucking: false
};

// 배열 요소
let obstacles = [];
let items = []; // 🛡️ 보호막, 🥛 무적우유
let clouds = [];
let particles = [];
let floatingTexts = [];

highScoreEl.textContent = highScore;
shieldCountEl.textContent = shieldsCount;

// 이벤트 리스너
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('click', handleCanvasClick);
restartBtn.addEventListener('click', resetGame);

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

function triggerJump() {
    if (!dino.isJumping) {
        dino.vy = dino.jumpPower;
        dino.isJumping = true;
        if (dino.isDucking) {
            stopDuck();
        }
    }
}

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

function startGame() {
    gameState = 'RUNNING';
    startOverlay.classList.add('hidden');
}

function resetGame() {
    gameState = 'RUNNING';
    score = 0;
    baseSpeed = 8.5;
    frameCount = 0;
    shieldsCount = 0;
    invulnerableTimer = 0;
    isMilkActive = false;
    milkTimer = 0;

    obstacles = [];
    items = [];
    clouds = [];
    particles = [];
    floatingTexts = [];
    
    dino.y = GROUND_Y - dino.normalHeight;
    dino.vy = 0;
    dino.isJumping = false;
    dino.isDucking = false;
    dino.height = dino.normalHeight;

    currentScoreEl.textContent = '0';
    shieldCountEl.textContent = '0';
    resultModal.classList.add('hidden');
    newRecordBadge.classList.add('hidden');
}

function addFloatingText(x, y, text, color = '#38bdf8') {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 40,
        dy: -1.5
    });
}

// 아이템 스폰 (🛡️ 보호막, 🥛 무적우유)
function createItem() {
    if (frameCount % 210 === 0 && Math.random() < 0.65) {
        const type = Math.random() < 0.6 ? 'shield' : 'milk';
        const yPos = Math.random() < 0.5 ? GROUND_Y - 45 : GROUND_Y - 95;

        items.push({
            x: CANVAS_WIDTH,
            y: yPos,
            width: 32,
            height: 32,
            type: type
        });
    }
}

// 구름 스폰
function createCloud() {
    if (Math.random() < 0.015) {
        clouds.push({
            x: CANVAS_WIDTH,
            y: Math.random() * 90 + 25,
            width: Math.random() * 40 + 50,
            speed: Math.random() * 0.8 + 0.5
        });
    }
}

// 장애물 스폰 (선인장 및 날아다니는 익룡)
function createObstacle() {
    const minInterval = Math.max(45, 90 - Math.floor(score / 80));
    if (frameCount % minInterval === 0 && Math.random() < 0.8) {
        const rand = Math.random();
        
        if (rand < 0.38 && score > 50) {
            // 🦅 익룡 장애물
            obstacles.push({
                x: CANVAS_WIDTH,
                y: GROUND_Y - 58,
                width: 44,
                height: 26,
                type: 'pterodactyl'
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
            // 🌵🌵 두두기 선인장
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

function createParticles(x, y, color = '#38bdf8', count = 25) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 10,
            dy: (Math.random() - 0.5) * 10,
            color: color,
            size: Math.random() * 5 + 3,
            life: 40
        });
    }
}

// 아이템 획득 처리
function collectItem(type) {
    if (type === 'shield') {
        shieldsCount++;
        shieldCountEl.textContent = shieldsCount;
        addFloatingText(dino.x, dino.y - 15, '🛡️ 목숨 +1 추가!', '#38bdf8');
        createParticles(dino.x + 20, dino.y + 20, '#38bdf8', 20);
    } else if (type === 'milk') {
        isMilkActive = true;
        milkTimer = 400; // ~6.6초
        addFloatingText(dino.x, dino.y - 15, '🥛 무적 우유 파워!', '#facc15');
        createParticles(dino.x + 20, dino.y + 20, '#facc15', 20);
    }
}

// 공룡 그리기
function drawDino() {
    // 부딪혀서 소모된 후 깜빡임 무적 타이머
    if (invulnerableTimer > 0 && Math.floor(invulnerableTimer / 4) % 2 === 0) {
        return; // 깜빡임 효과
    }

    ctx.save();

    const x = dino.x;
    const y = dino.y;
    const w = dino.width;
    const h = dino.height;

    // 보호막(목숨)을 보유 중일 때 푸른 쉴드 링 효과!
    if (shieldsCount > 0 && !isMilkActive) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        ctx.stroke();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }

    // 무적 우유 상태일 때 무지개 아우라
    if (isMilkActive) {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 + 12, 0, Math.PI * 2);
        const rainbowGradient = ctx.createRadialGradient(x + w/2, y + h/2, 5, x + w/2, y + h/2, w/2 + 12);
        rainbowGradient.addColorStop(0, `hsl(${(frameCount * 8) % 360}, 100%, 70%)`);
        rainbowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = rainbowGradient;
        ctx.fill();
        ctx.closePath();
    }

    let dinoColor = '#10b981';
    if (shieldsCount > 0) dinoColor = '#38bdf8';
    if (isMilkActive) dinoColor = `hsl(${(frameCount * 10) % 360}, 90%, 65%)`;

    ctx.fillStyle = dinoColor;

    if (dino.isDucking) {
        ctx.fillRect(x, y + 4, w, h - 4);
        ctx.fillRect(x + w - 16, y, 20, 14);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + w - 6, y + 3, 4, 4);
        ctx.fillStyle = dinoColor;

        if (Math.floor(frameCount / 6) % 2 === 0) {
            ctx.fillRect(x + 10, y + h, 6, 6);
            ctx.fillRect(x + 28, y + h, 6, 2);
        } else {
            ctx.fillRect(x + 10, y + h, 6, 2);
            ctx.fillRect(x + 28, y + h, 6, 6);
        }
    } else {
        ctx.fillRect(x + 14, y, 28, 22);
        ctx.fillRect(x + 32, y + 10, 12, 10);
        
        ctx.fillStyle = '#0f172a';
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

// 아이템 그리기 (🛡️, 🥛)
function drawItem(item) {
    ctx.save();
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icon = item.type === 'shield' ? '🛡️' : '🥛';
    const floatY = Math.sin(frameCount / 8) * 4;

    ctx.fillText(icon, item.x + item.width / 2, item.y + item.height / 2 + floatY);
    ctx.restore();
}

// 장애물 그리기
function drawObstacle(obs) {
    ctx.save();

    if (obs.type === 'pterodactyl') {
        ctx.fillStyle = '#f59e0b';
        const wingUp = Math.floor(frameCount / 8) % 2 === 0;

        ctx.fillRect(obs.x + 10, obs.y + 8, 24, 12);
        ctx.fillRect(obs.x + 32, obs.y + 4, 12, 8);
        ctx.fillRect(obs.x - 4, obs.y + 10, 14, 6);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(obs.x + 38, obs.y + 6, 3, 3);
        ctx.fillStyle = '#f59e0b';

        if (wingUp) {
            ctx.fillRect(obs.x + 14, obs.y - 10, 12, 18);
        } else {
            ctx.fillRect(obs.x + 14, obs.y + 16, 12, 14);
        }
    } else {
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

// 바닥 그리기
function drawGround(currentSpeed) {
    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    const offsetX = (frameCount * currentSpeed) % 24;
    for (let x = -offsetX; x < CANVAS_WIDTH; x += 24) {
        ctx.fillRect(x, GROUND_Y + 8, 10, 3);
        ctx.fillRect(x + 12, GROUND_Y + 18, 6, 2);
    }

    ctx.restore();
}

// 부유 텍스트 및 파티클 처리
function handleEffects() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ctx.save();
        ctx.font = 'bold 16px Pretendard, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 40;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        ft.y += ft.dy;
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// 충돌 검사
function checkCollision(objA, objB) {
    const pad = 4;
    return (
        objA.x + pad < objB.x + objB.width &&
        objA.x + objA.width - pad > objB.x &&
        objA.y + pad < objB.y + objB.height &&
        objA.y + objA.height - pad > objB.y
    );
}

// 업데이트 루프
function update() {
    if (gameState !== 'RUNNING') return;

    frameCount++;

    if (invulnerableTimer > 0) invulnerableTimer--;
    if (isMilkActive) {
        milkTimer--;
        if (milkTimer <= 0) isMilkActive = false;
    }

    const currentSpeed = baseSpeed + Math.floor(score / 250) * 0.5;

    score++;
    currentScoreEl.textContent = Math.floor(score / 5);

    // 공룡 점프 및 중력
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
        if (clouds[i].x + clouds[i].width < 0) clouds.splice(i, 1);
    }

    // 아이템 이동 및 획득
    createItem();
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].x -= currentSpeed;

        if (checkCollision(dino, items[i])) {
            collectItem(items[i].type);
            items.splice(i, 1);
            continue;
        }

        if (items[i].x + items[i].width < 0) items.splice(i, 1);
    }

    // 장애물 이동 및 충돌 처리
    createObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= currentSpeed;

        if (checkCollision(dino, obs)) {
            if (isMilkActive) {
                // 🥛 무적 우유 파워
                addFloatingText(obs.x, obs.y - 10, '💥 BOOM! 무적 파괴!', '#facc15');
                createParticles(obs.x, obs.y, '#facc15', 20);
                score += 100;
                obstacles.splice(i, 1);
                continue;
            } else if (invulnerableTimer > 0) {
                // 충돌 직후 짧은 무적 상태인 경우 무시
                continue;
            } else if (shieldsCount > 0) {
                // 🛡️ 보호막(목숨) 보유 시 목숨 1개 소모하고 생존!
                shieldsCount--;
                shieldCountEl.textContent = shieldsCount;
                invulnerableTimer = 75; // ~1.25초 동안 깜빡임 생존 무적

                addFloatingText(dino.x, dino.y - 15, '🛡️ 보호막 소모! (생존)', '#38bdf8');
                createParticles(dino.x + 20, dino.y + 20, '#38bdf8', 25);
                obstacles.splice(i, 1);
                continue;
            } else {
                // 보호막도 없고 무적도 아닌 경우 -> 게임 오버
                gameOver(obs.type);
                break;
            }
        }

        if (obs.x + obs.width < 0) obstacles.splice(i, 1);
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
    }

    modalIcon.textContent = isNewRecord ? '🏆' : (causeType === 'pterodactyl' ? '🦅' : '💥');
    modalTitle.textContent = isNewRecord ? '축하합니다!' : '게임 오버!';
    modalTitle.style.color = isNewRecord ? '#f59e0b' : '#ef4444';

    let causeMessage = causeType === 'pterodactyl' ? '날아오는 익룡과 부딪혔어요!' : '선인장에 부딪혔어요!';
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
    const currentSpeed = baseSpeed + Math.floor(score / 250) * 0.5;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    clouds.forEach(drawCloud);
    drawGround(currentSpeed);
    items.forEach(drawItem);
    obstacles.forEach(drawObstacle);
    drawDino();
    handleEffects();
}

// 게임 루프
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

gameLoop();
