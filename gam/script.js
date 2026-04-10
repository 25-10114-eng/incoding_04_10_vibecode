const COLS = 17;
const ROWS = 10;
const TIME_LIMIT = 120; // in seconds

let score = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let isPlaying = false;
let boardState = [];
let scoreReached100 = false;

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const selectionSumElem = document.getElementById('selectionSum');
const boardWrapper = document.querySelector('.board-wrapper');
const scoreDisplay = document.getElementById('scoreDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const restartBtn = document.getElementById('restartBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElem = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');
const teasingCharacter = document.getElementById('teasingCharacter');

// Interaction state
let isDragging = false;
let startR = -1;
let startC = -1;
let currR = -1;
let currC = -1;
let currentX = 0;
let currentY = 0;

function generateRandomAppleValue() {
    return Math.floor(Math.random() * 9) + 1;
}

function initGame() {
    score = 0;
    timeLeft = TIME_LIMIT;
    isPlaying = true;
    updateScore();
    updateTimerDisplay();
    clearInterval(timerInterval);
    gameOverModal.classList.add('hidden');
    teasingCharacter.classList.remove('active');
    scoreReached100 = false;
    
    gameBoard.innerHTML = '';
    boardState = [];
    
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            const val = generateRandomAppleValue();
            const cell = document.createElement('div');
            cell.className = 'apple';
            cell.dataset.val = val;
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.innerText = val;
            
            gameBoard.appendChild(cell);
            
            row.push({
                val: val,
                elem: cell,
                removed: false
            });
        }
        boardState.push(row);
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateScore() {
    scoreDisplay.innerText = score;
}

function updateTimerDisplay() {
    timerDisplay.innerText = timeLeft;
    if(timeLeft <= 10) {
        timerDisplay.style.color = 'var(--accent-red)';
    } else {
        timerDisplay.style.color = 'var(--text-primary)';
    }
}

function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    finalScoreElem.innerText = score;
    gameOverModal.classList.remove('hidden');
    selectionSumElem.classList.add('hidden');
}

boardWrapper.addEventListener('mousedown', handleDragStart);
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);

boardWrapper.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
    handleDragStart(e.touches[0]);
}, {passive: false});

document.addEventListener('touchmove', (e) => {
    if(!isDragging) return;
    if (e.cancelable) e.preventDefault();
    handleDragMove(e.touches[0]);
}, {passive: false});

document.addEventListener('touchend', (e) => {
    if(!isDragging) return;
    handleDragEnd(e.changedTouches[0]);
});

function getRelativeCoordinates(e) {
    const rect = boardWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
}

function getGridPosFromEvent(e) {
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    if (elem && elem.classList.contains('apple') && elem.dataset.r) {
        return {
            r: parseInt(elem.dataset.r),
            c: parseInt(elem.dataset.c)
        };
    }
    return null;
}

function handleDragStart(e) {
    if (!isPlaying) return;
    
    const pos = getGridPosFromEvent(e);
    if (!pos) return;

    isDragging = true;
    startR = pos.r;
    startC = pos.c;
    currR = pos.r;
    currC = pos.c;
    
    const coords = getRelativeCoordinates(e);
    currentX = coords.x;
    currentY = coords.y;
    
    updateFloatingTooltip();
    selectionSumElem.classList.remove('hidden');
    updateSelectedItems();
}

function handleDragMove(e) {
    if (!isDragging || !isPlaying) return;
    
    const coords = getRelativeCoordinates(e);
    currentX = coords.x;
    currentY = coords.y;
    
    const pos = getGridPosFromEvent(e);
    if (pos) {
        currR = pos.r;
        currC = pos.c;
    }
    
    updateFloatingTooltip();
    updateSelectedItems();
}

let teaseTimeout = null;
function showTeasingCharacter() {
    teasingCharacter.classList.add('active');
    
    const messages = ["메롱~ 너무 잘하잖아! 🤪", "오~ 제법인데?! 🍎", "더 빠르게 해보라구! 😈"];
    document.querySelector('.tease-bubble').innerText = messages[Math.floor(Math.random() * messages.length)];
    
    if (teaseTimeout) clearTimeout(teaseTimeout);
    teaseTimeout = setTimeout(() => {
        teasingCharacter.classList.remove('active');
    }, 2500); // 2.5 seconds to tease and disappear
}

function handleDragEnd(e) {
    if (!isDragging || !isPlaying) return;
    isDragging = false;
    
    selectionSumElem.classList.add('hidden');
    selectionSumElem.classList.remove('valid');
    
    const selectedApples = getSnappedLineApples(startR, startC, currR, currC);
    let sum = 0;
    let validSelection = true;
    
    selectedApples.forEach(({ r, c }) => {
        if (boardState[r][c].removed) validSelection = false;
        sum += boardState[r][c].val;
    });
    
    if (validSelection && sum === 10 && selectedApples.length > 0) {
        const count = selectedApples.length;
        
        selectedApples.forEach(({ r, c }) => {
            const appleInfo = boardState[r][c];
            if (!appleInfo.removed) {
                appleInfo.removed = true;
                appleInfo.elem.classList.add('popping');
                score += 1;
                
                setTimeout(() => {
                    appleInfo.elem.classList.remove('popping');
                    const newVal = generateRandomAppleValue();
                    appleInfo.val = newVal;
                    appleInfo.elem.dataset.val = newVal;
                    appleInfo.elem.innerText = newVal;
                    
                    appleInfo.elem.classList.add('appearing');
                    appleInfo.removed = false;
                    
                    setTimeout(() => {
                        appleInfo.elem.classList.remove('appearing');
                    }, 400);
                    
                }, 400);
            }
        });
        updateScore();
        
        if (score >= 100 && !scoreReached100) {
            scoreReached100 = true;
            score += 200;
            updateScore();
            
            // Full board refill effect
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const appleInfo = boardState[r][c];
                    const newVal = generateRandomAppleValue();
                    appleInfo.val = newVal;
                    appleInfo.elem.dataset.val = newVal;
                    appleInfo.elem.innerText = newVal;
                    appleInfo.removed = false;
                    appleInfo.elem.classList.remove('popping', 'empty');
                    appleInfo.elem.classList.add('appearing');
                    
                    setTimeout(() => {
                        appleInfo.elem.classList.remove('appearing');
                    }, 400);
                }
            }
            
            teasingCharacter.classList.add('active');
            document.querySelector('.tease-bubble').innerText = "100점 돌파!! 보너스 200점과 사과 리필!! 🎉🍎";
            if (teaseTimeout) clearTimeout(teaseTimeout);
            teaseTimeout = setTimeout(() => {
                teasingCharacter.classList.remove('active');
            }, 3000);
        } else if (count >= 3) {
            showTeasingCharacter();
        }
    }
    
    clearHighlights();
}

function updateFloatingTooltip() {
    selectionSumElem.style.left = `${currentX}px`;
    selectionSumElem.style.top = `${currentY}px`;
}

// Automatically snaps an end coordinate to the valid straight line (horizontal, vertical, diagonal)
function getSnappedLineApples(r1, c1, r2, c2) {
    if (r1 === -1 || c1 === -1 || r2 === -1 || c2 === -1) return [];
    
    const drRaw = r2 - r1;
    const dcRaw = c2 - c1;
    
    if (drRaw === 0 && dcRaw === 0) return [{r: r1, c: c1}];
    
    const absR = Math.abs(drRaw);
    const absC = Math.abs(dcRaw);
    
    let dr = drRaw;
    let dc = dcRaw;
    
    // Snap logic
    if (absR < absC / 2) {
        dr = 0; // horizontal
    } else if (absC < absR / 2) {
        dc = 0; // vertical
    } else {
        // diagonal
        const dist = Math.max(absR, absC);
        dr = dist * Math.sign(drRaw);
        dc = dist * Math.sign(dcRaw);
    }
    
    let stepR = dr === 0 ? 0 : Math.sign(dr);
    let stepC = dc === 0 ? 0 : Math.sign(dc);
    let steps = Math.max(Math.abs(dr), Math.abs(dc));
    
    let apples = [];
    for (let i = 0; i <= steps; i++) {
        let r = r1 + stepR * i;
        let c = c1 + stepC * i;
        // Strict boundary check
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            apples.push({ r, c });
        }
    }
    return apples;
}

function clearHighlights() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
             boardState[r][c].elem.classList.remove('selected');
        }
    }
}

function updateSelectedItems() {
    clearHighlights();
    
    const selectedApples = getSnappedLineApples(startR, startC, currR, currC);
    let sum = 0;
    let hasRemoved = false;
    
    selectedApples.forEach(({ r, c }) => {
        boardState[r][c].elem.classList.add('selected');
        if (boardState[r][c].removed) hasRemoved = true;
        sum += boardState[r][c].val;
    });
    
    selectionSumElem.innerText = sum;
    
    // Position sum near the last item for better UX instead of exact mouse px, 
    // but mouse px is smoother. We keep mouse px.
    
    if (sum === 10 && !hasRemoved && selectedApples.length > 0) {
        selectionSumElem.classList.add('valid');
        selectedApples.forEach(({ r, c }) => {
            boardState[r][c].elem.style.filter = 'hue-rotate(240deg) brightness(1.2) drop-shadow(0 0 10px #10B981)';
        });
    } else {
        selectionSumElem.classList.remove('valid');
        selectedApples.forEach(({ r, c }) => {
            boardState[r][c].elem.style.filter = '';
        });
    }
}

restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

initGame();
