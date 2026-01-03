let gameStarted = false;
let gameOver = false;
let score = 0;
let level = 1;
let linesCleared = 0;
let dropInterval = 1000;

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
nextContext.scale(20, 20);

let nextPieceMatrix = null;

document.getElementById('startBtn').addEventListener('click', startGame);

// ================= COLORS =================
const colors = [
    null,
    'purple',
    'yellow',
    'orange',
    'blue',
    'cyan',
    'green',
    'red',
];

// ================= ARENA =================
function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

const arena = createMatrix(12, 20);

// ================= PIECES =================
function createPiece(type) {
    if (type === 'T') return [[0,1,0],[1,1,1],[0,0,0]];
    if (type === 'O') return [[2,2],[2,2]];
    if (type === 'L') return [[0,3,0],[0,3,0],[0,3,3]];
    if (type === 'J') return [[0,4,0],[0,4,0],[4,4,0]];
    if (type === 'I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
    if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
    if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

// ================= PLAYER =================
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
};

// ================= DRAW =================
function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    if (player.matrix) drawMatrix(player.matrix, player.pos);

    drawScore();
    if (gameOver) drawGameOver();
}

// ================= GAME LOOP =================
let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {
    if (!gameStarted) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!gameOver) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// ================= COLLISION =================
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;

    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// ================= MERGE =================
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

// ================= NEXT PIECE =================
function updateNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPieceMatrix) return;

    const offsetX = Math.floor((nextCanvas.width / 20 - nextPieceMatrix[0].length) / 2);
    const offsetY = Math.floor((nextCanvas.height / 20 - nextPieceMatrix.length) / 2);

    drawMatrix(nextPieceMatrix, { x: offsetX, y: offsetY }, nextContext);
}

// ================= RESET =================
function playerReset() {
    const pieces = 'TJLOSZI';

    if (!nextPieceMatrix) {
        nextPieceMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    }

    player.matrix = nextPieceMatrix;
    nextPieceMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

    updateNext();

    if (collide(arena, player)) gameOver = true;
}

// ================= SWEEP =================
function arenaSweep() {
    let rowCount = 0;

    outer: for (let y = arena.length - 1; y >= 0; y--) {
        for (let x = 0; x < arena[y].length; x++) {
            if (!arena[y][x]) continue outer;
        }

        arena.splice(y, 1);
        arena.unshift(new Array(arena[0].length).fill(0));
        rowCount++;
        y++;
    }

    if (rowCount) {
        score += rowCount * rowCount * 10;
        linesCleared += rowCount;

        const newLevel = Math.floor(linesCleared / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval *= 0.8;
        }
    }
}

// ================= ROTATION =================
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    dir > 0 ? matrix.forEach(row => row.reverse()) : matrix.reverse();
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
}

// ================= DROP =================
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        arenaSweep();
        playerReset();
    }
    dropCounter = 0;
}

// ================= UI =================
function drawScore() {
    context.save();
    context.setTransform(1,0,0,1,0,0);
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText(`Score: ${score}`, 10, 30);
    context.fillText(`Level: ${level}`, 10, 60);
    context.restore();
}

function drawGameOver() {
    context.save();
    context.setTransform(1,0,0,1,0,0);
    context.fillStyle = 'rgba(0,0,0,0.75)';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.fillStyle = 'white';
    context.font = '40px Arial';
    context.textAlign = 'center';
    context.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    context.restore();
}

// ================= START =================
function startGame() {
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000;
    gameOver = false;
    gameStarted = true;
    lastTime = 0;
    nextPieceMatrix = null;

    playerReset();
    update();
}

// ================= KEYBOARD =================
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') moveLeft();
    if (e.key === 'ArrowRight') moveRight();
    if (e.key === 'ArrowDown') playerDrop();
    if (e.key === 'ArrowUp') playerRotate(1);
});

// ================= TOUCH =================
function addInput(el, fn) {
    ['mousedown', 'touchstart'].forEach(evt => {
        el.addEventListener(evt, e => {
            e.preventDefault();
            fn();
        });
    });
}

function moveLeft() {
    player.pos.x--;
    if (collide(arena, player)) player.pos.x++;
}

function moveRight() {
    player.pos.x++;
    if (collide(arena, player)) player.pos.x--;
}

addInput(document.getElementById('leftBtn'), moveLeft);
addInput(document.getElementById('rightBtn'), moveRight);
addInput(document.getElementById('downBtn'), playerDrop);
addInput(document.getElementById('rotateBtn'), () => playerRotate(1));



