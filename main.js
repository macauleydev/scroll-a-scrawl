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
let mod = {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
};
const canvas = document.querySelector(".canvas");
let canvasSize = 15;
let minLatitude, maxLatitude, minLongitude, maxLongitude;

// TODO: test on mobile. May need to use Touch event listeners.

createCanvas(canvasSize, canvasSize);
dropPen();
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
            drawWithPen(e);
        }
        document.removeEventListener("keydown", firstEvent);
        document.removeEventListener("keyup", firstEvent);
        document.removeEventListener("wheel", firstEvent);

        document.addEventListener("keydown", keydownAction);
        document.addEventListener("keyup", keyupAction);
        document.addEventListener("wheel", drawWithPen);
    }
}

function keydownAction(e) {
    console.log(e);
    if (e.code === "Minus") {
        padCanvas(1);
    } else if (e.code === "Equal") {
        cropCanvasByOne();
    } else if (e.key === "r" || e.key === "a") {
        rotateCompass(-45, e);
        redrawCompass(e);
    } else if (e.key === "t" || e.key === "z") {
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

function wheelSign(e) {
    if (e.wheelDeltaY !== 0) {
        return Math.sign(e.wheelDeltaY);
    } else {
        return Math.sign(e.wheelDeltaX);
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

function dropPen() {
    currentPixel = document.querySelector(
        `[data-latitude="${penLatitude}"][data-longitude="${penLongitude}"]`
    );
    currentPixel.id = "currentPixel";
    drawPixel();
    placeCompass();
}

function placeCompass() {
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

function liftPen() {
    currentPixel.removeAttribute("id"); // id="currentPixel"
    let compass = currentPixel.firstChild;
    currentPixel.removeChild(compass);
}

function drawWithPen(wheelEvent) {
    liftPen();
    penLatitude += compassNorth[0] * wheelSign(wheelEvent);
    penLongitude += compassNorth[1] * wheelSign(wheelEvent);
    containPenDuringDraw();
    dropPen();
}

function penGetPushed(latitudeShift, longitudeShift) {
    liftPen();
    penLatitude += latitudeShift;
    penLongitude += longitudeShift;
    dropPen();
}

function drawPixel(pixelElement = currentPixel) {
    pixelElement.classList.add("drawn");
}

function movePen(north, wheelSign) {}

function penWrapAround() {
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

function containPenDuringDraw() {
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
        padCanvasByOne();
    }

    function padCanvasByOne() {
        padWest();
        padEast();
        padNorthAndSouth();
        canvasSize += 2;
    }
    function padWest() {
        let newMinLongitude = minLongitude - 1;
        let furtherWestHiddenColumn = document.querySelector(
            `.hiddenColumn[data-longitude="${newMinLongitude}"]`
        );

        if (furtherWestHiddenColumn) {
            revealColumn(furtherWestHiddenColumn);
        } else {
            let oldWestColumn = document.querySelector(
                `.column[data-longitude="${minLongitude}"]`
            );
            let newColumn = createColumn(newMinLongitude, canvasSize);
            canvas.insertBefore(newColumn, oldWestColumn);
        }
        minLongitude -= 1;
    }
    function padEast() {
        let newMaxLongitude = maxLongitude + 1;
        let furtherEastHiddenColumn = document.querySelector(
            `.hiddenColumn[data-longitude="${newMaxLongitude}"]`
        );

        if (furtherEastHiddenColumn) {
            revealColumn(furtherEastHiddenColumn);
        } else {
            let newColumn = createColumn(newMaxLongitude, canvasSize);
            canvas.appendChild(newColumn);
        }
        maxLongitude += 1;
    }
    function padNorthAndSouth() {
        for (
            let longitude = minLongitude;
            longitude <= maxLongitude;
            longitude++
        ) {
            let column = document.querySelector(
                `.column[data-longitude="${longitude}"]`
            );
            padNorth(column, longitude);
            padSouth(column, longitude);
        }
        maxLatitude += 1;
        minLatitude -= 1;

        function padNorth(columnElement, longitude) {
            let newMaxLatitude = maxLatitude + 1;
            let furtherNorthHiddenPixel = document.querySelector(
                `.hiddenPixel[data-longitude="${longitude}"][data-latitude="${newMaxLatitude}"]`
            );
            console.log(furtherNorthHiddenPixel);
            if (furtherNorthHiddenPixel) {
                revealPixel(furtherNorthHiddenPixel);
            } else {
                let oldNorthPixel = document.querySelector(
                    `.pixel[data-longitude="${longitude}"][data-latitude="${maxLatitude}"]`
                );
                let newPixel = createPixel(maxLatitude + 1, longitude);
                columnElement.insertBefore(newPixel, oldNorthPixel);
            }
        }
        function padSouth(columnElement, longitude) {
            let newMinLatitude = minLatitude - 1;
            let furtherSouthHiddenPixel = document.querySelector(
                `.hiddenPixel[data-longitude="${longitude}"][data-latitude="${newMinLatitude}"]`
            );
            console.log(furtherSouthHiddenPixel);
            if (furtherSouthHiddenPixel) {
                revealPixel(furtherSouthHiddenPixel);
            } else {
                let newPixel = createPixel(minLatitude - 1, longitude);
                columnElement.appendChild(newPixel);
            }
        }
    }
}

function cropCanvasByOne() {
    if (canvasSize < 3) return;
    containPenDuringCrop();
    cropNorthAndSouth();
    cropWest();
    cropEast();

    canvasSize -= 2;

    function containPenDuringCrop() {
        let latitudeShift =
            penLatitude === maxLatitude
                ? -1
                : penLatitude === minLatitude
                ? 1
                : 0;
        let longitudeShift =
            penLongitude === maxLongitude
                ? -1
                : penLongitude === minLongitude
                ? 1
                : 0;
        if (latitudeShift !== 0 || longitudeShift !== 0) {
            penGetPushed(latitudeShift, longitudeShift);
        }
    }
    function cropNorthAndSouth() {
        for (
            let longitude = minLongitude;
            longitude <= maxLongitude;
            longitude++
        ) {
            let northPixel = document.querySelector(
                `.pixel[data-latitude="${maxLatitude}"][data-longitude="${longitude}"]`
            );
            let southPixel = document.querySelector(
                `.pixel[data-latitude="${minLatitude}"][data-longitude="${longitude}"]`
            );

            if (pixelIsDrawn(northPixel) || pixelIsDrawn(southPixel)) {
                hidePixel(northPixel);
                hidePixel(southPixel);
            } else {
                northPixel.remove();
                southPixel.remove();
            }
        }
        maxLatitude -= 1;
        minLatitude += 1;
    }

    function cropWest() {
        let westColumn = document.querySelector(
            `.column[data-longitude="${minLongitude}"]`
        );
        if (hasAnyDrawnPixels(westColumn)) {
            hideColumn(westColumn);
        } else {
            westColumn.remove();
        }
        minLongitude += 1;
    }
    function cropEast() {
        let eastColumn = document.querySelector(
            `.column[data-longitude="${maxLongitude}"]`
        );
        if (hasAnyDrawnPixels(eastColumn)) {
            hideColumn(eastColumn);
        } else {
            eastColumn.remove();
        }
        maxLongitude -= 1;
    }
}

function pixelIsDrawn(pixel) {
    return pixel.classList.contains("drawn");
}
function hasAnyDrawnPixels(column) {
    let pixels = column.children;
    let drawn = false;
    for (const pixel of pixels) {
        if (pixel.classList.contains("drawn")) drawn = true;
    }
    return drawn;
}
function hideColumn(element) {
    element.classList.remove("column");
    element.classList.add("hiddenColumn");
}
function revealColumn(element) {
    element.classList.remove("hiddenColumn");
    element.classList.add("column");
}
function hidePixel(element) {
    element.classList.remove("pixel");
    element.classList.add("hiddenPixel");
}
function revealPixel(element) {
    element.classList.remove("hiddenPixel");
    element.classList.add("pixel");
}
