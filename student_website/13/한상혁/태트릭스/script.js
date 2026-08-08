/**
 * 초호화 네온 테트리스 마스터 (Super Neon Tetris Korea)
 * SRS 회전 & 홀드 & 넥스트 큐 & 고스트 피스 & 7-Bag & Web Audio 코로베이니키 BGM
 * 100% 한국어 지원
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('tetris-canvas');
  const ctx = canvas.getContext('2d');
  const holdCanvas = document.getElementById('hold-canvas');
  const holdCtx = holdCanvas.getContext('2d');
  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');

  // HUD 엘리먼트
  const hudLevel = document.getElementById('hud-level');
  const hudLines = document.getElementById('hud-lines');
  const hudScore = document.getElementById('hud-score');
  const hudModeName = document.getElementById('hud-mode-name');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const btnRestartTop = document.getElementById('btn-restart-top');

  const clearPopup = document.getElementById('clear-popup');
  const popTitle = document.getElementById('pop-title');
  const popSub = document.getElementById('pop-sub');

  // 모달 엘리먼트
  const startModal = document.getElementById('start-modal');
  const modeCards = document.querySelectorAll('.mode-card');
  const btnStartGame = document.getElementById('btn-start-game');

  const gameoverModal = document.getElementById('gameover-modal');
  const resHeading = document.getElementById('res-heading');
  const resSubtext = document.getElementById('res-subtext');
  const resScore = document.getElementById('res-score');
  const resLines = document.getElementById('res-lines');
  const resLevel = document.getElementById('res-level');
  const resCombo = document.getElementById('res-combo');
  const btnRetry = document.getElementById('btn-retry');
  const btnModeSelect = document.getElementById('btn-mode-select');

  // 터치 버튼
  const tbHold = document.getElementById('tb-hold');
  const tbHard = document.getElementById('tb-hard');
  const tbRot = document.getElementById('tb-rot');
  const tbLeft = document.getElementById('tb-left');
  const tbDown = document.getElementById('tb-down');
  const tbRight = document.getElementById('tb-right');

  // 테트리스 보드 상수 (10 x 20)
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30;

  // 7종 표준 테트로미노 & 네온 색상 정의
  const SHAPES = {
    I: { matrix: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#06b6d4', glow: '#22d3ee' },
    O: { matrix: [[1,1], [1,1]], color: '#eab308', glow: '#facc15' },
    T: { matrix: [[0,1,0], [1,1,1], [0,0,0]], color: '#a855f7', glow: '#c084fc' },
    S: { matrix: [[0,1,1], [1,1,0], [0,0,0]], color: '#22c55e', glow: '#4ade80' },
    Z: { matrix: [[1,1,0], [0,1,1], [0,0,0]], color: '#ef4444', glow: '#f87171' },
    J: { matrix: [[1,0,0], [1,1,1], [0,0,0]], color: '#3b82f6', glow: '#60a5fa' },
    L: { matrix: [[0,0,1], [1,1,1], [0,0,0]], color: '#f97316', glow: '#fb923c' }
  };

  const SHAPE_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  // 게임 상태 변수
  let grid = [];
  let currentPiece = null;
  let nextQueue = [];
  let holdPiece = null;
  let canHold = true;
  let bag = [];

  let gameMode = 'marathon'; // 'marathon', 'sprint', 'practice'
  let isPlaying = false;
  let isGameOver = false;

  let score = 0;
  let linesCleared = 0;
  let level = 1;
  let combo = 0;
  let maxCombo = 0;

  let dropCounter = 0;
  let dropInterval = 1000; // ms
  let lastTime = 0;

  // 파티클 & 레이저 이펙트
  const particles = [];
  const lineClearingEffects = [];

  // Web Audio 사운드 & 코로베이니키 BGM 시퀀서
  let audioCtx = null;
  let isAudioEnabled = true;
  let bgmTimer = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!isAudioEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'move') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'rotate') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.06);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'harddrop') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'clear') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const ct = audioCtx.currentTime;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ct);
          gain.gain.setValueAtTime(0.2, ct);
          gain.gain.exponentialRampToValueAtTime(0.01, ct + 0.18);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(ct);
          osc.stop(ct + 0.18);
        }, idx * 60);
      });
    } else if (type === 'tetris') {
      [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, idx) => {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const ct = audioCtx.currentTime;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ct);
          gain.gain.setValueAtTime(0.3, ct);
          gain.gain.exponentialRampToValueAtTime(0.01, ct + 0.22);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(ct);
          osc.stop(ct + 0.22);
        }, idx * 65);
      });
    } else if (type === 'hold') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  // 🎵 오리지널 테트리스 코로베이니키 (Korobeiniki) EDM 프로시저럴 신스 BGM
  let bgmStep = 0;
  function startKorobeinikiBGM() {
    stopKorobeinikiBGM();
    if (!isAudioEnabled) return;
    initAudio();
    bgmStep = 0;

    // 코로베이니키 메인 멜로디 음계
    const melody = [
      659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 440.00,
      523.25, 659.25, 587.33, 523.25, 493.88, 523.25, 587.33, 659.25,
      523.25, 440.00, 440.00, 0,
      587.33, 698.46, 880.00, 783.99, 698.46, 659.25, 523.25, 659.25,
      587.33, 523.25, 493.88, 493.88, 523.25, 587.33, 659.25, 523.25,
      440.00, 440.00, 0
    ];

    const bpm = 145 + (level * 3);
    const intervalMs = (60 / bpm) * 250;

    bgmTimer = setInterval(() => {
      if (!audioCtx || !isPlaying || !isAudioEnabled) return;
      const t = audioCtx.currentTime;

      // 베이스 드럼 비트 (4/4 킥)
      if (bgmStep % 4 === 0) {
        const kick = audioCtx.createOscillator();
        const kGain = audioCtx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(130, t);
        kick.frequency.exponentialRampToValueAtTime(35, t + 0.1);
        kGain.gain.setValueAtTime(0.4, t);
        kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        kick.connect(kGain);
        kGain.connect(audioCtx.destination);
        kick.start(t);
        kick.stop(t + 0.1);
      }

      // 리드 신스 멜로디
      const note = melody[bgmStep % melody.length];
      if (note > 0) {
        const lead = audioCtx.createOscillator();
        const lGain = audioCtx.createGain();
        lead.type = 'triangle';
        lead.frequency.setValueAtTime(note, t);
        lGain.gain.setValueAtTime(0.18, t);
        lGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        lead.connect(lGain);
        lGain.connect(audioCtx.destination);
        lead.start(t);
        lead.stop(t + 0.15);
      }

      bgmStep++;
    }, intervalMs);
  }

  function stopKorobeinikiBGM() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  // 7-Bag Randomizer
  function refillBag() {
    const newBag = [...SHAPE_KEYS];
    for (let i = newBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }
    bag.push(...newBag);
  }

  function getNextShape() {
    if (bag.length < 7) {
      refillBag();
    }
    return bag.shift();
  }

  function createPiece(key) {
    const shape = SHAPES[key];
    return {
      key: key,
      matrix: JSON.parse(JSON.stringify(shape.matrix)),
      color: shape.color,
      glow: shape.glow,
      x: Math.floor((COLS - shape.matrix[0].length) / 2),
      y: key === 'I' ? -1 : 0
    };
  }

  // 보드 생성 & 초기화
  function initBoard() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  // 충돌 감지
  function checkCollision(piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && grid[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // SRS 회전 시스템
  function rotateMatrix(matrix, dir = 1) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (dir === 1) {
          result[c][N - 1 - r] = matrix[r][c]; // 시계방향
        } else {
          result[N - 1 - c][r] = matrix[r][c]; // 반시계방향
        }
      }
    }
    return result;
  }

  function rotatePiece(dir = 1) {
    if (!currentPiece) return;
    const rotated = rotateMatrix(currentPiece.matrix, dir);

    // Wall Kick 오프셋 테스트
    const kicks = [0, 1, -1, 2, -2];
    for (let i = 0; i < kicks.length; i++) {
      const offset = kicks[i];
      if (!checkCollision(currentPiece, offset, 0, rotated)) {
        currentPiece.x += offset;
        currentPiece.matrix = rotated;
        playSound('rotate');
        return;
      }
    }
  }

  // 좌우 이동 & 소프트 드롭
  function movePiece(dir) {
    if (!currentPiece || !isPlaying) return;
    if (!checkCollision(currentPiece, dir, 0)) {
      currentPiece.x += dir;
      playSound('move');
    }
  }

  function dropPiece() {
    if (!currentPiece || !isPlaying) return;
    if (!checkCollision(currentPiece, 0, 1)) {
      currentPiece.y++;
      score += 1;
      updateStatsUI();
    } else {
      lockPiece();
    }
    dropCounter = 0;
  }

  // 하드 드롭 (Space / ↑)
  function hardDrop() {
    if (!currentPiece || !isPlaying) return;
    let dropDist = 0;
    while (!checkCollision(currentPiece, 0, 1)) {
      currentPiece.y++;
      dropDist++;
    }
    score += dropDist * 2;
    playSound('harddrop');

    // 하드 드롭 스파크 파티클
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          spawnSparks(
            (currentPiece.x + c + 0.5) * BLOCK_SIZE,
            (currentPiece.y + r + 1) * BLOCK_SIZE,
            8, currentPiece.color
          );
        }
      }
    }

    lockPiece();
  }

  // 홀드 기능 (C / Shift)
  function holdCurrentPiece() {
    if (!canHold || !isPlaying || !currentPiece) return;
    playSound('hold');

    if (!holdPiece) {
      holdPiece = currentPiece.key;
      currentPiece = createPiece(nextQueue.shift());
      nextQueue.push(getNextShape());
    } else {
      const temp = holdPiece;
      holdPiece = currentPiece.key;
      currentPiece = createPiece(temp);
    }

    canHold = false;
    renderHold();
    renderNext();
  }

  // 고스트 피스(그림자) Y좌표 계산
  function getGhostY() {
    if (!currentPiece) return 0;
    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece, 0, ghostY - currentPiece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  // 블록 고정 & 라인 클리어 판정
  function lockPiece() {
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          const by = currentPiece.y + r;
          const bx = currentPiece.x + c;

          if (by < 0) {
            triggerGameOver();
            return;
          }
          grid[by][bx] = { color: currentPiece.color, glow: currentPiece.glow };
        }
      }
    }

    checkLines();

    canHold = true;
    currentPiece = createPiece(nextQueue.shift());
    nextQueue.push(getNextShape());
    renderNext();

    if (checkCollision(currentPiece)) {
      triggerGameOver();
    }
  }

  // 라인 소거 & 점수 계산
  function checkLines() {
    let cleared = 0;

    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every(cell => cell !== 0)) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(0));
        cleared++;
        r++; // 같은 줄 재검사
      }
    }

    if (cleared > 0) {
      linesCleared += cleared;
      combo++;
      if (combo > maxCombo) maxCombo = combo;

      const baseScores = [0, 100, 300, 500, 1200];
      const clearPts = (baseScores[cleared] || 100) * level * (combo > 1 ? combo : 1);
      score += clearPts;

      if (cleared === 4) {
        playSound('tetris');
        showPopup('🔥 TETRIS!', `4줄 완벽 소거! +${clearPts.toLocaleString()}점!`);
      } else if (cleared === 3) {
        playSound('clear');
        showPopup('✨ TRIPLE!', `3줄 소거! +${clearPts.toLocaleString()}점!`);
      } else {
        playSound('clear');
        if (combo > 1) {
          showPopup(`💥 ${combo} COMBO!`, `+${clearPts.toLocaleString()}점!`);
        }
      }

      // 레벨업 (10줄마다)
      if (gameMode === 'marathon') {
        level = Math.floor(linesCleared / 10) + 1;
        dropInterval = Math.max(80, 1000 - (level - 1) * 85);
      } else if (gameMode === 'sprint') {
        if (linesCleared >= 40) {
          triggerVictory();
          return;
        }
      }

      updateStatsUI();
    } else {
      combo = 0;
    }
  }

  function showPopup(title, sub) {
    popTitle.textContent = title;
    popSub.textContent = sub;
    clearPopup.classList.remove('hidden');
    clearPopup.style.animation = 'none';
    clearPopup.offsetHeight; // reflow
    clearPopup.style.animation = 'popFloat 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    setTimeout(() => clearPopup.classList.add('hidden'), 600);
  }

  function spawnSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 4,
        color: color,
        alpha: 1,
        decay: 0.04
      });
    }
  }

  // 렌더링 함수들
  function renderBlock(context, x, y, color, glow, size = BLOCK_SIZE, isGhost = false) {
    context.save();
    if (isGhost) {
      context.strokeStyle = glow;
      context.lineWidth = 1.5;
      context.strokeRect(x * size + 2, y * size + 2, size - 4, size - 4);
    } else {
      // 3D 네온 블록 큐브 렌더링
      context.fillStyle = color;
      context.shadowColor = glow;
      context.shadowBlur = 12;
      context.fillRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3);

      // 상단 하이라이트
      context.fillStyle = 'rgba(255, 255, 255, 0.45)';
      context.fillRect(x * size + 3, y * size + 3, size - 6, 3);
      context.fillRect(x * size + 3, y * size + 3, 3, size - 6);

      // 우하단 그림자
      context.fillStyle = 'rgba(0, 0, 0, 0.35)';
      context.fillRect(x * size + size - 5, y * size + 3, 2, size - 6);
      context.fillRect(x * size + 3, y * size + size - 5, size - 6, 2);
    }
    context.restore();
  }

  function renderHold() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (!holdPiece) return;

    const shape = SHAPES[holdPiece];
    const m = shape.matrix;
    const size = 22;
    const offX = (holdCanvas.width - m[0].length * size) / 2;
    const offY = (holdCanvas.height - m.length * size) / 2;

    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c] !== 0) {
          renderBlock(holdCtx, (offX / size) + c, (offY / size) + r, shape.color, shape.glow, size);
        }
      }
    }
  }

  function renderNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const size = 20;

    nextQueue.slice(0, 3).forEach((key, idx) => {
      const shape = SHAPES[key];
      const m = shape.matrix;
      const offX = (nextCanvas.width - m[0].length * size) / 2;
      const offY = 20 + idx * 105;

      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c] !== 0) {
            renderBlock(nextCtx, (offX / size) + c, (offY / size) + r, shape.color, shape.glow, size);
          }
        }
      }
    });
  }

  function updateStatsUI() {
    hudLevel.textContent = level;
    hudLines.textContent = linesCleared;
    hudScore.textContent = score.toLocaleString();
  }

  // 게임 시작
  function startTetris(mode = 'marathon') {
    initAudio();
    gameMode = mode;
    isPlaying = true;
    isGameOver = false;

    initBoard();
    bag.length = 0;
    refillBag();

    score = 0;
    linesCleared = 0;
    level = 1;
    combo = 0;
    maxCombo = 0;
    holdPiece = null;
    canHold = true;

    if (mode === 'marathon') {
      dropInterval = 1000;
      hudModeName.textContent = '🏆 마라톤 모드';
    } else if (mode === 'sprint') {
      dropInterval = 850;
      hudModeName.textContent = '⚡ 40줄 스프린트';
    } else {
      dropInterval = 1600; // 0.5x 슬로우 연습 모드
      hudModeName.textContent = '🧘 슬로우 연습 모드 (0.5x)';
    }

    nextQueue = [getNextShape(), getNextShape(), getNextShape()];
    currentPiece = createPiece(getNextShape());

    startModal.classList.add('hidden');
    gameoverModal.classList.add('hidden');

    renderHold();
    renderNext();
    updateStatsUI();
    startKorobeinikiBGM();
  }

  function triggerGameOver() {
    isPlaying = false;
    isGameOver = true;
    stopKorobeinikiBGM();

    resHeading.textContent = 'GAME OVER';
    resSubtext.textContent = '아쉽게도 블록이 천장에 도달했습니다. 다시 도전해보세요!';
    resScore.textContent = `${score.toLocaleString()} 점`;
    resLines.textContent = `${linesCleared} 줄`;
    resLevel.textContent = `LEVEL ${level}`;
    resCombo.textContent = `${maxCombo} COMBO`;

    gameoverModal.classList.remove('hidden');
  }

  function triggerVictory() {
    isPlaying = false;
    stopKorobeinikiBGM();

    resHeading.textContent = '🏆 40 LINES SPRINT CLEAR!';
    resSubtext.textContent = '축하합니다! 40줄 스프린트 타임어택을 완벽하게 완주했습니다!';
    resScore.textContent = `${score.toLocaleString()} 점`;
    resLines.textContent = `${linesCleared} 줄`;
    resLevel.textContent = `LEVEL ${level}`;
    resCombo.textContent = `${maxCombo} COMBO`;

    gameoverModal.classList.remove('hidden');
  }

  // 키보드 이벤트 리스너
  window.addEventListener('keydown', (e) => {
    initAudio();
    if (!isPlaying) {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (!startModal.classList.contains('hidden')) startTetris(gameMode);
        else if (!gameoverModal.classList.contains('hidden')) startTetris(gameMode);
      }
      return;
    }

    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      movePiece(-1);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      movePiece(1);
    } else if (e.code === 'ArrowUp' || e.code === 'KeyX') {
      e.preventDefault();
      rotatePiece(1);
    } else if (e.code === 'KeyZ') {
      e.preventDefault();
      rotatePiece(-1);
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      dropPiece();
    } else if (e.code === 'Space') {
      e.preventDefault();
      hardDrop();
    } else if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
      holdCurrentPiece();
    } else if (e.code === 'KeyR') {
      startTetris(gameMode);
    }
  });

  // 터치 버튼 이벤트 바인딩
  if (tbLeft) {
    tbLeft.addEventListener('touchstart', (e) => { e.preventDefault(); movePiece(-1); }, { passive: false });
    tbRight.addEventListener('touchstart', (e) => { e.preventDefault(); movePiece(1); }, { passive: false });
    tbDown.addEventListener('touchstart', (e) => { e.preventDefault(); dropPiece(); }, { passive: false });
    tbRot.addEventListener('touchstart', (e) => { e.preventDefault(); rotatePiece(1); }, { passive: false });
    tbHard.addEventListener('touchstart', (e) => { e.preventDefault(); hardDrop(); }, { passive: false });
    tbHold.addEventListener('touchstart', (e) => { e.preventDefault(); holdCurrentPiece(); }, { passive: false });
  }

  // 모달 버튼 핸들러
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      gameMode = card.dataset.mode;
    });
  });

  btnStartGame.addEventListener('click', () => startTetris(gameMode));
  btnRetry.addEventListener('click', () => startTetris(gameMode));
  btnModeSelect.addEventListener('click', () => {
    gameoverModal.classList.add('hidden');
    startModal.classList.remove('hidden');
  });

  btnRestartTop.addEventListener('click', () => startTetris(gameMode));
  btnAudioToggle.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    btnAudioToggle.textContent = isAudioEnabled ? '🔊 BGM ON' : '🔇 BGM OFF';
    if (!isAudioEnabled) stopKorobeinikiBGM();
    else if (isPlaying) startKorobeinikiBGM();
  });

  // 메인 애니메이션 루프 (60FPS)
  function renderLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (isPlaying) {
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) {
        dropPiece();
      }
    }

    // 1. 메인 10x20 매트릭스 배경 & 격자 렌더링
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK_SIZE, 0);
      ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
      ctx.stroke();
    }

    // 2. 고정된 블록 렌더링
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] !== 0) {
          const cell = grid[r][c];
          renderBlock(ctx, c, r, cell.color, cell.glow);
        }
      }
    }

    // 3. 고스트 피스(그림자) 렌더링
    if (isPlaying && currentPiece) {
      const ghostY = getGhostY();
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c] !== 0) {
            renderBlock(ctx, currentPiece.x + c, ghostY + r, currentPiece.color, currentPiece.glow, BLOCK_SIZE, true);
          }
        }
      }
    }

    // 4. 현재 조작 중인 테트로미노 렌더링
    if (isPlaying && currentPiece) {
      for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c] !== 0) {
            renderBlock(ctx, currentPiece.x + c, currentPiece.y + r, currentPiece.color, currentPiece.glow);
          }
        }
      }
    }

    // 5. 스파크 & 레이저 파티클 이펙트
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();

      if (p.alpha <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(renderLoop);
  }

  // 초기화 & 첫 루프 시작
  initBoard();
  renderLoop();
});
