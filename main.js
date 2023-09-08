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
let wheelSign;
let mod = {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
    altMeta: false,
};

// TODO: test on mobile. May need a different event listener.

document.addEventListener("wheel", moveAndDraw);
function moveAndDraw(wheelEvent) {
    movePen(wheelEvent);
    draw(penLatitude, penLongitude);
    console.log("");
}

function draw(penPosition) {
    console.log(`This "draw" function will draw based on the value below.`);
    console.log(`penLatitude: ${penLatitude}`);
    console.log(`penLongitude: ${penLongitude}`);
}

function movePen(e) {
    setWheelNorth(e);
    console.log(
        `This "movePen" function will move the pen based on the values below.`
    );
    console.log(`wheelSign: ${wheelSign}`);
    console.log(`wheelNorth: ${wheelNorth}`);

    penMovement[0] = wheelNorth[0] * wheelSign;
    penMovement[1] = wheelNorth[1] * wheelSign;

    // TODO: qualify these to enable wrap-around:
    penLatitude += penMovement[0];
    penLongitude += penMovement[1];
}

function setWheelNorth(e) {
    // Set wheel orientation based on modifier keys
    wheelSign = wheelSignOf(e);
    mod = modifierKeysOf(e);
    // Set wheelNorth according to wheelSign & mod

    if (mod.ctrl) {
        wheelNorth = NORTH_WEST;
    } else if (mod.altMeta) {
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
