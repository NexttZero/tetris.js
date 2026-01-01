const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);


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
}

const player = {
    pos: { x: 5, y: 0},
    matrix: createPiece('T'),
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'red';
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}


// "FPS".
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        player.pos.y++;
        dropCounter = 0
    } 

    draw()
    requestAnimationFrame(update)
}

update()

// Controls.
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        player.pos.x--;
    } else if (event.key === 'ArrowRight') {
        player.pos.x++;
    } else if (event.key === 'ArrowDown') {
        player.pos.y++;
    }
});