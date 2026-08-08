/**
 * [초고퀄리티] 고양이 키우기 힐링 게임 (v2)
 * All Class/Function/Variable names in English.
 * All UI labels, dialogue, thoughts, and notifications in Korean.
 */

// --- Audio Synthesizer ---
class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
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
  }

  playTone(frequency, type, duration, startVol = 0.3, endVol = 0.01) {
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
      // Audio error fallback
    }
  }

  // 뿅! (해금 알림 소리)
  playPyongSound() {
    if (this.isMuted || !this.audioCtx) return;
    this.playTone(600, 'sine', 0.1, 0.4);
    setTimeout(() => this.playTone(900, 'sine', 0.15, 0.5), 80);
  }

  // 야옹~ 소리
  playMeowSound() {
    if (this.isMuted || !this.audioCtx) return;
    this.playTone(400, 'sine', 0.15, 0.3);
    setTimeout(() => this.playTone(350, 'sine', 0.2, 0.3), 100);
  }

  // 고롱고롱 골골송 소리
  playPurrSound() {
    if (this.isMuted || !this.audioCtx) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => this.playTone(120, 'triangle', 0.2, 0.15), i * 250);
    }
  }

  // 물소리 (목욕하기)
  playWaterSound() {
    if (this.isMuted || !this.audioCtx) return;
    for (let i = 0; i < 10; i++) {
      setTimeout(() => this.playTone(300 + Math.random() * 400, 'sine', 0.1, 0.1), i * 150);
    }
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
    this.scale = 1;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.015;
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

// --- Main Cat Game Manager ---
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

    this.gaugeHunger = document.getElementById('gauge-hunger');
    this.gaugeThirst = document.getElementById('gauge-thirst');
    this.gaugeBoredom = document.getElementById('gauge-boredom');
    this.thoughtText = document.getElementById('thought-text');

    this.extraMenu = document.getElementById('extra-menu');
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

    this.age = 0; // 0살
    this.gameTimeSeconds = 0;
    this.isNight = false;

    // Cat Position & Action States
    this.catX = 400;
    this.catY = 380;
    this.catVx = 0;
    this.catVy = 0;
    this.isGrounded = true;

    this.catAction = 'IDLE'; // 'IDLE', 'JUMP', 'ROLL', 'SLEEP', 'BATH', 'BRUSH', 'WALK'
    this.actionTimer = 0;
    this.rollAngle = 0;

    this.clothingIndex = 0; // 0: None, 1: Ribbon, 2: Hat, 3: Crown

    // Unlockable features (Unlocked every 1 minute = 60s)
    this.unlockedFeatures = [false, false, false, false, false]; // [Clothes, Walk, Bath, Brush, Tease]
    this.featureNames = ['옷 갈아입히기', '산책하기', '목욕하기', '털 빗어주기', '장난치기'];

    this.kittens = []; // Array of newborn kitten positions
    this.hasBred = false;

    this.particles = [];
    this.keys = { left: false, right: false, up: false, down: false };

    // Bath Animation Specific State
    this.bathStep = 0; // 0: None, 1: Bubbles(2s), 2: Water Spray(2s), 3: Shake Body(3s)
    this.bathStepTimer = 0;

    this.initEvents();
  }

  initEvents() {
    // Breed Selection Cards
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

    // Confirm Select & Name Button
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

    // Canvas Left Click Interaction
    this.canvas.addEventListener('click', (e) => {
      this.soundManager.init();
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Click on Cat -> Pet / Purr
      const dist = Math.hypot(clickX - this.catX, clickY - (this.catY - 30));
      if (dist < 60) {
        this.triggerPurr();
      }
    });

    // Bottom Care Action Buttons
    document.getElementById('btn-feed').addEventListener('click', () => this.feedCat());
    document.getElementById('btn-water').addEventListener('click', () => this.giveWater());
    document.getElementById('btn-play').addEventListener('click', () => this.playWithCat());

    // Hamburger Menu Toggle
    document.getElementById('btn-menu').addEventListener('click', () => {
      this.extraMenu.classList.toggle('hidden');
    });

    document.getElementById('close-menu-btn').addEventListener('click', () => {
      this.extraMenu.classList.add('hidden');
    });

    // Day / Night Toggle Button
    this.dayNightBtn.addEventListener('click', () => this.toggleDayNight());

    // Menu Unlocked Items Click Handlers
    document.getElementById('btn-clothes').addEventListener('click', () => this.changeClothes());
    document.getElementById('btn-walk').addEventListener('click', () => this.goWalk());
    document.getElementById('btn-bath').addEventListener('click', () => this.startBath());
    document.getElementById('btn-brush').addEventListener('click', () => this.startBrush());
    document.getElementById('btn-tease').addEventListener('click', () => this.teaseCat());

    // Victory Modal Buttons
    document.getElementById('btn-restart').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
    });
  }

  startMainGameLoop() {
    // 1-second interval timer for decay, age, feature unlocks
    setInterval(() => this.updateTimeAndDecay(), 1000);
    this.renderLoop();
  }

  updateTimeAndDecay() {
    this.gameTimeSeconds++;

    // Age increases 1 year every 5 minutes (300 seconds)
    const newAge = Math.floor(this.gameTimeSeconds / 300);
    if (newAge !== this.age) {
      this.age = newAge;
      this.updateAgeDisplay();

      // Check 5 years old breeding condition
      if (this.age >= 5 && !this.hasBred) {
        this.triggerBreedingSuccess();
      }
    }

    // Feature unlocks (1 minute = 60s per feature)
    // 1m -> Clothes, 2m -> Walk, 3m -> Bath, 4m -> Brush, 5m -> Tease
    for (let i = 0; i < 5; i++) {
      const unlockTime = (i + 1) * 60;
      if (this.gameTimeSeconds >= unlockTime && !this.unlockedFeatures[i]) {
        this.unlockedFeatures[i] = true;
        this.showUnlockNotification(this.featureNames[i]);
        this.updateMenuButtonsUI();
      }
    }

    // Gauge decay over time (Faster as age increases)
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

    // Cry sound & mood if 0%
    if (this.hunger === 0 || this.thirst === 0 || this.boredom === 0) {
      if (Math.random() < 0.15) this.soundManager.playMeowSound();
    }
  }

  updateCatThought() {
    const minGauge = Math.min(this.hunger, this.thirst, this.boredom);

    if (minGauge === 0) {
      this.thoughtText.textContent = '야옹~! 빨리 날 보살펴줘요! 😿';
    } else if (minGauge < 30) {
      if (this.hunger < 30) this.thoughtText.textContent = '배가 너무 고파요... 🍚';
      else if (this.thirst < 30) this.thoughtText.textContent = '목이 많이 마르네요... 💧';
      else this.thoughtText.textContent = '너무 너무 심심해요... ⚽';
    } else {
      this.thoughtText.textContent = '행복해요! 야옹~ 고롱고롱 💕';
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
    this.triggerPurr('🍚 맛있는 밥 냠냠!');
  }

  giveWater() {
    this.thirst = Math.min(100, this.thirst + 40);
    this.triggerPurr('💧 시원한 물 꿀꺽!');
  }

  playWithCat() {
    this.boredom = Math.min(100, this.boredom + 40);
    this.triggerPurr('🧶 신나는 놀이시간!');
  }

  triggerPurr(customText = '고롱고롱~ 💕') {
    this.soundManager.playPurrSound();
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, customText, '#ff4081'));
    this.particles.push(new FloatingParticle(this.catX - 20, this.catY - 80, '❤️', '#ff4081'));
    this.particles.push(new FloatingParticle(this.catX + 20, this.catY - 90, '❤️', '#ff4081'));
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    if (this.isNight) {
      this.dayNightBtn.textContent = '🌙 밤';
      // Cat walks up to bed and sleeps for 5s
      this.catAction = 'SLEEP';
      this.actionTimer = 300; // ~5 seconds (60fps * 5)
      this.catX = 680; // Bed position
      this.catY = 320;
      this.particles.push(new FloatingParticle(this.catX, this.catY - 50, '💤 zzz...', '#a5d8ff'));

      setTimeout(() => {
        this.isNight = false;
        this.dayNightBtn.textContent = '☀️ 낮';
        this.catAction = 'IDLE';
        this.catY = 380;
      }, 5000);
    } else {
      this.dayNightBtn.textContent = '☀️ 낮';
      this.catAction = 'IDLE';
      this.catY = 380;
    }
  }

  // --- Unlockable Features Handlers ---
  changeClothes() {
    if (!this.unlockedFeatures[0]) return;
    this.clothingIndex = (this.clothingIndex + 1) % 4;
    const names = ['기본', '🎀 리본', '🎩 모자', '👑 왕관'];
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, `옷 입기: ${names[this.clothingIndex]}`, '#b388ff'));
    this.extraMenu.classList.add('hidden');
  }

  goWalk() {
    if (!this.unlockedFeatures[1]) return;
    this.catAction = 'WALK';
    this.actionTimer = 180; // 3 seconds
    this.boredom = 100;
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '🌸 산책하기 룰루랄라~', '#51cf66'));
    this.extraMenu.classList.add('hidden');
  }

  startBath() {
    if (!this.unlockedFeatures[2]) return;
    this.catAction = 'BATH';
    this.bathStep = 1; // 1: Bubbles (2s)
    this.bathStepTimer = 120; // 2s
    this.soundManager.playWaterSound();
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '🛁 냥~ 목욕하기!', '#339af0'));
    this.extraMenu.classList.add('hidden');

    // Step 1 -> Step 2 (Water Spray 2s) -> Step 3 (Shake 3s)
    setTimeout(() => {
      this.bathStep = 2; // Water spray
      this.soundManager.playWaterSound();
      setTimeout(() => {
        this.bathStep = 3; // Body Shake (3s)
        setTimeout(() => {
          this.bathStep = 0;
          this.catAction = 'IDLE';
          this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '✨ 보송보송 말랐어요!', '#339af0'));
        }, 3000);
      }, 2000);
    }, 2000);
  }

  startBrush() {
    if (!this.unlockedFeatures[3]) return;
    this.catAction = 'BRUSH';
    this.actionTimer = 300; // 5 seconds
    this.soundManager.playPurrSound();
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '✨ 털 빗기 (고롱고롱~)', '#ffd43b'));
    this.extraMenu.classList.add('hidden');

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.particles.push(new FloatingParticle(
          this.catX + (Math.random() * 60 - 30),
          this.catY - 40 + (Math.random() * 40 - 20),
          '✨', '#ffd43b'
        ));
      }, i * 600);
    }

    setTimeout(() => {
      if (this.catAction === 'BRUSH') this.catAction = 'IDLE';
    }, 5000);
  }

  teaseCat() {
    if (!this.unlockedFeatures[4]) return;
    this.boredom = 100;
    this.performJump();
    this.particles.push(new FloatingParticle(this.catX, this.catY - 60, '🎾 야옹! 장난치기!', '#ff922b'));
    this.extraMenu.classList.add('hidden');
  }

  // --- Keyboard Control Physics ---
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
      this.actionTimer = 180; // 3 seconds (180 frames at 60fps)
      this.rollAngle = 0;
      this.particles.push(new FloatingParticle(this.catX, this.catY - 50, '🌀 뒹굴뒹굴~ (3초)', '#ff85a2'));
    }
  }

  triggerBreedingSuccess() {
    this.hasBred = true;
    const kittenCount = Math.floor(Math.random() * 4) + 1; // 1 to 4 kittens

    this.kittens = [];
    for (let i = 0; i < kittenCount; i++) {
      this.kittens.push({
        x: 200 + i * 80,
        y: 400,
        color: this.breedColors[this.selectedBreed].body
      });
    }

    document.getElementById('kittens-display').textContent = '🐱'.repeat(kittenCount);
    document.getElementById('victory-summary').textContent = 
      `당신의 헌신적인 사랑 덕분에 ${this.catName}이가 건강하게 5살이 되어 귀여운 아기 고양이 ${kittenCount}마리를 낳았어요! 🎉`;

    this.victoryModal.classList.remove('hidden');
  }

  // --- Canvas Rendering Loop ---
  renderLoop() {
    this.updatePhysics();
    this.drawScene();
    requestAnimationFrame(() => this.renderLoop());
  }

  updatePhysics() {
    // Arrow keys movement
    if (this.catAction !== 'SLEEP' && this.catAction !== 'ROLL') {
      if (this.keys.left) {
        this.catX -= 4;
      }
      if (this.keys.right) {
        this.catX += 4;
      }
    }

    // Clamp inside room canvas width
    this.catX = Math.max(80, Math.min(770, this.catX));

    // Gravity
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

    // Roll rotation animation timer (3s)
    if (this.catAction === 'ROLL') {
      this.rollAngle += 0.15;
      this.actionTimer--;
      if (this.actionTimer <= 0) {
        this.catAction = 'IDLE';
        this.rollAngle = 0;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Update Kittens random movement
    this.kittens.forEach(k => {
      k.x += (Math.random() * 2 - 1);
      k.x = Math.max(120, Math.min(750, k.x));
    });
  }

  drawScene() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Bedroom Background & Window & Bed
    this.drawRoomBackground();

    // 2. Kittens (If born)
    this.kittens.forEach(k => this.drawKitten(k.x, k.y));

    // 3. Main Mother Cat
    this.drawMainCat();

    // 4. Bath Water / Bubbles Overlays
    if (this.catAction === 'BATH') {
      this.drawBathEffects();
    }

    // 5. Particles
    this.particles.forEach(p => p.draw(this.ctx));
  }

  drawRoomBackground() {
    // Wall color (Day / Night blend)
    this.ctx.fillStyle = this.isNight ? '#101426' : '#fff4e6';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Floor
    this.ctx.fillStyle = this.isNight ? '#2b1d14' : '#e6ba95';
    this.ctx.fillRect(0, 420, this.canvas.width, 100);
    this.ctx.fillStyle = this.isNight ? '#1e140d' : '#d49b6a';
    this.ctx.fillRect(0, 420, this.canvas.width, 8);

    // Window (Left side)
    this.ctx.save();
    this.ctx.fillStyle = this.isNight ? '#1e293b' : '#bae6fd';
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 6;
    this.ctx.fillRect(80, 80, 160, 200);
    this.ctx.strokeRect(80, 80, 160, 200);

    // Window grid
    this.ctx.beginPath();
    this.ctx.moveTo(160, 80); this.ctx.lineTo(160, 280);
    this.ctx.moveTo(80, 180); this.ctx.lineTo(240, 180);
    this.ctx.stroke();

    // Celestial Body in Window (Sun / Moon)
    if (this.isNight) {
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.arc(200, 120, 22, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = '#fde047';
      this.ctx.beginPath();
      this.ctx.arc(120, 120, 24, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // Bed (Right side)
    this.ctx.save();
    // Headboard
    this.ctx.fillStyle = '#a8a29e';
    this.ctx.fillRect(630, 260, 160, 160);

    // Mattress & Pillow
    this.ctx.fillStyle = '#f43f5e';
    this.ctx.fillRect(620, 340, 170, 80);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(630, 310, 60, 30); // Pillow
    this.ctx.restore();
  }

  drawMainCat() {
    this.ctx.save();
    this.ctx.translate(this.catX, this.catY);

    if (this.catAction === 'ROLL') {
      this.ctx.rotate(this.rollAngle);
    }

    const theme = this.breedColors[this.selectedBreed];
    const isSad = (this.hunger < 30 || this.thirst < 30 || this.boredom < 30);

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
    this.ctx.fill();
    this.ctx.stroke();

    // Head
    this.ctx.beginPath();
    this.ctx.arc(0, -45, 24, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Ears
    this.ctx.fillStyle = theme.ear;
    // Left Ear
    this.ctx.beginPath();
    this.ctx.moveTo(-18, -55);
    this.ctx.lineTo(-26, -75);
    this.ctx.lineTo(-6, -62);
    this.ctx.fill(); this.ctx.stroke();

    // Right Ear
    this.ctx.beginPath();
    this.ctx.moveTo(18, -55);
    this.ctx.lineTo(26, -75);
    this.ctx.lineTo(6, -62);
    this.ctx.fill(); this.ctx.stroke();

    // Eyes (Closed if Sleeping / Bathing or Normal/Sad)
    this.ctx.fillStyle = theme.eye;
    if (this.catAction === 'SLEEP' || this.catAction === 'BATH') {
      // Closed happy Eyes ^ ^
      this.ctx.strokeStyle = '#495057';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(-8, -46, 5, Math.PI, 0);
      this.ctx.arc(8, -46, 5, Math.PI, 0);
      this.ctx.stroke();
    } else if (isSad) {
      // Sad Eyes 😿
      this.ctx.fillStyle = '#343a40';
      this.ctx.beginPath();
      this.ctx.arc(-8, -46, 3, 0, Math.PI * 2);
      this.ctx.arc(8, -46, 3, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Bright Sparkling Eyes ✨
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

    // Nose & Whiskers
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

    // Clothing Overlay
    if (this.clothingIndex === 1) {
      // Ribbon 🎀
      this.ctx.fillStyle = '#ff4081';
      this.ctx.font = '20px sans-serif';
      this.ctx.fillText('🎀', -10, -32);
    } else if (this.clothingIndex === 2) {
      // Hat 🎩
      this.ctx.font = '22px sans-serif';
      this.ctx.fillText('🎩', -12, -70);
    } else if (this.clothingIndex === 3) {
      // Crown 👑
      this.ctx.font = '22px sans-serif';
      this.ctx.fillText('👑', -12, -70);
    }

    this.ctx.restore();
  }

  drawKitten(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Small Kitten
    this.ctx.fillStyle = this.breedColors[this.selectedBreed].body;
    this.ctx.strokeStyle = '#495057';
    this.ctx.lineWidth = 1.5;

    // Body & Head
    this.ctx.beginPath();
    this.ctx.arc(0, -12, 14, 0, Math.PI * 2);
    this.ctx.fill(); this.ctx.stroke();

    // Ears
    this.ctx.beginPath();
    this.ctx.moveTo(-8, -20); this.ctx.lineTo(-14, -30); this.ctx.lineTo(-2, -24);
    this.ctx.moveTo(8, -20); this.ctx.lineTo(14, -30); this.ctx.lineTo(2, -24);
    this.ctx.fill(); this.ctx.stroke();

    // Eyes
    this.ctx.fillStyle = '#343a40';
    this.ctx.beginPath();
    this.ctx.arc(-4, -14, 2, 0, Math.PI * 2);
    this.ctx.arc(4, -14, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawBathEffects() {
    this.ctx.save();

    // Step 1: Foam Bubbles (2s)
    if (this.bathStep === 1) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < 7; i++) {
        const bx = this.catX + (Math.sin(i * 2 + Date.now() * 0.01) * 25);
        const by = this.catY - 45 + (Math.cos(i * 3) * 20);
        this.ctx.beginPath();
        this.ctx.arc(bx, by, 10 + (i % 3) * 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Step 2: Water Spray (2s)
    if (this.bathStep === 2) {
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
    }

    // Step 3: Shaking Water Droplets (3s)
    if (this.bathStep === 3) {
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

// Start Game Instance on Load
window.addEventListener('DOMContentLoaded', () => {
  new CatHealingGame();
});
