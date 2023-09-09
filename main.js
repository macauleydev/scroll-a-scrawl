const NORTH = [1, 0];
const SOUTH = [-1, 0];
const EAST = [0, 1];
const WEST = [0, -1];
const NORTH_EAST = [1, 1];
const SOUTH_EAST = [-1, 1];
const NORTH_WEST = [1, -1];
const SOUTH_WEST = [-1, -1];
let wheelNorth = NORTH;
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

// TODO: test on mobile. May need a different event listener.

createCanvas(canvasSize, canvasSize);
syncCurrentPixel();
indicateCurrentPixel();
draw();

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
}
function unindicateCurrentPixel() {
    currentPixel.removeAttribute("id");
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

function wrapCanvas(thickness = 1) {
    for (i = 1; i <= thickness; i++) {
        wrapCanvasByOne();
    }
    function wrapCanvasByOne() {
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

function cropCanvas(thickness) {
    for (i = 1; i <= thickness; i++) {
        cropCanvasByOne();
    }
    function cropCanvasByOne() {}
}

document.addEventListener("keydown", keyListener);

function keyListener(e) {
    if (e.code === "Equal") {
        wrapCanvas(1);
    }
}

document.addEventListener("wheel", moveAndDraw);
function moveAndDraw(wheelEvent) {
    unindicateCurrentPixel();
    movePen(wheelEvent);
    indicateCurrentPixel();
    draw(penLatitude, penLongitude);
    console.log("");
}

function draw(penPosition) {
    console.log(`This "draw" function will draw based on the value below.`);
    console.log(`penLatitude: ${penLatitude}`);
    console.log(`penLongitude: ${penLongitude}`);
    syncCurrentPixel();
    console.log(currentPixel);
    currentPixel.classList.add("drawn");
}

function movePen(e) {
    setWheelNorth(e);
    console.log(
        `This "movePen" function moves the pen based on the values below.`
    );
    console.log(`wheelSign: ${wheelSign}`);
    console.log(`wheelNorth: ${wheelNorth}`);

    penMovement[0] = wheelNorth[0] * wheelSign;
    penMovement[1] = wheelNorth[1] * wheelSign;

    penLatitude += penMovement[0];
    if (penLatitude > maxLatitude) {
        penLatitude = minLatitude;
    } else if (penLatitude < minLatitude) {
        penLatitude = maxLatitude;
    }

    penLongitude += penMovement[1];
    if (penLongitude > maxLongitude) {
        penLongitude = minLongitude;
    } else if (penLongitude < minLongitude) {
        penLongitude = maxLongitude;
    }

    syncCurrentPixel();
}

function setWheelNorth(e) {
    wheelSign = wheelSignOf(e);
    mod = modifierKeysOf(e);

    if (mod.altMeta && mod.ctrl) {
        wheelNorth = NORTH;
    } else if (mod.altMeta) {
        wheelNorth = NORTH_WEST;
    } else if (mod.ctrl) {
        wheelNorth = NORTH_EAST;
    } else if (mod.shift) {
        wheelNorth = WEST;
    } else {
        wheelNorth = NORTH;
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
