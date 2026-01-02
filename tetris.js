let gameStarted = false;
let gameOver = false;
let score = 0;
let level = 1;
let linesCleared = 0;
let dropInterval = 1000;

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
nextContext.scale(20, 20); // misma escala que tu canvas principal

let nextPieceMatrix = null; // la pieza que viene después de la actual


document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameStarted || gameOver) {
        startGame();
    }
});


context.scale(20, 20);

// Colores piezas.
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

const arena = createMatrix(12, 20);

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    } 
    return matrix;
}

// Todas las posinles piezas.
function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ];
    }
    if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    }
    if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ]
    }
    if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ]
    }
    if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ]
    }
    if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ]
    }
    if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ]
    }
}

const player = {
    pos: { x: 5, y: 0},
    matrix: null,
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
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

    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }

    if (gameOver) {
        drawGameOver();
    }

    drawScore();
}


// "FPS".
let dropCounter = 0;
let lastTime = 0;

function update(time = 0) {

    if (!gameStarted) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!gameOver) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        } 
    }

    draw(); // siempre dibujar
    requestAnimationFrame(update);
}


// Controls.
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        player.pos.x--;
        if (collide(arena, player)) {
            player.pos.x++;
        }
    } 
    else if (event.key === 'ArrowRight') {
        player.pos.x++;
        if (collide(arena, player)) {
            player.pos.x--;
        }
    } 
    else if (event.key === 'ArrowDown') {
        playerDrop();
    }
    else if (event.key == 'ArrowUp') {
        playerRotate(1)
    }
});



// Colisiones.
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;

    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Fijar pieza al llegar al borde inferior.
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}


// Resetear player func.
function playerReset() {
    const pieces = 'TJLOSZI';

    // Si es la primera vez, crear la next piece
    if (!nextPieceMatrix) {
        nextPieceMatrix = createPiece(
            pieces[Math.floor(Math.random() * pieces.length)]
        );
    }

    // La pieza actual es la next
    player.matrix = nextPieceMatrix;

    // Generar la NUEVA next piece
    nextPieceMatrix = createPiece(
        pieces[Math.floor(Math.random() * pieces.length)]
    );

    player.pos.y = 0;
    player.pos.x =
        (arena[0].length / 2 | 0) -
        (player.matrix[0].length / 2 | 0);

    updateNext();

    if (collide(arena, player)) {
        gameOver = true;
    }
}

function updateNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPieceMatrix) return;

    const bounds = getPieceBounds(nextPieceMatrix);

    const canvasWidth = nextCanvas.width / 20;
    const canvasHeight = nextCanvas.height / 20;

    const offsetX = Math.floor(
        (canvasWidth - bounds.width) / 2 - bounds.minX
    );
    const offsetY = Math.floor(
        (canvasHeight - bounds.height) / 2 - bounds.minY
    );

    drawMatrix(
        nextPieceMatrix,
        { x: offsetX, y: offsetY },
        nextContext
    );
}

// Eliminar lineas completas (casilla !== 0).
function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer; // pasar a siguiente linea si alguna casilla es 0.
            }
        }
        // A este puunto, la fila esta completa.
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y++;

        rowCount++;
    }

    if (rowCount > 0) {
        score += 10 * rowCount * rowCount;

        linesCleared += rowCount;

        let newLevel = Math.floor(linesCleared / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval *= 0.8;
        }
    }
}

// Rotar piezas.
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ]
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}


// Evitar rotar en colisiones.
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


function playerDrop() {
    if (gameOver) return;

    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        arenaSweep();
        playerReset();
    }
    dropCounter = 0;
}


function drawGameOver() {
    context.save(); // Guardar escala.

    context.setTransform(1, 0, 0, 1, 0, 0); // Cancelar escala, temporal.
    

    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Texto
    context.fillStyle = 'white';
    context.font = '40px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

    context.restore();
}

function drawScore() {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);

    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.textAlign = 'left';
    context.fillText('Score:' + score, 10, 30);
    context.fillText('Level: ' + level, 10, 60);

    context.restore();

}

function startGame() {
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    linesCleared = 0;
    dropInterval = 1000; 
    lastTime = 0;
    gameOver = false;
    gameStarted = true;

    playerReset();
    update();
}

function getPieceBounds(matrix) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);       

            }
        })
    });

    return {
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        minX,
        minY
    };
}