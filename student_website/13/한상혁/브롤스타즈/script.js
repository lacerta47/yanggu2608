/**
 * 초호화 브롤스타즈 배틀 아레나 (Super Brawl Stars Korea)
 * 쉘리, 콜트, 엘 프리모 & 젬 그랩 & 쇼다운 배틀로얄 & 지능형 AI & 수풀 은신
 * 100% 한국어 지원
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('brawl-canvas');
  const ctx = canvas.getContext('2d');

  // HUD 엘리먼트
  const hudModeBadge = document.getElementById('hud-mode-badge');
  const hudModeTitle = document.getElementById('hud-mode-title');
  const hudMyGems = document.getElementById('hud-my-gems');
  const hudEnemyGems = document.getElementById('hud-enemy-gems');
  const countdownPill = document.getElementById('countdown-pill');
  const cdTitle = document.getElementById('cd-title');
  const cdSec = document.getElementById('cd-sec');
  const showdownTracker = document.getElementById('showdown-tracker');
  const sdAlive = document.getElementById('sd-alive');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const btnBrawlerChange = document.getElementById('btn-brawler-change');

  const btnSuperSkill = document.getElementById('btn-super-skill');
  const superCircleFg = document.getElementById('super-circle-fg');

  // 모달 엘리먼트
  const startModal = document.getElementById('start-modal');
  const brawlerCards = document.querySelectorAll('.brawler-card');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const btnStartBattle = document.getElementById('btn-start-battle');

  const resultModal = document.getElementById('result-modal');
  const resIcon = document.getElementById('res-icon');
  const resTitle = document.getElementById('res-title');
  const resSubtitle = document.getElementById('res-subtitle');
  const resKills = document.getElementById('res-kills');
  const resGems = document.getElementById('res-gems');
  const resDamage = document.getElementById('res-damage');
  const btnRetryBattle = document.getElementById('btn-retry-battle');
  const btnChangeMode = document.getElementById('btn-change-mode');

  // 게임 설정
  let selectedBrawlerType = 'shelly'; // 'shelly', 'colt', 'el_primo'
  let selectedGameMode = 'gem_grab'; // 'gem_grab', 'showdown', 'brawl_ball'
  let isPlaying = false;
  let isAudioEnabled = true;

  // 통계
  let killsCount = 0;
  let totalDamageDealt = 0;

  // 아레나 맵 크기
  const MAP_W = 1600;
  const MAP_H = 1200;
  let cameraX = 0;
  let cameraY = 0;

  // 젬 그랩 카운트다운 타이머
  let countdownTimer = 15;
  let countdownLeadingTeam = null; // 'blue' or 'red'
  let countdownInterval = null;

  // 쇼다운 독가스 반경
  let poisonRadius = MAP_W;
  let poisonShrinkSpeed = 0.35;

  // Web Audio 사운드 신디사이저
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
    if (!isAudioEnabled) return;
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'shotgun') {
      for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220 - i * 30, now + i * 0.015);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.gain.setValueAtTime(0.3, now + i * 0.015);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.015);
        osc.stop(now + 0.1);
      }
    } else if (type === 'revolver') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'punch') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'super_shell') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'gem') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.06);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'victory') {
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          const ct = audioCtx.currentTime;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ct);
          gain.gain.setValueAtTime(0.3, ct);
          gain.gain.exponentialRampToValueAtTime(0.01, ct + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(ct);
          osc.stop(ct + 0.25);
        }, idx * 75);
      });
    }
  }

  // 🎵 오리지널 브롤스타즈 팡파레 BGM 시퀀서
  let bgmStep = 0;
  function startBrawlBGM() {
    stopBrawlBGM();
    if (!isAudioEnabled) return;
    initAudio();
    bgmStep = 0;

    const chords = [392.00, 440.00, 523.25, 659.25, 587.33, 440.00]; // G, A, C, E, D, A
    const bpm = 150;
    const intervalMs = (60 / bpm) * 250;

    bgmTimer = setInterval(() => {
      if (!audioCtx || !isPlaying || !isAudioEnabled) return;
      const t = audioCtx.currentTime;

      // 브롤 킥 베이스
      if (bgmStep % 4 === 0) {
        const kick = audioCtx.createOscillator();
        const kGain = audioCtx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(140, t);
        kick.frequency.exponentialRampToValueAtTime(35, t + 0.1);
        kGain.gain.setValueAtTime(0.4, t);
        kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        kick.connect(kGain);
        gainConnect(kick, kGain, t, 0.1);
      }

      // 브롤 팡파레 신스 리드
      const freq = chords[bgmStep % chords.length];
      const lead = audioCtx.createOscillator();
      const lGain = audioCtx.createGain();
      lead.type = 'triangle';
      lead.frequency.setValueAtTime(freq, t);
      lGain.gain.setValueAtTime(0.18, t);
      lGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
      gainConnect(lead, lGain, t, 0.14);

      bgmStep++;
    }, intervalMs);
  }

  function gainConnect(osc, gain, t, dur) {
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  function stopBrawlBGM() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  // 🗺️ 아레나 엔티티 컬렉션
  const brawlers = [];
  const bullets = [];
  const gems = [];
  const obstacles = [];
  const bushes = [];
  const particles = [];
  const floatingTexts = [];

  // 플레이어 객체 참조
  let player = null;

  // 브롤러 팩토리 (Shelly, Colt, El Primo)
  function createBrawler(type, team, x, y, isPlayer = false, name = 'Player') {
    let maxHp = 3800;
    let speed = 4.8;
    let color = (team === 'blue') ? '#38bdf8' : '#ef4444';
    let avatar = '🔫';

    if (type === 'colt') {
      maxHp = 2800;
      speed = 5.2;
      avatar = '🦅';
    } else if (type === 'el_primo') {
      maxHp = 6000;
      speed = 5.4;
      avatar = '🥊';
    }

    return {
      type: type,
      team: team,
      name: name,
      isPlayer: isPlayer,
      x: x,
      y: y,
      radius: 26,
      maxHp: maxHp,
      hp: maxHp,
      speed: speed,
      color: color,
      avatar: avatar,
      gems: 0,
      powerCubes: 0,
      superCharge: 0, // 0 ~ 100
      isSuperReady: false,
      isAlive: true,
      isInBush: false,
      regenTimer: 0,
      attackCooldown: 0,
      respawnTimer: 0,
      aimAngle: 0,
      vx: 0,
      vy: 0,

      attack(targetX, targetY, isSuper = false) {
        if (!this.isAlive || this.attackCooldown > 0) return;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.aimAngle = angle;
        this.regenTimer = 180; // 3초간 자연 회복 정지

        if (isSuper && this.isSuperReady) {
          this.superCharge = 0;
          this.isSuperReady = false;
          updateSuperUI();

          if (this.type === 'shelly') {
            // 🌟 쉘리 슈퍼 쉘 (9발의 대형 고위력 포탄 & 벽 파괴)
            playSound('super_shell');
            for (let i = -4; i <= 4; i++) {
              const spread = angle + (i * 0.08);
              bullets.push({
                owner: this,
                x: this.x + Math.cos(spread) * 30,
                y: this.y + Math.sin(spread) * 30,
                vx: Math.cos(spread) * 16,
                vy: Math.sin(spread) * 16,
                damage: 550 + (this.powerCubes * 100),
                range: 420,
                dist: 0,
                radius: 12,
                color: '#facc15',
                breaksWalls: true
              });
            }
          } else if (this.type === 'colt') {
            // 🌟 콜트 불렛 스톰 (12연발 고속 탄환 폭풍 & 벽 파괴)
            playSound('super_shell');
            for (let i = 0; i < 12; i++) {
              setTimeout(() => {
                if (!this.isAlive) return;
                bullets.push({
                  owner: this,
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(angle) * 20,
                  vy: Math.sin(angle) * 20,
                  damage: 420 + (this.powerCubes * 80),
                  range: 650,
                  dist: 0,
                  radius: 8,
                  color: '#38bdf8',
                  breaksWalls: true
                });
              }, i * 40);
            }
          } else if (this.type === 'el_primo') {
            // 🌟 엘 프리모 플라잉 엘보 드롭 (하늘로 도약 후 착지 지진 폭발)
            playSound('super_shell');
            spawnParticles(this.x, this.y, 25, '#ef4444');
            this.x = targetX;
            this.y = targetY;
            spawnParticles(this.x, this.y, 40, '#f97316');
            addFloatingText(this.x, this.y - 40, '💥 플라잉 엘보 드롭!', '#ef4444');

            // 주변 범위 피해 & 스턴
            brawlers.forEach(b => {
              if (b.isAlive && b.team !== this.team) {
                const dist = Math.hypot(b.x - this.x, b.y - this.y);
                if (dist < 140) {
                  b.takeDamage(1200 + (this.powerCubes * 200), this);
                }
              }
            });
          }

          this.attackCooldown = 30;
          return;
        }

        // 일반 공격
        if (this.type === 'shelly') {
          // 벅샷 (5발 산탄 펠릿)
          playSound('shotgun');
          for (let i = -2; i <= 2; i++) {
            const spread = angle + (i * 0.09);
            bullets.push({
              owner: this,
              x: this.x + Math.cos(spread) * 24,
              y: this.y + Math.sin(spread) * 24,
              vx: Math.cos(spread) * 14,
              vy: Math.sin(spread) * 14,
              damage: 320 + (this.powerCubes * 60),
              range: 350,
              dist: 0,
              radius: 6,
              color: '#fbbf24',
              breaksWalls: false
            });
          }
          this.attackCooldown = 28;

        } else if (this.type === 'colt') {
          // 6연발 리볼버 탄환 스트림
          playSound('revolver');
          for (let i = 0; i < 6; i++) {
            setTimeout(() => {
              if (!this.isAlive) return;
              bullets.push({
                owner: this,
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 17,
                vy: Math.sin(angle) * 17,
                damage: 280 + (this.powerCubes * 50),
                range: 520,
                dist: 0,
                radius: 5,
                color: '#60a5fa',
                breaksWalls: false
              });
            }, i * 50);
          }
          this.attackCooldown = 35;

        } else if (this.type === 'el_primo') {
          // 4연속 화염 펀치
          playSound('punch');
          for (let i = 0; i < 4; i++) {
            setTimeout(() => {
              if (!this.isAlive) return;
              bullets.push({
                owner: this,
                x: this.x + Math.cos(angle) * (15 + i * 8),
                y: this.y + Math.sin(angle) * (15 + i * 8),
                vx: Math.cos(angle) * 12,
                vy: Math.sin(angle) * 12,
                damage: 360 + (this.powerCubes * 70),
                range: 160,
                dist: 0,
                radius: 12,
                color: '#f97316',
                breaksWalls: false
              });
            }, i * 60);
          }
          this.attackCooldown = 30;
        }
      },

      takeDamage(dmg, attacker) {
        if (!this.isAlive) return;
        this.hp = Math.max(0, this.hp - dmg);
        this.regenTimer = 180;
        spawnParticles(this.x, this.y, 8, '#ef4444');
        addFloatingText(this.x, this.y - 30, `-${dmg}`, '#ef4444');

        if (attacker && attacker.isPlayer) {
          totalDamageDealt += dmg;
        }

        // 공격자 슈퍼 게이지 충전
        if (attacker) {
          attacker.superCharge = Math.min(100, attacker.superCharge + (dmg / attacker.maxHp) * 90);
          if (attacker.superCharge >= 100) {
            attacker.isSuperReady = true;
          }
          if (attacker.isPlayer) {
            updateSuperUI();
          }
        }

        if (this.hp <= 0) {
          this.die(attacker);
        }
      },

      die(killer) {
        this.isAlive = false;
        spawnParticles(this.x, this.y, 35, this.color);
        addFloatingText(this.x, this.y - 40, '💀 처치됨!', '#f43f5e');

        if (killer && killer.isPlayer) {
          killsCount++;
        }

        // 젬 / 파워 큐브 드롭
        const dropCount = Math.max(1, this.gems);
        for (let i = 0; i < dropCount; i++) {
          gems.push({
            x: this.x + (Math.random() - 0.5) * 40,
            y: this.y + (Math.random() - 0.5) * 40,
            type: selectedGameMode === 'showdown' ? 'power_cube' : 'gem'
          });
        }
        this.gems = 0;

        if (selectedGameMode === 'gem_grab') {
          this.respawnTimer = 240; // 4초 후 리스폰
        }

        updateScoreboard();
        checkGameStatus();
      }
    };
  }

  // 맵 및 지형 생성 (Walls & Bushes)
  function buildArenaMap() {
    obstacles.length = 0;
    bushes.length = 0;
    gems.length = 0;
    bullets.length = 0;
    particles.length = 0;
    floatingTexts.length = 0;

    // 외곽 벽
    const wallThickness = 40;
    obstacles.push({ x: 0, y: 0, w: MAP_W, h: wallThickness });
    obstacles.push({ x: 0, y: MAP_H - wallThickness, w: MAP_W, h: wallThickness });
    obstacles.push({ x: 0, y: 0, w: wallThickness, h: MAP_H });
    obstacles.push({ x: MAP_W - wallThickness, y: 0, w: wallThickness, h: MAP_H });

    // 중앙 젬 광산 주변 엄폐물 벽
    const blockW = 60;
    const centerLayout = [
      { x: MAP_W * 0.35, y: MAP_H * 0.35, w: 120, h: 60 },
      { x: MAP_W * 0.55, y: MAP_H * 0.35, w: 120, h: 60 },
      { x: MAP_W * 0.35, y: MAP_H * 0.6, w: 120, h: 60 },
      { x: MAP_W * 0.55, y: MAP_H * 0.6, w: 120, h: 60 },
      { x: MAP_W * 0.2, y: MAP_H * 0.48, w: 60, h: 140 },
      { x: MAP_W * 0.75, y: MAP_H * 0.48, w: 60, h: 140 }
    ];
    centerLayout.forEach(b => obstacles.push(b));

    // 🌿 수풀(Bushes) 패치 생성
    const bushPatches = [
      { x: MAP_W * 0.42, y: MAP_H * 0.45, w: 260, h: 120 },
      { x: MAP_W * 0.25, y: MAP_H * 0.25, w: 160, h: 100 },
      { x: MAP_W * 0.65, y: MAP_H * 0.25, w: 160, h: 100 },
      { x: MAP_W * 0.25, y: MAP_H * 0.7, w: 160, h: 100 },
      { x: MAP_W * 0.65, y: MAP_H * 0.7, w: 160, h: 100 }
    ];
    bushPatches.forEach(b => bushes.push(b));

    // 초기 젬 생성
    for (let i = 0; i < 4; i++) {
      gems.push({
        x: MAP_W / 2 + (Math.random() - 0.5) * 60,
        y: MAP_H / 2 + (Math.random() - 0.5) * 60,
        type: selectedGameMode === 'showdown' ? 'power_cube' : 'gem'
      });
    }
  }

  // 브롤러 팀 스폰 (3 vs 3 젬 그랩 / 8인 쇼다운)
  function spawnBrawlers() {
    brawlers.length = 0;

    if (selectedGameMode === 'gem_grab' || selectedGameMode === 'brawl_ball') {
      // 아군 3명 (플레이어 + 봇 2명)
      player = createBrawler(selectedBrawlerType, 'blue', MAP_W / 2, MAP_H * 0.85, true, '나 (Hero)');
      brawlers.push(player);

      brawlers.push(createBrawler('colt', 'blue', MAP_W * 0.4, MAP_H * 0.85, false, '아군 콜트'));
      brawlers.push(createBrawler('el_primo', 'blue', MAP_W * 0.6, MAP_H * 0.85, false, '아군 엘 프리모'));

      // 적군 3명
      brawlers.push(createBrawler('shelly', 'red', MAP_W / 2, MAP_H * 0.15, false, '적군 쉘리'));
      brawlers.push(createBrawler('colt', 'red', MAP_W * 0.4, MAP_H * 0.15, false, '적군 콜트'));
      brawlers.push(createBrawler('el_primo', 'red', MAP_W * 0.6, MAP_H * 0.15, false, '적군 엘 프리모'));

    } else if (selectedGameMode === 'showdown') {
      // 8인 배틀로얄 쇼다운
      player = createBrawler(selectedBrawlerType, 'blue', MAP_W / 2, MAP_H / 2, true, '나 (Hero)');
      brawlers.push(player);

      const spawnPoints = [
        { x: MAP_W * 0.2, y: MAP_H * 0.2 },
        { x: MAP_W * 0.8, y: MAP_H * 0.2 },
        { x: MAP_W * 0.2, y: MAP_H * 0.8 },
        { x: MAP_W * 0.8, y: MAP_H * 0.8 },
        { x: MAP_W * 0.15, y: MAP_H * 0.5 },
        { x: MAP_W * 0.85, y: MAP_H * 0.5 },
        { x: MAP_W * 0.5, y: MAP_H * 0.15 }
      ];

      const bTypes = ['shelly', 'colt', 'el_primo'];
      spawnPoints.forEach((sp, idx) => {
        const randType = bTypes[idx % bTypes.length];
        brawlers.push(createBrawler(randType, 'red', sp.x, sp.y, false, `봇 ${idx + 1}`));
      });
    }
  }

  // 슈퍼 게이지 UI 갱신
  function updateSuperUI() {
    if (!player) return;
    const pct = Math.min(100, Math.floor(player.superCharge));
    const offset = 283 - (283 * (pct / 100));
    superCircleFg.style.strokeDashoffset = offset;

    if (player.isSuperReady) {
      btnSuperSkill.classList.remove('disabled');
      btnSuperSkill.classList.add('ready');
    } else {
      btnSuperSkill.classList.remove('ready');
      btnSuperSkill.classList.add('disabled');
    }
  }

  // 스코어보드 갱신
  function updateScoreboard() {
    let blueGems = 0;
    let redGems = 0;

    brawlers.forEach(b => {
      if (b.isAlive) {
        if (b.team === 'blue') blueGems += b.gems;
        else redGems += b.gems;
      }
    });

    hudMyGems.textContent = blueGems;
    hudEnemyGems.textContent = redGems;

    if (selectedGameMode === 'gem_grab') {
      if (blueGems >= 10 && blueGems > redGems) {
        startCountdown('blue');
      } else if (redGems >= 10 && redGems > blueGems) {
        startCountdown('red');
      } else {
        stopCountdown();
      }
    } else if (selectedGameMode === 'showdown') {
      const aliveCount = brawlers.filter(b => b.isAlive).length;
      sdAlive.textContent = aliveCount;
    }
  }

  function startCountdown(team) {
    if (countdownLeadingTeam === team) return;
    countdownLeadingTeam = team;
    countdownTimer = 15;
    countdownPill.classList.remove('hidden');
    cdTitle.textContent = (team === 'blue') ? '아군 승리 카운트다운!' : '적군 승리 카운트다운!';
    cdSec.textContent = countdownTimer;

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      if (!isPlaying) return;
      countdownTimer--;
      cdSec.textContent = countdownTimer;

      if (countdownTimer <= 0) {
        clearInterval(countdownInterval);
        endBattle(countdownLeadingTeam === 'blue');
      }
    }, 1000);
  }

  function stopCountdown() {
    countdownLeadingTeam = null;
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    countdownPill.classList.add('hidden');
  }

  function checkGameStatus() {
    if (selectedGameMode === 'showdown') {
      if (!player.isAlive) {
        endBattle(false);
      } else {
        const aliveBots = brawlers.filter(b => b.isAlive && !b.isPlayer).length;
        if (aliveBots === 0) {
          endBattle(true);
        }
      }
    }
  }

  // 배틀 종료 (승리 / 패배)
  function endBattle(isVictory) {
    isPlaying = false;
    stopBrawlBGM();
    stopCountdown();

    if (isVictory) {
      playSound('victory');
      resIcon.textContent = '🏆 🌟 🎉 👑';
      resTitle.textContent = 'VICTORY! 승리!';
      resTitle.style.color = '#facc15';
      resSubtitle.textContent = '스타 플레이어에 등극했습니다! 완벽한 승리입니다.';
    } else {
      resIcon.textContent = '💀 💥 😭';
      resTitle.textContent = 'DEFEAT... 패배';
      resTitle.style.color = '#ef4444';
      resSubtitle.textContent = '아쉽게 패배했습니다. 다시 브롤러를 정비하여 도전하세요!';
    }

    resKills.textContent = `${killsCount} 킬`;
    resGems.textContent = `${player ? player.gems + player.powerCubes : 0} 개`;
    resDamage.textContent = `${totalDamageDealt.toLocaleString()} DMG`;

    resultModal.classList.remove('hidden');
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
      vy: -1.8,
      decay: 0.02
    });
  }

  // 게임 시작
  function startBrawlArena() {
    initAudio();
    isPlaying = true;
    killsCount = 0;
    totalDamageDealt = 0;
    poisonRadius = MAP_W;

    startModal.classList.add('hidden');
    resultModal.classList.add('hidden');

    if (selectedGameMode === 'gem_grab') {
      hudModeBadge.textContent = '💎 젬 그랩';
      hudModeTitle.textContent = '보석 10개를 모아 15초 카운트다운 동안 생존하세요!';
      document.getElementById('gem-scoreboard').classList.remove('hidden');
      showdownTracker.classList.add('hidden');
    } else if (selectedGameMode === 'showdown') {
      hudModeBadge.textContent = '💀 솔로 쇼다운';
      hudModeTitle.textContent = '독가스를 피해 상자를 부수고 마지막 1인이 되세요!';
      document.getElementById('gem-scoreboard').classList.add('hidden');
      showdownTracker.classList.remove('hidden');
    } else {
      hudModeBadge.textContent = '⚽ 브롤 볼';
      hudModeTitle.textContent = '축구공을 차서 상대 골대에 2골을 먼저 넣으세요!';
    }

    buildArenaMap();
    spawnBrawlers();
    updateSuperUI();
    updateScoreboard();
    startBrawlBGM();
  }

  // 키보드 & 마우스 조작
  const keys = {};
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('keydown', (e) => {
    initAudio();
    keys[e.code] = true;

    if (isPlaying && player && player.isAlive) {
      if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        const worldMouseX = mouseX + cameraX;
        const worldMouseY = mouseY + cameraY;
        player.attack(worldMouseX, worldMouseY, true);
      } else if (e.code === 'Space') {
        e.preventDefault();
        const worldMouseX = mouseX + cameraX;
        const worldMouseY = mouseY + cameraY;
        player.attack(worldMouseX, worldMouseY, false);
      } else if (e.code === 'KeyR') {
        startBrawlArena();
      }
    } else if (!isPlaying && (e.code === 'Space' || e.code === 'Enter')) {
      if (!startModal.classList.contains('hidden')) startBrawlArena();
      else if (!resultModal.classList.contains('hidden')) startBrawlArena();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  canvas.addEventListener('mousedown', (e) => {
    initAudio();
    if (isPlaying && player && player.isAlive) {
      const worldMouseX = mouseX + cameraX;
      const worldMouseY = mouseY + cameraY;
      player.attack(worldMouseX, worldMouseY, false);
    }
  });

  btnSuperSkill.addEventListener('click', () => {
    if (isPlaying && player && player.isAlive) {
      const worldMouseX = mouseX + cameraX;
      const worldMouseY = mouseY + cameraY;
      player.attack(worldMouseX, worldMouseY, true);
    }
  });

  // 모달 버튼 핸들러
  brawlerCards.forEach(card => {
    card.addEventListener('click', () => {
      brawlerCards.forEach(c => {
        c.classList.remove('active');
        c.querySelector('.select-badge').textContent = '선택';
      });
      card.classList.add('active');
      card.querySelector('.select-badge').textContent = '선택됨';
      selectedBrawlerType = card.dataset.brawler;
    });
  });

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedGameMode = tab.dataset.mode;
    });
  });

  btnStartBattle.addEventListener('click', startBrawlArena);
  btnRetryBattle.addEventListener('click', startBrawlArena);
  btnChangeMode.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    startModal.classList.remove('hidden');
  });
  btnBrawlerChange.addEventListener('click', () => {
    startModal.classList.remove('hidden');
  });

  btnAudioToggle.addEventListener('click', () => {
    isAudioEnabled = !isAudioEnabled;
    btnAudioToggle.textContent = isAudioEnabled ? '🔊 사운드 ON' : '🔇 사운드 OFF';
    if (!isAudioEnabled) stopBrawlBGM();
    else if (isPlaying) startBrawlBGM();
  });

  // 리사이징
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);

  // 메인 배틀 게임 루프 (60FPS)
  function battleLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPlaying && player) {
      // 1. 플레이어 이동 처리
      let moveX = 0;
      let moveY = 0;
      if (keys.KeyW || keys.ArrowUp) moveY -= 1;
      if (keys.KeyS || keys.ArrowDown) moveY += 1;
      if (keys.KeyA || keys.ArrowLeft) moveX -= 1;
      if (keys.KeyD || keys.ArrowRight) moveX += 1;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      if (player.isAlive) {
        player.x = Math.max(player.radius + 40, Math.min(MAP_W - player.radius - 40, player.x + moveX * player.speed));
        player.y = Math.max(player.radius + 40, Math.min(MAP_H - player.radius - 40, player.y + moveY * player.speed));
      }

      // 카메라 스무스 트래킹
      cameraX = player.x - canvas.width / 2;
      cameraY = player.y - canvas.height / 2;
      cameraX = Math.max(0, Math.min(MAP_W - canvas.width, cameraX));
      cameraY = Math.max(0, Math.min(MAP_H - canvas.height, cameraY));
    }

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // 2. 아레나 바닥 텍스처 & 격자 렌더링
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < MAP_W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, MAP_H);
      ctx.stroke();
    }
    for (let y = 0; y < MAP_H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(MAP_W, y);
      ctx.stroke();
    }

    // 젬 광산 중앙 홀
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(MAP_W / 2, MAP_H / 2, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. 🌿 수풀(Bushes) 렌더링
    bushes.forEach(b => {
      ctx.save();
      ctx.fillStyle = '#15803d';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });

    // 4. 🧱 장애물 벽 렌더링
    obstacles.forEach(ob => {
      ctx.save();
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);
      ctx.restore();
    });

    // 5. 💎 바닥에 드롭된 보석(Gems) 렌더링 & 획득 처리
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];

      // 반짝이는 네온 보석
      ctx.save();
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = (g.type === 'power_cube') ? '#facc15' : '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.fillText((g.type === 'power_cube') ? '📦' : '💎', g.x, g.y);
      ctx.restore();

      // 브롤러들의 보석 획득 판정
      brawlers.forEach(b => {
        if (b.isAlive && Math.hypot(b.x - g.x, b.y - g.y) < b.radius + 15) {
          if (g.type === 'power_cube') {
            b.powerCubes++;
            b.hp = Math.min(b.maxHp, b.hp + 400);
            addFloatingText(b.x, b.y - 30, '+1 파워 큐브!', '#facc15');
          } else {
            b.gems++;
            playSound('gem');
            addFloatingText(b.x, b.y - 30, '+1 💎', '#38bdf8');
          }
          gems.splice(i, 1);
          updateScoreboard();
        }
      });
    }

    // 6. 탄환(Bullets) 물리 & 충돌 처리
    for (let i = bullets.length - 1; i >= 0; i--) {
      const blt = bullets[i];
      blt.x += blt.vx;
      blt.y += blt.vy;
      blt.dist += Math.hypot(blt.vx, blt.vy);

      // 탄환 렌더링
      ctx.save();
      ctx.fillStyle = blt.color;
      ctx.shadowColor = blt.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(blt.x, blt.y, blt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 사거리 초과 시 소멸
      if (blt.dist >= blt.range) {
        bullets.splice(i, 1);
        continue;
      }

      // 벽과의 충돌 처리
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const ob = obstacles[j];
        if (blt.x > ob.x && blt.x < ob.x + ob.w && blt.y > ob.y && blt.y < ob.y + ob.h) {
          if (blt.breaksWalls && j >= 4) {
            // 슈퍼 궁극기로 벽 파괴!
            spawnParticles(ob.x + ob.w / 2, ob.y + ob.h / 2, 20, '#64748b');
            obstacles.splice(j, 1);
          }
          bullets.splice(i, 1);
          break;
        }
      }

      // 적 브롤러와의 피격 충돌 처리
      brawlers.forEach(b => {
        if (b.isAlive && b.team !== blt.owner.team) {
          const dist = Math.hypot(b.x - blt.x, b.y - blt.y);
          if (dist < b.radius + blt.radius) {
            b.takeDamage(blt.damage, blt.owner);
            bullets.splice(i, 1);
          }
        }
      });
    }

    // 7. 브롤러 AI 및 렌더링
    brawlers.forEach(b => {
      if (!b.isAlive) {
        if (b.respawnTimer > 0) {
          b.respawnTimer--;
          if (b.respawnTimer <= 0) {
            b.isAlive = true;
            b.hp = b.maxHp;
            b.x = (b.team === 'blue') ? MAP_W / 2 : MAP_W / 2;
            b.y = (b.team === 'blue') ? MAP_H * 0.85 : MAP_H * 0.15;
            spawnParticles(b.x, b.y, 20, b.color);
            updateScoreboard();
          }
        }
        return;
      }

      // 쿨다운 & 자연 회복 처리
      if (b.attackCooldown > 0) b.attackCooldown--;
      if (b.regenTimer > 0) {
        b.regenTimer--;
      } else {
        b.hp = Math.min(b.maxHp, b.hp + 20); // 초당 자연 회복
      }

      // 수풀 은신 체크
      b.isInBush = false;
      bushes.forEach(bush => {
        if (b.x > bush.x && b.x < bush.x + bush.w && b.y > bush.y && b.y < bush.y + bush.h) {
          b.isInBush = true;
        }
      });

      // AI 봇 로직
      if (!b.isPlayer && isPlaying) {
        // 가장 가까운 적 찾기
        let nearestEnemy = null;
        let minDist = 9999;

        brawlers.forEach(other => {
          if (other.isAlive && other.team !== b.team && (!other.isInBush || Math.hypot(other.x - b.x, other.y - b.y) < 160)) {
            const dist = Math.hypot(other.x - b.x, other.y - b.y);
            if (dist < minDist) {
              minDist = dist;
              nearestEnemy = other;
            }
          }
        });

        // 체력이 낮으면 후퇴 / 도망
        if (b.hp < b.maxHp * 0.35) {
          if (nearestEnemy) {
            const escapeAngle = Math.atan2(b.y - nearestEnemy.y, b.x - nearestEnemy.x);
            b.x += Math.cos(escapeAngle) * b.speed;
            b.y += Math.sin(escapeAngle) * b.speed;
          }
        } else if (nearestEnemy) {
          const chaseAngle = Math.atan2(nearestEnemy.y - b.y, nearestEnemy.x - b.x);
          const idealDist = (b.type === 'el_primo') ? 80 : 280;

          if (minDist > idealDist) {
            b.x += Math.cos(chaseAngle) * b.speed;
            b.y += Math.sin(chaseAngle) * b.speed;
          }

          if (minDist < 450 && Math.random() < 0.08) {
            b.attack(nearestEnemy.x, nearestEnemy.y, b.isSuperReady);
          }
        } else {
          // 중앙 보석 광산으로 이동
          const toCenter = Math.atan2(MAP_H / 2 - b.y, MAP_W / 2 - b.x);
          b.x += Math.cos(toCenter) * (b.speed * 0.6);
          b.y += Math.sin(toCenter) * (b.speed * 0.6);
        }
      }

      // 브롤러 렌더링
      ctx.save();
      if (b.isInBush && !b.isPlayer && b.team !== player.team) {
        ctx.globalAlpha = 0; // 적군 수풀 은신 시 투명
      } else if (b.isInBush) {
        ctx.globalAlpha = 0.55;
      }

      // 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + b.radius * 0.8, b.radius, b.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // 브롤러 원형 바디
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 아바타 아이콘
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.avatar, b.x, b.y + 7);

      // HP 게이지 바
      const hpPct = Math.max(0, b.hp / b.maxHp);
      const barW = 54;
      const barH = 7;
      const barX = b.x - barW / 2;
      const barY = b.y - b.radius - 16;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = (b.team === 'blue') ? '#22c55e' : '#ef4444';
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // 이름 & 보유 젬 뱃지
      ctx.font = '700 11px "Noto Sans KR", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fillText(`${b.name} ${b.gems > 0 ? '💎' + b.gems : ''}`, b.x, barY - 4);

      ctx.restore();
    });

    // 8. 쇼다운 독가스 렌더링
    if (selectedGameMode === 'showdown') {
      poisonRadius = Math.max(180, poisonRadius - poisonShrinkSpeed);
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(MAP_W / 2, MAP_H / 2, poisonRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 독가스 외부 피해 체크
      brawlers.forEach(b => {
        if (b.isAlive && Math.hypot(b.x - MAP_W / 2, b.y - MAP_H / 2) > poisonRadius) {
          b.takeDamage(12, null);
        }
      });
      ctx.restore();
    }

    // 9. 파티클 및 플로팅 텍스트 렌더링
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

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;

      ctx.save();
      ctx.font = '900 13px "Noto Sans KR", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    ctx.restore();

    requestAnimationFrame(battleLoop);
  }

  // 초기화 & 첫 루프 실행
  resizeCanvas();
  battleLoop();
});
