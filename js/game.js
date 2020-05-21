'use strict'
console.log('Mine Sweeper');
var gGame;
var gLevel = {
    size: 4,
    mines: 2,
    lvlName: 'easy'
}
var gBoard;
const BOMB = '💣';
const FLAG = '🚩';


function initGame() {

    if (!gGame || !gGame.isManual) {
        if (gGame) {
            clearInterval(gGame.gTimeInterval);

        }
        gGame = {
            isOn: false,
            shownCount: 0,
            markedCount: 0,
            secsPassed: 0,
            bombsPos: [],
            lifesCount: 3,
            safeClicks: 3,
            hintCount: 3,
            isHintOn: false,
            isHintClicked: false,
            isManual: false,
            gTimeInterval: null,
            turn: 0,
            isUndo: false,
            prevTurns: []
        };

        gBoard = buildBoard(gLevel.size);
        renderBoard(gBoard);
        var elLifesUsed = document.querySelectorAll('.lifeUsed');
        for (var i = 0; i < elLifesUsed.length; i++) {
            toggleClass(elLifesUsed[i], 'life');
            toggleClass(elLifesUsed[i], 'lifeUsed');

        }
        var elHintsUsed = document.querySelectorAll('.hintUsed');
        for (var i = 0; i < elHintsUsed.length; i++) {
            toggleClass(elHintsUsed[i], 'hint');
            toggleClass(elHintsUsed[i], 'hintUsed');

        }
        var elSafe = document.querySelectorAll('.safe');
        elSafe.innerText = gGame.safeClicks;
    } else if (gGame.isManual) manual();

    var elTimer = document.querySelector('.sec');
    elTimer.innerText = gGame.secsPassed;
    gGame.isOn = true;
    var prevBest = localStorage.getItem(gLevel.lvlName);
   
    var elBest=document.querySelector('.best');
    elBest.innerText='Best Score: '+gLevel.lvlName+': '+prevBest;
}

function cellMarked(elCell, i, j) {
    if (!gGame.isOn || gBoard[i][j].isShown) return
    if (!gBoard[i][j].isMarked) {
        elCell.innerText = FLAG;
        gGame.markedCount++;
        checkGameOver();
    } else {
        elCell.innerText = '';
        gGame.markedCount--;
    }
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked;
}

function cellClicked(elCell, i, j) {
    if (!gGame.isOn || gBoard[i][j].isShown && !gGame.isUndo ||
        gBoard[i][j].isMarked) return;
    if (gGame.isHintOn) return;

    if (gGame.isHintClicked) {
        gGame.isHintOn = true;
        expandShown(gBoard, i, j);
        setTimeout(() => {
            gGame.isHintClicked = false;
            expandShown(gBoard, i, j)
            gGame.isHintOn = false;
        }, 1000);
        return;
    }
    if (gGame.isManual) {
        gBoard[i][j].isMine = true;
        gLevel.mines++;
        toggleClass(elCell, 'bomb');
        gGame.bombsPos.push({
            i: i,

            j: j
        })
        elCell.innerText = BOMB;
        return;
    }
    if (gBoard[i][j].isMine) {
        gGame.lifesCount--;
        var elLife = document.querySelector('.life');
        toggleClass(elLife, 'life');
        toggleClass(elLife, 'lifeUsed');
        if (gGame.lifesCount > 0) {
            toggleClass(elCell, 'life');
            gGame.prevTurns.push('life');
            setTimeout(() => {
                toggleClass(elCell, 'life');
            }, 500);
        } else {
            toggleBombs(gBoard);
            clearInterval(gGame.gTimeInterval);
            gGame.isOn = false;
            gGame.prevTurns.push('game over');
            var elSmiley=document.querySelector('.smiley');
            elSmiley.innerText='😵';
        }
        return
    }
    if (!gGame.turn) {
        gGame.gTimeInterval = setInterval(() => {
            timer();
        }, 1000);
    }
    gBoard[i][j].isShown = !gBoard[i][j].isShown;
    if (!gGame.bombsPos.length && !gGame.shownCount && !gGame.isUndo) {
        setBombs(gBoard, gLevel.mines);
        setMinesNegsCount(gBoard);
    }
    if (!gBoard[i][j].isMine) {
        renderCell(i, j);
        gGame.shownCount = (gGame.isUndo) ? gGame.shownCount -= 1 : gGame.shownCount += 1;
        if (!gBoard[i][j].minesAroundCount) {
            expandShown(gBoard, i, j);
        }
        if (gGame.isUndo) return;
        gGame.prevTurns.push({
            i: i,
            j: j
        })
        gBoard[i][j].turnClicked = gGame.turn;
        checkGameOver();
    }
    ++gGame.turn;
    
}



function expandShown(board, idx, jdx) {
    for (var i = idx - 1; i <= idx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = jdx - 1; j <= jdx + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            if (i === idx && j === jdx && !gGame.isHintOn) continue;
            if (board[i][j].isShown && !gGame.isUndo && !gGame.isHintOn) continue;
            if (!board[i][j].isShown && gGame.isUndo) continue;
            if (gGame.isUndo && board[i][j].turnClicked !== gGame.turn - 1) continue;
            if (gGame.isHintOn && !board[i][j].isHinted & board[i][j].isShown) continue;

            if (gGame.isHintOn) board[i][j].isHinted = !board[i][j].isHinted;
            renderCell(i, j);
            board[i][j].isShown = !board[i][j].isShown;
            if (gGame.isHintOn) continue
            gGame.shownCount = (gGame.isUndo) ? gGame.shownCount -= 1 : gGame.shownCount += 1;
            if (!board[i][j].minesAroundCount) {
                expandShown(board, i, j);
            }
            if (gGame.isUndo) continue;
            gBoard[i][j].turnClicked = gGame.turn;
        }
    }
}


function HintClicked(elBtn) {
    if (!gGame.hintCount) return;
    toggleClass(elBtn, 'hint');
    toggleClass(elBtn, 'hintUsed');
    gGame.isHintClicked = true;
    gGame.hintCount--;
    gGame.prevTurns.push('hint');
}

function safeClick(elBtn) {
    if (gGame.shownCount + gLevel.mines === gLevel.size ** 2) return;
    if (!gGame.safeClicks) return;
    var randomIdx = getRandomIntInc(0, gBoard.length - 1);
    var randomJdx = getRandomIntInc(0, gBoard.length - 1);
    var currCell = gBoard[randomIdx][randomJdx]
    if (currCell.isShown || currCell.isMine) return safeClick(elBtn)
    var elCell = document.querySelector(`.cell-${randomIdx}-${randomJdx}`);
    toggleClass(elCell, 'hint');
    setTimeout(() => {
        toggleClass(elCell, 'hint');
    }, 1000);
    elBtn = elBtn.querySelector('span');
    gGame.safeClicks--;
    elBtn.innerText = gGame.safeClicks;
    gGame.prevTurns.push('safe');

}



function manual() {
    if (gGame.shownCount) return;
    if (gGame.isManual) {
        var elBombs = document.querySelectorAll('.bomb');
        for (var i = 0; i < elBombs.length; i++) {
            elBombs[i].innerText = '';
        }
        setMinesNegsCount(gBoard);
        gLevel.lvlName = 'Manual';
    }
    gGame.isManual = !gGame.isManual;
    if (!gGame.isManual) return;
    gLevel.mines = 0;
}



function undo() {
    if (!gGame.prevTurns.length) return;
    if (gGame.isUndo || gGame.isManual) return;
    gGame.isUndo = true;
    var elBtn;
    var prevTurn = gGame.prevTurns[gGame.prevTurns.length - 1];
    if (prevTurn === 'life' || prevTurn === 'game over') {
        gGame.lifesCount++;
        elBtn = document.querySelector(`.lifeUsed`);
        toggleClass(elBtn, 'life');
        toggleClass(elBtn, 'lifeUsed');
        if (prevTurn === 'game over') {
            gGame.isOn = true;
            var elSmiley=document.querySelector('.smiley');
            elSmiley.innerText='😀';
            toggleBombs(gBoard);
            gGame.gTimeInterval = setInterval(() => {
                timer();
            }, 1000);
        }
    } else if (prevTurn === 'hint') {
        gGame.hintCount++;
        elBtn = document.querySelector(`.hintUsed`);
        toggleClass(elBtn, 'hint');
        toggleClass(elBtn, 'hintUsed');
    } else if (prevTurn === 'safe') {
        gGame.safeClicks++;
        elBtn = document.querySelector(`.safe`);
        elBtn.innerText = gGame.safeClicks;
    } else {
        var elCell = document.querySelector(`.cell-${prevTurn.i}-${prevTurn.j}`);
        cellClicked(elCell, prevTurn.i, prevTurn.j);
        gGame.turn--;
    }
    gGame.prevTurns.pop();
    gGame.isUndo = false;
}



