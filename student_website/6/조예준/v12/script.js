// 🌋 화산시대 공룡 달리기 게임 (v12 - 장애물 등장 대폭 증가 & 스릴 넘치는 액션!)

// 안전한 캔버스 라운드 사각형 호환 함수
function drawRoundRect(ctx, x, y, width, height, radius) {
  if (radius === undefined) radius = 6;
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}

// 요소 참조
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreText = document.getElementById('scoreText');
const highScoreText = document.getElementById('highScoreText');
const speedText = document.getElementById('speedText');

const gameModal = document.getElementById('gameModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalBtn = document.getElementById('modalBtn');
const btnJump = document.getElementById('btnJump');
const btnDuck = document.getElementById('btnDuck');

// 사운드 시스템
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playJumpSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

function playDuckSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {}
}

function playWarningSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.setValueAtTime(1350, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch (e) {}
}

function playMeteorFallSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

function playMeteorImpactSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

function playCrashSound() {
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
}

// 게임 변수 및 상태
let gameState = 'START';
let score = 0;
let highScore = 0;
try {
  highScore = localStorage.getItem('dino_high_score') || 0;
} catch(e) {}
if (highScoreText) highScoreText.textContent = Math.floor(highScore);

let baseSpeed = 6;
let gameSpeed = baseSpeed;
let frameCount = 0;

const groundY = 320;

// 공룡 상태
const dino = {
  x: 80,
  y: groundY - 50,
  normalWidth: 44,
  normalHeight: 50,
  duckWidth: 56,
  duckHeight: 26,
  width: 44,
  height: 50,
  vy: 0,
  gravity: 0.7,
  jumpStrength: -13.5,
  isGrounded: true,
  isDucking: false,
  legFrame: 0,
  legTimer: 0
};

// 장애물 및 낙하 유성 배열
let obstacles = [];
let fallingMeteors = [];

let obstacleSpawnTimer = 0;
let meteorSpawnTimer = 0;
let nextSpawnInterval = 50; // 🔥 촘촘해진 장애물 출현 속도!

// 파티클
let embers = [];
for (let i = 0; i < 30; i++) {
  embers.push({
    x: Math.random() * canvas.width,
    y: Math.random() * (groundY - 100),
    size: Math.random() * 3 + 1,
    vx: -Math.random() * 1.5 - 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    alpha: Math.random() * 0.7 + 0.3
  });
}

let dustParticles = [];
function addDust(x, y) {
  dustParticles.push({
    x: x,
    y: y,
    vx: -gameSpeed * 0.5 - Math.random() * 2,
    vy: -Math.random() * 2,
    size: Math.random() * 4 + 2,
    alpha: 0.8
  });
}

// 점프 & 숙이기
function jump() {
  initAudio();
  if (gameState === 'PLAYING') {
    if (dino.isGrounded && !dino.isDucking) {
      dino.vy = dino.jumpStrength;
      dino.isGrounded = false;
      playJumpSound();
      addDust(dino.x + 10, groundY);
    }
  } else {
    startNewGame();
  }
}

function startDuck() {
  initAudio();
  if (gameState === 'PLAYING' && dino.isGrounded && !dino.isDucking) {
    dino.isDucking = true;
    dino.width = dino.duckWidth;
    dino.height = dino.duckHeight;
    dino.y = groundY - dino.duckHeight;
    playDuckSound();
  }
}

function stopDuck() {
  if (dino.isDucking) {
    dino.isDucking = false;
    dino.width = dino.normalWidth;
    dino.height = dino.normalHeight;
    dino.y = groundY - dino.normalHeight;
  }
}

// 게임 시작
function startNewGame() {
  initAudio();
  score = 0;
  gameSpeed = baseSpeed;
  frameCount = 0;
  obstacles = [];
  fallingMeteors = [];

  obstacleSpawnTimer = 0;
  meteorSpawnTimer = 0;
  nextSpawnInterval = 45; // 빠른 촘촘한 시작

  stopDuck();
  dino.y = groundY - dino.normalHeight;
  dino.vy = 0;
  dino.isGrounded = true;

  if (scoreText) scoreText.textContent = '0';
  if (speedText) speedText.textContent = '1.0x';

  gameState = 'PLAYING';
  if (gameModal) gameModal.classList.add('hidden');
}

// 이벤트 바인딩
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    jump();
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    startDuck();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    stopDuck();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  jump();
});

if (btnJump) {
  btnJump.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
  btnJump.addEventListener('click', (e) => { e.preventDefault(); jump(); });
}

if (btnDuck) {
  btnDuck.addEventListener('pointerdown', (e) => { e.preventDefault(); startDuck(); });
  btnDuck.addEventListener('pointerup', (e) => { e.preventDefault(); stopDuck(); });
  btnDuck.addEventListener('pointerleave', (e) => { e.preventDefault(); stopDuck(); });
}

if (modalBtn) {
  modalBtn.addEventListener('click', (e) => { e.stopPropagation(); startNewGame(); });
  modalBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); startNewGame(); });
}

if (gameModal) {
  gameModal.addEventListener('click', () => { if (gameState !== 'PLAYING') startNewGame(); });
  gameModal.addEventListener('pointerdown', () => { if (gameState !== 'PLAYING') startNewGame(); });
}

// 🌟 대폭 풍부해진 장애물 생성 로직!
function spawnObstacle() {
  const rand = Math.random();

  if (rand < 0.2) {
    // 🔴 통통 높게 튀어 오르는 바위
    obstacles.push({
      type: 'BOUNCING_ROCK',
      x: canvas.width + 20,
      baseY: groundY - 32,
      y: groundY - 32,
      width: 30,
      height: 30,
      bouncePhase: Math.random() * Math.PI * 2,
      bounceHeight: Math.random() * 40 + 40
    });
  } else if (rand < 0.35) {
    // 🌋 솟구치는 마그마 가시
    obstacles.push({
      type: 'RISING_SPIKE',
      x: canvas.width + 20,
      y: groundY - 36,
      width: 28,
      height: 38,
      spikeOffset: 0,
      phase: Math.random() * Math.PI * 2
    });
  } else if (rand < 0.5) {
    // 🦎 재빠르게 뛰어오는 마그마 도마뱀 장애물!
    obstacles.push({
      type: 'MAGMA_LIZARD',
      x: canvas.width + 20,
      y: groundY - 26,
      width: 38,
      height: 24,
      speedBonus: 2.2, // 아주 빠르게 접근!
      legFrame: 0
    });
  } else if (rand < 0.65) {
    // ⛰️ 3연속 거대 화산 가시돌 (멀리 점프해야함!)
    obstacles.push({
      type: 'ROCK_TRIPLE',
      x: canvas.width + 20,
      y: groundY - 44,
      width: 65,
      height: 44
    });
  } else if (rand < 0.8) {
    // 🦅 급강하 익룡
    obstacles.push({
      type: 'SWOOPING_BIRD',
      x: canvas.width + 20,
      baseY: groundY - 95,
      y: groundY - 95,
      width: 40,
      height: 26,
      wingState: 0,
      swoopPhase: 0
    });
  } else {
    // 🚨 낮게 날아오는 붉은 익룡 (숙이기 필수!)
    obstacles.push({
      type: 'BIRD_RED',
      x: canvas.width + 20,
      y: groundY - 42,
      width: 40,
      height: 26,
      speedBonus: 0,
      wingState: 0
    });
  }
}

// 🚨 ⚠️ 유성 낙하 경고
function spawnFallingMeteorWithWarning() {
  const targetX = Math.random() * 400 + 260;

  fallingMeteors.push({
    targetX: targetX,
    currentX: targetX + 110,
    currentY: -50,
    targetY: groundY - 28,
    size: 28,
    timer: 0,
    warningDuration: 45,
    isFalling: false,
    hasPlayedFallSound: false
  });

  playWarningSound();
}

// 게임 업데이트
function update() {
  if (gameState !== 'PLAYING') return;

  frameCount++;

  score += 0.15;
  if (scoreText) scoreText.textContent = Math.floor(score);

  gameSpeed = baseSpeed + (score / 110);
  if (gameSpeed > 18) gameSpeed = 18;
  if (speedText) speedText.textContent = (gameSpeed / baseSpeed).toFixed(1) + 'x';

  if (score > highScore) {
    highScore = score;
    if (highScoreText) highScoreText.textContent = Math.floor(highScore);
    try {
      localStorage.setItem('dino_high_score', highScore);
    } catch(e) {}
  }

  // 공룡 운동
  if (!dino.isDucking) {
    dino.vy += dino.gravity;
    dino.y += dino.vy;

    if (dino.y >= groundY - dino.normalHeight) {
      dino.y = groundY - dino.normalHeight;
      dino.vy = 0;
      if (!dino.isGrounded) addDust(dino.x + 10, groundY);
      dino.isGrounded = true;
    }
  } else {
    dino.y = groundY - dino.duckHeight;
    dino.vy = 0;
    dino.isGrounded = true;
  }

  dino.legTimer++;
  if (dino.legTimer > Math.max(2, 8 - Math.floor(gameSpeed / 2))) {
    dino.legFrame = (dino.legFrame + 1) % 2;
    dino.legTimer = 0;
    if (dino.isGrounded) addDust(dino.x + 5, groundY);
  }

  // 🔥 훨씬 촘촘해진 장애물 생성 타이머
  obstacleSpawnTimer++;
  if (obstacleSpawnTimer > nextSpawnInterval) {
    spawnObstacle();
    obstacleSpawnTimer = 0;
    // 35~55 프레임마다 장애물이 계속 쏟아짐!
    nextSpawnInterval = Math.floor(Math.random() * 25 + (600 / gameSpeed));
  }

  // 🚨 유성 낙하도 더 자주 생성
  meteorSpawnTimer++;
  if (score > 25 && meteorSpawnTimer > 160) {
    if (Math.random() < 0.75) {
      spawnFallingMeteorWithWarning();
    }
    meteorSpawnTimer = 0;
  }

  // 장애물 이동
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    const actualSpeed = gameSpeed + (obs.speedBonus || 0);
    obs.x -= actualSpeed;

    if (obs.type === 'BOUNCING_ROCK') {
      obs.y = obs.baseY - Math.abs(Math.sin(frameCount * 0.1 + obs.bouncePhase)) * obs.bounceHeight;
    } else if (obs.type === 'RISING_SPIKE') {
      obs.spikeOffset = Math.sin(frameCount * 0.15 + obs.phase) * 16;
      obs.y = groundY - 36 + obs.spikeOffset;
    } else if (obs.type === 'SWOOPING_BIRD') {
      obs.swoopPhase += 0.05;
      obs.y = obs.baseY + Math.sin(obs.swoopPhase) * 45;
      if (frameCount % 6 === 0) obs.wingState = (obs.wingState + 1) % 2;
    } else if (obs.type === 'MAGMA_LIZARD' && frameCount % 6 === 0) {
      obs.legFrame = (obs.legFrame + 1) % 2;
    } else if (obs.type === 'FIREBALL') {
      obs.rotation += 0.2;
    } else if (obs.type.startsWith('BIRD') && frameCount % 8 === 0) {
      obs.wingState = (obs.wingState + 1) % 2;
    }

    const padding = 6;
    if (
      dino.x + padding < obs.x + obs.width - padding &&
      dino.x + dino.width - padding > obs.x + padding &&
      dino.y + padding < obs.y + obs.height - padding &&
      dino.y + dino.height - padding > obs.y + padding
    ) {
      playCrashSound();
      gameState = 'GAMEOVER';
      showGameOverModal();
    }

    if (obs.x + obs.width < -30) {
      obstacles.splice(i, 1);
    }
  }

  // 유성 이동
  for (let i = fallingMeteors.length - 1; i >= 0; i--) {
    const m = fallingMeteors[i];

    m.targetX -= gameSpeed;
    m.currentX -= gameSpeed;

    if (!m.isFalling) {
      m.timer++;
      if (m.timer >= m.warningDuration) {
        m.isFalling = true;
      }
    } else {
      if (!m.hasPlayedFallSound) {
        m.hasPlayedFallSound = true;
        playMeteorFallSound();
      }

      m.currentY += 18;
      m.currentX -= 5;

      if (m.currentY >= m.targetY) {
        playMeteorImpactSound();
        addDust(m.targetX, groundY);

        obstacles.push({
          type: 'FIREBALL',
          x: m.targetX,
          y: groundY - 28,
          width: 28,
          height: 28,
          rotation: 0
        });

        fallingMeteors.splice(i, 1);
        continue;
      }

      const padding = 6;
      if (
        dino.x + padding < m.currentX + m.size - padding &&
        dino.x + dino.width - padding > m.currentX - padding &&
        dino.y + padding < m.currentY + m.size - padding &&
        dino.y + dino.height - padding > m.currentY - padding
      ) {
        playCrashSound();
        gameState = 'GAMEOVER';
        showGameOverModal();
      }
    }

    if (m.targetX < -50) {
      fallingMeteors.splice(i, 1);
    }
  }

  // 먼지 파티클
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.04;
    if (p.alpha <= 0) dustParticles.splice(i, 1);
  }

  for (let emb of embers) {
    emb.x += emb.vx;
    emb.y += emb.vy;
    if (emb.x < 0) emb.x = canvas.width;
    if (emb.y < 0) emb.y = groundY - 80;
  }
}

function showGameOverModal() {
  if (modalTitle) modalTitle.textContent = '💥 공룡 부딪힘!';
  if (modalMessage) modalMessage.textContent = `쏟아지는 장애물이나 유성에 부딪혔어요!\n\n⭐ 획득 점수: ${Math.floor(score)}점\n🏆 최고 점수: ${Math.floor(highScore)}점`;
  if (modalBtn) modalBtn.textContent = '다시 도전하기!';
  if (gameModal) gameModal.classList.remove('hidden');
}

// 그리기 (Drawing)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 화산 산맥
  ctx.fillStyle = '#2b0f38';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(120, 160);
  ctx.lineTo(240, groundY);
  ctx.lineTo(450, 130);
  ctx.lineTo(600, groundY);
  ctx.lineTo(720, 200);
  ctx.lineTo(800, groundY);
  ctx.fill();

  ctx.fillStyle = '#ff4500';
  ctx.beginPath();
  ctx.moveTo(435, 145);
  ctx.lineTo(450, 130);
  ctx.lineTo(465, 145);
  ctx.fill();

  for (let emb of embers) {
    ctx.fillStyle = `rgba(255, 140, 0, ${emb.alpha})`;
    ctx.beginPath();
    ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 🚨 유성 낙하 경고
  for (let m of fallingMeteors) {
    if (!m.isFalling) {
      const blink = Math.floor(frameCount / 5) % 2 === 0;

      if (blink) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4757';

        ctx.strokeStyle = 'rgba(255, 71, 87, 0.7)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(m.targetX, 0);
        ctx.lineTo(m.targetX, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 20px "Gowun Dodum"';
        ctx.fillStyle = '#ff4757';
        ctx.fillText('⚠️ 유성 낙하!', m.targetX - 45, 45);

        ctx.shadowBlur = 0;
      }
    } else {
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ff4757';

      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(m.currentX, m.currentY, m.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdd59';
      ctx.beginPath();
      ctx.arc(m.currentX + 8, m.currentY - 12, m.size / 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  // 3. 땅 및 용암 균열
  ctx.fillStyle = '#3a1c40';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  ctx.strokeStyle = '#ff4500';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  ctx.lineTo(canvas.width, groundY + 2);
  ctx.stroke();

  ctx.strokeStyle = '#5a2d60';
  ctx.lineWidth = 2;
  for (let i = 0; i < canvas.width; i += 40) {
    const offsetX = (i - (frameCount * gameSpeed) % 40);
    ctx.beginPath();
    ctx.moveTo(offsetX, groundY + 12);
    ctx.lineTo(offsetX + 15, groundY + 12);
    ctx.stroke();
  }

  // 4. 발 먼지
  for (let p of dustParticles) {
    ctx.fillStyle = `rgba(180, 140, 190, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. 🌟 대폭 증가한 장애물 그리기
  for (let obs of obstacles) {
    if (obs.type === 'MAGMA_LIZARD') {
      // 🦎 재빠르게 뛰어오는 마그마 도마뱀
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y + 4, obs.width, obs.height - 4, 6);
      ctx.fill();

      ctx.fillStyle = '#ffdd59';
      ctx.beginPath();
      ctx.arc(obs.x + 8, obs.y + 10, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d63031';
      if (obs.legFrame === 0) {
        ctx.fillRect(obs.x + 8, obs.y + 20, 6, 4);
        ctx.fillRect(obs.x + 24, obs.y + 18, 6, 4);
      } else {
        ctx.fillRect(obs.x + 8, obs.y + 18, 6, 4);
        ctx.fillRect(obs.x + 24, obs.y + 20, 6, 4);
      }

    } else if (obs.type === 'ROCK_TRIPLE') {
      // ⛰️ 3연속 거대 화산 가시돌
      ctx.fillStyle = '#d63031';
      ctx.strokeStyle = '#ff7675';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y + 12, 18, obs.height - 12, 5);
      ctx.roundRect(obs.x + 18, obs.y, 24, obs.height, 6);
      ctx.roundRect(obs.x + 42, obs.y + 8, 23, obs.height - 8, 5);
      ctx.fill();
      ctx.stroke();

    } else if (obs.type === 'BOUNCING_ROCK') {
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ff4757';

      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(obs.x + 15, obs.y + 15, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdd59';
      ctx.beginPath();
      ctx.arc(obs.x + 10, obs.y + 10, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

    } else if (obs.type === 'RISING_SPIKE') {
      ctx.fillStyle = '#ff5e3a';
      ctx.strokeStyle = '#ffdd59';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(obs.x, groundY);
      ctx.lineTo(obs.x + obs.width / 2, obs.y);
      ctx.lineTo(obs.x + obs.width, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else if (obs.type === 'SWOOPING_BIRD') {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#a55efa';

      ctx.fillStyle = '#a55efa';
      ctx.beginPath();
      ctx.arc(obs.x + 12, obs.y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdd59';
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.y + 12);
      ctx.lineTo(obs.x - 10, obs.y + 16);
      ctx.lineTo(obs.x + 4, obs.y + 18);
      ctx.fill();

      ctx.fillStyle = '#be2edd';
      ctx.beginPath();
      if (obs.wingState === 0) {
        ctx.moveTo(obs.x + 12, obs.y + 10);
        ctx.lineTo(obs.x + 24, obs.y - 14);
        ctx.lineTo(obs.x + 30, obs.y + 10);
      } else {
        ctx.moveTo(obs.x + 12, obs.y + 10);
        ctx.lineTo(obs.x + 24, obs.y + 24);
        ctx.lineTo(obs.x + 30, obs.y + 10);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (obs.type === 'BIRD_RED') {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff4757';

      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(obs.x + 12, obs.y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff6b81';
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.y + 12);
      ctx.lineTo(obs.x - 10, obs.y + 16);
      ctx.lineTo(obs.x + 4, obs.y + 18);
      ctx.fill();

      ctx.fillStyle = '#ffbe76';
      ctx.beginPath();
      if (obs.wingState === 0) {
        ctx.moveTo(obs.x + 12, obs.y + 10);
        ctx.lineTo(obs.x + 24, obs.y - 12);
        ctx.lineTo(obs.x + 30, obs.y + 10);
      } else {
        ctx.moveTo(obs.x + 12, obs.y + 10);
        ctx.lineTo(obs.x + 24, obs.y + 24);
        ctx.lineTo(obs.x + 30, obs.y + 10);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (obs.type === 'FIREBALL') {
      ctx.save();
      ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
      ctx.rotate(obs.rotation);

      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff4500';

      ctx.fillStyle = '#ff4b2b';
      ctx.beginPath();
      ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdd59';
      ctx.beginPath();
      ctx.arc(-4, -4, 4, 0, Math.PI * 2);
      ctx.arc(4, 4, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // 6. 공룡 그리기
  const dx = dino.x;
  const dy = dino.y;

  if (dino.isDucking) {
    ctx.fillStyle = '#2ed573';
    drawRoundRect(ctx, dx, dy + 6, 52, 20, 8);
    ctx.fill();

    drawRoundRect(ctx, dx + 30, dy + 2, 24, 18, 5);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dx + 46, dy + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(dx + 47, dy + 8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#26af5f';
    ctx.beginPath();
    ctx.moveTo(dx, dy + 10);
    ctx.lineTo(dx - 12, dy + 14);
    ctx.lineTo(dx, dy + 20);
    ctx.fill();

    ctx.fillStyle = '#1e90ff';
    if (dino.legFrame === 0) {
      ctx.fillRect(dx + 12, dy + 22, 10, 4);
      ctx.fillRect(dx + 32, dy + 20, 10, 6);
    } else {
      ctx.fillRect(dx + 12, dy + 20, 10, 6);
      ctx.fillRect(dx + 32, dy + 22, 10, 4);
    }
  } else {
    ctx.fillStyle = '#2ed573';
    drawRoundRect(ctx, dx, dy + 10, 36, 32, 8);
    ctx.fill();

    drawRoundRect(ctx, dx + 12, dy, 28, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dx + 30, dy + 7, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(dx + 31, dy + 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#26af5f';
    ctx.beginPath();
    ctx.moveTo(dx, dy + 20);
    ctx.lineTo(dx - 12, dy + 28);
    ctx.lineTo(dx, dy + 32);
    ctx.fill();

    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(dx + 26, dy + 14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e90ff';
    if (!dino.isGrounded) {
      ctx.fillRect(dx + 8, dy + 40, 8, 10);
      ctx.fillRect(dx + 22, dy + 40, 8, 10);
    } else {
      if (dino.legFrame === 0) {
        ctx.fillRect(dx + 6, dy + 40, 8, 10);
        ctx.fillRect(dx + 22, dy + 38, 8, 8);
      } else {
        ctx.fillRect(dx + 6, dy + 38, 8, 8);
        ctx.fillRect(dx + 22, dy + 40, 8, 10);
      }
    }
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
