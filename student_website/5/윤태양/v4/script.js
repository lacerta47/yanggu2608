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

// HUD 아이템 타이머 요소
const activeItemHud = document.getElementById('activeItemHud');
const activeItemIcon = document.getElementById('activeItemIcon');
const activeItemName = document.getElementById('activeItemName');
const itemTimerBar = document.getElementById('itemTimerBar');

// 캔버스 기본 규격
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const GROUND_Y = 250;

// 게임 상태 ('READY', 'RUNNING', 'GAME_OVER')
let gameState = 'READY';

// 점수 및 속도
let score = 0;
let highScore = parseInt(localStorage.getItem('dino_high_score') || '0', 10);
let baseSpeed = 6;
let frameCount = 0;
let animationId = null;

// 아이템 버프 상태
let activeItem = null; // 'speed', 'magnet', 'milk'
let itemTimer = 0;
let itemMaxDuration = 1;

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
    isDucking: false
};

// 배열 요소
let obstacles = [];
let items = []; // 스폰된 아이템들
let clouds = [];
let particles = [];
let floatingTexts = []; // 부유하는 점수 텍스트 (+50, BOOM!)

highScoreEl.textContent = highScore;

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
    baseSpeed = 6;
    frameCount = 0;
    activeItem = null;
    itemTimer = 0;

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
    activeItemHud.classList.add('hidden');
    resultModal.classList.add('hidden');
    newRecordBadge.classList.add('hidden');
}

// 부유 텍스트 추가 (점수나 문구)
function addFloatingText(x, y, text, color = '#facc15') {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 35,
        dy: -1.5
    });
}

// 아이템 스폰 (⚡ 속도, 🧲 자석, 🥛 무적우유)
function createItem() {
    if (frameCount % 240 === 0 && Math.random() < 0.65) {
        const types = ['speed', 'magnet', 'milk'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // 지상 또는 공중에 스폰
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
    const minInterval = Math.max(50, 100 - Math.floor(score / 70));
    if (frameCount % minInterval === 0 && Math.random() < 0.8) {
        const rand = Math.random();
        
        if (rand < 0.35 && score > 60) {
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

// 축하 및 파괴 폭죽 파티클
function createParticles(x, y, color = '#f59e0b', count = 25) {
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

// 공룡 활성화된 아이템 버프 실행
function activateItem(type) {
    activeItem = type;
    activeItemHud.classList.remove('hidden');

    if (type === 'speed') {
        activeItemIcon.textContent = '⚡';
        activeItemName.textContent = '부스터 속도 2배!';
        itemMaxDuration = 360; // 6초
    } else if (type === 'magnet') {
        activeItemIcon.textContent = '🧲';
        activeItemName.textContent = '장애물 흡수 자석!';
        itemMaxDuration = 420; // 7초
    } else if (type === 'milk') {
        activeItemIcon.textContent = '🥛';
        activeItemName.textContent = '무적 칼슘 우유!';
        itemMaxDuration = 420; // 7초
    }

    itemTimer = itemMaxDuration;
    addFloatingText(dino.x + 10, dino.y - 15, `+${type.toUpperCase()}!`, '#38bdf8');
    createParticles(dino.x + 20, dino.y + 20, '#38bdf8', 20);
}

// 아이템 버프 타이머 업데이트
function updateItemBuff() {
    if (activeItem) {
        itemTimer--;
        const pct = (itemTimer / itemMaxDuration) * 100;
        itemTimerBar.style.width = `${pct}%`;

        if (itemTimer <= 0) {
            activeItem = null;
            activeItemHud.classList.add('hidden');
        }
    }
}

// 공룡 그리기 (무적 우유 먹었을 때 무지개 아우라!)
function drawDino() {
    ctx.save();

    const x = dino.x;
    const y = dino.y;
    const w = dino.width;
    const h = dino.height;

    // 무적 상태일 때 무지개 반짝임 아우라 효과!
    if (activeItem === 'milk') {
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
    if (activeItem === 'speed') dinoColor = '#f59e0b';
    if (activeItem === 'magnet') dinoColor = '#38bdf8';
    if (activeItem === 'milk') dinoColor = `hsl(${(frameCount * 10) % 360}, 90%, 65%)`;

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

// 아이템 그리기 (⚡, 🧲, 🥛)
function drawItem(item) {
    ctx.save();
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let icon = '⚡';
    if (item.type === 'magnet') icon = '🧲';
    if (item.type === 'milk') icon = '🥛';

    // 부유 애니메이션
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
    // 텍스트
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ctx.save();
        ctx.font = 'bold 16px Pretendard, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 35;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        ft.y += ft.dy;
        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // 파티클
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
    updateItemBuff();

    // 속도 계산 (속도업 아이템 획득 시 1.8배 빠른 부스터속도!)
    const speedMultiplier = activeItem === 'speed' ? 1.8 : 1.0;
    const currentSpeed = (baseSpeed + Math.floor(score / 300) * 0.5) * speedMultiplier;

    // 점수 증가 (속도업 아이템일 때는 2배!)
    score += activeItem === 'speed' ? 2 : 1;
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

    // 아이템 이동 및 획득 검사
    createItem();
    for (let i = items.length - 1; i >= 0; i--) {
        items[i].x -= currentSpeed;

        if (checkCollision(dino, items[i])) {
            activateItem(items[i].type);
            items.splice(i, 1);
            continue;
        }

        if (items[i].x + items[i].width < 0) items.splice(i, 1);
    }

    // 장애물 이동, 자석 흡수, 충돌 검사
    createObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];

        // 🧲 자석 아이템 활성화 시 장애물이 공룡 입으로 끌려와 흡수됨!
        if (activeItem === 'magnet') {
            const dx = dino.x - obs.x;
            const dy = dino.y - obs.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 380) {
                obs.x += dx * 0.12;
                obs.y += dy * 0.12;

                if (dist < 35) {
                    addFloatingText(obs.x, obs.y, '+50점 흡수!', '#38bdf8');
                    score += 250; // 보너스 점수
                    createParticles(obs.x, obs.y, '#38bdf8', 15);
                    obstacles.splice(i, 1);
                    continue;
                }
            } else {
                obs.x -= currentSpeed;
            }
        } else {
            obs.x -= currentSpeed;
        }

        // 충돌 체크
        if (checkCollision(dino, obs)) {
            // 🥛 무적 우유 활성화 시 장애물을 뻥! 부수고 지나침!
            if (activeItem === 'milk') {
                addFloatingText(obs.x, obs.y - 10, '💥 BOOM! 무적 파괴!', '#f43f5e');
                createParticles(obs.x, obs.y, '#f43f5e', 25);
                score += 150;
                obstacles.splice(i, 1);
                continue;
            } else {
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
    const speedMultiplier = activeItem === 'speed' ? 1.8 : 1.0;
    const currentSpeed = (baseSpeed + Math.floor(score / 300) * 0.5) * speedMultiplier;

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
