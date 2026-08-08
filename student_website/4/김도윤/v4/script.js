// 픽셀 RPG v4 게임 엔진: 둥근 모서리 몬스터 일러스트 그래픽 버전

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('rpgCanvas');
    const ctx = canvas.getContext('2d');

    // UI 요소
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const victoryScreen = document.getElementById('victoryScreen');
    const dialogueOverlay = document.getElementById('dialogueOverlay');
    const gameUI = document.getElementById('gameUI');
    const bossHud = document.getElementById('bossHud');
    const bossHpText = document.getElementById('bossHpText');
    const bossHpFill = document.getElementById('bossHpFill');

    const btnStartGame = document.getElementById('btnStartGame');
    const btnRestart = document.getElementById('btnRestart');
    const btnVictoryRestart = document.getElementById('btnVictoryRestart');
    const btnAccept = document.getElementById('btnAccept');
    const btnDecline = document.getElementById('btnDecline');

    const npcName = document.getElementById('npcName');
    const npcText = document.getElementById('npcText');
    const questList = document.getElementById('questList');
    const playerLevelText = document.getElementById('playerLevel');
    const playerAtkText = document.getElementById('playerAtk');
    const playerGoldText = document.getElementById('playerGold');
    const hpText = document.getElementById('hpText');
    const hpFill = document.getElementById('hpFill');
    const expText = document.getElementById('expText');
    const expFill = document.getElementById('expFill');
    const invItems = document.getElementById('invItems');
    const finalStatsText = document.getElementById('finalStatsText');

    // 우클릭 기본 메뉴 차단
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // 몬스터 이미지 에셋 로드 (슬라임.jpg, 좀비.jpg, 스켈레톤.jpg, 오크.jpg, 거미.jpg)
    const monsterImages = {
        slime: new Image(),
        zombie: new Image(),
        skeleton: new Image(),
        orc: new Image(),
        spider: new Image()
    };
    monsterImages.slime.src = '../슬라임.jpg';
    monsterImages.zombie.src = '../좀비.jpg';
    monsterImages.skeleton.src = '../스켈레톤.jpg';
    monsterImages.orc.src = '../오크.jpg';
    monsterImages.spider.src = '../거미.jpg';

    // 게임 상태 변수
    let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER', 'VICTORY'
    let currentZone = 'TOWN'; // 'TOWN', 'ZONE1', 'ZONE2', 'ZONE3', 'ZONE_DRAGON'

    // 플레이어 객체
    const player = {
        x: 480,
        y: 320,
        width: 32,
        height: 32,
        speed: 4,
        facing: 'down',
        hp: 100,
        maxHp: 100,
        atk: 10,
        atkUpgradeLevel: 0,
        level: 1,
        exp: 0,
        nextExp: 50,
        gold: 0,
        isAttacking: false,
        attackTimer: 0,
        attackBox: { x: 0, y: 0, width: 128, height: 128 },
        inventory: {}
    };

    // 현재 활성화된 퀘스트
    let activeQuest = null;

    // 키보드 조작
    const keys = {
        w: false,
        a: false,
        s: false,
        d: false
    };

    // 사운드 합성기 (Web Audio API)
    class SoundSynth {
        constructor() { this.ctx = null; this.stepToggle = false; }
        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === 'suspended') this.ctx.resume();
        }

        // 1. 걸을 때 터벅터벅 발걸음 소리
        playFootstep() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            this.stepToggle = !this.stepToggle;
            const baseFreq = this.stepToggle ? 85 : 72;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(now + 0.08);
        }

        // 2. 완전 낮은 톤의 묵직한 중저음 칼날 공격 소리
        playSwordSlash() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(110, now);
            osc1.frequency.exponentialRampToValueAtTime(260, now + 0.05);
            osc1.frequency.exponentialRampToValueAtTime(65, now + 0.18);

            gain1.gain.setValueAtTime(0.5, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(220, now);
            osc2.frequency.exponentialRampToValueAtTime(90, now + 0.15);

            gain2.gain.setValueAtTime(0.35, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc1.connect(gain1); gain1.connect(this.ctx.destination);
            osc2.connect(gain2); gain2.connect(this.ctx.destination);

            osc1.start(); osc1.stop(now + 0.18);
            osc2.start(); osc2.stop(now + 0.15);
        }

        // 3. 플레이어 피격 소리
        playHit() {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.1);
        }

        // 4. 플레이어 사망 소리
        playPlayerDeath() {
            if (!this.ctx) return;
            const freqs = [350, 300, 250, 180, 100];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.12);
                gain.gain.setValueAtTime(0.35, this.ctx.currentTime + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.12 + 0.15);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.12);
                osc.stop(this.ctx.currentTime + idx * 0.12 + 0.15);
            });
        }

        // 5. 몬스터 종류별 사망 소리 (슬라임, 좀비, 스켈레톤, 오크, 거미, 드래곤)
        playMonsterDeath(monsterType) {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            if (monsterType === 'slime') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(700, now + 0.08);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            } else if (monsterType === 'zombie') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.25);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            } else if (monsterType === 'skeleton') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(400, now + 0.05);
                osc.frequency.setValueAtTime(900, now + 0.1);
                osc.frequency.setValueAtTime(200, now + 0.15);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            } else if (monsterType === 'orc') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);
                gain.gain.setValueAtTime(0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            } else if (monsterType === 'spider') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            } else if (monsterType === 'dragon') {
                // 드래곤 보스 처치: 웅장한 폭발음과 포효
                const notes = [440, 330, 220, 110, 55];
                notes.forEach((f, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(f, now + i * 0.15);
                    g.gain.setValueAtTime(0.5, now + i * 0.15);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
                    o.connect(g); g.connect(this.ctx.destination);
                    o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.4);
                });
                return;
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            }

            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(now + 0.3);
        }

        playLoot() {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.18);
        }

        playQuestClear() {
            if (!this.ctx) return;
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.3, this.ctx.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.1 + 0.25);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + i * 0.1);
                osc.stop(this.ctx.currentTime + i * 0.1 + 0.25);
            });
        }
    }
    const sound = new SoundSynth();

    // 플로팅 텍스트
    let floatingTexts = [];
    function addFloatingText(text, x, y, color = '#ffffff') {
        floatingTexts.push({ text, x, y, color, alpha: 1, dy: -1 });
    }

    // 맵 및 오브젝트 데이터
    let houses = [];
    let trees = [];
    let npcs = [];
    let monsters = [];

    // 마을 배치 생성 (집 7~8개, 나무 3~4개, NPC 7명)
    function generateTownObjects() {
        houses = [];
        trees = [];

        const houseCount = 7 + Math.floor(Math.random() * 2);
        const housePositions = [
            { x: 100, y: 80 }, { x: 300, y: 80 }, { x: 550, y: 80 }, { x: 750, y: 80 },
            { x: 120, y: 440 }, { x: 340, y: 440 }, { x: 580, y: 440 }, { x: 780, y: 440 }
        ];
        for (let i = 0; i < houseCount && i < housePositions.length; i++) {
            houses.push({
                x: housePositions[i].x,
                y: housePositions[i].y,
                width: 90,
                height: 80,
                color: (i % 2 === 0 ? '#b85b35' : '#8c4b27')
            });
        }

        const treeCount = 3 + Math.floor(Math.random() * 2);
        const treePositions = [
            { x: 450, y: 220 }, { x: 260, y: 260 }, { x: 680, y: 240 }, { x: 500, y: 380 }
        ];
        for (let i = 0; i < treeCount && i < treePositions.length; i++) {
            trees.push({
                x: treePositions[i].x,
                y: treePositions[i].y,
                width: 44,
                height: 54
            });
        }

        // 마을 NPC들 (총 7명: 촌장, 경비대장, 약초상, 용병왕, 무기상, 성녀 세라, 사냥꾼 카일)
        npcs = [
            { id: 'npc_slime', name: '촌장 장로', x: 240, y: 200, width: 32, height: 32, color: '#4169e1' },
            { id: 'npc_zombie', name: '경비대장 론', x: 480, y: 160, width: 32, height: 32, color: '#32cd32' },
            { id: 'npc_skeleton', name: '약초상 엘리', x: 720, y: 200, width: 32, height: 32, color: '#ff69b4' },
            { id: 'npc_boss', name: '용병왕 칼드', x: 480, y: 480, width: 32, height: 32, color: '#ff8c00' },
            { id: 'npc_weapon', name: '무기상 대장장이', x: 600, y: 350, width: 32, height: 32, color: '#e67e22', isWeaponShop: true },
            { id: 'npc_healer', name: '성녀 세라', x: 340, y: 350, width: 32, height: 32, color: '#00ffff' },
            { id: 'npc_hunter', name: '사냥꾼 카일', x: 700, y: 460, width: 32, height: 32, color: '#9b59b6' }
        ];

        // 초기 NPC에 각각 개수가 다양한 랜덤 퀘스트 생성 바인딩
        npcs.forEach(npc => {
            if (!npc.isWeaponShop) {
                npc.quest = generateRandomQuestForNPC(npc);
            }
        });
    }

    // 몬스터 생성 (지역별 + 드래곤의 둥지 보스)
    function spawnMonstersForZone(zone) {
        monsters = [];
        if (zone === 'TOWN') {
            bossHud.classList.add('hidden');
            return;
        }

        if (zone === 'ZONE1') {
            // 1지역: 늪 슬라임 (슬라임.jpg 기반 둥근 모서리 일러스트)
            bossHud.classList.add('hidden');
            for (let i = 0; i < 7; i++) {
                monsters.push({
                    type: 'slime',
                    name: '슬라임',
                    x: 100 + Math.random() * 760,
                    y: 100 + Math.random() * 440,
                    width: 44,
                    height: 44,
                    maxHp: 30 + Math.floor(Math.random() * 16),
                    hp: 35,
                    atk: 5 + Math.floor(Math.random() * 4),
                    loot: '슬라임볼',
                    exp: 15,
                    color: '#00ff66',
                    borderColor: '#55ff88',
                    dx: (Math.random() - 0.5) * 2,
                    dy: (Math.random() - 0.5) * 2
                });
            }
        } else if (zone === 'ZONE2') {
            // 2지역: 숲 좀비 & 스켈레톤 (좀비.jpg, 스켈레톤.jpg 기반 둥근 모서리 일러스트)
            bossHud.classList.add('hidden');
            for (let i = 0; i < 4; i++) {
                monsters.push({
                    type: 'zombie',
                    name: '좀비',
                    x: 100 + Math.random() * 760,
                    y: 100 + Math.random() * 440,
                    width: 42,
                    height: 46,
                    maxHp: 50 + Math.floor(Math.random() * 16),
                    hp: 55,
                    atk: 10 + Math.floor(Math.random() * 9),
                    loot: '썩은 살점',
                    exp: 30,
                    color: '#4c9a2a',
                    borderColor: '#73cc45',
                    dx: (Math.random() - 0.5) * 1.5,
                    dy: (Math.random() - 0.5) * 1.5
                });
                monsters.push({
                    type: 'skeleton',
                    name: '스켈레톤',
                    x: 100 + Math.random() * 760,
                    y: 100 + Math.random() * 440,
                    width: 40,
                    height: 46,
                    maxHp: 50 + Math.floor(Math.random() * 16),
                    hp: 55,
                    atk: 12 + Math.floor(Math.random() * 7),
                    loot: '뼈',
                    exp: 30,
                    color: '#e0e0e0',
                    borderColor: '#ffffff',
                    dx: (Math.random() - 0.5) * 2.2,
                    dy: (Math.random() - 0.5) * 2.2
                });
            }
        } else if (zone === 'ZONE3') {
            // 3지역: 동굴 오크 & 큰 거미 (오크.jpg, 거미.jpg 기반 둥근 모서리 일러스트)
            bossHud.classList.add('hidden');
            for (let i = 0; i < 3; i++) {
                monsters.push({
                    type: 'orc',
                    name: '오크',
                    x: 120 + Math.random() * 720,
                    y: 120 + Math.random() * 400,
                    width: 50,
                    height: 52,
                    maxHp: 70 + Math.floor(Math.random() * 31),
                    hp: 85,
                    atk: 20 + Math.floor(Math.random() * 11),
                    loot: '오크의 살점',
                    exp: 55,
                    color: '#8b0000',
                    borderColor: '#ff4d4d',
                    dx: (Math.random() - 0.5) * 2.5,
                    dy: (Math.random() - 0.5) * 2.5
                });
                monsters.push({
                    type: 'spider',
                    name: '큰 거미',
                    x: 120 + Math.random() * 720,
                    y: 120 + Math.random() * 400,
                    width: 48,
                    height: 46,
                    maxHp: 70 + Math.floor(Math.random() * 31),
                    hp: 80,
                    atk: 22 + Math.floor(Math.random() * 9),
                    loot: '거미 눈',
                    exp: 55,
                    color: '#9400d3',
                    borderColor: '#cc66ff',
                    dx: (Math.random() - 0.5) * 3,
                    dy: (Math.random() - 0.5) * 3
                });
            }
        } else if (zone === 'ZONE_DRAGON') {
            // 드래곤의 둥지 (보스: 드래곤, 체력: 1000, 공격력: 100)
            bossHud.classList.remove('hidden');
            monsters.push({
                type: 'dragon',
                name: '화염의 드래곤',
                x: 430,
                y: 160,
                width: 100,
                height: 100,
                maxHp: 1000,
                hp: 1000,
                atk: 100,
                loot: '드래곤의 심장',
                exp: 500,
                color: '#ff2200',
                borderColor: '#ffcc00',
                dx: 1.8,
                dy: 1.2,
                isBoss: true
            });
            updateBossHpDisplay();
        }
        monsters.forEach(m => m.hp = m.maxHp);
    }

    function updateBossHpDisplay() {
        const dragon = monsters.find(m => m.type === 'dragon');
        if (dragon) {
            bossHpText.textContent = `${Math.max(0, Math.floor(dragon.hp))} / ${dragon.maxHp}`;
            bossHpFill.style.width = `${Math.max(0, (dragon.hp / dragon.maxHp) * 100)}%`;
        }
    }

    // 키 이벤트 조작
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') keys.w = true;
        if (key === 'a' || key === 'arrowleft') keys.a = true;
        if (key === 's' || key === 'arrowdown') keys.s = true;
        if (key === 'd' || key === 'arrowright') keys.d = true;
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') keys.w = false;
        if (key === 'a' || key === 'arrowleft') keys.a = false;
        if (key === 's' || key === 'arrowdown') keys.s = false;
        if (key === 'd' || key === 'arrowright') keys.d = false;
    });

    // 마우스 좌클릭 (공격)
    canvas.addEventListener('mousedown', (e) => {
        if (gameState !== 'PLAYING') return;
        sound.init();
        if (e.button === 0) {
            performAttack();
        }
    });

    // 마우스 우클릭 (NPC 상호작용)
    canvas.addEventListener('mouseup', (e) => {
        if (gameState !== 'PLAYING') return;
        if (e.button === 2) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
            const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
            interactWithNPC(mouseX, mouseY);
        }
    });

    // 공격 수행 함수 (플레이어 중심 4x4 크기)
    function performAttack() {
        if (player.isAttacking) return;
        player.isAttacking = true;
        player.attackTimer = 12;
        sound.playSwordSlash();

        const attackSize = 128; // 4x4 타일 크기
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;

        player.attackBox = {
            x: centerX - attackSize / 2,
            y: centerY - attackSize / 2,
            width: attackSize,
            height: attackSize
        };

        // 공격 범위 안의 몬스터 피해
        monsters.forEach(m => {
            if (m.hp > 0 && isColliding(player.attackBox, m)) {
                m.hp -= player.atk;
                addFloatingText(`-${player.atk}`, m.x + m.width / 2, m.y, '#ff4d4d');

                if (m.isBoss) {
                    updateBossHpDisplay();
                }

                if (m.hp <= 0) {
                    // 몬스터 처치!
                    addLoot(m.loot);
                    addExp(m.exp);
                    addFloatingText(`+${m.loot}`, m.x, m.y - 15, '#ffcc00');
                    sound.playMonsterDeath(m.type);

                    // 사냥꾼 카일의 처치(Kill) 퀘스트 카운트
                    if (activeQuest && activeQuest.type === 'kill' && activeQuest.targetMonster === m.type) {
                        activeQuest.currentCount++;
                        addFloatingText(`${activeQuest.targetMonsterName} 처치! (${activeQuest.currentCount}/${activeQuest.targetCount})`, player.x, player.y - 30, '#00ff66');
                        updateUI();
                    }

                    // 드래곤 처치 시 게임 승리!
                    if (m.type === 'dragon') {
                        setTimeout(handleVictory, 800);
                    }
                }
            }
        });
    }

    // 전리품 획득
    function addLoot(item) {
        if (!player.inventory[item]) player.inventory[item] = 0;
        player.inventory[item]++;

        if (activeQuest && activeQuest.targetItem === item) {
            activeQuest.currentCount = player.inventory[item];
        }

        updateUI();
    }

    // 경험치 획득 및 레벨업 (체력만 상승!)
    function addExp(amount) {
        player.exp += amount;
        if (player.exp >= player.nextExp) {
            player.exp -= player.nextExp;
            player.level++;
            player.nextExp = Math.floor(player.nextExp * 1.5);
            player.maxHp += 20;
            player.hp = player.maxHp;
            addFloatingText(`LEVEL UP! (LV.${player.level} HP+20)`, player.x, player.y - 30, '#00ff66');
            sound.playQuestClear();
        }
        updateUI();
    }

    // NPC 상호작용 (우클릭)
    let currentInteractingNPC = null;
    function interactWithNPC(mx, my) {
        if (currentZone !== 'TOWN') return;

        for (let npc of npcs) {
            const distMouse = Math.hypot(mx - (npc.x + npc.width / 2), my - (npc.y + npc.height / 2));
            const distPlayer = Math.hypot(player.x - npc.x, player.y - npc.y);

            if (distMouse < 60 || distPlayer < 70) {
                currentInteractingNPC = npc;
                openDialogue(npc);
                return;
            }
        }
    }

    // 말풍선 대화 열기 (퀘스트 & 무기상)
    function openDialogue(npc) {
        sound.init();
        npcName.textContent = npc.name;

        // 무기상 NPC 대화 처리 (+5, +6, +7... 점증 증가)
        if (npc.isWeaponShop) {
            const cost = 20 + player.atkUpgradeLevel * 15;
            const nextGain = 5 + player.atkUpgradeLevel;
            npcText.textContent = `어서오게! 골드를 지불하고 무기를 강화해보게나!\n(현재 공격력: ${player.atk} | 강화 시: +${nextGain} ATK | 강화 비용: ${cost}골드)`;
            btnAccept.textContent = `맞겨줘 (+${nextGain} ATK)`;
            btnDecline.textContent = '다음에';
            btnAccept.onclick = () => upgradeWeapon(npc);
            btnDecline.onclick = closeDialogue;
            dialogueOverlay.classList.remove('hidden');
            return;
        }

        // 퀘스트 완료 조건 검사
        const q = npc.quest;

        if (activeQuest && activeQuest.id === q.id) {
            const isKillQuest = (q.type === 'kill');
            const isComplete = isKillQuest
                ? (activeQuest.currentCount >= q.targetCount)
                : ((player.inventory[q.targetItem] || 0) >= q.targetCount);

            if (isComplete) {
                if (isKillQuest) {
                    npcText.textContent = `훌륭하군! 약속대로 ${q.targetMonsterName} ${q.targetCount}마리를 모두 토벌했군! 여기 현상금 ${q.rewardGold}골드다!`;
                } else {
                    npcText.textContent = `고마워! 약속대로 전리품을 가져와 주었구나! 보상으로 ${q.rewardGold}골드를 줄게!`;
                }
                btnAccept.textContent = '보상 받기';
                btnDecline.textContent = '닫기';
                btnAccept.onclick = () => completeQuest(npc);
                btnDecline.onclick = closeDialogue;
            } else {
                if (isKillQuest) {
                    npcText.textContent = `아직 ${q.targetMonsterName} 토벌이 부족하군 (${activeQuest.currentCount}/${q.targetCount}마리). 사냥을 계속하게!`;
                } else {
                    const currentCount = player.inventory[q.targetItem] || 0;
                    npcText.textContent = `아직 ${q.targetItem}이(가) 부족하단다 (${currentCount}/${q.targetCount}). 힘내게!`;
                }
                btnAccept.textContent = '확인';
                btnDecline.textContent = '포기하기';
                btnAccept.onclick = closeDialogue;
                btnDecline.onclick = () => { activeQuest = null; closeDialogue(); updateUI(); };
            }
        } else {
            npcText.textContent = q.desc;
            btnAccept.textContent = '맞겨줘';
            btnDecline.textContent = '다음에';
            btnAccept.onclick = () => acceptQuest(npc);
            btnDecline.onclick = closeDialogue;
        }

        dialogueOverlay.classList.remove('hidden');
    }

    function closeDialogue() {
        dialogueOverlay.classList.add('hidden');
    }

    // 퀘스트 수락
    function acceptQuest(npc) {
        const q = npc.quest;
        activeQuest = {
            id: q.id,
            type: q.type || 'item',
            title: q.title,
            targetItem: q.targetItem,
            targetMonster: q.targetMonster,
            targetMonsterName: q.targetMonsterName,
            targetCount: q.targetCount,
            currentCount: 0,
            rewardGold: q.rewardGold,
            npcId: npc.id
        };
        closeDialogue();
        updateUI();
        addFloatingText('퀘스트를 수락했습니다!', player.x, player.y - 25, '#ffcc00');
    }

    // NPC별 랜덤 퀘스트 생성기 (개수가 5개, 8개, 10개 등 다양하게 랜덤 갱신)
    function generateRandomQuestForNPC(npc) {
        const countPool = [5, 8, 10, 6, 12, 7];
        const targetCount = countPool[Math.floor(Math.random() * countPool.length)];
        let targetItem = '슬라임볼';
        let rewardGold = 15;
        let title = '';
        let desc = '';

        if (npc.id === 'npc_slime') {
            targetItem = '슬라임볼';
            rewardGold = 10 + targetCount * 2;
            title = `늪 슬라임 정벌 (1지역 늪)`;
            desc = `1지역 늪지대 슬라임의 슬라임볼 ${targetCount}개를 가져다주게나. - ${rewardGold}골드`;
            return {
                id: 'q_' + Math.random().toString(36).substr(2, 6),
                type: 'item',
                title: title,
                desc: desc,
                targetItem: targetItem,
                targetCount: targetCount,
                rewardGold: rewardGold
            };
        } else if (npc.id === 'npc_healer') {
            targetItem = '슬라임볼';
            rewardGold = 12 + targetCount * 2;
            title = `치료제 제작 의뢰 (1지역 늪)`;
            desc = `마을 주민들을 치료할 약재로 슬라임볼 ${targetCount}개가 필요해요! - ${rewardGold}골드`;
            return {
                id: 'q_' + Math.random().toString(36).substr(2, 6),
                type: 'item',
                title: title,
                desc: desc,
                targetItem: targetItem,
                targetCount: targetCount,
                rewardGold: rewardGold
            };
        } else if (npc.id === 'npc_hunter') {
            // 사냥꾼 카일: 지역 상관없이 모든 지역 몬스터(슬라임, 좀비, 스켈레톤, 오크, 거미) 토벌 의뢰! (드래곤 제외)
            const monsterPool = [
                { type: 'slime', name: '슬라임', zone: '1지역 늪' },
                { type: 'zombie', name: '좀비', zone: '2지역 숲' },
                { type: 'skeleton', name: '스켈레톤', zone: '2지역 숲' },
                { type: 'orc', name: '오크', zone: '3지역 동굴' },
                { type: 'spider', name: '큰 거미', zone: '3지역 동굴' }
            ];
            const targetM = monsterPool[Math.floor(Math.random() * monsterPool.length)];
            rewardGold = 20 + targetCount * 3;
            title = `사냥꾼의 현상금: ${targetM.name} 토벌`;
            desc = `몬스터 토벌 의뢰: [${targetM.zone}]의 ${targetM.name} ${targetCount}마리를 직접 처치해오면 현상금을 주지! - ${rewardGold}골드`;
            return {
                id: 'q_' + Math.random().toString(36).substr(2, 6),
                type: 'kill',
                title: title,
                desc: desc,
                targetMonster: targetM.type,
                targetMonsterName: targetM.name,
                targetCount: targetCount,
                rewardGold: rewardGold
            };
        } else if (npc.id === 'npc_zombie' || npc.id === 'npc_skeleton') {
            const lootOptions = ['썩은 살점', '뼈'];
            targetItem = lootOptions[Math.floor(Math.random() * lootOptions.length)];
            rewardGold = 15 + targetCount * 2;
            title = `숲 ${targetItem} 수집 (2지역 숲)`;
            desc = `2지역 숲에서 몬스터의 ${targetItem} ${targetCount}개를 모아와주게. - ${rewardGold}골드`;
            return {
                id: 'q_' + Math.random().toString(36).substr(2, 6),
                type: 'item',
                title: title,
                desc: desc,
                targetItem: targetItem,
                targetCount: targetCount,
                rewardGold: rewardGold
            };
        } else {
            const lootOptions = ['오크의 살점', '거미 눈'];
            targetItem = lootOptions[Math.floor(Math.random() * lootOptions.length)];
            rewardGold = 25 + targetCount * 4;
            title = `동굴 ${targetItem} 토벌 (3지역 동굴)`;
            desc = `3지역 동굴에서 몬스터의 ${targetItem} ${targetCount}개를 사냥해오라! - ${rewardGold}골드`;
            return {
                id: 'q_' + Math.random().toString(36).substr(2, 6),
                type: 'item',
                title: title,
                desc: desc,
                targetItem: targetItem,
                targetCount: targetCount,
                rewardGold: rewardGold
            };
        }
    }

    // 무기상 공격력 강화 처리 (+5, +6, +7... 점증 증가)
    function upgradeWeapon(npc) {
        const cost = 20 + player.atkUpgradeLevel * 15;
        const nextGain = 5 + player.atkUpgradeLevel;
        if (player.gold >= cost) {
            player.gold -= cost;
            player.atk += nextGain;
            player.atkUpgradeLevel++;
            sound.playLoot();
            addFloatingText(`무기 강화 성공! (+${nextGain} ATK)`, player.x, player.y - 25, '#ffe600');
            updateUI();
            openDialogue(npc);
        } else {
            addFloatingText(`골드가 부족합니다! (${cost}G 필요)`, player.x, player.y - 25, '#ff4d4d');
        }
    }

    // 퀘스트 완료 처리 (사냥 처치 or 전리품 납품)
    function completeQuest(npc) {
        const q = npc.quest;
        if (q.type === 'item' && q.targetItem && player.inventory[q.targetItem]) {
            player.inventory[q.targetItem] -= q.targetCount;
        }
        player.gold += q.rewardGold;
        activeQuest = null;

        npc.quest = generateRandomQuestForNPC(npc);

        sound.playQuestClear();
        closeDialogue();
        addFloatingText(`퀘스트 완료! +${q.rewardGold}G (새 퀘스트 도착!)`, player.x, player.y - 25, '#ffd700');

        updateUI();
    }

    // UI 갱신
    function updateUI() {
        playerLevelText.textContent = player.level;
        if (playerAtkText) playerAtkText.textContent = player.atk;
        playerGoldText.textContent = player.gold;
        hpText.textContent = `${Math.max(0, Math.floor(player.hp))} / ${player.maxHp}`;
        hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
        expText.textContent = `${player.exp} / ${player.nextExp}`;
        expFill.style.width = `${(player.exp / player.nextExp) * 100}%`;

        const invList = Object.entries(player.inventory)
            .filter(([_, count]) => count > 0)
            .map(([item, count]) => `${item} x${count}`)
            .join(' | ');
        invItems.textContent = invList || '비어있음';

        if (activeQuest) {
            if (activeQuest.type === 'kill') {
                questList.innerHTML = `<div class="quest-item">- ${activeQuest.targetMonsterName} ${activeQuest.targetCount}마리 처치 (${activeQuest.currentCount}/${activeQuest.targetCount})</div>`;
            } else {
                const currentCount = player.inventory[activeQuest.targetItem] || 0;
                questList.innerHTML = `<div class="quest-item">- ${activeQuest.targetItem} ${activeQuest.targetCount}개 (${currentCount}/${activeQuest.targetCount})</div>`;
            }
        } else {
            questList.innerHTML = `<div class="no-quest">- 진행 중인 퀘스트가 없습니다.</div>`;
        }
    }

    // 충돌 판정
    function isColliding(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    // 플레이어 이동 및 포탈 이동 처리
    let footstepTimer = 0;
    function updatePlayer() {
        let dx = 0;
        let dy = 0;

        if (keys.w) { dy -= player.speed; player.facing = 'up'; }
        if (keys.s) { dy += player.speed; player.facing = 'down'; }
        if (keys.a) { dx -= player.speed; player.facing = 'left'; }
        if (keys.d) { dx += player.speed; player.facing = 'right'; }

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        const nextX = player.x + dx;
        const nextY = player.y + dy;

        let canMove = true;
        const nextRect = { x: nextX, y: nextY, width: player.width, height: player.height };

        if (currentZone === 'TOWN') {
            houses.forEach(h => { if (isColliding(nextRect, h)) canMove = false; });
            trees.forEach(t => { if (isColliding(nextRect, t)) canMove = false; });
        }

        if (canMove && (dx !== 0 || dy !== 0)) {
            player.x = nextX;
            player.y = nextY;

            if (footstepTimer === 0) {
                sound.playFootstep();
            }
            footstepTimer++;
            if (footstepTimer >= 14) {
                footstepTimer = 0;
            }
        } else {
            footstepTimer = 0;
        }

        // 포탈 및 맵 전환 판정 (마을 4방향 출구)
        if (currentZone === 'TOWN') {
            if (player.x < 10) { transitionZone('ZONE1', canvas.width - 50, player.y); }
            else if (player.x > canvas.width - 40) { transitionZone('ZONE2', 40, player.y); }
            else if (player.y < 10) { transitionZone('ZONE3', player.x, canvas.height - 50); }
            else if (player.y > canvas.height - 40) { transitionZone('ZONE_DRAGON', player.x, 50); }
        } else {
            // 다른 지역에서 마을로 복귀
            if (currentZone === 'ZONE1' && player.x > canvas.width - 30) { transitionZone('TOWN', 40, player.y); }
            else if (currentZone === 'ZONE2' && player.x < 10) { transitionZone('TOWN', canvas.width - 50, player.y); }
            else if (currentZone === 'ZONE3' && player.y > canvas.height - 30) { transitionZone('TOWN', player.x, 40); }
            else if (currentZone === 'ZONE_DRAGON' && player.y < 20) { transitionZone('TOWN', player.x, canvas.height - 60); }
        }

        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

        if (player.attackTimer > 0) {
            player.attackTimer--;
            if (player.attackTimer === 0) player.isAttacking = false;
        }
    }

    // 맵 이동 처리
    function transitionZone(newZone, startX, startY) {
        currentZone = newZone;
        player.x = startX;
        player.y = startY;
        spawnMonstersForZone(newZone);

        const zoneNames = {
            'TOWN': '평화로운 마을',
            'ZONE1': '1지역: 늪지대 (쉬움)',
            'ZONE2': '2지역: 신비의 숲 (보통)',
            'ZONE3': '3지역: 어두운 동굴 (어려움)',
            'ZONE_DRAGON': '🔥 드래곤의 둥지 (보스전)'
        };
        addFloatingText(`[입장] ${zoneNames[newZone]}`, canvas.width / 2 - 120, canvas.height / 2, '#ffcc00');
    }

    // 몬스터 AI 및 피해 처리
    function updateMonsters() {
        if (currentZone === 'TOWN') {
            monsters = [];
            return;
        }

        monsters.forEach(m => {
            if (m.hp <= 0) return;

            const dist = Math.hypot(player.x - m.x, player.y - m.y);
            const chaseDist = m.isBoss ? 450 : 220;
            const moveSpeed = m.isBoss ? 1.6 : 1.5;

            if (dist < chaseDist) {
                const angle = Math.atan2(player.y - m.y, player.x - m.x);
                m.x += Math.cos(angle) * moveSpeed;
                m.y += Math.sin(angle) * moveSpeed;
            } else {
                m.x += m.dx;
                m.y += m.dy;
                if (m.x < 50 || m.x > canvas.width - 100) m.dx = -m.dx;
                if (m.y < 50 || m.y > canvas.height - 100) m.dy = -m.dy;
            }

            // 플레이어와 피격 충돌 (드래곤 공격력: 100)
            if (isColliding(player, m)) {
                player.hp -= m.atk * 0.05;
                if (Math.random() < 0.12) {
                    addFloatingText(`-${Math.floor(m.atk)}`, player.x + 10, player.y - 10, '#ff4d4d');
                    sound.playHit();
                }
                updateUI();

                if (player.hp <= 0) {
                    handleGameOver();
                }
            }
        });
    }

    // 플로팅 텍스트 애니메이션 업데이트
    function updateFloatingTexts() {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.dy;
            ft.alpha -= 0.02;
            if (ft.alpha <= 0) floatingTexts.splice(i, 1);
        }
    }

    // 캔버스 그리기 함수 (2D 픽셀 + 둥근 모서리 일러스트 몬스터)
    function draw() {
        // 1. 맵 배경 그리기 (마을, 늪, 숲, 동굴, 드래곤의 둥지)
        if (currentZone === 'TOWN') {
            ctx.fillStyle = '#3a693b';
        } else if (currentZone === 'ZONE1') {
            ctx.fillStyle = '#1e3b2b';
        } else if (currentZone === 'ZONE2') {
            ctx.fillStyle = '#15421c';
        } else if (currentZone === 'ZONE3') {
            ctx.fillStyle = '#261e38';
        } else if (currentZone === 'ZONE_DRAGON') {
            ctx.fillStyle = '#300a0a'; // 화산암 용암 둥지
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 지역별 텍스처 무늬
        if (currentZone === 'ZONE1') {
            ctx.fillStyle = 'rgba(0, 180, 150, 0.15)';
            ctx.beginPath(); ctx.arc(200, 180, 60, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(700, 420, 80, 0, Math.PI * 2); ctx.fill();
        } else if (currentZone === 'ZONE3') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(150, 100, 120, 90);
            ctx.fillRect(650, 350, 140, 100);
        } else if (currentZone === 'ZONE_DRAGON') {
            // 용암 웅덩이
            ctx.fillStyle = 'rgba(255, 69, 0, 0.35)';
            ctx.beginPath(); ctx.arc(250, 200, 90, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(720, 400, 110, 0, Math.PI * 2); ctx.fill();
        }

        // 그리드 픽셀 라인 효과
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // 포탈 / 맵 출구 표시
        ctx.fillStyle = '#ffcc00';
        ctx.font = '16px DungGeunMo';
        if (currentZone === 'TOWN') {
            ctx.fillText('◀ 1지역 (늪)', 10, 320);
            ctx.fillText('2지역 (숲) ▶', canvas.width - 120, 320);
            ctx.fillText('▲ 3지역 (동굴)', 420, 25);
            ctx.fillStyle = '#ff3300';
            ctx.fillText('▼ 🔥 드래곤의 둥지 (보스)', 370, canvas.height - 15);
        } else {
            ctx.fillText('마을로 돌아가기 🚪', canvas.width / 2 - 60, canvas.height - 15);
        }

        // 2. 마을 구조물 (집, 나무, NPC) 그리기
        if (currentZone === 'TOWN') {
            houses.forEach(h => {
                ctx.fillStyle = h.color;
                ctx.fillRect(h.x, h.y, h.width, h.height);
                ctx.fillStyle = '#ff4d4d';
                ctx.beginPath();
                ctx.moveTo(h.x - 6, h.y);
                ctx.lineTo(h.x + h.width / 2, h.y - 30);
                ctx.lineTo(h.x + h.width + 6, h.y);
                ctx.fill();
                ctx.fillStyle = '#4a2511';
                ctx.fillRect(h.x + h.width / 2 - 12, h.y + h.height - 30, 24, 30);
            });

            trees.forEach(t => {
                ctx.fillStyle = '#5c4033';
                ctx.fillRect(t.x + t.width / 2 - 6, t.y + 20, 12, t.height - 20);
                ctx.fillStyle = '#1e7b1e';
                ctx.beginPath();
                ctx.arc(t.x + t.width / 2, t.y + 18, 22, 0, Math.PI * 2);
                ctx.fill();
            });

            npcs.forEach(npc => {
                ctx.fillStyle = npc.color;
                ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(npc.x + 4, npc.y - 6, 24, 8);
                ctx.fillStyle = '#ffff00';
                ctx.font = '14px DungGeunMo';
                ctx.fillText(npc.name, npc.x - 10, npc.y - 12);
                ctx.fillStyle = '#ffffff';
                ctx.fillText('[우클릭]', npc.x - 6, npc.y + npc.height + 16);
            });
        }

        // 3. 몬스터 5종 및 보스 드래곤 수제작 일러스트 렌더링 (둥근 모서리 + 모션)
        monsters.forEach(m => {
            if (m.hp <= 0) return;

            const time = Date.now() * 0.005;

            if (m.type === 'dragon') {
                // 대형 보스 드래곤 픽셀/일러스트 렌더링
                ctx.save();
                // 날개 펄럭임
                const wingFlap = Math.sin(time * 1.5) * 8;
                ctx.fillStyle = '#6b0000';
                ctx.beginPath();
                ctx.moveTo(m.x + 10, m.y + 30);
                ctx.lineTo(m.x - 30, m.y - 10 + wingFlap);
                ctx.lineTo(m.x - 10, m.y + 70);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(m.x + m.width - 10, m.y + 30);
                ctx.lineTo(m.x + m.width + 30, m.y - 10 - wingFlap);
                ctx.lineTo(m.x + m.width + 10, m.y + 70);
                ctx.fill();

                // 드래곤 몸체 (둥근 드래곤 갑피)
                ctx.fillStyle = '#b71c1c';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x, m.y, m.width, m.height, 16);
                else ctx.rect(m.x, m.y, m.width, m.height);
                ctx.fill();

                // 뿔
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.moveTo(m.x + 20, m.y + 5);
                ctx.lineTo(m.x + 10, m.y - 20);
                ctx.lineTo(m.x + 30, m.y + 5);
                ctx.moveTo(m.x + m.width - 20, m.y + 5);
                ctx.lineTo(m.x + m.width - 10, m.y - 20);
                ctx.lineTo(m.x + m.width - 30, m.y + 5);
                ctx.fill();

                // 황금빛 눈 (슬릿 동공)
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(m.x + 22, m.y + 28, 16, 14);
                ctx.fillRect(m.x + 62, m.y + 28, 16, 14);
                ctx.fillStyle = '#000000';
                ctx.fillRect(m.x + 29, m.y + 28, 4, 14);
                ctx.fillRect(m.x + 69, m.y + 28, 4, 14);

                // 화염 콧김
                ctx.fillStyle = '#ff5722';
                ctx.fillRect(m.x + 38, m.y + 60, 24, 10);
                ctx.restore();
            } else if (m.type === 'slime') {
                // 1. 슬라임 (둥글고 젤리처럼 출렁이는 푸른빛 슬라임)
                const wobble = Math.sin(time * 2 + m.x) * 3;
                ctx.save();

                // 슬라임 외곽 젤리 돔
                const grad = ctx.createLinearGradient(m.x, m.y, m.x, m.y + m.height);
                grad.addColorStop(0, '#55ff99');
                grad.addColorStop(1, '#00b348');
                ctx.fillStyle = grad;

                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x - wobble, m.y + wobble, m.width + wobble * 2, m.height - wobble, 14);
                else ctx.rect(m.x, m.y, m.width, m.height);
                ctx.fill();

                // 광택 하이라이트
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(m.x + 12, m.y + 12, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();

                // 내부 핵 젤리 방울
                ctx.fillStyle = 'rgba(0, 80, 20, 0.4)';
                ctx.beginPath();
                ctx.arc(m.x + m.width / 2, m.y + m.height / 2 + 4, 7, 0, Math.PI * 2);
                ctx.fill();

                // 귀여운 검은 눈망울
                ctx.fillStyle = '#111111';
                ctx.fillRect(m.x + 12, m.y + 18, 5, 7);
                ctx.fillRect(m.x + 26, m.y + 18, 5, 7);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(m.x + 13, m.y + 19, 2, 2);
                ctx.fillRect(m.x + 27, m.y + 19, 2, 2);

                // 테두리
                ctx.strokeStyle = '#22cc66';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            } else if (m.type === 'zombie') {
                // 2. 좀비 (초록 부패 피부, 찢어진 보라 옷, 상처 흉터)
                const armSway = Math.sin(time * 1.8 + m.x) * 3;
                ctx.save();

                // 좀비 몸통 (둥근 옷)
                ctx.fillStyle = '#5c3d75'; // 찢어진 보라 셔츠
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 4, m.y + 18, m.width - 8, m.height - 18, 6);
                else ctx.rect(m.x + 4, m.y + 18, m.width - 8, m.height - 18);
                ctx.fill();

                // 좀비 얼굴 (초록 피부)
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 6, m.y + 2, m.width - 12, 18, 5);
                else ctx.rect(m.x + 6, m.y + 2, m.width - 12, 18);
                ctx.fill();

                // 뻗은 좀비 팔
                ctx.fillStyle = '#388e3c';
                ctx.fillRect(m.x - 2, m.y + 20 + armSway, 6, 12);
                ctx.fillRect(m.x + m.width - 4, m.y + 20 - armSway, 6, 12);

                // 눈 (비대칭 노란 섬뜩한 눈)
                ctx.fillStyle = '#ffff55';
                ctx.fillRect(m.x + 10, m.y + 7, 5, 5);
                ctx.fillRect(m.x + 22, m.y + 6, 4, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(m.x + 12, m.y + 8, 2, 2);
                ctx.fillRect(m.x + 23, m.y + 7, 2, 2);

                // 흉터 스티치
                ctx.strokeStyle = '#1b5e20';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(m.x + 15, m.y + 3); ctx.lineTo(m.x + 20, m.y + 6);
                ctx.stroke();

                ctx.restore();
            } else if (m.type === 'skeleton') {
                // 3. 스켈레톤 (아이보리 해골 두개골, 갈비뼈, 푸른 영혼의 안광)
                ctx.save();

                // 해골 머리 (둥근 두개골)
                ctx.fillStyle = '#f0f0f0';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 6, m.y + 2, m.width - 12, 16, 6);
                else ctx.rect(m.x + 6, m.y + 2, m.width - 12, 16);
                ctx.fill();

                // 턱 뼈
                ctx.fillStyle = '#dcdcdc';
                ctx.fillRect(m.x + 10, m.y + 17, m.width - 20, 5);

                // 갈비뼈 & 척추
                ctx.fillStyle = '#e8e8e8';
                ctx.fillRect(m.x + m.width / 2 - 3, m.y + 22, 6, 18);
                ctx.fillRect(m.x + 8, m.y + 25, m.width - 16, 3);
                ctx.fillRect(m.x + 10, m.y + 31, m.width - 20, 3);

                // 해골 안와 (깊은 눈구멍 + 푸른 안광)
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(m.x + 9, m.y + 6, 6, 6);
                ctx.fillRect(m.x + 21, m.y + 6, 6, 6);

                ctx.fillStyle = '#00ffff';
                ctx.fillRect(m.x + 11, m.y + 8, 3, 3);
                ctx.fillRect(m.x + 23, m.y + 8, 3, 3);

                // 손에 든 뼈/단검
                ctx.fillStyle = '#cfd8dc';
                ctx.fillRect(m.x + m.width - 2, m.y + 24, 3, 14);
                ctx.restore();
            } else if (m.type === 'orc') {
                // 4. 오크 (붉은 근육질 몸집, 위로 솟은 하얀 엄니, 철제 투구)
                ctx.save();

                // 붉은 오크 몸체
                ctx.fillStyle = '#8b1e1e';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 4, m.y + 6, m.width - 8, m.height - 8, 8);
                else ctx.rect(m.x + 4, m.y + 6, m.width - 8, m.height - 8);
                ctx.fill();

                // 철제 어깨 갑주 / 투구
                ctx.fillStyle = '#424242';
                ctx.fillRect(m.x + 8, m.y + 4, m.width - 16, 10);

                // 매서운 눈
                ctx.fillStyle = '#ffe600';
                ctx.fillRect(m.x + 14, m.y + 16, 6, 4);
                ctx.fillRect(m.x + 28, m.y + 16, 6, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(m.x + 16, m.y + 17, 2, 2);
                ctx.fillRect(m.x + 30, m.y + 17, 2, 2);

                // 아래턱에서 솟은 2개의 거대한 상아 엄니
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(m.x + 12, m.y + 32); ctx.lineTo(m.x + 15, m.y + 23); ctx.lineTo(m.x + 18, m.y + 32);
                ctx.moveTo(m.x + 28, m.y + 32); ctx.lineTo(m.x + 31, m.y + 23); ctx.lineTo(m.x + 34, m.y + 32);
                ctx.fill();

                // 무거운 쇠몽둥이
                ctx.fillStyle = '#37474f';
                ctx.fillRect(m.x + m.width - 4, m.y + 14, 6, 26);
                ctx.fillStyle = '#90a4ae';
                ctx.fillRect(m.x + m.width - 6, m.y + 10, 10, 8);
                ctx.restore();
            } else if (m.type === 'spider') {
                // 5. 큰 거미 (보랏빛 둥근 몸통, 8개의 다리 애니메이션, 붉은 눈)
                const legWiggle = Math.sin(time * 2.5 + m.x) * 4;
                ctx.save();

                // 거미 8개 다리
                ctx.strokeStyle = '#6a1b9a';
                ctx.lineWidth = 2.5;
                for (let i = 0; i < 4; i++) {
                    const offset = i * 8;
                    // 좌측 4개 다리
                    ctx.beginPath();
                    ctx.moveTo(m.x + 12, m.y + 12 + offset);
                    ctx.lineTo(m.x - 8, m.y + 8 + offset + (i % 2 === 0 ? legWiggle : -legWiggle));
                    ctx.stroke();

                    // 우측 4개 다리
                    ctx.beginPath();
                    ctx.moveTo(m.x + m.width - 12, m.y + 12 + offset);
                    ctx.lineTo(m.x + m.width + 8, m.y + 8 + offset + (i % 2 === 0 ? -legWiggle : legWiggle));
                    ctx.stroke();
                }

                // 거미 복부 (둥근 뒤쪽 몸체)
                ctx.fillStyle = '#311b92';
                ctx.beginPath();
                ctx.arc(m.x + m.width / 2, m.y + m.height / 2 + 5, 14, 0, Math.PI * 2);
                ctx.fill();

                // 거미 두흉부 (머리)
                ctx.fillStyle = '#4a148c';
                ctx.beginPath();
                ctx.arc(m.x + m.width / 2, m.y + 14, 10, 0, Math.PI * 2);
                ctx.fill();

                // 붉은 거미 눈 (다안)
                ctx.fillStyle = '#ff1744';
                ctx.fillRect(m.x + m.width / 2 - 6, m.y + 10, 3, 3);
                ctx.fillRect(m.x + m.width / 2 + 3, m.y + 10, 3, 3);
                ctx.fillRect(m.x + m.width / 2 - 3, m.y + 13, 2, 2);
                ctx.fillRect(m.x + m.width / 2 + 1, m.y + 13, 2, 2);

                // 독 이빨 (독니)
                ctx.fillStyle = '#00e676';
                ctx.fillRect(m.x + m.width / 2 - 4, m.y + 18, 2, 4);
                ctx.fillRect(m.x + m.width / 2 + 2, m.y + 18, 2, 4);

                ctx.restore();
            }

            // 몬스터 체력바
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(m.x, m.y - 10, m.width, 5);
            ctx.fillStyle = '#ff4d4d';
            ctx.fillRect(m.x, m.y - 10, m.width * (m.hp / m.maxHp), 5);

            // 몬스터 이름
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px DungGeunMo';
            ctx.fillText(m.name, m.x, m.y - 14);
        });

        // 4. 플레이어 그리기
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x + 6, player.y + 6, 6, 6);
        ctx.fillRect(player.x + 20, player.y + 6, 6, 6);

        // 칼 휘두르기 4x4 공격 범위 이펙트
        if (player.isAttacking) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 230, 0, 0.25)';
            ctx.strokeStyle = '#ffe600';
            ctx.lineWidth = 2;
            ctx.fillRect(player.attackBox.x, player.attackBox.y, player.attackBox.width, player.attackBox.height);
            ctx.strokeRect(player.attackBox.x, player.attackBox.y, player.attackBox.width, player.attackBox.height);
            ctx.restore();
        }

        // 5. 플로팅 텍스트 그리기
        floatingTexts.forEach(ft => {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 16px DungGeunMo';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        });
    }

    // 메인 게임 루프
    function gameLoop() {
        if (gameState === 'PLAYING') {
            updatePlayer();
            updateMonsters();
            updateFloatingTexts();
            draw();
        }
        requestAnimationFrame(gameLoop);
    }

    // 게임 시작 처리
    function startGame() {
        sound.init();
        gameState = 'PLAYING';
        currentZone = 'TOWN';

        player.x = 480;
        player.y = 320;
        player.hp = 100;
        player.maxHp = 100;
        player.atk = 10;
        player.atkUpgradeLevel = 0;
        player.level = 1;
        player.exp = 0;
        player.nextExp = 50;
        player.gold = 0;
        player.inventory = {};
        activeQuest = null;
        monsters = [];

        generateTownObjects();
        updateUI();

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        bossHud.classList.add('hidden');
        gameUI.classList.remove('hidden');
    }

    // 게임 오버 처리 (사망 효과음)
    function handleGameOver() {
        gameState = 'GAMEOVER';
        sound.playPlayerDeath();
        gameUI.classList.add('hidden');
        bossHud.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    }

    // 게임 승리 처리 (드래곤 토벌)
    function handleVictory() {
        gameState = 'VICTORY';
        sound.playQuestClear();
        finalStatsText.textContent = `최종 골드: ${player.gold}G | 레벨: LV.${player.level} | 최종 공격력: ${player.atk}`;
        gameUI.classList.add('hidden');
        bossHud.classList.add('hidden');
        victoryScreen.classList.remove('hidden');
    }

    // 버튼 이벤트 바인딩
    btnStartGame.addEventListener('click', startGame);
    btnRestart.addEventListener('click', startGame);
    btnVictoryRestart.addEventListener('click', startGame);

    // 초기 화면 렌더링
    generateTownObjects();
    gameLoop();
});
