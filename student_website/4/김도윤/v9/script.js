// 픽셀 RPG v9 게임 엔진: BGM을 방해하지 않는 차분하고 부드러운 효과음 볼륨 시스템

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
    const btnBgmToggle = document.getElementById('btnBgmToggle');

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

    // 게임 상태 변수
    let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER', 'VICTORY'
    let currentZone = 'TOWN'; // 'TOWN', 'ZONE1', 'ZONE2', 'ZONE3', 'ZONE_DRAGON'
    let isBgmMuted = false;

    // 플레이어 객체 (칼을 든 모험가 캐릭터)
    const player = {
        x: 480,
        y: 320,
        width: 34,
        height: 36,
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

    // 사운드 & 절차적 BGM 및 차분한 효과음 합성기 (Web Audio API)
    class SoundSynth {
        constructor() {
            this.ctx = null;
            this.stepToggle = false;
            this.bgmTimer = null;
            this.currentBgmZone = null;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === 'suspended') this.ctx.resume();
        }

        // 🎵 지역별 분위기에 맞춘 5색 배경음악(BGM) 루프 엔진
        playZoneBGM(zone) {
            this.init();
            if (isBgmMuted || !this.ctx) return;
            if (this.currentBgmZone === zone) return;

            this.stopBGM();
            this.currentBgmZone = zone;

            let step = 0;

            if (zone === 'TOWN') {
                // 1. 🏡 마을: 평화롭고 아늑한 마장조 멜로디
                const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 392.00, 329.63, 261.63];
                const playTownStep = () => {
                    if (isBgmMuted || this.currentBgmZone !== 'TOWN') return;
                    const freq = notes[step % notes.length];
                    const now = this.ctx.currentTime;

                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);

                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(); osc.stop(now + 0.35);

                    step++;
                    this.bgmTimer = setTimeout(playTownStep, 360);
                };
                playTownStep();

            } else if (zone === 'ZONE1') {
                // 2. 🌫️ 1지역 늪: 축축하고 어두운 물방울 서스펜스
                const notes = [220.00, 185.00, 207.65, 174.61, 293.66, 174.61];
                const playSwampStep = () => {
                    if (isBgmMuted || this.currentBgmZone !== 'ZONE1') return;
                    const freq = notes[step % notes.length];
                    const now = this.ctx.currentTime;

                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq * 1.5, now);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.22);

                    gain.gain.setValueAtTime(0.09, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(); osc.stop(now + 0.22);

                    step++;
                    this.bgmTimer = setTimeout(playSwampStep, 480);
                };
                playSwampStep();

            } else if (zone === 'ZONE2') {
                // 3. ✨ 2지역 숲: 신비롭고 몽환적인 정령 아르페지오
                const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51, 987.77];
                const playForestStep = () => {
                    if (isBgmMuted || this.currentBgmZone !== 'ZONE2') return;
                    const freq = notes[step % notes.length];
                    const now = this.ctx.currentTime;

                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now);

                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(); osc.stop(now + 0.45);

                    step++;
                    this.bgmTimer = setTimeout(playForestStep, 280);
                };
                playForestStep();

            } else if (zone === 'ZONE3') {
                // 4. 💎 3지역 동굴: 어둡지만 광물의 빛이 영롱한 오블리비언 울림
                const notes = [440.00, 554.37, 659.25, 880.00, 1108.73];
                const playCaveStep = () => {
                    if (isBgmMuted || this.currentBgmZone !== 'ZONE3') return;
                    const freq = notes[step % notes.length];
                    const now = this.ctx.currentTime;

                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq * 0.5, now);
                    osc.frequency.linearRampToValueAtTime(freq, now + 0.15);

                    gain.gain.setValueAtTime(0.07, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(); osc.stop(now + 0.6);

                    step++;
                    this.bgmTimer = setTimeout(playCaveStep, 540);
                };
                playCaveStep();

            } else if (zone === 'ZONE_DRAGON') {
                // 5. 🔥 드래곤의 둥지: 긴박하고 뜨거운 16비트 보스전 비트
                const notes = [146.83, 146.83, 174.61, 196.00, 207.65, 220.00, 174.61, 146.83];
                const playDragonStep = () => {
                    if (isBgmMuted || this.currentBgmZone !== 'ZONE_DRAGON') return;
                    const freq = notes[step % notes.length];
                    const now = this.ctx.currentTime;

                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now);

                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

                    osc.connect(gain); gain.connect(this.ctx.destination);
                    osc.start(); osc.stop(now + 0.16);

                    step++;
                    this.bgmTimer = setTimeout(playDragonStep, 180);
                };
                playDragonStep();
            }
        }

        stopBGM() {
            if (this.bgmTimer) {
                clearTimeout(this.bgmTimer);
                this.bgmTimer = null;
            }
            this.currentBgmZone = null;
        }

        // 1. 발걸음 소리 (BGM 방해 금지 - 0.05 조율)
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

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(now + 0.08);
        }

        // 2. 칼날 휘두름 소리 (BGM 방해 금지 - 0.04 / 0.025 조율)
        playSwordSlash() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(110, now);
            osc1.frequency.exponentialRampToValueAtTime(260, now + 0.05);
            osc1.frequency.exponentialRampToValueAtTime(65, now + 0.18);

            gain1.gain.setValueAtTime(0.04, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(220, now);
            osc2.frequency.exponentialRampToValueAtTime(90, now + 0.15);

            gain2.gain.setValueAtTime(0.025, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc1.connect(gain1); gain1.connect(this.ctx.destination);
            osc2.connect(gain2); gain2.connect(this.ctx.destination);

            osc1.start(); osc1.stop(now + 0.18);
            osc2.start(); osc2.stop(now + 0.15);
        }

        // 3. 피격 소리 (BGM 방해 금지 - 0.08 조율)
        playHit() {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.1);
        }

        // 4. 플레이어 사망 소리 (BGM 방해 금지 - 0.10 조율)
        playPlayerDeath() {
            if (!this.ctx) return;
            this.stopBGM();
            const freqs = [350, 300, 250, 180, 100];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.12);

                gain.gain.setValueAtTime(0.10, this.ctx.currentTime + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.15);

                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.12);
                osc.stop(this.ctx.currentTime + idx * 0.12 + 0.15);
            });
        }

        // 5. 몬스터 사망 소리 (BGM 방해 금지 - 0.07~0.09 부드럽게 조율)
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
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            } else if (monsterType === 'zombie') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.25);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            } else if (monsterType === 'skeleton') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(400, now + 0.05);
                osc.frequency.setValueAtTime(900, now + 0.1);
                osc.frequency.setValueAtTime(200, now + 0.15);
                gain.gain.setValueAtTime(0.07, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            } else if (monsterType === 'orc') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);
                gain.gain.setValueAtTime(0.09, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            } else if (monsterType === 'spider') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
                gain.gain.setValueAtTime(0.07, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            } else if (monsterType === 'dragon') {
                const notes = [440, 330, 220, 110, 55];
                notes.forEach((f, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.setValueAtTime(f, now + i * 0.15);
                    g.gain.setValueAtTime(0.12, now + i * 0.15);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
                    o.connect(g); g.connect(this.ctx.destination);
                    o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.4);
                });
                return;
            } else {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            }

            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(now + 0.3);
        }

        // 6. 전리품 습득 소리 (BGM 방해 금지 - 0.06 조율)
        playLoot() {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.18);
        }

        // 7. 퀘스트 클리어 및 레벨업 축하 소리 (BGM 방해 금지 - 0.09 조율)
        playQuestClear() {
            if (!this.ctx) return;
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.09, this.ctx.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.1 + 0.25);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + i * 0.1);
                osc.stop(this.ctx.currentTime + i * 0.1 + 0.25);
            });
        }
    }
    const sound = new SoundSynth();

    // BGM 음소거 토글 버튼 이벤트
    btnBgmToggle.addEventListener('click', () => {
        sound.init();
        isBgmMuted = !isBgmMuted;
        if (isBgmMuted) {
            btnBgmToggle.textContent = '🔇 BGM OFF';
            btnBgmToggle.classList.add('muted');
            sound.stopBGM();
        } else {
            btnBgmToggle.textContent = '🎵 BGM ON';
            btnBgmToggle.classList.remove('muted');
            sound.playZoneBGM(currentZone);
        }
    });

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

    // 마을 배치 생성
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

        npcs = [
            { id: 'npc_slime', name: '촌장 장로', x: 230, y: 200, width: 36, height: 42, role: 'elder' },
            { id: 'npc_zombie', name: '경비대장 론', x: 480, y: 150, width: 36, height: 42, role: 'guard' },
            { id: 'npc_skeleton', name: '약초상 엘리', x: 720, y: 200, width: 36, height: 42, role: 'herbalist' },
            { id: 'npc_boss', name: '용병왕 칼드', x: 480, y: 470, width: 38, height: 42, role: 'mercenary' },
            { id: 'npc_weapon', name: '무기상 대장장이', x: 600, y: 350, width: 38, height: 42, role: 'blacksmith', isWeaponShop: true },
            { id: 'npc_healer', name: '성녀 세라', x: 330, y: 350, width: 36, height: 42, role: 'saint' },
            { id: 'npc_hunter', name: '사냥꾼 카일', x: 700, y: 460, width: 36, height: 42, role: 'hunter' }
        ];

        npcs.forEach(npc => {
            if (!npc.isWeaponShop) {
                npc.quest = generateRandomQuestForNPC(npc);
            }
        });
    }

    // 몬스터 생성
    function spawnMonstersForZone(zone) {
        monsters = [];
        if (zone === 'TOWN') {
            bossHud.classList.add('hidden');
            return;
        }

        if (zone === 'ZONE1') {
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
                    dx: (Math.random() - 0.5) * 2,
                    dy: (Math.random() - 0.5) * 2
                });
            }
        } else if (zone === 'ZONE2') {
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
                    dx: (Math.random() - 0.5) * 2.2,
                    dy: (Math.random() - 0.5) * 2.2
                });
            }
        } else if (zone === 'ZONE3') {
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
                    dx: (Math.random() - 0.5) * 3,
                    dy: (Math.random() - 0.5) * 3
                });
            }
        } else if (zone === 'ZONE_DRAGON') {
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

    // 공격 수행 함수
    function performAttack() {
        if (player.isAttacking) return;
        player.isAttacking = true;
        player.attackTimer = 12;
        sound.playSwordSlash();

        const attackSize = 128;
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;

        player.attackBox = {
            x: centerX - attackSize / 2,
            y: centerY - attackSize / 2,
            width: attackSize,
            height: attackSize
        };

        monsters.forEach(m => {
            if (m.hp > 0 && isColliding(player.attackBox, m)) {
                m.hp -= player.atk;
                addFloatingText(`-${player.atk}`, m.x + m.width / 2, m.y, '#ff4d4d');

                if (m.isBoss) {
                    updateBossHpDisplay();
                }

                if (m.hp <= 0) {
                    addLoot(m.loot);
                    addExp(m.exp);
                    addFloatingText(`+${m.loot}`, m.x, m.y - 15, '#ffcc00');
                    sound.playMonsterDeath(m.type);

                    if (activeQuest && activeQuest.type === 'kill' && activeQuest.targetMonster === m.type) {
                        activeQuest.currentCount++;
                        addFloatingText(`${activeQuest.targetMonsterName} 처치! (${activeQuest.currentCount}/${activeQuest.targetCount})`, player.x, player.y - 30, '#00ff66');
                        updateUI();
                    }

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

    // 경험치 획득 및 레벨업
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

    // 말풍선 대화 열기
    function openDialogue(npc) {
        sound.init();
        npcName.textContent = npc.name;

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

    // NPC별 랜덤 퀘스트 생성기
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

    // 무기상 공격력 강화 처리
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

    // 퀘스트 완료 처리
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

        // 포탈 및 맵 전환 판정
        if (currentZone === 'TOWN') {
            if (player.x < 10) { transitionZone('ZONE1', canvas.width - 60, player.y); }
            else if (player.x > canvas.width - 45) { transitionZone('ZONE2', 45, player.y); }
            else if (player.y < 10) { transitionZone('ZONE3', player.x, canvas.height - 60); }
            else if (player.y > canvas.height - 45) { transitionZone('ZONE_DRAGON', player.x, 45); }
        } else {
            if (currentZone === 'ZONE1' && (player.x > canvas.width - 50 || player.x < 10)) {
                transitionZone('TOWN', 45, player.y);
            } else if (currentZone === 'ZONE2' && (player.x < 15 || player.x > canvas.width - 45)) {
                transitionZone('TOWN', canvas.width - 55, player.y);
            } else if (currentZone === 'ZONE3' && (player.y > canvas.height - 50 || player.y < 10)) {
                transitionZone('TOWN', player.x, 45);
            } else if (currentZone === 'ZONE_DRAGON' && (player.y < 20 || player.y > canvas.height - 45)) {
                transitionZone('TOWN', player.x, canvas.height - 55);
            }
        }

        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

        if (player.attackTimer > 0) {
            player.attackTimer--;
            if (player.attackTimer === 0) player.isAttacking = false;
        }
    }

    // 맵 이동 처리 및 맞춤 테마 BGM 전환!
    function transitionZone(newZone, startX, startY) {
        currentZone = newZone;
        player.x = startX;
        player.y = startY;
        spawnMonstersForZone(newZone);

        sound.playZoneBGM(newZone);

        const zoneNames = {
            'TOWN': '평화로운 햇살 마을 🏡',
            'ZONE1': '1지역: 축축한 안개 늪지대 🌫️',
            'ZONE2': '2지역: 신비로운 정령의 숲 ✨',
            'ZONE3': '3지역: 빛나는 광물의 어두운 동굴 💎',
            'ZONE_DRAGON': '🔥 화염의 드래곤 둥지 (보스전)'
        };
        addFloatingText(`[입장] ${zoneNames[newZone]}`, canvas.width / 2 - 140, canvas.height / 2, '#ffcc00');
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

    // 캔버스 그리기 함수
    function draw() {
        const time = Date.now() * 0.003;

        // 1. 맵별 고유 배경 및 테마 이펙트
        if (currentZone === 'TOWN') {
            ctx.fillStyle = '#4a7c43';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#7a7566';
            ctx.fillRect(0, 300, canvas.width, 40);
            ctx.fillRect(460, 0, 40, canvas.height);

            ctx.fillStyle = '#9e9784';
            for (let i = 20; i < canvas.width; i += 50) {
                ctx.fillRect(i, 312, 6, 4);
                ctx.fillRect(i + 15, 324, 8, 4);
            }

            const flowerColors = ['#ff6b6b', '#feca57', '#54a0ff', '#ff9ff3'];
            const flowerPos = [
                { x: 180, y: 220 }, { x: 400, y: 240 }, { x: 620, y: 220 },
                { x: 200, y: 380 }, { x: 420, y: 400 }, { x: 640, y: 380 }
            ];
            flowerPos.forEach((fp, idx) => {
                ctx.fillStyle = flowerColors[idx % flowerColors.length];
                ctx.beginPath();
                ctx.arc(fp.x, fp.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(fp.x + 8, fp.y + 2, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = 'rgba(255, 240, 180, 0.12)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

        } else if (currentZone === 'ZONE1') {
            ctx.fillStyle = '#16281e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0e1c14';
            ctx.beginPath(); ctx.ellipse(220, 200, 100, 60, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(680, 400, 130, 70, 0.2, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = 'rgba(0, 200, 130, 0.25)';
            ctx.lineWidth = 2;
            const ripple = (time * 15) % 40;
            ctx.beginPath(); ctx.ellipse(220, 200, 40 + ripple, 20 + ripple * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(680, 400, 50 + ripple, 25 + ripple * 0.5, 0.2, 0, Math.PI * 2); ctx.stroke();

            ctx.fillStyle = '#2d5438';
            for (let r = 0; r < 8; r++) {
                ctx.fillRect(160 + r * 16, 140, 4, 28);
                ctx.fillRect(620 + r * 18, 330, 4, 30);
            }

            const bubbleY = (time * 25) % 50;
            ctx.fillStyle = 'rgba(100, 255, 180, 0.4)';
            ctx.beginPath(); ctx.arc(240, 210 - bubbleY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(710, 410 - bubbleY, 6, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = 'rgba(20, 80, 50, 0.18)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

        } else if (currentZone === 'ZONE2') {
            ctx.fillStyle = '#0d261a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#1b3b2c';
            ctx.beginPath(); ctx.arc(480, 320, 85, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#00ffcc';
            ctx.font = '14px DungGeunMo';
            ctx.fillText('✧ ᚱ ᚢ ᚾ ᛖ ✧', 430, 325);

            const orbs = [
                { x: 180, y: 150, c: '#00ffcc', s: 1.2 },
                { x: 320, y: 460, c: '#ffeaa7', s: 1.8 },
                { x: 740, y: 180, c: '#d6a2e8', s: 1.4 },
                { x: 800, y: 440, c: '#55efc4', s: 2.0 },
                { x: 480, y: 120, c: '#74b9ff', s: 1.6 }
            ];
            orbs.forEach(orb => {
                const floatY = Math.sin(time * orb.s + orb.x) * 12;
                ctx.fillStyle = orb.c;
                ctx.shadowColor = orb.c;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y + floatY, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            ctx.fillStyle = 'rgba(0, 255, 180, 0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

        } else if (currentZone === 'ZONE3') {
            ctx.fillStyle = '#120f1c';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(100, 150); ctx.lineTo(160, 210); ctx.lineTo(240, 190);
            ctx.moveTo(600, 380); ctx.lineTo(680, 430); ctx.lineTo(760, 390);
            ctx.stroke();

            const crystals = [
                { x: 180, y: 120, c: '#00f3ff', name: '청석' },
                { x: 750, y: 140, c: '#e056fd', name: '자수정' },
                { x: 160, y: 480, c: '#ffbe76', name: '황금광' },
                { x: 800, y: 480, c: '#ff3838', name: '루비' },
                { x: 480, y: 90, c: '#22a6b3', name: '비취' }
            ];

            crystals.forEach(c => {
                const pulse = Math.sin(time * 2 + c.x) * 4;
                ctx.save();
                ctx.shadowColor = c.c;
                ctx.shadowBlur = 20 + pulse;

                ctx.fillStyle = c.c;
                ctx.beginPath();
                ctx.moveTo(c.x, c.y - 18 - pulse);
                ctx.lineTo(c.x - 10, c.y + 8);
                ctx.lineTo(c.x + 10, c.y + 8);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(c.x + 12, c.y - 10 - pulse * 0.8);
                ctx.lineTo(c.x + 4, c.y + 8);
                ctx.lineTo(c.x + 18, c.y + 8);
                ctx.fill();

                ctx.restore();
            });

        } else if (currentZone === 'ZONE_DRAGON') {
            ctx.fillStyle = '#260606';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ff3d00';
            ctx.beginPath(); ctx.arc(250, 200, 90, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(720, 400, 110, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff9100';
            ctx.beginPath(); ctx.arc(250, 200, 60, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(720, 400, 75, 0, Math.PI * 2); ctx.fill();
        }

        // 포탈 / 맵 출구 텍스트 표시
        ctx.fillStyle = '#ffcc00';
        ctx.font = '16px DungGeunMo';
        if (currentZone === 'TOWN') {
            ctx.fillText('◀ 1지역 (축축한 늪)', 10, 320);
            ctx.fillText('2지역 (신비의 숲) ▶', canvas.width - 160, 320);
            ctx.fillText('▲ 3지역 (빛나는 동굴)', 380, 25);
            ctx.fillStyle = '#ff3300';
            ctx.fillText('▼ 🔥 드래곤의 둥지 (보스)', 370, canvas.height - 15);
        } else {
            ctx.fillText('마을로 돌아가기 🚪', canvas.width / 2 - 60, canvas.height - 15);
        }

        // 2. 마을 구조물 & 수제작 개성 NPC 7종 그리기
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
                ctx.fillStyle = '#228b22';
                ctx.beginPath();
                ctx.arc(t.x + t.width / 2, t.y + 18, 22, 0, Math.PI * 2);
                ctx.fill();
            });

            npcs.forEach(npc => {
                const bob = Math.sin(time * 3 + npc.x) * 2;
                ctx.save();

                if (npc.role === 'elder') {
                    ctx.fillStyle = '#2980b9';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(npc.x + 4, npc.y + 14 + bob, npc.width - 8, npc.height - 14, 6);
                    else ctx.rect(npc.x + 4, npc.y + 14 + bob, npc.width - 8, npc.height - 14);
                    ctx.fill();

                    ctx.fillStyle = '#1c5980';
                    ctx.beginPath();
                    ctx.moveTo(npc.x + 4, npc.y + 12 + bob);
                    ctx.lineTo(npc.x + npc.width / 2, npc.y - 12 + bob);
                    ctx.lineTo(npc.x + npc.width - 4, npc.y + 12 + bob);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.moveTo(npc.x + 10, npc.y + 16 + bob);
                    ctx.lineTo(npc.x + npc.width / 2, npc.y + 28 + bob);
                    ctx.lineTo(npc.x + npc.width - 10, npc.y + 16 + bob);
                    ctx.fill();

                    ctx.fillStyle = '#8e44ad';
                    ctx.fillRect(npc.x + npc.width + 2, npc.y + 6 + bob, 4, 34);
                    ctx.fillStyle = '#2ecc71';
                    ctx.beginPath();
                    ctx.arc(npc.x + npc.width + 4, npc.y + 4 + bob, 5, 0, Math.PI * 2);
                    ctx.fill();

                } else if (npc.role === 'guard') {
                    ctx.fillStyle = '#bdc3c7';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(npc.x + 4, npc.y + 12 + bob, npc.width - 8, npc.height - 12, 5);
                    else ctx.rect(npc.x + 4, npc.y + 12 + bob, npc.width - 8, npc.height - 12);
                    ctx.fill();

                    ctx.fillStyle = '#7f8c8d';
                    ctx.fillRect(npc.x + 6, npc.y + bob, npc.width - 12, 14);
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(npc.x + 10, npc.y + 6 + bob, npc.width - 20, 3);

                    ctx.fillStyle = '#e74c3c';
                    ctx.beginPath();
                    ctx.moveTo(npc.x + npc.width / 2, npc.y - 10 + bob);
                    ctx.lineTo(npc.x + npc.width / 2 + 10, npc.y + bob);
                    ctx.lineTo(npc.x + npc.width / 2 - 4, npc.y + bob);
                    ctx.fill();

                    ctx.fillStyle = '#ecf0f1';
                    ctx.fillRect(npc.x - 4, npc.y + 10 + bob, 4, 28);
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillRect(npc.x - 6, npc.y + 16 + bob, 8, 4);

                } else if (npc.role === 'herbalist') {
                    ctx.fillStyle = '#27ae60';
                    ctx.fillRect(npc.x + 6, npc.y + 18 + bob, npc.width - 12, npc.height - 18);
                    ctx.fillStyle = '#fd79a8';
                    ctx.fillRect(npc.x + 8, npc.y + 14 + bob, npc.width - 16, 16);

                    ctx.fillStyle = '#ffeaa7';
                    ctx.fillRect(npc.x + 8, npc.y + 2 + bob, npc.width - 16, 12);
                    ctx.fillStyle = '#e84393';
                    ctx.beginPath();
                    ctx.arc(npc.x + 10, npc.y + 2 + bob, 3, 0, Math.PI * 2);
                    ctx.arc(npc.x + 18, npc.y + bob, 3, 0, Math.PI * 2);
                    ctx.arc(npc.x + 26, npc.y + 2 + bob, 3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#d35400';
                    ctx.fillRect(npc.x + npc.width - 2, npc.y + 18 + bob, 10, 12);
                    ctx.fillStyle = '#2ecc71';
                    ctx.fillRect(npc.x + npc.width, npc.y + 14 + bob, 6, 6);

                } else if (npc.role === 'mercenary') {
                    ctx.fillStyle = '#2d3436';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(npc.x + 4, npc.y + 10 + bob, npc.width - 8, npc.height - 10, 6);
                    else ctx.rect(npc.x + 4, npc.y + 10 + bob, npc.width - 8, npc.height - 10);
                    ctx.fill();

                    ctx.fillStyle = '#c0392b';
                    ctx.fillRect(npc.x + 2, npc.y + 14 + bob, 4, 24);
                    ctx.fillRect(npc.x + npc.width - 6, npc.y + 14 + bob, 4, 24);

                    ctx.fillStyle = '#ffeaa7';
                    ctx.fillRect(npc.x + 8, npc.y + 2 + bob, npc.width - 16, 10);
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(npc.x + 10, npc.y + 4 + bob, 5, 5);

                    ctx.strokeStyle = '#dfe6e9';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(npc.x + 4, npc.y - 6 + bob); ctx.lineTo(npc.x + npc.width - 4, npc.y + 20 + bob);
                    ctx.moveTo(npc.x + npc.width - 4, npc.y - 6 + bob); ctx.lineTo(npc.x + 4, npc.y + 20 + bob);
                    ctx.stroke();

                } else if (npc.role === 'blacksmith') {
                    ctx.fillStyle = '#795548';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(npc.x + 4, npc.y + 12 + bob, npc.width - 8, npc.height - 12, 6);
                    else ctx.rect(npc.x + 4, npc.y + 12 + bob, npc.width - 8, npc.height - 12);
                    ctx.fill();

                    ctx.fillStyle = '#d63031';
                    ctx.fillRect(npc.x + 6, npc.y + bob, npc.width - 12, 8);

                    ctx.fillStyle = '#2d3436';
                    ctx.fillRect(npc.x + 12, npc.y + 12 + bob, 14, 6);

                    ctx.fillStyle = '#636e72';
                    ctx.fillRect(npc.x + npc.width, npc.y + 8 + bob, 6, 8);
                    ctx.fillStyle = '#b2bec3';
                    ctx.fillRect(npc.x + npc.width - 2, npc.y + 14 + bob, 10, 4);

                    ctx.fillStyle = '#2d3436';
                    ctx.fillRect(npc.x - 14, npc.y + 22, 12, 16);
                    ctx.fillStyle = '#ffeaa7';
                    ctx.fillRect(npc.x - 10, npc.y + 18 + Math.sin(time * 10) * 3, 2, 2);

                } else if (npc.role === 'saint') {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(npc.x + 4, npc.y + 12 + bob, npc.width - 8, npc.height - 12, 8);
                    else ctx.rect(npc.x + 4, npc.y + 12 + bob, npc.width - 8, npc.height - 12);
                    ctx.fill();

                    ctx.fillStyle = '#0984e3';
                    ctx.fillRect(npc.x + 8, npc.y + 12 + bob, npc.width - 16, 6);

                    ctx.save();
                    ctx.strokeStyle = '#f1c40f';
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = '#f1c40f';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.ellipse(npc.x + npc.width / 2, npc.y - 6 + bob, 12, 4, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();

                    ctx.fillStyle = '#f1c40f';
                    ctx.fillRect(npc.x + npc.width + 2, npc.y + 12 + bob, 8, 16);
                    ctx.fillRect(npc.x + npc.width - 2, npc.y + 16 + bob, 16, 4);

                } else if (npc.role === 'hunter') {
                    ctx.fillStyle = '#218c74';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(npc.x + 4, npc.y + 10 + bob, npc.width - 8, npc.height - 10, 6);
                    else ctx.rect(npc.x + 4, npc.y + 10 + bob, npc.width - 8, npc.height - 10);
                    ctx.fill();

                    ctx.fillStyle = '#33d9b2';
                    ctx.fillRect(npc.x + 6, npc.y + bob, npc.width - 12, 8);
                    ctx.fillStyle = '#ff5252';
                    ctx.fillRect(npc.x + npc.width - 8, npc.y - 6 + bob, 4, 8);

                    ctx.strokeStyle = '#cd6133';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(npc.x - 4, npc.y + 20 + bob, 14, -Math.PI / 2, Math.PI / 2);
                    ctx.stroke();
                }

                ctx.restore();

                ctx.fillStyle = '#ffff00';
                ctx.font = '14px DungGeunMo';
                ctx.fillText(npc.name, npc.x - 10, npc.y - 12 + bob);
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px DungGeunMo';
                ctx.fillText('[우클릭]', npc.x - 6, npc.y + npc.height + 16);
            });
        }

        // 3. 몬스터 5종 및 보스 드래곤 렌더링
        monsters.forEach(m => {
            if (m.hp <= 0) return;

            if (m.type === 'dragon') {
                ctx.save();
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

                ctx.fillStyle = '#b71c1c';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x, m.y, m.width, m.height, 16);
                else ctx.rect(m.x, m.y, m.width, m.height);
                ctx.fill();

                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.moveTo(m.x + 20, m.y + 5);
                ctx.lineTo(m.x + 10, m.y - 20);
                ctx.lineTo(m.x + 30, m.y + 5);
                ctx.moveTo(m.x + m.width - 20, m.y + 5);
                ctx.lineTo(m.x + m.width - 10, m.y - 20);
                ctx.lineTo(m.x + m.width - 30, m.y + 5);
                ctx.fill();

                ctx.fillStyle = '#ffd700';
                ctx.fillRect(m.x + 22, m.y + 28, 16, 14);
                ctx.fillRect(m.x + 62, m.y + 28, 16, 14);
                ctx.fillStyle = '#000000';
                ctx.fillRect(m.x + 29, m.y + 28, 4, 14);
                ctx.fillRect(m.x + 69, m.y + 28, 4, 14);

                ctx.fillStyle = '#ff5722';
                ctx.fillRect(m.x + 38, m.y + 60, 24, 10);
                ctx.restore();
            } else if (m.type === 'slime') {
                const slowTime = Date.now() * 0.002;
                const wobble = Math.sin(slowTime + m.x) * 2.5;
                ctx.save();

                const grad = ctx.createLinearGradient(m.x, m.y, m.x, m.y + m.height);
                grad.addColorStop(0, '#55ff99');
                grad.addColorStop(1, '#00b348');
                ctx.fillStyle = grad;

                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x - wobble, m.y + wobble, m.width + wobble * 2, m.height - wobble, 14);
                else ctx.rect(m.x, m.y, m.width, m.height);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(m.x + 12, m.y + 12, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(0, 80, 20, 0.4)';
                ctx.beginPath();
                ctx.arc(m.x + m.width / 2, m.y + m.height / 2 + 4, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#111111';
                ctx.fillRect(m.x + 12, m.y + 18, 5, 7);
                ctx.fillRect(m.x + 26, m.y + 18, 5, 7);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(m.x + 13, m.y + 19, 2, 2);
                ctx.fillRect(m.x + 27, m.y + 19, 2, 2);

                ctx.strokeStyle = '#22cc66';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            } else if (m.type === 'zombie') {
                const armSway = Math.sin(time * 1.8 + m.x) * 3;
                ctx.save();
                ctx.fillStyle = '#5c3d75';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 4, m.y + 18, m.width - 8, m.height - 18, 6);
                else ctx.rect(m.x + 4, m.y + 18, m.width - 8, m.height - 18);
                ctx.fill();

                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 6, m.y + 2, m.width - 12, 18, 5);
                else ctx.rect(m.x + 6, m.y + 2, m.width - 12, 18);
                ctx.fill();

                ctx.fillStyle = '#388e3c';
                ctx.fillRect(m.x - 2, m.y + 20 + armSway, 6, 12);
                ctx.fillRect(m.x + m.width - 4, m.y + 20 - armSway, 6, 12);

                ctx.fillStyle = '#ffff55';
                ctx.fillRect(m.x + 10, m.y + 7, 5, 5);
                ctx.fillRect(m.x + 22, m.y + 6, 4, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(m.x + 12, m.y + 8, 2, 2);
                ctx.fillRect(m.x + 23, m.y + 7, 2, 2);

                ctx.strokeStyle = '#1b5e20';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(m.x + 15, m.y + 3); ctx.lineTo(m.x + 20, m.y + 6);
                ctx.stroke();
                ctx.restore();
            } else if (m.type === 'skeleton') {
                ctx.save();
                ctx.fillStyle = '#f0f0f0';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 6, m.y + 2, m.width - 12, 16, 6);
                else ctx.rect(m.x + 6, m.y + 2, m.width - 12, 16);
                ctx.fill();

                ctx.fillStyle = '#dcdcdc';
                ctx.fillRect(m.x + 10, m.y + 17, m.width - 20, 5);

                ctx.fillStyle = '#e8e8e8';
                ctx.fillRect(m.x + m.width / 2 - 3, m.y + 22, 6, 18);
                ctx.fillRect(m.x + 8, m.y + 25, m.width - 16, 3);
                ctx.fillRect(m.x + 10, m.y + 31, m.width - 20, 3);

                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(m.x + 9, m.y + 6, 6, 6);
                ctx.fillRect(m.x + 21, m.y + 6, 6, 6);

                ctx.fillStyle = '#00ffff';
                ctx.fillRect(m.x + 11, m.y + 8, 3, 3);
                ctx.fillRect(m.x + 23, m.y + 8, 3, 3);

                ctx.fillStyle = '#cfd8dc';
                ctx.fillRect(m.x + m.width - 2, m.y + 24, 3, 14);
                ctx.restore();
            } else if (m.type === 'orc') {
                ctx.save();
                ctx.fillStyle = '#8b1e1e';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(m.x + 4, m.y + 6, m.width - 8, m.height - 8, 8);
                else ctx.rect(m.x + 4, m.y + 6, m.width - 8, m.height - 8);
                ctx.fill();

                ctx.fillStyle = '#424242';
                ctx.fillRect(m.x + 8, m.y + 4, m.width - 16, 10);

                ctx.fillStyle = '#ffe600';
                ctx.fillRect(m.x + 14, m.y + 16, 6, 4);
                ctx.fillRect(m.x + 28, m.y + 16, 6, 4);
                ctx.fillStyle = '#000000';
                ctx.fillRect(m.x + 16, m.y + 17, 2, 2);
                ctx.fillRect(m.x + 30, m.y + 17, 2, 2);

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(m.x + 12, m.y + 32); ctx.lineTo(m.x + 15, m.y + 23); ctx.lineTo(m.x + 18, m.y + 32);
                ctx.moveTo(m.x + 28, m.y + 32); ctx.lineTo(m.x + 31, m.y + 23); ctx.lineTo(m.x + 34, m.y + 32);
                ctx.fill();

                ctx.fillStyle = '#37474f';
                ctx.fillRect(m.x + m.width - 4, m.y + 14, 6, 26);
                ctx.fillStyle = '#90a4ae';
                ctx.fillRect(m.x + m.width - 6, m.y + 10, 10, 8);
                ctx.restore();
            } else if (m.type === 'spider') {
                const legWiggle = Math.sin(time * 2.5 + m.x) * 4;
                ctx.save();
                ctx.strokeStyle = '#6a1b9a';
                ctx.lineWidth = 2.5;
                for (let i = 0; i < 4; i++) {
                    const offset = i * 8;
                    ctx.beginPath();
                    ctx.moveTo(m.x + 12, m.y + 12 + offset);
                    ctx.lineTo(m.x - 8, m.y + 8 + offset + (i % 2 === 0 ? legWiggle : -legWiggle));
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(m.x + m.width - 12, m.y + 12 + offset);
                    ctx.lineTo(m.x + m.width + 8, m.y + 8 + offset + (i % 2 === 0 ? -legWiggle : legWiggle));
                    ctx.stroke();
                }

                ctx.fillStyle = '#311b92';
                ctx.beginPath();
                ctx.arc(m.x + m.width / 2, m.y + m.height / 2 + 5, 14, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#4a148c';
                ctx.beginPath();
                ctx.arc(m.x + m.width / 2, m.y + 14, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ff1744';
                ctx.fillRect(m.x + m.width / 2 - 6, m.y + 10, 3, 3);
                ctx.fillRect(m.x + m.width / 2 + 3, m.y + 10, 3, 3);
                ctx.fillRect(m.x + m.width / 2 - 3, m.y + 13, 2, 2);
                ctx.fillRect(m.x + m.width / 2 + 1, m.y + 13, 2, 2);

                ctx.fillStyle = '#00e676';
                ctx.fillRect(m.x + m.width / 2 - 4, m.y + 18, 2, 4);
                ctx.fillRect(m.x + m.width / 2 + 2, m.y + 18, 2, 4);
                ctx.restore();
            }

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(m.x, m.y - 10, m.width, 5);
            ctx.fillStyle = '#ff4d4d';
            ctx.fillRect(m.x, m.y - 10, m.width * (m.hp / m.maxHp), 5);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px DungGeunMo';
            ctx.fillText(m.name, m.x, m.y - 14);
        });

        // 4. 플레이어 그리기 (칼을 든 모험가)
        ctx.save();

        ctx.fillStyle = '#2980b9';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(player.x + 4, player.y + 12, player.width - 8, player.height - 12, 5);
        else ctx.rect(player.x + 4, player.y + 12, player.width - 8, player.height - 12);
        ctx.fill();

        ctx.fillStyle = '#795548';
        ctx.fillRect(player.x + 6, player.y + player.height - 8, 8, 8);
        ctx.fillRect(player.x + player.width - 14, player.y + player.height - 8, 8, 8);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(player.x + 6, player.y + 22, player.width - 12, 3);

        ctx.fillStyle = '#d35400';
        ctx.fillRect(player.x + 6, player.y + 2, player.width - 12, 10);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(player.x + 4, player.y + 6, player.width - 8, 3);

        ctx.fillStyle = '#ffeaa7';
        ctx.fillRect(player.x + 8, player.y + 9, player.width - 16, 7);

        ctx.fillStyle = '#000000';
        if (player.facing === 'left') {
            ctx.fillRect(player.x + 9, player.y + 11, 3, 3);
            ctx.fillRect(player.x + 17, player.y + 11, 3, 3);
        } else if (player.facing === 'right') {
            ctx.fillRect(player.x + 14, player.y + 11, 3, 3);
            ctx.fillRect(player.x + 22, player.y + 11, 3, 3);
        } else if (player.facing === 'up') {
        } else {
            ctx.fillRect(player.x + 11, player.y + 11, 3, 3);
            ctx.fillRect(player.x + 20, player.y + 11, 3, 3);
        }

        ctx.save();
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = player.isAttacking ? 15 : 4;

        if (player.facing === 'left') {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(player.x - 14, player.y + 14, 16, 4);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(player.x + 2, player.y + 12, 3, 8);
        } else if (player.facing === 'right') {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(player.x + player.width - 2, player.y + 14, 16, 4);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(player.x + player.width - 5, player.y + 12, 3, 8);
        } else if (player.facing === 'up') {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(player.x + player.width - 6, player.y - 12, 4, 18);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(player.x + player.width - 8, player.y + 6, 8, 3);
        } else {
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(player.x + player.width - 4, player.y + 10, 4, 20);
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(player.x + player.width - 6, player.y + 10, 8, 3);
        }
        ctx.restore();

        if (player.isAttacking) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 230, 0, 0.28)';
            ctx.strokeStyle = '#ffe600';
            ctx.lineWidth = 3;
            ctx.fillRect(player.attackBox.x, player.attackBox.y, player.attackBox.width, player.attackBox.height);
            ctx.strokeRect(player.attackBox.x, player.attackBox.y, player.attackBox.width, player.attackBox.height);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();

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

        sound.playZoneBGM('TOWN');

        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        victoryScreen.classList.add('hidden');
        bossHud.classList.add('hidden');
        gameUI.classList.remove('hidden');
    }

    // 게임 오버 처리
    function handleGameOver() {
        gameState = 'GAMEOVER';
        sound.playPlayerDeath();
        gameUI.classList.add('hidden');
        bossHud.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    }

    // 게임 승리 처리
    function handleVictory() {
        gameState = 'VICTORY';
        sound.stopBGM();
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
