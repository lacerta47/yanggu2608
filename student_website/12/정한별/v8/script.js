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

// 손님 4명의 고유 실사 인물 사진 경로
const customerPhotos = [
    "../assets/images/real_grandma.jpg",
    "../assets/images/real_painter.jpg",
    "../assets/images/real_gardener.jpg",
    "../assets/images/real_poet.jpg"
];

const customerNames = [
    "달님 할머니 👵",
    "어린 화가 민우 🎨",
    "숲속 정원사 수아 🌿",
    "시인 하은 📜"
];

// 매일매일 절대 겹치지 않는 10여 가지 이상의 풍성한 다채로운 도자기 주문 데이터베이스
const orderPool = [
    {
        itemTitle: "따스한 둥근 차잔",
        dialogue: "이른 새벽 공기가 차갑구려. 손을 따뜻하게 감싸쥘 수 있는 오목하고 포근한 차잔 하나 부탁하네.",
        targetProfile: [45, 55, 60, 62, 60, 55, 45, 35],
        letter: "손길에 꼭 맞는 온기를 선물해 주어서 고마워요. 차 한 잔 마실 때마다 공방의 따스함이 떠오릅니다."
    },
    {
        itemTitle: "우아한 붓꽃병",
        dialogue: "새벽녘 들판에서 꺾은 작은 들꽃을 꽂아둘 길쭉하고 예쁜 붓꽃병이 필요해요!",
        targetProfile: [25, 30, 40, 55, 65, 40, 30, 50],
        letter: "새벽 화폭 옆에 놓아두었어요. 둥근 선이 너무 아늑해서 쳐다보기만 해도 기분이 좋아집니다."
    },
    {
        itemTitle: "아담한 흙화분",
        dialogue: "새로 틔운 다육이 싹을 심을 넓고 다부진 화분이 필요해요. 흙 냄새가 물씬 나는 것으로 빚어주세요.",
        targetProfile: [60, 62, 65, 65, 60, 55, 50, 45],
        letter: "정성스레 빚어주신 화분에 새 싹을 옮겨 심었어요. 흙과 가마의 기운 덕분에 화초가 건강하게 잘 자랄 것 같아요!"
    },
    {
        itemTitle: "새벽빛 머그잔",
        dialogue: "글을 쓰다 새벽을 맞이하곤 한답니다. 따뜻한 유자를 담아 마실 큼직한 머그잔을 기대할게요.",
        targetProfile: [50, 52, 55, 55, 55, 52, 50, 48],
        letter: "차가운 원고지 위에 머그잔을 올려놓으니 마음까지 고요해집니다. 글귀마다 공방의 온기가 묻어나는 듯해요."
    },
    {
        itemTitle: "달빛 유자 찻잔",
        dialogue: "달빛이 은은한 밤에 가족들과 도란도란 담소를 나누며 마실 넓고 둥근 유자 찻잔을 빚어주세요.",
        targetProfile: [40, 50, 65, 70, 65, 50, 40, 30],
        letter: "달빛 아래서 찻잔을 마주하니 마음이 참 온화해집니다. 빚어주신 예쁜 그릇 덕분에 밤이 더 따뜻해졌어요."
    },
    {
        itemTitle: "오목한 수프 그릇",
        dialogue: "추운 날 따뜻한 스튜와 수프를 푸짐하게 담아 먹을 오목하고 깊은 볼 그릇이 필요합니다.",
        targetProfile: [55, 65, 70, 68, 60, 50, 40, 35],
        letter: "정성스런 수프 그릇 덕분에 오늘 저녁 식탁이 마음까지 훈훈해졌습니다. 매일 잘 쓰겠습니다!"
    },
    {
        itemTitle: "넓은 세라믹 접시",
        dialogue: "새벽에 구운 고소한 빵과 과일을 가지런히 올려둘 넓고 평평한 세라믹 디저트 접시 부탁드려요.",
        targetProfile: [70, 72, 75, 72, 68, 60, 50, 40],
        letter: "갓 구운 빵을 올려놓으니 정갈하고 근사합니다. 공방의 정성이 느껴져 빵 맛이 두 배로 좋네요."
    },
    {
        itemTitle: "은하수 아담 차통",
        dialogue: "말린 찻잎을 향기롭게 보관할 아담하고 뚜껑이 잘 맞는 단지 형태 차통을 만들어주세요.",
        targetProfile: [35, 45, 55, 58, 55, 45, 35, 25],
        letter: "향긋한 찻잎을 가득 담아두었어요. 단단하고 고운 그릇 모양이 마음에 쏙 듭니다."
    },
    {
        itemTitle: "길쭉한 소반 그릇",
        dialogue: "정갈한 수저와 아기자기한 다과를 얹어둘 길쭉하고 든든한 소반 그릇을 빚어주실 수 있을까요?",
        targetProfile: [30, 40, 50, 60, 60, 50, 40, 30],
        letter: "손님 접대할 때마다 내놓고 있어요. 다들 어디서 빚은 그릇이냐며 칭찬이 자자하답니다."
    },
    {
        itemTitle: "고풍스러운 향로",
        dialogue: "마음을 정돈하고 향을 피울 오목한 고풍스런 도자기 향로 하나를 부탁드립니다.",
        targetProfile: [45, 50, 55, 50, 45, 40, 35, 30],
        letter: "은은한 향 연기가 도자기 곡선을 타고 올라가는데 마음이 평화로워집니다. 깊이 감사드려요."
    }
];

const monologues = [
    "어둠이 은은하게 물러가는 새벽 공기 속에서 손님의 마음을 생각하며 도자기를 빚었다. 흙을 어루만질 때마다 내 마음도 함께 차분해진다.",
    "가마 속 은은한 불꽃을 바라보며 기다림의 소중함을 배운 하루였다. 그릇에 담길 온기가 누군가의 새벽을 따스하게 밝혀주기를...",
    "공방 창가로 들어오는 보랏빛 별빛을 보며 일기를 적는다. 소소하지만 정성스런 일상이 모여 나의 작은 계절이 되어간다."
];

// 매일 매일 다른 손님과 다른 새로운 주문 생성 함수
function generateNewOrderForDay(day) {
    const customerIdx = (day - 1) % customerNames.length;
    const orderIdx = (day - 1) % orderPool.length;

    const baseOrder = orderPool[orderIdx];
    return {
        npcName: customerNames[customerIdx],
        npcAvatar: customerPhotos[customerIdx],
        itemTitle: baseOrder.itemTitle,
        dialogue: baseOrder.dialogue,
        targetProfile: baseOrder.targetProfile,
        letter: baseOrder.letter
    };
}

function loadGameData() {
    const saved = localStorage.getItem('season_workshop_save_v8');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState.day = parsed.day || 1;
            gameState.warmth = parsed.warmth || 0;
        } catch (e) { console.log(e); }
    }
    gameState.currentOrder = generateNewOrderForDay(gameState.day);
    updateHUD();
}

function saveGameData() {
    localStorage.setItem('season_workshop_save_v8', JSON.stringify({ day: gameState.day, warmth: gameState.warmth }));
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
// THREE.JS 발밑 그림자 위 실사 사람 & 3D 도예 공방
// ----------------------------------------------------
let scene, camera, renderer;
let realArtisanMesh, artisanShadowMesh;
let realCustomerMesh, customerShadowMesh;
let candleLight, kilnFireLight;
let textureLoader = null;
let is3DInit = false;

const player3D = { x: 0, z: 2, speed: 0.12 };
const stations3D = [
    { id: 'door', name: '🚪 주문 손님과 대화하기', x: -6, z: -2, radius: 2.2 },
    { id: 'wheel', name: '🏺 물레 작업대 (도자기 빚기)', x: 6, z: -3, radius: 2.2 },
    { id: 'kiln', name: '🔥 가마 (도자기 굽기)', x: 6, z: 4, radius: 2.2 },
    { id: 'diary', name: '📖 하루 일기장 책상', x: -4, z: 4, radius: 2.2 }
];

let nearStation3D = null;
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

function initv8Workshop() {
    if (is3DInit) return;
    is3DInit = true;

    textureLoader = new THREE.TextureLoader();

    const container = document.getElementById('canvasContainer');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x130a2a);
    scene.fog = new THREE.FogExp2(0x190d38, 0.025);

    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 13, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 맑은 선명 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x553388, 1.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.0);
    sunLight.position.set(8, 18, 12);
    sunLight.castShadow = true;
    scene.add(sunLight);

    kilnFireLight = new THREE.PointLight(0xf97316, 2.5, 12);
    kilnFireLight.position.set(6, 1.8, 4);
    scene.add(kilnFireLight);

    candleLight = new THREE.PointLight(0xfde047, 1.5, 9);
    candleLight.position.set(-4, 1.8, 4);
    scene.add(candleLight);

    // 바닥
    const floorGeo = new THREE.PlaneGeometry(22, 16);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x271946, roughness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(22, 11, 0xc084fc, 0x4c1d95);
    grid.position.y = 0.01;
    scene.add(grid);

    // 공방 요소
    buildWorkshopElements();

    // 1. 만드는 사람 (장인 실사 캐릭터 + 발밑 수평 그림자 판)
    buildArtisanMakerWithFootShadow();

    // 2. 주문하는 사람 (오늘의 손님 실사 캐릭터 + 발밑 수평 그림자 판)
    buildCustomerNpcWithFootShadow();

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

function buildWorkshopElements() {
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.4 }));
    doorFrame.position.set(-6, 1.6, -3);
    scene.add(doorFrame);

    const shelf = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.15, 0.6), new THREE.MeshStandardMaterial({ color: 0x6b21a8 }));
    shelf.position.set(0, 2.8, -7.5);
    scene.add(shelf);

    for (let i = -1.5; i <= 1.5; i += 1.0) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xe9d5ff, roughness: 0.3 }));
        pot.position.set(i, 3.1, -7.5);
        scene.add(pot);
    }

    const wheelTable = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 2.4), new THREE.MeshStandardMaterial({ color: 0x6b21a8, roughness: 0.5 }));
    wheelTable.position.set(6, 0.6, -3);
    scene.add(wheelTable);

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 32), new THREE.MeshStandardMaterial({ color: 0xfaf5ff, metalness: 0.5 }));
    disc.position.set(6, 1.28, -3);
    scene.add(disc);

    const clay = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.9 }));
    clay.position.set(6, 1.6, -3);
    scene.add(clay);

    const kilnBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.6), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }));
    kilnBody.position.set(6, 1.2, 4);
    scene.add(kilnBody);

    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 }));
    chimney.position.set(6, 3.1, 4);
    scene.add(chimney);

    const fireEntrance = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.2), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    fireEntrance.position.set(6, 0.9, 2.65);
    scene.add(fireEntrance);

    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 2.0), new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.5 }));
    desk.position.set(-4, 0.55, 4);
    scene.add(desk);

    const book = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: 0xfaf5ff }));
    book.position.set(-4, 1.15, 4);
    scene.add(book);
}

// 👣 발밑 둥근 수평 그림자 판 바로 위에 입체 실사 장인 서 있도록 구축
function buildArtisanMakerWithFootShadow() {
    const photoTexture = textureLoader.load('../assets/images/real_artisan.jpg');

    // 1. 발밑 수평 타원 그림자 베이스 (Ground Drop-Shadow Plane)
    const shadowGeo = new THREE.CircleGeometry(0.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
    artisanShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    artisanShadowMesh.rotation.x = -Math.PI / 2; // 바닥 수평
    artisanShadowMesh.position.set(player3D.x, 0.02, player3D.z);
    scene.add(artisanShadowMesh);

    // 2. 발밑 그림자 판 위에 곧게 서 있는 실사 사람 캐릭터
    const planeGeo = new THREE.PlaneGeometry(2.2, 2.4);
    const planeMat = new THREE.MeshStandardMaterial({
        map: photoTexture,
        transparent: true,
        emissive: 0xffffff,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide
    });

    realArtisanMesh = new THREE.Mesh(planeGeo, planeMat);
    realArtisanMesh.position.set(player3D.x, 1.2, player3D.z);
    scene.add(realArtisanMesh);
}

// 👣 발밑 둥근 수평 그림자 판 바로 위에 입체 실사 손님 서 있도록 구축
function buildCustomerNpcWithFootShadow() {
    const currentImgUrl = gameState.currentOrder ? gameState.currentOrder.npcAvatar : '../assets/images/real_grandma.jpg';
    const customerTexture = textureLoader.load(currentImgUrl);

    // 1. 손님 발밑 수평 타원 그림자 베이스
    const shadowGeo = new THREE.CircleGeometry(0.7, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
    customerShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    customerShadowMesh.rotation.x = -Math.PI / 2;
    customerShadowMesh.position.set(-6, 0.02, -1.8);
    scene.add(customerShadowMesh);

    // 2. 손님 발밑 그림자 판 위에 서 있는 실사 사람
    const planeGeo = new THREE.PlaneGeometry(2.0, 2.2);
    const planeMat = new THREE.MeshStandardMaterial({
        map: customerTexture,
        transparent: true,
        emissive: 0xffffff,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide
    });

    realCustomerMesh = new THREE.Mesh(planeGeo, planeMat);
    realCustomerMesh.position.set(-6, 1.1, -1.8);
    scene.add(realCustomerMesh);
}

// 새로운 날 진행 시 다채로운 신규 주문 및 손님 실사 사진 동적 갱신
function updateCustomerAppearance() {
    if (!realCustomerMesh || !gameState.currentOrder) return;
    const newTexture = textureLoader.load(gameState.currentOrder.npcAvatar);
    realCustomerMesh.material.map = newTexture;
    realCustomerMesh.material.needsUpdate = true;
}

let animTime = 0;
function animate3DLoop() {
    requestAnimationFrame(animate3DLoop);

    const workshopScreen = document.getElementById('workshopScreen');
    if (!workshopScreen || !workshopScreen.classList.contains('active')) return;

    if (candleLight) candleLight.intensity = 1.5 + Math.sin(Date.now() * 0.008) * 0.3;
    if (kilnFireLight) kilnFireLight.intensity = 2.5 + Math.sin(Date.now() * 0.012) * 0.5;

    if (realCustomerMesh) {
        realCustomerMesh.position.y = 1.1 + Math.sin(Date.now() * 0.003) * 0.03;
    }

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

        animTime += 0.2;
        if (realArtisanMesh) {
            realArtisanMesh.position.y = 1.2 + Math.abs(Math.sin(animTime * 2)) * 0.08;
            realArtisanMesh.rotation.z = Math.sin(animTime) * 0.05;
        }

        if (Math.sin(animTime) > 0.9) sounds.playStep();
    } else {
        if (realArtisanMesh) {
            realArtisanMesh.position.y = 1.2;
            realArtisanMesh.rotation.z = 0;
        }
    }

    // 👣 3D 사람 캐릭터의 이동에 따라 발밑 수평 그림자 판 위치가 정교하게 따라감
    if (realArtisanMesh) {
        realArtisanMesh.position.x = player3D.x;
        realArtisanMesh.position.z = player3D.z;
    }
    if (artisanShadowMesh) {
        artisanShadowMesh.position.x = player3D.x;
        artisanShadowMesh.position.z = player3D.z;
    }

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
        else alert('이미 손님의 주문을 받아 진행 중입니다! 물레 작업대로 이동하세요.');
    } else if (nearStation3D.id === 'wheel') {
        if (gameState.stepState === 'ORDERED') openWheelModal();
        else if (gameState.stepState === 'IDLE') alert('먼저 문 앞[🚪] 손님에게 걸어가 새로운 주문을 받아주세요!');
        else alert('이미 물레 빚기가 완료되었습니다. 가마[🔥]로 이동하세요.');
    } else if (nearStation3D.id === 'kiln') {
        if (gameState.stepState === 'SHAPED') openKilnModal();
        else if (gameState.stepState === 'KILNED') openResultModal();
        else alert('물레 작업대[🏺]에서 먼저 도자기 모양을 다듬어주세요!');
    } else if (nearStation3D.id === 'diary') {
        openDiaryScreen();
    }
}

function openDialogueModal() {
    sounds.init(); sounds.playClick();
    const modal = document.getElementById('dialogueModal');
    const order = gameState.currentOrder;

    document.getElementById('dialogueNpcImg').src = order.npcAvatar;
    document.getElementById('npcName').textContent = order.npcName;
    document.getElementById('orderItemName').textContent = order.itemTitle;
    
    const dialogueEl = document.getElementById('npcDialogue');
    modal.classList.remove('hidden');

    typeWriterEffect(dialogueEl, order.dialogue);

    document.getElementById('acceptOrderBtn').onclick = () => {
        sounds.playClick(); modal.classList.add('hidden');
        gameState.stepState = 'ORDERED';
        alert(`[${order.itemTitle}] 주문을 받았습니다! 물레 작업대[🏺]로 걸어가 도자기를 만들어주세요.`);
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
        alert('도자기 예쁜 실루엣이 완성되었습니다! 가마[🔥]로 이동하세요.');
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

        // 🌟 매일 매일 다른 신규 주문 및 손님 실사 사진으로 동적 생성!
        gameState.currentOrder = generateNewOrderForDay(gameState.day);
        updateCustomerAppearance();

        saveGameData();
        updateHUD();

        switchScene('diaryScreen', 'workshopScreen');
    };
}

window.addEventListener('DOMContentLoaded', () => {
    initTitleParticles();
    loadGameData();

    document.getElementById('startGameBtn').addEventListener('click', () => {
        sounds.init();
        sounds.playClick();
        switchScene('titleScreen', 'workshopScreen');
        initv8Workshop();
    });
});
