let gameOver = false;
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

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
    }console.log(value, colors[value])
}

const player = {
    pos: { x: 5, y: 0},
    matrix: null,
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
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
}


// "FPS".
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {

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
    player.matrix = createPiece(
        pieces[Math.floor(Math.random() * pieces.length)]
    );
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        gameOver = true;
    }
}


// Eliminar lineas completas (casilla !== 0).
function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer; // pasar a siguiente linea si alguna casilla es 0.
            }
        }
        // A este puunto, la fila esta completa.
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
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

playerReset();
update();