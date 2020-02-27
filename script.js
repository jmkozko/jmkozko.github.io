let startTime;
const numOfMicroBlocks = 15;
const numOfSubBlocks = 5;
const sleepDurationMs = 1;
const progressElem = document.querySelector('.progress');
const subProgressElem = document.querySelector('.sub-progress');
const progressBarElem = document.querySelector('.progress-bar');
const subProgressBarElem = document.querySelector('.sub-progress-bar');

function subBoxElement(position) {
    return document.querySelector(`[class^=sub-box-${position}]`);
}

function microBoxElement(position) {
    return document.querySelector(`[class^=micro-box-${position}]`);
}

function updateBlockArray(blockArray, currentBlock, percentBlockFinished) {
    if (currentBlock > 0) {
        if (blockArray[currentBlock - 1] < 100) {
            blockArray[currentBlock - 1] = 100;
        }
    }
    blockArray[currentBlock] = percentBlockFinished;
}

function toggleBars() {
    if (window.getComputedStyle(progressElem).display === 'block') {
        progressElem.style.display = 'none';
        subProgressElem.style.display = 'none';
    } else {
        progressElem.style.display = 'block';
        subProgressElem.style.display = 'block';
    }
}

function requestNotificationAccess() {
    if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

function completedNotification() {
    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                let bodyText = `${totalMilliseconds()/60/1000} minutes`;
                var options = {
                    title: "POMODORO", 
                    body: bodyText, 
                    requireInteraction: true
                };
                let notification = new Notification("Pomodoro Completed!", options);
            }
        });
    }
}

function updateSubProgressBar(percentFinished) {
    subProgressBarElem.style.width = percentFinished + "%";
}

function updateProgressBar(percentFinished) {
    progressBarElem.style.width = percentFinished + "%";
}

function totalMilliseconds() {
    return Number.parseFloat(document.querySelector('#minutes').value) * 60 * 1000;
}

function elapsedMilliseconds() {
    var currentTime = new Date();
    var timeDiff = currentTime - startTime;
    return timeDiff;
}

function updateBlocks(blockArray, currentBlock, percentBlockFinished, fetchElementFn) {
    let lastFinishedBlock = -1;
    for (let i = 0; i < blockArray.length; i++) {
        if (blockArray[i] === 100) {
            lastFinishedBlock = i;
        }
    }
    let subBox = fetchElementFn(lastFinishedBlock + 1);
    if (lastFinishedBlock !== -1) {
        subBox.style.backgroundColor = "#C8C864";
    }
}

function round(num, decimal) {
    let moveDecimal = Math.pow(10, decimal);
    return Math.round((num + Number.EPSILON) * moveDecimal) / moveDecimal;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function clearState() {
    for (let i = 0; i < numOfSubBlocks; i++) {
        let subBox = subBoxElement(i + 1);
        subBox.style.backgroundColor = "white";
    }
    for (let i = 0; i < numOfMicroBlocks; i++) {
        let microBox = microBoxElement(i + 1);
        microBox.style.backgroundColor = "white";
    }
}

async function start() {
    let totalMillisec = totalMilliseconds();
    if (Number.isNaN(totalMillisec)) return;
    
    await clearState();
    requestNotificationAccess();

    startTime = new Date();
    let totalMicroBlockMillisec = round(totalMillisec / numOfMicroBlocks, 3);
    let totalSubBlockMillisec = round(totalMillisec / numOfSubBlocks, 3);
    let percentMicroBlockFinished = 0;
    let percentSubBlockFinished = 0;
    let percentFinished = 0;
    let microProgressBlocks = [];
    let subProgressBlocks = [];


    while (elapsedMilliseconds() <= totalMillisec) {
        let currentMillisecond = elapsedMilliseconds();
        // sets to the current block or sets to the last block if result exceeds numOf*Blocks due to last millisecond
        let currentMicroBlock = (currentMillisecond / totalMicroBlockMillisec) < numOfMicroBlocks ? 
            Math.floor(currentMillisecond / totalMicroBlockMillisec) : numOfMicroBlocks - 1;
        let currentSubBlock = (currentMillisecond / totalSubBlockMillisec) < numOfSubBlocks ? 
            Math.floor(currentMillisecond / totalSubBlockMillisec) : numOfSubBlocks - 1;

        percentMicroBlockFinished = round(((currentMillisecond % totalMicroBlockMillisec) / totalMicroBlockMillisec * 100), 2);
        percentSubBlockFinished = round(((currentMillisecond % totalSubBlockMillisec) / totalSubBlockMillisec * 100), 2);
        percentFinished = round(currentMillisecond / totalMillisec * 100, 2);

        updateBlockArray(subProgressBlocks, currentSubBlock, percentSubBlockFinished);
        updateBlocks(subProgressBlocks, currentSubBlock, percentSubBlockFinished, subBoxElement);

        updateBlockArray(microProgressBlocks, currentMicroBlock, percentMicroBlockFinished);
        updateBlocks(microProgressBlocks, currentMicroBlock, percentMicroBlockFinished, microBoxElement);

        updateSubProgressBar(percentMicroBlockFinished);
        updateProgressBar(percentFinished);

        await sleep(sleepDurationMs);
    }
    updateBlockArray(subProgressBlocks, subProgressBlocks.length - 1, 100);
    updateBlocks(subProgressBlocks, subProgressBlocks.length, 100, subBoxElement);

    updateBlockArray(microProgressBlocks, microProgressBlocks.length - 1, 100);
    updateBlocks(microProgressBlocks, microProgressBlocks.length, 100, microBoxElement);

    updateSubProgressBar(100);
    updateProgressBar(100);

    let audio = document.querySelector("#completedSound");
    audio.volume = 0.25;
    audio.play();
    completedNotification();
};
