// DOM references
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreTxt = document.getElementById("score");
const messageTxt = document.getElementById("gameOverMessage");

// Dimensions
const width = canvas.width;
const height = canvas.height;

// Game logic
const lanes = [94, 190, 286, 382]; // 4 lanes (y coordinate for cookie center)
let playerLane = 1; // Right now: Lane #1
let playerY = lanes[playerLane];
const laneCount = lanes.length;

// Cookie (player) properties
const cookie = {
    x: 60,
    y: playerY,
    r: 28,
    crumbs: [
        {ox:-13,oy:-8,rs:6},
        {ox:13,oy:12,rs:8},
        {ox:-11,oy:13,rs:4},
        {ox:10,oy:-15,rs:5}
    ],
    color: "#dfa860"
};

// Monster (chaser)
const monster = {
    x: 5,
    y: height / 2,
    r: 32,
    color: "#63AC37",
    catching: false,
    frame: 0
}

// Obstacles
const obsTypes = [
    { color: "#393931", stink: true }, // with stink
    { color: "#4b493e", stink: false } // normal
];
const obstacles = [];
const obsW = 32, obsH = 36, obsSpeed = 5;
const maxStinkParticles = 14;
const stinkParticles = []; // each {x, y, r, vx, vy, alpha}

// Game State
let score = 0;
let gameOver = false;

// Spawn obstacles periodically
let obstacleTimer = 0, obstacleInterval = 54;

// KEYBOARD INPUT
window.addEventListener("keydown", function(e) {
    if (gameOver) return;
    if (e.key === "ArrowUp" && playerLane > 0) {
        playerLane--; // Move cookie up
    }
    if (e.key === "ArrowDown" && playerLane < laneCount-1) {
        playerLane++; // Move cookie down
    }
});
 
// RESTART handler
canvas.addEventListener('click', () => {
    if (gameOver) resetGame();
});

// Game loop
function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Update main game state
function update() {
    // Move cookie
    playerY += (lanes[playerLane] - playerY) * 0.22;

    // Move monster towards cookie in its lane, but always behind
    monster.y += (playerY - monster.y) * 0.12; // "chase" effect
    monster.x += ((cookie.x - 50) - monster.x) * 0.08;

    // Spawn obstacles at intervals
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
        obstacleTimer = 0;
        let t = Math.random() < 0.7 ? 0 : 1; // more stinky ones!
        let l = Math.floor(Math.random() * laneCount);
        obstacles.push({ x: width + 20, y: lanes[l] - obsH / 2, w: obsW, h: obsH, type: t, lane: l, counted: false });
    }

    // Move obstacles
    for (let i = obstacles.length-1; i >=0; i--) {
        obstacles[i].x -= obsSpeed;
        if (obstacles[i].type === 0) { // Stinky obstacle
            // Emit stink particles near obstacle
            if (Math.random() < 0.26 && stinkParticles.length < maxStinkParticles) {
                stinkParticles.push({
                    x: obstacles[i].x + obsW/1.35,
                    y: obstacles[i].y + obsH/2,
                    r: 7 + Math.random()*3.5,
                    vx: (Math.random()-0.5) * 1.8,
                    vy: (Math.random() - 0.8) * 2.9,
                    alpha: 0.75 + Math.random()* 0.17
                });
            }
        }
        // Remove offscreen
        if (obstacles[i].x < -obsW) obstacles.splice(i,1);
    }

    // Move and fade stink particles
    for (let i = stinkParticles.length-1; i >=0; i--) {
        let p = stinkParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= 0.965; // fade
        p.r *= 0.98; // shrink
        if (p.alpha < 0.12) stinkParticles.splice(i,1);
    }

    // Collision: Cookie with obstacles
    for (const obs of obstacles) {
        let dx = (cookie.x + cookie.r/2) - (obs.x + obsW/2);
        let dy = (playerY) - (obs.y + obsH/2);
        if (Math.abs(dx) < cookie.r + obsW/2 - 6 
         && Math.abs(dy) < cookie.r + obsH/2 - 11) {
            gameOver = true;
            messageTxt.textContent = "COOKIE has touched stink! The monster eats you!";
            monster.catching = true;
            break;
        }
    }

    // Check monster proximity (if cookie lags back, or gets near monster!)
    if ((cookie.x - monster.x < monster.r+cookie.r-3) &&
        Math.abs(monster.y - playerY) < monster.r/2 + cookie.r/2 + 12) {
        gameOver = true;
        messageTxt.textContent = "Monster caught your cookie!";
        monster.catching = true;
    }

    // Score with distance
    score += 1;
    scoreTxt.textContent = "Score: " + score;
}

// Draw game
function draw() {
    ctx.clearRect(0,0,width, height);

    // Draw lanes
    for (let i = 0; i < laneCount; i++) {
        ctx.save();
        ctx.strokeStyle = 'rgba(80,55,11,0.33)';
        ctx.beginPath();
        ctx.moveTo(0, lanes[i]);
        ctx.lineTo(width, lanes[i]);
        ctx.setLineDash([14, 15]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    // Monster
    ctx.save();
    // Glow
    ctx.shadowColor = "#64ff4160";
    ctx.shadowBlur = monster.catching ? 30 : 8;
    ctx.fillStyle = monster.color;
    ctx.beginPath();
    ctx.arc(monster.x, monster.y, monster.r, 0, Math.PI*2);
    ctx.fill();

    // Face
    ctx.beginPath();
    ctx.arc(monster.x, monster.y+6, 19, Math.PI*1.03, Math.PI*1.93, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#273516";
    ctx.stroke();

    // Eye stalks
    ctx.beginPath();
    ctx.arc(monster.x-10, monster.y-10, 6 + Math.sin(monster.frame/7)*2, 0, Math.PI*2);
    ctx.arc(monster.x+11, monster.y-10, 6 + Math.cos(monster.frame / 8)*2, 0, Math.PI*2);
    ctx.fillStyle="#bbdf58";
    ctx.fill();

    // Pupils
    ctx.beginPath();
    ctx.arc(monster.x-10, monster.y-10, 2, 0, Math.PI*2);
    ctx.arc(monster.x+11, monster.y-10, 2, 0, Math.PI*2);
    ctx.fillStyle="#122b14";
    ctx.fill();

    ctx.restore();
    monster.frame++;

    // Cookie
    ctx.save();
    ctx.shadowColor = "#835d29dd";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cookie.x, playerY, cookie.r, 0, Math.PI*2);
    ctx.fillStyle = cookie.color;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Draw choco chips
    ctx.fillStyle = "#795035";
    ctx.beginPath();
    ctx.arc(cookie.x-13, playerY-13, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.arc(cookie.x+11, playerY+9, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.arc(cookie.x, playerY+13, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.arc(cookie.x+7, playerY-14, 5, 0, Math.PI*2); ctx.fill();

    // Cookie mouth/smile
    ctx.save();
    ctx.strokeStyle="#ab7f3d";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(cookie.x, playerY+9, 9.2, 0, Math.PI*0.9, false);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Obstacles
    for (const obs of obstacles) {
        ctx.save();
        ctx.fillStyle = obsTypes[obs.type].color;
        ctx.fillRect(obs.x, obs.y, obsW, obsH);
        // Green "stink"
        if (obsTypes[obs.type].stink) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#98fa698c";
            ctx.beginPath();
            ctx.arc(obs.x+obsW/1.5, obs.y+obsH/2, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }

    // Stink particles
    ctx.save();
    for (let p of stinkParticles) {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = "#90ff57aa";
        ctx.fill();
    }
    ctx.restore();
}
// Reset game state for restart
function resetGame() {
    playerLane = 1;
    playerY = lanes[playerLane];
    score = 0;
    gameOver = false;
    monster.x = 5;
    monster.y = height/2;
    monster.catching = false;
    obstacles.length = 0;
    stinkParticles.length = 0;
    obstacleTimer = 0;
    messageTxt.textContent = "";
    gameLoop();
}

// Start!
gameLoop();
