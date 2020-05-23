'use strict'

function buildBoard(colsAndRows) {
    var board = [];
    for (var i = 0; i < colsAndRows; i++) {
        board[i] = [];
        for (var j = 0; j < colsAndRows; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                isHinted: false,
                turnClicked: gGame.turn

            }
        }
    }

    return board;
}

function renderBoard(board) {
    var strHtml = '';

    for (var i = 0; i < board.length; i++) {
        strHtml += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var LClick = `onclick="cellClicked(this,${i},${j})"`;
            var RClick = `oncontextmenu="cellMarked(this,${i},${j})"`;
            strHtml += `<td class="cell cell-${i}-${j}"${LClick}${RClick} ></td>`;
        }
        strHtml += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHtml;
}

function getRandomIntInc(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}



function renderCell(i, j) {
    var elCell = document.querySelector(`.cell-${i}-${j}`);
    if (gGame.isHintOn && gBoard[i][j].isMine) {
        elCell.innerText = (elCell.innerText) ? '' : BOMB;
    } else if (!gBoard[i][j].isMine) {
        var negsCount = gBoard[i][j].minesAroundCount;
        toggleClass(elCell, `negs${negsCount}`);
        elCell.innerText = (elCell.innerText || !negsCount) ? '' : negsCount;
    }
    toggleClass(elCell, 'shown');
}

function localStore() {
    var prevBest = +localStorage.getItem(gLevel.lvlName);
    if (!prevBest) localStorage.setItem(gLevel.lvlName, gGame.secsPassed);
    if (prevBest > gGame.secsPassed) {
        prevBest = gGame.secsPassed;
        localStorage.setItem(gLevel.lvlName, gGame.secsPassed);
    }
    var elBest = document.querySelector('.best');
    elBest.innerText = '🏆 ' + gLevel.lvlName + ': ' + prevBest;
}

function timer() {
    gGame.secsPassed += 1;
    var elTimerSec = document.querySelector('.sec');
    elTimerSec.innerText = gGame.secsPassed;
}

function toggleBombs(board) {
    var elBombs = document.querySelectorAll('.bomb');
    for (var i = 0; i < elBombs.length; i++) {
        elBombs[i].innerText = (!elBombs[i].innerText) ? BOMB : '';
        toggleClass(elBombs[i], 'shown');
        var bombPos = gGame.bombsPos[i];
        board[bombPos.i][bombPos.j].isShown = !board[bombPos.i][bombPos.j].isShown;
    }
}

function setBomb(board) {
    var randomIdx = getRandomIntInc(0, board.length - 1);
    var randomJdx = getRandomIntInc(0, board.length - 1);
    if (board[randomIdx][randomJdx].isShown) return setBomb(board);
    if (board[randomIdx][randomJdx].isMine) return setBomb(board);
    board[randomIdx][randomJdx].isMine = true;
    var elCell = document.querySelector(`.cell-${randomIdx}-${randomJdx}`);
    toggleClass(elCell, 'bomb');
    var bombPos = {
        i: randomIdx,
        j: randomJdx
    }
    gGame.bombsPos.push(bombPos);
}

function setBombs(board, num) {
    for (var i = 0; i < num; i++) {
        setBomb(board);
    }
}


function toggleClass(elCell, classToToggle) {
    elCell.classList.toggle(`${classToToggle}`);
}

function checkGameOver() {
    if (gGame.markedCount + gGame.shownCount === gBoard.length ** 2) {
        clearInterval(gGame.gTimeInterval);
        localStore()
        gGame.isOn = false;
        var elSmiley = document.querySelector('.smiley');
        elSmiley.innerText = '😎';
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            countNegs(board, i, j);
        }
    }
}

function countNegs(board, idx, jdx) {
    for (var i = idx - 1; i <= idx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = jdx - 1; j <= jdx + 1; j++) {
            if (j < 0 || j > board.length - 1) continue;
            if (i === idx && j === jdx) continue;
            if (board[i][j].isMine) board[idx][jdx].minesAroundCount++;
        }
    }
}

function mode(size, mines, lvlName) {
    gLevel = {
        size: size,
        mines: mines,
        lvlName: lvlName
    }
    initGame();
}