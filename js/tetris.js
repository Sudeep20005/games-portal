/*
 * Tetris Game Logic - Refined
 * Theme: Classic Black Canvas, Colorful Blocks
 * Controls: Keyboard + Mouse Hard Drop
 */

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const gameOverOverlay = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');

// Logic: 10 columns, 15 rows. Block size = 40px. Canvas width = 400, Height = 600.
canvas.height = 600;
canvas.width = 400;
context.scale(40, 40);

// Colors
const colors = [
    null,
    '#FF0D72', // T - pinkish/purple
    '#0DC2FF', // I - cyan
    '#0DFF72', // S - green
    '#F538FF', // Z - purple/magenta
    '#FF8E0D', // L - orange
    '#FFE138', // O - yellow
    '#3877FF', // J - blue
];

// Re-map to bright standard colors for Black BG
const pieceColors = {
    'T': '#D500F9', // Purple
    'I': '#00E5FF', // Cyan
    'S': '#00E676', // Green
    'Z': '#FF1744', // Red
    'L': '#FF9100', // Orange
    'O': '#FFEA00', // Yellow
    'J': '#2979FF', // Blue
};

// --- Sound Placeholders ---
const sounds = {
    move: () => { }, // console.log('Sound: Move'),
    rotate: () => { }, // console.log('Sound: Rotate'),
    drop: () => { }, // console.log('Sound: Drop'),
    clear: () => { }, // console.log('Sound: Line Clear'),
    gameOver: () => { }, // console.log('Sound: Game Over')
};

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

// Map matrix values to colors
const colorMap = [
    null,
    pieceColors['I'],
    pieceColors['L'],
    pieceColors['J'],
    pieceColors['O'],
    pieceColors['Z'],
    pieceColors['S'],
    pieceColors['T']
];

function arenaSweep() {
    let rowCount = 1;
    let cleared = false;
    let linesCleared = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
        linesCleared++;
        cleared = true;
    }

    if (cleared) {
        sounds.clear();
        player.lines += linesCleared;
        // Level up each 5 lines for faster progression feeling
        const newLevel = Math.floor(player.lines / 5);
        if (newLevel > player.level) {
            player.level = newLevel;
            // Cap minimum speed at 100ms
            dropInterval = Math.max(100, 1000 - (player.level * 100));
        }
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                    arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Mouse Tracking & Direct Movement
canvas.addEventListener('mousemove', (e) => {
    if (isPaused || isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;

    // Scale 40px blocks
    const col = Math.floor(clickX / 40);

    // Logic from handleInput reuse here for real-time tracking
    const bounds = getMatrixBounds(player.matrix);
    const visibleWidth = bounds.max - bounds.min + 1;
    let newX = col - bounds.min - Math.floor(visibleWidth / 2);

    const minX = -bounds.min;
    const maxX = arena[0].length - bounds.max - 1;

    if (newX < minX) newX = minX;
    if (newX > maxX) newX = maxX;

    const oldX = player.pos.x;
    player.pos.x = newX;

    // Only allow move if valid (no collision)
    // If collision, revert (so it slides along the obstacle rather than clipping)
    if (collide(arena, player)) {
        player.pos.x = oldX;
    }

    // Also update mouseCol for ghost logic if needed, or ghost effectively overlaps player now
    // But ghost shows the DROP position, so still useful!
    mouseCol = col;
});

function draw() {
    // Clear to BLACK
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Background Grid
    context.strokeStyle = '#222';
    context.lineWidth = 0.05;
    for (let x = 0; x <= 10; x++) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, 15);
        context.stroke();
    }
    for (let y = 0; y <= 15; y++) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(10, y);
        context.stroke();
    }

    drawMatrix(arena, { x: 0, y: 0 });

    // Draw Hard Drop Ghost (Original location) - Optional, kept for keyboard users? 
    // Actually, let's keep the original ghost for keyboard/default pos, 
    // AND add the Mouse Ghost if mouse is active.

    // 1. Standard Ghost (Keyboard focus)
    const ghost = {
        pos: { ...player.pos },
        matrix: player.matrix
    };
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--;
    drawGhost(ghost, 'rgba(255, 255, 255, 0.1)'); // Faint

    // 2. Mouse Hover Ghost
    if (mouseCol >= 0) {
        const bounds = getMatrixBounds(player.matrix);
        // Correct centering: (content_width) / 2
        // We want the CLICKED column to be the center of the VISIBLE piece.
        // Visible width = bounds.max - bounds.min + 1.
        // Offset relative to matrix[0][0] = bounds.min.

        // logic:
        // matrix_x + bounds.min + (visible_width / 2) = target_col
        // matrix_x = target_col - bounds.min - (visible_width / 2)

        const visibleWidth = bounds.max - bounds.min + 1;
        let targetX = mouseCol - bounds.min - Math.floor(visibleWidth / 2);

        // Clamp so visible parts are inside [0, 10]
        // matrix_x + bounds.min >= 0  => matrix_x >= -bounds.min
        // matrix_x + bounds.max < 10  => matrix_x < 10 - bounds.max

        const minX = -bounds.min;
        const maxX = 10 - bounds.max - 1; // 10 is arena width

        if (targetX < minX) targetX = minX;
        if (targetX > maxX) targetX = maxX;

        const mouseGhost = {
            pos: { x: targetX, y: player.pos.y },
            matrix: player.matrix
        };

        if (!collide(arena, mouseGhost)) {
            while (!collide(arena, mouseGhost)) {
                mouseGhost.pos.y++;
            }
            mouseGhost.pos.y--;

            // Draw Glowing Ghost
            context.shadowBlur = 10;
            context.shadowColor = 'white';
            drawGhost(mouseGhost, 'rgba(255, 255, 255, 0.4)');
            context.shadowBlur = 0; // Reset
        }
    }

    drawMatrix(player.matrix, player.pos);
}

function drawGhost(ghost, color = 'rgba(255, 255, 255, 0.2)') {
    ghost.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = color; // Use fill for glow effect
                context.fillRect(x + ghost.pos.x, y + ghost.pos.y, 1, 1);
                context.strokeStyle = color;
                context.lineWidth = 0.05;
                context.strokeRect(x + ghost.pos.x, y + ghost.pos.y, 1, 1);
            }
        });
    });
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Main color
                context.fillStyle = colorMap[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);

                // Bevel/Shine for 3D effect
                context.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Highlight
                context.fillRect(x + offset.x, y + offset.y, 1, 0.1); // Top
                context.fillRect(x + offset.x, y + offset.y, 0.1, 1); // Left

                context.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Shadow
                context.fillRect(x + offset.x, y + offset.y + 0.9, 1, 0.1); // Bottom
                context.fillRect(x + offset.x + 0.9, y + offset.y, 0.1, 1); // Right
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        sounds.drop();
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// Hard Drop: instant merge
function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--; // Back one step valid
    merge(arena, player);
    sounds.drop();
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    } else {
        sounds.move();
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    const type = pieces[pieces.length * Math.random() | 0];
    player.matrix = createPiece(type);

    const typeToIndex = { 'I': 1, 'L': 2, 'J': 3, 'O': 4, 'Z': 5, 'S': 6, 'T': 7 };
    player.matrix.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val !== 0) player.matrix[y][x] = typeToIndex[type];
        });
    });

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        gameOver();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    sounds.rotate();
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;
let isGameOver = false;

function update(time = 0) {
    if (isPaused || isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    // Use the dynamic dropInterval
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.innerText = player.score;
}

function gameOver() {
    isGameOver = true;
    sounds.gameOver();
    finalScoreElement.innerText = player.score;
    gameOverOverlay.style.display = 'flex';
    startBtn.innerText = 'Start Game';
}

function resetGame() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    isGameOver = false;
    gameOverOverlay.style.display = 'none';
    playerReset();
    lastTime = performance.now();
    update();
}

function togglePause() {
    if (isGameOver) return;

    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? 'Resume' : 'Pause';

    if (isPaused) {
        // Draw pause overlay
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillRect(0, 0, 10, 20);
        context.fillStyle = '#fff';
        context.font = '1px Montserrat';
        context.fillText('PAUSED', 3, 10);
    } else {
        lastTime = performance.now();
        update();
    }
}

const arena = createMatrix(10, 15);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    lines: 0,
    level: 0,
};

// Controls
document.addEventListener('keydown', event => {
    if (isGameOver || isPaused) return;

    // Prevent default scrolling for arrows/space
    if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }

    if (event.keyCode === 37) { // Left
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        playerMove(1);
    } else if (event.keyCode === 40) { // Down
        playerDrop();
    } else if (event.keyCode === 38) { // Up (Rotate)
        // Disabled as per user request
        // playerRotate(1);
    } else if (event.keyCode === 32) { // Space (Hard Drop)
        playerHardDrop();
    }
});

// Helper: Get bounding box of visible blocks in matrix (columns)
function getMatrixBounds(matrix) {
    let minX = matrix[0].length;
    let maxX = -1;
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] !== 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
            }
        }
    }
    return { min: minX, max: maxX };
}

// Helper to handle input for both Mouse and Touch
function handleInput(clientX) {
    if (isPaused || isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; // Account for CSS scaling
    const clickX = (clientX - rect.left) * scaleX;

    // Grid size 40px
    const col = Math.floor(clickX / 40);

    const bounds = getMatrixBounds(player.matrix);
    const visibleWidth = bounds.max - bounds.min + 1;
    let newX = col - bounds.min - Math.floor(visibleWidth / 2);

    // Boundary checks allowing padding overhang
    const minX = -bounds.min;
    const maxX = arena[0].length - bounds.max - 1; // 10 is arena width

    if (newX < minX) newX = minX;
    if (newX > maxX) newX = maxX;

    const oldX = player.pos.x;
    player.pos.x = newX;

    // If collision (e.g. side of stack), revert
    if (collide(arena, player)) {
        player.pos.x = oldX;
    } else {
        // Valid teleport, drop it!
        playerHardDrop();
    }
}

// Mouse Controls: Click to Teleport & Hard Drop
canvas.addEventListener('mousedown', (e) => {
    handleInput(e.clientX);
});

// Touch Controls
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    // Use the first changed touch point
    if (e.changedTouches && e.changedTouches.length > 0) {
        handleInput(e.changedTouches[0].clientX);
    }
});

startBtn.addEventListener('click', resetGame);
pauseBtn.addEventListener('click', togglePause);

playerReset();
updateScore();
draw();
isPaused = true;
pauseBtn.innerText = "Resume";
// Initial draw for paused state
draw();
context.fillStyle = 'rgba(0,0,0,0.5)';
context.fillRect(0, 0, 10, 20);
context.fillStyle = '#fff';
context.font = '1px Montserrat';
context.fillText('PAUSED', 3, 10);
