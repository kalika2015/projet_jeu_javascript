const X = 1300;
const Y = 650;
var vie = 3;


const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 600.0;
const LASER_MAX_SPEED = 300.0;
const LASER_COOLDOWN = 0.5;


const ENEMY_COOLDOWN = 5.0;

const GAME_STATE = {
    lastTime: Date.now(),
    leftPressed: false,
    rightPressed: false,
    spacePressed: false,
    playerX: 0,
    playerY: 0,
    playerCooldown: 0,
    lasers: [],
    enemies: [],
    enemyLasers: [],
    gameOver: false,
    explosion: []
};

function rectsIntersect(r1, r2) {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

function setPosition(el, x, y) {
    el.style.transform = `translate(${x}px, ${y}px)`;
}

function clamp(v, min, max) {
    if (v < min) {
        return min;
    } else if (v > max) {
        return max;
    } else {
        return v;
    }
}

function rand(min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1;
    return min + Math.random() * (max - min);
}

function createPlayer(container) {
    GAME_STATE.playerX = X / 2;
    GAME_STATE.playerY = Y - 50;
    const player = document.createElement("img");
    player.src = "img/player-1.png";
    player.className = "player";
    container.appendChild(player);
    setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function destroyPlayer(container, player) {
    container.removeChild(player);
    GAME_STATE.gameOver = true;
    const audio = new Audio("sound/sfx-lose.ogg");
    audio.play();
}

function updatePlayer(dt, container) {
    if (GAME_STATE.leftPressed) {
        GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
    }
    if (GAME_STATE.rightPressed) {
        GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
    }

    GAME_STATE.playerX = clamp(
        GAME_STATE.playerX,
        PLAYER_WIDTH,
        X - PLAYER_WIDTH
    );

    if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
        createLaser(container, GAME_STATE.playerX, GAME_STATE.playerY);
        GAME_STATE.playerCooldown = LASER_COOLDOWN;
    }
    if (GAME_STATE.playerCooldown > 0) {
        GAME_STATE.playerCooldown -= dt;
    }

    const player = document.querySelector(".player");
    setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function createLaser(container, x, y) {
    const element = document.createElement("img");
    element.src = "img/laser-blue-1.png";
    element.className = "laser";
    container.appendChild(element);
    const laser = { x, y, element };
    GAME_STATE.lasers.push(laser);
    const audio = new Audio("sound/sfx-laser1.ogg");
    audio.play();
    setPosition(element, x, y);
}

function updateLasers(dt, container) {
    const lasers = GAME_STATE.lasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y -= dt * LASER_MAX_SPEED;
        if (laser.y < 0) {
            destroyLaser(container, laser);
        }
        setPosition(laser.element, laser.x, laser.y);
        const r1 = laser.element.getBoundingClientRect();
        const enemies = GAME_STATE.enemies;
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.isDead) continue;
            const r2 = enemy.element.getBoundingClientRect();
            if (rectsIntersect(r1, r2)) {

                destroyEnemy(container, enemy);
                destroyLaser(container, laser);
                break;
            }
        }
    }
    GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}

function destroyLaser(container, laser) {
    container.removeChild(laser.element);
    laser.isDead = true;
}

function createEnemy(container, x, y) {
    const element = document.createElement("img");
    element.src = "img/enemy-1.png";
    element.className = "enemy";
    container.appendChild(element);
    const enemy = {
        x,
        y,
        cooldown: rand(0.5, ENEMY_COOLDOWN),
        element
    };
    GAME_STATE.enemies.push(enemy);
    setPosition(element, x, y);
}

function updateEnemies(dt, container) {
    const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 50;
    const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 10;

    const enemies = GAME_STATE.enemies;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const x = enemy.x + dx;
        const y = enemy.y + dy;
        setPosition(enemy.element, x, y);
        enemy.cooldown -= dt;
        if (enemy.cooldown <= 0) {
            createEnemyLaser(container, x, y);
            enemy.cooldown = ENEMY_COOLDOWN;
        }
    }
    GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function destroyEnemy(container, enemy) {
    container.removeChild(enemy.element);
    enemy.isDead = true;
}

function createEnemyLaser(container, x, y) {
    const element = document.createElement("img");
    element.src = "img/laser-green-1.png";
    element.className = "enemy-laser";
    container.appendChild(element);
    const laser = { x, y, element };
    GAME_STATE.enemyLasers.push(laser);
    setPosition(element, x, y);
}

function updateEnemyLasers(dt, container) {
    const lasers = GAME_STATE.enemyLasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y += dt * LASER_MAX_SPEED;
        if (laser.y > Y) {
            destroyLaser(container, laser);
        }
        setPosition(laser.element, laser.x, laser.y);
        const r1 = laser.element.getBoundingClientRect();
        const player = document.querySelector(".player");
        const r2 = player.getBoundingClientRect();
        if (rectsIntersect(r1, r2)) {
            // Player was hit
            if (vie === 0){
                destroyPlayer(container, player);
                break;
            }else {
                vie = vie - 1;
            }
        }
    }
    GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead);
}

function init() {
    const container = document.querySelector(".game");
    createPlayer(container);

    const enemySpacing = (X - 80 * 2) / (10 - 1);
    for (let j = 0; j < 2; j++) {
        const y = 50 + j * 80;
        for (let i = 0; i < 10; i++) {
            const x = i * enemySpacing + 80;
            createEnemy(container, x, y);
        }
    }
}

function playerHasWon() {
    return GAME_STATE.enemies.length === 0;
}

function update(e) {
    const currentTime = Date.now();
    const dt = (currentTime - GAME_STATE.lastTime) / 1000.0;

    if (GAME_STATE.gameOver) {
        document.querySelector(".game-over").style.display = "block";
        return;
    }

    if (playerHasWon()) {
        document.querySelector(".congratulations").style.display = "block";
        return;
    }

    const container = document.querySelector(".game");
    updatePlayer(dt, container);
    updateLasers(dt, container);
    updateEnemies(dt, container);
    updateEnemyLasers(dt, container);

    GAME_STATE.lastTime = currentTime;
    window.requestAnimationFrame(update);
}

function onKeyDown(e) {
    if (e.keyCode === 37) {
        GAME_STATE.leftPressed = true;
    } else if (e.keyCode === 39) {
        GAME_STATE.rightPressed = true;
    } else if (e.keyCode === 32) {
        GAME_STATE.spacePressed = true;
    }
}

function onKeyUp(e) {
    if (e.keyCode === 37) {
        GAME_STATE.leftPressed = false;
    } else if (e.keyCode === 39) {
        GAME_STATE.rightPressed = false;
    } else if (e.keyCode === 32) {
        GAME_STATE.spacePressed = false;
    }
}

document.querySelector("#health").innerHTML = vie;

init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);