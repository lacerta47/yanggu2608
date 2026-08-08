/**
 * [초고퀄리티] 고양이 키우기 힐링 게임 (v3)
 * All Class/Function/Variable names in English.
 * All UI labels, dialogue, thoughts, and notifications in Korean.
 */

// --- Web Audio Synthesizer & BGM Player ---
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.isBgmOn = true;
    this.bgmTimer = null;
    this.chordIndex = 0;

    // Soothing 4-chord progression (Cmaj7 -> Am7 -> Dm7 -> G7)
    this.bgmChords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [196.00, 246.94, 293.66, 349.23]  // G7
    ];
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.startBgmLoop();
  }

  playTone(frequency, type, duration, startVol = 0.25, endVol = 0.001) {
    if (this.isMuted || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(startVol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(endVol, 0.001), this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  }

  // Realistic Cat Meow (Modulated pitch glide)
  playMeowSound() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      const now = this.audioCtx.currentTime;

      // Meow pitch curve: 420Hz -> 650Hz -> 380Hz
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  // Real Purr Sound (Low frequency warm rumble)
  playPurrSound() {
    if (this.isMuted || !this.audioCtx) return;
    for (let i = 0; i < 8; i++) {
      setTimeout(() => this.playTone(110 + Math.random() * 20, 'sine', 0.25, 0.12), i * 220);
    }
  }

  // 뿅! (해금 알림)
  playPyongSound() {
    if (this.isMuted || !this.audioCtx) return;
    this.playTone(620, 'sine', 0.1, 0.3);
    setTimeout(() => this.playTone(930, 'sine', 0.15, 0.4), 70);
  }

  // 물소리
  playWaterSound() {
    if (this.isMuted || !this.audioCtx) return;
    for (let i = 0; i < 10; i++) {
      setTimeout(() => this.playTone(350 + Math.random() * 350, 'sine', 0.1, 0.08), i * 140);
    }
  }

  // BGM Loop
  startBgmLoop() {
    if (this.bgmTimer) return;
    this.bgmTimer = setInterval(() => {
      if (this.isBgmOn && !this.isMuted && this.audioCtx) {
        const chord = this.bgmChords[this.chordIndex];
        this.chordIndex = (this.chordIndex + 1) % this.bgmChords.length;

        chord.forEach((freq, idx) => {
          setTimeout(() => {
            this.playTone(freq, 'sine', 1.4, 0.06);
          }, idx * 120);
        });
      }
    }, 1800);
  }

  toggleBgm() {
    this.isBgmOn = !this.isBgmOn;
    return this.isBgmOn;
  }
}

// --- Floating Particle ---
class FloatingParticle {
  constructor(x, y, text, color = '#ff4081') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1;
    this.vy = -1.2;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.012;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 20px Gaegu, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// --- Main Game Engine ---
class CatHealingGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.soundManager = new SoundManager();

    // DOM Screens & Elements
    this.startScreen = document.getElementById('start-screen');
    this.selectScreen = document.getElementById('select-screen');
    this.mainScreen = document.getElementById('main-screen');
    this.victoryModal = document.getElementById('victory-modal');

    this.catNameInput = document.getElementById('cat-name-input');
    this.displayCatName = document.getElementById('display-cat-name');
    this.displayCatBreed = document.getElementById('display-cat-breed');
    this.displayCatAge = document.getElementById('display-cat-age');
    this.bgmToggleBtn = document.getElementById('bgm-toggle-btn');

    this.gaugeHunger = document.getElementById('gauge-hunger');
    this.gaugeThirst = document.getElementById('gauge-thirst');
    this.gaugeBoredom = document.getElementById('gauge-boredom');
    this.thoughtText = document.getElementById('thought-text');

    this.extraMenu = document.getElementById('extra-menu');
    this.dressroomPanel = document.getElementById('dressroom-panel');
    this.sceneDoneContainer = document.getElementById('scene-done-container');
    this.sceneDoneBtn = document.getElementById('scene-done-btn');

    this.unlockToast = document.getElementById('unlock-toast');
    this.toastMessage = document.getElementById('toast-message');

    this.dayNightBtn = document.getElementById('day-night-btn');

    // Cat Customization & Breed Colors
    this.selectedBreed = 'siamese';
    this.catName = '야옹이';
    this.breedNames = {
      siamese: '샴',
      persian: '페르시안',
      korean: '코리안 숏헤어',
      ragdoll: '렉돌',
      russian: '러시안 블루'
    };

    this.breedColors = {
      siamese: { body: '#f5e6d3', accent: '#4a3b32', ear: '#3d2e25', eye: '#339af0' },
      persian: { body: '#ffffff', accent: '#f8f9fa', ear: '#ffe3e8', eye: '#ffd43b' },
      korean: { body: '#ff922b', accent: '#ffffff', ear: '#ffc078', eye: '#51cf66' },
      ragdoll: { body: '#f8f9fa', accent: '#a5d8ff', ear: '#74c0fc', eye: '#4c6ef5' },
      russian: { body: '#868e96', accent: '#495057', ear: '#ced4da', eye: '#20c997' }
    };

    // Game State
    this.hunger = 100;
    this.thirst = 100;
    this.boredom = 100;

    this.age = 0;
    this.gameTimeSeconds = 0;
    this.isNight = false;

    // Current Scene: 'BEDROOM', 'DRESSROOM', 'PARK', 'BATHROOM'
    this.currentScene = 'BEDROOM';

    // Cat Position & Action States
    this.catX = 400;
    this.catY = 380;
    this.catVx = 0;
    this.catVy = 0;
    this.isGrounded = true;

    this.catAction = 'IDLE'; // 'IDLE', 'JUMP', 'ROLL', 'SLEEP', 'BATH', 'BRUSH', 'WALK', 'LIE_DOWN'
    this.actionTimer = 0;
    this.rollAngle = 0;

    this.clothingIndex = 0; // 0: None, 1: Ribbon, 2: Hat, 3: Crown, 4: Glasses

    // Unlocked features (1 minute = 60s per feature)
    this.unlockedFeatures = [false, false, false, false, false];
    this.featureNames = ['드레스룸 이동', '분수대 공원 산책', '목욕실 이동', '털 빗어주기', '장난치기'];

    this.kittens = [];
    this.hasBred = false;

    this.particles = [];
    this.keys = { left: false, right: false, up: false, down: false };

    // Bath Animation Step (0: None, 1: Bubbles 2s, 2: Water 2s, 3: Shake 3s)
    this.bathStep = 0;

    // Fountain animation particles
    this.fountainParticles = [];

    this.initEvents();
  }

  initEvents() {
    // Breed selection
    const breedCards = document.querySelectorAll('.breed-card');
    breedCards.forEach(card => {
      card.addEventListener('click', () => {
        breedCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedBreed = card.dataset.breed;
      });
    });

    // Start Button
    document.getElementById('start-game-btn').addEventListener('click', () => {
      this.soundManager.init();
      this.startScreen.classList.remove('active');
      this.startScreen.classList.add('hidden');
      this.selectScreen.classList.remove('hidden');
      this.selectScreen.classList.add('active');
    });

    // Confirm Selection & Name
    document.getElementById('confirm-select-btn').addEventListener('click', () => {
      const enteredName = this.catNameInput.value.trim();
      if (enteredName) this.catName = enteredName;

      this.selectScreen.classList.remove('active');
      this.selectScreen.classList.add('hidden');
      this.mainScreen.classList.remove('hidden');
      this.mainScreen.classList.add('active');

      this.displayCatName.textContent = this.catName;
      this.displayCatBreed.textContent = `(${this.breedNames[this.selectedBreed]})`;
      this.startMainGameLoop();
    });

    // BGM Toggle Button (Under Cat Name)
    this.bgmToggleBtn.addEventListener('click', () => {
      const isOn = this.soundManager.toggleBgm();
      this.bgmToggleBtn.textContent = isOn ? '🎵 BGM ON' : '🔇 BGM OFF';
    });

    // Keyboard Control
    window.addEventListener('keydown', (e) => {
      this.soundManager.init();
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!this.keys.up) this.performJump();
        this.keys.up = true;
      }

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (!this.keys.down) this.performRoll();
        this.keys.down = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
    });

    // Canvas Mouse Click
    this.canvas.addEventListener('click', (e) => {
      this.soundManager.init();
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const dist = Math.hypot(clickX - this.catX, clickY - (this.catY - 30));
      if (dist < 65) {
        this.soundManager.playMeowSound();
        this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '야옹~ 💕', '#ff4081'));
      }
    });

    // Bottom Care Action Buttons
    document.getElementById('btn-feed').addEventListener('click', () => this.feedCat());
    document.getElementById('btn-water').addEventListener('click', () => this.giveWater());
    document.getElementById('btn-play').addEventListener('click', () => this.playWithCat());

    // Hamburger Menu
    document.getElementById('btn-menu').addEventListener('click', () => {
      this.extraMenu.classList.toggle('hidden');
    });

    document.getElementById('close-menu-btn').addEventListener('click', () => {
      this.extraMenu.classList.add('hidden');
    });

    // Day / Night Toggle
    this.dayNightBtn.addEventListener('click', () => this.toggleDayNight());

    // Menu Unlocked Items
    document.getElementById('btn-clothes').addEventListener('click', () => this.goToDressRoom());
    document.getElementById('btn-walk').addEventListener('click', () => this.goToPark());
    document.getElementById('btn-bath').addEventListener('click', () => this.goToBathroom());
    document.getElementById('btn-brush').addEventListener('click', () => this.startBrush());
    document.getElementById('btn-tease').addEventListener('click', () => this.teaseCat());

    // Scene Done Button ("완성! 침실로 돌아가기")
    this.sceneDoneBtn.addEventListener('click', () => this.returnToBedroom());

    // Dress Room Items
    document.querySelectorAll('.dress-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dress-item-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.clothingIndex = parseInt(btn.dataset.outfit, 10);
      });
    });

    // Victory Modal Buttons
    document.getElementById('btn-restart').addEventListener('click', () => window.location.reload());
    document.getElementById('btn-continue').addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
    });
  }

  startMainGameLoop() {
    setInterval(() => this.updateTimeAndDecay(), 1000);
    this.renderLoop();
  }

  updateTimeAndDecay() {
    this.gameTimeSeconds++;

    // Age +1 year every 5 minutes (300s)
    const newAge = Math.floor(this.gameTimeSeconds / 300);
    if (newAge !== this.age) {
      this.age = newAge;
      this.updateAgeDisplay();

      // Check 5 years old breeding condition
      if (this.age >= 5 && !this.hasBred) {
        this.triggerBreedingSuccess();
      }
    }

    // Feature unlocks (1m per feature)
    for (let i = 0; i < 5; i++) {
      const unlockTime = (i + 1) * 60;
      if (this.gameTimeSeconds >= unlockTime && !this.unlockedFeatures[i]) {
        this.unlockedFeatures[i] = true;
        this.showUnlockNotification(this.featureNames[i]);
        this.updateMenuButtonsUI();
      }
    }

    // Decay rate
    const decayRate = 0.4 + (this.age * 0.1);
    this.hunger = Math.max(0, this.hunger - decayRate);
    this.thirst = Math.max(0, this.thirst - decayRate);
    this.boredom = Math.max(0, this.boredom - decayRate);

    this.updateGaugesUI();
    this.updateCatThought();
  }

  updateAgeDisplay() {
    let ageStage = '아기';
    if (this.age >= 1 && this.age < 3) ageStage = '청소년';
    else if (this.age >= 3) ageStage = '어른';

    this.displayCatAge.textContent = `${this.age}살 (${ageStage})`;
  }

  updateGaugesUI() {
    this.gaugeHunger.style.width = `${this.hunger}%`;
    this.gaugeThirst.style.width = `${this.thirst}%`;
    this.gaugeBoredom.style.width = `${this.boredom}%`;

    // Tears when ALL gauges drop to 0%
    if (this.hunger === 0 && this.thirst === 0 && this.boredom === 0) {
      if (Math.random() < 0.25) {
        this.soundManager.playMeowSound();
        this.particles.push(new FloatingParticle(this.catX - 10, this.catY - 40, '💧 눈물 뚝뚝...', '#339af0'));
      }
    }
  }

  updateCatThought() {
    const minGauge = Math.min(this.hunger, this.thirst, this.boredom);

    if (this.hunger === 0 && this.thirst === 0 && this.boredom === 0) {
      this.thoughtText.textContent = '슬퍼요... 뚝뚝 (모든 욕구가 0%) 😿';
    } else if (this.hunger === 100 && this.thirst === 100 && this.boredom === 100) {
      this.thoughtText.textContent = '완벽하게 만복해요! 고롱고롱~ 💕';
    } else if (minGauge < 30) {
      if (this.hunger < 30) this.thoughtText.textContent = '배가 너무 고파요... 🍚';
      else if (this.thirst < 30) this.thoughtText.textContent = '목이 많이 마르네요... 💧';
      else this.thoughtText.textContent = '너무 너무 심심해요... ⚽';
    } else {
      this.thoughtText.textContent = '기분 좋게 지내고 있어요! 야옹~';
    }
  }

  showUnlockNotification(featureName) {
    this.soundManager.playPyongSound();
    this.toastMessage.textContent = `🎉 [${featureName}] 기능이 해금되었어요!`;
    this.unlockToast.classList.remove('hidden');

    setTimeout(() => {
      this.unlockToast.classList.add('hidden');
    }, 4000);
  }

  updateMenuButtonsUI() {
    const btnIds = ['btn-clothes', 'btn-walk', 'btn-bath', 'btn-brush', 'btn-tease'];
    btnIds.forEach((id, idx) => {
      const btn = document.getElementById(id);
      if (this.unlockedFeatures[idx]) {
        btn.classList.remove('locked');
        btn.classList.add('unlocked');
        btn.innerHTML = `✨ ${this.featureNames[idx]} <span class="unlock-timer">(해금 완료)</span>`;
      } else {
        const remainingSec = Math.max(0, (idx + 1) * 60 - this.gameTimeSeconds);
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        btn.innerHTML = `🔒 ${this.featureNames[idx]} <span class="unlock-timer">(${timeStr} 남음)</span>`;
      }
    });
  }

  // --- Care Actions ---
  feedCat() {
    this.hunger = Math.min(100, this.hunger + 40);
    this.checkAllGaugesFilled();
  }

  giveWater() {
    this.thirst = Math.min(100, this.thirst + 40);
    this.checkAllGaugesFilled();
  }

  playWithCat() {
    this.boredom = Math.min(100, this.boredom + 40);
    this.checkAllGaugesFilled();
  }

  // ALL THREE GAUGES 100% -> Purr for 5s with floating hearts!
  checkAllGaugesFilled() {
    if (this.hunger === 100 && this.thirst === 100 && this.boredom === 100) {
      this.soundManager.playPurrSound();
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.particles.push(new FloatingParticle(
            this.catX + (Math.random() * 50 - 25),
            this.catY - 70 - i * 15,
            '❤️ 고롱고롱~ (5초)',
            '#ff4081'
          ));
        }, i * 1000);
      }
    }
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    if (this.isNight) {
      this.dayNightBtn.textContent = '🌙 밤';
      this.catAction = 'SLEEP';
      // Go to bed position (bed starts at x=550)
      this.catX = 640;
      this.catY = 320;
      this.particles.push(new FloatingParticle(this.catX, this.catY - 50, '💤 zzz...', '#a5d8ff'));

      // Sleep on bed for 5 seconds, then return back to floor
      setTimeout(() => {
        this.isNight = false;
        this.dayNightBtn.textContent = '☀️ 낮';
        this.catAction = 'IDLE';
        this.catX = 400;
        this.catY = 380;
      }, 5000);
    } else {
      this.dayNightBtn.textContent = '☀️ 낮';
      this.catAction = 'IDLE';
      this.catX = 400;
      this.catY = 380;
    }
  }

  // --- Sub-scene Transitions ---
  goToDressRoom() {
    if (!this.unlockedFeatures[0]) return;
    this.currentScene = 'DRESSROOM';
    this.dressroomPanel.classList.remove('hidden');
    this.sceneDoneContainer.classList.remove('hidden');
    this.extraMenu.classList.add('hidden');
    this.catX = 425;
    this.catY = 360;
  }

  goToPark() {
    if (!this.unlockedFeatures[1]) return;
    this.currentScene = 'PARK';
    this.sceneDoneContainer.classList.remove('hidden');
    this.extraMenu.classList.add('hidden');
    this.boredom = 100;
    this.checkAllGaugesFilled();
    this.catX = 425;
    this.catY = 380;
  }

  goToBathroom() {
    if (!this.unlockedFeatures[2]) return;
    this.currentScene = 'BATHROOM';
    this.sceneDoneContainer.classList.remove('hidden');
    this.extraMenu.classList.add('hidden');
    this.catX = 425;
    this.catY = 370;

    // Bath sequence: 2s Bubbles -> 2s Water Spray -> 3s Body Shake -> Auto return to bedroom
    this.catAction = 'BATH';
    this.bathStep = 1; // Bubbles
    this.soundManager.playWaterSound();
    this.soundManager.playMeowSound();
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '🛁 냥~ 목욕해요!', '#339af0'));

    setTimeout(() => {
      this.bathStep = 2; // Water spray
      this.soundManager.playWaterSound();
      setTimeout(() => {
        this.bathStep = 3; // Body Shake (3s)
        setTimeout(() => {
          this.bathStep = 0;
          this.catAction = 'IDLE';
          this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '✨ 보송보송 깨끗해요!', '#339af0'));
        }, 3000);
      }, 2000);
    }, 2000);
  }

  returnToBedroom() {
    this.currentScene = 'BEDROOM';
    this.dressroomPanel.classList.add('hidden');
    this.sceneDoneContainer.classList.add('hidden');
    this.catAction = 'IDLE';
    this.catX = 400;
    this.catY = 380;
  }

  // Brush Fur: Cat lies down horizontally for 5s with sparkles ✨
  startBrush() {
    if (!this.unlockedFeatures[3]) return;
    this.catAction = 'LIE_DOWN';
    this.soundManager.playPurrSound();
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '✨ 편하게 누워서 털 빗기~', '#ffd43b'));
    this.extraMenu.classList.add('hidden');

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.particles.push(new FloatingParticle(
          this.catX + (Math.random() * 60 - 30),
          this.catY - 30 + (Math.random() * 30 - 15),
          '✨', '#ffd43b'
        ));
      }, i * 600);
    }

    setTimeout(() => {
      if (this.catAction === 'LIE_DOWN') this.catAction = 'IDLE';
    }, 5000);
  }

  teaseCat() {
    if (!this.unlockedFeatures[4]) return;
    this.boredom = 100;
    this.checkAllGaugesFilled();
    this.performJump();
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '🎾 야옹! 신나게 점프!', '#ff922b'));
    this.extraMenu.classList.add('hidden');
  }

  performJump() {
    if (this.isGrounded && this.catAction !== 'SLEEP') {
      this.catVy = -11;
      this.isGrounded = false;
      this.catAction = 'JUMP';
    }
  }

  performRoll() {
    if (this.catAction !== 'SLEEP') {
      this.catAction = 'ROLL';
      this.actionTimer = 180; // 3s
      this.rollAngle = 0;
      this.particles.push(new FloatingParticle(this.catX, this.catY - 50, '🌀 뒹굴뒹굴~ (3초)', '#ff85a2'));
    }
  }

  triggerBreedingSuccess() {
    this.hasBred = true;
    const kittenCount = Math.floor(Math.random() * 4) + 1;

    this.kittens = [];
    for (let i = 0; i < kittenCount; i++) {
      this.kittens.push({
        x: 180 + i * 75,
        y: 400,
        color: this.breedColors[this.selectedBreed].body
      });
    }

    document.getElementById('kittens-display').textContent = '🐱'.repeat(kittenCount);
    document.getElementById('victory-summary').textContent = 
      `당신의 헌신적인 사랑 덕분에 ${this.catName}이가 건강하게 5살이 되어 귀여운 아기 고양이 ${kittenCount}마리를 낳았어요! 🎉`;

    this.victoryModal.classList.remove('hidden');
  }

  renderLoop() {
    this.updatePhysics();
    this.drawScene();
    requestAnimationFrame(() => this.renderLoop());
  }

  updatePhysics() {
    if (this.catAction !== 'SLEEP' && this.catAction !== 'ROLL' && this.catAction !== 'LIE_DOWN') {
      if (this.keys.left) this.catX -= 4;
      if (this.keys.right) this.catX += 4;
    }

    this.catX = Math.max(80, Math.min(770, this.catX));

    if (!this.isGrounded) {
      this.catY += this.catVy;
      this.catVy += 0.55;

      if (this.catY >= 380) {
        this.catY = 380;
        this.catVy = 0;
        this.isGrounded = true;
        if (this.catAction === 'JUMP') this.catAction = 'IDLE';
      }
    }

    if (this.catAction === 'ROLL') {
      this.rollAngle += 0.15;
      this.actionTimer--;
      if (this.actionTimer <= 0) {
        this.catAction = 'IDLE';
        this.rollAngle = 0;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    this.kittens.forEach(k => {
      k.x += (Math.random() * 2 - 1);
      k.x = Math.max(120, Math.min(750, k.x));
    });
  }

  drawScene() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentScene === 'BEDROOM') {
      this.drawBedroom();
    } else if (this.currentScene === 'DRESSROOM') {
      this.drawDressRoomBackground();
    } else if (this.currentScene === 'PARK') {
      this.drawParkBackground();
    } else if (this.currentScene === 'BATHROOM') {
      this.drawBathroomBackground();
    }

    if (this.currentScene === 'BEDROOM') {
      this.kittens.forEach(k => this.drawKitten(k.x, k.y));
    }

    this.drawMainCat();

    if (this.catAction === 'BATH') {
      this.drawBathEffects();
    }

    this.particles.forEach(p => p.draw(this.ctx));
  }

  // --- Bedroom Scene ---
  drawBedroom() {
    // Wall
    this.ctx.fillStyle = this.isNight ? '#101426' : '#fff4e6';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Floor
    this.ctx.fillStyle = this.isNight ? '#2b1d14' : '#e6ba95';
    this.ctx.fillRect(0, 420, this.canvas.width, 100);
    this.ctx.fillStyle = this.isNight ? '#1e140d' : '#d49b6a';
    this.ctx.fillRect(0, 420, this.canvas.width, 8);

    // Window (Left)
    this.ctx.save();
    this.ctx.fillStyle = this.isNight ? '#1e293b' : '#bae6fd';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 6;
    this.ctx.fillRect(70, 70, 150, 190);
    this.ctx.strokeRect(70, 70, 150, 190);

    this.ctx.beginPath();
    this.ctx.moveTo(145, 70); this.ctx.lineTo(145, 260);
    this.ctx.moveTo(70, 165); this.ctx.lineTo(220, 165);
    this.ctx.stroke();

    if (this.isNight) {
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.arc(180, 110, 20, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = '#fde047';
      this.ctx.beginPath();
      this.ctx.arc(110, 110, 22, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // Tall Vertical Bookshelf (세로로 길쭉한 책장)
    this.ctx.save();
    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(260, 100, 110, 320); // Bookshelf frame
    this.ctx.fillStyle = '#451a03';
    this.ctx.fillRect(265, 105, 100, 310);

    // Shelves & Colorful Books
    const bookColors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    for (let row = 0; row < 4; row++) {
      const shelfY = 160 + row * 75;
      this.ctx.fillStyle = '#78350f';
      this.ctx.fillRect(260, shelfY, 110, 8); // Shelf board

      // Books on shelf
      for (let b = 0; b < 5; b++) {
        this.ctx.fillStyle = bookColors[(row + b) % bookColors.length];
        this.ctx.fillRect(270 + b * 18, shelfY - 40, 14, 40);
      }
    }
    this.ctx.restore();

    // Wider Bed (침대를 가로로 더 길게 늘림: w=240px)
    this.ctx.save();
    this.ctx.fillStyle = '#a8a29e';
    this.ctx.fillRect(550, 260, 240, 160); // Bedframe

    this.ctx.fillStyle = '#f43f5e';
    this.ctx.fillRect(540, 330, 250, 90); // Mattress & Blanket
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(560, 300, 80, 30); // Pillow
    this.ctx.restore();
  }

  // --- Dress Room Scene ---
  drawDressRoomBackground() {
    this.ctx.fillStyle = '#fce7f3';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Carpet & Mirror
    this.ctx.fillStyle = '#f43f5e';
    this.ctx.fillRect(0, 420, this.canvas.width, 100);

    // Mirror
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#f472b6';
    this.ctx.lineWidth = 10;
    this.ctx.beginPath();
    this.ctx.ellipse(425, 200, 140, 160, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#ec4899';
    this.ctx.font = 'bold 24px Gaegu';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('✨ 드레스룸 ✨', 425, 60);
    this.ctx.restore();
  }

  // --- Park Scene (Fountain) ---
  drawParkBackground() {
    // Sky
    this.ctx.fillStyle = '#bae6fd';
    this.ctx.fillRect(0, 0, this.canvas.width, 300);

    // Grass Field
    this.ctx.fillStyle = '#4ade80';
    this.ctx.fillRect(0, 300, this.canvas.width, 220);

    // Trees
    this.drawTree(100, 220);
    this.drawTree(750, 220);

    // Water Fountain in center (분수대)
    this.ctx.save();
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillRect(350, 320, 150, 20); // Base
    this.ctx.fillRect(390, 270, 70, 50);  // Column
    this.ctx.beginPath();
    this.ctx.ellipse(425, 270, 80, 25, 0, 0, Math.PI * 2); // Bowl
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fill();

    // Animated Fountain Water Spray Drops
    this.ctx.fillStyle = '#7dd3fc';
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI - Math.PI / 2;
      const speed = 20 + Math.sin(Date.now() * 0.01 + i) * 10;
      const fx = 425 + Math.cos(angle) * speed;
      const fy = 250 + Math.sin(angle) * speed * 1.5;
      this.ctx.beginPath();
      this.ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = '#0369a1';
    this.ctx.font = 'bold 24px Gaegu';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🏞️ 분수대 공원 산책', 425, 40);
    this.ctx.restore();
  }

  drawTree(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = '#b45309';
    this.ctx.fillRect(x - 15, y, 30, 80);
    this.ctx.fillStyle = '#15803d';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 20, 50, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  // --- Bathroom Scene ---
  drawBathroomBackground() {
    // Tiles background
    this.ctx.fillStyle = '#e0f2fe';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#bae6fd';
    this.ctx.lineWidth = 2;
    for (let x = 0; x < this.canvas.width; x += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, 420); this.ctx.stroke();
    }
    for (let y = 0; y < 420; y += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
    }

    // Floor & Bathtub
    this.ctx.fillStyle = '#0284c7';
    this.ctx.fillRect(0, 420, this.canvas.width, 100);

    // Bathtub
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 6;
    this.ctx.fillRect(300, 330, 250, 100);
    this.ctx.strokeRect(300, 330, 250, 100);

    this.ctx.fillStyle = '#0284c7';
    this.ctx.font = 'bold 24px Gaegu';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🛁 목욕실', 425, 40);
  }

  // --- Main Cat Drawing (Growth with Age: 0~5 years) ---
  drawMainCat() {
    this.ctx.save();
    this.ctx.translate(this.catX, this.catY);

    // Scale increases with age: 0살=0.7x, 1살=0.85x, 2살=1.0x, 3살=1.15x, 4살=1.3x, 5살=1.45x (stops growing at 5!)
    const currentScale = 0.7 + Math.min(this.age, 5) * 0.15;
    this.ctx.scale(currentScale, currentScale);

    if (this.catAction === 'ROLL') {
      this.ctx.rotate(this.rollAngle);
    } else if (this.catAction === 'LIE_DOWN') {
      // Lying down flat pose for brushing fur!
      this.ctx.rotate(Math.PI / 2);
    }

    const theme = this.breedColors[this.selectedBreed];

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 10, 35, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Cat Body
    this.ctx.fillStyle = theme.body;
    this.ctx.strokeStyle = theme.accent;
    this.ctx.lineWidth = 2.5;

    this.ctx.beginPath();
    this.ctx.ellipse(0, -20, 30, 24, 0, 0, Math.PI * 2);
    this.ctx.fill(); this.ctx.stroke();

    // Head
    this.ctx.beginPath();
    this.ctx.arc(0, -45, 24, 0, Math.PI * 2);
    this.ctx.fill(); this.ctx.stroke();

    // Ears
    this.ctx.fillStyle = theme.ear;
    this.ctx.beginPath();
    this.ctx.moveTo(-18, -55); this.ctx.lineTo(-26, -75); this.ctx.lineTo(-6, -62);
    this.ctx.fill(); this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(18, -55); this.ctx.lineTo(26, -75); this.ctx.lineTo(6, -62);
    this.ctx.fill(); this.ctx.stroke();

    // Eyes
    this.ctx.fillStyle = theme.eye;
    if (this.catAction === 'SLEEP' || this.catAction === 'BATH') {
      this.ctx.strokeStyle = '#495057';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(-8, -46, 5, Math.PI, 0);
      this.ctx.arc(8, -46, 5, Math.PI, 0);
      this.ctx.stroke();
    } else {
      this.ctx.beginPath();
      this.ctx.arc(-8, -46, 5, 0, Math.PI * 2);
      this.ctx.arc(8, -46, 5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(-9, -48, 2, 0, Math.PI * 2);
      this.ctx.arc(7, -48, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Tears when ALL gauges hit 0% (눈물 뚝뚝 💧)
    if (this.hunger === 0 && this.thirst === 0 && this.boredom === 0) {
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.beginPath();
      this.ctx.arc(-12, -40, 3, 0, Math.PI * 2);
      this.ctx.arc(12, -40, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Nose
    this.ctx.fillStyle = '#ff85a2';
    this.ctx.beginPath();
    this.ctx.arc(0, -40, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Whiskers
    this.ctx.strokeStyle = '#868e96';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.moveTo(-12, -40); this.ctx.lineTo(-24, -42);
    this.ctx.moveTo(-12, -37); this.ctx.lineTo(-24, -36);
    this.ctx.moveTo(12, -40); this.ctx.lineTo(24, -42);
    this.ctx.moveTo(12, -37); this.ctx.lineTo(24, -36);
    this.ctx.stroke();

    // Tail
    this.ctx.strokeStyle = theme.body;
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(25, -20);
    this.ctx.quadraticCurveTo(45, -35, 40, -50);
    this.ctx.stroke();

    // Clothing Options (드레스룸 선택)
    if (this.clothingIndex === 1) {
      this.ctx.font = '20px sans-serif';
      this.ctx.fillText('🎀', -10, -32);
    } else if (this.clothingIndex === 2) {
      this.ctx.font = '22px sans-serif';
      this.ctx.fillText('🎩', -12, -70);
    } else if (this.clothingIndex === 3) {
      this.ctx.font = '22px sans-serif';
      this.ctx.fillText('👑', -12, -70);
    } else if (this.clothingIndex === 4) {
      this.ctx.font = '22px sans-serif';
      this.ctx.fillText('👓', -14, -44);
    }

    this.ctx.restore();
  }

  drawKitten(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);

    this.ctx.fillStyle = this.breedColors[this.selectedBreed].body;
    this.ctx.strokeStyle = '#495057';
    this.ctx.lineWidth = 1.5;

    this.ctx.beginPath();
    this.ctx.arc(0, -12, 14, 0, Math.PI * 2);
    this.ctx.fill(); this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(-8, -20); this.ctx.lineTo(-14, -30); this.ctx.lineTo(-2, -24);
    this.ctx.moveTo(8, -20); this.ctx.lineTo(14, -30); this.ctx.lineTo(2, -24);
    this.ctx.fill(); this.ctx.stroke();

    this.ctx.fillStyle = '#343a40';
    this.ctx.beginPath();
    this.ctx.arc(-4, -14, 2, 0, Math.PI * 2);
    this.ctx.arc(4, -14, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawBathEffects() {
    this.ctx.save();

    if (this.bathStep === 1) {
      // 2s Bubbles
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < 7; i++) {
        const bx = this.catX + (Math.sin(i * 2 + Date.now() * 0.01) * 25);
        const by = this.catY - 45 + (Math.cos(i * 3) * 20);
        this.ctx.beginPath();
        this.ctx.arc(bx, by, 10 + (i % 3) * 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    } else if (this.bathStep === 2) {
      // 2s Water Spray
      this.ctx.strokeStyle = 'rgba(116, 192, 252, 0.7)';
      this.ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const sx = this.catX - 30 + i * 6;
        const sy = this.catY - 90 + (Date.now() * 0.2 + i * 10) % 60;
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        this.ctx.lineTo(sx + 2, sy + 15);
        this.ctx.stroke();
      }
    } else if (this.bathStep === 3) {
      // 3s Body Shake
      this.ctx.fillStyle = '#339af0';
      for (let i = 0; i < 8; i++) {
        const dx = this.catX + (Math.sin(Date.now() * 0.02 + i) * 45);
        const dy = this.catY - 30 + (Math.cos(Date.now() * 0.03 + i) * 30);
        this.ctx.beginPath();
        this.ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }
}

// Start Game Instance
window.addEventListener('DOMContentLoaded', () => {
  new CatHealingGame();
});
