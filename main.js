const N_DELTA = [1, 0];
const S_DELTA = [-1, 0];
const E_DELTA = [0, 1];
const W_DELTA = [0, -1];
const NE_DELTA = [1, 1];
const SE_DELTA = [-1, 1];
const NW_DELTA = [1, -1];
const SW_DELTA = [-1, -1];
let nDelta = N_DELTA;
let sDelta = S_DELTA;
let eDelta = E_DELTA;
let wDelta = W_DELTA;
let neDelta = NE_DELTA;
let seDelta = SE_DELTA;
let nwDelta = NW_DELTA;
let swDelta = SW_DELTA;
const COMPASS_MAPPING = {
    0: N_DELTA,
    45: NE_DELTA,
    90: E_DELTA,
    135: SE_DELTA,
    180: S_DELTA,
    225: SW_DELTA,
    270: W_DELTA,
    315: NW_DELTA,
};
let currentCompassMapping = { ...COMPASS_MAPPING };

let compassNorth = N_DELTA;
let compassNorthString = "N";
let compassAngle = 0;
let penMovement = [0, 0];
let penLatitude = 0;
let penLongitude = 0;
let currentPixel;
let wheelSign;
let mod = {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
    altMeta: false,
};
const canvas = document.querySelector(".canvas");
let canvasSize = 15;
let minLatitude, maxLatitude, minLongitude, maxLongitude;
setRanges();

// TODO: test on mobile. May need to use Touch event listeners.

createCanvas(canvasSize, canvasSize);
syncCurrentPixel();
indicateCurrentPixel();
draw();

document.addEventListener("keydown", keydownListener);
document.addEventListener("keyup", keyupListener);
document.addEventListener("wheel", moveAndDraw);

function keydownListener(e) {
    if (e.code === "Equal") {
        padCanvas(1);
    }
    if (e.key === "a") {
        rotateCompass(-45, e);
    }
    if (e.key === "z") {
        rotateCompass(45, e);
    }

    orientCompass(e);
    console.log(`compassNorthString: ${compassNorthString}`);
    console.log(`compassAngle: ${compassAngle}\n\n`);
}

function keyupListener(e) {
    orientCompass(e);
    console.log(`compassNorthString: ${compassNorthString}`);
    console.log(`compassAngle: ${compassAngle}\n\n`);
}

function rotateCompass(rotationAngle, event) {
    let previousCompassMapping = { ...currentCompassMapping };

    for (let i = 0; i < 360; i += 45) {
        let newAngle = (i - rotationAngle) % 360;
        currentCompassMapping[`${newAngle}`] = previousCompassMapping[i];
    }
    nDelta = currentCompassMapping[0];
    neDelta = currentCompassMapping[45];
    eDelta = currentCompassMapping[90];
    seDelta = currentCompassMapping[135];
    sDelta = currentCompassMapping[180];
    swDelta = currentCompassMapping[225];
    wDelta = currentCompassMapping[270];
    nwDelta = currentCompassMapping[315];

    orientCompass(event);
}

function setRanges(height, width) {
    minLatitude = -Math.floor(height / 2);
    maxLatitude = minLatitude + (height - 1);
    minLongitude = -Math.floor(width / 2);
    maxLongitude = minLongitude + (width - 1);
}
function syncCurrentPixel() {
    currentPixel = document.querySelector(
        `[data-latitude="${penLatitude}"][data-longitude="${penLongitude}"]`
    );
}
function indicateCurrentPixel() {
    currentPixel.id = "currentPixel";
    let newArrowContainer = document.createElement("div");
    let upArrow = document.createElement("div");
    let downArrow = document.createElement("div");
    newArrowContainer.id = "arrows";
    upArrow.id = "upArrow";
    downArrow.id = "downArrow";
    currentPixel.appendChild(newArrowContainer);
    syncCompassArrows();
    newArrowContainer.appendChild(upArrow);
    newArrowContainer.appendChild(downArrow);
}
function unindicateCurrentPixel() {
    currentPixel.removeAttribute("id");
    currentPixel.removeChild(currentPixel.firstChild);
}

function createCanvas(height = canvasSize, width = canvasSize) {
    setRanges(height, width);
    for (let longitude = minLongitude; longitude <= maxLongitude; longitude++) {
        let column = createColumn(longitude, height);
        canvas.appendChild(column);
    }
}

function createColumn(longitude, height) {
    let column = document.createElement("div");
    column.classList.add("column");
    column.dataset.longitude = longitude;
    column = fillColumnWithPixels(column, longitude, height);
    return column;
}

function fillColumnWithPixels(columnElement, longitude, numberOfPixels) {
    for (let latitude = maxLatitude; latitude >= minLatitude; latitude--) {
        let pixel = createPixel(latitude, longitude);
        columnElement.appendChild(pixel);
    }
    return columnElement;
}

function createPixel(latitude, longitude) {
    let pixel = document.createElement("div");
    pixel.classList.add("pixel");
    pixel.dataset.latitude = latitude;
    pixel.dataset.longitude = longitude;
    return pixel;
}

function padCanvas(thickness = 1) {
    for (i = 1; i <= thickness; i++) {
        padCanvasByOne();
    }
    function padCanvasByOne() {
        let oldCanvasSize = canvasSize;
        addWestColumn();
        addEastColumn();
        growEachColumn();
        canvasSize += 2;
    }
    function addWestColumn() {
        let oldMinLongitude = minLongitude;
        let oldWestColumn = document.querySelector(
            `.column[data-longitude="${minLongitude}"]`
        );
        minLongitude -= 1;
        let newColumn = createColumn(minLongitude, canvasSize);
        canvas.insertBefore(newColumn, oldWestColumn);
    }
    function addEastColumn() {
        let oldMaxLongitude = maxLongitude;
        maxLongitude += 1;
        let newColumn = createColumn(maxLongitude, canvasSize);
        canvas.appendChild(newColumn);
    }

    function growEachColumn() {
        for (
            let longitude = minLongitude;
            longitude <= maxLongitude;
            longitude++
        ) {
            let column = document.querySelector(
                `.column[data-longitude="${longitude}"]`
            );
            addNorthPixel(column, longitude);
            addSouthPixel(column, longitude);
        }
        maxLatitude += 1;
        minLatitude -= 1;

        function addNorthPixel(columnElement, longitude) {
            let oldMaxLatitude = maxLatitude;
            let oldNorthPixel = document.querySelector(
                `.pixel[data-longitude="${longitude}"][data-latitude="${maxLatitude}"]`
            );
            let newPixel = createPixel(maxLatitude + 1, longitude);
            columnElement.insertBefore(newPixel, oldNorthPixel);
        }
        function addSouthPixel(columnElement, longitude) {
            let oldMinLatitude = minLatitude;
            let newPixel = createPixel(minLatitude - 1, longitude);
            columnElement.appendChild(newPixel);
        }
    }
}

// TO DO:
function cropCanvas(thickness) {
    for (i = 1; i <= thickness; i++) {
        cropCanvasByOne();
    }
    function cropCanvasByOne() {}
}

function moveAndDraw(wheelEvent) {
    unindicateCurrentPixel();
    movePen(wheelEvent);
    indicateCurrentPixel();
    draw(penLatitude, penLongitude);
    console.log("");
}

function draw(penPosition) {
    syncCurrentPixel();
    currentPixel.classList.add("drawn");
}

function movePen(e) {
    orientCompass(e);
    wheelSign = wheelSignOf(e);

    penMovement[0] = compassNorth[0] * wheelSign;
    penMovement[1] = compassNorth[1] * wheelSign;

    penLatitude += penMovement[0];
    penLongitude += penMovement[1];
    doNotWrapAround();

    syncCurrentPixel();
}

function doWrapAround() {
    if (penLatitude > maxLatitude) {
        penLatitude = minLatitude;
    } else if (penLatitude < minLatitude) {
        penLatitude = maxLatitude;
    }

    if (penLongitude > maxLongitude) {
        penLongitude = minLongitude;
    } else if (penLongitude < minLongitude) {
        penLongitude = maxLongitude;
    }
}

function doNotWrapAround() {
    if (penLatitude > maxLatitude) {
        penLatitude = maxLatitude;
    } else if (penLatitude < minLatitude) {
        penLatitude = minLatitude;
    }

    if (penLongitude > maxLongitude) {
        penLongitude = maxLongitude;
    } else if (penLongitude < minLongitude) {
        penLongitude = minLongitude;
    }
}

function orientCompass(event) {
    mod = modifierKeysOf(event);

    if (mod.altMeta && mod.ctrl) {
        compassNorth = nDelta;
    } else if (mod.altMeta) {
        compassNorth = nwDelta;
    } else if (mod.ctrl) {
        compassNorth = neDelta;
    } else if (mod.shift) {
        compassNorth = wDelta;
    } else {
        compassNorth = nDelta;
    }
    syncCompassNorthString();
    syncCompassAngle();
}

function syncCompassNorthString() {
    compassNorthString =
        compassNorth === N_DELTA
            ? "N"
            : compassNorth === NW_DELTA
            ? "NW"
            : compassNorth === NE_DELTA
            ? "NE"
            : compassNorth === W_DELTA
            ? "W"
            : compassNorth === E_DELTA
            ? "E"
            : compassNorth === SW_DELTA
            ? "SW"
            : compassNorth === SE_DELTA
            ? "SE"
            : compassNorth === S_DELTA
            ? "S"
            : compassNorthString;
}

function syncCompassAngle() {
    compassAngle =
        compassNorth === N_DELTA
            ? 0
            : compassNorth === NW_DELTA
            ? -45
            : compassNorth === NE_DELTA
            ? 45
            : compassNorth === W_DELTA
            ? -90
            : compassNorth === E_DELTA
            ? 90
            : compassNorth === SW_DELTA
            ? -135
            : compassNorth === SE_DELTA
            ? 135
            : compassNorth === S_DELTA
            ? 180
            : compassAngle;
    syncCompassArrows();
}
function syncCompassArrows() {
    let existingArrowContainer = document.querySelector("#arrows");
    if (existingArrowContainer) {
        existingArrowContainer.style.transform = `rotate(${compassAngle}deg)`;
    }
}

function wheelSignOf(e) {
    if (e.wheelDeltaY !== 0) {
        return Math.sign(e.wheelDeltaY);
    } else {
        return Math.sign(e.wheelDeltaX);
    }
}

function modifierKeysOf(e) {
    return {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
        altMeta: e.altKey || e.metaKey,
    };
}
