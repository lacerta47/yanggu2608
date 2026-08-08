/* ==========================================================================
   1인칭 500km RPG (v10) Script - 밝고 화사한 3D 월드 & 리얼 3D 총기 & 비행 RPG
   - 검은 화면 문제 완벽 해결: 밝고 화사한 푸른 하늘(0x7dd3fc) & 자연 태양광 조명!
   - 🚀 날아가는 3D RPG 로켓 탄두 물리 비행 & 15m 광역 대폭발!
   - 👹 고퀄리티 3D 몬스터 (고블린/독거미/해골/골렘/흑룡) & 걷기/날갯짓 애니메이션!
   - 🌿 3D 잔디밭 & 🏡 붉은 벽돌집 3채 (지붕 무적 안전지대 & 보물상자 가챠)
   - 60+ FPS 극상의 부드러움 최적화
   ========================================================================== */

// 1. 게임 상태 데이터
const gameState = {
    player: {
        x: 0,
        y: 1.6,
        z: 0,
        yaw: 0,
        pitch: 0,
        speed: 0.16,
        isJumping: false,
        jumpVelocity: 0,
        isOnRoof: false,
        currentRoofY: 0,
        level: 1,
        maxLevel: 50,
        exp: 0,
        maxExp: 1000,
        hp: 100,
        maxHp: 100,
        weaponIdx: 0, // 0: 일반 총 (권총)
        armorIdx: 0,
        jobClass: "💀 네크로멘서",
        monstersKilled: 0,
        currentZone: 'town',
        ultCooldown: false
    },
    isRightDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    soundEnabled: true,
    keys: { w: false, a: false, s: false, d: false },
    monsters: [],
    friendlyMinions: [],
    grassBlades: [],
    activeProjectiles: [],
    activeExplosions: []
};

// 붉은 벽돌집 3채 좌표 및 지붕 바운딩 박스
const townHouses = [
    { x: -7, z: -8, width: 4.8, depth: 4.8, height: 3.0, name: "대장장이의 붉은 벽돌집" },
    { x: 7, z: -8, width: 4.8, depth: 4.8, height: 3.0, name: "포션 상인의 붉은 벽돌집" },
    { x: 0, z: -14, width: 4.8, depth: 4.8, height: 3.0, name: "전직 길드 붉은 벽돌 성채" }
];

// 2. 무기 DB
const weaponsDB = [
    { name: "리얼 3D 권총 (일반 총)", icon: "🔫", dmg: 20, type: "pistol", isAoE: false, reqLv: 1, ultName: "연사 폭격 탄막", ultDmg: 80 },
    { name: "대구경 저격소총", icon: "🎯", dmg: 500, type: "sniper", isAoE: false, reqLv: 1, ultName: "관통 장거리 정밀사격", ultDmg: 900 },
    { name: "🚀 RPG 폭탄 로켓포", icon: "🚀", dmg: 1000, type: "rpg", isAoE: true, reqLv: 1, ultName: "광역 융합 핵폭발", ultDmg: 2000 },
    { name: "불꽃 파쇄 개틀링", icon: "🔥", dmg: 130, type: "pistol", isAoE: false, reqLv: 15, ultName: "화염 난사 연타", ultDmg: 420 },
    { name: "고대 룬의 플라즈마 소총", icon: "🔮", dmg: 220, type: "sniper", isAoE: false, reqLv: 20, ultName: "룬 플라즈마 주사", ultDmg: 650 },
    { name: "용암 플라즈마 돌격포", icon: "🌋", dmg: 330, type: "rpg", isAoE: true, reqLv: 25, ultName: "용암 대분출 사격", ultDmg: 1050 },
    { name: "전설의 가우스 돌격소총", icon: "⚡", dmg: 500, type: "sniper", isAoE: false, reqLv: 30, ultName: "천공의 레일건 난사", ultDmg: 1550 },
    { name: "빛의 신성 성광 라이플", icon: "✨", dmg: 720, type: "sniper", isAoE: false, reqLv: 35, ultName: "성스러운 광휘 빔 사격", ultDmg: 2300 },
    { name: "신화의 둠스데이 중소총", icon: "🌌", dmg: 980, type: "rpg", isAoE: true, reqLv: 40, ultName: "암흑 소멸 포탄 발사", ultDmg: 3300 },
    { name: "신들의 제왕 신화 소총", icon: "👑", dmg: 1400, type: "rpg", isAoE: true, reqLv: 50, ultName: "신들의 종말 오비탈 캐논", ultDmg: 5500 }
];

const armorsDB = [
    { name: "초보자의 천 옷", icon: "👕", hpBonus: 0, def: 1 },
    { name: "단단한 방탄조끼", icon: "🛡️", hpBonus: 40, def: 4 },
    { name: "강철 기사의 전술갑옷", icon: "🛡️", hpBonus: 100, def: 10 },
    { name: "불꽃 룬 방탄 중갑", icon: "🔥", hpBonus: 200, def: 18 },
    { name: "드래곤 택티컬 수호갑", icon: "🐉", hpBonus: 350, def: 30 },
    { name: "신화의 성스러운 수호갑", icon: "✨", hpBonus: 600, def: 50 }
];

// 적 몬스터 DB
const monstersDB = [
    { name: "숲속 아기 고블린", avatar: "👹", baseHp: 100, atk: 25, color: 0x22c55e },
    { name: "무서운 숲 독거미", avatar: "🕷️", baseHp: 100, atk: 25, color: 0x8b5cf6 },
    { name: "던전 해골 전사", avatar: "💀", baseHp: 100, atk: 25, color: 0xe2e8f0 },
    { name: "용암 지역 화염 골렘", avatar: "🗿", baseHp: 100, atk: 25, color: 0xef4444 },
    { name: "지옥의 흑룡 드래곤", avatar: "🐉", baseHp: 100, atk: 25, color: 0xf59e0b },
    { name: "최종 마왕 보스", avatar: "😈", baseHp: 100, atk: 25, color: 0x9333ea }
];

// 3. Web Audio Synthesizer
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

let lastStepTime = 0;
function playFootstepSound() {
    if (!gameState.soundEnabled) return;
    const now = Date.now();
    if (now - lastStepTime < 320) return;
    lastStepTime = now;

    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120 + Math.random() * 25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
}

function playPistolShotSound() {
    if (!gameState.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

function playRPGSwooshSound() {
    if (!gameState.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}

function playRPGBoomSound() {
    if (!gameState.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(320, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.7);

        osc2.frequency.setValueAtTime(160, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.7);

        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.7);
        osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {}
}

function playHitUoSound() {
    if (!gameState.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(170, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.2);
        osc1.frequency.linearRampToValueAtTime(65, ctx.currentTime + 0.45);

        osc2.frequency.setValueAtTime(85, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.45);

        gain.gain.setValueAtTime(0.45, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.45);
        osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {}
}

// 4. Three.js 리얼 3D 그래픽 엔진 (밝고 화사한 푸른 하늘 & 선명한 조명)
let scene, camera, renderer, townGroup, dangerGroup, dirLight, hemiLight;
let fpsGunGroup, muzzleFlashMesh, muzzleLight;

const sharedMinionGeo = new THREE.SphereGeometry(0.9, 12, 12);
const sharedEyeGeo = new THREE.SphereGeometry(0.18, 6, 6);
const sharedMinionEyeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
const sharedMinionBodyMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, roughness: 0.3 });

function init3DEngine() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 500;

    scene = new THREE.Scene();
    
    // ☀️ 밝고 화사한 푸른 낮 하늘 & 맑은 대기 (검은 화면 완벽 해결!)
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.Fog(0x7dd3fc, 40, 110);

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.6, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 자연스러운 태양광 & 지면 반사광 조명
    hemiLight = new THREE.HemisphereLight(0xffffff, 0x16a34a, 1.1);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(15, 35, 15);
    scene.add(dirLight);

    init3DGunMesh();
    createTownWorld();
    createDangerWorld();

    spawnEnemyMonstersGroup(5);
    spawnResurrectedMinionSingle(1.5, -2.5);

    setInterval(() => {
        if (gameState.monsters.length < 15) {
            spawnEnemyMonstersGroup(5);
        }
    }, 10000);

    window.addEventListener('resize', onWindowResize);
}

function init3DGunMesh() {
    fpsGunGroup = new THREE.Group();
    update3DGunModel();
    fpsGunGroup.position.set(0.35, -0.32, -0.65);
    camera.add(fpsGunGroup);
    scene.add(camera);
}

function update3DGunModel() {
    if (!fpsGunGroup) return;

    while (fpsGunGroup.children.length > 0) {
        const obj = fpsGunGroup.children[0];
        fpsGunGroup.remove(obj);
    }

    const currentWep = weaponsDB[gameState.player.weaponIdx];
    const type = currentWep.type || 'pistol';

    const gunMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.15 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
    const redLaserMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    if (type === 'rpg') {
        const tubeGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.2, 16);
        const tube = new THREE.Mesh(tubeGeo, darkMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0, 0);
        fpsGunGroup.add(tube);

        const rocketGeo = new THREE.ConeGeometry(0.13, 0.4, 16);
        const rocket = new THREE.Mesh(rocketGeo, goldMat);
        rocket.rotation.x = -Math.PI / 2;
        rocket.position.set(0, 0, -0.7);
        fpsGunGroup.add(rocket);

        const handleGeo = new THREE.BoxGeometry(0.08, 0.35, 0.12);
        const handle = new THREE.Mesh(handleGeo, gunMat);
        handle.position.set(0, -0.22, 0.1);
        fpsGunGroup.add(handle);
    } else if (type === 'sniper') {
        const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 12);
        const barrel = new THREE.Mesh(barrelGeo, darkMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0, -0.5);
        fpsGunGroup.add(barrel);

        const bodyGeo = new THREE.BoxGeometry(0.12, 0.16, 0.8);
        const body = new THREE.Mesh(bodyGeo, gunMat);
        body.position.set(0, 0, 0);
        fpsGunGroup.add(body);

        const scopeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 12);
        const scope = new THREE.Mesh(scopeGeo, darkMat);
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, 0.12, -0.1);
        fpsGunGroup.add(scope);

        const laserGeo = new THREE.CylinderGeometry(0.005, 0.005, 10, 6);
        const laser = new THREE.Mesh(laserGeo, redLaserMat);
        laser.rotation.x = Math.PI / 2;
        laser.position.set(0, 0.08, -5.5);
        fpsGunGroup.add(laser);
    } else {
        const slideGeo = new THREE.BoxGeometry(0.12, 0.14, 0.65);
        const slide = new THREE.Mesh(slideGeo, gunMat);
        slide.position.set(0, 0.05, -0.1);
        fpsGunGroup.add(slide);

        const barrelGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.7, 12);
        const barrel = new THREE.Mesh(barrelGeo, darkMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.05, -0.15);
        fpsGunGroup.add(barrel);

        const handleGeo = new THREE.BoxGeometry(0.1, 0.35, 0.16);
        const handle = new THREE.Mesh(handleGeo, darkMat);
        handle.rotation.x = -Math.PI / 10;
        handle.position.set(0, -0.16, 0.1);
        fpsGunGroup.add(handle);

        const triggerGuardGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 12, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, gunMat);
        triggerGuard.position.set(0, -0.06, 0.02);
        fpsGunGroup.add(triggerGuard);
    }

    const flashGeo = new THREE.OctahedronGeometry(0.15, 0);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    muzzleFlashMesh.position.set(0, 0.05, -0.9);
    muzzleFlashMesh.visible = false;
    fpsGunGroup.add(muzzleFlashMesh);

    muzzleLight = new THREE.PointLight(0xffaa00, 0, 8);
    muzzleLight.position.set(0, 0.05, -0.9);
    fpsGunGroup.add(muzzleLight);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 500;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// 🌿 밝은 3D 잔디밭 & 🏡 붉은 벽돌집 3채 맵
function createTownWorld() {
    townGroup = new THREE.Group();

    // 1. 선명한 푸른 잔디 지면 바닥
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    townGroup.add(ground);

    const lineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(40, 0.5, 40));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x86efac });
    const border = new THREE.LineSegments(lineGeo, lineMat);
    border.position.y = 0.25;
    townGroup.add(border);

    // 2. 맵 주변 3D 잔디밭 군락지 (70+ 군락)
    const grassBladeGeo = new THREE.ConeGeometry(0.08, 0.65, 4);
    const grassMat1 = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.4 });
    const grassMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
    const grassMat3 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });

    gameState.grassBlades = [];

    for (let i = 0; i < 70; i++) {
        const patchX = (Math.random() - 0.5) * 34;
        const patchZ = (Math.random() - 0.5) * 34;

        let isInsideHouse = false;
        townHouses.forEach(h => {
            if (Math.hypot(patchX - h.x, patchZ - h.z) < 3.5) isInsideHouse = true;
        });
        if (isInsideHouse) continue;

        const patchGroup = new THREE.Group();
        const bladesCount = 5 + Math.floor(Math.random() * 4);

        for (let b = 0; b < bladesCount; b++) {
            const mat = (b % 3 === 0) ? grassMat1 : (b % 3 === 1) ? grassMat2 : grassMat3;
            const blade = new THREE.Mesh(grassBladeGeo, mat);
            const bx = (Math.random() - 0.5) * 0.5;
            const bz = (Math.random() - 0.5) * 0.5;
            const bRotZ = (Math.random() - 0.5) * 0.35;
            const bRotX = (Math.random() - 0.5) * 0.35;
            blade.position.set(bx, 0.32, bz);
            blade.rotation.set(bRotX, Math.random() * Math.PI, bRotZ);
            patchGroup.add(blade);
        }

        patchGroup.position.set(patchX, 0, patchZ);
        townGroup.add(patchGroup);
        gameState.grassBlades.push(patchGroup);
    }

    // 3. 선명한 붉은 벽돌집 3채
    const brickWallMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }); // 선명한 붉은 벽돌
    const stoneFoundationMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
    const slateRoofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const woodDoorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
    const glassWindowMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.1, metalness: 0.6 });
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
    const chestMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.1, metalness: 0.8 });

    townHouses.forEach(h => {
        const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 4.2), stoneFoundationMat);
        base.position.set(h.x, 0.2, h.z);
        townGroup.add(base);

        const brickBody = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.6, 4.0), brickWallMat);
        brickBody.position.set(h.x, 1.5, h.z);
        townGroup.add(brickBody);

        const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, 0.1), woodDoorMat);
        door.position.set(h.x, 1.1, h.z + 2.05);
        townGroup.add(door);

        const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), glassWindowMat);
        win1.position.set(h.x - 1.2, 1.6, h.z + 2.05);
        const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), glassWindowMat);
        win2.position.set(h.x + 1.2, 1.6, h.z + 2.05);
        townGroup.add(win1);
        townGroup.add(win2);

        const roofFloorGeo = new THREE.BoxGeometry(4.4, 0.2, 4.4);
        const roofFloorMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const roofFloor = new THREE.Mesh(roofFloorGeo, roofFloorMat);
        roofFloor.position.set(h.x, 3.0, h.z);
        townGroup.add(roofFloor);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.6, 4), slateRoofMat);
        roof.position.set(h.x, 3.8, h.z);
        roof.rotation.y = Math.PI / 4;
        townGroup.add(roof);

        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), chimneyMat);
        chimney.position.set(h.x + 1.1, 4.0, h.z - 0.8);
        townGroup.add(chimney);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.7), chestMat);
        chest.position.set(h.x, 0.4, h.z + 2.4);
        townGroup.add(chest);
    });

    scene.add(townGroup);
}

function createDangerWorld() {
    dangerGroup = new THREE.Group();

    const lavaGeo = new THREE.PlaneGeometry(40, 40);
    const lavaMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4, emissive: 0x052e16 });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.rotation.x = -Math.PI / 2;
    dangerGroup.add(lava);

    const lineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(40, 0.5, 40));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x22c55e });
    const border = new THREE.LineSegments(lineGeo, lineMat);
    border.position.y = 0.25;
    dangerGroup.add(border);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xb45309 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x262626 });

    for (let i = 0; i < 8; i++) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 4, 8), pillarMat);
        const px = (Math.random() - 0.5) * 30;
        const pz = (Math.random() - 0.5) * 30;
        pillar.position.set(px, 2, pz);
        dangerGroup.add(pillar);

        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1), rockMat);
        rock.position.set(px + 1.2, 0.6, pz + 1.2);
        dangerGroup.add(rock);
    }

    dangerGroup.visible = false;
    scene.add(dangerGroup);
}

function spawnEnemyMonstersGroup(count = 5) {
    for (let i = 0; i < count; i++) {
        if (gameState.monsters.length >= 15) break;
        spawnSingleEnemyMonster();
    }
    showToast(`👾 [3D 몬스터 습격] 3D 적 5마리가 나타났습니다! (총 ${gameState.monsters.length}마리)`);
    updateUI();
}

// 👹 고퀄리티 3D 몬스터 조립 생성기
function createHighQualityMonsterModel(tier) {
    const group = new THREE.Group();

    if (tier === 0) {
        // 👹 1단계: 숲속 고블린 전사
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
        const clothMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e });

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), skinMat);
        head.position.y = 1.35;
        head.name = "monsterBody";
        group.add(head);

        const ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), skinMat);
        ear1.rotation.z = Math.PI / 3;
        ear1.position.set(-0.6, 1.45, 0);
        const ear2 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 4), skinMat);
        ear2.rotation.z = -Math.PI / 3;
        ear2.position.set(0.6, 1.45, 0);
        group.add(ear1);
        group.add(ear2);

        const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), redEyeMat);
        eye1.position.set(-0.2, 1.4, 0.48);
        const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), redEyeMat);
        eye2.position.set(0.2, 1.4, 0.48);
        group.add(eye1);
        group.add(eye2);

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.7, 8), clothMat);
        torso.position.y = 0.75;
        group.add(torso);

        const club = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.9, 8), woodMat);
        club.position.set(0.5, 0.8, 0.3);
        club.rotation.x = Math.PI / 4;
        group.add(club);

        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), skinMat);
        leg1.position.set(-0.2, 0.25, 0);
        const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5), skinMat);
        leg2.position.set(0.2, 0.25, 0);
        group.add(leg1);
        group.add(leg2);
        group.userData = { type: 'biped', leg1, leg2, club };
    } else if (tier === 1) {
        // 🕷️ 2단계: 숲속 독거미
        const spiderMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.3 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b });
        const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), spiderMat);
        body.position.set(0, 0.5, 0.3);
        body.name = "monsterBody";
        group.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), darkMat);
        head.position.set(0, 0.4, -0.4);
        group.add(head);

        for (let e = -2; e <= 2; e++) {
            if (e === 0) continue;
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), redEyeMat);
            eye.position.set(e * 0.08, 0.5, -0.7);
            group.add(eye);
        }

        const legs = [];
        for (let l = 0; l < 8; l++) {
            const side = (l % 2 === 0) ? 1 : -1;
            const idx = Math.floor(l / 2);
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), darkMat);
            leg.position.set(side * 0.45, 0.35, (idx - 1.5) * 0.3);
            leg.rotation.z = side * (Math.PI / 3);
            group.add(leg);
            legs.push(leg);
        }
        group.userData = { type: 'spider', legs };
    } else if (tier === 2) {
        // 💀 3단계: 해골 검사
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
        const darkMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), boneMat);
        skull.position.y = 1.35;
        skull.name = "monsterBody";
        group.add(skull);

        const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), darkMat);
        eye1.position.set(-0.14, 1.4, 0.26);
        const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), darkMat);
        eye2.position.set(0.14, 1.4, 0.26);
        group.add(eye1);
        group.add(eye2);

        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.35), boneMat);
        rib.position.y = 0.75;
        group.add(rib);

        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.15), steelMat);
        sword.position.set(0.5, 0.8, 0.2);
        sword.rotation.x = Math.PI / 4;
        group.add(sword);

        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.08), steelMat);
        shield.position.set(-0.45, 0.8, 0.2);
        group.add(shield);

        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), boneMat);
        leg1.position.set(-0.18, 0.25, 0);
        const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), boneMat);
        leg2.position.set(0.18, 0.25, 0);
        group.add(leg1);
        group.add(leg2);
        group.userData = { type: 'biped', leg1, leg2, sword };
    } else {
        // 🔥/🐉 4~5단계: 화염 골렘 / 흑룡 보스
        const magmaMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, roughness: 0.2 });
        const darkRockMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });

        const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7), magmaMat);
        core.position.y = 1.2;
        core.name = "monsterBody";
        group.add(core);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), darkRockMat);
        head.position.set(0, 1.8, 0.2);
        group.add(head);

        const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 4), magmaMat);
        horn1.position.set(-0.25, 2.1, 0);
        horn1.rotation.z = Math.PI / 6;
        const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 4), magmaMat);
        horn2.position.set(0.25, 2.1, 0);
        horn2.rotation.z = -Math.PI / 6;
        group.add(horn1);
        group.add(horn2);

        const wing1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.6), magmaMat);
        wing1.position.set(-1.0, 1.4, 0);
        const wing2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.6), magmaMat);
        wing2.position.set(1.0, 1.4, 0);
        group.add(wing1);
        group.add(wing2);
        group.userData = { type: 'dragon', wing1, wing2 };
    }

    return group;
}

function spawnSingleEnemyMonster() {
    const tier = Math.min(Math.floor((gameState.player.level - 1) / 5), 4);
    const template = monstersDB[tier];

    const group = createHighQualityMonsterModel(tier);

    const mx = (Math.random() - 0.5) * 30;
    const mz = (Math.random() - 0.5) * 30;

    group.position.set(mx, 0, mz);
    scene.add(group);

    const mObj = {
        mesh: group,
        hp: 100,
        maxHp: 100,
        atk: 25,
        name: template.name,
        avatar: template.avatar,
        tier: tier + 1,
        lastAttackTime: 0
    };

    gameState.monsters.push(mObj);
}

function spawnResurrectedMinionSingle(x, z) {
    if (gameState.friendlyMinions.length >= 10) {
        showToast('💡 내 아군 소환수는 최대 10마리까지 유지됩니다.');
        return;
    }

    const group = new THREE.Group();

    const body = new THREE.Mesh(sharedMinionGeo, sharedMinionBodyMat);
    body.position.y = 0.9;
    group.add(body);

    const eye1 = new THREE.Mesh(sharedEyeGeo, sharedMinionEyeMat);
    eye1.position.set(-0.3, 1.15, 0.8);
    const eye2 = new THREE.Mesh(sharedEyeGeo, sharedMinionEyeMat);
    eye2.position.set(0.3, 1.15, 0.8);
    group.add(eye1);
    group.add(eye2);

    group.position.set(x, 0, z);
    scene.add(group);

    const minionObj = {
        mesh: group,
        hp: 25,
        maxHp: 25,
        atk: 10,
        lastAttackTime: 0
    };

    gameState.friendlyMinions.push(minionObj);
    showToast(`💀 [네크로멘서] 내 소환수 (HP: 25 / 공격력: 10) 생성! (총 ${gameState.friendlyMinions.length}마리)`);
    updateUI();
}

// 5. 키보드 입력 수신 엔진
function initControls() {
    const container = document.getElementById('canvas-container');

    container.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('blur', resetKeys);
    window.addEventListener('focus', resetKeys);

    function resetKeys() {
        gameState.keys.w = false;
        gameState.keys.a = false;
        gameState.keys.s = false;
        gameState.keys.d = false;
        gameState.isRightDragging = false;
    }

    container.addEventListener('mousedown', (e) => {
        container.focus();
        if (e.button === 2) {
            gameState.isRightDragging = true;
            gameState.lastMouseX = e.clientX;
            gameState.lastMouseY = e.clientY;
        } else if (e.button === 0) {
            performRifleShooting();
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 2) gameState.isRightDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (!gameState.isRightDragging) return;

        const deltaX = e.clientX - gameState.lastMouseX;
        const deltaY = e.clientY - gameState.lastMouseY;

        gameState.lastMouseX = e.clientX;
        gameState.lastMouseY = e.clientY;

        const sensitivity = 0.003;
        gameState.player.yaw -= deltaX * sensitivity;
        gameState.player.pitch -= deltaY * sensitivity;

        const maxPitch = Math.PI / 2.2;
        gameState.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, gameState.player.pitch));

        camera.rotation.x = gameState.player.pitch;
        camera.rotation.y = gameState.player.yaw;
    });

    window.addEventListener('keydown', (e) => {
        const code = e.code || '';
        const key = e.key ? e.key.toLowerCase() : '';
        const keyCode = e.keyCode || e.which || 0;

        if (code === 'KeyW' || key === 'w' || key === 'ㅈ' || keyCode === 87 || code === 'ArrowUp' || keyCode === 38) {
            gameState.keys.w = true;
        }
        if (code === 'KeyS' || key === 's' || key === 'ㄴ' || keyCode === 83 || code === 'ArrowDown' || keyCode === 40) {
            gameState.keys.s = true;
        }
        if (code === 'KeyA' || key === 'a' || key === 'ㅁ' || keyCode === 65 || code === 'ArrowLeft' || keyCode === 37) {
            gameState.keys.a = true;
        }
        if (code === 'KeyD' || key === 'd' || key === 'ㅇ' || keyCode === 68 || code === 'ArrowRight' || keyCode === 39) {
            gameState.keys.d = true;
        }

        if (code === 'KeyF' || key === 'f' || key === 'ㄹ' || keyCode === 70) {
            openHouseChestGacha();
        }

        if (code === 'KeyE' || key === 'e' || key === 'ㄷ' || keyCode === 69) {
            spawnResurrectedMinionSingle(camera.position.x + 1, camera.position.z - 2);
        }

        if (code === 'Space' || key === ' ' || keyCode === 32) {
            e.preventDefault();
            triggerJump();
        }

        if (code === 'KeyQ' || key === 'q' || key === 'ㅂ' || keyCode === 81) {
            useUltimateSkill();
        }
    });

    window.addEventListener('keyup', (e) => {
        const code = e.code || '';
        const key = e.key ? e.key.toLowerCase() : '';
        const keyCode = e.keyCode || e.which || 0;

        if (code === 'KeyW' || key === 'w' || key === 'ㅈ' || keyCode === 87 || code === 'ArrowUp' || keyCode === 38) {
            gameState.keys.w = false;
        }
        if (code === 'KeyS' || key === 's' || key === 'ㄴ' || keyCode === 83 || code === 'ArrowDown' || keyCode === 40) {
            gameState.keys.s = false;
        }
        if (code === 'KeyA' || key === 'a' || key === 'ㅁ' || keyCode === 65 || code === 'ArrowLeft' || keyCode === 37) {
            gameState.keys.a = false;
        }
        if (code === 'KeyD' || key === 'd' || key === 'ㅇ' || keyCode === 68 || code === 'ArrowRight' || keyCode === 39) {
            gameState.keys.d = false;
        }
    });

    document.getElementById('sound-btn').addEventListener('click', () => {
        gameState.soundEnabled = !gameState.soundEnabled;
        const btn = document.getElementById('sound-btn');
        btn.textContent = gameState.soundEnabled ? '🔊 효과음 ON (RPG 로켓 비행음 / 대폭발 / 우오)' : '🔇 효과음 OFF';
    });

    const bindMobile = (id, key) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); gameState.keys[key] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); gameState.keys[key] = false; });
        btn.addEventListener('mousedown', () => { gameState.keys[key] = true; });
        btn.addEventListener('mouseup', () => { gameState.keys[key] = false; });
    };

    bindMobile('btn-w', 'w');
    bindMobile('btn-a', 'a');
    bindMobile('btn-s', 's');
    bindMobile('btn-d', 'd');

    document.getElementById('mobile-attack-btn').addEventListener('click', performRifleShooting);
    const mobileChestBtn = document.getElementById('mobile-chest-btn');
    if (mobileChestBtn) mobileChestBtn.addEventListener('click', openHouseChestGacha);

    document.getElementById('btn-open-chest').addEventListener('click', openHouseChestGacha);

    const summonBtn = document.getElementById('btn-summon-minion');
    if (summonBtn) {
        summonBtn.addEventListener('click', () => {
            spawnResurrectedMinionSingle(camera.position.x + 1, camera.position.z - 2);
        });
    }

    document.getElementById('btn-teleport').addEventListener('click', toggleZone);

    document.getElementById('btn-blacksmith').addEventListener('click', () => openBuildingModal('blacksmith'));
    document.getElementById('btn-weapon-shop').addEventListener('click', () => openBuildingModal('shop'));
    document.getElementById('btn-job-center').addEventListener('click', () => openBuildingModal('job'));
    document.getElementById('building-close-btn').addEventListener('click', () => {
        document.getElementById('building-modal').classList.add('hidden');
    });

    document.getElementById('chest-confirm-btn').addEventListener('click', () => {
        document.getElementById('chest-gacha-modal').classList.add('hidden');
    });
}

// 📦 벽돌집 보물상자 가챠
function openHouseChestGacha() {
    const modal = document.getElementById('chest-gacha-modal');
    const resultBox = document.getElementById('chest-result-box');
    const confirmBtn = document.getElementById('chest-confirm-btn');

    modal.classList.remove('hidden');
    confirmBtn.classList.add('hidden');
    resultBox.innerHTML = `<div class="roulette-spin">✨ 벽돌집 보물상자를 여는 중... ✨</div>`;

    setTimeout(() => {
        const rand = Math.random();

        if (rand < 0.30) {
            gameState.player.weaponIdx = 2; // 🚀 RPG 로켓포
            resultBox.innerHTML = `
                <div class="gacha-item-title rpg">🎉 [대박! S급 3D 무기] 🚀 RPG 폭탄 로켓포! 🎉</div>
                <p style="color:#f87171; font-weight:700; margin-top:0.5rem;">공격력: 1000 | 날아가는 3D 로켓 탄두와 15m 광역 대폭발!</p>
            `;
            showToast('🚀 [S급 획득!] 30% 확률의 3D RPG 폭탄 로켓포 장착!');
        } else if (rand < 0.80) {
            gameState.player.weaponIdx = 1; // 🎯 저격소총
            resultBox.innerHTML = `
                <div class="gacha-item-title sniper">✨ [A급 획득] 🎯 대구경 저격소총! ✨</div>
                <p style="color:#38bdf8; font-weight:700; margin-top:0.5rem;">공격력: 500 | 3D 레이저 조준선 단일 저격 사격!</p>
            `;
            showToast('🎯 [A급 획득!] 50% 확률의 3D 대구경 저격소총 장착!');
        } else {
            resultBox.innerHTML = `
                <div class="gacha-item-title dud">💨 [꽝!] 상자 안이 비어있습니다! 💣</div>
                <p style="color:#94a3b8; font-weight:700; margin-top:0.5rem;">상자에서 먼지만 피어오릅니다... 다음 기회에!</p>
            `;
            showToast('💣 [꽝!] 상자가 비어있었습니다.');
        }

        update3DGunModel();
        confirmBtn.classList.remove('hidden');
        updateUI();
    }, 1000);
}

function triggerJump() {
    const p = gameState.player;
    if (!p.isJumping) {
        p.isJumping = true;
        p.jumpVelocity = 0.24;
        showToast('🦘 점프!');
    }
}

// 6. 메인 렌더링 Loop
function animate() {
    requestAnimationFrame(animate);

    const now = Date.now();
    const p = gameState.player;
    const spd = p.speed;
    let isMoving = false;

    // 🌿 3D 잔디밭 바람 흔들림
    if (gameState.grassBlades && gameState.grassBlades.length > 0) {
        gameState.grassBlades.forEach((patch, idx) => {
            patch.rotation.z = Math.sin(now * 0.003 + idx) * 0.1;
        });
    }

    let currentFloorY = 0;
    let landedHouseName = null;

    if (p.currentZone === 'town') {
        townHouses.forEach(h => {
            const dx = Math.abs(camera.position.x - h.x);
            const dz = Math.abs(camera.position.z - h.z);
            if (dx <= h.width / 2 && dz <= h.depth / 2) {
                currentFloorY = h.height;
                landedHouseName = h.name;
            }
        });
    }

    const eyeBaseY = currentFloorY + 1.6;

    if (p.isJumping) {
        camera.position.y += p.jumpVelocity;
        p.jumpVelocity -= 0.014;

        if (camera.position.y <= eyeBaseY) {
            camera.position.y = eyeBaseY;
            p.isJumping = false;
            p.jumpVelocity = 0;

            if (currentFloorY > 0 && !p.isOnRoof) {
                p.isOnRoof = true;
                showToast(`🏡 [벽돌집 지붕 무적 안전지대] ${landedHouseName} 지붕 위 착지! 몬스터 피격 0%!`);
            }
        }
    } else {
        if (camera.position.y > eyeBaseY) {
            camera.position.y -= 0.15;
            if (camera.position.y < eyeBaseY) camera.position.y = eyeBaseY;
        } else if (camera.position.y < eyeBaseY) {
            camera.position.y = eyeBaseY;
        }

        if (currentFloorY === 0 && p.isOnRoof) {
            p.isOnRoof = false;
            showToast('🍃 벽돌집 지붕에서 잔디밭으로 내려왔습니다.');
        }
    }

    // WASD 이동
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (gameState.keys.w) {
        camera.position.addScaledVector(forward, spd);
        isMoving = true;
    }
    if (gameState.keys.s) {
        camera.position.addScaledVector(forward, -spd);
        isMoving = true;
    }
    if (gameState.keys.d) {
        camera.position.addScaledVector(right, spd);
        isMoving = true;
    }
    if (gameState.keys.a) {
        camera.position.addScaledVector(right, -spd);
        isMoving = true;
    }

    camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
    camera.position.z = Math.max(-18, Math.min(18, camera.position.z));

    // 1인칭 3D 총기 움직임 흔들림
    if (fpsGunGroup) {
        if (isMoving && !p.isJumping) {
            playFootstepSound();
            const time = now * 0.012;
            fpsGunGroup.position.x = 0.35 + Math.cos(time) * 0.02;
            fpsGunGroup.position.y = -0.32 + Math.sin(time * 2) * 0.02;
        } else {
            fpsGunGroup.position.x = THREE.MathUtils.lerp(fpsGunGroup.position.x, 0.35, 0.1);
            fpsGunGroup.position.y = THREE.MathUtils.lerp(fpsGunGroup.position.y, -0.32, 0.1);
        }

        fpsGunGroup.position.z = THREE.MathUtils.lerp(fpsGunGroup.position.z, -0.65, 0.2);
        fpsGunGroup.rotation.x = THREE.MathUtils.lerp(fpsGunGroup.rotation.x, 0, 0.2);
    }

    // 🚀 1. 날아가는 3D RPG 로켓 탄두 물리 시뮬레이션
    for (let i = gameState.activeProjectiles.length - 1; i >= 0; i--) {
        const proj = gameState.activeProjectiles[i];
        proj.mesh.position.addScaledVector(proj.velocity, 0.8);
        proj.mesh.rotation.z += 0.2;
        proj.life--;

        let exploded = false;
        for (let m of gameState.monsters) {
            if (proj.mesh.position.distanceTo(m.mesh.position) < 1.6) {
                trigger3DRPGExplosion(proj.mesh.position.x, proj.mesh.position.y, proj.mesh.position.z, 1000);
                exploded = true;
                break;
            }
        }

        if (!exploded && (proj.mesh.position.y <= 0.4 || proj.life <= 0)) {
            trigger3DRPGExplosion(proj.mesh.position.x, 0.4, proj.mesh.position.z, 1000);
            exploded = true;
        }

        if (exploded) {
            scene.remove(proj.mesh);
            gameState.activeProjectiles.splice(i, 1);
        }
    }

    // 💥 2. 3D 폭발 화염구 팽창 및 소멸
    for (let i = gameState.activeExplosions.length - 1; i >= 0; i--) {
        const exp = gameState.activeExplosions[i];
        exp.scale += 0.4;
        exp.mesh.scale.set(exp.scale, exp.scale, exp.scale);
        exp.light.intensity *= 0.85;
        exp.mesh.material.opacity *= 0.85;

        if (exp.mesh.material.opacity <= 0.05) {
            scene.remove(exp.mesh);
            scene.remove(exp.light);
            gameState.activeExplosions.splice(i, 1);
        }
    }

    // 👹 3. 고퀄리티 3D 몬스터 AI & 보행 애니메이션
    gameState.monsters.forEach(m => {
        let targetPos = { x: camera.position.x, z: camera.position.z, isPlayer: true, minionObj: null };
        let minDistance = Math.hypot(camera.position.x - m.mesh.position.x, camera.position.z - m.mesh.position.z);

        gameState.friendlyMinions.forEach(minion => {
            const d = Math.hypot(minion.mesh.position.x - m.mesh.position.x, minion.mesh.position.z - m.mesh.position.z);
            if (d < minDistance) {
                minDistance = d;
                targetPos = { x: minion.mesh.position.x, z: minion.mesh.position.z, isPlayer: false, minionObj: minion };
            }
        });

        if (minDistance > 1.8) {
            const chaseSpeed = 0.035;
            m.mesh.position.x += ((targetPos.x - m.mesh.position.x) / minDistance) * chaseSpeed;
            m.mesh.position.z += ((targetPos.z - m.mesh.position.z) / minDistance) * chaseSpeed;

            const uData = m.mesh.userData;
            if (uData) {
                if (uData.type === 'biped' && uData.leg1 && uData.leg2) {
                    const walkCycle = Math.sin(now * 0.012) * 0.4;
                    uData.leg1.rotation.x = walkCycle;
                    uData.leg2.rotation.x = -walkCycle;
                } else if (uData.type === 'spider' && uData.legs) {
                    uData.legs.forEach((leg, lIdx) => {
                        leg.rotation.x = Math.sin(now * 0.015 + lIdx) * 0.3;
                    });
                } else if (uData.type === 'dragon' && uData.wing1 && uData.wing2) {
                    const wingFlap = Math.sin(now * 0.01) * 0.6;
                    uData.wing1.rotation.z = wingFlap;
                    uData.wing2.rotation.z = -wingFlap;
                }
            }
        }

        m.mesh.position.x = Math.max(-18, Math.min(18, m.mesh.position.x));
        m.mesh.position.z = Math.max(-18, Math.min(18, m.mesh.position.z));
        m.mesh.position.y = Math.sin(now * 0.008) * 0.15;
        m.mesh.lookAt(targetPos.x, 1.0, targetPos.z);

        if (minDistance <= 2.2 && (now - m.lastAttackTime > 1500)) {
            m.lastAttackTime = now;
            if (targetPos.isPlayer) {
                if (p.isOnRoof || camera.position.y > 3.0) {
                    // 벽돌집 지붕 위 무적 안전지대!
                } else {
                    onPlayerHit(m.atk, m.name);
                }
            } else if (targetPos.minionObj) {
                const targetMinion = targetPos.minionObj;
                targetMinion.hp -= m.atk;
                spawnFloatingDamage(m.atk, "#ef4444");
                showToast(`👾 [${m.name}] 이(가) 내 소환수를 공격했습니다! (-${m.atk} HP)`);

                if (targetMinion.hp <= 0) {
                    scene.remove(targetMinion.mesh);
                    const idx = gameState.friendlyMinions.indexOf(targetMinion);
                    if (idx !== -1) gameState.friendlyMinions.splice(idx, 1);
                    showToast(`💀 아군 소환수 1마리가 전사했습니다.`);
                    updateUI();
                }
            }
        }
    });

    // 네크로멘서 소환수 AI
    gameState.friendlyMinions.forEach(minion => {
        if (gameState.monsters.length > 0) {
            const targetM = gameState.monsters[0];
            const dx = targetM.mesh.position.x - minion.mesh.position.x;
            const dz = targetM.mesh.position.z - minion.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 1.5) {
                minion.mesh.position.x += (dx / dist) * 0.03;
                minion.mesh.position.z += (dz / dist) * 0.03;
            }

            minion.mesh.position.y = 0.2 + Math.sin(now * 0.006) * 0.15;

            if (dist <= 2.0 && (now - minion.lastAttackTime > 3000)) {
                minion.lastAttackTime = now;
                targetM.hp -= minion.atk;
                spawnFloatingDamage(minion.atk, "#38bdf8");
                showToast(`💀 [아군 소환수] 적 몬스터에게 10 피해! (느린 공격)`);

                if (targetM.hp <= 0) {
                    scene.remove(targetM.mesh);
                    const idx = gameState.monsters.indexOf(targetM);
                    if (idx !== -1) gameState.monsters.splice(idx, 1);
                    gameState.player.monstersKilled++;
                    addExp(100);
                }
                updateUI();
            }
        } else {
            const dx = camera.position.x - minion.mesh.position.x;
            const dz = camera.position.z - minion.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 3) {
                minion.mesh.position.x += (dx / dist) * 0.03;
                minion.mesh.position.z += (dz / dist) * 0.03;
            }
        }
    });

    renderer.render(scene, camera);
}

// 7. 사격 및 날아가는 3D RPG 로켓 발사
function performRifleShooting() {
    const currentWep = weaponsDB[gameState.player.weaponIdx];

    if (fpsGunGroup) {
        fpsGunGroup.position.z += 0.15;
        fpsGunGroup.rotation.x += 0.2;
    }

    if (muzzleFlashMesh && muzzleLight) {
        muzzleFlashMesh.visible = true;
        muzzleLight.intensity = 3;
        setTimeout(() => {
            muzzleFlashMesh.visible = false;
            muzzleLight.intensity = 0;
        }, 80);
    }

    const cross = document.getElementById('crosshair');
    if (cross) {
        cross.classList.add('recoil');
        setTimeout(() => cross.classList.remove('recoil'), 100);
    }

    if (currentWep.type === "rpg") {
        playRPGSwooshSound();
        spawnFlyingRPGRocket();
    } else {
        playPistolShotSound();
        let dmg = currentWep.dmg;
        if (gameState.player.jobClass.includes("기사")) dmg += 20;
        attackNearestMonster(dmg, false);
    }
}

function spawnFlyingRPGRocket() {
    const rocketGroup = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 12), bodyMat);
    body.rotation.x = Math.PI / 2;
    rocketGroup.add(body);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 12), headMat);
    head.rotation.x = -Math.PI / 2;
    head.position.z = -0.45;
    rocketGroup.add(head);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 8), flameMat);
    flame.rotation.x = Math.PI / 2;
    flame.position.z = 0.45;
    rocketGroup.add(flame);

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    const startPos = new THREE.Vector3();
    startPos.copy(camera.position).addScaledVector(dir, 0.8);
    startPos.y -= 0.2;
    rocketGroup.position.copy(startPos);
    rocketGroup.quaternion.copy(camera.quaternion);

    scene.add(rocketGroup);

    gameState.activeProjectiles.push({
        mesh: rocketGroup,
        velocity: dir.multiplyScalar(0.7),
        life: 60
    });

    showToast('🚀 [RPG 발사!] 로켓 탄두가 불꽃을 뿜으며 날아갑니다!');
}

function trigger3DRPGExplosion(x, y, z, dmg) {
    playRPGBoomSound();

    const expMat = new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.9 });
    const expMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), expMat);
    expMesh.position.set(x, y, z);
    scene.add(expMesh);

    const expLight = new THREE.PointLight(0xff4400, 8, 20);
    expLight.position.set(x, y, z);
    scene.add(expLight);

    gameState.activeExplosions.push({
        mesh: expMesh,
        light: expLight,
        scale: 1.0
    });

    let hitCount = 0;
    for (let i = gameState.monsters.length - 1; i >= 0; i--) {
        const m = gameState.monsters[i];
        const dist = Math.hypot(m.mesh.position.x - x, m.mesh.position.z - z);

        if (dist <= 15) {
            m.hp -= dmg;
            hitCount++;
            spawnFloatingDamage(dmg, "#ef4444");

            if (m.hp <= 0) {
                const deadX = m.mesh.position.x;
                const deadZ = m.mesh.position.z;

                scene.remove(m.mesh);
                gameState.monsters.splice(i, 1);
                gameState.player.monstersKilled++;
                showToast(`💥 몬스터 처치! 경험치 +100 EXP 획득!`);
                addExp(100);

                if (gameState.player.jobClass.includes("네크로멘서")) {
                    spawnResurrectedMinionSingle(deadX, deadZ);
                }
            }
        }
    }

    showToast(`💥 [RPG 대폭발!] 15m 범위 내 ${hitCount}마리 몬스터 몰살!!`);
    updateUI();
}

// 8. Q 키 궁극기
function useUltimateSkill() {
    const p = gameState.player;
    if (p.ultCooldown) {
        showToast(`⏳ 궁극기 쿨타임 중입니다!`);
        return;
    }

    p.ultCooldown = true;
    const currentWep = weaponsDB[p.weaponIdx];
    let ultDmg = currentWep.ultDmg;

    if (p.jobClass.includes("대마법사")) ultDmg *= 2;

    const ultName = currentWep.ultName;
    const ultEl = document.getElementById('ultimate-effect');
    ultEl.textContent = `💥 ${ultName}! 💥`;
    ultEl.classList.remove('hidden');

    showToast(`🔥 궁극기 [${ultName}] 발동! (${ultDmg} 광역 피해!)`);
    attackNearestMonster(ultDmg, true);

    setTimeout(() => ultEl.classList.add('hidden'), 1200);
    setTimeout(() => { p.ultCooldown = false; }, 3000);
}

function attackNearestMonster(dmg, isAoE = false) {
    if (gameState.monsters.length === 0) {
        showToast('💡 부근에 몬스터가 없습니다.');
        return;
    }

    let hitCount = 0;
    const range = isAoE ? 15 : 9;

    for (let i = gameState.monsters.length - 1; i >= 0; i--) {
        const m = gameState.monsters[i];
        const dx = camera.position.x - m.mesh.position.x;
        const dz = camera.position.z - m.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= range) {
            m.hp -= dmg;
            hitCount++;
            spawnFloatingDamage(dmg, isAoE ? "#ef4444" : "#f59e0b");

            if (m.hp <= 0) {
                const deadX = m.mesh.position.x;
                const deadZ = m.mesh.position.z;

                scene.remove(m.mesh);
                gameState.monsters.splice(i, 1);
                gameState.player.monstersKilled++;
                showToast(`💥 몬스터 처치! 경험치 +100 EXP 획득!`);
                addExp(100);

                if (gameState.player.jobClass.includes("네크로멘서")) {
                    spawnResurrectedMinionSingle(deadX, deadZ);
                }
            }

            if (!isAoE) break;
        }
    }

    if (hitCount === 0) {
        showToast(`🎯 3D 총기 사격이 허공을 갈랐습니다!`);
    } else {
        updateUI();
    }
}

function spawnFloatingDamage(dmg, colorHex = "#f59e0b") {
    const container = document.getElementById('floating-damage-container');
    const el = document.createElement('div');
    el.className = 'dmg-num';
    el.textContent = `-${dmg}`;
    el.style.color = colorHex;
    el.style.left = `${50 + (Math.random() * 20 - 10)}%`;
    el.style.top = `${40 + (Math.random() * 10 - 5)}%`;
    container.appendChild(el);

    setTimeout(() => { el.remove(); }, 800);
}

function onPlayerHit(damage, monsterName) {
    const p = gameState.player;
    let finalDmg = damage;

    if (p.jobClass.includes("기사")) finalDmg = Math.max(1, damage - 5);

    p.hp -= finalDmg;
    if (p.hp < 0) p.hp = 0;

    playHitUoSound();
    const overlay = document.getElementById('hit-overlay');
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('hidden'), 300);

    showToast(`💥 [${monsterName}]에 피격되었습니다! (-${finalDmg} HP) [우오!!]`);

    if (p.hp === 0) {
        p.hp = p.maxHp;
        camera.position.set(0, 1.6, 0);
        showToast(`✝️ 체력이 0이 되어 마을로 귀환했습니다.`);
        setZone('town');
    }

    updateUI();
}

function addExp(amount) {
    const p = gameState.player;
    p.exp += amount;

    while (p.exp >= p.maxExp && p.level < p.maxLevel) {
        p.exp -= p.maxExp;
        p.level++;
        onLevelUp(p.level);
    }

    if (p.level >= p.maxLevel) {
        p.level = p.maxLevel;
        document.getElementById('victory-modal').classList.remove('hidden');
    }

    updateUI();
}

function onLevelUp(newLevel) {
    showToast(`🎉 레벨업! 현재 레벨 ${newLevel} 달성!`);

    if (newLevel % 10 === 0) {
        trigger10LevelReward(newLevel);
    }
}

function trigger10LevelReward(level) {
    const weaponIdx = Math.min(Math.floor(level / 5), weaponsDB.length - 1);
    const armorIdx = Math.min(Math.floor(level / 10), armorsDB.length - 1);

    gameState.player.weaponIdx = weaponIdx;
    gameState.player.armorIdx = armorIdx;

    const weapon = weaponsDB[weaponIdx];
    const armor = armorsDB[armorIdx];

    document.getElementById('reward-modal-title').textContent = `축하합니다. ${level}레벨이 되었습니다!`;
    document.getElementById('reward-weapon-icon').textContent = weapon.icon;
    document.getElementById('reward-weapon-name').textContent = weapon.name;
    document.getElementById('reward-weapon-stat').textContent = `공격력 +${weapon.dmg}`;

    document.getElementById('reward-armor-icon').textContent = armor.icon;
    document.getElementById('reward-armor-name').textContent = armor.name;
    document.getElementById('reward-armor-stat').textContent = `최대 체력 +${armor.hpBonus}`;

    update3DGunModel();
    document.getElementById('level-reward-modal').classList.remove('hidden');
    updateUI();
}

function toggleZone() {
    if (gameState.player.currentZone === 'town') {
        setZone('danger');
    } else {
        setZone('town');
    }
}

function setZone(zone) {
    gameState.player.currentZone = zone;
    const badge = document.getElementById('current-zone-badge');
    const btn = document.getElementById('btn-teleport');
    const miniTxt = document.getElementById('minimap-zone-text');

    if (zone === 'town') {
        badge.textContent = '🏡 붉은 벽돌집 마을 & 잔디밭';
        badge.className = 'zone-badge town';
        btn.textContent = '🌋 초록색 네모판 몬스터 소굴 이동';
        miniTxt.textContent = '벽돌집 마을';
        townGroup.visible = true;
        dangerGroup.visible = false;
        scene.background = new THREE.Color(0x7dd3fc);
        showToast('🏡 붉은 벽돌집 마을에 진입했습니다.');
    } else {
        badge.textContent = '🌋 초록색 네모판 몬스터 경기장';
        badge.className = 'zone-badge danger';
        btn.textContent = '🏡 평화로운 벽돌집 마을 귀환';
        miniTxt.textContent = '몬스터 경기장';
        townGroup.visible = false;
        dangerGroup.visible = true;
        scene.background = new THREE.Color(0x052e16);
        showToast('🌋 몬스터 경기장에 진입했습니다!');
    }
}

function openBuildingModal(type) {
    const modal = document.getElementById('building-modal');
    const title = document.getElementById('building-title');
    const body = document.getElementById('building-body');

    if (type === 'blacksmith') {
        title.textContent = '🔨 대장장이 무기 강화소';
        body.innerHTML = `
            <p>현재 장착 3D 무기: <strong>${weaponsDB[gameState.player.weaponIdx].name}</strong></p>
            <p>현재 3D 총기 화력: <strong>${weaponsDB[gameState.player.weaponIdx].dmg}</strong></p>
            <button id="upgrade-weapon-btn" class="shop-item-btn">🔨 3D 총기 화력 추가 강화 (+10 공격력)</button>
        `;
        document.getElementById('upgrade-weapon-btn').addEventListener('click', () => {
            weaponsDB[gameState.player.weaponIdx].dmg += 10;
            showToast('✨ 3D 총기 공격력이 +10 강화되었습니다!');
            updateUI();
            modal.classList.add('hidden');
        });
    } else if (type === 'shop') {
        title.textContent = '🛒 포션 상점';
        body.innerHTML = `
            <p>마을 최고의 회복 상점입니다!</p>
            <button id="buy-hp-btn" class="shop-item-btn">🧪 체력 완전 회복 포션 (사용)</button>
        `;
        document.getElementById('buy-hp-btn').addEventListener('click', () => {
            gameState.player.hp = gameState.player.maxHp;
            showToast('🧪 체력이 100% 회복되었습니다!');
            updateUI();
            modal.classList.add('hidden');
        });
    } else if (type === 'job') {
        title.textContent = '📜 전직장 (3대 클래스 전직)';
        body.innerHTML = `
            <p>현재 클래스: <strong>${gameState.player.jobClass}</strong></p>
            <div class="job-options">
                <button class="shop-item-btn job-btn" onclick="changeJob('⚔️ 기사')">⚔️ 기사 (방어력 & 근접 파워)</button>
                <button class="shop-item-btn job-btn" onclick="changeJob('🔥 대마법사')">🔥 대마법사 (Q 궁극기 피해 2배!)</button>
                <button class="shop-item-btn job-btn necromancer" onclick="changeJob('💀 네크로멘서')">💀 네크로멘서 (내 소환수 생성 / 3.0초 느린 공격!)</button>
            </div>
        `;
    }

    modal.classList.remove('hidden');
}

window.changeJob = function(jobName) {
    gameState.player.jobClass = jobName;
    showToast(`✨ [${jobName}] (으)로 전직 완료!`);

    if (jobName.includes("네크로멘서")) {
        spawnResurrectedMinionSingle(camera.position.x + 1, camera.position.z - 2);
    }

    document.getElementById('building-modal').classList.add('hidden');
    updateUI();
};

function updateUI() {
    const p = gameState.player;
    const weapon = weaponsDB[p.weaponIdx];
    const armor = armorsDB[p.armorIdx];

    p.maxHp = 100 + armor.hpBonus;
    if (p.hp > p.maxHp) p.hp = p.maxHp;

    document.getElementById('player-level').textContent = p.level;
    document.getElementById('current-exp').textContent = p.exp;
    document.getElementById('max-exp').textContent = p.maxExp;
    document.getElementById('exp-bar').style.width = `${(p.exp / p.maxExp) * 100}%`;

    document.getElementById('player-hp').textContent = p.hp;
    document.getElementById('player-max-hp').textContent = p.maxHp;
    document.getElementById('player-hp-bar').style.width = `${(p.hp / p.maxHp) * 100}%`;

    document.getElementById('weapon-icon').textContent = weapon.icon;
    document.getElementById('weapon-name').textContent = weapon.name;
    document.getElementById('weapon-dmg').textContent = `공격력 ${weapon.dmg}`;

    document.getElementById('armor-icon').textContent = armor.icon;
    document.getElementById('armor-name').textContent = armor.name;
    document.getElementById('armor-hp').textContent = `+${armor.hpBonus} HP`;

    if (gameState.monsters.length > 0) {
        const m = gameState.monsters[0];
        document.getElementById('monster-avatar').textContent = m.avatar;
        document.getElementById('monster-name').textContent = m.name;
        document.getElementById('monster-tier').textContent = `Lv.${m.tier * 5 - 4} ~ Lv.${m.tier * 5} (적:${gameState.monsters.length}마리 / 내소환수:${gameState.friendlyMinions.length}마리)`;
        document.getElementById('monster-hp').textContent = m.hp;
        document.getElementById('monster-max-hp').textContent = m.maxHp;
        document.getElementById('monster-hp-bar').style.width = `${(m.hp / m.maxHp) * 100}%`;
    } else {
        document.getElementById('monster-name').textContent = '몬스터 탐색 중...';
        document.getElementById('monster-hp').textContent = 0;
        document.getElementById('monster-hp-bar').style.width = `0%`;
    }
}

let toastTimer = null;
function showToast(msg) {
    const toast = document.getElementById('toast-message');
    document.getElementById('toast-text').textContent = msg;
    toast.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

document.getElementById('reward-claim-btn').addEventListener('click', () => {
    document.getElementById('level-reward-modal').classList.add('hidden');
});

document.getElementById('restart-btn').addEventListener('click', () => {
    gameState.player.level = 1;
    gameState.player.exp = 0;
    gameState.player.weaponIdx = 0;
    gameState.player.armorIdx = 0;
    gameState.player.monstersKilled = 0;
    gameState.friendlyMinions.forEach(m => scene.remove(m.mesh));
    gameState.friendlyMinions = [];
    gameState.activeProjectiles.forEach(p => scene.remove(p.mesh));
    gameState.activeProjectiles = [];
    gameState.activeExplosions.forEach(e => { scene.remove(e.mesh); scene.remove(e.light); });
    gameState.activeExplosions = [];
    camera.position.set(0, 1.6, 0);
    update3DGunModel();
    updateUI();
    document.getElementById('victory-modal').classList.add('hidden');
});

// 화면이 준비되면 즉시 3D 엔진 기동
function startGame() {
    init3DEngine();
    initControls();
    updateUI();
    animate();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startGame);
} else {
    startGame();
}
