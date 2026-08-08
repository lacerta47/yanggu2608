// 🌋 화산시대 공룡 달리기 게임 (v6 - 경고 없이 떨어지는 서프라이즈 낙하 유성!)

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

function playJumpSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

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

// 변수 및 상태
let gameState = 'START';
let score = 0;
let highScore = localStorage.getItem('dino_high_score') || 0;
highScoreText.textContent = Math.floor(highScore);

let baseSpeed = 6;
let gameSpeed = baseSpeed;
let frameCount = 0;

const groundY = 320;

// 공룡 (Dinosaur)
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
let nextSpawnInterval = 100;

// 배경 파티클
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
  if (gameState === 'PLAYING') {
    if (dino.isGrounded && !dino.isDucking) {
      dino.vy = dino.jumpStrength;
      dino.isGrounded = false;
      playJumpSound();
      addDust(dino.x + 10, groundY);
    }
  } else if (gameState === 'START' || gameState === 'GAMEOVER') {
    startNewGame();
  }
}

function startDuck() {
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

// 이벤트 등록
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

btnJump.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
btnDuck.addEventListener('pointerdown', (e) => { e.preventDefault(); startDuck(); });
btnDuck.addEventListener('pointerup', (e) => { e.preventDefault(); stopDuck(); });
btnDuck.addEventListener('pointerleave', (e) => { e.preventDefault(); stopDuck(); });

modalBtn.addEventListener('click', () => {
  startNewGame();
});

function startNewGame() {
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

  scoreText.textContent = '0';
  speedText.textContent = '1.0x';

  gameState = 'PLAYING';
  gameModal.classList.add('hidden');
}

// 장애물 생성
function spawnObstacle() {
  const isGround = Math.random() < 0.55;

  if (isGround) {
    const groundTypeRand = Math.random();

    if (groundTypeRand < 0.4) {
      obstacles.push({
        type: 'ROCK_SINGLE',
        x: canvas.width + 20,
        y: groundY - 36,
        width: 26,
        height: 36
      });
    } else if (groundTypeRand < 0.75) {
      obstacles.push({
        type: 'ROCK_DOUBLE',
        x: canvas.width + 20,
        y: groundY - 42,
        width: 48,
        height: 42
      });
    } else {
      obstacles.push({
        type: 'FIREBALL',
        x: canvas.width + 20,
        y: groundY - 28,
        width: 28,
        height: 28,
        rotation: 0
      });
    }
  } else {
    const birdTypeRand = Math.random();

    if (birdTypeRand < 0.45) {
      obstacles.push({
        type: 'BIRD_RED',
        x: canvas.width + 20,
        y: groundY - 42,
        width: 40,
        height: 26,
        speedBonus: 0,
        wingState: 0
      });
    } else if (birdTypeRand < 0.8) {
      obstacles.push({
        type: 'BIRD_YELLOW',
        x: canvas.width + 20,
        y: groundY - 74,
        width: 38,
        height: 28,
        speedBonus: 0,
        wingState: 0
      });
    } else {
      obstacles.push({
        type: 'BIRD_BLUE',
        x: canvas.width + 20,
        y: groundY - 110,
        width: 42,
        height: 26,
        speedBonus: 2.5,
        wingState: 0
      });
    }
  }
}

// ☄️ 경고 없이 하늘에서 깜짝 낙하하는 화산 유성 (Surprise Falling Meteor)
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

  // 점수 및 속도 증가
  score += 0.15;
  scoreText.textContent = Math.floor(score);

  gameSpeed = baseSpeed + (score / 110);
  if (gameSpeed > 18) gameSpeed = 18;
  speedText.textContent = (gameSpeed / baseSpeed).toFixed(1) + 'x';

  if (score > highScore) {
    highScore = score;
    highScoreText.textContent = Math.floor(highScore);
    localStorage.setItem('dino_high_score', highScore);
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

  // 다리 애니메이션
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
    nextSpawnInterval = Math.floor(Math.random() * 40 + (1000 / gameSpeed));
  }

  // ☄️ 경고 없이 기습 낙하하는 유성
  meteorSpawnTimer++;
  if (score > 45 && meteorSpawnTimer > 240) {
    if (Math.random() < 0.65) {
      spawnFallingMeteor();
    }
    meteorSpawnTimer = 0;
  }

  // 장애물 이동 및 충돌
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    const actualSpeed = gameSpeed + (obs.speedBonus || 0);
    obs.x -= actualSpeed;

    if (obs.type === 'FIREBALL') {
      obs.rotation += 0.2;
    }

    if (obs.type.startsWith('BIRD') && frameCount % 8 === 0) {
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

    if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  // ☄️ 서프라이즈 낙하 유성 이동 및 충돌 (경고 표시 없음!)
  for (let i = fallingMeteors.length - 1; i >= 0; i--) {
    const m = fallingMeteors[i];

    m.currentY += m.fallSpeedY;
    m.currentX -= (gameSpeed + m.fallSpeedX);

    // 땅 충돌시 즉시 바닥 운석 바위로 변환
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

    // 공룡 충돌
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
  modalTitle.textContent = '💥 공룡 부딪힘!';
  modalMessage.textContent = `깜짝 떨어진 유성이나 장애물에 부딪혔어요!\n\n⭐ 획득 점수: ${Math.floor(score)}점\n🏆 최고 점수: ${Math.floor(highScore)}점`;
  modalBtn.textContent = '다시 도전하기!';
  gameModal.classList.remove('hidden');
}

// 그린 그래픽 그리기
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 배경 화산 산맥
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

  // 2. ☄️ 경고 표시 없이 떨어지는 화염 유성
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

  // 5. 장애물 그리기
  for (let obs of obstacles) {
    if (obs.type === 'ROCK_SINGLE') {
      ctx.fillStyle = '#ff5e3a';
      ctx.strokeStyle = '#ffa07a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffdd59';
      ctx.fillRect(obs.x + 4, obs.y + 6, 6, 6);

    } else if (obs.type === 'ROCK_DOUBLE') {
      ctx.fillStyle = '#e74c3c';
      ctx.strokeStyle = '#ff7675';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y + 8, 22, obs.height - 8, 6);
      ctx.roundRect(obs.x + 22, obs.y, 26, obs.height, 6);
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

    } else if (obs.type === 'BIRD_YELLOW') {
      ctx.fillStyle = '#ffdd59';
      ctx.beginPath();
      ctx.arc(obs.x + 10, obs.y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4500';
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.y + 12);
      ctx.lineTo(obs.x - 8, obs.y + 16);
      ctx.lineTo(obs.x + 4, obs.y + 18);
      ctx.fill();

      ctx.fillStyle = '#ffa502';
      ctx.beginPath();
      if (obs.wingState === 0) {
        ctx.moveTo(obs.x + 10, obs.y + 10);
        ctx.lineTo(obs.x + 22, obs.y - 10);
        ctx.lineTo(obs.x + 28, obs.y + 10);
      } else {
        ctx.moveTo(obs.x + 10, obs.y + 10);
        ctx.lineTo(obs.x + 22, obs.y + 22);
        ctx.lineTo(obs.x + 28, obs.y + 10);
      }
      ctx.fill();

    } else if (obs.type === 'BIRD_BLUE') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f2fe';

      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.arc(obs.x + 12, obs.y + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4facfe';
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.y + 12);
      ctx.lineTo(obs.x - 12, obs.y + 14);
      ctx.lineTo(obs.x + 4, obs.y + 18);
      ctx.fill();

      ctx.fillStyle = '#70a1ff';
      ctx.beginPath();
      if (obs.wingState === 0) {
        ctx.moveTo(obs.x + 12, obs.y + 10);
        ctx.lineTo(obs.x + 26, obs.y - 14);
        ctx.lineTo(obs.x + 32, obs.y + 10);
      } else {
        ctx.moveTo(obs.x + 12, obs.y + 10);
        ctx.lineTo(obs.x + 26, obs.y + 24);
        ctx.lineTo(obs.x + 32, obs.y + 10);
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
    ctx.beginPath();
    ctx.roundRect(dx, dy + 6, 52, 20, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(dx + 30, dy + 2, 24, 18, 5);
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
    ctx.beginPath();
    ctx.roundRect(dx, dy + 10, 36, 32, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(dx + 12, dy, 28, 22, 6);
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
