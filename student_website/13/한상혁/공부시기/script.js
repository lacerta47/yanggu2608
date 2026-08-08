/**
 * 초호화 왕볼 부수기 게임 (Super Mega Ball Crusher)
 * 정통 팡팡(Super Pang) 아케이드 액션 & 20단 공중제비 점프 & 파워업 아이템
 * 100% 한국어 지원
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // HUD 엘리먼트
  const hudStageBadge = document.getElementById('hud-stage-badge');
  const hudStageName = document.getElementById('hud-stage-name');
  const hudWeaponIcon = document.getElementById('hud-weapon-icon');
  const hudWeaponName = document.getElementById('hud-weapon-name');
  const timeStopGauge = document.getElementById('time-stop-gauge');
  const tsFill = document.getElementById('ts-fill');
  const hudLives = document.getElementById('hud-lives');
  const hudScore = document.getElementById('hud-score');
  const hudBalls = document.getElementById('hud-balls');

  const comboBanner = document.getElementById('combo-banner');
  const comboNum = document.getElementById('combo-num');

  // 모달 엘리먼트
  const startModal = document.getElementById('start-modal');
  const stCards = document.querySelectorAll('.st-card');
  const btnStartGame = document.getElementById('btn-start-game');

  const clearModal = document.getElementById('clear-modal');
  const resScore = document.getElementById('res-score');
  const resCombo = document.getElementById('res-combo');
  const resBalls = document.getElementById('res-balls');
  const btnRetry = document.getElementById('btn-retry');
  const btnNextStage = document.getElementById('btn-next-stage');

  // 터치 버튼
  const tLeft = document.getElementById('t-left');
  const tRight = document.getElementById('t-right');
  const tJump = document.getElementById('t-jump');
  const tShoot = document.getElementById('t-shoot');

  // 게임 상태 변수
  let currentStage = 1;
  let isPlaying = false;
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let ballsPopped = 0;
  let groundY = 0;
  let ceilingY = 60;

  // 타임스톱 아이템
  let isTimeStopped = false;
  let timeStopTimer = 0;

  // Web Audio 신디사이저
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

  function playSound(type, param) {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'shoot') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'pop') {
      const sizeLevel = param || 1;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      const baseF = 180 + (4 - sizeLevel) * 120;
      osc.frequency.setValueAtTime(baseF, now);
      osc.frequency.exponentialRampToValueAtTime(baseF * 2.5, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'item') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880.00, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'jump_tier') {
      const tier = param || 1;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const baseFreq = 260 + (tier * 65);
      osc.type = tier >= 10 ? 'sawtooth' : (tier >= 5 ? 'triangle' : 'sine');
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'bomb') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  // 💥 플레이어 객체 (졸라맨 히어로 & 20단 공중제비)
  const player = {
    x: 400,
    y: 0,
    vx: 0,
    vy: 0,
    width: 36,
    height: 64,
    speed: 7.5,
    lives: 3,
    maxLives: 3,
    isGrounded: true,
    jumpCount: 0,
    maxJumps: 20,
    rotation: 0,
    shield: false,
    weaponType: 'harpoon', // 'harpoon', 'double_harpoon', 'gatling'
    weaponTimer: 0,
    invincibleTimer: 0,

    reset() {
      this.x = canvas.width / 2 - this.width / 2;
      this.y = groundY - this.height;
      this.vx = 0;
      this.vy = 0;
      this.lives = 3;
      this.isGrounded = true;
      this.jumpCount = 0;
      this.rotation = 0;
      this.shield = false;
      this.weaponType = 'harpoon';
      this.weaponTimer = 0;
      this.invincibleTimer = 0;
      updateWeaponUI();
    },

    jump() {
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
          '👑 20단 궁극의 이십중 신화의 신의 공중제비 완성! 👑'
        ];
        const jumpColors = [
          '#ffffff', '#38bdf8', '#fbbf24', '#34d399', '#c084fc',
          '#f97316', '#fef08a', '#f472b6', '#2dd4bf', '#fb923c',
          '#e2e8f0', '#facc15', '#60a5fa', '#a855f7', '#ec4899',
          '#ef4444', '#06b6d4', '#eab308', '#8b5cf6', '#f59e0b'
        ];

        const tierIdx = this.jumpCount - 1;
        const jText = jumpNames[tierIdx] || `${this.jumpCount}단 공중제비!`;
        const jColor = jumpColors[tierIdx] || '#fbbf24';

        if (this.jumpCount === 1) {
          this.vy = -14.5;
        } else if (this.jumpCount <= 6) {
          this.vy = -12.5;
        } else if (this.jumpCount < 20) {
          this.vy = -11.0;
        } else {
          // 👑 20단 궁극의 슈퍼 점프
          this.vy = -15.0;
          score += 2000;
          addFloatingText(this.x, this.y - 40, '👑 20단 신화의 점프 보너스 +2,000점!', '#f59e0b');
        }

        playSound('jump_tier', this.jumpCount);
        addFloatingText(this.x, this.y - 20, jText, jColor);
        spawnParticles(this.x + this.width / 2, this.y + this.height, 12 + this.jumpCount * 2, jColor);
      }
    },

    shoot() {
      if (!isPlaying) return;

      if (this.weaponType === 'harpoon') {
        // 기본 1발 작살
        if (projectiles.filter(p => p.type === 'harpoon').length < 1) {
          projectiles.push({
            type: 'harpoon',
            x: this.x + this.width / 2,
            y: this.y + this.height,
            headY: this.y,
            speed: 12,
            color: '#38bdf8'
          });
          playSound('shoot');
        }
      } else if (this.weaponType === 'double_harpoon') {
        // 더블 작살 (동시 2발)
        if (projectiles.filter(p => p.type === 'harpoon').length < 2) {
          projectiles.push({
            type: 'harpoon',
            x: this.x + this.width / 2 - 10,
            y: this.y + this.height,
            headY: this.y,
            speed: 13,
            color: '#fbbf24'
          });
          projectiles.push({
            type: 'harpoon',
            x: this.x + this.width / 2 + 10,
            y: this.y + this.height,
            headY: this.y,
            speed: 13,
            color: '#fbbf24'
          });
          playSound('shoot');
        }
      } else if (this.weaponType === 'gatling') {
        // 개틀링 머신건 (고속 레이저 탄환)
        projectiles.push({
          type: 'bullet',
          x: this.x + this.width / 2,
          y: this.y,
          vy: -18,
          color: '#f43f5e'
        });
        playSound('shoot');
      }
    },

    hit() {
      if (this.invincibleTimer > 0) return;

      if (this.shield) {
        this.shield = false;
        this.invincibleTimer = 90;
        addFloatingText(this.x, this.y - 30, '🛡️ 실드 방어 성공!', '#38bdf8');
        playSound('item');
        return;
      }

      this.lives--;
      updateLivesUI();
      playSound('bomb');
      spawnParticles(this.x + this.width / 2, this.y + this.height / 2, 25, '#ef4444');

      if (this.lives <= 0) {
        gameOver();
      } else {
        this.invincibleTimer = 120; // 2초간 무적
      }
    },

    update(keys) {
      // 좌우 이동
      if (keys.ArrowRight || keys.KeyD) {
        this.x = Math.min(canvas.width - this.width - 20, this.x + this.speed);
      } else if (keys.ArrowLeft || keys.KeyA) {
        this.x = Math.max(20, this.x - this.speed);
      }

      // 중력 및 점프 회전
      if (!this.isGrounded) {
        this.vy += 0.75;
        this.y += this.vy;

        if (this.jumpCount >= 2) {
          this.rotation += 0.35 + (this.jumpCount * 0.02);
        }

        if (this.y >= groundY - this.height) {
          this.y = groundY - this.height;
          this.vy = 0;
          this.isGrounded = true;
          this.jumpCount = 0;
          this.rotation = 0;
        }
      }

      // 무적 타이머 감소
      if (this.invincibleTimer > 0) this.invincibleTimer--;

      // 무기 타이머 감소
      if (this.weaponTimer > 0) {
        this.weaponTimer--;
        if (this.weaponTimer <= 0) {
          this.weaponType = 'harpoon';
          updateWeaponUI();
        }
      }
    },

    draw() {
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.rotation);

      // 무적 깜빡임
      if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 6) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // 🛡️ 에너지 실드 링
      if (this.shield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 졸라맨 히어로 본체 (화이트 & 네온 머리띠)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;

      // 머리
      ctx.beginPath();
      ctx.arc(0, -18, 12, 0, Math.PI * 2);
      ctx.stroke();

      // 히어로 레드 머리띠
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -22, 24, 4);

      // 몸통
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 14);
      ctx.stroke();

      // 팔 (작살 총 들기)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, 10);
      ctx.moveTo(0, 0);
      ctx.lineTo(12, -4);
      ctx.stroke();

      // 다리
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(-10, 30);
      ctx.moveTo(0, 14);
      ctx.lineTo(10, 30);
      ctx.stroke();

      ctx.restore();
    }
  };

  // ⚽ 왕볼(Balls) 컬렉션 & 분열 엔진
  const balls = [];
  const projectiles = [];
  const droppedItems = [];
  const particles = [];
  const floatingTexts = [];

  // 볼 스폰 함수 (Level 4: 왕볼 -> 3: 대형 -> 2: 중형 -> 1: 소형)
  function spawnBall(x, y, level, vx = 3.5, vy = -6, type = 'normal') {
    const radiusMap = [0, 16, 26, 42, 64];
    const bounceMap = [0, 9.5, 11.5, 13.5, 15.5];
    const colorMap = {
      normal: ['#ffffff', '#34d399', '#38bdf8', '#fbbf24', '#ef4444'],
      fire: ['#ffffff', '#f97316', '#fb923c', '#f59e0b', '#dc2626'],
      ice: ['#ffffff', '#a5f3fc', '#38bdf8', '#0284c7', '#0369a1'],
      gold: ['#ffffff', '#fef08a', '#facc15', '#eab308', '#ca8a04']
    };

    balls.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      level: level,
      radius: radiusMap[level],
      bounceVy: bounceMap[level],
      type: type,
      color: colorMap[type][level] || '#ef4444'
    });
  }

  // 볼 분열 및 파괴
  function popBall(index) {
    const b = balls[index];
    balls.splice(index, 1);
    ballsPopped++;

    playSound('pop', b.level);
    spawnParticles(b.x, b.y, 15 + b.level * 8, b.color);

    // 콤보 증가
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    showCombo(combo);

    const pts = b.level * 250 * (combo > 5 ? 2 : 1);
    score += pts;
    addFloatingText(b.x, b.y, `+${pts}점!`, b.color);

    // 아이템 드롭 확률 (20%)
    if (Math.random() < 0.22) {
      spawnItem(b.x, b.y);
    }

    // 하위 레벨 2개로 분열
    if (b.level > 1) {
      const nextLvl = b.level - 1;
      spawnBall(b.x - 15, b.y, nextLvl, -3.8, -8.5, b.type);
      spawnBall(b.x + 15, b.y, nextLvl, 3.8, -8.5, b.type);
    }

    updateHUD();

    // 스테이지 클리어 체크
    if (balls.length === 0) {
      setTimeout(stageClear, 600);
    }
  }

  // 🎁 파워업 아이템 드롭
  function spawnItem(x, y) {
    const itemTypes = ['double_harpoon', 'gatling', 'time_stop', 'shield', 'bomb', 'diamond'];
    const icons = {
      double_harpoon: '🔱',
      gatling: '🔫',
      time_stop: '⏱️',
      shield: '🛡️',
      bomb: '💣',
      diamond: '💎'
    };
    const randType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

    droppedItems.push({
      x: x,
      y: y,
      vy: -3,
      type: randType,
      icon: icons[randType],
      timer: 450 // 7.5초 지속
    });
  }

  function applyItem(item) {
    playSound('item');

    if (item.type === 'double_harpoon') {
      player.weaponType = 'double_harpoon';
      player.weaponTimer = 600; // 10초
      addFloatingText(player.x, player.y - 30, '🔱 더블 레이저 작살 획득!', '#fbbf24');
    } else if (item.type === 'gatling') {
      player.weaponType = 'gatling';
      player.weaponTimer = 450; // 7.5초
      addFloatingText(player.x, player.y - 30, '🔫 초광속 개틀링 머신건 획득!', '#f43f5e');
    } else if (item.type === 'time_stop') {
      isTimeStopped = true;
      timeStopTimer = 300; // 5초
      timeStopGauge.classList.remove('hidden');
      addFloatingText(player.x, player.y - 30, '⏱️ 타임스톱 발동! (5초 정지)', '#fbbf24');
    } else if (item.type === 'shield') {
      player.shield = true;
      addFloatingText(player.x, player.y - 30, '🛡️ 에너지 무적 실드 장착!', '#38bdf8');
    } else if (item.type === 'bomb') {
      playSound('bomb');
      addFloatingText(canvas.width / 2, canvas.height / 2, '💣 메가 폭탄 폭발! 전체 분열!', '#ef4444');
      // 화면 내 모든 볼 분열
      const currentBalls = [...balls];
      balls.length = 0;
      currentBalls.forEach(b => {
        spawnParticles(b.x, b.y, 20, '#ef4444');
        if (b.level > 1) {
          spawnBall(b.x - 15, b.y, b.level - 1, -4, -8, b.type);
          spawnBall(b.x + 15, b.y, b.level - 1, 4, -8, b.type);
        }
      });
    } else if (item.type === 'diamond') {
      score += 1500;
      addFloatingText(player.x, player.y - 30, '💎 다이아몬드 보너스 +1,500점!', '#38bdf8');
    }

    updateWeaponUI();
    updateHUD();
  }

  // 파티클 & 플로팅 텍스트
  function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 8;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 5,
        color: color,
        alpha: 1,
        decay: 0.03
      });
    }
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

  function showCombo(c) {
    if (c >= 2) {
      comboNum.textContent = `${c}`;
      comboBanner.classList.add('active');
      setTimeout(() => comboBanner.classList.remove('active'), 500);
    }
  }

  // HUD 업데이트
  function updateHUD() {
    hudScore.textContent = score.toLocaleString();
    hudBalls.textContent = balls.length;
  }

  function updateLivesUI() {
    let hearts = '';
    for (let i = 0; i < player.lives; i++) hearts += '❤️';
    hudLives.textContent = hearts || '💀 사망';
  }

  function updateWeaponUI() {
    if (player.weaponType === 'harpoon') {
      hudWeaponIcon.textContent = '🔱';
      hudWeaponName.textContent = '기본 작살';
    } else if (player.weaponType === 'double_harpoon') {
      hudWeaponIcon.textContent = '🔱🔱';
      hudWeaponName.textContent = `더블 작살 (${Math.ceil(player.weaponTimer / 60)}s)`;
    } else if (player.weaponType === 'gatling') {
      hudWeaponIcon.textContent = '🔫';
      hudWeaponName.textContent = `개틀링건 (${Math.ceil(player.weaponTimer / 60)}s)`;
    }
  }

  // 스테이지 빌더
  function loadStage(st) {
    balls.length = 0;
    projectiles.length = 0;
    droppedItems.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;
    combo = 0;

    hudStageBadge.textContent = `STAGE ${st}`;
    if (st === 1) {
      hudStageName.textContent = '초록 들판 왕볼 소탕전';
      // 3단계 대형볼 2개
      spawnBall(canvas.width * 0.3, 160, 3, 3.5, -5, 'normal');
      spawnBall(canvas.width * 0.7, 160, 3, -3.5, -5, 'normal');
    } else if (st === 2) {
      hudStageName.textContent = '네온 시티 고속 볼 러시';
      // 4단계 초대형 왕볼 1개 + 2단계 파이어볼 2개
      spawnBall(canvas.width * 0.5, 140, 4, 4.0, -6, 'fire');
      spawnBall(canvas.width * 0.2, 180, 2, -4.5, -5, 'ice');
      spawnBall(canvas.width * 0.8, 180, 2, 4.5, -5, 'ice');
    } else {
      hudStageName.textContent = '베이징 킹볼 거대 보스전';
      // 4단계 골든 킹볼 2개
      spawnBall(canvas.width * 0.35, 130, 4, 4.5, -7, 'gold');
      spawnBall(canvas.width * 0.65, 130, 4, -4.5, -7, 'gold');
    }

    player.reset();
    updateHUD();
    updateLivesUI();
  }

  function startCrusherGame() {
    initAudio();
    isPlaying = true;
    score = 0;
    ballsPopped = 0;
    maxCombo = 0;

    startModal.classList.add('hidden');
    clearModal.classList.add('hidden');

    loadStage(currentStage);
  }

  function stageClear() {
    isPlaying = false;
    resScore.textContent = `${score.toLocaleString()} 점`;
    resCombo.textContent = `${maxCombo} COMBO`;
    resBalls.textContent = `${ballsPopped} 개`;
    clearModal.classList.remove('hidden');
  }

  function gameOver() {
    isPlaying = false;
    addFloatingText(canvas.width / 2, canvas.height / 2, '💀 GAME OVER! R키로 재도전!', '#ef4444');
    setTimeout(() => {
      startModal.classList.remove('hidden');
    }, 1200);
  }

  // 키보드 & 터치 이벤트
  const keys = {};

  window.addEventListener('keydown', (e) => {
    initAudio();
    keys[e.code] = true;

    if (e.code === 'Space') {
      e.preventDefault();
      player.shoot();
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      player.jump();
    } else if (e.code === 'KeyR') {
      startCrusherGame();
    } else if (e.code === 'Enter' && !startModal.classList.contains('hidden')) {
      startCrusherGame();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // 터치 버튼 이벤트
  if (tLeft) {
    tLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; }, { passive: false });
    tLeft.addEventListener('touchend', () => keys.ArrowLeft = false);
    tRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; }, { passive: false });
    tRight.addEventListener('touchend', () => keys.ArrowRight = false);
    tJump.addEventListener('touchstart', (e) => { e.preventDefault(); player.jump(); }, { passive: false });
    tShoot.addEventListener('touchstart', (e) => { e.preventDefault(); player.shoot(); }, { passive: false });
  }

  // 캔버스 리사이징
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - 90;
    ceilingY = 70;
  }

  window.addEventListener('resize', resizeCanvas);

  // 모달 버튼 핸들러
  stCards.forEach(card => {
    card.addEventListener('click', () => {
      stCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentStage = parseInt(card.dataset.stage, 10);
    });
  });

  btnStartGame.addEventListener('click', startCrusherGame);
  btnRetry.addEventListener('click', startCrusherGame);
  btnNextStage.addEventListener('click', () => {
    currentStage = (currentStage % 3) + 1;
    startCrusherGame();
  });

  // 메인 게임 애니메이션 루프 (60FPS)
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 아케이드 사이버펑크 배경 그리기
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.7, '#1e1b4b');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 바닥 & 천장 가이드라인
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    ctx.fillRect(0, 0, canvas.width, ceilingY);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.moveTo(0, ceilingY);
    ctx.lineTo(canvas.width, ceilingY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 타임스톱 타이머 처리
    if (isTimeStopped) {
      timeStopTimer--;
      tsFill.style.width = `${(timeStopTimer / 300) * 100}%`;
      if (timeStopTimer <= 0) {
        isTimeStopped = false;
        timeStopGauge.classList.add('hidden');
      }
    }

    if (isPlaying) {
      player.update(keys);
    }

    // 2. 발사된 작살 및 탄환 업데이트 & 렌더링
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];

      if (p.type === 'harpoon') {
        p.headY -= p.speed;

        // 작살 와이어 체인 렌더링
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.headY);
        ctx.stroke();

        // 작살촉
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(p.x, p.headY - 10);
        ctx.lineTo(p.x - 8, p.headY);
        ctx.lineTo(p.x + 8, p.headY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 천장 도달 시 소멸
        if (p.headY <= ceilingY) {
          spawnParticles(p.x, ceilingY, 8, p.color);
          projectiles.splice(i, 1);
          continue;
        }

        // 왕볼과의 충돌 체크
        for (let j = balls.length - 1; j >= 0; j--) {
          const b = balls[j];
          if (b.x + b.radius > p.x - 6 && b.x - b.radius < p.x + 6 && b.y + b.radius > p.headY && b.y - b.radius < p.y) {
            popBall(j);
            projectiles.splice(i, 1);
            break;
          }
        }

      } else if (p.type === 'bullet') {
        p.y += p.vy;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(p.x - 3, p.y - 12, 6, 12);
        ctx.restore();

        if (p.y <= ceilingY) {
          projectiles.splice(i, 1);
          continue;
        }

        for (let j = balls.length - 1; j >= 0; j--) {
          const b = balls[j];
          const dist = Math.hypot(p.x - b.x, p.y - b.y);
          if (dist < b.radius + 6) {
            popBall(j);
            projectiles.splice(i, 1);
            break;
          }
        }
      }
    }

    // 3. 왕볼(Balls) 물리 & 바운스 렌더링
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];

      if (isPlaying && !isTimeStopped) {
        // 중력 가속도
        b.vy += 0.38;
        b.x += b.vx;
        b.y += b.vy;

        // 좌우 벽 바운스
        if (b.x - b.radius <= 20) {
          b.x = 20 + b.radius;
          b.vx = Math.abs(b.vx);
        } else if (b.x + b.radius >= canvas.width - 20) {
          b.x = canvas.width - 20 - b.radius;
          b.vx = -Math.abs(b.vx);
        }

        // 바닥 바운스
        if (b.y + b.radius >= groundY) {
          b.y = groundY - b.radius;
          b.vy = -b.bounceVy;
        }

        // 플레이어와의 충돌 체크
        if (isPlaying && player.invincibleTimer <= 0) {
          const px = player.x + player.width / 2;
          const py = player.y + player.height / 2;
          const dist = Math.hypot(px - b.x, py - b.y);

          if (dist < b.radius + player.width / 2 - 4) {
            player.hit();
          }
        }
      }

      // 왕볼 3D 구체 렌더링
      ctx.save();
      const ballGrad = ctx.createRadialGradient(
        b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1,
        b.x, b.y, b.radius
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.35, b.color);
      ballGrad.addColorStop(1, '#090d16');

      ctx.fillStyle = ballGrad;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // 광택 테두리
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 4. 드롭된 아이템 렌더링
    for (let i = droppedItems.length - 1; i >= 0; i--) {
      const item = droppedItems[i];

      if (isPlaying) {
        item.vy += 0.25;
        item.y += item.vy;

        if (item.y >= groundY - 24) {
          item.y = groundY - 24;
          item.vy = 0;
        }

        item.timer--;
        if (item.timer <= 0) {
          droppedItems.splice(i, 1);
          continue;
        }

        // 플레이어 획득 체크
        const dist = Math.hypot(player.x + player.width / 2 - item.x, player.y + player.height / 2 - item.y);
        if (dist < 40) {
          applyItem(item);
          droppedItems.splice(i, 1);
          continue;
        }
      }

      ctx.save();
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.fillText(item.icon, item.x, item.y);
      ctx.restore();
    }

    // 5. 플레이어 렌더링
    player.draw();

    // 6. 파티클 이펙트
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

    // 7. 20단 점프 & 점수 플로팅 텍스트 렌더링
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

  // 초기화 및 루프 실행
  resizeCanvas();
  gameLoop();
});
