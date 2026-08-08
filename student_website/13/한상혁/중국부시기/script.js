/**
 * 평양 초광속 폭탄 시뮬레이터 (졸라맨 10전사 대군단 & 무너진 모습 & 100% 클리어)
 * HTML5 캔버스 & Web Audio API 게임 엔진
 */

document.addEventListener('DOMContentLoaded', () => {
  // 캔버스 엘리먼트
  const ruinsCanvas = document.getElementById('ruins-canvas');
  const bgCanvas = document.getElementById('bg-canvas');
  const craterCanvas = document.getElementById('crater-canvas');
  const fxCanvas = document.getElementById('fx-canvas');

  const ruinsCtx = ruinsCanvas.getContext('2d');
  const bgCtx = bgCanvas.getContext('2d');
  const craterCtx = craterCanvas.getContext('2d');
  const fxCtx = fxCanvas.getContext('2d');

  // HUD 엘리먼트
  const statCountEl = document.getElementById('stat-count');
  const statPowerEl = document.getElementById('stat-power');
  const statCpsEl = document.getElementById('stat-cps');
  const cityProgressBar = document.getElementById('city-progress-bar');
  const cityPercentText = document.getElementById('city-percent-text');

  // 모달 엘리먼트
  const clearModal = document.getElementById('clear-modal');
  const modalBombs = document.getElementById('modal-bombs');
  const modalPower = document.getElementById('modal-power');
  const modalTime = document.getElementById('modal-time');
  const modalRestartBtn = document.getElementById('modal-restart-btn');

  const weaponBtns = document.querySelectorAll('.weapon-btn');
  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');
  const btnShake = document.getElementById('btn-shake');
  const btnAuto = document.getElementById('btn-auto');
  const btnReset = document.getElementById('btn-reset');

  // 게임 상태 변수
  let currentWeapon = 'tnt'; // 'tnt', 'nuke', 'cluster', 'orbital', 'stickman'
  let soundEnabled = true;
  let shakeEnabled = true;
  let autoTurbo = false;
  let isMouseDown = false;

  let explosionCount = 0;
  let totalPowerMt = 0;
  let clickTimestamps = [];
  let currentCps = 0;

  // 도시 파괴 시스템 변수
  let cityDestructPercent = 0;
  let isGameCleared = false;
  let gameStartTime = Date.now();

  // 화면 흔들림 변수
  let shakeIntensity = 0;
  let shakeOffsetX = 0;
  let shakeOffsetY = 0;

  // 1. 온전한 중국 베이징 배경 이미지
  const bgImg = new Image();
  bgImg.src = '../assets/images/beijing.jpg';
  let bgLoaded = false;

  bgImg.onload = () => {
    bgLoaded = true;
    resetGame();
  };

  // 2. 무너진 건물 폐허 이미지 (베이징 폐허)
  const ruinsImg = new Image();
  ruinsImg.src = '../assets/images/beijing_ruins.jpg';
  let ruinsLoaded = false;

  ruinsImg.onload = () => {
    ruinsLoaded = true;
    renderRuinsBackground();
  };

  // 파티클 & 애니메이션 데이터
  const particles = [];
  const shockwaves = [];
  const floatingTexts = [];
  const laserBeams = [];
  const craters = [];
  const stickmenClones = [];

  // 🥋 화면 상에 직접 나와서 액션을 펼치는 졸라맨 12전사 대군단 (12 Stickman Hero Squad)
  const heroStickmen = [
    { id: 1, name: '레드', headbandColor: '#ef4444', offsetX: 0, offsetY: 0, scale: 1.35, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: 1, attackType: 0, animFrame: 0 },
    { id: 2, name: '블루', headbandColor: '#38bdf8', offsetX: -50, offsetY: -25, scale: 1.25, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: 1, attackType: 1, animFrame: 2 },
    { id: 3, name: '옐로우', headbandColor: '#fbbf24', offsetX: 50, offsetY: -25, scale: 1.25, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: -1, attackType: 2, animFrame: 4 },
    { id: 4, name: '그린', headbandColor: '#34d399', offsetX: -90, offsetY: 25, scale: 1.15, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: 1, attackType: 0, animFrame: 6 },
    { id: 5, name: '퍼플', headbandColor: '#c084fc', offsetX: 90, offsetY: 25, scale: 1.15, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: -1, attackType: 1, animFrame: 8 },
    { id: 6, name: '오렌지', headbandColor: '#f97316', offsetX: -135, offsetY: -10, scale: 1.15, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: 1, attackType: 2, animFrame: 10 },
    { id: 7, name: '골드', headbandColor: '#fef08a', offsetX: 135, offsetY: -10, scale: 1.15, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: -1, attackType: 0, animFrame: 12 },
    { id: 8, name: '핑크', headbandColor: '#f472b6', offsetX: -175, offsetY: 40, scale: 1.1, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: 1, attackType: 1, animFrame: 14 },
    { id: 9, name: '민트', headbandColor: '#2dd4bf', offsetX: 175, offsetY: 40, scale: 1.1, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: -1, attackType: 2, animFrame: 16 },
    { id: 10, name: '브론즈', headbandColor: '#fb923c', offsetX: 0, offsetY: -55, scale: 1.3, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: 1, attackType: 0, animFrame: 18 },
    { id: 11, name: '실버', headbandColor: '#e2e8f0', offsetX: -215, offsetY: 15, scale: 1.1, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: 1, attackType: 1, animFrame: 20 },
    { id: 12, name: '네이비', headbandColor: '#818cf8', offsetX: 215, offsetY: 15, scale: 1.1, x: 0, y: 0, targetX: 0, targetY: 0, state: 'idle', facing: -1, attackType: 2, animFrame: 22 }
  ];

  // Web Audio 오디오 컨텍스트
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 사운드 생성기 (Web Audio API 기반)
  function playExplosionSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === 'tnt') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

      createNoiseBuffer(0.3, 0.6);
    } else if (type === 'nuke') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);

      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.2);

      createNoiseBuffer(1.5, 1.0);
    } else if (type === 'cluster') {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const t = audioCtx.currentTime;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220 + Math.random() * 200, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
        }, i * 40);
      }
    } else if (type === 'orbital') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
      createNoiseBuffer(0.4, 0.7);
    } else if (type === 'stickman') {
      // 졸라맨 10전사 광란 연타 사운드
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const t = audioCtx.currentTime;
          osc.type = 'square';
          osc.frequency.setValueAtTime(350 + Math.random() * 450, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
          gain.gain.setValueAtTime(0.6, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
        }, i * 35);
      }
    } else if (type === 'clear') {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const t = audioCtx.currentTime;
          osc.type = 'square';
          osc.frequency.setValueAtTime(440 * (i + 1), t);
          osc.frequency.exponentialRampToValueAtTime(880 * (i + 1), t + 0.4);
          gain.gain.setValueAtTime(0.5, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.4);
        }, i * 150);
      }
    }
  }

  function createNoiseBuffer(duration, volume) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start();
  }

  // 창 크기 조절 대응
  function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    ruinsCanvas.width = bgCanvas.width = craterCanvas.width = fxCanvas.width = w;
    ruinsCanvas.height = bgCanvas.height = craterCanvas.height = fxCanvas.height = h;

    renderRuinsBackground();
    resetGame();
  }

  window.addEventListener('resize', resizeCanvas);

  function resetGame() {
    renderRuinsBackground();
    renderBackground();
    craters.length = 0;
    particles.length = 0;
    shockwaves.length = 0;
    laserBeams.length = 0;
    stickmenClones.length = 0;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 + 50;

    // 졸라맨 10전사 위치 초기화
    heroStickmen.forEach(sm => {
      sm.x = centerX + sm.offsetX;
      sm.y = centerY + sm.offsetY;
      sm.targetX = sm.x;
      sm.targetY = sm.y;
      sm.state = 'idle';
      sm.animFrame = Math.floor(Math.random() * 10);
    });

    explosionCount = 0;
    totalPowerMt = 0;
    cityDestructPercent = 0;
    isGameCleared = false;
    gameStartTime = Date.now();

    statCountEl.textContent = '0';
    statPowerEl.textContent = '0 메가톤';
    statCpsEl.textContent = '0 회/초';
    cityProgressBar.style.width = '0%';
    cityPercentText.textContent = '🔥 파괴율: 0%';

    clearModal.classList.add('hidden');
  }

  // 1. 최하단 레이어: 무너진 건물 폐허 이미지 렌더링 (135% 확대 적용)
  function renderRuinsBackground() {
    const w = ruinsCanvas.width;
    const h = ruinsCanvas.height;

    ruinsCtx.clearRect(0, 0, w, h);

    if (ruinsLoaded) {
      const imgRatio = ruinsImg.width / ruinsImg.height;
      const canvasRatio = w / h;
      let drawW, drawH, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
      } else {
        drawH = h;
        drawW = h * imgRatio;
      }

      const zoomScale = 1.35;
      drawW *= zoomScale;
      drawH *= zoomScale;
      offsetX = (w - drawW) / 2;
      offsetY = (h - drawH) / 2;

      ruinsCtx.drawImage(ruinsImg, offsetX, offsetY, drawW, drawH);
    } else {
      const grad = ruinsCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1c0a0a');
      grad.addColorStop(0.5, '#2e1005');
      grad.addColorStop(1, '#0f0502');
      ruinsCtx.fillStyle = grad;
      ruinsCtx.fillRect(0, 0, w, h);
    }
  }

  // 2. 상단 레이어: 온전한 평양 시가지 렌더링 (135% 확대 적용)
  function renderBackground() {
    const w = bgCanvas.width;
    const h = bgCanvas.height;

    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.clearRect(0, 0, w, h);

    if (bgLoaded) {
      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = w / h;
      let drawW, drawH, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
      } else {
        drawH = h;
        drawW = h * imgRatio;
      }

      const zoomScale = 1.35;
      drawW *= zoomScale;
      drawH *= zoomScale;
      offsetX = (w - drawW) / 2;
      offsetY = (h - drawH) / 2;

      bgCtx.drawImage(bgImg, offsetX, offsetY, drawW, drawH);
    } else {
      const grad = bgCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#064e3b');
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, 0, w, h);
    }
  }

  // 평양 도시 파괴
  function destroyCityArea(x, y, radius) {
    if (isGameCleared) return;

    bgCtx.save();
    bgCtx.globalCompositeOperation = 'destination-out';

    const grad = bgCtx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.85, 'rgba(0,0,0,0.9)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    bgCtx.fillStyle = grad;
    bgCtx.beginPath();
    bgCtx.arc(x, y, radius, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.restore();

    checkCityDestruction();
  }

  // 궤도 레이저 파괴
  function destroyCityBeam(x, y, beamWidth, radius) {
    if (isGameCleared) return;

    bgCtx.save();
    bgCtx.globalCompositeOperation = 'destination-out';

    bgCtx.fillStyle = 'rgba(0,0,0,0.9)';
    bgCtx.fillRect(x - beamWidth / 2, 0, beamWidth, y);

    const grad = bgCtx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    bgCtx.fillStyle = grad;
    bgCtx.beginPath();
    bgCtx.arc(x, y, radius, 0, Math.PI * 2);
    bgCtx.fill();

    bgCtx.restore();

    checkCityDestruction();
  }

  // 샘플링으로 평양 도시 파괴율 측정 (%)
  function checkCityDestruction() {
    if (isGameCleared) return;

    const w = bgCanvas.width;
    const h = bgCanvas.height;
    const sampleCols = 15;
    const sampleRows = 15;
    const stepX = Math.floor(w / sampleCols);
    const stepY = Math.floor(h / sampleRows);

    let destroyedPoints = 0;
    const totalPoints = sampleCols * sampleRows;

    for (let r = 0; r < sampleRows; r++) {
      for (let c = 0; c < sampleCols; c++) {
        const px = Math.min(w - 1, c * stepX + Math.floor(stepX / 2));
        const py = Math.min(h - 1, r * stepY + Math.floor(stepY / 2));
        const pixelData = bgCtx.getImageData(px, py, 1, 1).data;

        if (pixelData[3] < 50) {
          destroyedPoints++;
        }
      }
    }

    cityDestructPercent = Math.min(100, Math.floor((destroyedPoints / totalPoints) * 100));
    cityProgressBar.style.width = `${cityDestructPercent}%`;
    cityPercentText.textContent = `🔥 파괴율: ${cityDestructPercent}%`;

    if (cityDestructPercent >= 100 && !isGameCleared) {
      triggerGameClear();
    }
  }

  // 🎉 게임 클리어 트리거
  function triggerGameClear() {
    isGameCleared = true;
    playExplosionSound('clear');

    const clearTimeSec = Math.max(1, Math.floor((Date.now() - gameStartTime) / 1000));

    modalBombs.textContent = `${explosionCount.toLocaleString()} 회`;
    modalPower.textContent = `${totalPowerMt.toFixed(1)} 메가톤`;
    modalTime.textContent = `${clearTimeSec} 초`;

    clearModal.classList.remove('hidden');

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: fxCanvas.width / 2,
        y: fxCanvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        radius: 5 + Math.random() * 10,
        color: ['#fbbf24', '#ef4444', '#34d399', '#60a5fa', '#f43f5e'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 1,
        decay: 0.01 + Math.random() * 0.02
      });
    }
  }

  // 폭파 및 졸라맨 10전사 타격 실행
  function triggerDetonation(x, y) {
    if (isGameCleared) return;

    const now = Date.now();
    clickTimestamps.push(now);

    clickTimestamps = clickTimestamps.filter(t => now - t <= 1000);
    currentCps = clickTimestamps.length;
    statCpsEl.textContent = `${currentCps} 회/초`;

    explosionCount++;
    statCountEl.textContent = explosionCount.toLocaleString();

    // 🥋 졸라맨 10전사 전원을 클릭 위치 부근 대형 군단 진형으로 초광속 대시시킴!
    heroStickmen.forEach((sm, index) => {
      sm.targetX = x + sm.offsetX;
      sm.targetY = y + sm.offsetY;
      sm.facing = (x >= sm.x) ? 1 : -1;
      sm.state = 'attacking';
      sm.attackType = (index + Math.floor(Math.random() * 3)) % 3;
      sm.animFrame = 0;
    });

    let powerIncrement = 0.5;
    if (currentWeapon === 'nuke') powerIncrement = 15;
    else if (currentWeapon === 'cluster') powerIncrement = 3;
    else if (currentWeapon === 'orbital') powerIncrement = 8;
    else if (currentWeapon === 'stickman') powerIncrement = 12;

    totalPowerMt += powerIncrement;
    statPowerEl.textContent = `${totalPowerMt.toFixed(1)} 메가톤`;

    playExplosionSound(currentWeapon);

    if (currentWeapon === 'tnt') {
      spawnTntExplosion(x, y);
    } else if (currentWeapon === 'nuke') {
      spawnNukeExplosion(x, y);
    } else if (currentWeapon === 'cluster') {
      spawnClusterExplosion(x, y);
    } else if (currentWeapon === 'orbital') {
      spawnOrbitalExplosion(x, y);
    } else if (currentWeapon === 'stickman') {
      spawnStickmanAttack(x, y);
    }
  }

  // 💣 TNT 폭발
  function spawnTntExplosion(x, y) {
    if (shakeEnabled) shakeIntensity = Math.min(shakeIntensity + 15, 40);

    destroyCityArea(x, y, 75);
    addCrater(x, y, 40, 70);
    addShockwave(x, y, 120, '#ff4500');

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 10,
        color: ['#ffeb3b', '#ff9800', '#ff5722', '#f44336', '#424242'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.03
      });
    }

    addFloatingText(x, y, `💥 0.000...001초 초광속 폭발!`, '#fbbf24');
  }

  // 🚀 핵폭발
  function spawnNukeExplosion(x, y) {
    if (shakeEnabled) shakeIntensity = 70;

    destroyCityArea(x, y, 220);
    addCrater(x, y, 120, 180);
    addShockwave(x, y, 400, '#ffffff');

    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 18;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 4),
        radius: 8 + Math.random() * 20,
        color: ['#ffffff', '#fef08a', '#f97316', '#dc2626', '#18181b'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 1,
        decay: 0.01 + Math.random() * 0.015
      });
    }

    addFloatingText(x, y - 50, `☢️ 0.000...001초 베이징 전술 핵폭발!`, '#ef4444');
  }

  // 🎆 융단폭격
  function spawnClusterExplosion(x, y) {
    if (shakeEnabled) shakeIntensity = Math.min(shakeIntensity + 20, 50);

    for (let c = 0; c < 6; c++) {
      const offsetX = (Math.random() - 0.5) * 160;
      const offsetY = (Math.random() - 0.5) * 160;
      const cx = x + offsetX;
      const cy = y + offsetY;

      setTimeout(() => {
        destroyCityArea(cx, cy, 55);
        addCrater(cx, cy, 25, 45);
        addShockwave(cx, cy, 70, '#f59e0b');

        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 6;
          particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 3 + Math.random() * 7,
            color: ['#fbbf24', '#f97316', '#ef4444'][Math.floor(Math.random() * 3)],
            alpha: 1,
            life: 1,
            decay: 0.03 + Math.random() * 0.04
          });
        }
      }, c * 30);
    }

    addFloatingText(x, y, `🎆 0.000...001초 연쇄 융단 폭격!`, '#f59e0b');
  }

  // ⚡ 궤도 레이저 폭격
  function spawnOrbitalExplosion(x, y) {
    if (shakeEnabled) shakeIntensity = Math.min(shakeIntensity + 30, 60);

    laserBeams.push({
      x: x,
      y: y,
      width: 40,
      alpha: 1,
      decay: 0.05
    });

    destroyCityBeam(x, y, 40, 110);
    addCrater(x, y, 60, 100);
    addShockwave(x, y, 200, '#38bdf8');

    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 12,
        color: ['#38bdf8', '#818cf8', '#e0e7ff', '#67e8f9'][Math.floor(Math.random() * 4)],
        alpha: 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.03
      });
    }

    addFloatingText(x, y, `⚡ 0.000...001초 궤도 레이저 폭격!`, '#38bdf8');
  }

  // 🥊 졸라맨 12전사 대군단 동시 광란 파괴 타격
  function spawnStickmanAttack(x, y) {
    if (shakeEnabled) shakeIntensity = Math.min(shakeIntensity + 40, 60);

    destroyCityArea(x, y, 160);
    addCrater(x, y, 80, 125);
    addShockwave(x, y, 230, '#fbbf24');

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 16;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 10,
        color: ['#ef4444', '#38bdf8', '#fbbf24', '#34d399', '#c084fc', '#f97316', '#fef08a', '#f472b6', '#2dd4bf', '#fb923c', '#e2e8f0', '#818cf8'][Math.floor(Math.random() * 12)],
        alpha: 1,
        life: 1,
        decay: 0.03 + Math.random() * 0.03
      });
    }

    const actionTexts = ['🥊 얍! 졸라맨 12전사 십이연타 대폭격!', '🦵 졸라맨 12인 멸살 군단 전원 돌격!', '⚡ 졸라맨 12전사 평양 대소멸 총공격!'];
    const chosenText = actionTexts[Math.floor(Math.random() * actionTexts.length)];
    addFloatingText(x, y - 50, chosenText, '#fbbf24');
  }

  // 🥋 화면 상주 졸라맨 12전사 개별 렌더링
  function renderSingleHeroStickman(sm) {
    sm.x += (sm.targetX - sm.x) * 0.35;
    sm.y += (sm.targetY - sm.y) * 0.35;

    const dist = Math.hypot(sm.targetX - sm.x, sm.targetY - sm.y);
    if (dist < 5 && sm.state === 'dashing') {
      sm.state = 'idle';
    }

    fxCtx.save();
    fxCtx.translate(sm.x, sm.y);
    fxCtx.scale(sm.scale * sm.facing, sm.scale);

    sm.animFrame++;
    const t = sm.animFrame;

    // 개별 색상 후광
    fxCtx.shadowColor = sm.headbandColor;
    fxCtx.shadowBlur = 18;

    // 머리 끈 (멤버별 두건 색상)
    fxCtx.strokeStyle = sm.headbandColor;
    fxCtx.lineWidth = 3;
    fxCtx.beginPath();
    fxCtx.moveTo(-10, -40);
    fxCtx.quadraticCurveTo(-25, -45 + Math.sin(t * 0.3) * 5, -35, -40 + Math.cos(t * 0.3) * 5);
    fxCtx.stroke();

    // 머리
    fxCtx.strokeStyle = '#ffffff';
    fxCtx.lineWidth = 4;
    fxCtx.beginPath();
    fxCtx.arc(0, -40, 11, 0, Math.PI * 2);
    fxCtx.stroke();

    // 선글라스/눈
    fxCtx.fillStyle = sm.headbandColor;
    fxCtx.fillRect(2, -43, 6, 4);

    if (sm.state === 'attacking') {
      // 🥊 타격 공격 포즈
      fxCtx.beginPath();
      fxCtx.moveTo(0, -30);
      fxCtx.lineTo(5, -5);
      fxCtx.stroke();

      // 다리
      fxCtx.beginPath();
      fxCtx.moveTo(5, -5);
      fxCtx.lineTo(-15, 20);
      fxCtx.moveTo(5, -5);
      fxCtx.lineTo(20, 20);
      fxCtx.stroke();

      if (sm.attackType === 0) {
        // 연속 펀치
        const punchX = 25 + Math.sin(t * 0.8) * 15;
        fxCtx.strokeStyle = sm.headbandColor;
        fxCtx.lineWidth = 6;
        fxCtx.beginPath();
        fxCtx.moveTo(0, -22);
        fxCtx.lineTo(punchX, -22);
        fxCtx.stroke();

        fxCtx.fillStyle = sm.headbandColor;
        fxCtx.beginPath();
        fxCtx.arc(punchX, -22, 10, 0, Math.PI * 2);
        fxCtx.fill();

        fxCtx.strokeStyle = '#ffffff';
        fxCtx.lineWidth = 3;
        fxCtx.beginPath();
        fxCtx.arc(punchX + 5, -22, 12 + (t % 5) * 4, -Math.PI / 3, Math.PI / 3);
        fxCtx.stroke();

      } else if (sm.attackType === 1) {
        // 공중 돌려차기 킥
        fxCtx.strokeStyle = sm.headbandColor;
        fxCtx.lineWidth = 6;
        fxCtx.beginPath();
        fxCtx.moveTo(5, -5);
        fxCtx.lineTo(35, -28);
        fxCtx.stroke();

        fxCtx.strokeStyle = '#ffffff';
        fxCtx.beginPath();
        fxCtx.arc(5, -5, 38, -Math.PI / 4, Math.PI / 4);
        fxCtx.stroke();
      } else {
        // 검기 멸살참
        fxCtx.strokeStyle = sm.headbandColor;
        fxCtx.lineWidth = 7;
        fxCtx.beginPath();
        fxCtx.moveTo(-20, -55);
        fxCtx.lineTo(35, 10);
        fxCtx.stroke();
      }

      if (sm.animFrame > 16) {
        sm.state = 'idle';
      }

    } else {
      // 🧘 대기 모션
      const breath = Math.sin((t + sm.id * 3) * 0.1) * 2;

      fxCtx.beginPath();
      fxCtx.moveTo(0, -29 + breath);
      fxCtx.lineTo(0, -5);
      fxCtx.stroke();

      fxCtx.beginPath();
      fxCtx.moveTo(0, -5);
      fxCtx.lineTo(-12, 22);
      fxCtx.moveTo(0, -5);
      fxCtx.lineTo(12, 22);
      fxCtx.stroke();

      fxCtx.beginPath();
      fxCtx.moveTo(0, -22 + breath);
      fxCtx.lineTo(12, -18 + breath);
      fxCtx.lineTo(18, -30 + breath);
      fxCtx.moveTo(0, -22 + breath);
      fxCtx.lineTo(-8, -12 + breath);
      fxCtx.stroke();
    }

    fxCtx.restore();
  }

  // 폭발 자국 추가 (0.5초 소멸)
  function addCrater(x, y, innerRadius, outerRadius) {
    craters.push({
      x: x,
      y: y,
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      createdAt: Date.now(),
      duration: 500
    });
  }

  // 폭발 자국 그리기
  function drawSingleCrater(x, y, innerRadius, outerRadius, alpha) {
    craterCtx.save();
    craterCtx.globalAlpha = alpha;

    const grad = craterCtx.createRadialGradient(x, y, innerRadius * 0.2, x, y, outerRadius);
    grad.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
    grad.addColorStop(0.5, 'rgba(40, 20, 10, 0.7)');
    grad.addColorStop(0.8, 'rgba(120, 40, 10, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    craterCtx.fillStyle = grad;
    craterCtx.beginPath();
    craterCtx.arc(x, y, outerRadius, 0, Math.PI * 2);
    craterCtx.fill();

    craterCtx.strokeStyle = 'rgba(20, 20, 20, 0.8)';
    craterCtx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + 0.3;
      const len = outerRadius * 0.8;
      craterCtx.beginPath();
      craterCtx.moveTo(x, y);
      craterCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      craterCtx.stroke();
    }

    craterCtx.restore();
  }

  function addShockwave(x, y, maxRadius, color) {
    shockwaves.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: maxRadius,
      color: color,
      alpha: 1,
      lineWidth: 8
    });
  }

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1,
      vy: -2,
      life: 1,
      decay: 0.015
    });
  }

  // 메인 애니메이션 루프
  function animate() {
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    craterCtx.clearRect(0, 0, craterCanvas.width, craterCanvas.height);

    const now = Date.now();
    for (let i = craters.length - 1; i >= 0; i--) {
      const c = craters[i];
      const elapsed = now - c.createdAt;
      if (elapsed >= c.duration) {
        craters.splice(i, 1);
      } else {
        const alpha = 1 - (elapsed / c.duration);
        drawSingleCrater(c.x, c.y, c.innerRadius, c.outerRadius, alpha);
      }
    }

    if (shakeIntensity > 0) {
      shakeOffsetX = (Math.random() - 0.5) * shakeIntensity;
      shakeOffsetY = (Math.random() - 0.5) * shakeIntensity;
      shakeIntensity *= 0.9;
      if (shakeIntensity < 0.5) shakeIntensity = 0;

      document.getElementById('game-wrapper').style.transform = `translate(${shakeOffsetX}px, ${shakeOffsetY}px)`;
    } else {
      document.getElementById('game-wrapper').style.transform = 'none';
    }

    // 🥋 화면 상주 졸라맨 10전사 대군단 전원 렌더링!
    heroStickmen.forEach(sm => {
      renderSingleHeroStickman(sm);
    });

    for (let i = laserBeams.length - 1; i >= 0; i--) {
      const beam = laserBeams[i];
      fxCtx.save();
      fxCtx.strokeStyle = `rgba(56, 189, 248, ${beam.alpha})`;
      fxCtx.shadowColor = '#38bdf8';
      fxCtx.shadowBlur = 25;
      fxCtx.lineWidth = beam.width;
      fxCtx.beginPath();
      fxCtx.moveTo(beam.x, 0);
      fxCtx.lineTo(beam.x, beam.y);
      fxCtx.stroke();
      fxCtx.restore();

      beam.alpha -= beam.decay;
      beam.width *= 0.9;
      if (beam.alpha <= 0) laserBeams.splice(i, 1);
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      fxCtx.save();
      fxCtx.beginPath();
      fxCtx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      fxCtx.strokeStyle = sw.color;
      fxCtx.globalAlpha = sw.alpha;
      fxCtx.lineWidth = sw.lineWidth;
      fxCtx.shadowColor = sw.color;
      fxCtx.shadowBlur = 15;
      fxCtx.stroke();
      fxCtx.restore();

      sw.radius += (sw.maxRadius - sw.radius) * 0.15 + 4;
      sw.alpha -= 0.04;
      sw.lineWidth = Math.max(1, sw.lineWidth * 0.92);

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        shockwaves.splice(i, 1);
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.alpha -= p.decay;

      fxCtx.save();
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, Math.max(0.5, p.radius * p.alpha), 0, Math.PI * 2);
      fxCtx.fillStyle = p.color;
      fxCtx.globalAlpha = Math.max(0, p.alpha);
      fxCtx.fill();
      fxCtx.restore();

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;

      fxCtx.save();
      fxCtx.font = '900 1rem "Noto Sans KR", sans-serif';
      fxCtx.fillStyle = ft.color;
      fxCtx.globalAlpha = Math.max(0, ft.alpha);
      fxCtx.shadowColor = '#000';
      fxCtx.shadowBlur = 8;
      fxCtx.textAlign = 'center';
      fxCtx.fillText(ft.text, ft.x, ft.y);
      fxCtx.restore();

      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  // 입력 이벤트
  fxCanvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    triggerDetonation(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  fxCanvas.addEventListener('mousemove', (e) => {
    if (isMouseDown && autoTurbo) {
      triggerDetonation(e.clientX, e.clientY);
    }
  });

  // 터치 이벤트
  fxCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initAudio();
    isMouseDown = true;
    for (let i = 0; i < e.touches.length; i++) {
      triggerDetonation(e.touches[i].clientX, e.touches[i].clientY);
    }
  }, { passive: false });

  fxCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isMouseDown && autoTurbo) {
      for (let i = 0; i < e.touches.length; i++) {
        triggerDetonation(e.touches[i].clientX, e.touches[i].clientY);
      }
    }
  }, { passive: false });

  fxCanvas.addEventListener('touchend', () => {
    isMouseDown = false;
  });

  // 무기 선택 버튼
  weaponBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      weaponBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWeapon = btn.getAttribute('data-weapon');
    });
  });

  // 설정 버튼
  btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    btnSound.classList.toggle('active', soundEnabled);
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    btnSound.innerHTML = `<span id="sound-icon">${soundIcon.textContent}</span> 효과음 ${soundEnabled ? '켜짐' : '꺼짐'}`;
  });

  btnShake.addEventListener('click', () => {
    shakeEnabled = !shakeEnabled;
    btnShake.classList.toggle('active', shakeEnabled);
    btnShake.textContent = `📳 화면 흔들림 ${shakeEnabled ? '켜짐' : '꺼짐'}`;
  });

  btnAuto.addEventListener('click', () => {
    autoTurbo = !autoTurbo;
    btnAuto.classList.toggle('active', autoTurbo);
    btnAuto.textContent = `⚡ 드래그 연사 ${autoTurbo ? '켜짐' : '꺼짐'}`;
  });

  // 베이징 도시 복구 (리셋)
  btnReset.addEventListener('click', () => {
    resetGame();
    addFloatingText(fxCanvas.width / 2, fxCanvas.height / 2, '🏗️ 베이징 도시 완전 복구 완료!', '#34d399');
  });

  modalRestartBtn.addEventListener('click', () => {
    resetGame();
  });

  // 초기화
  resizeCanvas();
  animate();
});
