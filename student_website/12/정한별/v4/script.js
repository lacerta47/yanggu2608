// 웹 오디오 API 효과음
class SoundManager {
    constructor() { this.ctx = null; }
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }
    playClick() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
    playStep() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(140 + Math.random() * 30, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.06);
    }
    playClay() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(220 + Math.random() * 80, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.08);
    }
    playFire() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150 + Math.random() * 50, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.12);
    }
    playChime() {
        if (!this.ctx) return;
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.4);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.12); osc.stop(this.ctx.currentTime + idx * 0.12 + 0.4);
        });
    }
    playPage() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    }
}

const sounds = new SoundManager();

const gameState = {
    day: 1,
    warmth: 0,
    potteryCountToday: 0,
    customerCountToday: 0,
    totalWarmthToday: 0,
    stepState: 'IDLE',
    currentOrder: null
};

const orderDatabase = [
    {
        npcName: "달님 할머니 👵", npcAvatar: "👵", itemTitle: "따스한 둥근 차잔",
        dialogue: "이른 새벽 공기가 차갑구려. 손을 따뜻하게 감싸쥘 수 있는 오목하고 포근한 차잔 하나 부탁하네.",
        targetProfile: [45, 55, 60, 62, 60, 55, 45, 35],
        letter: "할머니의 손길에 꼭 맞는 온기를 선물해 주어서 고맙네. 차 한 잔 마실 때마다 공방의 따스함이 떠오를 것 같아."
    },
    {
        npcName: "어린 화가 민우 🎨", npcAvatar: "🎨", itemTitle: "우아한 꽃병",
        dialogue: "새벽녘 들판에서 꺾은 작은 들꽃을 꽂아둘 길쭉하고 예쁜 붓꽃병이 필요해요!",
        targetProfile: [25, 30, 40, 55, 65, 40, 30, 50],
        letter: "제가 그린 새벽 화폭 옆에 놓아두었어요. 둥근 선이 너무 아늑해서 쳐다보기만 해도 기분이 좋아집니다."
    },
    {
        npcName: "숲속 정원사 수아 🌿", npcAvatar: "🌿", itemTitle: "아담한 흙화분",
        dialogue: "새로 틔운 다육이 싹을 심을 넓고 다부진 화분이 필요해요. 흙 냄새가 물씬 나는 것으로 빚어주세요.",
        targetProfile: [60, 62, 65, 65, 60, 55, 50, 45],
        letter: "정성스레 빚어주신 화분에 새 싹을 옮겨 심었어요. 흙과 가마의 기운 덕분에 화초가 아주 건강하게 잘 자랄 것 같아요!"
    },
    {
        npcName: "시인 하은 📜", npcAvatar: "📜", itemTitle: "새벽빛 머그잔",
        dialogue: "글을 쓰다 새벽을 맞이하곤 한답니다. 따뜻한 유자를 담아 마실 큼직한 머그잔을 기대할게요.",
        targetProfile: [50, 52, 55, 55, 55, 52, 50, 48],
        letter: "차가운 원고지 위에 머그잔을 올려놓으니 마음까지 고요해집니다. 글귀마다 공방의 온기가 묻어나는 듯해요."
    }
];

const monologues = [
    "어둠이 은은하게 물러가는 새벽 공기 속에서 손님의 마음을 생각하며 도자기를 빚었다. 흙을 어루만질 때마다 내 마음도 함께 차분해진다.",
    "가마 속 은은한 불꽃을 바라보며 기다림의 소중함을 배운 하루였다. 그릇에 담길 온기가 누군가의 새벽을 따스하게 밝혀주기를...",
    "공방 창가로 들어오는 보랏빛 별빛을 보며 일기를 적는다. 소소하지만 정성스런 일상이 모여 나의 작은 계절이 되어간다."
];

function loadGameData() {
    const saved = localStorage.getItem('season_workshop_save_v4');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState.day = parsed.day || 1;
            gameState.warmth = parsed.warmth || 0;
        } catch (e) { console.log(e); }
    }
    updateHUD();
}

function saveGameData() {
    localStorage.setItem('season_workshop_save_v4', JSON.stringify({ day: gameState.day, warmth: gameState.warmth }));
}

function updateHUD() {
    document.getElementById('dayText').textContent = `${gameState.day}일 차 (새벽녘)`;
    document.getElementById('warmthText').textContent = `온기 ${gameState.warmth}개`;
}

function switchScene(fromSceneId, toSceneId) {
    const fromScene = document.getElementById(fromSceneId);
    const toScene = document.getElementById(toSceneId);
    if (fromScene) { fromScene.classList.remove('active'); fromScene.classList.add('hidden'); }
    setTimeout(() => {
        if (toScene) { toScene.classList.remove('hidden'); toScene.classList.add('active'); }
    }, 400);
}

function typeWriterEffect(element, text, speed = 40, callback = null) {
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) { element.textContent += text.charAt(i); i++; }
        else { clearInterval(timer); if (callback) callback(); }
    }, speed);
}

function initTitleParticles() {
    const container = document.getElementById('titleParticles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 5 + 2;
        particle.style.cssText = `
            position: absolute; width: ${size}px; height: ${size}px;
            background: rgba(216, 180, 254, ${Math.random() * 0.6 + 0.2});
            border-radius: 50%; top: ${Math.random() * 100}%; left: ${Math.random() * 100}%;
            box-shadow: 0 0 10px rgba(216, 180, 254, 0.8);
            animation: floatParticle ${Math.random() * 6 + 4}s infinite alternate ease-in-out;
        `;
        container.appendChild(particle);
    }
}

// ----------------------------------------------------
// THREE.JS 고품질 리얼리스틱 3D 사람 & 도예 공방 시스템
// ----------------------------------------------------
let scene, camera, renderer;
let characterGroup, headGroup, leftArmGroup, rightArmGroup, leftLegGroup, rightLegGroup;
let candleLight, kilnFireLight;
let is3DInit = false;

const player3D = { x: 0, z: 2, speed: 0.12 };
const stations3D = [
    { id: 'door', name: '🚪 손님 맞이 문 앞', x: -6, z: -2, radius: 2.2 },
    { id: 'wheel', name: '🏺 물레 작업대', x: 6, z: -3, radius: 2.2 },
    { id: 'kiln', name: '🔥 가마', x: 6, z: 4, radius: 2.2 },
    { id: 'diary', name: '📖 하루 일기장 책상', x: -4, z: 4, radius: 2.2 }
];

let nearStation3D = null;
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

function initRealistic3DWorkshop() {
    if (is3DInit) return;
    is3DInit = true;

    const container = document.getElementById('canvasContainer');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0516);
    scene.fog = new THREE.FogExp2(0x150b28, 0.035);

    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 13, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 1. 분위기 리얼 조명 시스템
    const ambientLight = new THREE.AmbientLight(0xc084fc, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfde047, 0.85);
    sunLight.position.set(8, 18, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // 가마 불빛 붉은 조명
    kilnFireLight = new THREE.PointLight(0xf97316, 2.0, 10);
    kilnFireLight.position.set(6, 1.8, 4);
    scene.add(kilnFireLight);

    // 책상 촛불 온기 조명
    candleLight = new THREE.PointLight(0xfde047, 1.2, 8);
    candleLight.position.set(-4, 1.8, 4);
    scene.add(candleLight);

    // 2. 실제 공방 바닥 (나무 원목 타일 테두리)
    const floorGeo = new THREE.PlaneGeometry(22, 16);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x1f1435, roughness: 0.7, metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 나무 무늬 격자 데코
    const grid = new THREE.GridHelper(22, 11, 0xa855f7, 0x311b5e);
    grid.position.y = 0.01;
    scene.add(grid);

    // 3. 실제 공방 3D 스테이션 디자인
    buildRealisticStations();

    // 4. 섬세한 3D 사람 캐릭터 (도예 장인) 모델링
    buildRealisticHumanCharacter();

    // 이벤트 등록
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) keys[k] = true;
        if (e.key in keys) keys[e.key] = true;
        if (e.key === 'e' || e.key === 'E') triggerStationInteract3D();
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k in keys) keys[k] = false;
        if (e.key in keys) keys[e.key] = false;
    });

    document.querySelectorAll('.dpad-btn').forEach(btn => {
        const key = btn.dataset.key;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
        btn.addEventListener('mousedown', () => { keys[key] = true; });
        btn.addEventListener('mouseup', () => { keys[key] = false; });
    });

    window.addEventListener('resize', () => {
        if (!renderer || !camera) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate3DLoop();
}

// 실제 공방 구조물 (문, 물레, 가마, 책상) 디테일 생성
function buildRealisticStations() {
    // 🚪 1. 실제 나무 문
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.5 }));
    doorFrame.position.set(-6, 1.6, -2);
    doorFrame.castShadow = true;
    scene.add(doorFrame);

    const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.1), new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.1, transparent: true, opacity: 0.6 }));
    doorGlass.position.set(-6, 1.8, -1.8);
    scene.add(doorGlass);

    // 🏺 2. 실제 전동 물레 작업대
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.6 });
    const wheelTable = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 2.4), tableMat);
    wheelTable.position.set(6, 0.6, -3);
    wheelTable.castShadow = true;
    scene.add(wheelTable);

    // 물레 원판
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 32), new THREE.MeshStandardMaterial({ color: 0xd8b4fe, metalness: 0.5 }));
    disc.position.set(6, 1.28, -3);
    scene.add(disc);

    // 물레 위 찰흙
    const clay = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.9 }));
    clay.position.set(6, 1.6, -3);
    scene.add(clay);

    // 🔥 3. 실제 적돌 가마 (Red Brick Kiln)
    const kilnMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8 });
    const kilnBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.6), kilnMat);
    kilnBody.position.set(6, 1.2, 4);
    kilnBody.castShadow = true;
    scene.add(kilnBody);

    // 가마 연통
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16), kilnMat);
    chimney.position.set(6, 3.1, 4);
    scene.add(chimney);

    // 가마 불꽃 입구
    const fireEntrance = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.2), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    fireEntrance.position.set(6, 0.9, 2.65);
    scene.add(fireEntrance);

    // 📖 4. 원목 일기장 책상
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 2.0), new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.5 }));
    desk.position.set(-4, 0.55, 4);
    desk.castShadow = true;
    scene.add(desk);

    // 일기장 책
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: 0xfaf5ff }));
    book.position.set(-4, 1.15, 4);
    scene.add(book);
}

// 실제 사람 인체 비율의 3D 도예 장인 캐릭터 렌더링
function buildRealisticHumanCharacter() {
    characterGroup = new THREE.Group();

    // 피부 재질 (Soft Realistic Skin)
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });
    // 옷 재질 (보랏빛 자켓)
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.7 });
    // 앞치마 재질 (연보라 세라믹 앞치마)
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xe9d5ff, roughness: 0.5 });
    // 바지/신발 재질
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x311b5e, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    // 1. 머리 그룹 (Head & Face)
    headGroup = new THREE.Group();
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), skinMat);
    headMesh.scale.set(0.9, 1.1, 0.95);
    headGroup.add(headMesh);

    // 갈색 단정한 머리 헤어
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), hairMat);
    hairMesh.position.set(0, 0.1, -0.05);
    hairMesh.scale.set(0.95, 1.05, 0.95);
    headGroup.add(hairMesh);

    // 안경/눈 디테일
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1035 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
    eyeL.position.set(-0.14, 0.05, 0.38);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
    eyeR.position.set(0.14, 0.05, 0.38);
    headGroup.add(eyeL); headGroup.add(eyeR);

    headGroup.position.y = 2.1;
    characterGroup.add(headGroup);

    // 2. 몸통 (Torso & Apron)
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 1.0, 16), clothMat);
    torsoMesh.position.y = 1.35;
    characterGroup.add(torsoMesh);

    // 앞치마
    const apronMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.85, 0.12), apronMat);
    apronMesh.position.set(0, 1.25, 0.22);
    characterGroup.add(apronMesh);

    // 3. 팔 관절 그룹 (Left & Right Arms)
    leftArmGroup = new THREE.Group();
    const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.75, 12), skinMat);
    lArmMesh.position.y = -0.35;
    leftArmGroup.add(lArmMesh);
    leftArmGroup.position.set(-0.5, 1.7, 0);
    characterGroup.add(leftArmGroup);

    rightArmGroup = new THREE.Group();
    const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.75, 12), skinMat);
    rArmMesh.position.y = -0.35;
    rightArmGroup.add(rArmMesh);
    rightArmGroup.position.set(0.5, 1.7, 0);
    characterGroup.add(rightArmGroup);

    // 4. 다리 관절 그룹 (Left & Right Legs)
    leftLegGroup = new THREE.Group();
    const lLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.85, 12), pantsMat);
    lLegMesh.position.y = -0.42;
    leftLegGroup.add(lLegMesh);
    leftLegGroup.position.set(-0.2, 0.85, 0);
    characterGroup.add(leftLegGroup);

    rightLegGroup = new THREE.Group();
    const rLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.85, 12), pantsMat);
    rLegMesh.position.y = -0.42;
    rightLegGroup.add(rLegMesh);
    rightLegGroup.position.set(0.2, 0.85, 0);
    characterGroup.add(rightLegGroup);

    characterGroup.position.set(player3D.x, 0, player3D.z);
    scene.add(characterGroup);
}

let animTime = 0;
function animate3DLoop() {
    requestAnimationFrame(animate3DLoop);

    const workshopScreen = document.getElementById('workshopScreen');
    if (!workshopScreen || !workshopScreen.classList.contains('active')) return;

    // 조명 흔들림 연출 (촛불 & 가마 불꽃)
    if (candleLight) candleLight.intensity = 1.2 + Math.sin(Date.now() * 0.008) * 0.2;
    if (kilnFireLight) kilnFireLight.intensity = 2.0 + Math.sin(Date.now() * 0.012) * 0.4;

    let moveX = 0, moveZ = 0;
    if (keys.w || keys.ArrowUp) moveZ -= 1;
    if (keys.s || keys.ArrowDown) moveZ += 1;
    if (keys.a || keys.ArrowLeft) moveX -= 1;
    if (keys.d || keys.ArrowRight) moveX += 1;

    const isWalking = (moveX !== 0 || moveZ !== 0);

    if (isWalking) {
        const len = Math.hypot(moveX, moveZ);
        moveX /= len; moveZ /= len;

        player3D.x += moveX * player3D.speed;
        player3D.z += moveZ * player3D.speed;

        player3D.x = Math.max(-9.5, Math.min(9.5, player3D.x));
        player3D.z = Math.max(-6.5, Math.min(6.5, player3D.z));

        const targetAngle = Math.atan2(moveX, moveZ);
        characterGroup.rotation.y = targetAngle;

        // 실제 사람 자연스러운 걸음걸이 애니메이션
        animTime += 0.18;
        leftArmGroup.rotation.x = Math.sin(animTime) * 0.65;
        rightArmGroup.rotation.x = -Math.sin(animTime) * 0.65;
        leftLegGroup.rotation.x = -Math.sin(animTime) * 0.65;
        rightLegGroup.rotation.x = Math.sin(animTime) * 0.65;
        headGroup.position.y = 2.1 + Math.abs(Math.sin(animTime * 2)) * 0.04;

        if (Math.sin(animTime) > 0.9) sounds.playStep();
    } else {
        leftArmGroup.rotation.x = 0;
        rightArmGroup.rotation.x = 0;
        leftLegGroup.rotation.x = 0;
        rightLegGroup.rotation.x = 0;
        headGroup.position.y = 2.1;
    }

    characterGroup.position.set(player3D.x, 0, player3D.z);
    camera.position.x = player3D.x * 0.35;
    camera.lookAt(player3D.x * 0.35, 0, player3D.z * 0.35);

    checkNearStation3D();
    renderer.render(scene, camera);
}

function checkNearStation3D() {
    nearStation3D = null;
    const promptEl = document.getElementById('interactPrompt');
    const promptTextEl = document.getElementById('promptText');

    stations3D.forEach(st => {
        const dist = Math.hypot(player3D.x - st.x, player3D.z - st.z);
        if (dist < st.radius) nearStation3D = st;
    });

    if (nearStation3D) {
        promptEl.classList.remove('hidden');
        promptTextEl.textContent = `${nearStation3D.name} [E 키 또는 클릭]`;
    } else {
        promptEl.classList.add('hidden');
    }
}

function triggerStationInteract3D() {
    if (!nearStation3D) return;
    sounds.playClick();

    if (nearStation3D.id === 'door') {
        if (gameState.stepState === 'IDLE') openDialogueModal();
        else alert('이미 주문을 받아 진행 중입니다! 물레 작업대로 이동하세요.');
    } else if (nearStation3D.id === 'wheel') {
        if (gameState.stepState === 'ORDERED') openWheelModal();
        else if (gameState.stepState === 'IDLE') alert('먼저 문 앞[🚪]에서 손님 주문을 받아주세요!');
        else alert('이미 물레 빚기가 완료되었습니다. 가마[🔥]로 이동하세요.');
    } else if (nearStation3D.id === 'kiln') {
        if (gameState.stepState === 'SHAPED') openKilnModal();
        else if (gameState.stepState === 'KILNED') openResultModal();
        else alert('물레 작업대[🏺]에서 먼저 도자기 모양을 다듬어주세요!');
    } else if (nearStation3D.id === 'diary') {
        openDiaryScreen();
    }
}

// 모달 및 미니게임 로직
function openDialogueModal() {
    sounds.init(); sounds.playClick();
    const modal = document.getElementById('dialogueModal');
    const order = gameState.currentOrder;

    document.getElementById('npcAvatar').textContent = order.npcAvatar;
    document.getElementById('npcName').textContent = order.npcName;
    document.getElementById('orderItemName').textContent = order.itemTitle;
    
    const dialogueEl = document.getElementById('npcDialogue');
    modal.classList.remove('hidden');

    typeWriterEffect(dialogueEl, order.dialogue);

    document.getElementById('acceptOrderBtn').onclick = () => {
        sounds.playClick(); modal.classList.add('hidden');
        gameState.stepState = 'ORDERED';
        alert('주문을 받았습니다! 실제 3D 물레 작업대[🏺]로 걸어가 보세요.');
    };
}

let wheelCanvas, wheelCtx;
let currentRadii = [50, 50, 50, 50, 50, 50, 50, 50];
let isDraggingWheel = false;

function openWheelModal() {
    sounds.init();
    const modal = document.getElementById('wheelModal');
    modal.classList.remove('hidden');

    wheelCanvas = document.getElementById('wheelCanvas');
    wheelCtx = wheelCanvas.getContext('2d');

    currentRadii = [50, 50, 50, 50, 50, 50, 50, 50];
    updateWheelAccuracy();
    drawWheelCanvas();

    const handleMove = (e) => {
        if (!isDraggingWheel) return;
        const rect = wheelCanvas.getBoundingClientRect();
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);

        const mouseY = (clientY - rect.top) * (wheelCanvas.height / rect.height);
        const mouseX = (clientX - rect.left) * (wheelCanvas.width / rect.width);

        const sliceHeight = 220 / 8;
        const index = Math.floor((mouseY - 70) / sliceHeight);
        if (index >= 0 && index < 8) {
            const distFromCenter = Math.abs(mouseX - wheelCanvas.width / 2);
            currentRadii[index] = Math.max(20, Math.min(85, distFromCenter));
            sounds.playClay();
            updateWheelAccuracy();
            drawWheelCanvas();
        }
    };

    wheelCanvas.onmousedown = (e) => { isDraggingWheel = true; handleMove(e); };
    wheelCanvas.onmousemove = handleMove;
    window.onmouseup = () => { isDraggingWheel = false; };

    wheelCanvas.ontouchstart = (e) => { isDraggingWheel = true; handleMove(e); };
    wheelCanvas.ontouchmove = handleMove;
    window.ontouchend = () => { isDraggingWheel = false; };

    document.getElementById('resetWheelBtn').onclick = () => {
        sounds.playClick();
        currentRadii = [50, 50, 50, 50, 50, 50, 50, 50];
        updateWheelAccuracy();
        drawWheelCanvas();
    };

    document.getElementById('finishWheelBtn').onclick = () => {
        sounds.playClick();
        modal.classList.add('hidden');
        gameState.stepState = 'SHAPED';
        alert('정교한 도자기 실루엣이 완성되었습니다! 가마[🔥]로 이동하세요.');
    };
}

function updateWheelAccuracy() {
    const target = gameState.currentOrder.targetProfile;
    let diffSum = 0;
    for (let i = 0; i < 8; i++) diffSum += Math.abs(currentRadii[i] - target[i]);
    const maxDiff = 8 * 40;
    let acc = Math.max(10, Math.round(100 - (diffSum / maxDiff) * 100));
    
    document.getElementById('accuracyFill').style.width = acc + '%';
    document.getElementById('accuracyText').textContent = acc + '%';
}

function drawWheelCanvas() {
    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    const centerX = wheelCanvas.width / 2;
    const startY = 70;
    const sliceH = 220 / 8;

    const target = gameState.currentOrder.targetProfile;
    wheelCtx.save();
    wheelCtx.strokeStyle = 'rgba(216, 180, 254, 0.5)';
    wheelCtx.lineWidth = 2;
    wheelCtx.setLineDash([5, 5]);

    wheelCtx.beginPath();
    for (let i = 0; i < 8; i++) {
        const y = startY + i * sliceH;
        if (i === 0) wheelCtx.moveTo(centerX - target[i], y);
        else wheelCtx.lineTo(centerX - target[i], y);
    }
    for (let i = 7; i >= 0; i--) {
        const y = startY + i * sliceH;
        wheelCtx.lineTo(centerX + target[i], y);
    }
    wheelCtx.closePath();
    wheelCtx.stroke();
    wheelCtx.restore();

    wheelCtx.save();
    const grad = wheelCtx.createLinearGradient(centerX - 80, 0, centerX + 80, 0);
    grad.addColorStop(0, '#c084fc');
    grad.addColorStop(0.5, '#e9d5ff');
    grad.addColorStop(1, '#a855f7');

    wheelCtx.fillStyle = grad;
    wheelCtx.beginPath();
    for (let i = 0; i < 8; i++) {
        const y = startY + i * sliceH;
        if (i === 0) wheelCtx.moveTo(centerX - currentRadii[i], y);
        else wheelCtx.lineTo(centerX - currentRadii[i], y);
    }
    for (let i = 7; i >= 0; i--) {
        const y = startY + i * sliceH;
        wheelCtx.lineTo(centerX + currentRadii[i], y);
    }
    wheelCtx.closePath();
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#ffffff';
    wheelCtx.lineWidth = 2;
    wheelCtx.stroke();
    wheelCtx.restore();

    wheelCtx.fillStyle = '#3b0764';
    wheelCtx.fillRect(centerX - 90, startY + 220, 180, 20);
    wheelCtx.fillStyle = '#6b21a8';
    wheelCtx.fillRect(centerX - 100, startY + 240, 200, 12);
}

let kilnNeedlePos = 0;
let kilnInterval = null;
let kilnTimerVal = 7;
let kilnTimerInterval = null;

function openKilnModal() {
    sounds.init();
    const modal = document.getElementById('kilnModal');
    modal.classList.remove('hidden');

    kilnNeedlePos = 20;
    kilnTimerVal = 7;
    document.getElementById('kilnTimer').textContent = kilnTimerVal;

    const heatBtn = document.getElementById('heatKilnBtn');
    
    const applyHeat = () => {
        kilnNeedlePos = Math.min(100, kilnNeedlePos + 14);
        sounds.playFire();
        document.getElementById('tempNeedle').style.bottom = kilnNeedlePos + '%';
    };

    heatBtn.onclick = applyHeat;

    const keyHeat = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            applyHeat();
        }
    };
    window.addEventListener('keydown', keyHeat);

    if (kilnInterval) clearInterval(kilnInterval);
    if (kilnTimerInterval) clearInterval(kilnTimerInterval);

    kilnInterval = setInterval(() => {
        kilnNeedlePos = Math.max(0, kilnNeedlePos - 3);
        document.getElementById('tempNeedle').style.bottom = kilnNeedlePos + '%';
    }, 100);

    kilnTimerInterval = setInterval(() => {
        kilnTimerVal--;
        document.getElementById('kilnTimer').textContent = kilnTimerVal;

        if (kilnTimerVal <= 0) {
            clearInterval(kilnInterval);
            clearInterval(kilnTimerInterval);
            window.removeEventListener('keydown', keyHeat);

            sounds.playChime();
            modal.classList.add('hidden');
            gameState.stepState = 'KILNED';
            openResultModal();
        }
    }, 1000);
}

function openResultModal() {
    sounds.playChime();
    const modal = document.getElementById('resultModal');
    modal.classList.remove('hidden');

    const resultCanvas = document.getElementById('resultPotteryCanvas');
    const rCtx = resultCanvas.getContext('2d');
    rCtx.clearRect(0, 0, 180, 180);

    const centerX = 90;
    const startY = 25;
    const sliceH = 130 / 8;

    rCtx.save();
    const grad = rCtx.createLinearGradient(0, 0, 180, 180);
    grad.addColorStop(0, '#f5d0fe');
    grad.addColorStop(0.5, '#c084fc');
    grad.addColorStop(1, '#7e22ce');

    rCtx.fillStyle = grad;
    rCtx.beginPath();
    for (let i = 0; i < 8; i++) {
        const y = startY + i * sliceH;
        const rad = currentRadii[i] * 0.7;
        if (i === 0) rCtx.moveTo(centerX - rad, y);
        else rCtx.lineTo(centerX - rad, y);
    }
    for (let i = 7; i >= 0; i--) {
        const y = startY + i * sliceH;
        const rad = currentRadii[i] * 0.7;
        rCtx.lineTo(centerX + rad, y);
    }
    rCtx.closePath();
    rCtx.fill();
    rCtx.strokeStyle = '#ffffff';
    rCtx.lineWidth = 3;
    rCtx.stroke();
    rCtx.restore();

    const letterEl = document.getElementById('letterContent');
    typeWriterEffect(letterEl, gameState.currentOrder.letter, 35);

    document.getElementById('closeResultBtn').onclick = () => {
        sounds.playClick();
        modal.classList.add('hidden');
        
        gameState.warmth += 50;
        gameState.potteryCountToday++;
        gameState.customerCountToday++;
        gameState.totalWarmthToday += 50;
        gameState.stepState = 'IDLE';

        updateHUD();
        saveGameData();

        alert('손님의 감사 편지와 온기 50개를 받았습니다! 하루 일기장 책상[📖]으로 가서 마감해 보세요.');
    };
}

function openDiaryScreen() {
    sounds.playPage();
    switchScene('workshopScreen', 'diaryScreen');

    document.getElementById('diaryDate').textContent = `${gameState.day}일 차 밤 - 새벽녘의 기록`;
    document.getElementById('statPotteryCount').textContent = `${gameState.potteryCountToday}개`;
    document.getElementById('statCustomerCount').textContent = `${gameState.customerCountToday}명`;
    document.getElementById('statTotalWarmth').textContent = `${gameState.totalWarmthToday}개`;

    const monologueEl = document.getElementById('monologueText');
    const monoText = monologues[(gameState.day - 1) % monologues.length];
    typeWriterEffect(monologueEl, monoText, 40);

    document.getElementById('nextDayBtn').onclick = () => {
        sounds.playClick();
        gameState.day++;
        gameState.potteryCountToday = 0;
        gameState.customerCountToday = 0;
        gameState.totalWarmthToday = 0;

        const nextOrderIndex = (gameState.day - 1) % orderDatabase.length;
        gameState.currentOrder = orderDatabase[nextOrderIndex];
        gameState.stepState = 'IDLE';

        saveGameData();
        updateHUD();

        switchScene('diaryScreen', 'workshopScreen');
    };
}

window.addEventListener('DOMContentLoaded', () => {
    initTitleParticles();
    loadGameData();
    gameState.currentOrder = orderDatabase[0];

    document.getElementById('startGameBtn').addEventListener('click', () => {
        sounds.init();
        sounds.playClick();
        switchScene('titleScreen', 'workshopScreen');
        initRealistic3DWorkshop();
    });
});
