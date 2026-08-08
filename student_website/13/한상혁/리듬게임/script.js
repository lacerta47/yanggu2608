/**
 * 지오메트리 대시 (Geometry Dash Korea)
 * HTML5 캔버스 & Web Audio API 기반 정통 리듬 플랫포머 엔진
 * 100% 한국어 지원 및 연습 모드(체크포인트) 탑재
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gd-canvas');
  const ctx = canvas.getContext('2d');

  // HUD 엘리먼트
  const hudStageBadge = document.getElementById('hud-stage-badge');
  const hudStageName = document.getElementById('hud-stage-name');
  const gdProgFill = document.getElementById('gd-prog-fill');
  const gdProgText = document.getElementById('gd-prog-text');
  const hudAttempts = document.getElementById('hud-attempts');
  const btnPracticeToggle = document.getElementById('btn-practice-toggle');
  const practiceText = document.getElementById('practice-text');
  const practiceIcon = document.getElementById('practice-icon');
  const btnSpeedToggle = document.getElementById('btn-speed-toggle');
  const practiceControls = document.getElementById('practice-controls');
  const btnAddCp = document.getElementById('btn-add-cp');
  const btnDelCp = document.getElementById('btn-del-cp');

  // 모달 엘리먼트
  const stageModal = document.getElementById('stage-modal');
  const cubePalette = document.getElementById('cube-palette');
  const spdBtns = document.querySelectorAll('.spd-btn');
  const stageCards = document.querySelectorAll('.stage-card');
  const btnStartStage = document.getElementById('btn-start-stage');

  const clearModal = document.getElementById('clear-modal');
  const resAttempts = document.getElementById('res-attempts');
  const resJumps = document.getElementById('res-jumps');
  const btnRetryStage = document.getElementById('btn-retry-stage');
  const btnSelectStage = document.getElementById('btn-select-stage');

  // 게임 설정 변수
  let currentStage = 1; // 1, 2, 3
  let gameSpeedMultiplier = 1.0; // 0.5, 1.0, 1.5, 2.0
  let isPracticeMode = false;
  let isPlaying = false;

  let attempts = parseInt(localStorage.getItem('gd_attempts') || '1', 10);
  let jumpsCount = 0;
  let progressPercent = 0;
  let groundY = 0;
  let ceilingY = 0;

  // 큐브 커스텀 색상
  const cubeColors = ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#c084fc', '#f97316'];
  let selectedCubeColor = cubeColors[0];

  // 연습 모드 체크포인트
  const checkpoints = [];

  // Web Audio 컨텍스트 & BGM
  let audioCtx = null;
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
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'jump' || type === 'jump_tier') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const tier = typeof arguments[1] === 'number' ? arguments[1] : 1;
      const baseFreq = 280 + (tier * 60);
      osc.type = tier >= 10 ? 'sawtooth' : (tier >= 5 ? 'triangle' : 'sine');
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'pad_jump') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'ring_jump') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(1046.50, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'portal') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'explode') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'clear') {
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const ct = audioCtx.currentTime;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ct);
          gain.gain.setValueAtTime(0.35, ct);
          gain.gain.exponentialRampToValueAtTime(0.01, ct + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(ct);
          osc.stop(ct + 0.3);
        }, i * 70);
      });
    }
  }

  // BGM 비트 시퀀서
  let bgmBeat = 0;
  function startBGM(stageId) {
    stopBGM();
    initAudio();
    bgmBeat = 0;

    let bpm = 140;
    if (stageId === 2) bpm = 160;
    if (stageId === 3) bpm = 190;

    const intervalMs = (60 / bpm) * 250;

    bgmTimer = setInterval(() => {
      if (!audioCtx || !isPlaying) return;
      const t = audioCtx.currentTime;

      // 1. 킥 드럼 비트
      if (bgmBeat % 4 === 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      }

      // 2. 신스웨이브 베이스 / 멜로디
      const notes = (stageId === 1) 
        ? [220, 261.63, 293.66, 329.63]
        : (stageId === 2)
        ? [293.66, 349.23, 440.00, 523.25]
        : [329.63, 392.00, 493.88, 659.25];

      const freq = notes[bgmBeat % notes.length];
      const syn = audioCtx.createOscillator();
      const sGain = audioCtx.createGain();
      syn.type = (stageId === 3) ? 'sawtooth' : 'triangle';
      syn.frequency.setValueAtTime(freq, t);
      sGain.gain.setValueAtTime(0.16, t);
      sGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      syn.connect(sGain);
      sGain.connect(audioCtx.destination);
      syn.start(t);
      syn.stop(t + 0.12);

      bgmBeat++;
    }, intervalMs);
  }

  function stopBGM() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  const floatingTexts = [];

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      alpha: 1,
      vy: -2,
      decay: 0.02
    });
  }

  // 🔺 플레이어 객체 (Cube, Ship, Wave 모드 & 중력 반전 & 12단 점프 지원)
  const player = {
    x: 140,
    y: 0,
    vx: 0,
    vy: 0,
    size: 42,
    mode: 'cube', // 'cube', 'ship', 'wave'
    gravityDir: 1, // 1 (바닥), -1 (천장 중력 반전)
    isGrounded: false,
    jumpCount: 0,
    maxJumps: 20,
    rotation: 0,
    targetRotation: 0,
    isDead: false,
    trail: [],

    reset(targetX = 140, targetY = null, mode = 'cube', gravityDir = 1) {
      this.x = targetX;
      this.mode = mode;
      this.gravityDir = gravityDir;
      this.size = 42;
      this.y = targetY !== null ? targetY : (this.gravityDir === 1 ? groundY - this.size : ceilingY);
      this.vx = 0;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpCount = 0;
      this.rotation = 0;
      this.targetRotation = 0;
      this.isDead = false;
      this.trail.length = 0;
    },

    jump() {
      if (this.mode === 'cube') {
        if (this.jumpCount < this.maxJumps) {
          this.jumpCount++;
          this.isGrounded = false;

          const jumpNames = [
            '1단 도약 점프!',
            '⚡ 2단 공중제비!',
            '🌀 3단 삼연속 회전!',
            '🌿 4단 사중 도약!',
            '🔮 5단 오연속 제비!',
            '🔥 6단 육중 플립!',
            '☀️ 7단 칠연속 나선회전!',
            '💖 8단 팔중 공중제비!',
            '🌪️ 9단 구연속 질풍제비!',
            '🌋 10단 십중 공중제비!',
            '✨ 11단 십일연속 성광제비!',
            '🌟 12단 십이중 극광제비!',
            '🚀 13단 십삼연속 유성도약!',
            '🌌 14단 십사중 은하회전!',
            '💥 15단 십오연속 플라즈마!',
            '☄️ 16단 십육중 혜성폭풍!',
            '💎 17단 십칠연속 다이아플립!',
            '⚡ 18단 십팔중 뇌신비상!',
            '🌈 19단 십구연속 무지개초월!',
            '👑 20단 궁극의 이십중 신화의 신의 도약 달성! 👑'
          ];
          const jumpColors = [
            '#ffffff', '#38bdf8', '#fbbf24', '#34d399', '#c084fc',
            '#f97316', '#fef08a', '#f472b6', '#2dd4bf', '#fb923c',
            '#e2e8f0', '#facc15', '#60a5fa', '#a855f7', '#ec4899',
            '#ef4444', '#06b6d4', '#eab308', '#8b5cf6', '#f59e0b'
          ];

          const tierIdx = this.jumpCount - 1;
          const jText = jumpNames[tierIdx] || `${this.jumpCount}단 점프!`;
          const jColor = jumpColors[tierIdx] || '#fbbf24';

          if (this.jumpCount === 1) {
            this.vy = -13.5 * this.gravityDir;
          } else if (this.jumpCount <= 6) {
            this.vy = -11.5 * this.gravityDir;
          } else if (this.jumpCount < 20) {
            this.vy = -10.0 * this.gravityDir;
          } else {
            // 👑 20단 궁극의 도약!
            this.vy = -14.0 * this.gravityDir;
            spawnParticles(this.x + this.size / 2, this.y + this.size / 2, 40, '#f59e0b');
          }

          this.targetRotation += (Math.PI / 2) * this.gravityDir;
          jumpsCount++;

          playSound('jump_tier', this.jumpCount);
          addFloatingText(this.x + 30, this.y - 25, jText, jColor);
          spawnParticles(this.x + this.size / 2, this.y + (this.gravityDir === 1 ? this.size : 0), 10 + this.jumpCount * 2, jColor);
        }
      } else if (this.mode === 'ship') {
        this.vy -= 0.75 * this.gravityDir;
      } else if (this.mode === 'wave') {
        this.vy = -7.5 * this.gravityDir;
      }
    },

    update(holding) {
      if (this.isDead) return;

      // 트레일 저장
      this.trail.push({ x: this.x + this.size / 2, y: this.y + this.size / 2, alpha: 0.8 });
      if (this.trail.length > 12) this.trail.shift();

      if (this.mode === 'cube') {
        // 큐브 물리: 중력 가속도 & 90도 회전
        const gravity = 0.88 * this.gravityDir;
        this.vy += gravity;
        this.y += this.vy;

        if (!this.isGrounded) {
          this.rotation += 0.15 * this.gravityDir;
        } else {
          // 바닥 착지 시 가장 가까운 90도(π/2)로 스냅 & 점프 카운트 리셋
          const snap = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
          this.rotation += (snap - this.rotation) * 0.4;
          this.jumpCount = 0;
        }

        // 바닥 및 천장 충돌
        if (this.gravityDir === 1) {
          if (this.y >= groundY - this.size) {
            this.y = groundY - this.size;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
          }
        } else {
          if (this.y <= ceilingY) {
            this.y = ceilingY;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
          }
        }

      } else if (this.mode === 'ship') {
        // 비행선(Ship) 물리: 홀드 시 상승, 뗐을 때 하강
        if (holding) {
          this.vy -= 0.65 * this.gravityDir;
        } else {
          this.vy += 0.55 * this.gravityDir;
        }

        this.vy = Math.max(-8, Math.min(8, this.vy));
        this.y += this.vy;
        this.rotation = (this.vy * 0.06);

        if (this.y >= groundY - this.size) {
          this.y = groundY - this.size;
          this.vy = 0;
        }
        if (this.y <= ceilingY) {
          this.y = ceilingY;
          this.vy = 0;
        }

      } else if (this.mode === 'wave') {
        // 웨이브(Wave) 물리: 홀드 시 45도 상승, 뗐을 때 45도 하강
        if (holding) {
          this.y -= 7.5 * this.gravityDir;
          this.rotation = -Math.PI / 4 * this.gravityDir;
        } else {
          this.y += 7.5 * this.gravityDir;
          this.rotation = Math.PI / 4 * this.gravityDir;
        }

        if (this.y >= groundY - this.size || this.y <= ceilingY) {
          this.die();
        }
      }
    },

    draw() {
      // 1. 트레일 그리기
      for (let i = 0; i < this.trail.length; i++) {
        const tr = this.trail[i];
        ctx.save();
        ctx.fillStyle = selectedCubeColor;
        ctx.globalAlpha = (i / this.trail.length) * 0.4;
        ctx.shadowColor = selectedCubeColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(tr.x - 12, tr.y - 12, 24, 24);
        ctx.restore();
      }

      // 2. 플레이어 본체
      ctx.save();
      ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
      ctx.rotate(this.rotation);

      ctx.shadowColor = selectedCubeColor;
      ctx.shadowBlur = 15;

      if (this.mode === 'cube') {
        // 🟩 시그니처 네온 큐브
        ctx.fillStyle = selectedCubeColor;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // 내부 사각형
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-this.size / 2 + 6, -this.size / 2 + 6, this.size - 12, this.size - 12);

        // 눈 & 입 표정
        ctx.fillStyle = selectedCubeColor;
        ctx.fillRect(-this.size / 2 + 10, -this.size / 2 + 10, 6, 6);
        ctx.fillRect(this.size / 2 - 16, -this.size / 2 + 10, 6, 6);
        ctx.fillRect(-this.size / 2 + 12, this.size / 2 - 14, this.size - 24, 4);

      } else if (this.mode === 'ship') {
        // 🚀 비행선 (Ship)
        ctx.fillStyle = selectedCubeColor;
        ctx.beginPath();
        ctx.moveTo(this.size / 2, 0);
        ctx.lineTo(-this.size / 2, -this.size / 3);
        ctx.lineTo(-this.size / 4, 0);
        ctx.lineTo(-this.size / 2, this.size / 3);
        ctx.closePath();
        ctx.fill();

        // 콕핏
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -6, 12, 12);

        // 부스터 불꽃
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-this.size / 2 - 10, -4, 8, 8);

      } else if (this.mode === 'wave') {
        // 🌊 웨이브 다트 (Wave)
        ctx.fillStyle = selectedCubeColor;
        ctx.beginPath();
        ctx.moveTo(this.size / 2, 0);
        ctx.lineTo(-this.size / 2, -this.size / 2);
        ctx.lineTo(-this.size / 4, 0);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    },

    die() {
      if (this.isDead) return;
      this.isDead = true;
      playSound('explode');
      spawnDeathExplosion(this.x + this.size / 2, this.y + this.size / 2, selectedCubeColor);

      setTimeout(() => {
        if (isPracticeMode && checkpoints.length > 0) {
          // 연습 모드: 최근 체크포인트에서 부활!
          const cp = checkpoints[checkpoints.length - 1];
          cameraX = cp.camX;
          this.reset(cp.playerX, cp.playerY, cp.mode, cp.gravityDir);
          this.isDead = false;
        } else {
          // 일반 모드: 시작점으로 리셋
          restartLevel();
        }
      }, 550);
    }
  };

  // 파티클 & 맵 오브젝트 컬렉션
  const particles = [];
  const levelObjects = []; // 가시, 블록, 패드, 링, 포털
  let cameraX = 0;
  let levelLength = 12000; // 맵 전체 길이

  // 파티클 생성기
  function spawnParticles(x, y, count, color) {
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

  function spawnDeathExplosion(x, y, color) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 12;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 4 + Math.random() * 8,
        color: ['#ffffff', color, '#ef4444', '#fbbf24'][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: 0.025
      });
    }
  }

  // 🗺️ 정통 지오메트리 대시 레벨 맵 제너레이터
  function buildLevel(stageId) {
    levelObjects.length = 0;
    const blockSize = 45;

    let curX = 600;

    // Stage 1: 스테레오 매드니스 (기본 가시, 계단 블록, 점프 패드)
    if (stageId === 1) {
      levelLength = 9000;

      while (curX < levelLength) {
        const pattern = Math.floor(Math.random() * 5);

        if (pattern === 0) {
          // 1단 가시
          levelObjects.push({ type: 'spike', x: curX, y: groundY - blockSize, w: blockSize, h: blockSize });
          curX += 300;
        } else if (pattern === 1) {
          // 2단 연속 가시
          levelObjects.push({ type: 'spike', x: curX, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'spike', x: curX + blockSize, y: groundY - blockSize, w: blockSize, h: blockSize });
          curX += 360;
        } else if (pattern === 2) {
          // 계단 블록 + 가시
          levelObjects.push({ type: 'block', x: curX, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'block', x: curX + blockSize, y: groundY - blockSize * 2, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'spike', x: curX + blockSize * 2, y: groundY - blockSize, w: blockSize, h: blockSize });
          curX += 450;
        } else if (pattern === 3) {
          // 노란색 점프 패드 (밟으면 슈퍼 점프)
          levelObjects.push({ type: 'pad_yellow', x: curX, y: groundY - 14, w: blockSize, h: 14 });
          levelObjects.push({ type: 'spike', x: curX + 120, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'spike', x: curX + 165, y: groundY - blockSize, w: blockSize, h: blockSize });
          curX += 450;
        } else {
          // 노란색 점프 링 (공중 터치 점프)
          levelObjects.push({ type: 'spike', x: curX + 60, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'ring_yellow', x: curX + 75, y: groundY - 90, r: 20 });
          curX += 400;
        }
      }

    } else if (stageId === 2) {
      // Stage 2: 백 온 트랙 (비행선 포털 + 레이저 통로)
      levelLength = 11000;

      levelObjects.push({ type: 'portal_ship', x: 1800, y: groundY - 140, w: 45, h: 120 });

      while (curX < levelLength) {
        if (curX > 1900 && curX < 6000) {
          // 비행선 구간: 상하 가시 통로
          levelObjects.push({ type: 'spike_ceiling', x: curX, y: ceilingY, w: blockSize, h: blockSize });
          if (Math.random() < 0.6) {
            levelObjects.push({ type: 'spike', x: curX, y: groundY - blockSize, w: blockSize, h: blockSize });
          }
          curX += 280;
        } else if (curX >= 6000 && curX < 6200) {
          levelObjects.push({ type: 'portal_cube', x: curX, y: groundY - 140, w: 45, h: 120 });
          curX += 400;
        } else {
          levelObjects.push({ type: 'spike', x: curX, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'ring_yellow', x: curX + 80, y: groundY - 85, r: 20 });
          curX += 350;
        }
      }

    } else {
      // Stage 3: 클러터펑크 (중력 반전 포털 + 3단 가시 + 웨이브)
      levelLength = 13000;

      while (curX < levelLength) {
        const r = Math.random();
        if (r < 0.25) {
          // 3단 가시
          levelObjects.push({ type: 'spike', x: curX, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'spike', x: curX + blockSize, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'spike', x: curX + blockSize * 2, y: groundY - blockSize, w: blockSize, h: blockSize });
          curX += 420;
        } else if (r < 0.5) {
          // 중력 반전 포털
          levelObjects.push({ type: 'portal_gravity', x: curX, y: groundY - 140, w: 45, h: 120 });
          levelObjects.push({ type: 'spike_ceiling', x: curX + 300, y: ceilingY, w: blockSize, h: blockSize });
          curX += 500;
        } else {
          // 공중 링 콤보
          levelObjects.push({ type: 'spike', x: curX, y: groundY - blockSize, w: blockSize, h: blockSize });
          levelObjects.push({ type: 'ring_yellow', x: curX + 70, y: groundY - 95, r: 20 });
          levelObjects.push({ type: 'ring_pink', x: curX + 220, y: groundY - 130, r: 20 });
          curX += 420;
        }
      }
    }
  }

  // 창 크기 조절
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - 120;
    ceilingY = 80;
    if (!isPlaying) {
      player.reset();
    }
  }

  window.addEventListener('resize', resizeCanvas);

  // 입력 컨트롤 (Space, Click, Touch)
  let isHolding = false;

  function handleInputDown() {
    initAudio();
    if (!isPlaying) return;
    isHolding = true;

    if (!player.isDead) {
      // 1. 공중 점프 링 터치 체크
      let ringUsed = false;
      for (let i = 0; i < levelObjects.length; i++) {
        const obj = levelObjects[i];
        if (obj.type === 'ring_yellow' || obj.type === 'ring_pink') {
          const rx = obj.x - cameraX;
          const ry = obj.y;
          const px = player.x + player.size / 2;
          const py = player.y + player.size / 2;
          const dist = Math.hypot(px - rx, py - ry);

          if (dist < 65) {
            ringUsed = true;
            if (obj.type === 'ring_yellow') {
              player.vy = -14.5 * player.gravityDir;
              playSound('ring_jump');
              spawnParticles(px, py, 15, '#fbbf24');
            } else {
              player.vy = -11.5 * player.gravityDir;
              playSound('ring_jump');
              spawnParticles(px, py, 15, '#f472b6');
            }
            player.targetRotation += (Math.PI / 2) * player.gravityDir;
            jumpsCount++;
            break;
          }
        }
      }

      if (!ringUsed) {
        player.jump();
      }
    }
  }

  function handleInputUp() {
    isHolding = false;
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      handleInputDown();
    } else if (e.code === 'KeyZ') {
      // 연습 모드: 체크포인트 추가
      addCheckpoint();
    } else if (e.code === 'KeyX') {
      // 연습 모드: 체크포인트 삭제
      removeCheckpoint();
    } else if (e.code === 'KeyR') {
      restartLevel();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      handleInputUp();
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleInputDown();
  });
  window.addEventListener('mouseup', () => handleInputUp());

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInputDown();
  }, { passive: false });
  window.addEventListener('touchend', () => handleInputUp());

  // 체크포인트 관리
  function addCheckpoint() {
    if (!isPracticeMode || !isPlaying || player.isDead) return;
    checkpoints.push({
      camX: cameraX,
      playerX: player.x,
      playerY: player.y,
      mode: player.mode,
      gravityDir: player.gravityDir
    });
    playSound('portal');
    spawnParticles(player.x, player.y, 12, '#34d399');
  }

  function removeCheckpoint() {
    if (!isPracticeMode || checkpoints.length === 0) return;
    checkpoints.pop();
    playSound('jump');
  }

  btnAddCp.addEventListener('click', addCheckpoint);
  btnDelCp.addEventListener('click', removeCheckpoint);

  // 연습 모드 토글
  btnPracticeToggle.addEventListener('click', () => {
    isPracticeMode = !isPracticeMode;
    btnPracticeToggle.classList.toggle('active', isPracticeMode);
    practiceControls.classList.toggle('hidden', !isPracticeMode);
    practiceText.textContent = isPracticeMode ? '연습 모드 (ON)' : '일반 모드';
    practiceIcon.textContent = isPracticeMode ? '🧪' : '💎';
    checkpoints.length = 0;
  });

  // 배속 버튼
  const speedOptions = [0.5, 1.0, 1.5, 2.0];
  function updateSpeedUI() {
    btnSpeedToggle.textContent = (gameSpeedMultiplier === 0.5) ? '🐢 0.5x' : `⚡ ${gameSpeedMultiplier.toFixed(1)}x`;
    spdBtns.forEach(b => {
      b.classList.toggle('active', parseFloat(b.dataset.spd) === gameSpeedMultiplier);
    });
  }

  btnSpeedToggle.addEventListener('click', () => {
    let idx = speedOptions.indexOf(gameSpeedMultiplier);
    if (idx === -1) idx = 1;
    gameSpeedMultiplier = speedOptions[(idx + 1) % speedOptions.length];
    updateSpeedUI();
  });

  spdBtns.forEach(b => {
    b.addEventListener('click', () => {
      gameSpeedMultiplier = parseFloat(b.dataset.spd);
      updateSpeedUI();
    });
  });

  // 큐브 팔레트 렌더링
  function initCubePalette() {
    cubePalette.innerHTML = '';
    cubeColors.forEach((color, i) => {
      const btn = document.createElement('button');
      btn.className = 'cube-color-btn' + (color === selectedCubeColor ? ' active' : '');
      btn.style.backgroundColor = color;
      btn.addEventListener('click', () => {
        selectedCubeColor = color;
        document.querySelectorAll('.cube-color-btn').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
      });
      cubePalette.appendChild(btn);
    });
  }

  // 스테이지 선택 카드 핸들링
  stageCards.forEach(card => {
    card.addEventListener('click', () => {
      stageCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentStage = parseInt(card.dataset.stage, 10);
    });
  });

  // 게임 시작
  function startStageGame() {
    initAudio();
    isPlaying = true;
    attempts++;
    hudAttempts.textContent = attempts;
    localStorage.setItem('gd_attempts', attempts.toString());

    jumpsCount = 0;
    cameraX = 0;
    checkpoints.length = 0;

    if (currentStage === 1) {
      hudStageBadge.textContent = 'Stage 1';
      hudStageName.textContent = '스테레오 매드니스 (Stereo Madness)';
    } else if (currentStage === 2) {
      hudStageBadge.textContent = 'Stage 2';
      hudStageName.textContent = '백 온 트랙 (Back On Track)';
    } else {
      hudStageBadge.textContent = 'Stage 3';
      hudStageName.textContent = '클러터펑크 & 점퍼 (Clutterfunk)';
    }

    buildLevel(currentStage);
    player.reset();

    stageModal.classList.add('hidden');
    clearModal.classList.add('hidden');

    startBGM(currentStage);
  }

  function restartLevel() {
    startStageGame();
  }

  function levelComplete() {
    isPlaying = false;
    stopBGM();
    playSound('clear');

    resAttempts.textContent = `${attempts} 회`;
    resJumps.textContent = `${jumpsCount} 회`;

    const bestKey = `gd_stage_${currentStage}_best`;
    localStorage.setItem(bestKey, '100%');
    const recEl = document.getElementById(`rec-stage-${currentStage}`);
    if (recEl) recEl.textContent = '100% ★';

    clearModal.classList.remove('hidden');
  }

  btnStartStage.addEventListener('click', startStageGame);
  btnRetryStage.addEventListener('click', startStageGame);
  btnSelectStage.addEventListener('click', () => {
    clearModal.classList.add('hidden');
    stageModal.classList.remove('hidden');
  });

  // 메인 게임 루프 (60FPS)
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPlaying && !player.isDead) {
      const moveSpeed = 7.5 * gameSpeedMultiplier;
      cameraX += moveSpeed;

      // 진행도 퍼센트 갱신
      progressPercent = Math.min(100, Math.floor((cameraX / levelLength) * 100));
      gdProgFill.style.width = `${progressPercent}%`;
      gdProgText.textContent = `${progressPercent}%`;

      if (progressPercent >= 100) {
        levelComplete();
      }

      player.update(isHolding);
    }

    // 1. 네온 펄스 배경 (Pulsing Neon Geometry Background)
    const beatPulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (currentStage === 1) {
      bgGrad.addColorStop(0, `rgb(10, 20, ${Math.floor(40 + beatPulse * 30)})`);
      bgGrad.addColorStop(1, '#020617');
    } else if (currentStage === 2) {
      bgGrad.addColorStop(0, `rgb(${Math.floor(30 + beatPulse * 40)}, 10, 50)`);
      bgGrad.addColorStop(1, '#090d16');
    } else {
      bgGrad.addColorStop(0, `rgb(${Math.floor(50 + beatPulse * 50)}, 15, 20)`);
      bgGrad.addColorStop(1, '#020617');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 배경 격자 기하학 무늬
    const gridOffset = (cameraX * 0.25) % 60;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = -gridOffset; x < canvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 2. 바닥 및 천장 라인
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillRect(0, 0, canvas.width, ceilingY);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.moveTo(0, ceilingY);
    ctx.lineTo(canvas.width, ceilingY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. 레벨 오브젝트 렌더링 & 충돌 체크
    for (let i = 0; i < levelObjects.length; i++) {
      const obj = levelObjects[i];
      const screenX = obj.x - cameraX;

      if (screenX < -150 || screenX > canvas.width + 150) continue;

      ctx.save();

      if (obj.type === 'spike') {
        // 🔺 바닥 가시
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(screenX, obj.y + obj.h);
        ctx.lineTo(screenX + obj.w / 2, obj.y);
        ctx.lineTo(screenX + obj.w, obj.y + obj.h);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 큐브 충돌 박스 체크
        if (isPlaying && !player.isDead) {
          const pL = player.x + 8;
          const pR = player.x + player.size - 8;
          const pT = player.y + 8;
          const pB = player.y + player.size - 8;

          const sL = screenX + 10;
          const sR = screenX + obj.w - 10;
          const sT = obj.y + 10;
          const sB = obj.y + obj.h;

          if (pR > sL && pL < sR && pB > sT && pT < sB) {
            player.die();
          }
        }

      } else if (obj.type === 'spike_ceiling') {
        // 🔻 천장 역가시
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(screenX, obj.y);
        ctx.lineTo(screenX + obj.w / 2, obj.y + obj.h);
        ctx.lineTo(screenX + obj.w, obj.y);
        ctx.closePath();
        ctx.fill();

        if (isPlaying && !player.isDead) {
          const pL = player.x + 8;
          const pR = player.x + player.size - 8;
          const pT = player.y + 8;
          const pB = player.y + player.size - 8;

          if (pR > screenX + 10 && pL < screenX + obj.w - 10 && pT < obj.y + obj.h - 8) {
            player.die();
          }
        }

      } else if (obj.type === 'block') {
        // ⬛ 블록 플랫폼
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(screenX, obj.y, obj.w, obj.h);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, obj.y, obj.w, obj.h);

        // 상단 착지 & 정면 충돌 체크
        if (isPlaying && !player.isDead) {
          const pL = player.x;
          const pR = player.x + player.size;
          const pT = player.y;
          const pB = player.y + player.size;

          const bL = screenX;
          const bR = screenX + obj.w;
          const bT = obj.y;
          const bB = obj.y + obj.h;

          if (pR > bL && pL < bR) {
            if (player.gravityDir === 1 && pB >= bT && pB <= bT + 16 && player.vy >= 0) {
              player.y = bT - player.size;
              player.vy = 0;
              player.isGrounded = true;
            } else if (pB > bT + 12 && pT < bB - 12 && pR > bL + 6 && pL < bL + 12) {
              player.die(); // 정면 블록 박치기 사망
            }
          }
        }

      } else if (obj.type === 'pad_yellow') {
        // 🟨 노란색 슈퍼 점프 패드
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.fillRect(screenX, obj.y, obj.w, obj.h);

        if (isPlaying && !player.isDead) {
          if (player.x + player.size > screenX && player.x < screenX + obj.w && Math.abs(player.y + player.size - obj.y) < 16) {
            player.vy = -16.5 * player.gravityDir;
            playSound('pad_jump');
            spawnParticles(screenX + obj.w / 2, obj.y, 16, '#fbbf24');
          }
        }

      } else if (obj.type === 'ring_yellow' || obj.type === 'ring_pink') {
        // 🟡 공중 점프 링
        const color = (obj.type === 'ring_yellow') ? '#fbbf24' : '#f472b6';
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(screenX, obj.y, obj.r, 0, Math.PI * 2);
        ctx.stroke();

      } else if (obj.type.startsWith('portal_')) {
        // 🌀 변신 포털
        let pColor = '#34d399';
        if (obj.type === 'portal_ship') pColor = '#f43f5e';
        if (obj.type === 'portal_gravity') pColor = '#38bdf8';

        ctx.fillStyle = pColor;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 20;
        ctx.fillRect(screenX, obj.y, obj.w, obj.h);

        if (isPlaying && !player.isDead) {
          if (player.x + player.size > screenX && player.x < screenX + obj.w) {
            if (obj.type === 'portal_ship' && player.mode !== 'ship') {
              player.mode = 'ship';
              playSound('portal');
              spawnParticles(player.x, player.y, 20, pColor);
            } else if (obj.type === 'portal_cube' && player.mode !== 'cube') {
              player.mode = 'cube';
              playSound('portal');
              spawnParticles(player.x, player.y, 20, pColor);
            } else if (obj.type === 'portal_gravity') {
              player.gravityDir *= -1;
              playSound('portal');
              spawnParticles(player.x, player.y, 20, pColor);
            }
          }
        }
      }

      ctx.restore();
    }

    // 4. 플레이어 렌더링
    player.draw();

    // 5. 파티클 이펙트
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

    // 6. 연습 모드 체크포인트 다이아몬드 핀 렌더링
    if (isPracticeMode) {
      checkpoints.forEach(cp => {
        const cpScreenX = cp.playerX - cameraX + 140;
        ctx.save();
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 15;
        ctx.fillText('💎', cpScreenX, cp.playerY + 20);
        ctx.restore();
      });
    }

    // 7. 12단 점프 플로팅 텍스트 렌더링
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;

      ctx.save();
      ctx.font = '900 1.05rem "Noto Sans KR", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    requestAnimationFrame(gameLoop);
  }

  // 초기화 & 실행
  initCubePalette();
  resizeCanvas();
  gameLoop();
});
