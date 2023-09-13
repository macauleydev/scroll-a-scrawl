const N_DELTA = [1, 0];
const S_DELTA = [-1, 0];
const E_DELTA = [0, 1];
const W_DELTA = [0, -1];
const NE_DELTA = [1, 1];
const SE_DELTA = [-1, 1];
const NW_DELTA = [1, -1];
const SW_DELTA = [-1, -1];
const FIXED_COMPASS = {
    0: N_DELTA,
    45: NE_DELTA,
    90: E_DELTA,
    135: SE_DELTA,
    180: S_DELTA,
    225: SW_DELTA,
    270: W_DELTA,
    315: NW_DELTA,
};

let compassNorth = N_DELTA;
let compassAngle = 0;
let compassAngleContinuous = 0;

let restingCompassAngle = 0;
let restingCompassAngleContinuous = 0;
let modAngle = 0;

let penLatitude = 0;
let penLongitude = 0;
let currentPixel;
let wheelSign;
let mod = {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
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
setEventListeners();

function setEventListeners() {
    document.addEventListener("keydown", firstEvent);
    document.addEventListener("keyup", firstEvent);
    document.addEventListener("wheel", firstEvent);

    function firstEvent(e) {
        if (e.type === "keyup") {
            // Ignore keyup event (if any mod keys were held during page load)
        } else if (e.type === "keydown") {
            keydownAction(e);
        } else if (e.type === "wheel") {
            moveAndDraw(e);
        }
        document.removeEventListener("keydown", firstEvent);
        document.removeEventListener("keyup", firstEvent);
        document.removeEventListener("wheel", firstEvent);

        document.addEventListener("keydown", keydownAction);
        document.addEventListener("keyup", keyupAction);
        document.addEventListener("wheel", moveAndDraw);
    }
}

function keydownAction(e) {
    console.log(e);
    if (e.code === "Minus") {
        padCanvas(1);
    } else if (e.code === "Equal") {
        hideCanvasEdge();
    } else if (e.key === "a") {
        rotateCompass(-45, e);
        redrawCompass(e);
    } else if (e.key === "z") {
        rotateCompass(45, e);
        redrawCompass(e);
    } else {
        redrawCompass(e);
    }
}

function keyupAction(e) {
    if (
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key === "Control" ||
        e.key === "Shift"
    ) {
        redrawCompass(e);
    }
}

function rotateCompass(rotationAngle, event) {
    restingCompassAngleContinuous =
        restingCompassAngleContinuous + rotationAngle;
    restingCompassAngle = restingCompassAngle + rotationAngle;
    restingCompassAngle +=
        restingCompassAngle >= 360 ? -360 : restingCompassAngle < 0 ? 360 : 0;
}

function syncCompassAngle() {
    compassAngleContinuous = restingCompassAngleContinuous + modAngle;
    compassAngle = restingCompassAngle + modAngle;
    compassAngle += compassAngle >= 360 ? -360 : compassAngle < 0 ? 360 : 0;
    compassNorth = FIXED_COMPASS[compassAngle];
    syncCompassArrows();
}

function syncCompassArrows() {
    let arrowContainer = document.querySelector("#arrows");
    if (arrowContainer) {
        arrowContainer.style.transform = `rotate(${compassAngleContinuous}deg)`;
    }
}

function redrawCompass(event) {
    getModKeys(event);
    modAngle = 0;
    if (mod.alt) modAngle -= 45;
    if (mod.meta) modAngle -= 45;
    if (mod.ctrl) modAngle += 45;
    if (mod.shift) modAngle -= 90;
    syncCompassAngle();
}

function getWheelSign(e) {
    if (e.wheelDeltaY !== 0) {
        wheelSign = Math.sign(e.wheelDeltaY);
    } else {
        wheelSign = Math.sign(e.wheelDeltaX);
    }
}

function getModKeys(e) {
    mod = {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
    };
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

function moveAndDraw(wheelEvent, longitudeShift = 0) {
    unindicateCurrentPixel();
    getWheelSign(wheelEvent);
    movePen(wheelSign);
    indicateCurrentPixel();
    draw(penLatitude, penLongitude);
}

function moveAndDrawPassively(latitudeShift, longitudeShift = 0) {
    unindicateCurrentPixel();
    movePen(latitudeShift, longitudeShift);
    indicateCurrentPixel();
    draw(penLatitude, penLongitude);
}

function draw(penPosition) {
    syncCurrentPixel();
    currentPixel.classList.add("drawn");
}

function movePen(compassLatitudeShift = wheelSign, longitudeShift = 0) {
    penLatitude += compassNorth[0] * compassLatitudeShift;
    penLongitude += compassNorth[1] * compassLatitudeShift + longitudeShift;
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

function createCanvas(height = canvasSize, width = canvasSize) {
    setRanges(height, width);
    for (let longitude = minLongitude; longitude <= maxLongitude; longitude++) {
        let column = createColumn(longitude, height);
        canvas.appendChild(column);
    }
}
function setRanges(height, width) {
    minLatitude = -Math.floor(height / 2);
    maxLatitude = minLatitude + (height - 1);
    minLongitude = -Math.floor(width / 2);
    maxLongitude = minLongitude + (width - 1);
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
        if (canvas.firstElementChild.classList.contains("hidden")) {
            unhideCanvasEdge();
        } else {
            padCanvasByOne();
        }
    }
    function unhideCanvasEdge() {
        minLongitude -= 1;
        maxLongitude += 1;

        let westColumn = canvas.firstElementChild;
        let eastColumn = canvas.lastElementChild;

        westColumn.classList.remove("hidden");
        eastColumn.classList.remove("hidden");

        maxLatitude += 1;
        minLatitude -= 1;

        for (
            let longitude = minLongitude;
            longitude <= maxLongitude;
            longitude++
        ) {
            let column = document.querySelector(
                `.column[data-longitude="${longitude}"]`
            );
            let northPixel = column.firstElementChild;
            let southPixel = column.lastElementChild;

            northPixel.classList.remove("hidden");
            southPixel.classList.remove("hidden");
        }
        canvasSize += 2;
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

// TO DO: Enable this function to be repeated without bugs
function hideCanvasEdge() {
    let latitudeShift =
        penLatitude === maxLatitude ? -1 : penLatitude === minLatitude ? 1 : 0;
    let longitudeShift =
        penLongitude === maxLongitude
            ? -1
            : penLongitude === minLongitude
            ? 1
            : 0;
    if (latitudeShift !== 0 || longitudeShift !== 0) {
        moveAndDrawPassively(latitudeShift, longitudeShift);
    }

    for (let longitude = minLongitude; longitude <= maxLongitude; longitude++) {
        let column = document.querySelector(
            `.column[data-longitude="${longitude}"]`
        );
        let northPixel = column.firstElementChild;
        let southPixel = column.lastElementChild;

        northPixel.classList.add("hidden");
        southPixel.classList.add("hidden");
    }
    maxLatitude -= 1;
    minLatitude += 1;

    let westColumn = canvas.firstElementChild;
    let eastColumn = canvas.lastElementChild;

    westColumn.classList.add("hidden");
    eastColumn.classList.add("hidden");

    minLongitude += 1;
    maxLongitude -= 1;

    canvasSize -= 2;
}
