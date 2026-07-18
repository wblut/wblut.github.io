'use strict'
p5.disableFriendlyErrors = true;
let mainDrawingGrid, frameGrid;
let I, J, K;
let iOffset, jOffset, kOffset;
let scalarField;
let JHeightMap, IKHeightMap;
let prevWidth, prevHeight;
let saveEnabled, saveImage, saveSizeX, saveSizeY;
let luminosity;
let darkness;
let frameMode;
let padding;
let zoom;
let outlineMode;
let backgroundMode;
let visibleLayers;
let redrawbkg;
let blockedLayers;
let fadeColorBottom, fadeColorTop;
let perspectiveMode;
let moved;
let palettes;
let JRange;
let JTransition;
let inclusions;
let currentInclusion;
let inclusionSeed;
let inclusionIteration;
let blockLayer;
let drawScale;
let controlX;
let controlY;
let legendX;
let legendY;
let motionX;
let motionY;
let backgroundColor;
let NUMINCLUSIONS = 48;
let SECTORHALFSIZE = 40;
let sectorI, sectorJ, sectorK;
let cutI, cutK;
let flatColor;
let drawHidden;
const SQRT3O6 = Math.sqrt(3.0) / 6.0;
const OFFSETFACTOR = 10;
const NUMLAYERS = 10;
const NUMPALETTES = 4;
let jShift;
function preload() {
    prepareToken();
  }
  function prepareToken() {
    hl.token.setName(`Iso - Ambifeuille #${hl.tx.tokenId}`);
    hl.token.setDescription(description);
  }

function setup() {
    createCanvas(windowWidth, windowHeight);
    initGeneratorParameters();
    initViewParameters();
    createAmbifeuille();
    initColors();
    createInclusions();
}

function initGeneratorParameters() {
    backgroundColor = color(255, 250, 246);
    noiseSeed(hl.randomInt(1000000));
    noiseDetail(hl.randomInt(3, 5));
    I =128;
    J = 128;
    K = 128;
jShift= (J-min(I,K))/2;
    JRange = hl.randomInt(16, 64);
    JTransition = hl.randomInt(4, 32);
    scalarField = new PerlinScalarField();
    luminosity = hl.random(0.2, 0.5);
    darkness = hl.random(0.5, 1.0);
    fadeColorBottom = color(0);
    fadeColorTop = color(255);
    blockLayer = hl.random(0.18,0.34);
}

function initViewParameters() {
    let searchParams = new URLSearchParams(window.location.search);
    zoom = parseFloat(searchParams.get("zoom")) || 1.0;
    if (typeof zoom != 'number') {
        zoom = 1.0;
    } else {
        zoom = parseFloat(zoom.toFixed(2))
    }
    zoom = 0.70;
    iOffset = floor(parseInt(searchParams.get("io"))) || 0;
    jOffset = floor(parseInt(searchParams.get("jo"))) || 0;
    kOffset = floor(parseInt(searchParams.get("ko"))) || 0;
    sectorI = 0;
    sectorJ = 0;
    sectorK = 0;
    if (typeof iOffset != 'number') iOffset = 0;
    if (typeof jOffset != 'number') jOffset = 0;
    if (typeof kOffset != 'number') kOffset = 0;
    updateSectorNoInclusion();
    visibleLayers = [];
    let tmpLayer;
    for (let i = 0; i <= NUMLAYERS + 1; i++) {
        visibleLayers[i] = false;
        tmpLayer = searchParams.get("layer" + i) ? parseInt(searchParams.get("layer" + i)) === 1 : scalarField
            .layers[i];
        if (typeof tmpLayer != 'number') tmpLayer = scalarField.layers[i];
        scalarField.layers[i] = tmpLayer;
    }
    frameMode = (parseInt(searchParams.get("frame")) || 1);
    if (typeof frameMode != 'number') frameMode = 1;
    if (hl.context.previewMode) frameMode = 2;
    padding = 6;
    outlineMode = (parseInt(searchParams.get("outline")) || 2);
    if (typeof outlineMode != 'number') frameMode = 2;
    backgroundMode = (parseInt(searchParams.get("background")) || 0);
    if (typeof backgroundMode != 'number') backgroundMode = 0;
    perspectiveMode = (parseInt(searchParams.get("perspective")) || 0);
    if (typeof perspectiveMode != 'number') perspectiveMode = 0;
    inclusionIteration = (parseInt(searchParams.get("iteration")) || 0);
    if (typeof inclusionIteration != 'number') inclusionIteration = 0;
    inclusionSeed = (parseInt(searchParams.get("inclusionseed")) || hl.randomInt(1000000));
    if (typeof inclusionSeed != 'number') inclusionSeed = hl.randomInt(1000000);
    cutI = (parseInt(searchParams.get("cuti")) || 0);
    if (typeof cutI != 'number') cutI = 0;
    cutI = (cutI === 1);
    cutK = (parseInt(searchParams.get("cutk")) || 0);
    if (typeof cutK != 'number') cutK = 0;
    cutK = (cutK === 1);
    let tmp = (parseInt(searchParams.get("flatcolor")) || hl.random() > 0.05 ? 0 : 1);
    if (typeof tmp != 'number') tmp = hl.random() > 0.05 ? 0 : 1;
    flatColor = (tmp === 1);
    drawHidden = (parseInt(searchParams.get("drawhidden")) || 0);
    if (typeof drawHidden != 'number') drawHidden = 0;
    drawHidden = (drawHidden === 1);
    moved = 0;
}

function createAmbifeuille() {
    JHeightMap = new Array(I * K);
    IKHeightMap = new Array(I * K);
    for (let i = 0; i < I * K; i++) {
        JHeightMap[i] = -1;
        IKHeightMap[i] = -1;
    }
    mainDrawingGrid = new TriangleGrid(0, 0, zoom * 6.0);
    mainDrawingGrid.centerOn(0, jShift, 0);
    frameGrid = new TriangleGrid(0, 0, zoom * 6.0);
    frameGrid.centerOn(0, jShift, 0);
    prepare();
}



function draw() {
    if (moved > 0) {
        redrawbkg = true;
        frameCount = 1;
    }
    if (redrawbkg || frameCount === J + 1) {
        background(backgroundColor);
    }
    if (saveImage) {
        prevWidth = windowWidth
        prevHeight = windowHeight
        resizeCanvas(saveSizeX, saveSizeY)
        background(backgroundColor);
        translate(saveSizeX / 2, saveSizeY / 2);
        scale(min(saveSizeX, saveSizeY) / 1300.0);
        if (frameMode > 0) {
            drawBackground();
            if (abs(iOffset) > 500 && abs(jOffset) > 500 && abs(kOffset) > 500) {
                coordinates("out of range");
            } else {
                coordinates(iOffset * OFFSETFACTOR + "," + jOffset * OFFSETFACTOR + "," + kOffset *
                    OFFSETFACTOR);
            }
            name("iso-ambifeuille sphere");
            addLegend();
            frameGrid.drawDecoration();
        }
        mainDrawingGrid.drawFill();
        noFill();
        mainDrawingGrid.drawOutlines();
        mainDrawingGrid.drawLines();
        save('AMBIFEUILLE' + '_' + Date.now() + '.png')
        resizeCanvas(prevWidth, prevHeight);
        saveImage = false;
        redrawbkg = true;
        frameCount = J;
        return;
    }
    translate(windowWidth / 2, windowHeight / 2);
    drawScale = min(windowWidth / 1300.0, windowHeight / 1300.0);
    scale(drawScale);
    if (moved > 0 && frameMode > 0) {
        drawExplorer();
    }
    if (redrawbkg || frameCount === J + 1) {
        drawBackground();
    }
    moved--;
    if (frameCount <= J) {
        if (perspectiveMode < 3) {
            mainDrawingGrid.addGridLevel(scalarField, frameCount - 1);
           mainDrawingGrid.drawFillJ(frameCount - 1, frameCount - 4);
            noFill();
          mainDrawingGrid.drawOutlinesJ(frameCount - 1, frameCount - 4);
            mainDrawingGrid.drawLinesJ(frameCount - 1, frameCount - 4);
        } else {
            mainDrawingGrid.addGridLevel(scalarField, J - frameCount);
            mainDrawingGrid.drawFillJ(J - frameCount + 2, J - frameCount);
            noFill();
            mainDrawingGrid.drawOutlinesJ(J - frameCount + 3, J - frameCount);
            mainDrawingGrid.drawLinesJ(J - frameCount + 3, J - frameCount);
        }
    } else if (frameCount === J + 1) {
        smoothHeightMap();
        mainDrawingGrid.drawFill();
        noFill();
        mainDrawingGrid.drawOutlines();
        if (outlineMode < 3) mainDrawingGrid.drawLines();
        saveEnabled = true;
        if (hl.context.previewMode) {
            hl.token.capturePreview();
            noLoop();
        }
        info();
    }
    if (redrawbkg || frameCount === J + 1) {
        if (frameMode > 0) {
            if (abs(iOffset) > 500 && abs(jOffset) > 500 && abs(kOffset) > 500) {
                coordinates("out of range");
            } else {
                coordinates(iOffset * OFFSETFACTOR + "," + jOffset * OFFSETFACTOR + "," + kOffset *
                    OFFSETFACTOR);
            }
            name("iso-ambifeuille sphere");
            addLegend();
            addControls();
            addMotion();
            frameGrid.drawDecoration();
        }
        redrawbkg = false;
    }
}

function drawBackground() {
    if (frameMode > 0) {
        if (backgroundMode % 2 === 1) {
            strokeWeight(0.8);
            stroke(0, constrain(1 - 0.2 * moved, 0, 1) * 256);
            let d = (I + padding) / 10.0;
            for (let di = 0; di < 10; di++) {
                isoLine(0, 0, zoom * 6.0, -I / 2 - padding + d * di, -J / 2 - padding, -K / 2 - padding, -I /
                    2 - padding + d * di, J / 2, -K / 2 - padding);
                isoLine(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding, -K / 2 - padding + d * di, -I /
                    2 - padding, J / 2, -K / 2 - padding + d * di);
                isoLine(0, 0, zoom * 6.0, -I / 2 - padding + d * di, -J / 2 - padding, -K / 2 - padding, -I /
                    2 - padding + d * di, -J / 2 - padding, K / 2);
                isoLine(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding, -K / 2 - padding + d * di, I /
                    2, -J / 2 - padding, -K / 2 - padding + d * di);
            }
            d = (J + padding) / 10.0;
            for (let dj = 1; dj < 10; dj++) {
                isoLine(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding + d * dj, -K / 2 - padding, -I /
                    2 - padding, -J / 2 - padding + d * dj, K / 2);
                isoLine(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding + d * dj, -K / 2 - padding, I /
                    2, -J / 2 - padding + d * dj, -K / 2 - padding);
            }
        }
        if (backgroundMode > 1) {
            drawExplorer();
        }
    }
}

function drawExplorer() {
    let bkgI = I + padding;
    let bkgJ = J + padding;
    let ddi = (I + padding) / bkgI;
    let ddj = (J + padding) / bkgJ;
    let d;
    for (let di = 0; di < bkgI; di++) {
        for (let dj = 0; dj < bkgJ; dj++) {
            d = scalarField.value(-padding + ddi * di + iOffset * OFFSETFACTOR, -padding + ddj * dj +
                jOffset * OFFSETFACTOR, -padding + kOffset * OFFSETFACTOR);
            if (d === NUMLAYERS + 1 || d === NUMLAYERS || (d >= 0 && scalarField.layers[d])) {
                noStroke();
                fill(lerpColor(d > NUMLAYERS - 1 ? palettes[NUMLAYERS][1] : lerpColor(palettes[NUMLAYERS][1],
                    color(0), 0.2), color(backgroundColor), backgroundMode > 1 ? 0.0 : constrain(
                    1.1 - moved * 0.1, 0, 1)));
                isoQuad(0, 0, zoom * 6.0, -I / 2 - padding - 0.1 + ddi * di, -J / 2 - padding - 0.1 + ddj *
                    dj, -K / 2 - padding, -I / 2 - padding + 0.1 + ddi * (di + 1), -J / 2 - padding +
                    ddj * dj, -K / 2 - padding, -I / 2 - padding + 0.1 + ddi * (di + 1), -J / 2 -
                    padding + ddj * (dj + 1), -K / 2 - padding, -I / 2 - padding - 0.1 + ddi * di, -J /
                    2 - padding + ddj * (dj + 1), -K / 2 - padding);
            }
        }
    }
    for (let di = 0; di < bkgI; di++) {
        for (let dj = 0; dj < bkgJ; dj++) {
            d = scalarField.value(-padding + iOffset * OFFSETFACTOR, -padding + ddj * dj + jOffset *
                OFFSETFACTOR, -padding + ddi * di + kOffset * OFFSETFACTOR);
            if (d === NUMLAYERS + 1 || d === NUMLAYERS || (d >= 0 && scalarField.layers[d])) {
                noStroke();
                fill(lerpColor(d > NUMLAYERS - 1 ? palettes[NUMLAYERS][1] : lerpColor(palettes[NUMLAYERS][1],
                    color(0), 0.2), color(backgroundColor), backgroundMode > 1 ? 0.0 : constrain(
                    1.1 - moved * 0.1, 0, 1)));
                isoQuad(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding + ddj * dj - 0.1, -K / 2 -
                    padding + ddi * di - 0.1, -I / 2 - padding, -J / 2 - padding + ddj * dj - 0.1, -K /
                    2 - padding + ddi * (di + 1) + 0.1, -I / 2 - padding, -J / 2 - padding + ddj * (dj +
                        1) + 0.1, -K / 2 - padding + ddi * (di + 1) + 0.1, -I / 2 - padding, -J / 2 -
                    padding + ddj * (dj + 1) + 0.1, -K / 2 - padding + ddi * di - 0.1);
            }
        }
    }
    for (let di = 0; di < bkgI; di++) {
        for (let dj = 0; dj < bkgI; dj++) {
            d = scalarField.value(-padding + ddi * dj + iOffset * OFFSETFACTOR, -padding + jOffset *
                OFFSETFACTOR, -padding + ddi * di + kOffset * OFFSETFACTOR);
            if (d === NUMLAYERS + 1 || d === NUMLAYERS || (d >= 0 && scalarField.layers[d])) {
                noStroke();
                fill(lerpColor(d > NUMLAYERS - 1 ? palettes[NUMLAYERS][1] : lerpColor(palettes[NUMLAYERS][1],
                    color(0), 0.2), color(backgroundColor), backgroundMode > 1 ? 0.0 : constrain(
                    1.1 - moved * 0.1, 0, 1)));
                isoQuad(0, 0, zoom * 6.0, -I / 2 - padding - 0.1 + ddi * dj, -J / 2 - padding, -K / 2 -
                    padding - 0.1 + ddi * di, -I / 2 - padding + ddi * (dj + 1) + 0.1, -J / 2 - padding, -
                    K / 2 - padding + ddi * di - 0.1, -I / 2 - padding + ddi * (dj + 1) + 0.1, -J / 2 -
                    padding, -K / 2 - padding + ddi * (di + 1) + 0.1, -I / 2 - padding + ddi * dj - 0.1, -
                    J / 2 - padding, -K / 2 - padding + ddi * (di + 1) + 0.1);
            }
        }
    }
    strokeWeight(0.8);
    stroke(0);
    isoLine(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding, -K / 2 - padding, -I / 2 - padding, J / 2, -
        K / 2 - padding);
    isoLine(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding, -K / 2 - padding, I / 2, -J / 2 - padding, -
        K / 2 - padding);
    isoLine(0, 0, zoom * 6.0, -I / 2 - padding, -J / 2 - padding, -K / 2 - padding, -I / 2 - padding, -J / 2 -
        padding, K / 2);
}

function rescale() {
    let materialsMap = mainDrawingGrid.materials;
    mainDrawingGrid = new TriangleGrid(0, 0, zoom * 6.0);
    mainDrawingGrid.materials = materialsMap;
    mainDrawingGrid.centerOn(0, jShift, 0);
    materialsMap = frameGrid.materials;
    frameGrid = new TriangleGrid(0, 0, zoom * 6.0);
    frameGrid.materials = materialsMap;
    frameGrid.centerOn(0, jShift, 0);
    prepare();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    frameCount = 0;
    mainDrawingGrid.triangleMap.clear();
    loop();
    redrawbkg = true;
}

function prepare() {
    frameCount = 0;
    mainDrawingGrid.triangleMap.clear();
    frameGrid.triangleMap.clear();
    JHeightMap = new Array(I * K);
    for (let i = 0; i < I * K; i++) {
        JHeightMap[i] = 0;
    }
    for (let i = 0; i <= NUMLAYERS; i++) {
        visibleLayers[i] = false;
    }
    saveEnabled = false;
    loop();
    redrawbkg = true;
}