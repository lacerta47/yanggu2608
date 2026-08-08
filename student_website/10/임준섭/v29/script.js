// 1. DOM Elements
const homeOverlay = document.getElementById('homeOverlay');
const closetOverlay = document.getElementById('closetOverlay');
const victoryOverlay = document.getElementById('victoryOverlay');

const startGameHomeBtn = document.getElementById('startGameHomeBtn');
const specialStageHomeBtn = document.getElementById('specialStageHomeBtn');
const closetHomeBtn = document.getElementById('closetHomeBtn');
const resetStageHomeBtn = document.getElementById('resetStageHomeBtn');
const closeClosetBtn = document.getElementById('closeClosetBtn');
const homeNavBtn = document.getElementById('homeNavBtn');
const bgmToggleBtn = document.getElementById('bgmToggleBtn');
const returnHomeBtn = document.getElementById('returnHomeBtn');
const specialStageHudBtn = document.getElementById('specialStageHudBtn');

const stageNumDisplay = document.getElementById('stageNum');
const themeNameDisplay = document.getElementById('themeNameDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const adminBadge = document.getElementById('adminBadge');
const flyBadge = document.getElementById('flyBadge');
const wallBadge = document.getElementById('wallBadge');
const wallCdBadge = document.getElementById('wallCdBadge');
const slideBadge = document.getElementById('slideBadge');
const boosterBadge = document.getElementById('boosterBadge');
const checkpointBadge = document.getElementById('checkpointBadge');
const unlockNoticeBanner = document.getElementById('unlockNoticeBanner');
const crosshair = document.getElementById('crosshair');

// Title & Character Displays
const lobbyTitleText = document.getElementById('lobbyTitleText');
const closetTitleDisplay = document.getElementById('closetTitleDisplay');
const hudTitleDisplay = document.getElementById('hudTitleDisplay');
const hudCharDisplay = document.getElementById('hudCharDisplay');
const awardedTitleBanner = document.getElementById('awardedTitleBanner');
const awardedTitleHeader = document.getElementById('awardedTitleHeader');
const awardedTitleText = document.getElementById('awardedTitleText');

// 3D Character Selector Cards
const charDragonCard = document.getElementById('charDragonCard');
const charHumanCard = document.getElementById('charHumanCard');
const charRobotCard = document.getElementById('charRobotCard');
const selectDragonBtn = document.getElementById('selectDragonBtn');
const selectHumanBtn = document.getElementById('selectHumanBtn');
const selectRobotBtn = document.getElementById('selectRobotBtn');

const cardBasic = document.getElementById('cardBasic');
const cardThunder = document.getElementById('cardThunder');
const cardEmerald = document.getElementById('cardEmerald');
const cardDiamond = document.getElementById('cardDiamond');
const cardRainbow = document.getElementById('cardRainbow');

const equipBasicBtn = document.getElementById('equipBasicBtn');
const equipThunderBtn = document.getElementById('equipThunderBtn');
const equipEmeraldBtn = document.getElementById('equipEmeraldBtn');
const equipDiamondBtn = document.getElementById('equipDiamondBtn');
const equipRainbowBtn = document.getElementById('equipRainbowBtn');

const thunderStatusTag = document.getElementById('thunderStatusTag');
const emeraldStatusTag = document.getElementById('emeraldStatusTag');
const diamondStatusTag = document.getElementById('diamondStatusTag');
const rainbowStatusTag = document.getElementById('rainbowStatusTag');

const victoryTitle = document.getElementById('victoryTitle');
const victoryMessage = document.getElementById('victoryMessage');
const finalTimeDisplay = document.getElementById('finalTimeDisplay');
const nextStageBtn = document.getElementById('nextStageBtn');
const restartGameBtn = document.getElementById('restartGameBtn');

// 👑 ADMIN PRIVILEGE & TITLE STATE MANAGEMENT 👑
let isAdminActive = localStorage.getItem('isAdminActive') === 'true';

// 🎭 3D PLAYABLE CHARACTER STATE MANAGEMENT (Dragon / Human / Robot) 🎭
let selectedCharacter = localStorage.getItem('selectedCharacter') || 'dragon';

const characterInfo = {
    dragon: { name: "🐲 드래곤", icon: "🐲", desc: "화염 불꽃 날개", trailColor: "#ef4444" },
    human: { name: "👤 닌자 사람", icon: "👤", desc: "초고속 바람 질주", trailColor: "#0284c7" },
    robot: { name: "🤖 사이버 로봇", icon: "🤖", desc: "안드로이드 메카 펄스", trailColor: "#10b981" }
};

function updateCharacterSelectUI() {
    [charDragonCard, charHumanCard, charRobotCard].forEach(c => c.classList.remove('selected'));
    [selectDragonBtn, selectHumanBtn, selectRobotBtn].forEach(b => {
        b.classList.remove('active');
        b.textContent = '선택하기';
    });

    if (selectedCharacter === 'human') {
        charHumanCard.classList.add('selected');
        selectHumanBtn.classList.add('active');
        selectHumanBtn.textContent = '선택됨';
        hudCharDisplay.textContent = characterInfo.human.name;
    } else if (selectedCharacter === 'robot') {
        charRobotCard.classList.add('selected');
        selectRobotBtn.classList.add('active');
        selectRobotBtn.textContent = '선택됨';
        hudCharDisplay.textContent = characterInfo.robot.name;
    } else {
        selectedCharacter = 'dragon';
        charDragonCard.classList.add('selected');
        selectDragonBtn.classList.add('active');
        selectDragonBtn.textContent = '선택됨';
        hudCharDisplay.textContent = characterInfo.dragon.name;
    }

    localStorage.setItem('selectedCharacter', selectedCharacter);
}

selectDragonBtn.addEventListener('click', () => { selectedCharacter = 'dragon'; updateCharacterSelectUI(); });
selectHumanBtn.addEventListener('click', () => { selectedCharacter = 'human'; updateCharacterSelectUI(); });
selectRobotBtn.addEventListener('click', () => { selectedCharacter = 'robot'; updateCharacterSelectUI(); });

// 👑 LEGENDARY TITLE CALCULATOR ENGINE (WITH ADMIN TITLE OVERRIDE!) 👑
function getUserTitle(highestCleared, isSpecialCleared) {
    if (isAdminActive) {
        return "👑 절대 지존 관리자";
    }
    if (isSpecialCleared) {
        return "👑 갓 레인보우 파쿠르의 창조신";
    }
    if (highestCleared >= 50) {
        return "🏆 50단계 파쿠르 전설 신화";
    }
    if (highestCleared >= 40) {
        return "⚡ 사이버펑크 붉은 번개 마스터";
    }
    if (highestCleared >= 30) {
        return "❄️ 다이아몬드 얼음 군주";
    }
    if (highestCleared >= 20) {
        return "🍃 에메랄드 신풍 마스터";
    }
    if (highestCleared >= 10) {
        return "🔥 화염 드래곤 주술사";
    }
    return "🌱 파쿠르 입문자";
}

function updateTitleDisplays() {
    const currentTitle = getUserTitle(highestStageCleared, isRainbowUnlocked);
    lobbyTitleText.textContent = currentTitle;
    closetTitleDisplay.textContent = currentTitle;
    hudTitleDisplay.textContent = currentTitle;
}

// 2. Modern Electronic EDM Sound Engine (Web Audio API)
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmTimer = null;
        this.noteIndex = 0;
        this.isBgmPlaying = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleBgm() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            bgmToggleBtn.textContent = '🔇 BGM OFF';
            bgmToggleBtn.classList.add('muted');
            this.stopBgm();
        } else {
            bgmToggleBtn.textContent = '🎵 BGM ON';
            bgmToggleBtn.classList.remove('muted');
            this.startBgm();
        }
    }

    startBgm() {
        if (this.isBgmPlaying || this.isMuted) return;
        this.isBgmPlaying = true;
        this.noteIndex = 0;

        const bassNotes = [110, 110, 146.8, 146.8, 164.8, 164.8, 130.8, 130.8];
        const synthNotes = [440, 554.37, 659.25, 880, 659.25, 554.37, 440, 329.63];

        this.bgmTimer = setInterval(() => {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(bassNotes[this.noteIndex % bassNotes.length], now);

            bassGain.gain.setValueAtTime(0.08, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            bassOsc.connect(bassGain);
            bassGain.connect(this.ctx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.2);

            const arpOsc = this.ctx.createOscillator();
            const arpGain = this.ctx.createGain();
            arpOsc.type = 'triangle';
            arpOsc.frequency.setValueAtTime(synthNotes[this.noteIndex % synthNotes.length], now);

            arpGain.gain.setValueAtTime(0.04, now);
            arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            arpOsc.connect(arpGain);
            arpGain.connect(this.ctx.destination);
            arpOsc.start(now);
            arpOsc.stop(now + 0.16);

            this.noteIndex++;
        }, 200);
    }

    stopBgm() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    playSFX(freq, duration, type = 'sine', volume = 0.15) {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    playJumpSound() {
        if (selectedCharacter === 'robot') {
            this.playSFX(700, 0.1, 'sawtooth', 0.18);
        } else if (selectedCharacter === 'dragon') {
            this.playSFX(250, 0.15, 'sawtooth', 0.2);
        } else {
            this.playSFX(400, 0.12, 'sine', 0.12);
        }
    }
    playBoostSound() { this.playSFX(600, 0.25, 'triangle', 0.2); }
    playFallShakeSound() { this.playSFX(80, 0.35, 'sawtooth', 0.3); }
    playCheckpointSound() { this.playSFX(880, 0.3, 'sine', 0.25); }
    playVictorySound() {
        this.playSFX(523.25, 0.15, 'triangle', 0.2);
        setTimeout(() => this.playSFX(659.25, 0.15, 'triangle', 0.2), 150);
        setTimeout(() => this.playSFX(783.99, 0.3, 'triangle', 0.25), 300);
    }
}

const audioEngine = new SoundEngine();
bgmToggleBtn.addEventListener('click', () => audioEngine.toggleBgm());

// 3. Three.js Scene Setup with Specular Lighting & Realistic Shadows
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
dirLight.position.set(60, 120, 60);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const sunGeo = new THREE.SphereGeometry(32, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffcd5 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(50, 100, -950);
scene.add(sunMesh);

// 4. PointerLock Controls (1st Person FPS Mode)
const controls = new THREE.PointerLockControls(camera, document.body);
controls.minPolarAngle = 0.01;
controls.maxPolarAngle = Math.PI - 0.01;

let gameState = 'home';
let savedStage = parseInt(localStorage.getItem('savedStage') || '1', 10);
let highestStageCleared = parseInt(localStorage.getItem('highestStageCleared') || '0', 10);
let isRainbowUnlocked = localStorage.getItem('isRainbowUnlocked') === 'true';
let equippedSkin = localStorage.getItem('equippedSkin') || 'basic';

// Screen / Camera Shake Variable
let shakeTime = 0;

function triggerScreenShake() {
    shakeTime = 0.45;
    document.body.classList.remove('shake-screen');
    void document.body.offsetWidth;
    document.body.classList.add('shake-screen');
    setTimeout(() => document.body.classList.remove('shake-screen'), 450);
    audioEngine.playFallShakeSound();
}

// 👑 SECRET ADMIN FLYING MODE & WARP STATE (TRIGGERS ADMIN TITLE!) 👑
let isFlying = false;

function activateAdminRights() {
    if (!isAdminActive) {
        isAdminActive = true;
        localStorage.setItem('isAdminActive', 'true');
        updateTitleDisplays();
    }
}

function toggleAdminFlyMode() {
    activateAdminRights();
    isFlying = !isFlying;
    velocity.set(0, 0, 0);

    if (isFlying) {
        flyBadge.classList.remove('hidden');
        spawnSkinParticles('boost', 25);
        audioEngine.playBoostSound();
    } else {
        flyBadge.classList.add('hidden');
    }
}

function triggerAdminWarp() {
    activateAdminRights();
    if (!goalMesh) return;
    
    // Teleport player directly next to the Goal platform!
    const targetPos = goalMesh.position.clone();
    targetPos.y += 4.0;
    targetPos.z += 3.0;

    playerPos.copy(targetPos);
    camera.position.copy(targetPos);
    velocity.set(0, 0, 0);

    adminBadge.classList.remove('hidden');
    setTimeout(() => adminBadge.classList.add('hidden'), 2000);

    spawnSkinParticles('boost', 30);
    audioEngine.playVictorySound();
}

// 🌟 REAL ELEMENT 3D PARTICLE GENERATOR (ADAPTIVE TO SELECTED CHARACTER!) 🌟
let skinParticles = [];

function spawnSkinParticles(actionType, count = 2) {
    const pos = playerPos.clone();

    const rainbowColors = [0xff0055, 0xf59e0b, 0x10b981, 0x38bdf8, 0xec4899];

    for (let i = 0; i < count; i++) {
        let geo, mat, velY, type;
        let pLife = 0.6 + Math.random() * 0.4;
        let rotSpeed = (Math.random() - 0.5) * 4.0;

        if (equippedSkin === 'thunder') {
            type = 'fire';
            geo = Math.random() > 0.4 ? new THREE.ConeGeometry(0.2, 0.45, 8) : new THREE.SphereGeometry(0.18, 8, 8);
            mat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xff2200 : (Math.random() > 0.5 ? 0xff6600 : 0xffcc00),
                transparent: true,
                opacity: 0.95
            });
            velY = actionType === 'jump' ? 4.5 + Math.random() * 3.0 : 2.5 + Math.random() * 2.0;
        } else if (equippedSkin === 'emerald') {
            type = 'leaf';
            geo = new THREE.PlaneGeometry(0.35, 0.45);
            mat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x10b981 : 0x84cc16,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            velY = (Math.random() - 0.5) * 1.0 - 0.5;
            pLife = 0.9 + Math.random() * 0.5;
        } else if (equippedSkin === 'diamond') {
            type = 'ice';
            geo = new THREE.OctahedronGeometry(0.25);
            mat = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.5 ? 0x06b6d4 : 0xe0f2fe,
                roughness: 0.05,
                metalness: 0.9,
                transparent: true,
                opacity: 0.9
            });
            velY = actionType === 'jump' ? 3.0 + Math.random() * 2.0 : (Math.random() - 0.5) * 1.5;
        } else if (equippedSkin === 'rainbow') {
            type = 'rainbow';
            geo = new THREE.TetrahedronGeometry(0.28);
            mat = new THREE.MeshBasicMaterial({
                color: rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
                transparent: true,
                opacity: 0.95
            });
            velY = actionType === 'jump' ? 5.0 + Math.random() * 3.0 : (Math.random() - 0.5) * 3.0;
        } else {
            // Adaptive Particle Colors for Characters!
            let mainColor = 0x38bdf8;
            if (selectedCharacter === 'robot') mainColor = 0x10b981;
            else if (selectedCharacter === 'dragon') mainColor = 0xef4444;

            type = 'water';
            geo = Math.random() > 0.3 ? new THREE.SphereGeometry(0.22, 8, 8) : new THREE.TorusGeometry(0.35, 0.06, 8, 16);
            mat = new THREE.MeshStandardMaterial({
                color: mainColor,
                roughness: 0.1,
                metalness: 0.8,
                transparent: true,
                opacity: 0.85
            });
            velY = actionType === 'jump' ? 4.0 + Math.random() * 2.5 : -1.0 + Math.random() * 1.5;
        }

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            pos.x + (Math.random() - 0.5) * 1.6,
            pos.y + (Math.random() - 0.5) * 0.8,
            pos.z + (Math.random() - 0.5) * 1.6
        );

        if (type === 'fire') mesh.rotation.x = -Math.PI / 2;
        else mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        let velX = (Math.random() - 0.5) * 2.2;
        let velZ = (Math.random() - 0.5) * 2.2;

        if (actionType === 'boost') velY = 8.0 + Math.random() * 5.0;

        scene.add(mesh);
        skinParticles.push({
            mesh: mesh,
            mat: mat,
            type: type,
            vel: new THREE.Vector3(velX, velY, velZ),
            rotSpeed: rotSpeed,
            life: pLife,
            maxLife: pLife
        });
    }
}

function updateSkinParticles(delta) {
    for (let i = skinParticles.length - 1; i >= 0; i--) {
        const p = skinParticles[i];
        p.life -= delta;

        if (p.type === 'fire') {
            p.vel.y += 2.0 * delta;
            p.mesh.scale.multiplyScalar(0.96);
        } else if (p.type === 'leaf') {
            p.mesh.rotation.z += p.rotSpeed * delta;
            p.vel.x += Math.sin(p.life * 10) * delta * 2.0;
        } else if (p.type === 'water') {
            p.vel.y -= gravity * 0.3 * delta;
        } else if (p.type === 'ice') {
            p.mesh.rotation.y += p.rotSpeed * delta;
        } else if (p.type === 'rainbow') {
            p.mesh.rotation.x += p.rotSpeed * delta;
        }

        p.mesh.position.addScaledVector(p.vel, delta);
        p.mat.opacity = Math.max(0, (p.life / p.maxLife));

        if (p.life <= 0) {
            scene.remove(p.mesh);
            skinParticles.splice(i, 1);
        }
    }
}

// 5. 8 RICH ATMOSPHERIC BIOME THEMES DEFINITION
function createSkyGradientTexture(topColor, bottomColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(0.7, bottomColor);
    gradient.addColorStop(1, topColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const biomeThemes = {
    1: {
        id: 1,
        name: "☀️ 맑은 햇살 도시 (Stages 1-8)",
        skyTop: "#1e40af", skyBottom: "#93c5fd", fog: 0xbae6fd, sun: 0xfffcd5,
        platBody: 0x334155, platGrid: 0x38bdf8, wallBody: 0x475569, bldgColor: 0x1e293b,
        cpPlat: 0x0369a1, cpPillar: 0x38bdf8, cpEmissive: 0x0284c7,
        roughness: 0.3, metalness: 0.4
    },
    2: {
        id: 2,
        name: "🌇 화려한 석양 도시 (Stages 9-16)",
        skyTop: "#4c1d95", skyBottom: "#f97316", fog: 0x7f1d1d, sun: 0xffedd5,
        platBody: 0x450a0a, platGrid: 0xef4444, wallBody: 0x7f1d1d, bldgColor: 0x3f0707,
        cpPlat: 0x991b1b, cpPillar: 0xef4444, cpEmissive: 0xd97706,
        roughness: 0.2, metalness: 0.5
    },
    3: {
        id: 3,
        name: "🌌 코스믹 자수정 은하수 (Stages 17-24)",
        skyTop: "#090514", skyBottom: "#6b21a8", fog: 0x1e1b4b, sun: 0xe9d5ff,
        platBody: 0x1e1b4b, platGrid: 0xc084fc, wallBody: 0x312e81, bldgColor: 0x140c2b,
        cpPlat: 0x581c87, cpPillar: 0xc084fc, cpEmissive: 0x9333ea,
        roughness: 0.1, metalness: 0.7
    },
    4: {
        id: 4,
        name: "🌲 에메랄드 오로라 숲 (Stages 25-32)",
        skyTop: "#022c22", skyBottom: "#10b981", fog: 0x022c22, sun: 0xdcfce7,
        platBody: 0x064e3b, platGrid: 0x34d399, wallBody: 0x047857, bldgColor: 0x022c22,
        cpPlat: 0x065f46, cpPillar: 0x34d399, cpEmissive: 0x059669,
        roughness: 0.3, metalness: 0.3
    },
    5: {
        id: 5,
        name: "🌋 마그마 화산 헬파이어 (Stages 33-40)",
        skyTop: "#2a0800", skyBottom: "#dc2626", fog: 0x450a0a, sun: 0xfacc15,
        platBody: 0x450a0a, platGrid: 0xf97316, wallBody: 0x7f1d1d, bldgColor: 0x1a0303,
        cpPlat: 0x991b1b, cpPillar: 0xf97316, cpEmissive: 0xef4444,
        roughness: 0.15, metalness: 0.8
    },
    6: {
        id: 6,
        name: "⚡ 사이버펑크 붉은 번개 (Stages 41-49)",
        skyTop: "#180e29", skyBottom: "#db2777", fog: 0x3b0764, sun: 0xf472b6,
        platBody: 0x3b0764, platGrid: 0xf43f5e, wallBody: 0x581c87, bldgColor: 0x11041d,
        cpPlat: 0x831843, cpPillar: 0xf43f5e, cpEmissive: 0xe11d48,
        roughness: 0.1, metalness: 0.85
    },
    stage50: {
        id: 50,
        name: "🏆 50단계 전설의 황금 천상 신전",
        skyTop: "#1e1b4b", skyBottom: "#f59e0b", fog: 0x4c1d95, sun: 0xfef08a,
        platBody: 0x581c87, platGrid: 0xfacc15, wallBody: 0x7e22ce, bldgColor: 0x2e1065,
        cpPlat: 0xb45309, cpPillar: 0xfacc15, cpEmissive: 0xd97706,
        roughness: 0.05, metalness: 0.95
    },
    special: {
        id: 7,
        name: "🔥 ⭐ 초장대 극악 익스트림 무지개 스페셜",
        skyTop: "#2e1065", skyBottom: "#ec4899", fog: 0x3b0764, sun: 0xfde047,
        platBody: 0x4c1d95, platGrid: 0xf43f5e, wallBody: 0x6b21a8, bldgColor: 0x3b0764,
        cpPlat: 0x9f1239, cpPillar: 0xf43f5e, cpEmissive: 0xe11d48,
        roughness: 0.1, metalness: 0.9
    }
};

function getThemeForStage(stage) {
    if (stage === 'special') return biomeThemes.special;
    if (stage === 50) return biomeThemes.stage50;
    if (stage <= 8) return biomeThemes[1];
    if (stage <= 16) return biomeThemes[2];
    if (stage <= 24) return biomeThemes[3];
    if (stage <= 32) return biomeThemes[4];
    if (stage <= 40) return biomeThemes[5];
    return biomeThemes[6];
}

// 6. Physics Variables & Player Position State
let currentStage = 1;
let startTime = 0;
let elapsedTime = 0;
let isTimerRunning = false;

let playerPos = new THREE.Vector3(0, 3, 0);

let platforms = [];
let movingPlatforms = [];
let walls = [];
let customBiomeMeshes = [];
let clouds = [];
let boosterPads = [];
let checkpoints = [];
let goalMesh = null;

let spawnPoint = new THREE.Vector3(0, 3, 0);
let activeCheckpointPos = new THREE.Vector3(0, 3, 0);

let velocity = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, spacePressed = false, shiftPressed = false;
let isSliding = false;
let canJump = false;

let isWallRunning = false;
let wallRunStamina = 2.0;
let wallRunCooldown = 0;
let currentWallNormal = new THREE.Vector3();

const normalHeight = 3.0;
const slideHeight = 1.5;
const gravity = 30;

// Keyboard Event Handlers (Shift+P FOR WARP & Shift+F FOR FLY MODE!)
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;

    // 👑 SECRET CHEAT WARP: Shift + P
    if (e.shiftKey && e.code === 'KeyP') {
        triggerAdminWarp();
        return;
    }

    // 🛸 SECRET CHEAT FLY MODE: Shift + F
    if (e.shiftKey && e.code === 'KeyF') {
        toggleAdminFlyMode();
        return;
    }

    switch (e.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft':
        case 'ShiftRight':
            shiftPressed = true;
            break;
        case 'KeyC':
        case 'ControlLeft':
            isSliding = true;
            break;
        case 'Space':
            spacePressed = true;
            if (!isFlying) {
                if (canJump) {
                    velocity.y = 15;
                    canJump = false;
                    spawnSkinParticles('jump', 14);
                    audioEngine.playJumpSound();
                } else if (isWallRunning && wallRunStamina > 0) {
                    velocity.y = 15;
                    velocity.x += currentWallNormal.x * 14;
                    velocity.z += currentWallNormal.z * 14;
                    isWallRunning = false;
                    wallBadge.classList.add('hidden');
                    spawnSkinParticles('jump', 16);
                    audioEngine.playJumpSound();
                }
            }
            break;
        case 'KeyR':
            respawnPlayer();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (gameState !== 'playing') return;
    switch (e.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft':
        case 'ShiftRight':
            shiftPressed = false;
            break;
        case 'Space':
            spacePressed = false;
            break;
        case 'KeyC':
        case 'ControlLeft':
            isSliding = false;
            break;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. Realistic 3D Clouds Generator
function create3DClouds() {
    clouds.forEach(c => scene.remove(c));
    clouds = [];

    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88
    });

    for (let i = 0; i < 35; i++) {
        const cloudGroup = new THREE.Group();
        const sphereCount = 6 + Math.floor(Math.random() * 5);

        for (let j = 0; j < sphereCount; j++) {
            const r = 7 + Math.random() * 9;
            const geo = new THREE.SphereGeometry(r, 16, 16);
            const mesh = new THREE.Mesh(geo, cloudMat);
            mesh.position.set(
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 14
            );
            cloudGroup.add(mesh);
        }

        const cx = (Math.random() - 0.5) * 450;
        const cy = 60 + Math.random() * 110;
        const cz = -40 - Math.random() * 1100;
        cloudGroup.position.set(cx, cy, cz);

        scene.add(cloudGroup);
        clouds.push(cloudGroup);
    }
}

// 8. 🌟 8 UNIQUE CUSTOM 3D BIOME VISUAL MESH GENERATORS 🌟
function clearSceneObjects() {
    platforms.forEach(p => scene.remove(p));
    movingPlatforms.forEach(p => scene.remove(p.mesh));
    walls.forEach(w => scene.remove(w));
    customBiomeMeshes.forEach(b => scene.remove(b));
    boosterPads.forEach(b => scene.remove(b));
    checkpoints.forEach(c => scene.remove(c.mesh));
    if (goalMesh) scene.remove(goalMesh);

    platforms = [];
    movingPlatforms = [];
    walls = [];
    customBiomeMeshes = [];
    boosterPads = [];
    checkpoints = [];
    goalMesh = null;
}

// 🏆 STAGE 50 DEDICATED DUAL GOLDEN CELESTIAL PYRAMIDS & CRYSTAL STARS! 🏆
function createStage50CelestialEnvironment() {
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.05,
        metalness: 0.95,
        emissive: 0xb45309
    });

    for (let z = -30; z >= -650; z -= 55) {
        const sides = [-60, 60];
        sides.forEach(x => {
            const h = 60 + Math.random() * 40;
            const pyramidGeo = new THREE.ConeGeometry(25, h, 4);
            const pyramidMesh = new THREE.Mesh(pyramidGeo, goldMat);
            pyramidMesh.position.set(x, h / 2 - 15, z);
            pyramidMesh.rotation.y = Math.PI / 4;

            // Hovering Diamond Crystal Top
            const crystalGeo = new THREE.OctahedronGeometry(6);
            const crystalMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.0, metalness: 1.0 });
            const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
            crystalMesh.position.set(0, h / 2 + 8, 0);
            pyramidMesh.add(crystalMesh);

            scene.add(pyramidMesh);
            customBiomeMeshes.push(pyramidMesh);
        });
    }
}

// 🌋 THEME 5: ERUPTING LAVA VOLCANO PEAKS MESH GENERATOR! 🌋
function createVolcanoEnvironment() {
    const volcanoMat = new THREE.MeshStandardMaterial({
        color: 0x2a0800,
        roughness: 0.9,
        metalness: 0.2
    });

    const magmaCraterMat = new THREE.MeshBasicMaterial({
        color: 0xff3300
    });

    for (let z = -40; z >= -650; z -= 65) {
        const sides = [-65, 65];
        sides.forEach(x => {
            const h = 75 + Math.random() * 55;
            const radius = 35 + Math.random() * 20;

            const volcanoGeo = new THREE.ConeGeometry(radius, h, 16);
            const volcanoMesh = new THREE.Mesh(volcanoGeo, volcanoMat);
            volcanoMesh.position.set(x, h / 2 - 25, z);
            volcanoMesh.receiveShadow = true;
            volcanoMesh.castShadow = true;

            // Lava Glowing Crater Top
            const craterGeo = new THREE.CylinderGeometry(radius * 0.2, radius * 0.25, 3, 16);
            const craterMesh = new THREE.Mesh(craterGeo, magmaCraterMat);
            craterMesh.position.set(0, h / 2 - 1, 0);
            volcanoMesh.add(craterMesh);

            scene.add(volcanoMesh);
            customBiomeMeshes.push(volcanoMesh);
        });
    }
}

// 🌌 THEME 3: COSMIC CRYSTAL ASTEROIDS & RINGED SATURN PLANET! 🌌
function createCosmicEnvironment() {
    const saturnGeo = new THREE.SphereGeometry(35, 32, 32);
    const saturnMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.2, metalness: 0.8 });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
    saturnMesh.position.set(-140, 80, -320);

    const ringGeo = new THREE.RingGeometry(45, 75, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    saturnMesh.add(ringMesh);

    scene.add(saturnMesh);
    customBiomeMeshes.push(saturnMesh);

    const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x581c87
    });

    for (let z = -20; z >= -650; z -= 35) {
        const sides = [-55, 55];
        sides.forEach(x => {
            const size = 8 + Math.random() * 12;
            const geo = new THREE.OctahedronGeometry(size);
            const mesh = new THREE.Mesh(geo, crystalMat);
            mesh.position.set(x, 15 + Math.random() * 45, z);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

            scene.add(mesh);
            customBiomeMeshes.push(mesh);
        });
    }
}

// 🌲 THEME 4: 3D PINE TREES & EMERALD FOREST PILLARS! 🌲
function createAuroraForestEnvironment() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.4, metalness: 0.2 });

    for (let z = -20; z >= -650; z -= 30) {
        const sides = [-52, 52];
        sides.forEach(x => {
            const treeGroup = new THREE.Group();

            const trunkGeo = new THREE.CylinderGeometry(2, 3, 18, 8);
            const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
            trunkMesh.position.y = 9;
            treeGroup.add(trunkMesh);

            for (let i = 0; i < 3; i++) {
                const leafGeo = new THREE.ConeGeometry(14 - i * 3, 16, 8);
                const leafMesh = new THREE.Mesh(leafGeo, leafMat);
                leafMesh.position.y = 18 + i * 9;
                treeGroup.add(leafMesh);
            }

            treeGroup.position.set(x, -10, z);
            scene.add(treeGroup);
            customBiomeMeshes.push(treeGroup);
        });
    }
}

// ⚡ THEME 6: CYBERPUNK NEON SPIRES! ⚡
function createCyberpunkEnvironment() {
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x11041d, roughness: 0.2, metalness: 0.9 });
    const neonMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

    for (let z = -20; z >= -650; z -= 32) {
        const sides = [-50, 50];
        sides.forEach(x => {
            const h = 60 + Math.random() * 50;
            const geo = new THREE.BoxGeometry(10, h, 10);
            const mesh = new THREE.Mesh(geo, spireMat);
            mesh.position.set(x, h / 2 - 20, z);

            const bandGeo = new THREE.BoxGeometry(10.6, 2, 10.6);
            const bandMesh = new THREE.Mesh(bandGeo, neonMat);
            bandMesh.position.y = h * 0.3;
            mesh.add(bandMesh);

            scene.add(mesh);
            customBiomeMeshes.push(mesh);
        });
    }
}

// ⭐ THEME 7 (SPECIAL): RAINBOW PARADISE ARCHES & GOLDEN STARS! ⭐
function createRainbowParadiseEnvironment() {
    const archMat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.65 });

    for (let z = -50; z >= -1200; z -= 80) {
        const archGeo = new THREE.TorusGeometry(45, 3.5, 16, 32, Math.PI);
        const archMesh = new THREE.Mesh(archGeo, archMat);
        archMesh.position.set(0, 15, z);
        scene.add(archMesh);
        customBiomeMeshes.push(archMesh);
    }
}

// 🏢 THEME 1 & 2: MODERN CITY SKYSCRAPERS 🏢
function createCityEnvironment(theme) {
    for (let z = -20; z >= -650; z -= 28) {
        const sides = [-48, 48];
        sides.forEach(x => {
            const h = 45 + Math.random() * 65;
            const w = 16 + Math.random() * 12;
            const d = 16 + Math.random() * 12;

            const geo = new THREE.BoxGeometry(w, h, d);
            const mat = new THREE.MeshStandardMaterial({
                color: theme.bldgColor,
                roughness: 0.4,
                metalness: 0.5
            });
            const bldg = new THREE.Mesh(geo, mat);
            bldg.position.set(x, h / 2 - 20, z);
            bldg.receiveShadow = true;
            bldg.castShadow = true;

            scene.add(bldg);
            customBiomeMeshes.push(bldg);
        });
    }
}

// Master Biome Visual Switcher
function applyStageTheme(stageKey) {
    const theme = getThemeForStage(stageKey);
    themeNameDisplay.textContent = theme.name;

    const skyTexture = createSkyGradientTexture(theme.skyTop, theme.skyBottom);
    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(theme.fog, 0.0035);
    sunMat.color.setHex(theme.sun);

    if (stageKey === 50) {
        createStage50CelestialEnvironment();
    } else if (theme.id === 5) {
        createVolcanoEnvironment();
    } else if (theme.id === 3) {
        createCosmicEnvironment();
    } else if (theme.id === 4) {
        createAuroraForestEnvironment();
    } else if (theme.id === 6) {
        createCyberpunkEnvironment();
    } else if (stageKey === 'special') {
        createRainbowParadiseEnvironment();
    } else {
        createCityEnvironment(theme);
    }

    create3DClouds();
}

function createPlatform(x, y, z, w, h, d, theme) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
        color: theme.platBody,
        roughness: theme.roughness,
        metalness: theme.metalness
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);
    platforms.push(mesh);
    return mesh;
}

function createMovingPlatform(x, y, z, w, h, d, theme, range = 5.0, speed = 2.0) {
    const mesh = createPlatform(x, y, z, w, h, d, theme);
    movingPlatforms.push({
        mesh: mesh,
        originX: x,
        range: range,
        speed: speed
    });
}

function updateMovingPlatforms(time) {
    movingPlatforms.forEach(p => {
        p.mesh.position.x = p.originX + Math.sin(time * p.speed) * p.range;
    });
}

function createWall(x, y, z, w, h, d, theme) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
        color: theme.wallBody,
        roughness: 0.3,
        metalness: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);
    walls.push(mesh);
    return mesh;
}

function createBoosterPad(x, y, z) {
    const geo = new THREE.BoxGeometry(4, 0.4, 4);
    const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9, emissive: 0x0284c7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1.1, z);

    scene.add(mesh);
    boosterPads.push(mesh);
    return mesh;
}

function createCheckpointPlatform(x, y, z, theme) {
    const platGeo = new THREE.BoxGeometry(8, 2, 8);
    const platMat = new THREE.MeshStandardMaterial({
        color: theme.cpPlat,
        roughness: 0.2,
        metalness: 0.5
    });
    const platMesh = new THREE.Mesh(platGeo, platMat);
    platMesh.position.set(x, y, z);
    platMesh.receiveShadow = true;
    platMesh.castShadow = true;

    scene.add(platMesh);
    platforms.push(platMesh);

    const pillarGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
        color: theme.cpPillar,
        roughness: 0.1,
        metalness: 0.8,
        emissive: theme.cpEmissive
    });
    const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
    pillarMesh.position.set(x, y + 4, z);
    scene.add(pillarMesh);

    checkpoints.push({
        mesh: pillarMesh,
        pos: new THREE.Vector3(x, y + 3, z),
        triggered: false
    });
}

function createGoal(x, y, z) {
    const geo = new THREE.BoxGeometry(12, 2, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.1, metalness: 0.9 });
    goalMesh = new THREE.Mesh(geo, mat);
    goalMesh.position.set(x, y, z);

    const beamGeo = new THREE.CylinderGeometry(2, 2, 40, 16);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.35 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 20, 0);
    goalMesh.add(beam);

    scene.add(goalMesh);
    platforms.push(goalMesh);
}

// Stage Builder for 50 Massive Stages
function loadStage(stage) {
    clearSceneObjects();
    currentStage = stage;
    stageNumDisplay.textContent = currentStage;

    if (typeof stage === 'number') {
        savedStage = stage;
        localStorage.setItem('savedStage', savedStage.toString());
    }

    applyStageTheme(stage);
    const theme = getThemeForStage(stage);

    spawnPoint.set(0, 3, 0);
    createPlatform(0, -1, 0, 10, 2, 10, theme);

    let currentZ = -18;
    let currentY = 1;
    let currentX = 0;

    const numSteps = 16 + Math.floor(stage * 0.8);

    for (let i = 0; i < numSteps; i++) {
        const isCheckpointStep = (i === Math.floor(numSteps * 0.25) || i === Math.floor(numSteps * 0.5) || i === Math.floor(numSteps * 0.75));
        const isLastStepBeforeGoal = (i === numSteps - 1);

        if (isCheckpointStep) {
            createCheckpointPlatform(currentX, currentY, currentZ, theme);
        } else {
            const platWidth = Math.max(3.5, 5.5 - stage * 0.04);

            if (i % 3 === 1 && i > 2) {
                createMovingPlatform(currentX, currentY, currentZ, platWidth, 2, platWidth, theme, 4.5 + Math.random() * 2.5, 2.4);
            } else {
                createPlatform(currentX, currentY, currentZ, platWidth, 2, platWidth, theme);
            }

            if (isLastStepBeforeGoal || stage === 1 && i % 4 === 3) {
                createBoosterPad(currentX, currentY, currentZ);
            } else if (i % 3 === 2) {
                const wallSideX = currentX + (Math.random() > 0.5 ? 5.0 : -5.0);
                createWall(wallSideX, currentY + 6, currentZ - 6, 1, 16, 18, theme);
            } else if (i % 4 === 2) {
                createBoosterPad(currentX, currentY, currentZ);
            }
        }

        currentZ -= 18 + Math.random() * 5;
        currentY += 2.4 + Math.random() * 2.2;
        currentX += (Math.random() > 0.5 ? 1 : -1) * (4.0 + Math.random() * 4.0);
    }

    createGoal(currentX, currentY + 4, currentZ - 12);

    activeCheckpointPos.copy(spawnPoint);
    respawnPlayer();
}

// 👑 ULTRA EXTENDED EXTREME HARD SPECIAL STAGE GENERATOR 👑
function loadSpecialStage() {
    if (highestStageCleared < 50) {
        alert("🔒 스페셜 무지개 파쿠르 코스는 50단계를 완파하셔야 해금됩니다!");
        return;
    }

    clearSceneObjects();
    currentStage = 'special';
    stageNumDisplay.textContent = '⭐';

    applyStageTheme('special');
    const theme = biomeThemes.special;

    spawnPoint.set(0, 3, 0);
    createPlatform(0, -1, 0, 14, 2, 14, theme);

    let currentZ = -22;
    let currentY = 2;
    let currentX = 0;

    const totalSpecialSteps = 55;

    for (let i = 0; i < totalSpecialSteps; i++) {
        const isCheckpoint = (i === 15 || i === 30 || i === 45);

        if (isCheckpoint) {
            createCheckpointPlatform(currentX, currentY, currentZ, theme);
        } else {
            const platW = 2.4 + Math.random() * 0.8;
            const platD = 2.4 + Math.random() * 0.8;

            if (i % 4 === 1) {
                createMovingPlatform(currentX, currentY, currentZ, platW, 2, platD, theme, 7.5 + Math.random() * 2.0, 4.2);
            } else {
                createPlatform(currentX, currentY, currentZ, platW, 2, platD, theme);
            }

            if (i % 5 === 2) {
                const wallX = currentX + (i % 2 === 0 ? 5.5 : -5.5);
                createWall(wallX, currentY + 8, currentZ - 8, 1, 20, 26, theme);
            } else if (i % 6 === 4) {
                createBoosterPad(currentX, currentY, currentZ);
            }
        }

        currentZ -= 20 + Math.random() * 6;
        currentY += 3.2 + Math.random() * 2.5;
        currentX += (Math.sin(i * 0.7) * 7.5);
    }

    createGoal(currentX, currentY + 4, currentZ - 15);

    activeCheckpointPos.copy(spawnPoint);
    respawnPlayer();
}

// Respawn Player with Screen Shake & Timer Reset!
function respawnPlayer() {
    playerPos.copy(activeCheckpointPos);
    camera.position.copy(activeCheckpointPos);
    camera.rotation.set(0, 0, 0);
    velocity.set(0, 0, 0);

    startTime = performance.now();
    elapsedTime = 0;
    timerDisplay.textContent = '00:00.0';

    triggerScreenShake();

    isFlying = false;
    flyBadge.classList.add('hidden');

    isWallRunning = false;
    wallRunStamina = 2.0;
    wallRunCooldown = 0;

    wallBadge.classList.add('hidden');
    wallCdBadge.classList.add('hidden');
    slideBadge.classList.add('hidden');
    boosterBadge.classList.add('hidden');
}

// Special Stage Lock Manager for 50 Stages
function updateSpecialStageLockStatus() {
    const isSpecialUnlocked = highestStageCleared >= 50;

    if (isSpecialUnlocked) {
        specialStageHomeBtn.disabled = false;
        specialStageHomeBtn.textContent = '⭐ 익스트림 무지개 스페셜 (해금 완료!)';
        specialStageHudBtn.disabled = false;
        specialStageHudBtn.textContent = '⭐ 익스트림 스페셜';
    } else {
        specialStageHomeBtn.disabled = true;
        specialStageHomeBtn.textContent = '🔒 ⭐ 스페셜 무지개 코스 (50단계 클리어 시 해금)';
        specialStageHudBtn.disabled = true;
        specialStageHudBtn.textContent = '🔒 스페셜 (50단계 해금)';
    }
}

// 9. Closet UI Manager & Full Reset Support
function updateClosetUI() {
    const isThunderUnlocked = highestStageCleared >= 10;
    const isEmeraldUnlocked = highestStageCleared >= 20;
    const isDiamondUnlocked = highestStageCleared >= 30;

    thunderStatusTag.textContent = isThunderUnlocked ? '✅ 해금 완료! (화염 이펙트)' : '🔒 10단계 클리어 시 해금 (화염 이펙트)';
    thunderStatusTag.className = isThunderUnlocked ? 'char-status unlocked-tag' : 'char-status locked-tag';
    cardThunder.className = isThunderUnlocked ? 'char-card unlocked skin-thunder' : 'char-card locked skin-thunder';
    equipThunderBtn.disabled = !isThunderUnlocked;
    equipThunderBtn.className = isThunderUnlocked ? 'equip-btn unlocked-btn' : 'equip-btn';
    if (!isThunderUnlocked) equipThunderBtn.textContent = '잠김 🔒';

    emeraldStatusTag.textContent = isEmeraldUnlocked ? '✅ 해금 완료! (나뭇잎 이펙트)' : '🔒 20단계 클리어 시 해금 (나뭇잎 이펙트)';
    emeraldStatusTag.className = isEmeraldUnlocked ? 'char-status unlocked-tag' : 'char-status locked-tag';
    cardEmerald.className = isEmeraldUnlocked ? 'char-card unlocked skin-emerald' : 'char-card locked skin-emerald';
    equipEmeraldBtn.disabled = !isEmeraldUnlocked;
    equipEmeraldBtn.className = isEmeraldUnlocked ? 'equip-btn unlocked-btn' : 'equip-btn';
    if (!isEmeraldUnlocked) equipEmeraldBtn.textContent = '잠김 🔒';

    diamondStatusTag.textContent = isDiamondUnlocked ? '✅ 해금 완료! (얼음 이펙트)' : '🔒 30단계 클리어 시 해금 (얼음 이펙트)';
    diamondStatusTag.className = isDiamondUnlocked ? 'char-status unlocked-tag' : 'char-status locked-tag';
    cardDiamond.className = isDiamondUnlocked ? 'char-card unlocked skin-diamond' : 'char-card locked skin-diamond';
    equipDiamondBtn.disabled = !isDiamondUnlocked;
    equipDiamondBtn.className = isDiamondUnlocked ? 'equip-btn unlocked-btn' : 'equip-btn';
    if (!isDiamondUnlocked) equipDiamondBtn.textContent = '잠김 🔒';

    rainbowStatusTag.textContent = isRainbowUnlocked ? '✅ 해금 완료! (무지개 폭죽 이펙트)' : '🔒 스페셜 완주 시 해금 (무지개 이펙트)';
    rainbowStatusTag.className = isRainbowUnlocked ? 'char-status unlocked-tag' : 'char-status locked-tag';
    cardRainbow.className = isRainbowUnlocked ? 'char-card unlocked full-width skin-rainbow' : 'char-card locked full-width skin-rainbow';
    equipRainbowBtn.disabled = !isRainbowUnlocked;
    equipRainbowBtn.className = isRainbowUnlocked ? 'equip-btn unlocked-btn' : 'equip-btn';
    if (!isRainbowUnlocked) equipRainbowBtn.textContent = '잠김 🔒';

    [cardBasic, cardThunder, cardEmerald, cardDiamond, cardRainbow].forEach(c => c.classList.remove('selected'));
    [equipBasicBtn, equipThunderBtn, equipEmeraldBtn, equipDiamondBtn, equipRainbowBtn].forEach(b => {
        b.classList.remove('active');
        if (!b.disabled) b.textContent = '장착하기';
    });

    if (equippedSkin === 'thunder' && isThunderUnlocked) {
        cardThunder.classList.add('selected');
        equipThunderBtn.classList.add('active');
        equipThunderBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#ef4444';
        crosshair.style.boxShadow = '0 0 15px #ef4444, 0 0 25px #f97316';
    } else if (equippedSkin === 'emerald' && isEmeraldUnlocked) {
        cardEmerald.classList.add('selected');
        equipEmeraldBtn.classList.add('active');
        equipEmeraldBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#10b981';
        crosshair.style.boxShadow = '0 0 15px #10b981, 0 0 25px #34d399';
    } else if (equippedSkin === 'diamond' && isDiamondUnlocked) {
        cardDiamond.classList.add('selected');
        equipDiamondBtn.classList.add('active');
        equipDiamondBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#06b6d4';
        crosshair.style.boxShadow = '0 0 15px #06b6d4, 0 0 38bdf8';
    } else if (equippedSkin === 'rainbow' && isRainbowUnlocked) {
        cardRainbow.classList.add('selected');
        equipRainbowBtn.classList.add('active');
        equipRainbowBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#ec4899';
        crosshair.style.boxShadow = '0 0 18px #ec4899, 0 0 30px #f59e0b, 0 0 40px #38bdf8';
    } else {
        equippedSkin = 'basic';
        localStorage.setItem('equippedSkin', 'basic');
        cardBasic.classList.add('selected');
        equipBasicBtn.classList.add('active');
        equipBasicBtn.textContent = '장착 중';
        crosshair.style.backgroundColor = '#38bdf8';
        crosshair.style.boxShadow = '0 0 12px #38bdf8';
    }

    updateCharacterSelectUI();
    updateTitleDisplays();
    updateSpecialStageLockStatus();
}

equipBasicBtn.addEventListener('click', () => { equippedSkin = 'basic'; localStorage.setItem('equippedSkin', 'basic'); updateClosetUI(); });
equipThunderBtn.addEventListener('click', () => { equippedSkin = 'thunder'; localStorage.setItem('equippedSkin', 'thunder'); updateClosetUI(); });
equipEmeraldBtn.addEventListener('click', () => { equippedSkin = 'emerald'; localStorage.setItem('equippedSkin', 'emerald'); updateClosetUI(); });
equipDiamondBtn.addEventListener('click', () => { equippedSkin = 'diamond'; localStorage.setItem('equippedSkin', 'diamond'); updateClosetUI(); });
equipRainbowBtn.addEventListener('click', () => { equippedSkin = 'rainbow'; localStorage.setItem('equippedSkin', 'rainbow'); updateClosetUI(); });

// Reset Stage Progress AND All Skin Unlocks & Titles!
function resetStageProgressAndSkins() {
    savedStage = 1;
    highestStageCleared = 0;
    isRainbowUnlocked = false;
    equippedSkin = 'basic';
    selectedCharacter = 'dragon';
    isAdminActive = false;

    localStorage.setItem('savedStage', '1');
    localStorage.setItem('highestStageCleared', '0');
    localStorage.setItem('isRainbowUnlocked', 'false');
    localStorage.setItem('equippedSkin', 'basic');
    localStorage.setItem('selectedCharacter', 'dragon');
    localStorage.setItem('isAdminActive', 'false');

    updateClosetUI();
    updateHomeLobbyUI();
}

// 10. Home Lobby UI Update & Navigation State Manager
function updateHomeLobbyUI() {
    updateCharacterSelectUI();
    updateTitleDisplays();
    updateSpecialStageLockStatus();
    if (savedStage > 1) {
        startGameHomeBtn.textContent = `🚀 이어서 도전 (스테이지 ${savedStage})`;
        resetStageHomeBtn.classList.remove('hidden');
    } else {
        startGameHomeBtn.textContent = '⚡ 1단계 도전 시작';
        resetStageHomeBtn.classList.add('hidden');
    }
}

function goToHome() {
    controls.unlock();
    gameState = 'home';
    isTimerRunning = false;
    audioEngine.stopBgm();

    updateHomeLobbyUI();

    homeOverlay.classList.remove('hidden');
    closetOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    camera.position.set(0, 10, 25);
    camera.lookAt(0, 0, 0);
}

function startPlaying(stage = 1) {
    gameState = 'playing';
    homeOverlay.classList.add('hidden');
    closetOverlay.classList.add('hidden');
    victoryOverlay.classList.add('hidden');

    updateCharacterSelectUI();
    updateTitleDisplays();

    if (stage === 'special') {
        loadSpecialStage();
    } else {
        loadStage(stage);
    }
    controls.lock();
    audioEngine.startBgm();
}

function openCloset() {
    gameState = 'closet';
    updateClosetUI();
    homeOverlay.classList.add('hidden');
    closetOverlay.classList.remove('hidden');
}

// Binds
startGameHomeBtn.addEventListener('click', () => startPlaying(savedStage));
resetStageHomeBtn.addEventListener('click', () => {
    resetStageProgressAndSkins();
    startPlaying(1);
});

specialStageHomeBtn.addEventListener('click', () => startPlaying('special'));
closetHomeBtn.addEventListener('click', openCloset);
closeClosetBtn.addEventListener('click', goToHome);
homeNavBtn.addEventListener('click', goToHome);
returnHomeBtn.addEventListener('click', goToHome);
specialStageHudBtn.addEventListener('click', () => startPlaying('special'));

document.body.addEventListener('click', (e) => {
    if (gameState === 'home' || gameState === 'closet') return;
    if (e.target.closest('.overlay') || e.target.closest('#hudContainer')) return;
    if (gameState === 'playing' && !controls.isLocked) {
        controls.lock();
        audioEngine.startBgm();
    }
});

// 11. Timer & Checkpoints
function updateTimer() {
    if (isTimerRunning) {
        const currentTime = performance.now();
        elapsedTime = (currentTime - startTime) / 1000;
        const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }
}

// 12. Wall Running & Solid Wall Collision Engine
function checkWallRun(delta) {
    let nearWall = false;
    let wallNormal = new THREE.Vector3();

    const checkPos = playerPos.clone();
    checkPos.y -= 0.8;

    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];

    const raycaster = new THREE.Raycaster();
    for (const dir of directions) {
        raycaster.set(checkPos, dir);
        const intersects = raycaster.intersectObjects(walls);
        if (intersects.length > 0 && intersects[0].distance < 2.5) {
            nearWall = true;
            wallNormal.copy(intersects[0].face.normal);
            break;
        }
    }

    if (wallRunCooldown > 0) {
        wallRunCooldown -= delta;
        wallCdBadge.classList.remove('hidden');
        wallCdBadge.textContent = `⏳ 벽 타기 쿨타임 중... (${Math.max(0, wallRunCooldown).toFixed(1)}초)`;
        isWallRunning = false;
        wallBadge.classList.add('hidden');
        return;
    } else {
        wallCdBadge.classList.add('hidden');
    }

    if (nearWall && !canJump && (moveForward || moveLeft || moveRight || moveBackward)) {
        if (wallRunStamina > 0) {
            isWallRunning = true;
            currentWallNormal.copy(wallNormal);
            wallRunStamina -= delta;
            wallBadge.classList.remove('hidden');
            spawnSkinParticles('wall', 2);

            playerPos.x += currentWallNormal.x * 0.1;
            playerPos.z += currentWallNormal.z * 0.1;

            if (wallRunStamina <= 0) {
                isWallRunning = false;
                wallRunCooldown = 1.5;
                wallBadge.classList.add('hidden');
            }
        }
    } else {
        isWallRunning = false;
        wallBadge.classList.add('hidden');
    }

    camera.rotation.z = 0;
}

function checkBoosterPads() {
    boosterPads.forEach((pad) => {
        const box = new THREE.Box3().setFromObject(pad);
        const px = playerPos.x;
        const py = playerPos.y;
        const pz = playerPos.z;

        if (px >= box.min.x - 1.0 && px <= box.max.x + 1.0 &&
            pz >= box.min.z - 1.0 && pz <= box.max.z + 1.0 &&
            py >= box.min.y && py <= box.max.y + 3.0) {
            
            velocity.y = 28;
            boosterBadge.classList.remove('hidden');
            setTimeout(() => boosterBadge.classList.add('hidden'), 1500);
            spawnSkinParticles('boost', 25);
            audioEngine.playBoostSound();
        }
    });
}

function resolveWallCollisions() {
    const playerRadius = 1.4;

    walls.forEach((w) => {
        const box = new THREE.Box3().setFromObject(w);

        if (playerPos.y >= box.min.y - 1.8 && playerPos.y <= box.max.y + 1.8) {
            const expMinX = box.min.x - playerRadius;
            const expMaxX = box.max.x + playerRadius;
            const expMinZ = box.min.z - playerRadius;
            const expMaxZ = box.max.z + playerRadius;

            if (playerPos.x > expMinX && playerPos.x < expMaxX &&
                playerPos.z > expMinZ && playerPos.z < expMaxZ) {

                const dLeft = Math.abs(playerPos.x - expMinX);
                const dRight = Math.abs(playerPos.x - expMaxX);
                const dBack = Math.abs(playerPos.z - expMinZ);
                const dFront = Math.abs(playerPos.z - expMaxZ);

                const minDist = Math.min(dLeft, dRight, dBack, dFront);

                if (minDist === dLeft) playerPos.x = expMinX;
                else if (minDist === dRight) playerPos.x = expMaxX;
                else if (minDist === dBack) playerPos.z = expMinZ;
                else if (minDist === dFront) playerPos.z = expMaxZ;
            }
        }
    });
}

function checkCheckpoints() {
    checkpoints.forEach(cp => {
        if (!cp.triggered) {
            const dist = playerPos.distanceTo(cp.pos);
            if (dist < 3.5) {
                cp.triggered = true;
                activeCheckpointPos.copy(cp.pos);
                cp.mesh.material.color.setHex(0xfacc15);

                checkpointBadge.classList.remove('hidden');
                setTimeout(() => checkpointBadge.classList.add('hidden'), 2000);
                spawnSkinParticles('boost', 20);
                audioEngine.playCheckpointSound();
            }
        }
    });
}

function checkGoal() {
    if (goalMesh) {
        const box = new THREE.Box3().setFromObject(goalMesh);
        const px = playerPos.x;
        const py = playerPos.y;
        const pz = playerPos.z;

        if (px >= box.min.x && px <= box.max.x &&
            pz >= box.min.z && pz <= box.max.z &&
            py >= box.min.y && py <= box.max.y + 4.0) {
            stageComplete();
        }
    }
}

function stageComplete() {
    controls.unlock();
    gameState = 'victory';
    isTimerRunning = false;
    audioEngine.playVictorySound();

    const mins = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const secs = (elapsedTime % 60).toFixed(1).padStart(4, '0');
    finalTimeDisplay.textContent = `${mins}:${secs}`;

    let newTitleAwarded = false;

    if (currentStage !== 'special') {
        if (currentStage > highestStageCleared) {
            highestStageCleared = currentStage;
            localStorage.setItem('highestStageCleared', highestStageCleared.toString());
            unlockNoticeBanner.classList.remove('hidden');
            if (currentStage === 50) {
                unlockNoticeBanner.textContent = `🎉 50단계 최종 완파 성공! ⭐ 스페셜 무지개 파쿠르 코스가 해금되었습니다!`;
            } else {
                unlockNoticeBanner.textContent = `🎉 스테이지 ${currentStage} 클리어! 드레스룸에서 새로 해금된 이펙트 스킨과 칭호를 확인하세요!`;
            }
            newTitleAwarded = true;
        } else {
            unlockNoticeBanner.classList.add('hidden');
        }

        savedStage = currentStage + 1;
        if (savedStage > 50) savedStage = 1;
        localStorage.setItem('savedStage', savedStage.toString());
    } else {
        if (!isRainbowUnlocked) {
            isRainbowUnlocked = true;
            localStorage.setItem('isRainbowUnlocked', 'true');
            unlockNoticeBanner.classList.remove('hidden');
            unlockNoticeBanner.textContent = '🎉 ⭐ 초장대 극악 스페셜 완주! 갓 레인보우 히어로 이펙트 해금 성공!';
            newTitleAwarded = true;
        } else {
            unlockNoticeBanner.classList.add('hidden');
        }
    }

    const currentTitle = getUserTitle(highestStageCleared, isRainbowUnlocked);
    updateTitleDisplays();

    if (newTitleAwarded) {
        awardedTitleBanner.classList.remove('hidden');
        awardedTitleText.textContent = currentTitle;
        if (currentStage === 'special') {
            awardedTitleHeader.textContent = '👑 최고 존엄 칭호 등극!';
        } else {
            awardedTitleHeader.textContent = '🎖️ 신규 칭호 달성!';
        }
    } else {
        awardedTitleBanner.classList.add('hidden');
    }

    if (currentStage === 'special') {
        victoryTitle.textContent = '⭐ 초장대 극악 스페셜 완주 성공!';
        victoryMessage.textContent = '전설입니다! 1,200m에 달하는 초장대 극악 무지개 코스를 완파하셨습니다!';
        nextStageBtn.textContent = '1단계로 시작 ▶';
        nextStageBtn.style.display = 'block';
    } else if (currentStage < 50) {
        victoryTitle.textContent = `🎉 스테이지 ${currentStage} 클리어!`;
        victoryMessage.textContent = '훌륭합니다! 다음 고난도 스테이지 도전 준비가 되셨나요?';
        nextStageBtn.textContent = '다음 스테이지 ▶';
        nextStageBtn.style.display = 'block';
    } else {
        victoryTitle.textContent = '🏆 50단계 완주! 파쿠르 전설 신화 등극!';
        victoryMessage.textContent = '축하합니다! 50개의 모든 파쿠르 코스를 완파하여 ⭐ 스페셜 무지개 코스가 해금되었습니다!';
        nextStageBtn.textContent = '⭐ 스페셜 무지개 코스 도전 ▶';
        nextStageBtn.style.display = 'block';
    }

    updateSpecialStageLockStatus();
    victoryOverlay.classList.remove('hidden');
}

// Victory Modal Buttons
nextStageBtn.addEventListener('click', () => {
    victoryOverlay.classList.add('hidden');
    if (currentStage === 'special') {
        startPlaying(1);
    } else if (currentStage === 50) {
        startPlaying('special');
    } else {
        startPlaying(currentStage + 1);
    }
});

restartGameBtn.addEventListener('click', () => {
    victoryOverlay.classList.add('hidden');
    startTime = performance.now();
    isTimerRunning = true;
    if (currentStage === 'special') {
        startPlaying('special');
    } else {
        startPlaying(1);
    }
});

// 13. Main Game Loop (Pure 1st Person FPS Parkour & Admin Fly Mode)
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    clouds.forEach(c => {
        c.position.x += 0.03;
        if (c.position.x > 180) c.position.x = -180;
    });

    if (gameState === 'home') {
        const angle = performance.now() * 0.0003;
        camera.position.x = Math.sin(angle) * 35;
        camera.position.z = Math.cos(angle) * 35;
        camera.position.y = 15;
        camera.lookAt(0, 5, 0);
        renderer.render(scene, camera);
        return;
    }

    if (controls.isLocked && gameState === 'playing') {
        if (!isTimerRunning) {
            startTime = performance.now() - (elapsedTime * 1000);
            isTimerRunning = true;
        }

        const time = performance.now() * 0.001;
        const delta = (performance.now() - prevTime) / 1000;

        updateTimer();
        updateMovingPlatforms(time);

        if (!isFlying) {
            checkWallRun(delta);
        }

        checkBoosterPads();
        checkCheckpoints();
        checkGoal();
        updateSkinParticles(delta);

        const targetEyeHeight = isSliding ? slideHeight : normalHeight;

        if (isSliding && !isFlying) {
            slideBadge.classList.remove('hidden');
            spawnSkinParticles('slide', 2);
        } else {
            slideBadge.classList.add('hidden');
        }

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // 🛸 FREE FLYING MODE PHYSICS ENGINE 🛸
        if (isFlying) {
            velocity.y = 0; // ZERO GRAVITY!

            if (spacePressed) {
                playerPos.y += 24.0 * delta; // Fly UP into sky!
                spawnSkinParticles('boost', 2);
            }
            if (shiftPressed) {
                playerPos.y -= 24.0 * delta; // Fly DOWN to ground!
                spawnSkinParticles('boost', 2);
            }

            spawnSkinParticles('run', 1);
        } else {
            if (isWallRunning) {
                velocity.y = Math.max(velocity.y - 8.0 * delta, -3.0);
            } else {
                velocity.y -= gravity * delta;
            }
        }

        const direction = new THREE.Vector3();
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speedMultiplier = isFlying ? 340.0 : (isSliding ? 240.0 : 220.0);

        if (moveForward || moveBackward) {
            velocity.z -= direction.z * speedMultiplier * delta;
            spawnSkinParticles('run', 1);
        }
        if (moveLeft || moveRight) {
            velocity.x -= direction.x * speedMultiplier * delta;
            spawnSkinParticles('run', 1);
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        playerPos.x = camera.position.x;
        playerPos.z = camera.position.z;

        if (!isFlying) {
            playerPos.y += velocity.y * delta;
            resolveWallCollisions();
        }

        camera.position.set(playerPos.x, playerPos.y, playerPos.z);
        crosshair.style.opacity = '1';

        // Screen Shake Jitter
        if (shakeTime > 0) {
            shakeTime -= delta;
            camera.position.x += (Math.random() - 0.5) * 0.4;
            camera.position.y += (Math.random() - 0.5) * 0.4;
            camera.position.z += (Math.random() - 0.5) * 0.4;
        }

        if (!isFlying) {
            resolveWallCollisions();

            if (playerPos.y < -25) {
                respawnPlayer();
            } else {
                platforms.forEach((p) => {
                    const px = playerPos.x;
                    const py = playerPos.y;
                    const pz = playerPos.z;
                    const box = new THREE.Box3().setFromObject(p);

                    if (
                        px >= box.min.x &&
                        px <= box.max.x &&
                        pz >= box.min.z &&
                        pz <= box.max.z &&
                        py >= box.max.y &&
                        py <= box.max.y + targetEyeHeight &&
                        velocity.y <= 0
                    ) {
                        velocity.y = 0;
                        playerPos.y = box.max.y + targetEyeHeight;
                        canJump = true;
                        wallRunStamina = 2.0;
                        wallRunCooldown = 0;
                    }
                });
            }
        }

        prevTime = performance.now();
    } else {
        prevTime = performance.now();
    }

    renderer.render(scene, camera);
}

// Launch to Home
updateClosetUI();
loadStage(savedStage);
goToHome();
animate();
