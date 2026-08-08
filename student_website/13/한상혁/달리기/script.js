/**
 * 초광속 졸라맨 무한 달리기 게임 (Stickman Infinite Super Runner)
 * HTML5 캔버스 & Web Audio API 기반 60FPS 무한 러너 엔진
 * 100% 한국어 지원 및 방향키 조작 시스템
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // HUD 엘리먼트
  const hudDistance = document.getElementById('hud-distance');
  const hudScore = document.getElementById('hud-score');
  const hudCoins = document.getElementById('hud-coins');
  const boosterBar = document.getElementById('booster-bar');
  const boosterText = document.getElementById('booster-text');
  const livesBox = document.getElementById('lives-box');
  const buffContainer = document.getElementById('buff-container');

  // 모달 엘리먼트
  const startModal = document.getElementById('start-modal');
  const btnStart = document.getElementById('btn-start');
  const gameoverModal = document.getElementById('gameover-modal');
  const gameoverReason = document.getElementById('gameover-reason');
  const resDistance = document.getElementById('res-distance');
  const resScore = document.getElementById('res-score');
  const resCoins = document.getElementById('res-coins');
  const resBest = document.getElementById('res-best');
  const btnRestart = document.getElementById('btn-restart');

  // 터치 버튼 엘리먼트
  const tUp = document.getElementById('t-up');
  const tDown = document.getElementById('t-down');
  const tLeft = document.getElementById('t-left');
  const tRight = document.getElementById('t-right');

  // 게임 상태 변수
  let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
  let score = 0;
  let coins = 0;
  let distance = 0;
  let bestDistance = parseInt(localStorage.getItem('stickman_best_dist') || '0', 10);
  let boosterGauge = 0; // 0 ~ 100
  let isBoosterActive = false;
  let boosterTimer = 0;

  let baseGameSpeed = 7.5;
  let currentSpeed = baseGameSpeed;
  let groundY = 0;

  // 파워업 지속 시간 변수
  let shieldActive = false;
  let magnetActive = false;
  let magnetTimer = 0;

  // Web Audio 컨텍스트
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 사운드 생성기 (12단 공중제비 음계 상승 사운드 지원)
  function playSound(type, tier = 1) {
    initAudio();
    if (!audioCtx) return;

    const t = audioCtx.currentTime;

    if (type === 'jump' || type === 'jump_tier') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      // 12단으로 갈수록 음계가 상승하는 웅장한 사운드 (Ascending Scale)
      const baseFreq = 260 + (tier * 65);
      osc.type = tier >= 10 ? 'sawtooth' : (tier >= 5 ? 'triangle' : 'sine');
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, t + 0.18);
      
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (type === 'slide') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.25);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } else if (type === 'coin') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (type === 'gem') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const ct = audioCtx.currentTime;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ct);
          gain.gain.setValueAtTime(0.25, ct);
          gain.gain.exponentialRampToValueAtTime(0.01, ct + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(ct);
          osc.stop(ct + 0.15);
        }, i * 35);
      });
    } else if (type === 'hit') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'boost') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.4);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    } else if (type === 'shield_break') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.3);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  // 🏃 졸라맨 플레이어 객체
  const player = {
    x: 120,
    y: 0,
    vx: 0,
    vy: 0,
    width: 32,
    height: 70,
    normalHeight: 70,
    slideHeight: 30,
    isGrounded: false,
    isSliding: false,
    jumpCount: 0,
    maxJumps: 20,
    rotation: 0,
    animFrame: 0,
    lives: 3,
    maxLives: 3,
    invincibleTimer: 0,

    reset() {
      this.x = 120;
      this.y = groundY - this.normalHeight;
      this.vx = 0;
      this.vy = 0;
      this.height = this.normalHeight;
      this.isGrounded = true;
      this.isSliding = false;
      this.jumpCount = 0;
      this.rotation = 0;
      this.animFrame = 0;
      this.lives = 3;
      this.invincibleTimer = 0;
    },

    jump() {
      if (this.jumpCount < this.maxJumps) {
        if (this.isSliding) this.stopSlide();

        this.jumpCount++;
        this.isGrounded = false;

        const jumpNames = [
          '1단 도약 점프!',
          '⚡ 2단 공중제비!',
          '🌀 3단 삼연속 회전!',
          '🌿 4단 사중 도약!',
          '🔮 5단 오연속 공중제비!',
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
          '👑 20단 궁극의 이십중 신화의 신의 공중제비 완성! 👑'
        ];

        const jumpColors = [
          '#ffffff', '#38bdf8', '#fbbf24', '#34d399', '#c084fc',
          '#f97316', '#fef08a', '#f472b6', '#2dd4bf', '#fb923c',
          '#e2e8f0', '#facc15', '#60a5fa', '#a855f7', '#ec4899',
          '#ef4444', '#06b6d4', '#eab308', '#8b5cf6', '#f59e0b'
        ];

        const tierIndex = this.jumpCount - 1;
        const jumpText = jumpNames[tierIndex] || `${this.jumpCount}단 공중제비!`;
        const jumpColor = jumpColors[tierIndex] || '#fbbf24';

        // 20단 점프 가속력
        if (this.jumpCount === 1) {
          this.vy = -16.5;
        } else if (this.jumpCount <= 6) {
          this.vy = -13.5;
        } else if (this.jumpCount < 20) {
          this.vy = -12.0;
        } else {
          // 👑 20단 도달 시 신의 슈퍼 점프 & 보너스 점수 2000점 & 부스터 충전!
          this.vy = -16.0;
          score += 2000;
          boosterGauge = Math.min(100, boosterGauge + 50);
          addFloatingText(this.x + 30, this.y - 60, '👑 20단 신화의 점프 달성 보너스 +2,000점!', '#f59e0b');
        }

        playSound('jump_tier', this.jumpCount);
        addFloatingText(this.x + 20, this.y - 25, jumpText, jumpColor);
        spawnParticles(this.x + 10, this.y + 20, 8 + this.jumpCount * 2, jumpColor);
      }
    },

    slide() {
      if (this.isGrounded && !this.isSliding) {
        this.isSliding = true;
        this.height = this.slideHeight;
        this.y = groundY - this.slideHeight;
        playSound('slide');
        spawnParticles(this.x, groundY, 6, '#fbbf24');
      }
    },

    stopSlide() {
      if (this.isSliding) {
        this.isSliding = false;
        this.height = this.normalHeight;
        this.y = groundY - this.normalHeight;
      }
    },

    update() {
      // 좌우 방향키 이동 처리
      if (keys.ArrowRight || keys.KeyD) {
        this.x = Math.min(this.x + 4, canvas.width * 0.45);
      } else if (keys.ArrowLeft || keys.KeyA) {
        this.x = Math.max(this.x - 4, 60);
      } else {
        // 기본 위치 복귀
        if (this.x > 120) this.x -= 1.5;
        if (this.x < 120) this.x += 1.5;
      }

      // 중력 & 12단 공중제비 회전 처리
      if (!this.isGrounded) {
        this.vy += 0.85; // 중력 가속도
        this.y += this.vy;

        // 공중제비 연속 회전
        if (this.jumpCount >= 2) {
          this.rotation += 0.35 + (this.jumpCount * 0.03);
        }

        if (this.y >= groundY - this.height) {
          this.y = groundY - this.height;
          this.vy = 0;
          this.isGrounded = true;
          this.jumpCount = 0;
          this.rotation = 0;
          spawnParticles(this.x + 10, groundY, 6, '#ffffff');
        }
      }

      if (this.isSliding) {
        this.animFrame += 0.5;
        if (Math.random() < 0.35) {
          spawnSpark(this.x - 10, groundY - 5);
        }
      } else if (this.isGrounded) {
        this.animFrame += currentSpeed * 0.04;
      }

      if (this.invincibleTimer > 0) {
        this.invincibleTimer--;
      }
    },

    draw() {
      ctx.save();

      // 무적 시간 깜빡임
      if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

      if (this.rotation !== 0) {
        ctx.rotate(this.rotation);
      }

      // ⚡ 슈퍼 부스터 아우라
      if (isBoosterActive) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 25;

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 🛡️ 에너지 실드 쉴드 구체
      if (shieldActive) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.isSliding) {
        // 🏄 슬라이딩 포즈 그리기
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;

        // 머리 (낮게 눕혀짐)
        ctx.beginPath();
        ctx.arc(15, -8, 9, 0, Math.PI * 2);
        ctx.stroke();

        // 붉은 두건
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(-25, -12);
        ctx.stroke();

        // 몸통
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(-15, 6);
        ctx.stroke();

        // 앞다리 / 뒷다리 슬라이딩
        ctx.beginPath();
        ctx.moveTo(-15, 6);
        ctx.lineTo(25, 12);
        ctx.moveTo(-15, 6);
        ctx.lineTo(-30, 10);
        ctx.stroke();

      } else {
        // 🏃 역동적인 달리기 / 점프 스틱맨 렌더링
        const t = this.animFrame;
        const legAngle1 = Math.sin(t) * 0.9;
        const legAngle2 = Math.sin(t + Math.PI) * 0.9;
        const armAngle1 = Math.sin(t + Math.PI) * 0.9;
        const armAngle2 = Math.sin(t) * 0.9;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;

        // 머리 (Head)
        ctx.beginPath();
        ctx.arc(0, -25, 10, 0, Math.PI * 2);
        ctx.stroke();

        // 붉은 두건 끈 (Red Headband waving)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, -25);
        ctx.quadraticCurveTo(-22, -26 + Math.sin(t * 1.5) * 5, -34, -22 + Math.cos(t * 1.5) * 6);
        ctx.stroke();

        // 몸통 (Spine)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 8);
        ctx.stroke();

        // 다리 1 & 다리 2
        if (!this.isGrounded) {
          // 점프 모션
          ctx.beginPath();
          ctx.moveTo(0, 8);
          ctx.lineTo(-12, 22);
          ctx.lineTo(-4, 34);

          ctx.moveTo(0, 8);
          ctx.lineTo(14, 20);
          ctx.lineTo(24, 32);
          ctx.stroke();
        } else {
          // 달리기 다리
          ctx.beginPath();
          ctx.moveTo(0, 8);
          ctx.lineTo(Math.sin(legAngle1) * 16, 20 + Math.cos(legAngle1) * 6);
          ctx.lineTo(Math.sin(legAngle1) * 22, 34);

          ctx.moveTo(0, 8);
          ctx.lineTo(Math.sin(legAngle2) * 16, 20 + Math.cos(legAngle2) * 6);
          ctx.lineTo(Math.sin(legAngle2) * 22, 34);
          ctx.stroke();
        }

        // 팔 1 & 팔 2
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(Math.sin(armAngle1) * 16, 0);
        ctx.lineTo(Math.sin(armAngle1) * 20, 8);

        ctx.moveTo(0, -10);
        ctx.lineTo(Math.sin(armAngle2) * 16, 0);
        ctx.lineTo(Math.sin(armAngle2) * 20, 8);
        ctx.stroke();
      }

      ctx.restore();
    }
  };

  // 장애물 & 아이템 & 파티클 컬렉션
  const obstacles = [];
  const items = [];
  const particles = [];
  const floatingTexts = [];
  const sparks = [];

  let obstacleTimer = 0;
  let itemTimer = 0;

  // 배경 건물 및 별 데이터 (Parallax Background)
  const bgBuildings = [];
  const bgStars = [];

  function initBackground() {
    bgBuildings.length = 0;
    bgStars.length = 0;

    for (let i = 0; i < 60; i++) {
      bgStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (groundY - 50),
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7,
        speed: 0.2 + Math.random() * 0.5
      });
    }

    let currentX = 0;
    while (currentX < canvas.width * 2) {
      const w = 60 + Math.random() * 120;
      const h = 120 + Math.random() * 260;
      bgBuildings.push({
        x: currentX,
        w: w,
        h: h,
        color: ['#0f172a', '#1e1b4b', '#172554', '#042f2e'][Math.floor(Math.random() * 4)],
        windowColor: ['#38bdf8', '#fbbf24', '#f43f5e', '#34d399'][Math.floor(Math.random() * 4)]
      });
      currentX += w + 15;
    }
  }

  // 창 크기 조절
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - 120;
    initBackground();
    if (gameState === 'START') {
      player.reset();
    }
  }

  window.addEventListener('resize', resizeCanvas);

  // 파티클 & 플로팅 텍스트
  function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: color,
        alpha: 1,
        decay: 0.03 + Math.random() * 0.04
      });
    }
  }

  function spawnSpark(x, y) {
    sparks.push({
      x: x,
      y: y,
      vx: -(currentSpeed * 0.5 + Math.random() * 5),
      vy: -(Math.random() * 4 + 1),
      alpha: 1,
      decay: 0.05
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
      decay: 0.02
    });
  }

  // 장애물 생성기
  function spawnObstacle() {
    const types = ['spike', 'laser_high', 'drone', 'barrier'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    if (chosenType === 'spike') {
      // 지상 가시 바위 (점프로 회피)
      obstacles.push({
        type: 'spike',
        x: canvas.width + 50,
        y: groundY - 45,
        width: 45,
        height: 45,
        color: '#ef4444'
      });
    } else if (chosenType === 'laser_high') {
      // 상단 레이저 빔 (슬라이딩으로 회피)
      obstacles.push({
        type: 'laser_high',
        x: canvas.width + 50,
        y: groundY - 75,
        width: 80,
        height: 35,
        color: '#38bdf8'
      });
    } else if (chosenType === 'drone') {
      // 공중 드론
      obstacles.push({
        type: 'drone',
        x: canvas.width + 50,
        y: groundY - 110,
        width: 40,
        height: 35,
        color: '#c084fc',
        wave: Math.random() * Math.PI
      });
    } else {
      // 2단 벽 장애물 (2단 점프로 회피)
      obstacles.push({
        type: 'barrier',
        x: canvas.width + 50,
        y: groundY - 65,
        width: 35,
        height: 65,
        color: '#f97316'
      });
    }
  }

  // 아이템 생성기
  function spawnItem() {
    const itemTypes = ['coin', 'diamond', 'magnet', 'shield', 'heart', 'booster'];
    const r = Math.random();
    let type = 'coin';

    if (r < 0.65) type = 'coin';
    else if (r < 0.8) type = 'diamond';
    else if (r < 0.88) type = 'magnet';
    else if (r < 0.94) type = 'shield';
    else if (r < 0.97) type = 'heart';
    else type = 'booster';

    const yPos = groundY - (40 + Math.floor(Math.random() * 3) * 45);

    items.push({
      type: type,
      x: canvas.width + 30,
      y: yPos,
      radius: (type === 'diamond' || type === 'booster') ? 16 : 13,
      baseY: yPos,
      anim: Math.random() * Math.PI * 2
    });
  }

  // 키 입력 핸들링
  const keys = {};

  window.addEventListener('keydown', (e) => {
    initAudio();
    keys[e.code] = true;

    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
      e.preventDefault();
      if (gameState === 'PLAYING') {
        player.jump();
      } else if (gameState === 'START') {
        startGame();
      } else if (gameState === 'GAMEOVER') {
        startGame();
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      if (gameState === 'PLAYING') {
        player.slide();
      }
    } else if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      triggerBooster();
    } else if (e.code === 'KeyR' && gameState === 'GAMEOVER') {
      startGame();
    } else if (e.code === 'Enter' && gameState === 'START') {
      startGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;

    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      if (gameState === 'PLAYING') {
        player.stopSlide();
      }
    }
  });

  // 터치 버튼 이벤트
  tUp.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') player.jump();
    else startGame();
  });

  tDown.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') player.slide();
  });

  tDown.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameState === 'PLAYING') player.stopSlide();
  });

  tLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
  tLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowLeft = false; });
  tRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
  tRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.ArrowRight = false; });

  btnStart.addEventListener('click', startGame);
  btnRestart.addEventListener('click', startGame);

  function triggerBooster() {
    if (boosterGauge >= 100 && !isBoosterActive) {
      isBoosterActive = true;
      boosterTimer = 350; // 약 6초간 무적 질주
      playSound('boost');
      addFloatingText(player.x + 20, player.y - 40, '⚡ 초광속 슈퍼 부스터 발동!', '#fbbf24');
    }
  }

  function updateHUD() {
    hudDistance.textContent = `${Math.floor(distance)} m`;
    hudScore.textContent = `${score.toLocaleString()} 점`;
    hudCoins.textContent = `🪙 ${coins}`;

    // 생명력 하트 업데이트
    livesBox.innerHTML = '';
    for (let i = 0; i < player.maxLives; i++) {
      const span = document.createElement('span');
      span.className = 'heart' + (i < player.lives ? '' : ' lost');
      span.textContent = '❤️';
      livesBox.appendChild(span);
    }

    // 부스터 게이지 업데이트
    boosterBar.style.width = `${boosterGauge}%`;
    boosterText.textContent = isBoosterActive ? '질주중!' : `${Math.floor(boosterGauge)}%`;

    // 버프 인디케이터
    buffContainer.innerHTML = '';
    if (isBoosterActive) {
      const b = document.createElement('div');
      b.className = 'buff-badge boost';
      b.textContent = '⚡ 슈퍼 부스터 무적 질주!';
      buffContainer.appendChild(b);
    }
    if (shieldActive) {
      const b = document.createElement('div');
      b.className = 'buff-badge shield';
      b.textContent = '🛡️ 에너지 쉴드 방어막 활성';
      buffContainer.appendChild(b);
    }
    if (magnetActive) {
      const b = document.createElement('div');
      b.className = 'buff-badge magnet';
      b.textContent = '🧲 코인 골드 자석 흡수 중';
      buffContainer.appendChild(b);
    }
  }

  function startGame() {
    initAudio();
    gameState = 'PLAYING';
    score = 0;
    coins = 0;
    distance = 0;
    boosterGauge = 0;
    isBoosterActive = false;
    shieldActive = false;
    magnetActive = false;
    currentSpeed = baseGameSpeed;

    obstacles.length = 0;
    items.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
    sparks.length = 0;

    obstacleTimer = 0;
    itemTimer = 0;

    player.reset();

    startModal.classList.add('hidden');
    gameoverModal.classList.add('hidden');
  }

  function gameOver(reason) {
    gameState = 'GAMEOVER';
    playSound('hit');

    if (distance > bestDistance) {
      bestDistance = Math.floor(distance);
      localStorage.setItem('stickman_best_dist', bestDistance.toString());
    }

    gameoverReason.textContent = reason || '장애물과 충돌하여 달리기를 멈췄습니다!';
    resDistance.textContent = `${Math.floor(distance)} m`;
    resScore.textContent = `${score.toLocaleString()} 점`;
    resCoins.textContent = `🪙 ${coins} 개`;
    resBest.textContent = `${bestDistance} m`;

    gameoverModal.classList.remove('hidden');
  }

  // 메인 게임 루프 (60FPS)
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 배경 (하늘 그라데이션)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(0.6, '#0f172a');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, groundY);

    // 2. 배경 별빛 렌더링
    ctx.fillStyle = '#ffffff';
    bgStars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, s.size, s.size);
      if (gameState === 'PLAYING') {
        s.x -= s.speed;
        if (s.x < 0) s.x = canvas.width;
      }
    });
    ctx.globalAlpha = 1;

    // 3. 패럴랙스 네온 빌딩 렌더링
    bgBuildings.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, groundY - b.h, b.w, b.h);

      // 빌딩 창문
      ctx.fillStyle = b.windowColor;
      ctx.globalAlpha = 0.4;
      for (let r = groundY - b.h + 20; r < groundY - 20; r += 25) {
        for (let c = b.x + 12; c < b.x + b.w - 12; c += 20) {
          ctx.fillRect(c, r, 8, 12);
        }
      }
      ctx.globalAlpha = 1;

      if (gameState === 'PLAYING') {
        b.x -= currentSpeed * 0.25;
      }
    });

    // 빌딩 무한 루프
    if (bgBuildings.length > 0 && bgBuildings[0].x + bgBuildings[0].w < 0) {
      const first = bgBuildings.shift();
      const last = bgBuildings[bgBuildings.length - 1];
      first.x = last.x + last.w + 15;
      bgBuildings.push(first);
    }

    // 4. 바닥 트랙 렌더링
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGrad.addColorStop(0, '#1e293b');
    groundGrad.addColorStop(0.3, '#0f172a');
    groundGrad.addColorStop(1, '#020617');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // 트랙 네온 라인
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    // 트랙 격자 스피드 라인
    const gridOffset = (Date.now() * 0.05 * currentSpeed) % 60;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2;
    for (let x = -gridOffset; x < canvas.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 50, canvas.height);
      ctx.stroke();
    }

    if (gameState === 'PLAYING') {
      // 속도 & 거리 업데이트
      distance += currentSpeed * 0.05;
      score += Math.floor(currentSpeed * 0.1);

      // 점진적 난이도 증가
      currentSpeed = baseGameSpeed + Math.min(distance * 0.003, 10);
      if (isBoosterActive) currentSpeed += 8;

      // 부스터 타이머 처리
      if (isBoosterActive) {
        boosterTimer--;
        if (boosterTimer <= 0) {
          isBoosterActive = false;
          boosterGauge = 0;
        }
      }

      // 자석 타이머 처리
      if (magnetActive) {
        magnetTimer--;
        if (magnetTimer <= 0) {
          magnetActive = false;
        }
      }

      // 장애물 생성 타이머
      obstacleTimer++;
      const spawnInterval = Math.max(45, Math.floor(90 - distance * 0.015));
      if (obstacleTimer > spawnInterval) {
        spawnObstacle();
        obstacleTimer = 0;
      }

      // 아이템 생성 타이머
      itemTimer++;
      if (itemTimer > 60) {
        spawnItem();
        itemTimer = 0;
      }

      player.update();
    }

    // 5. 아이템 업데이트 & 렌더링
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.x -= currentSpeed;
      it.anim += 0.08;
      it.y = it.baseY + Math.sin(it.anim) * 8;

      // 자석 활성 시 플레이어 방향으로 코인 당김
      if (magnetActive && (it.type === 'coin' || it.type === 'diamond')) {
        const dx = player.x - it.x;
        const dy = player.y - it.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 400) {
          it.x += (dx / dist) * 12;
          it.y += (dy / dist) * 12;
        }
      }

      // 아이템 그리기
      ctx.save();
      ctx.translate(it.x, it.y);

      if (it.type === 'coin') {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 12px "Orbitron"';
        ctx.textAlign = 'center';
        ctx.fillText('C', 0, 4);
      } else if (it.type === 'diamond') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, -it.radius);
        ctx.lineTo(it.radius, 0);
        ctx.lineTo(0, it.radius);
        ctx.lineTo(-it.radius, 0);
        ctx.closePath();
        ctx.fill();
      } else if (it.type === 'magnet') {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧲', 0, 8);
      } else if (it.type === 'shield') {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️', 0, 8);
      } else if (it.type === 'heart') {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('❤️', 0, 8);
      } else if (it.type === 'booster') {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', 0, 8);
      }

      ctx.restore();

      // 플레이어와 충돌 체크
      if (gameState === 'PLAYING') {
        const pCenterX = player.x + player.width / 2;
        const pCenterY = player.y + player.height / 2;
        const dist = Math.hypot(pCenterX - it.x, pCenterY - it.y);

        if (dist < it.radius + player.width) {
          // 아이템 획득!
          if (it.type === 'coin') {
            coins++;
            score += 100;
            boosterGauge = Math.min(100, boosterGauge + 5);
            playSound('coin');
            addFloatingText(it.x, it.y, '+100 코인!', '#fbbf24');
          } else if (it.type === 'diamond') {
            coins += 5;
            score += 500;
            boosterGauge = Math.min(100, boosterGauge + 20);
            playSound('gem');
            addFloatingText(it.x, it.y, '💎 +500 다이아!', '#38bdf8');
          } else if (it.type === 'magnet') {
            magnetActive = true;
            magnetTimer = 450; // 약 7.5초
            playSound('gem');
            addFloatingText(it.x, it.y, '🧲 골드 자석 획득!', '#c084fc');
          } else if (it.type === 'shield') {
            shieldActive = true;
            playSound('gem');
            addFloatingText(it.x, it.y, '🛡️ 에너지 쉴드 획득!', '#38bdf8');
          } else if (it.type === 'heart') {
            if (player.lives < player.maxLives) {
              player.lives++;
              playSound('gem');
              addFloatingText(it.x, it.y, '❤️ 체력 회복!', '#f43f5e');
            }
          } else if (it.type === 'booster') {
            boosterGauge = 100;
            triggerBooster();
          }

          spawnParticles(it.x, it.y, 10, '#fbbf24');
          items.splice(i, 1);
          continue;
        }
      }

      if (it.x + it.radius < -50) {
        items.splice(i, 1);
      }
    }

    // 6. 장애물 업데이트 & 렌더링
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= currentSpeed;

      if (obs.type === 'drone') {
        obs.wave += 0.05;
        obs.y += Math.sin(obs.wave) * 1.5;
      }

      // 장애물 그리기
      ctx.save();
      ctx.fillStyle = obs.color;
      ctx.shadowColor = obs.color;
      ctx.shadowBlur = 15;

      if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x + obs.width / 2 - 2, obs.y + 10, 4, 8);
      } else if (obs.type === 'laser_high') {
        // 상단 레이저 빔
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        // 레이저 펄스 광선
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x + 5, obs.y + obs.height / 2 - 2, obs.width - 10, 4);
      } else if (obs.type === 'drone') {
        // 드론
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // 빨간 탐색 눈
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obs.x + 8, obs.y + obs.height / 2 - 3, 6, 6);
      } else {
        // 배리어 벽
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      }

      ctx.restore();

      // 플레이어와 충돌 체크
      if (gameState === 'PLAYING') {
        const pLeft = player.x;
        const pRight = player.x + player.width;
        const pTop = player.y;
        const pBottom = player.y + player.height;

        const oLeft = obs.x;
        const oRight = obs.x + obs.width;
        const oTop = obs.y;
        const oBottom = obs.y + obs.height;

        const isColliding = (pRight > oLeft + 6 && pLeft < oRight - 6 && pBottom > oTop + 6 && pTop < oBottom - 6);

        if (isColliding) {
          if (isBoosterActive) {
            // 부스터 상태: 장애물 분쇄!
            playSound('hit');
            spawnParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 20, obs.color);
            addFloatingText(obs.x, obs.y - 20, '💥 장애물 분쇄! (+300점)', '#fbbf24');
            score += 300;
            obstacles.splice(i, 1);
            continue;
          } else if (player.invincibleTimer <= 0) {
            if (shieldActive) {
              // 쉴드로 1회 방어!
              shieldActive = false;
              player.invincibleTimer = 45; // 0.75초 무적
              playSound('shield_break');
              spawnParticles(player.x, player.y, 25, '#38bdf8');
              addFloatingText(player.x, player.y - 30, '🛡️ 쉴드 방어 성공!', '#38bdf8');
              obstacles.splice(i, 1);
              continue;
            } else {
              // 데미지 입음!
              player.lives--;
              player.invincibleTimer = 75; // 1.25초 무적
              playSound('hit');
              spawnParticles(player.x, player.y, 20, '#ef4444');

              if (player.lives <= 0) {
                let reason = '장애물과 충돌하여 쓰러졌습니다!';
                if (obs.type === 'spike') reason = '가시 함정에 걸렸습니다!';
                else if (obs.type === 'laser_high') reason = '고에너지 레이저 빔에 피격되었습니다! (슬라이딩으로 피하세요)';
                else if (obs.type === 'drone') reason = '비행 드론과 정면 충돌했습니다!';
                gameOver(reason);
              } else {
                addFloatingText(player.x, player.y - 30, `💔 체력 감소! (남은 하트: ${player.lives})`, '#ef4444');
              }
            }
          }
        }
      }

      if (obs.x + obs.width < -50) {
        obstacles.splice(i, 1);
      }
    }

    // 7. 플레이어 그리기
    player.draw();

    // 8. 파티클 & 스파크 & 플로팅 텍스트 렌더링
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.alpha -= sp.decay;

      ctx.fillStyle = '#fbbf24';
      ctx.globalAlpha = Math.max(0, sp.alpha);
      ctx.fillRect(sp.x, sp.y, 3, 3);

      if (sp.alpha <= 0) sparks.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.alpha -= p.decay;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius * p.alpha), 0, Math.PI * 2);
      ctx.fill();

      if (p.alpha <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;

      ctx.save();
      ctx.font = '900 1rem "Noto Sans KR", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    updateHUD();
    requestAnimationFrame(gameLoop);
  }

  // 초기화 & 시작
  resizeCanvas();
  gameLoop();
});
