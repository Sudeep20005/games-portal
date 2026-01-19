/*
 * Space Voyager
 * Version: Vertical Micro (Stable & Fixed)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const startBtn = document.getElementById('start-btn');

// Assets
const playerImg = new Image();
playerImg.src = 'assets/player_ship.png';
const bossImg = new Image();
bossImg.src = 'assets/boss_ship.png';

// Game State
let gameRunning = false;
let score = 0;
let highScore = 0;
let lastTime = 0;
let gameOver = false;
let bossActive = false;
let bossDefeated = false;

// Entities
let projectiles = [];
let enemies = [];
let powerups = [];
let boss = null;
let particles = [];

// Timers
let lastShotTime = 0;
let fireRate = 200;
let baseFireRate = 200;
let enemySpawnTimer = 0;
let enemySpawnRate = 1000;
let difficultyMultiplier = 1;

// Player Setup
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 20, // Micro
    height: 30,
    color: '#00E5FF',
    widthHalf: 10,
    heightHalf: 15,
    hp: 1,
    shield: false,
    weaponLevel: 1
};

// Input Handling
canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;

    // Clamp
    if (mouseX < player.widthHalf) mouseX = player.widthHalf;
    if (mouseX > canvas.width - player.widthHalf) mouseX = canvas.width - player.widthHalf;
    if (mouseY < player.heightHalf) mouseY = player.heightHalf;
    if (mouseY > canvas.height - player.heightHalf) mouseY = canvas.height - player.heightHalf;

    player.x = mouseX;
    player.y = mouseY;
});

// --- Classes ---

class Projectile {
    constructor(x, y, dx = 0, dy = -1) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 20;
        this.speed = 12;
        this.dx = dx;
        this.dy = dy;
        this.color = '#F538FF';
        this.markedForDeletion = false;
        this.isEnemy = false;
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        if (this.y < 0 || this.y > canvas.height) this.markedForDeletion = true;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.shadowBlur = 10;
        context.shadowColor = this.color;
        context.save();
        context.translate(this.x, this.y);
        context.rotate(Math.atan2(this.dx, -this.dy));
        context.fillRect(-this.width / 2, 0, this.width, this.height);
        context.restore();
        context.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1.0;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY; this.life -= 0.05;
    }
    draw(context) {
        context.globalAlpha = this.life;
        context.fillStyle = this.color;
        context.beginPath(); context.arc(this.x, this.y, this.size, 0, Math.PI * 2); context.fill();
        context.globalAlpha = 1.0;
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        this.width = 30;
        this.height = 30; // Fixed: Added height!
        this.speed = 3;
        this.markedForDeletion = false;
        this.color = type === 'spread' ? '#FFFF00' : (type === 'shield' ? '#00FF00' : (type === 'rapid' ? '#00FFFF' : '#FF0000'));
    }
    update() { this.y += this.speed; if (this.y > canvas.height) this.markedForDeletion = true; }
    draw(context) {
        context.fillStyle = this.color;
        context.shadowBlur = 20; context.shadowColor = this.color;
        context.beginPath();
        context.arc(this.x, this.y + this.height / 2, 15, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#000'; context.font = 'bold 16px Arial'; context.textAlign = 'center';
        context.fillText(this.type === 'spread' ? 'S' : (this.type === 'shield' ? 'H' : (this.type === 'rapid' ? 'R' : 'B')), this.x, this.y + 6 + this.height / 2);
        context.shadowBlur = 0;
    }
}

class Enemy {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth; this.gameHeight = gameHeight;
        this.markedForDeletion = false;

        const rand = Math.random();
        if (rand < 0.6) this.type = 'basic';
        else if (rand < 0.8) this.type = 'speedster';
        else if (rand < 0.95) this.type = 'tank';
        else this.type = 'wavy';

        // Tuned Speeds: Slower start
        if (this.type === 'basic') {
            this.width = 20; this.height = 20; this.speed = 1.5; this.hp = 1; this.color = '#FF0D72'; this.scoreVal = 100;
        } else if (this.type === 'speedster') {
            this.width = 15; this.height = 15; this.speed = 4; this.hp = 1; this.color = '#FFA500'; this.scoreVal = 150;
        } else if (this.type === 'tank') {
            this.width = 40; this.height = 40; this.speed = 0.8; this.hp = 5; this.color = '#0DFF72'; this.scoreVal = 300;
        } else if (this.type === 'wavy') {
            this.width = 20; this.height = 20; this.speed = 2; this.hp = 2; this.color = '#BE0DFF'; this.scoreVal = 200;
        }

        this.x = Math.random() * (this.gameWidth - this.width) + this.width / 2;
        this.y = -this.height;
        this.angle = 0;

        // Difficulty Scaling
        this.speed *= difficultyMultiplier;
    }

    update() {
        if (this.type === 'wavy') {
            this.y += this.speed; this.x += Math.sin(this.angle) * 5; this.angle += 0.1;
            if (this.x < 0) this.x = 0; if (this.x > this.gameWidth) this.x = this.gameWidth;
        } else {
            this.y += this.speed;
        }
        if (this.y > this.gameHeight) this.markedForDeletion = true;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.shadowBlur = 10; context.shadowColor = this.color;
        context.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        if (this.type === 'tank' && this.hp < 5) {
            context.fillStyle = 'white';
            context.fillRect(this.x - this.width / 2, this.y - 10, (this.width * (this.hp / 5)), 5);
        }
        context.shadowBlur = 0;
    }
}

class Boss {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth; this.gameHeight = gameHeight;
        this.width = 120; this.height = 60; // Micro Boss
        this.x = gameWidth / 2; this.y = -200; this.targetY = 100;
        this.speed = 2; this.hp = 100; this.maxHp = 100;
        this.color = '#FF0000'; this.markedForDeletion = false;
        this.state = 'entering'; this.moveDir = 1; this.shotTimer = 0;
    }

    update(deltaTime) {
        if (this.state === 'entering') {
            this.y += this.speed;
            if (this.y >= this.targetY) { this.y = this.targetY; this.state = 'engaging'; }
        } else if (this.state === 'engaging') {
            this.x += this.speed * this.moveDir;
            if (this.x > this.gameWidth - this.width / 2 || this.x < this.width / 2) this.moveDir *= -1;
            this.shotTimer += deltaTime;
            if (this.shotTimer > 800) { this.fire(); this.shotTimer = 0; }
        }
    }

    fire() {
        let hpPercent = this.hp / this.maxHp;

        if (hpPercent > 0.6) {
            // Phase 1: Spread
            let offsets = [-50, 0, 50];
            offsets.forEach(off => {
                let p = new Projectile(this.x + off, this.y + this.height, 0, 1);
                p.color = '#FF5555'; p.speed = 8; p.isEnemy = true;
                projectiles.push(p);
            });
        } else if (hpPercent > 0.3) {
            // Phase 2: Gatling
            let p = new Projectile(this.x + (Math.random() * 40 - 20), this.y + this.height, 0, 1.2);
            p.color = '#FFAA00'; p.speed = 10; p.isEnemy = true;
            projectiles.push(p);
            setTimeout(() => {
                let p2 = new Projectile(this.x + (Math.random() * 40 - 20), this.y + this.height, 0, 1.2);
                p2.color = '#FFAA00'; p2.speed = 10; p2.isEnemy = true;
                projectiles.push(p2);
            }, 100);
        } else {
            // Phase 3: Chaos
            for (let i = 0; i < 8; i++) {
                let angle = (i / 8) * Math.PI * 2;
                let p = new Projectile(this.x, this.y + this.height / 2, Math.cos(angle), Math.sin(angle));
                p.color = '#FF0000'; p.speed = 6; p.isEnemy = true;
                projectiles.push(p);
            }
        }
    }

    draw(context) {
        if (bossImg.complete && bossImg.naturalWidth > 0) {
            context.save();
            context.shadowBlur = 20; context.shadowColor = 'red';
            context.drawImage(bossImg, this.x - this.width / 2, this.y, this.width, this.height);
            context.restore();
        } else {
            context.fillStyle = this.color;
            context.shadowBlur = 30; context.shadowColor = 'red';
            context.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
            context.shadowBlur = 0;
        }
        context.fillStyle = '#555'; context.fillRect(this.x - this.width / 2, this.y - 20, this.width, 10);
        context.fillStyle = '#0f0'; context.fillRect(this.x - this.width / 2, this.y - 20, this.width * (this.hp / this.maxHp), 10);
    }
}

function checkRectCollision(e1, e2) {
    const l1 = e1.x - e1.width / 2; const r1 = e1.x + e1.width / 2; const t1 = e1.y; const b1 = e1.y + e1.height;
    const l2 = e2.x - e2.width / 2; const r2 = e2.x + e2.width / 2;
    let t2 = e2.y; let b2 = e2.y + e2.height;
    return (l1 < r2 && r1 > l2 && t1 < b2 && b1 > t2);
}

function update(timestamp) {
    if (!gameRunning || gameOver) return;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    difficultyMultiplier = 1 + (score / 3000);

    // Auto Fire
    if (timestamp - lastShotTime > fireRate) {
        if (player.weaponLevel === 1) projectiles.push(new Projectile(player.x, player.y));
        else {
            projectiles.push(new Projectile(player.x, player.y, 0, -1));
            projectiles.push(new Projectile(player.x, player.y, -0.3, -1));
            projectiles.push(new Projectile(player.x, player.y, 0.3, -1));
        }
        lastShotTime = timestamp;
    }

    // Spawn
    if (bossActive) {
        if (boss) boss.update(deltaTime);
        if (boss && boss.hp <= 0) {
            createExplosion(boss.x, boss.y + boss.height / 2, 'red', 50);
            boss = null; bossActive = false; bossDefeated = true;
            score += 5000; scoreEl.innerText = score; enemySpawnRate = 800;
        }
    } else {
        if (score > 2000 && !bossDefeated) {
            bossActive = true; boss = new Boss(canvas.width, canvas.height);
        } else {
            enemySpawnTimer += deltaTime;
            if (enemySpawnTimer > enemySpawnRate) {
                enemies.push(new Enemy(canvas.width, canvas.height));
                enemySpawnTimer = 0;
                if (enemySpawnRate > 300) enemySpawnRate -= 5;
            }
        }
    }

    // Updates
    projectiles.forEach(p => p.update());
    enemies.forEach(e => e.update());
    powerups.forEach(p => p.update());
    particles.forEach(p => p.update());

    projectiles = projectiles.filter(p => !p.markedForDeletion);
    enemies = enemies.filter(e => !e.markedForDeletion);
    powerups = powerups.filter(p => !p.markedForDeletion);
    particles = particles.filter(p => p.life > 0);

    // Collisions
    projectiles.forEach(p => {
        if (p.markedForDeletion) return;
        if (p.isEnemy) {
            if (checkRectCollision(p, player)) {
                if (player.shield) { player.shield = false; p.markedForDeletion = true; }
                else endGame();
            }
        } else {
            enemies.forEach(e => {
                if (!e.markedForDeletion && checkRectCollision(p, e)) {
                    p.markedForDeletion = true; e.hp--;
                    if (e.hp <= 0) {
                        e.markedForDeletion = true; score += e.scoreVal; scoreEl.innerText = score;
                        createExplosion(e.x, e.y + e.height / 2, e.color, 10);
                        if (Math.random() < 0.1) {
                            let types = ['spread', 'shield', 'rapid', 'bomb'];
                            powerups.push(new PowerUp(e.x, e.y, types[Math.floor(Math.random() * types.length)]));
                        }
                    } else createExplosion(p.x, p.y, 'white', 2);
                }
            });
            if (boss && !p.isEnemy && checkRectCollision(p, boss)) {
                p.markedForDeletion = true; boss.hp--; createExplosion(p.x, p.y, 'orange', 3);
            }
        }
    });

    enemies.forEach(e => {
        if (!e.markedForDeletion && checkRectCollision(e, player)) {
            if (player.shield) { player.shield = false; e.markedForDeletion = true; createExplosion(e.x, e.y, 'white', 20); }
            else endGame();
        }
    });

    powerups.forEach(p => {
        if (!p.markedForDeletion && checkRectCollision(p, player)) {
            p.markedForDeletion = true;
            if (p.type === 'spread') { player.weaponLevel = 2; setTimeout(() => { player.weaponLevel = 1; }, 10000); }
            else if (p.type === 'shield') player.shield = true;
            else if (p.type === 'rapid') { fireRate = 100; setTimeout(() => { fireRate = baseFireRate; }, 5000); }
            else if (p.type === 'bomb') {
                enemies.forEach(e => { e.markedForDeletion = true; createExplosion(e.x, e.y, 'white', 20); score += 50; });
                scoreEl.innerText = score;
                ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    });

    draw();
    requestAnimationFrame(update);
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function draw() {
    ctx.fillStyle = '#0b0b1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (player.shield) {
        ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.arc(player.x, player.y + player.heightHalf, 40, 0, Math.PI * 2); ctx.stroke();
    }

    if (playerImg.complete && playerImg.naturalWidth > 0) {
        ctx.shadowBlur = 15; ctx.shadowColor = player.color;
        ctx.drawImage(playerImg, player.x - player.widthHalf, player.y, player.width, player.height);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x - player.widthHalf, player.y, player.width, player.height);
    }

    powerups.forEach(p => p.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    if (boss) boss.draw(ctx);
    particles.forEach(p => p.draw(ctx));
}

function endGame() {
    gameOver = true;
    startBtn.innerText = "Re-Engage";
    startBtn.style.background = "linear-gradient(135deg, #FF0D72 0%, #F538FF 100%)";
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px Montserrat'; ctx.textAlign = 'center';
    ctx.fillText("MISSION FAILED", canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Montserrat';
    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 50);
    if (score > highScore) { highScore = score; highScoreEl.innerText = highScore; }
}

function startGame() {
    gameRunning = true; gameOver = false; bossActive = false; bossDefeated = false; boss = null;
    score = 0; scoreEl.innerText = score;
    projectiles = []; enemies = []; powerups = []; particles = [];
    player.weaponLevel = 1; player.shield = false;
    player.x = canvas.width / 2; player.y = canvas.height - 100;
    enemySpawnTimer = 0; enemySpawnRate = 1000;
    lastTime = performance.now(); lastShotTime = 0;
    startBtn.innerText = "Mission Active";
    startBtn.style.background = "linear-gradient(135deg, #4A90E2 0%, #3B78D8 100%)";
    requestAnimationFrame(update);
}

startBtn.addEventListener('click', startGame);

// Init
ctx.fillStyle = '#0b0b1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#00E5FF'; ctx.font = '20px Montserrat'; ctx.textAlign = 'center';
ctx.fillText("System Restored. Press Start.", canvas.width / 2, canvas.height / 2);
