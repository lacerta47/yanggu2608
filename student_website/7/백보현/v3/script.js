/* ==========================================================================
   1인칭 500km RPG (v3) Script
   - 상대 몬스터가 10초마다 한번에 5마리씩 대량 스폰!
   - 내 아군 소환수는 공격 속도가 느리게 (3.0초마다 1번씩 공격) 조정
   - 60+ FPS 극상의 부드러움 최적화 유지
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
        level: 1,
        maxLevel: 50,
        exp: 0,
        maxExp: 1000,
        hp: 100,
        maxHp: 100,
        weaponIdx: 0,
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
    friendlyMinions: []
};

// 2. 무기 및 갑옷 DB
const weaponsDB = [
    { name: "낡은 얇은 나뭇가지", icon: "🪵", dmg: 5, reqLv: 1, ultName: "나뭇가지 회오리", ultDmg: 20 },
    { name: "녹슨 철검", icon: "🗡️", dmg: 18, reqLv: 5, ultName: "녹슨 돌진", ultDmg: 60 },
    { name: "은빛 마법 세이버", icon: "⚔️", dmg: 45, reqLv: 10, ultName: "은빛 섬광 참격", ultDmg: 150 },
    { name: "불꽃 드래곤 칼날", icon: "🔥", dmg: 90, reqLv: 15, ultName: "화염 폭사 연타", ultDmg: 300 },
    { name: "고대 룬의 성검", icon: "🔮", dmg: 160, reqLv: 20, ultName: "룬 낙뢰 폭풍", ultDmg: 500 },
    { name: "용암 거인의 파쇄 마검", icon: "🌋", dmg: 250, reqLv: 25, ultName: "용암 대분출", ultDmg: 800 },
    { name: "전설의 엑스칼리버", icon: "⚡", dmg: 380, reqLv: 30, ultName: "천공의 뇌전일격", ultDmg: 1200 },
    { name: "빛의 신성검", icon: "✨", dmg: 550, reqLv: 35, ultName: "성스러운 광휘해일", ultDmg: 1800 },
    { name: "신화의 다크 슬레이어", icon: "🌌", dmg: 750, reqLv: 40, ultName: "암흑 파멸 강림", ultDmg: 2500 },
    { name: "신들의 제왕 신검 (최종 무기)", icon: "👑", dmg: 1100, reqLv: 50, ultName: "신들의 종말 심판", ultDmg: 4000 }
];

const armorsDB = [
    { name: "초보자의 천 옷", icon: "👕", hpBonus: 0, def: 1 },
    { name: "단단한 가죽 흉갑", icon: "🛡️", hpBonus: 40, def: 4 },
    { name: "강철 기사의 판금갑옷", icon: "🛡️", hpBonus: 100, def: 10 },
    { name: "불꽃 룬 중갑", icon: "🔥", hpBonus: 200, def: 18 },
    { name: "드래곤 스케일 수호갑", icon: "🐉", hpBonus: 350, def: 30 },
    { name: "신화의 성스러운 수호갑", icon: "✨", hpBonus: 600, def: 50 }
];

const monstersDB = [
    { name: "숲속 아기 고블린", avatar: "👹", baseHp: 100, atk: 25, color: 0x22c55e },
    { name: "무서운 숲 독거미", avatar: "🕷️", baseHp: 100, atk: 25, color: 0x8b5cf6 },
    { name: "던전 해골 전사", avatar: "💀", baseHp: 100, atk: 25, color: 0xe2e8f0 },
    { name: "용암 지역 화염 골렘", avatar: "🗿", baseHp: 100, atk: 25, color: 0xef4444 },
    { name: "지옥의 흑룡 드래곤", avatar: "🐉", baseHp: 100, atk: 25, color: 0xf59e0b },
    { name: "최종 마왕 보스", avatar: "😈", baseHp: 100, atk: 25, color: 0x9333ea }
];

// 3. Web Audio Synth
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

function playSlashSound() {
    if (!gameState.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
}

// 4. Three.js 1인칭 3D 엔진
let scene, camera, renderer, townGroup, dangerGroup, dirLight;

const sharedMonsterGeo = new THREE.SphereGeometry(1.1, 12, 12);
const sharedEyeGeo = new THREE.SphereGeometry(0.18, 6, 6);
const sharedMinionGeo = new THREE.SphereGeometry(0.9, 12, 12);
const sharedEyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const sharedMinionEyeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
const sharedMinionBodyMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, roughness: 0.3 });

function init3DEngine() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.035);

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 1.6, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xfffaed, 0.9);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    createTownWorld();
    createDangerWorld();

    // 시작 시 상대 몬스터 5마리 한 번에 스폰! (요청 반영)
    spawnEnemyMonstersGroup(5);

    // 시작 시 아군 소환수 1마리 생성
    spawnResurrectedMinionSingle(1.5, -2.5);

    // 10초마다 상대 몬스터 5마리씩 대량 추가 스폰! (요청 반영)
    setInterval(() => {
        if (gameState.monsters.length < 15) {
            spawnEnemyMonstersGroup(5);
        }
    }, 10000);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function createTownWorld() {
    townGroup = new THREE.Group();

    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    townGroup.add(ground);

    const lineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(40, 0.5, 40));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4ade80 });
    const border = new THREE.LineSegments(lineGeo, lineMat);
    border.position.y = 0.25;
    townGroup.add(border);

    const houseMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });

    const houses = [
        { x: -7, z: -8 },
        { x: 7, z: -8 },
        { x: 0, z: -14 }
    ];

    houses.forEach(h => {
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), houseMat);
        body.position.set(h.x, 1.5, h.z);
        townGroup.add(body);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2, 4), roofMat);
        roof.position.set(h.x, 4, h.z);
        roof.rotation.y = Math.PI / 4;
        townGroup.add(roof);
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

// 상대 몬스터 5마리 한 번에 스폰! (요청 반영)
function spawnEnemyMonstersGroup(count = 5) {
    for (let i = 0; i < count; i++) {
        if (gameState.monsters.length >= 15) break;
        spawnSingleEnemyMonster();
    }
    showToast(`👾 [몬스터 습격] 상대 몬스터 5마리가 한 번에 나타났습니다! (총 ${gameState.monsters.length}마리)`);
    updateUI();
}

// 상대 몬스터 1마리 3D 스폰
function spawnSingleEnemyMonster() {
    const tier = Math.min(Math.floor((gameState.player.level - 1) / 5), monstersDB.length - 1);
    const template = monstersDB[tier];

    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: template.color, roughness: 0.3 });
    const body = new THREE.Mesh(sharedMonsterGeo, bodyMat);
    body.name = "monsterBody";
    body.position.y = 1.1;
    group.add(body);

    const eye1 = new THREE.Mesh(sharedEyeGeo, sharedEyeMat);
    eye1.position.set(-0.35, 1.35, 0.9);
    const eye2 = new THREE.Mesh(sharedEyeGeo, sharedEyeMat);
    eye2.position.set(0.35, 1.35, 0.9);
    group.add(eye1);
    group.add(eye2);

    const mx = (Math.random() - 0.5) * 30;
    const mz = (Math.random() - 0.5) * 30;

    group.position.set(mx, 0, mz);
    scene.add(group);

    const mObj = {
        mesh: group,
        hp: 100,   // 상대 몬스터 HP 100
        maxHp: 100,
        atk: 25,   // 상대 몬스터 공격력 25
        name: template.name,
        avatar: template.avatar,
        tier: tier + 1,
        lastAttackTime: 0
    };

    gameState.monsters.push(mObj);
}

// 내 아군 소환수 1마리 3D 생성
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

// 5. 키보드 수신
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
        if (e.button === 2) {
            gameState.isRightDragging = true;
            gameState.lastMouseX = e.clientX;
            gameState.lastMouseY = e.clientY;
        } else if (e.button === 0) {
            performNormalAttack();
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
        const code = e.code;
        const key = e.key ? e.key.toLowerCase() : '';

        if (code === 'KeyW' || key === 'w' || key === 'ㅈ' || code === 'ArrowUp') gameState.keys.w = true;
        if (code === 'KeyS' || key === 's' || key === 'ㄴ' || code === 'ArrowDown') gameState.keys.s = true;
        if (code === 'KeyA' || key === 'a' || key === 'ㅁ' || code === 'ArrowLeft') gameState.keys.a = true;
        if (code === 'KeyD' || key === 'd' || key === 'ㅇ' || code === 'ArrowRight') gameState.keys.d = true;

        if (code === 'KeyE' || key === 'e' || key === 'ㄷ') {
            spawnResurrectedMinionSingle(camera.position.x + 1, camera.position.z - 2);
        }

        if (code === 'Space' || key === ' ') {
            e.preventDefault();
            triggerJump();
        }

        if (code === 'KeyQ' || key === 'q' || key === 'ㅂ') {
            useUltimateSkill();
        }
    });

    window.addEventListener('keyup', (e) => {
        const code = e.code;
        const key = e.key ? e.key.toLowerCase() : '';

        if (code === 'KeyW' || key === 'w' || key === 'ㅈ' || code === 'ArrowUp') gameState.keys.w = false;
        if (code === 'KeyS' || key === 's' || key === 'ㄴ' || code === 'ArrowDown') gameState.keys.s = false;
        if (code === 'KeyA' || key === 'a' || key === 'ㅁ' || code === 'ArrowLeft') gameState.keys.a = false;
        if (code === 'KeyD' || key === 'd' || key === 'ㅇ' || code === 'ArrowRight') gameState.keys.d = false;
    });

    document.getElementById('sound-btn').addEventListener('click', () => {
        gameState.soundEnabled = !gameState.soundEnabled;
        const btn = document.getElementById('sound-btn');
        btn.textContent = gameState.soundEnabled ? '🔊 효과음 ON (저벅저벅 / 우오)' : '🔇 효과음 OFF';
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

    document.getElementById('mobile-attack-btn').addEventListener('click', performNormalAttack);
    document.getElementById('mobile-q-btn').addEventListener('click', useUltimateSkill);

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
}

function triggerJump() {
    const p = gameState.player;
    if (!p.isJumping) {
        p.isJumping = true;
        p.jumpVelocity = 0.22;
        showToast('🦘 점프!');
    }
}

// 6. 메인 렌더링 Loop (소환수 느린 공격 3.0초 주기 적용!)
function animate() {
    requestAnimationFrame(animate);

    const p = gameState.player;
    const spd = p.speed;
    const yaw = p.yaw;
    let isMoving = false;

    if (p.isJumping) {
        camera.position.y += p.jumpVelocity;
        p.jumpVelocity -= 0.014;

        if (camera.position.y <= 1.6) {
            camera.position.y = 1.6;
            p.isJumping = false;
            p.jumpVelocity = 0;
        }
    }

    const forwardX = -Math.sin(yaw) * spd;
    const forwardZ = -Math.cos(yaw) * spd;
    const rightX = Math.cos(yaw) * spd;
    const rightZ = -Math.sin(yaw) * spd;

    if (gameState.keys.w) {
        camera.position.x += forwardX;
        camera.position.z += forwardZ;
        isMoving = true;
    }
    if (gameState.keys.s) {
        camera.position.x -= forwardX;
        camera.position.z -= forwardZ;
        isMoving = true;
    }
    if (gameState.keys.a) {
        camera.position.x -= rightX;
        camera.position.z -= rightZ;
        isMoving = true;
    }
    if (gameState.keys.d) {
        camera.position.x += rightX;
        camera.position.z += rightZ;
        isMoving = true;
    }

    camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
    camera.position.z = Math.max(-18, Math.min(18, camera.position.z));

    const viewmodel = document.getElementById('viewmodel-weapon');
    if (isMoving && !p.isJumping) {
        playFootstepSound();
        const bob = Math.sin(Date.now() * 0.015) * 8;
        if (viewmodel) viewmodel.style.transform = `translateY(${bob}px)`;
    } else if (!isMoving) {
        if (viewmodel) viewmodel.style.transform = `translateY(0px)`;
    }

    const now = Date.now();

    // 적 몬스터 AI (용사 또는 내 아군 소환수를 타겟팅하여 공격)
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
        }

        m.mesh.position.x = Math.max(-18, Math.min(18, m.mesh.position.x));
        m.mesh.position.z = Math.max(-18, Math.min(18, m.mesh.position.z));
        m.mesh.position.y = Math.sin(now * 0.008) * 0.2;
        m.mesh.lookAt(targetPos.x, 1.2, targetPos.z);

        if (minDistance <= 2.2 && (now - m.lastAttackTime > 1500)) {
            m.lastAttackTime = now;
            if (targetPos.isPlayer) {
                onPlayerHit(m.atk, m.name);
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

    // 네크로멘서 아군 소환수 AI (요청 반영: 느린 공격 주기 3.0초 적용!)
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

            // 소환수 공격 주기를 3.0초 (3000ms)로 느리게 조정!
            if (dist <= 2.0 && (now - minion.lastAttackTime > 3000)) {
                minion.lastAttackTime = now;
                targetM.hp -= minion.atk; // 10 피해
                spawnFloatingDamage(minion.atk, "#38bdf8");
                showToast(`💀 [아군 소환수] 적 몬스터에게 10 피해! (느린 묵직한 공격)`);

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

// 7. 일반 공격
function performNormalAttack() {
    const weapon = document.getElementById('viewmodel-weapon');
    const slash = document.getElementById('slash-arc');

    weapon.classList.remove('swing');
    slash.classList.remove('hidden');
    void weapon.offsetWidth;
    weapon.classList.add('swing');

    playSlashSound();

    setTimeout(() => slash.classList.add('hidden'), 250);

    const currentWep = weaponsDB[gameState.player.weaponIdx];
    let dmg = currentWep.dmg;

    if (gameState.player.jobClass.includes("기사")) dmg += 20;

    attackNearestMonster(dmg);
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
    for (let i = gameState.monsters.length - 1; i >= 0; i--) {
        const m = gameState.monsters[i];
        const dx = camera.position.x - m.mesh.position.x;
        const dz = camera.position.z - m.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        const range = isAoE ? 10 : 6;
        if (dist <= range) {
            m.hp -= dmg;
            hitCount++;
            spawnFloatingDamage(dmg, "#f59e0b");

            const body = m.mesh.getObjectByName("monsterBody");
            if (body) {
                body.material.color.setHex(0xffffff);
                setTimeout(() => {
                    const template = monstersDB[Math.min(m.tier - 1, monstersDB.length - 1)];
                    body.material.color.setHex(template ? template.color : 0x22c55e);
                }, 150);
            }

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
        showToast(`⚔️ 허공을 공격했습니다! (몬스터에게 접근하세요)`);
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

    showToast(`💥 [${monsterName}]에 공격받았습니다! (-${finalDmg} HP) [우오!!]`);

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
        badge.textContent = '🏰 초록색 네모판 마을 경기장';
        badge.className = 'zone-badge town';
        btn.textContent = '🌋 초록색 네모판 몬스터 소굴 이동';
        miniTxt.textContent = '마을 경기장';
        townGroup.visible = true;
        dangerGroup.visible = false;
        scene.background = new THREE.Color(0x0f172a);
        showToast('🏰 초록색 네모판 마을 경기장에 진입했습니다.');
    } else {
        badge.textContent = '🌋 초록색 네모판 몬스터 경기장';
        badge.className = 'zone-badge danger';
        btn.textContent = '🏰 평화로운 마을로 귀환';
        miniTxt.textContent = '몬스터 경기장';
        townGroup.visible = false;
        dangerGroup.visible = true;
        scene.background = new THREE.Color(0x052e16);
        showToast('🌋 초록색 네모판 몬스터 경기장에 진입했습니다!');
    }
}

function openBuildingModal(type) {
    const modal = document.getElementById('building-modal');
    const title = document.getElementById('building-title');
    const body = document.getElementById('building-body');

    if (type === 'blacksmith') {
        title.textContent = '🔨 대장장이 무기 강화소';
        body.innerHTML = `
            <p>현재 장착 무기: <strong>${weaponsDB[gameState.player.weaponIdx].name}</strong></p>
            <p>현재 무기 공격력: <strong>${weaponsDB[gameState.player.weaponIdx].dmg}</strong></p>
            <button id="upgrade-weapon-btn" class="shop-item-btn">🔨 무기 추가 강화 (+10 공격력)</button>
        `;
        document.getElementById('upgrade-weapon-btn').addEventListener('click', () => {
            weaponsDB[gameState.player.weaponIdx].dmg += 10;
            showToast('✨ 무기 공격력이 +10 강화되었습니다!');
            updateUI();
            modal.classList.add('hidden');
        });
    } else if (type === 'shop') {
        title.textContent = '🛒 포션 상점';
        body.innerHTML = `
            <p>마을 최고의 포션 상점입니다!</p>
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
                <button class="shop-item-btn job-btn necromancer" onclick="changeJob('💀 네크로멘서')">💀 네크로멘서 (내 소환수 생성 / 3.0초 느린 묵직 공격!)</button>
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

    document.getElementById('viewmodel-weapon').textContent = weapon.icon;

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
    camera.position.set(0, 1.6, 0);
    updateUI();
    document.getElementById('victory-modal').classList.add('hidden');
});

window.addEventListener('DOMContentLoaded', () => {
    init3DEngine();
    initControls();
    updateUI();
    animate();
});
