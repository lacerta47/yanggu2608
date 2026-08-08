// 픽셀 RPG 게임 엔진 및 메인 스크립트

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('rpgCanvas');
    const ctx = canvas.getContext('2d');

    // UI 요소
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const victoryScreen = document.getElementById('victoryScreen');
    const dialogueOverlay = document.getElementById('dialogueOverlay');
    const gameUI = document.getElementById('gameUI');

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
    let currentZone = 'TOWN'; // 'TOWN', 'ZONE1', 'ZONE2', 'ZONE3'
    let targetClearGold = 200; // 게임 클리어 목표 골드

    // 플레이어 객체
    const player = {
        x: 480,
        y: 320,
        width: 32,
        height: 32,
        speed: 4,
        facing: 'down', // 'up', 'down', 'left', 'right'
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
        attackBox: { x: 0, y: 0, width: 40, height: 40 },
        inventory: {} // item_name: count
    };

    // 현재 활성화된 퀘스트
    let activeQuest = null; // { id, title, targetItem, targetCount, currentCount, rewardGold, npcId }

    // 키보드 조작
    const keys = {
        w: false,
        a: false,
        s: false,
        d: false
    };

    // 사운드 합성기 (Web Audio API)
    class SoundSynth {
        constructor() { this.ctx = null; }
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

        // 2. 완전 낮은 톤의 묵직한 중저음 칼날 공격 소리 (초저음 피치)
        playSwordSlash() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            // 초저음 묵직한 칼 베기 소리 (110Hz ~ 260Hz)
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(110, now);
            osc1.frequency.exponentialRampToValueAtTime(260, now + 0.05);
            osc1.frequency.exponentialRampToValueAtTime(65, now + 0.18);

            gain1.gain.setValueAtTime(0.5, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            // 서브 베이스 묵직한 타격 공명
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

        // 5. 몬스터 종류별 사슬/죽음 소리 (슬라임, 좀비, 스켈레톤, 오크, 거미)
        playMonsterDeath(monsterType) {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            if (monsterType === 'slime') {
                // 슬라임: 통 튀는 팝/블룹 소리
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(700, now + 0.08);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            } else if (monsterType === 'zombie') {
                // 좀비: 둔탁하게 꺾이는 그로울 소리
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.25);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            } else if (monsterType === 'skeleton') {
                // 스켈레톤: 뼈따귀 달그락 바스러지는 소리
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(400, now + 0.05);
                osc.frequency.setValueAtTime(900, now + 0.1);
                osc.frequency.setValueAtTime(200, now + 0.15);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            } else if (monsterType === 'orc') {
                // 오크: 묵직한 중저음 포효 소리
                osc.type = 'square';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);
                gain.gain.setValueAtTime(0.45, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            } else if (monsterType === 'spider') {
                // 거미: 날카로운 고음 진동 screech 소리
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
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

    // 플로팅 텍스트 (피해량, 전리품 획득 표시)
    let floatingTexts = [];
    function addFloatingText(text, x, y, color = '#ffffff') {
        floatingTexts.push({ text, x, y, color, alpha: 1, dy: -1 });
    }

    // 맵 및 오브젝트 데이터
    let houses = [];
    let trees = [];
    let npcs = [];
    let monsters = [];

    // 마을 배치 생성 (집 7~8개, 나무 3~4개, NPC들)
    function generateTownObjects() {
        houses = [];
        trees = [];
        npcs = [];

        // 집 7~8개 랜덤 생성
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

        // 나무 3~4개 랜덤 생성
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

        // 촌장, 모험 NPC 및 무기상 대장장이 추가 (죽지 않음)
        npcs = [
            { id: 'npc_slime', name: '촌장 장로', x: 240, y: 200, width: 32, height: 32, color: '#4169e1' },
            { id: 'npc_zombie', name: '경비대장 론', x: 480, y: 160, width: 32, height: 32, color: '#32cd32' },
            { id: 'npc_skeleton', name: '약초상 엘리', x: 720, y: 200, width: 32, height: 32, color: '#ff69b4' },
            { id: 'npc_boss', name: '용병왕 칼드', x: 480, y: 480, width: 32, height: 32, color: '#ff8c00' },
            { id: 'npc_weapon', name: '무기상 대장장이', x: 600, y: 350, width: 32, height: 32, color: '#e67e22', isWeaponShop: true }
        ];

        // 초기 NPC에 각각 개수가 다양한 랜덤 퀘스트 생성 바인딩
        npcs.forEach(npc => {
            npc.quest = generateRandomQuestForNPC(npc);
        });
    }

    // 몬스터 생성 (지역별)
    function spawnMonstersForZone(zone) {
        monsters = [];
        if (zone === 'TOWN') return;

        if (zone === 'ZONE1') {
            // 1지역: 슬라임 (체력 30~45, 공격력 5~8, 전리품: 슬라임볼, 쉬움)
            for (let i = 0; i < 7; i++) {
                monsters.push({
                    type: 'slime',
                    name: '슬라임',
                    x: 100 + Math.random() * 760,
                    y: 100 + Math.random() * 440,
                    width: 36,
                    height: 36,
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
            // 2지역: 좀비 & 스켈레톤 (체력 50~65, 공격력 10~18, 보통)
            for (let i = 0; i < 4; i++) {
                monsters.push({
                    type: 'zombie',
                    name: '좀비',
                    x: 100 + Math.random() * 760,
                    y: 100 + Math.random() * 440,
                    width: 34,
                    height: 38,
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
                    width: 32,
                    height: 36,
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
            // 3지역: 오크 & 거미 (체력 70~100, 공격력 20~30, 어려움)
            for (let i = 0; i < 3; i++) {
                monsters.push({
                    type: 'orc',
                    name: '오크',
                    x: 120 + Math.random() * 720,
                    y: 120 + Math.random() * 400,
                    width: 44,
                    height: 44,
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
                    width: 40,
                    height: 36,
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
        }
        monsters.forEach(m => m.hp = m.maxHp);
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
        if (e.button === 0) { // 좌클릭 공격
            performAttack();
        }
    });

    // 마우스 우클릭 (NPC 상호작용)
    canvas.addEventListener('mouseup', (e) => {
        if (gameState !== 'PLAYING') return;
        if (e.button === 2) { // 우클릭 상호작용
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
        player.attackTimer = 12; // 프레임 단위 공격 애니메이션
        sound.playSwordSlash(); // 칼 휘두르는 소리

        // 플레이어를 중심으로 4x4 크기(128x128px) 공격 범위 계산
        const attackSize = 128; // 4 * 32px
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

                if (m.hp <= 0) {
                    // 몬스터 처치! (종류별 사망 사운드 재생)
                    addLoot(m.loot);
                    addExp(m.exp);
                    addFloatingText(`+${m.loot}`, m.x, m.y - 15, '#ffcc00');
                    sound.playMonsterDeath(m.type);
                }
            }
        });
    }

    // 전리품 획득
    function addLoot(item) {
        if (!player.inventory[item]) player.inventory[item] = 0;
        player.inventory[item]++;

        // 진행 중인 퀘스트 카운트 업데이트
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
            player.hp = player.maxHp; // 풀 피 회복
            addFloatingText(`LEVEL UP! (LV.${player.level} HP+20)`, player.x, player.y - 30, '#00ff66');
            sound.playQuestClear();
        }
        updateUI();
    }

    // NPC 상호작용 (우클릭)
    let currentInteractingNPC = null;
    function interactWithNPC(mx, my) {
        if (currentZone !== 'TOWN') return;

        // 클릭 위치 근처 또는 플레이어 위치 근처의 NPC 탐색
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

        // 무기상 NPC 대화 처리
        if (npc.isWeaponShop) {
            const cost = 20 + player.atkUpgradeLevel * 15;
            npcText.textContent = `어서오게! 골드를 지불하고 무기를 강화해보게나! (현재 공격력: ${player.atk} | 강화 비용: ${cost}골드)`;
            btnAccept.textContent = '맞겨줘 (+5 ATK)';
            btnDecline.textContent = '다음에';
            btnAccept.onclick = () => upgradeWeapon(npc);
            btnDecline.onclick = closeDialogue;
            dialogueOverlay.classList.remove('hidden');
            return;
        }

        // 퀘스트 완료 조건 검사
        const q = npc.quest;
        const currentCount = player.inventory[q.targetItem] || 0;

        if (activeQuest && activeQuest.id === q.id && currentCount >= q.targetCount) {
            // 퀘스트 완료!
            npcText.textContent = `고마워! 약속대로 전리품을 가져와 주었구나! 보상으로 ${q.rewardGold}골드를 줄게!`;
            btnAccept.textContent = '보상 받기';
            btnDecline.textContent = '닫기';
            btnAccept.onclick = () => completeQuest(npc);
            btnDecline.onclick = closeDialogue;
        } else if (activeQuest && activeQuest.id === q.id) {
            // 진행 중
            npcText.textContent = `아직 ${q.targetItem}이(가) 부족하단다 (${currentCount}/${q.targetCount}). 힘내게!`;
            btnAccept.textContent = '확인';
            btnDecline.textContent = '포기하기';
            btnAccept.onclick = closeDialogue;
            btnDecline.onclick = () => { activeQuest = null; closeDialogue(); updateUI(); };
        } else {
            // 퀘스트 받기 요청
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
            title: q.title,
            targetItem: q.targetItem,
            targetCount: q.targetCount,
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

        if (npc.id === 'npc_slime') { // 1지역 늪 (슬라임)
            targetItem = '슬라임볼';
            rewardGold = 10 + targetCount * 2;
            title = `늪 슬라임 정벌 (1지역 늪)`;
            desc = `1지역 늪지대 슬라임의 슬라임볼 ${targetCount}개를 가져다주게나. - ${rewardGold}골드`;
        } else if (npc.id === 'npc_zombie' || npc.id === 'npc_skeleton') { // 2지역 숲 (좀비, 스켈레톤)
            const lootOptions = ['썩은 살점', '뼈'];
            targetItem = lootOptions[Math.floor(Math.random() * lootOptions.length)];
            rewardGold = 15 + targetCount * 2;
            title = `숲 ${targetItem} 수집 (2지역 숲)`;
            desc = `2지역 숲에서 몬스터의 ${targetItem} ${targetCount}개를 모아와주게. - ${rewardGold}골드`;
        } else { // 3지역 동굴 (오크, 거미)
            const lootOptions = ['오크의 살점', '거미 눈'];
            targetItem = lootOptions[Math.floor(Math.random() * lootOptions.length)];
            rewardGold = 25 + targetCount * 4;
            title = `동굴 ${targetItem} 토벌 (3지역 동굴)`;
            desc = `3지역 동굴에서 몬스터의 ${targetItem} ${targetCount}개를 사냥해오라! - ${rewardGold}골드`;
        }

        return {
            id: 'q_' + Math.random().toString(36).substr(2, 6),
            title: title,
            desc: desc,
            targetItem: targetItem,
            targetCount: targetCount,
            rewardGold: rewardGold
        };
    }

    // 무기상 공격력 강화 처리
    function upgradeWeapon(npc) {
        const cost = 20 + player.atkUpgradeLevel * 15;
        if (player.gold >= cost) {
            player.gold -= cost;
            player.atkUpgradeLevel++;
            player.atk += 5;
            sound.playLoot();
            addFloatingText(`무기 강화 성공! (공격력 ${player.atk})`, player.x, player.y - 25, '#ffe600');
            updateUI();
            openDialogue(npc);
        } else {
            addFloatingText(`골드가 부족합니다! (${cost}G 필요)`, player.x, player.y - 25, '#ff4d4d');
        }
    }

    // 퀘스트 완료 처리 (완료 시 새 랜덤 퀘스트로 갱신)
    function completeQuest(npc) {
        const q = npc.quest;
        player.inventory[q.targetItem] -= q.targetCount;
        player.gold += q.rewardGold;
        activeQuest = null;

        // 해당 NPC에게 새로운 랜덤 퀘스트(5개, 8개, 10개 등) 생성 부여
        npc.quest = generateRandomQuestForNPC(npc);

        sound.playQuestClear();
        closeDialogue();
        addFloatingText(`퀘스트 완료! +${q.rewardGold}G (새 퀘스트 도착!)`, player.x, player.y - 25, '#ffd700');

        // 게임 클리어 조건 검사 (200 골드 수집)
        if (player.gold >= targetClearGold) {
            handleVictory();
            return;
        }

        updateUI();
    }

    // UI 갱신
    function updateUI() {
        playerLevelText.textContent = player.level;
        if (playerAtkText) playerAtkText.textContent = player.atk;
        playerGoldText.textContent = player.gold;
        hpText.textContent = `${Math.max(0, player.hp)} / ${player.maxHp}`;
        hpFill.style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
        expText.textContent = `${player.exp} / ${player.nextExp}`;
        expFill.style.width = `${(player.exp / player.nextExp) * 100}%`;

        // 가방 항목 요약
        const invList = Object.entries(player.inventory)
            .filter(([_, count]) => count > 0)
            .map(([item, count]) => `${item} x${count}`)
            .join(' | ');
        invItems.textContent = invList || '비어있음';

        // 퀘스트 창 업데이트 (>퀘스트 목록)
        if (activeQuest) {
            const currentCount = player.inventory[activeQuest.targetItem] || 0;
            questList.innerHTML = `<div class="quest-item">- ${activeQuest.targetItem} ${activeQuest.targetCount}개 (${currentCount}/${activeQuest.targetCount})</div>`;
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

        // 대각선 이동 속도 보정
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        const nextX = player.x + dx;
        const nextY = player.y + dy;

        // 장애물 충돌 검사 (마을 내 집, 나무)
        let canMove = true;
        const nextRect = { x: nextX, y: nextY, width: player.width, height: player.height };

        if (currentZone === 'TOWN') {
            houses.forEach(h => { if (isColliding(nextRect, h)) canMove = false; });
            trees.forEach(t => { if (isColliding(nextRect, t)) canMove = false; });
        }

        if (canMove && (dx !== 0 || dy !== 0)) {
            player.x = nextX;
            player.y = nextY;

            // 이동 중일 때 지속적으로 발걸음 소리 재생
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
            if (player.x < 10) { transitionZone('ZONE1', canvas.width - 50, player.y); }
            else if (player.x > canvas.width - 40) { transitionZone('ZONE2', 40, player.y); }
            else if (player.y < 10) { transitionZone('ZONE3', player.x, canvas.height - 50); }
        } else {
            // 다른 지역에서 마을로 돌아오기
            if (currentZone === 'ZONE1' && player.x > canvas.width - 30) { transitionZone('TOWN', 40, player.y); }
            else if (currentZone === 'ZONE2' && player.x < 10) { transitionZone('TOWN', canvas.width - 50, player.y); }
            else if (currentZone === 'ZONE3' && player.y > canvas.height - 30) { transitionZone('TOWN', player.x, 40); }
        }

        // 이동 범위 제한 (화면 밖 이탈 방지)
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
            'ZONE3': '3지역: 어두운 동굴 (어려움)'
        };
        addFloatingText(`[입장] ${zoneNames[newZone]}`, canvas.width / 2 - 100, canvas.height / 2, '#70e0ff');
    }

    // 몬스터 AI 및 피해 처리
    function updateMonsters() {
        if (currentZone === 'TOWN') {
            monsters = [];
            return;
        }

        monsters.forEach(m => {
            if (m.hp <= 0) return;

            // 플레이어 추적
            const dist = Math.hypot(player.x - m.x, player.y - m.y);
            if (dist < 220) {
                const angle = Math.atan2(player.y - m.y, player.x - m.x);
                m.x += Math.cos(angle) * 1.5;
                m.y += Math.sin(angle) * 1.5;
            } else {
                m.x += m.dx;
                m.y += m.dy;
                if (m.x < 50 || m.x > canvas.width - 80) m.dx = -m.dx;
                if (m.y < 50 || m.y > canvas.height - 80) m.dy = -m.dy;
            }

            // 플레이어와 피격 충돌
            if (isColliding(player, m)) {
                player.hp -= m.atk * 0.05; // 프레임당 지속 대미지
                if (Math.random() < 0.1) {
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

    // 캔버스 그리기 함수 (2D 픽셀 렌더링)
    function draw() {
        // 1. 맵 배경 그리기 (늪, 숲, 동굴 스타일 반영)
        if (currentZone === 'TOWN') {
            ctx.fillStyle = '#3a693b'; // 평화로운 마을 풀밭
        } else if (currentZone === 'ZONE1') {
            ctx.fillStyle = '#1e3b2b'; // 1지역: 축축한 늪지대 (어두운 이끼 녹색)
        } else if (currentZone === 'ZONE2') {
            ctx.fillStyle = '#15421c'; // 2지역: 깊은 신비의 숲 (울창한 숲 녹색)
        } else {
            ctx.fillStyle = '#261e38'; // 3지역: 어두운 암석 동굴 (동굴 보라/암석색)
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 지역별 텍스처 무늬 그리기
        if (currentZone === 'ZONE1') {
            // 늪지대 물웅덩이 무늬
            ctx.fillStyle = 'rgba(0, 180, 150, 0.15)';
            ctx.beginPath(); ctx.arc(200, 180, 60, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(700, 420, 80, 0, Math.PI * 2); ctx.fill();
        } else if (currentZone === 'ZONE3') {
            // 동굴 암석 무늬
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(150, 100, 120, 90);
            ctx.fillRect(650, 350, 140, 100);
        }

        // 그리드 픽셀 라인 효과
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // 포탈 / 맵 출구 표시 (늪, 숲, 동굴)
        ctx.fillStyle = '#ffcc00';
        ctx.font = '16px DungGeunMo';
        if (currentZone === 'TOWN') {
            ctx.fillText('◀ 1지역 (늪)', 10, 320);
            ctx.fillText('2지역 (숲) ▶', canvas.width - 120, 320);
            ctx.fillText('▲ 3지역 (동굴)', 400, 25);
        } else {
            ctx.fillText('마을로 돌아가기 🚪', canvas.width / 2 - 60, canvas.height - 15);
        }

        // 2. 마을 구조물 (집, 나무) 그리기
        if (currentZone === 'TOWN') {
            // 집
            houses.forEach(h => {
                ctx.fillStyle = h.color;
                ctx.fillRect(h.x, h.y, h.width, h.height);
                // 지붕
                ctx.fillStyle = '#ff4d4d';
                ctx.beginPath();
                ctx.moveTo(h.x - 6, h.y);
                ctx.lineTo(h.x + h.width / 2, h.y - 30);
                ctx.lineTo(h.x + h.width + 6, h.y);
                ctx.fill();
                // 문
                ctx.fillStyle = '#4a2511';
                ctx.fillRect(h.x + h.width / 2 - 12, h.y + h.height - 30, 24, 30);
            });

            // 나무
            trees.forEach(t => {
                ctx.fillStyle = '#5c4033';
                ctx.fillRect(t.x + t.width / 2 - 6, t.y + 20, 12, t.height - 20);
                ctx.fillStyle = '#1e7b1e';
                ctx.beginPath();
                ctx.arc(t.x + t.width / 2, t.y + 18, 22, 0, Math.PI * 2);
                ctx.fill();
            });

            // NPC 그리기 (죽지 않는 NPC)
            npcs.forEach(npc => {
                ctx.fillStyle = npc.color;
                ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
                // 모자/헤어
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(npc.x + 4, npc.y - 6, 24, 8);
                // 이름 표시
                ctx.fillStyle = '#ffff00';
                ctx.font = '14px DungGeunMo';
                ctx.fillText(npc.name, npc.x - 10, npc.y - 12);
                // 우클릭 안내
                ctx.fillStyle = '#ffffff';
                ctx.fillText('[우클릭]', npc.x - 6, npc.y + npc.height + 16);
            });
        }

        // 3. 몬스터 그리기
        monsters.forEach(m => {
            if (m.hp <= 0) return;
            ctx.fillStyle = m.color;
            ctx.fillRect(m.x, m.y, m.width, m.height);

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
        ctx.fillStyle = '#00f3ff'; // 영웅 푸른 빛
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x + 6, player.y + 6, 6, 6); // 눈
        ctx.fillRect(player.x + 20, player.y + 6, 6, 6);

        // 칼 휘두르기 4x4 공격 범위 이펙트 (플레이어 중심)
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

        // 플레이어 초기화
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
        gameUI.classList.remove('hidden');
    }

    // 게임 오버 처리 (사망 효과음)
    function handleGameOver() {
        gameState = 'GAMEOVER';
        sound.playPlayerDeath();
        gameUI.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
    }

    // 게임 클리어 처리
    function handleVictory() {
        gameState = 'VICTORY';
        sound.playQuestClear();
        finalStatsText.textContent = `최종 획득 골드: ${player.gold}G | 레벨: LV.${player.level}`;
        gameUI.classList.add('hidden');
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
