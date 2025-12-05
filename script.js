// Grab canvas and set up context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game variables
const gameWidth = canvas.width;
const gameHeight = canvas.height;

// Player properties
const player = {
    x: gameWidth / 2 - 15,
    y: gameHeight - 60,
    w: 30,
    h: 30,
    color: "#f0f0f0",
    speed: 6
};

// Monster properties
const monster = {
    x: gameWidth / 2 - 25,
    y: 25,
    w: 50,
    h: 50,
    color: "#62ab2c"
};

// Stinky Particle settings
const particles = [];
const particleMax = 40;
const particleColor = 'rgba(123,255,89,0.25)'; // greenish "stinky" particle

// Obstacles
const obstacles = [];
const obstacleWidth = 40;
const obstacleHeight = 15;
const obstacleColor = "#532828";
const obstacleSpeed = 3;

// Score and game state
let score = 0;
let gameOver = false;

// For controls
let moveLeft = false;
let moveRight = false;

// GAME LOOP
function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Update game logic
function update() {
    // Player Controls
    if (moveLeft) player.x -= player.speed;
    if (moveRight) player.x += player.speed;

    // Constrain player
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > gameWidth) player.x = gameWidth - player.w;

    // Monster loosely "follows" player x
    const monsterTargetX = player.x + player.w / 2 - monster.w / 2;
    monster.x += (monsterTargetX - monster.x) * 0.04;

    // Particle management (monster emits stinky particles)
    emitParticles();
    updateParticles();

    // Spawn obstacles randomly
    if (Math.random() < 0.018) {
        const x = Math.random() * (gameWidth - obstacleWidth);
        obstacles.push({
            x: x,
            y: -obstacleHeight,
            w: obstacleWidth,
            h: obstacleHeight
        });
    }

    // Move obstacles down
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += obstacleSpeed + (score / 50); // Gradual difficulty
        // Collision detection (with player)
        if (
            obstacles[i].x < player.x + player.w &&
            obstacles[i].x + obstacles[i].w > player.x &&
            obstacles[i].y < player.y + player.h &&
            obstacles[i].y + obstacles[i].h > player.y
        ) {
            // HIT!
            endGame();
        }
        // Remove off screen
        if (obstacles[i].y > gameHeight)
            obstacles.splice(i, 1);
    }

    // Monster catches player => game over
    if (
        monster.x < player.x + player.w &&
        monster.x + monster.w > player.x &&
        monster.y < player.y + player.h &&
        monster.y + monster.h > player.y
    ) {
        endGame();
    }

    // Increase score
    score += 1;
    document.getElementById("score").textContent = "Score: " + score;
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, gameWidth, gameHeight);

    // Draw monster
    ctx.save();
    ctx.shadowColor = "#54ce42";
    ctx.shadowBlur = 18;
    ctx.fillStyle = monster.color;
    ctx.beginPath();
    // Draw a scary monster head (circle-ish)
    ctx.arc(monster.x + monster.w/2, monster.y + monster.h/2, monster.w/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw monster eyes
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(monster.x + 16, monster.y + 24, 4, 0, Math.PI*2);
    ctx.arc(monster.x + 34, monster.y + 24, 4, 0, Math.PI*2);
    ctx.fill();

    // Draw player
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Draw a stick figure head
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + 7, 6, 0, Math.PI*2)
    ctx.fillStyle = "#bbbbad";
    ctx.fill();
    ctx.restore();

    // Draw obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obstacleColor;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        // Splatter
        ctx.fillStyle = "#611";
        ctx.fillRect(obs.x + 7, obs.y + 3, 10, 3);
    });

    // Draw stink particles
    ctx.save();
    particles.forEach(p => {
        ctx.globalAlpha = (p.alpha *= 0.97); // slowly fade
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = particleColor;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    ctx.restore();
}

// EMIT particles for monstrosity!
function emitParticles() {
    // About a few per frame
    for (let i = 0; i < 2; i++) {
        if (particles.length < particleMax) {
            particles.push({
                x: monster.x + monster.w/2 + (Math.random()-0.5)*18,
                y: monster.y + monster.h,
                size: 7 + Math.random()*6,
                vx: (Math.random() - 0.5) * 1.3,
                vy: Math.random()*2 + 1,
                alpha: 0.87
            });
        }
    }
}

// Animate stink particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        // Very slowly shrink/evaporate
        particles[i].size *= 0.98;
        // Remove faded particles
        if (particles[i].alpha <= 0.15 || particles[i].y > gameHeight + 35)
            particles.splice(i, 1);
    }
}

// End game
function endGame() {
    gameOver = true;
    document.getElementById("gameOverMessage").textContent = "You Got Caught! Game Over.";
}

// KEY LISTENERS
window.addEventListener("keydown", function(e) {
    if (e.code === "ArrowLeft") moveLeft = true;
    else if (e.code === "ArrowRight") moveRight = true;
});

window.addEventListener("keyup", function(e) {
    if (e.code === "ArrowLeft") moveLeft = false;
    else if (e.code === "ArrowRight") moveRight = false;
});

// RESTART (on click)
document.getElementById("gameCanvas").addEventListener("click", function(){
    if (gameOver) {
        resetGame();
    }
});

// RESET everything
function resetGame() {
    player.x = gameWidth / 2 - 15;
    score = 0;
    gameOver = false;
    obstacles.length = 0;
    particles.length = 0;
    monster.x = gameWidth / 2 - 25;
    document.getElementById("gameOverMessage").textContent = "";
    gameLoop();
}

// Start game!
gameLoop();
