// 🌋 화산시대 공룡 달리기 게임 (v10 - 아이템 제거 & 다양하게 움직이는 장애물 서프라이즈!)

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

// 배열
let obstacles = [];
let fallingMeteors = [];

let obstacleSpawnTimer = 0;
let meteorSpawnTimer = 0;
let nextSpawnInterval = 100;

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
  nextSpawnInterval = 90;

  stopDuck();
  dino.y = groundY - dino.normalHeight;
  dino.vy = 0;
  dino.isGrounded = true;

  if (scoreText) scoreText.textContent = '0';
  if (speedText) speedText.textContent = '1.0x';

  gameState = 'PLAYING';
  if (gameModal) gameModal.classList.add('hidden');
}

// 조작 이벤트 바인딩
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

// 🌟 다양하게 움직이는 장애물 생성 로직!
function spawnObstacle() {
  const rand = Math.random();

  if (rand < 0.25) {
    // 1. 🔴 통통 높게 튀어 오르는 움직이는 용암 바위 (Bouncing Rock)
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
  } else if (rand < 0.45) {
    // 2. 🌋 땅에서 위아래로 솟구쳐 오르는 마그마 가시 (Rising Spike Column)
    obstacles.push({
      type: 'RISING_SPIKE',
      x: canvas.width + 20,
      y: groundY - 36,
      width: 28,
      height: 38,
      spikeOffset: 0,
      phase: Math.random() * Math.PI * 2
    });
  } else if (rand < 0.65) {
    // 3. 🦅 공룡 쪽으로 커브를 그리며 급강하하는 익룡 (Swooping Pterodactyl)
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
  } else if (rand < 0.82) {
    // 4. 🚨 낮게 날아오는 붉은 익룡 (숙이기 필수!)
    obstacles.push({
      type: 'BIRD_RED',
      x: canvas.width + 20,
      y: groundY - 42,
      width: 40,
      height: 26,
      speedBonus: 0,
      wingState: 0
    });
  } else {
    // 5. ☄️ 굴러오는 마그마 불타는 운석 구체
    obstacles.push({
      type: 'FIREBALL',
      x: canvas.width + 20,
      y: groundY - 28,
      width: 28,
      height: 28,
      rotation: 0
    });
  }
}

// v6 서프라이즈 낙하 유성
function spawnFallingMeteor() {
  const targetX = Math.random() * 400 + 250;

  fallingMeteors.push({
    targetX: targetX,
    currentX: targetX + 100,
    currentY: -40,
    targetY: groundY - 28,
    size: 28,
    fallSpeedY: 18,
    fallSpeedX: 5
  });
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

  // 장애물 생성
  obstacleSpawnTimer++;
  if (obstacleSpawnTimer > nextSpawnInterval) {
    spawnObstacle();
    obstacleSpawnTimer = 0;
    nextSpawnInterval = Math.floor(Math.random() * 45 + (1000 / gameSpeed));
  }

  // v6 서프라이즈 낙하 유성
  meteorSpawnTimer++;
  if (score > 40 && meteorSpawnTimer > 230) {
    if (Math.random() < 0.65) {
      spawnFallingMeteor();
    }
    meteorSpawnTimer = 0;
  }

  // 🌟 움직이는 장애물 이동 및 역동적 위치 계산
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    const actualSpeed = gameSpeed + (obs.speedBonus || 0);
    obs.x -= actualSpeed;

    if (obs.type === 'BOUNCING_ROCK') {
      // 🔴 통통 높게 튀어 오르는 바위
      obs.y = obs.baseY - Math.abs(Math.sin(frameCount * 0.1 + obs.bouncePhase)) * obs.bounceHeight;
    } else if (obs.type === 'RISING_SPIKE') {
      // 🌋 땅에서 솟구쳤다 들어가는 가시
      obs.spikeOffset = Math.sin(frameCount * 0.15 + obs.phase) * 16;
      obs.y = groundY - 36 + obs.spikeOffset;
    } else if (obs.type === 'SWOOPING_BIRD') {
      // 🦅 곡선을 그리며 급강하했다가 상승하는 익룡
      obs.swoopPhase += 0.05;
      obs.y = obs.baseY + Math.sin(obs.swoopPhase) * 45;
      if (frameCount % 6 === 0) obs.wingState = (obs.wingState + 1) % 2;
    } else if (obs.type === 'FIREBALL') {
      obs.rotation += 0.2;
    } else if (obs.type.startsWith('BIRD') && frameCount % 8 === 0) {
      obs.wingState = (obs.wingState + 1) % 2;
    }

    // 히트박스 충돌
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

  // v6 서프라이즈 낙하 유성 이동 및 충돌
  for (let i = fallingMeteors.length - 1; i >= 0; i--) {
    const m = fallingMeteors[i];

    m.currentY += m.fallSpeedY;
    m.currentX -= (gameSpeed + m.fallSpeedX);

    if (m.currentY >= m.targetY) {
      addDust(m.currentX, groundY);

      obstacles.push({
        type: 'FIREBALL',
        x: m.currentX,
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

    if (m.currentX < -50 || m.currentY > canvas.height) {
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
  if (modalMessage) modalMessage.textContent = `움직이는 화산 장애물이나 유성에 부딪혔어요!\n\n⭐ 획득 점수: ${Math.floor(score)}점\n🏆 최고 점수: ${Math.floor(highScore)}점`;
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

  // 2. ☄️ 경고 없이 서프라이즈로 떨어지는 유성
  for (let m of fallingMeteors) {
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

  // 5. 🌟 다양하게 움직이는 다이나믹 장애물 그리기
  for (let obs of obstacles) {
    if (obs.type === 'BOUNCING_ROCK') {
      // 🔴 통통 높게 튀어 오르는 바위
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
      // 🌋 위아래로 솟구치는 마그마 가시 기둥
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
      // 🦅 커브를 그리며 급강하하는 익룡
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

    } else if (obs.type === 'ROCK_SINGLE') {
      ctx.fillStyle = '#ff5e3a';
      ctx.strokeStyle = '#ffa07a';
      ctx.lineWidth = 2;
      drawRoundRect(ctx, obs.x, obs.y, obs.width, obs.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffdd59';
      ctx.fillRect(obs.x + 4, obs.y + 6, 6, 6);

    } else if (obs.type === 'ROCK_DOUBLE') {
      ctx.fillStyle = '#e74c3c';
      ctx.strokeStyle = '#ff7675';
      ctx.lineWidth = 2;
      drawRoundRect(ctx, obs.x, obs.y + 8, 22, obs.height - 8, 6);
      drawRoundRect(ctx, obs.x + 22, obs.y, 26, obs.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffdd59';
      ctx.fillRect(obs.x + 6, obs.y + 16, 4, 4);
      ctx.fillRect(obs.x + 30, obs.y + 10, 6, 6);

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
