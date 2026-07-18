function extmod(i, n) {
    let nn = max(1, floor(n + 0.5));
    return (i % nn + nn) % nn;
}

function info() {
    console.log("--------------------------------------------------");
    console.log("current parameters");
    console.log("--------------------------------------------------");
    console.log("zoom " + zoom.toFixed(2));
    console.log("io " + iOffset);
    console.log("jo " + jOffset);
    console.log("ko " + kOffset);
    for (let i = 0; i < NUMLAYERS; i++) {
        console.log("layer" + i + " " + (scalarField.layers[i] ? 1 : 0));
    }
    console.log("frame " + frameMode);
    console.log("outline " + outlineMode);
    console.log("background " + backgroundMode);
    console.log("perspective " + perspectiveMode);
    console.log("cuti " + (cutI ? 1 : 0));
    console.log("cutk " + (cutK ? 1 : 0));
    console.log("iteration " + inclusionIteration);
    console.log("inclusionseed " + inclusionSeed);
    console.log("flatcolor " + (flatColor ? 1 : 0));
    console.log("drawhidden " + (drawHidden ? 1 : 0));
    console.log("--------------------------------------------------");
    let URLOptions = "zoom=" + zoom.toFixed(2) + "&io=" + iOffset + "&jo=" + jOffset + "&ko=" + kOffset;
    for (let i = 0; i < NUMLAYERS; i++) {
        URLOptions += ("&layer" + i + "=" + (scalarField.layers[i] ? 1 : 0));
    }
    URLOptions += "&frame=" + frameMode;
    URLOptions += "&outline=" + outlineMode;
    URLOptions += "&background=" + backgroundMode;
    URLOptions += "&perspective=" + perspectiveMode;
    URLOptions += "&cuti=" + (cutI ? 1 : 0);
    URLOptions += "&cutk=" + (cutK ? 1 : 0);
    URLOptions += "&iteration=" + inclusionIteration;
    URLOptions += "&inclusionseed=" + inclusionSeed;
    URLOptions += "&flatcolor=" + (flatColor ? 1 : 0);
    URLOptions += "&drawhidden=" + (drawHidden ? 1 : 0);
    console.log(URLOptions);
}

function smoothHeightMap() {
    let tmpHeightMap = new Array(I * K);
    let v;
    let c;
    for (let i = 0; i < I * K; i++) {
        for (let k = 0; k < K; k++) {
            v = JHeightMap[k + K * i];
            c = 2.0;
            if (i > 0) {
                v += JHeightMap[k + K * (i - 1)];
                c += 1.0;
            }
            if (i < I - 1) {
                v += JHeightMap[k + K * (i + 1)];
                c += 1.0;
            }
            if (k > 0) {
                v += JHeightMap[k - 1 + K * i];
                c += 1.0;
            }
            if (k < K - 1) {
                v += JHeightMap[k + 1 + K * i];
                c += 1.0;
            }
            tmpHeightMap[k + K * i] = v / c;
        }
    }
    for (let i = 0; i < I * K; i++) {
        for (let k = 0; k < K; k++) {
            v = tmpHeightMap[k + K * i];
            c = 2.0;
            if (i > 0) {
                v += tmpHeightMap[k + K * (i - 1)];
                c += 1.0;
            }
            if (i < I - 1) {
                v += tmpHeightMap[k + K * (i + 1)];
                c += 1.0;
            }
            if (k > 0) {
                v += tmpHeightMap[k - 1 + K * i];
                c += 1.0;
            }
            if (k < K - 1) {
                v += tmpHeightMap[k + 1 + K * i];
                c += 1.0;
            }
            IKHeightMap[k + K * i] = v / c;
        }
    }
}

function isoX(ox, oy, L, i, j, k) {
    return ox + 3 * (i - k) * SQRT3O6 * L;
}

function isoY(ox, oy, L, i, j, k) {
    return oy - (2.0 * j - i - k) * 0.5 * L;
}

function isoVertex(ox, oy, L, i, j, k) {
    vertex(ox + 3 * (i - k) * SQRT3O6 * L, oy - (2.0 * j - i - k) * 0.5 * L);
}

function isoLine(ox, oy, L, i, j, k, i2, j2, k2) {
    line(ox + 3 * (i - k) * SQRT3O6 * L, oy - (2.0 * j - i - k) * 0.5 * L, ox + 3 * (i2 - k2) * SQRT3O6 * L,
        oy - (2.0 * j2 - i2 - k2) * 0.5 * L);
}

function isoQuad(ox, oy, L, i, j, k, i2, j2, k2, i3, j3, k3, i4, j4, k4) {
    beginShape();
    isoVertex(ox, oy, L, i, j, k);
    isoVertex(ox, oy, L, i2, j2, k2);
    isoVertex(ox, oy, L, i3, j3, k3);
    isoVertex(ox, oy, L, i4, j4, k4);
    endShape(CLOSE);
}

function updateSector() {
    let newSectorI = Math.floor((iOffset + SECTORHALFSIZE) / (2 * SECTORHALFSIZE));
    let newSectorJ = Math.floor((jOffset + SECTORHALFSIZE) / (2 * SECTORHALFSIZE));
    let newSectorK = Math.floor((kOffset + SECTORHALFSIZE) / (2 * SECTORHALFSIZE));
    if (sectorI != newSectorI || sectorJ != newSectorJ || sectorK != newSectorK) {
        sectorI = newSectorI;
        sectorJ = newSectorJ;
        sectorK = newSectorK;
        console.log("Entering new sector [" + sectorI + ", " + sectorJ + ", " + sectorK +
            "]. Scanning for inclusions.");
        inclusionSeed = hl.randomInt(1000000);
        createInclusions();
        inclusionIteration++;
    }
}

function updateSectorNoInclusion() {
    sectorI = Math.floor((iOffset + SECTORHALFSIZE) / (2 * SECTORHALFSIZE));
    sectorJ = Math.floor((jOffset + SECTORHALFSIZE) / (2 * SECTORHALFSIZE));
    sectorK = Math.floor((kOffset + SECTORHALFSIZE) / (2 * SECTORHALFSIZE));
}


let description = 
"One generator out of a series of 256.\n" +
"\n" +
"The isoverse manifests although we might not always see.\n";