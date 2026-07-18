function addLegend() {
    legendX = [];
    legendY = [];
    for (let l = 0; l < NUMLAYERS; l++) {
        for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 3; k++) {
                for (let j = 0; j < 3; j++) {
                    if ((!blockedLayers[l][0] || i != 1) && (!blockedLayers[l][1] || j != 1) && (!
                            blockedLayers[l][2] || k != 1)) frameGrid.addCube(I - 1 + padding - i, 7 * l - j +
                        padding / 2, -padding - k, l % NUMPALETTES, NUMLAYERS + 64 + l);
                }
            }
        }
        legendX[l] = isoX(0, 0, 6 * zoom, I - 1 + padding, 7 * l + padding / 2 - jShift, -padding);
        legendY[l] = isoY(0, 0, 6 * zoom, I - 1 + padding, 7 * l + padding / 2 - jShift, -padding);
    }
    for (let i = 0; i < 3; i += 2) {
        for (let k = 0; k < 3; k += 2) {
            for (let j = 0; j < NUMLAYERS + 3; j++) {
                frameGrid.addCube(I - 1 + padding - i, 7 * NUMLAYERS + j + padding / 2, -padding - k,
                    NUMLAYERS, 2 * NUMLAYERS + 64);
            }
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                frameGrid.addCube(I - 1 + padding - i, 9 * NUMLAYERS + j + padding / 2, -padding - k,
                    NUMLAYERS + 1, 2 * NUMLAYERS + 65);
            }
        }
    }
}

function addControls() {
    controlX = [];
    controlY = [];
    let dl = padding / 2;
    for (let l = 0; l < 8; l++) {
        controlX[l] = isoX(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
        controlY[l] = isoY(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
        dl += (l === 0) ? 8 : 7;
    }
    dl = padding / 2;
    let l = 0;
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 3; k++) {
                if ((i === 2 || j === 2 || k === 2) && !(i > 0 && k > 0 && j > 0)) frameGrid.addCube(-
                    padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 128, NUMLAYERS + 128, false);
            }
        }
    }
    dl += 8;
    l = 1;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 4; j += 3) {
                let flip = false;
                if (perspectiveMode === 0 || perspectiveMode === 3) {
                    flip = j < 2;
                } else if (perspectiveMode === 1) {
                    flip = false;
                } else if (perspectiveMode === 2) {
                    flip = true;
                }
                frameGrid.addCube(-padding - i, perspectiveMode === 3 ? dl - 3 + j : dl - j, K - 1 + padding -
                    k, NUMLAYERS + 128, NUMLAYERS + 128, flip);
            }
        }
    }
    dl += 7;
    l = 2;
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 3; k++) {
                if (backgroundMode % 2 === 0 || (i != 1 && j != 1 && k != 1)) frameGrid.addCube(-padding - i,
                    dl - j, K - 1 + padding - k, backgroundMode > 1 ? NUMLAYERS : NUMLAYERS + 128,
                    NUMLAYERS + 128, false);
            }
        }
    }
    dl += 7;
    l = 3;
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i += 2) {
            for (let k = 0; k < 3; k++) {
                frameGrid.addCube(-padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 512, NUMLAYERS + 512,
                    false);
                if (frameMode === 1 && frameCount <= J) mainDrawingGrid.addCube(-padding - i, dl - j, K - 1 +
                    padding - k, NUMLAYERS, NUMLAYERS + 128+i, false);
            }
        }
    }
    dl += 7;
    l = 4;
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 3; k++) {
                if (cutI && !cutK) {
                    if (i === 2 || (j === 2 && i === 0)) frameGrid.addCube(-padding - i, dl - j, K - 1 +
                        padding - k, NUMLAYERS + 256, NUMLAYERS + 256, false);
                } else if (!cutI && cutK) {
                    if (k === 2 || (j === 2 && k === 0)) frameGrid.addCube(-padding - i, dl - j, K - 1 +
                        padding - k, NUMLAYERS + 256, NUMLAYERS + 256, false);
                } else if (cutI && cutK) {
                    if (k === 2 || i === 2 || (j === 2 && i === 0 && k === 0)) frameGrid.addCube(-padding - i,
                        dl - j, K - 1 + padding - k, NUMLAYERS + 256, NUMLAYERS + 256, false);
                } else {
                    frameGrid.addCube(-padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 256, NUMLAYERS +
                        256, false);
                }
            }
        }
    }
    dl += 7;
    l = 5;
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 3; k++) {
                if (drawHidden) {
                    frameGrid.addCube(-padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 256, NUMLAYERS +
                        256 + k, false);
                } else {
                    if (k === 0 || k === 2) frameGrid.addCube(-padding - i, dl - j, K - 1 + padding - k,
                        NUMLAYERS + 256, NUMLAYERS + 256, false);
                }
            }
        }
    }
    dl += 7;
    l = 6;
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 3; k++) {
                if ((i === 1 && j === 1) || (i === 1 && k === 1) || (j === 1 && k === 1)) frameGrid.addCube(-
                    padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 256, NUMLAYERS + 256, false);
            }
        }
    }
    dl += 7;
    l = 7;
    let offset = abs(iOffset) + abs(jOffset) + abs(kOffset);
    for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
            for (let k = 0; k < 3; k++) {
                if (offset > 0) {
                    if ((!(i === 0 && j === 1 && k === 1) || iOffset === 0) && (!(j === 0 && i === 1 && k ===
                            1) || jOffset === 0) && (!(k === 0 && i === 1 && j === 1) || kOffset === 0))
                        frameGrid.addCube(-padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 256,
                            NUMLAYERS + 256, false);
                } else {
                    if (i != 0 || j != 0 || k != 0) frameGrid.addCube(-padding - i, dl - j, K - 1 + padding -
                        k, NUMLAYERS + 256, NUMLAYERS + 256, false);
                }
            }
        }
    }
}

function addMotion() {
    motionX = [];
    motionY = [];
    let l = 0;
    let dl = 58 + padding / 2
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if ((i === 1 && j === 1 && k === 1) || (i === 0 || (j === 1 && k === 1))) frameGrid.addCube(-
                    padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    l = 1;
    dl += 7;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if ((j === 1 && k === 1) || i === 2) frameGrid.addCube(-padding - i + 1, dl - j, K - 1 +
                    padding - k, NUMLAYERS + 256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding + 1, dl - jShift, K - 1 + padding);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding + 1, dl - jShift, K - 1 + padding);
    l = 2;
    dl += 7;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if ((i === 1 && k === 1) || (j === 2)) frameGrid.addCube(-padding - i, dl - j, K - 1 +
                    padding - k, NUMLAYERS + 256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    l = 3;
    dl += 6;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if ((i === 1 && j === 1 && k === 1) || (j === 0 || (i === 1 && k === 1))) frameGrid.addCube(-
                    padding - i, dl - j, K - 1 + padding - k, NUMLAYERS + 256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    l = 4;
    dl += 8;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if ((i === 1 && j === 1) || (k === 0)) frameGrid.addCube(-padding - i + 1, dl - j, K - 1 +
                    padding - k, NUMLAYERS + 256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding + 1, dl - jShift, K - 1 + padding);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding + 1, dl - jShift, K - 1 + padding);
    l = 5;
    dl += 6;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if ((i === 1 && j === 1) || (k === 2)) frameGrid.addCube(-padding - i, dl - j, K - 1 +
                    padding - k, NUMLAYERS + 256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding, dl - jShift, K - 1 + padding);
    l = 6;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if ((i === 1 && k === 1) || (i == 1 && j == 1)) frameGrid.addCube(i - padding, J + padding -
                    j, K + 1 - k, NUMLAYERS + 256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding, J + padding - jShift, K + 1);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding, J + padding - jShift, K + 1);
    l = 7;
    for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 3; k++) {
            for (let j = 0; j < 3; j++) {
                if (i === 1 && j === 1) frameGrid.addCube(i - padding, J + padding - j, K - 5 - k, NUMLAYERS +
                    256, NUMLAYERS + 256);
            }
        }
    }
    motionX[l] = isoX(0, 0, 6 * zoom, -padding, J + padding - jShift, K - 5);
    motionY[l] = isoY(0, 0, 6 * zoom, -padding, J + padding - jShift, K - 5);
}

function keyPressed() {
    if (keyCode === LEFT_ARROW) {
        iOffset++;
        updateSector();
        prepare();
        moved = 16;
    } else if (keyCode === RIGHT_ARROW) {
        iOffset--;
        updateSector();
        prepare();
        moved = 16;
    } else if (keyCode === UP_ARROW) {
        kOffset++;
        updateSector();
        prepare();
        moved = 16;
    } else if (keyCode === DOWN_ARROW) {
        kOffset--;
        updateSector();
        prepare();
        moved = 16;
    } else if (key === '+') {
        jOffset--;
        updateSector();
        prepare();
        moved = 16;
    } else if (key === '-') {
        jOffset++;
        updateSector();
        prepare();
        moved = 16;
    } else if (key === 'r' || key === 'R') {
        iOffset = 0;
        jOffset = 0;
        kOffset = 0;
        updateSector();
        zoom = 1.0;
        prepare();
    } else if (key === 'c' || key === 'C') {
        jumpToNextInclusion();
    } else if (key === 'f' || key === 'F') {
        frameMode = (frameMode + 1) % 3;
        prepare();
        redrawbkg = true;
    } else if (key === 'g' || key === 'G') {
        cutI = !cutI;
        prepare();
        redrawbkg = true;
    } else if (key === 'h' || key === 'H') {
        cutK = !cutK;
        prepare();
        redrawbkg = true;
    } else if (key === 'p' || key === 'P') {
        perspectiveMode = (perspectiveMode + 1) % 4;
        prepare();
        redrawbkg = true;
    } else if (key === 's' || key === 'S') {
        if (saveEnabled) {
            saveImage = true;
            saveSizeX = 4800;//Math.floor(4800* windowWidth/windowHeight);
            saveSizeY = 4800;
            loop();
        }
    } else if (key === 'a' || key === 'A') {
        let lz = zoom;
        zoom += 0.05;
        if (zoom > 4) zoom = 4;
        if (lz != zoom) rescale();
    } else if (key === 'q' || key === 'Q') {
        let lz = zoom;
        zoom -= 0.05;
        if (zoom < 0.4) zoom = 0.4;
        if (lz != zoom) rescale();
    } else if (key === 'x' || key === 'X') {
        drawHidden = !drawHidden;
        prepare();
    } else if (key === 'o' || key === 'O') {
        outlineMode = (outlineMode + 1) % 4;
        prepare();
    } else if (key === 'b' || key === 'B') {
        backgroundMode = (backgroundMode + 1) % 4;
        prepare();
    } else if (key === '0') {
        scalarField.layers[0] = !scalarField.layers[0];
        prepare();
    } else if (key === '1') {
        scalarField.layers[1] = !scalarField.layers[1];
        prepare();
    } else if (key === '2') {
        scalarField.layers[2] = !scalarField.layers[2];
        prepare();
    } else if (key === '3') {
        scalarField.layers[3] = !scalarField.layers[3];
        prepare();
    } else if (key === '4') {
        scalarField.layers[4] = !scalarField.layers[4];
        prepare();
    } else if (key === '5') {
        scalarField.layers[5] = !scalarField.layers[5];
        prepare();
    } else if (key === '6') {
        scalarField.layers[6] = !scalarField.layers[6];
        prepare();
    } else if (key === '7') {
        scalarField.layers[7] = !scalarField.layers[7];
        prepare();
    } else if (key === '8') {
        scalarField.layers[8] = !scalarField.layers[8];
        prepare();
    } else if (key === '9') {
        scalarField.layers[9] = !scalarField.layers[9];
        prepare();
    }else if (key === 'v') {
        changeColors();
        prepare();
    }
}

function jumpToNextInclusion() {
    currentInclusion = (currentInclusion + 1);
    if (currentInclusion === NUMINCLUSIONS) {
        createInclusions();
        inclusionIteration++;
        currentInclusion = (currentInclusion + 1);
    }
    console.log("Scanning inclusion [" + sectorI + ", " + sectorJ + ", " + sectorK + "]-" + (
        inclusionIteration + 1) + "-" + (currentInclusion + 1) + ".");
    iOffset = Math.round((inclusions[currentInclusion].originI - I / 2) / OFFSETFACTOR);
    jOffset = Math.round((inclusions[currentInclusion].originJ - J / 2) / OFFSETFACTOR);
    kOffset = Math.round((inclusions[currentInclusion].originK - K / 2) / OFFSETFACTOR);
    updateSector();
    moved = 16;
    prepare();
}

function mousePressed() {
    if(touches && touches.length>0) return;
    if (frameMode === 2) {
        frameMode = 0;
        prepare();
        return;
    } else if (frameMode === 0) {
        frameMode = 1;
        prepare();
        return;
    }
    let clickX = (mouseX - windowWidth / 2) / drawScale;
    let clickY = (mouseY - windowHeight / 2) / drawScale;
    if (clickX < 0) {
        if (over(clickX, clickY, controlX[0], controlY[0])) {
            frameMode = (frameMode + 1) % 3;
            prepare();
            redrawbkg = true;
            return;
        }
        if (over(clickX, clickY, controlX[1], controlY[1])) {
            perspectiveMode = (perspectiveMode + 1) % 4;
            prepare();
            redrawbkg = true;
            return;
        }
        if (over(clickX, clickY, controlX[2], controlY[2])) {
            backgroundMode = (backgroundMode + 1) % 4;
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[3], controlY[3])) {
            outlineMode = (outlineMode + 1) % 4;
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[4], controlY[4])) {
            if (!cutI && !cutK) {
                cutI = true;
                cutK = false;
            } else if (cutI && !cutK) {
                cutI = false;
                cutK = true;
            } else if (!cutI && cutK) {
                cutI = true;
                cutK = true;
            } else {
                cutI = false;
                cutK = false;
            }
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[5], controlY[5])) {
            drawHidden = !drawHidden;
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[6], controlY[6])) {
            jumpToNextInclusion();
            return;
        }
        if (over(clickX, clickY, controlX[7], controlY[7])) {
            iOffset = 0;
            jOffset = 0;
            kOffset = 0;
            updateSector();
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[4], controlY[4])) {
            if (!cutI && !cutK) {
                cutI = true;
                cutK = false;
            } else if (cutI && !cutK) {
                cutI = false;
                cutK = true;
            } else if (!cutI && cutK) {
                cutI = true;
                cutK = true;
            } else {
                cutI = false;
                cutK = false;
            }
            prepare();
            return;
        }
        if (over(clickX, clickY, motionX[0], motionY[0])) {
            iOffset++;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[1], motionY[1])) {
            iOffset--;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[3], motionY[3])) {
            jOffset++;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[2], motionY[2])) {
            jOffset--;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[4], motionY[4])) {
            kOffset++;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[5], motionY[5])) {
            kOffset--;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[6], motionY[6])) {
            let lz = zoom;
            zoom += 0.05;
            if (zoom > 4) zoom = 4;
            if (lz != zoom) rescale();
            return;
        }
        if (over(clickX, clickY, motionX[7], motionY[7])) {
            let lz = zoom;
            zoom -= 0.05;
            if (zoom < 0.4) zoom = 0.4;
            if (lz != zoom) rescale();
            return;
        }
    } else {
        for (let l = 0; l < NUMLAYERS; l++) {
            if (over(clickX, clickY, legendX[l], legendY[l])) {
                scalarField.layers[l] = !scalarField.layers[l];
                prepare();
                return;
            }
        }
    }
}
function touchStarted() {
}

function touchEnded() {
    if(touches && touches.length>0){
    if (frameMode === 2) {
        frameMode = 0;
        prepare();
        return;
    } else if (frameMode === 0) {
        frameMode = 1;
        prepare();
        return;
    }
    let clickX = (touches[0].x - windowWidth / 2) / drawScale;
    let clickY = (touches[0].y - windowHeight / 2) / drawScale;
    if (clickX < 0) {
        if (over(clickX, clickY, controlX[0], controlY[0])) {
            frameMode = (frameMode + 1) % 3;
            prepare();
            redrawbkg = true;
            return;
        }
        if (over(clickX, clickY, controlX[1], controlY[1])) {
            perspectiveMode = (perspectiveMode + 1) % 4;
            prepare();
            redrawbkg = true;
            return;
        }
        if (over(clickX, clickY, controlX[2], controlY[2])) {
            backgroundMode = (backgroundMode + 1) % 4;
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[3], controlY[3])) {
            outlineMode = (outlineMode + 1) % 4;
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[4], controlY[4])) {
            if (!cutI && !cutK) {
                cutI = true;
                cutK = false;
            } else if (cutI && !cutK) {
                cutI = false;
                cutK = true;
            } else if (!cutI && cutK) {
                cutI = true;
                cutK = true;
            } else {
                cutI = false;
                cutK = false;
            }
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[5], controlY[5])) {
            drawHidden = !drawHidden;
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[6], controlY[6])) {
            jumpToNextInclusion();
            return;
        }
        if (over(clickX, clickY, controlX[7], controlY[7])) {
            iOffset = 0;
            jOffset = 0;
            kOffset = 0;
            updateSector();
            prepare();
            return;
        }
        if (over(clickX, clickY, controlX[4], controlY[4])) {
            if (!cutI && !cutK) {
                cutI = true;
                cutK = false;
            } else if (cutI && !cutK) {
                cutI = false;
                cutK = true;
            } else if (!cutI && cutK) {
                cutI = true;
                cutK = true;
            } else {
                cutI = false;
                cutK = false;
            }
            prepare();
            return;
        }
        if (over(clickX, clickY, motionX[0], motionY[0])) {
            iOffset++;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[1], motionY[1])) {
            iOffset--;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[3], motionY[3])) {
            jOffset++;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[2], motionY[2])) {
            jOffset--;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[4], motionY[4])) {
            kOffset++;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[5], motionY[5])) {
            kOffset--;
            updateSector();
            prepare();
            moved = 16;
            return;
        }
        if (over(clickX, clickY, motionX[6], motionY[6])) {
            let lz = zoom;
            zoom += 0.05;
            if (zoom > 4) zoom = 4;
            if (lz != zoom) rescale();
            return;
        }
        if (over(clickX, clickY, motionX[7], motionY[7])) {
            let lz = zoom;
            zoom -= 0.05;
            if (zoom < 0.4) zoom = 0.4;
            if (lz != zoom) rescale();
            return;
        }
    } else {
        for (let l = 0; l < NUMLAYERS; l++) {
            if (over(clickX, clickY, legendX[l], legendY[l])) {
                scalarField.layers[l] = !scalarField.layers[l];
                prepare();
                return;
            }
        }
    }
}
}

function over(x, y, targetX, targetY) {
    return abs(x - targetX) < zoom * 15 && abs(y - targetY) < zoom * 15;
}

function coordinates(str) {
    let chr;
    let top = -padding - 6;
    let run = -padding;
    let pattern;
    for (let c = 0; c < str.length; c++) {
        chr = str.toLowerCase().charAt(c);
        pattern = getChar3xN(chr, 5);
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                if (pattern[i][j]) frameGrid.addCube(j + run, top - i, K - 1, NUMLAYERS + 256, NUMLAYERS +
                    256);
            }
        }
        run += 4;
    }
}

function name(str) {
    let chr;
    let top = -padding - 6;
    let run = -padding;
    let pattern;
    for (let c = str.length - 1; c >= 0; c--) {
        chr = str.toLowerCase().charAt(c);
        pattern = getChar3xN(chr, 5);
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                if (pattern[i][j]) frameGrid.addCube(I - 1, top - i, (2 - j) + run, 0, NUMLAYERS + 96);
            }
        }
        run += 4;
    }
}