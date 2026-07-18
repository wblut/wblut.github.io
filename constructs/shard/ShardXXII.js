'use strict'
p5.disableFriendlyErrors = true;
let OMEPS = 0.9999;
let EPS = 0.0001;
let OPEPS = 1.0001;
let gl;
let slices;
let side;
let zoom, manualZoom;
let base, meshes, newMeshes;
let points;
let planes;
let numPoints;
let chance = 1.5;
let active;
let sliceMode;
let pattern;
const UNIFORMPATTERN = 0;
const VERTICALPATTERN = 1;
const PLANEPATTERN = 2;
const RADIALPATTERN = 3; //points
const SPLINTERPATTERN = 3; //planes
const ORTHOPATTERN = 4;
let viewMode;
const RENDERVIEW = 0;
const UNBROKENVIEW = 1;
const ROTATIONVIEW = 2;
const SLICEVIEW = 3;
const EXPLODEVIEW = 4;
const EXPLODEDVIEW = 5;
const MESHVIEW = 6;
const NUMVIEWMODES = 7;
let blackMode;
let shadeMode;
let inside, outside, lineColor, lineWidth, bkg;
let geometryMode;
const TRUNCATEDOCTAHEDRON = 0;
const OCTAGONALPRISM = 1;
const TRUNCATEDCUBE = 2;
const GEM = 3;
const CRYSTAL = 4;
let geometryParameter;
let geometryZoom;
let explodeMode;
const UNIFORMEXPLODE = 0;
const GRADIENTYEXPLODE = 1;
const SYMMETRICYEXPLODE = 2;
const GRADIENTXEXPLODE = 3;
const RADIALEXPLODE = 4;
let direction;
let ay;
let autoSlices;
let hue;
let black, grey;
let sat;
let minx, maxx, centerx, rangex;
let miny, maxy, centery, rangey;
let minz, maxz, centerz, rangez;
let dx, dy, dz;
let auto;
let elapsedTime, prevTime;
let refresh;
let explode;
let fixedMesh;
let scatterDirection;
let scatterFactor;
let scatter;
let bkgMode;
let light1, light2, light3, light4, lightAngle;
let hueplus, hueplus2;
let fail;
let viewAngle;
const rndRng = (a, b) => {
    return a + (b - a) * fxrand();
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    gl = document.getElementById('defaultCanvas0').getContext('webgl');
    colorMode(HSB);
    viewMode = RENDERVIEW;
    sliceMode = rndRng(0, 100) < 50 ? 0 : 1;
    autoSlices = (sliceMode === 0) ? 60 : 20;
    hue = rndRng(0, 360);
    hueplus = rndRng(70, 110);
    hueplus2 = rndRng(160, 200);
    blackMode = rndRng(0, 100) < 50;
    black = blackMode ? color(0) : color(hue, 20, 10);
    grey = blackMode ? color(10) : color(hue, 10, 20);
    shadeMode = Math.floor(rndRng(0, 5));
    inside = (shadeMode === 0) ? color(100) : (shadeMode === 1) ? black : (shadeMode === 2) ? grey :(shadeMode === 3) ? color(100) : color(100);
    outside = (shadeMode === 0) ? black : (shadeMode === 1) ? color(100) : (shadeMode === 2) ? color(100) : (shadeMode === 3) ? color(100):grey;
    lineColor = color(0, 0.99);
    bkgMode = rndRng(0, 100) < 50;
    bkg = color(15) ;
    geometryMode = Math.floor(rndRng(0, 5));
    geometryParameter = rndRng(0.0, 1.0);
    pattern = Math.floor(rndRng(0, 5));
    explodeMode = Math.floor(rndRng(0, 5));
    direction = Math.floor(rndRng(0, 2));
    sat = rndRng(36, 50);
    centery = 0;
    side = 600;
    explode = true;
    let angle = (2 * Math.floor(rndRng(0, 4)) + 1) * Math.PI * 0.25;
    scatterDirection = new p5.Vector(Math.cos(angle), Math.sin(angle), 0);
    scatterFactor = rndRng(0.2, 2.0);
    scatter = true;
    initialScale();
    initialGeometry();
    ay = Math.PI;
    while (slices < autoSlices / 4) {
        addSlice();
    }
    auto = false;
    refresh = true;
    ellipseMode(CENTER);
    manualZoom = 1.0;
    let angleRoll = Math.floor(rndRng(-4, 5));
    viewAngle = angleRoll * Math.PI / 20;
    lightAngle = 0;
    light1 = true;
    light2 = true;
    light3 = true;
    light4 = shadeMode === 0;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    refresh = true;
}

function initialScale() {
    if (geometryMode === TRUNCATEDOCTAHEDRON) {
        dx = side / 2.0 * rndRng(0.75, 1.25);
        dy = side / 2.0 * rndRng(1.5, 2.4);
        dz = side / 2.0 * rndRng(0.75, 1.25);
        geometryZoom = 0.75;
    } else if (geometryMode === OCTAGONALPRISM) {
        dx = side / 2.0 * rndRng(0.5, 0.8);
        dy = side / 2.0 * rndRng(1., 1.6);
        dz = dx;
        geometryZoom = 0.7;
    } else if (geometryMode === TRUNCATEDCUBE) {
        dx = side / 2.0 * rndRng(1., 1.6);
        dy = dx;
        dz = dx;
        geometryZoom = 0.6;
    } else if (geometryMode === GEM) {
        dx = side / 2.0 * rndRng(0.8, 1.2);
        dy = side / 2.0 * rndRng(0.8, 1.2);
        dz = side / 2.0 * rndRng(0.1, 0.4);
        geometryZoom = 0.7;
    } else if (geometryMode === CRYSTAL) {
        dx = side / 2.0 * rndRng(0.25, 0.4);
        dy = side / 2.0 * rndRng(1., 1.6);
        dz = dx;
        geometryZoom = 0.75;
    }
}

function initialGeometry() {
    let failed = false;
    try {
        meshes = [];
        newMeshes = [];
        slices = 0;
        fixedMesh = 0;
        meshes.length = 0;
        let mesh = new SliceMesh();
        if (geometryMode === TRUNCATEDOCTAHEDRON) {
            let pm = (0.5 - 0.15 * geometryParameter);
            let pm2 = (0.5 - 0.15 * geometryParameter);
            mesh.create(MeshDataFactory.createOctahedronWithCenterAndSize(0, 0, 0, dx * (1 + pm2), dy * (1 + pm), dz * (1 + pm2), outside));
            mesh.slice(new Plane(new p5.Vector(pm2 * dx, 0, 0), new p5.Vector(rndRng(0.95, 1.0), rndRng(-0.05, 0.05), rndRng(-0.05, 0.05))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm2 * dx, 0, 0), new p5.Vector(-rndRng(0.95, 1.0), rndRng(-0.05, 0.05), rndRng(-0.05, 0.05))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, pm * dy, 0), new p5.Vector(rndRng(-0.05, 0.05), rndRng(0.95, 1.0), rndRng(-0.05, 0.05))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, -pm * dy, 0), new p5.Vector(rndRng(-0.05, 0.05), -rndRng(0.95, 1.0), rndRng(-0.05, 0.05))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, 0, pm2 * dz), new p5.Vector(rndRng(-0.05, 0.05), rndRng(-0.05, 0.05), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, 0, -pm2 * dz), new p5.Vector(rndRng(-0.05, 0.05), rndRng(-0.05, 0.05), -rndRng(0.95, 1.0))), 0, outside, 0);
        } else if (geometryMode === OCTAGONALPRISM) {
            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx, dy, dz, outside));
            let pm = (0.5 - 0.25 * geometryParameter);
            mesh.slice(new Plane(new p5.Vector(pm * dx, 0, pm * dx), new p5.Vector(rndRng(0.95, 1.0), rndRng(-0.05, 0.05), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, 0, pm * dx), new p5.Vector(-rndRng(0.95, 1.0), rndRng(-0.05, 0.05), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm * dx, 0, -pm * dz), new p5.Vector(rndRng(0.95, 1.0), rndRng(-0.05, 0.05), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, 0, -pm * dz), new p5.Vector(-rndRng(0.95, 1.0), rndRng(-0.05, 0.05), -rndRng(0.95, 1.0))), 0, outside, 0);
        } else if (geometryMode === TRUNCATEDCUBE) {
            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx, dy, dz, outside));
            let pm = (0.5 - 0.25 * geometryParameter);
            mesh.slice(new Plane(new p5.Vector(pm * dx, pm * dy, pm * dz), new p5.Vector(rndRng(0.95, 1.0), rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, pm * dy, pm * dz), new p5.Vector(-rndRng(0.95, 1.0), rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm * dx, -pm * dy, pm * dz), new p5.Vector(rndRng(0.95, 1.0), -rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, -pm * dy, pm * dz), new p5.Vector(-rndRng(0.95, 1.0), -rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm * dx, pm * dy, -pm * dz), new p5.Vector(rndRng(0.95, 1.0), rndRng(0.95, 1.0), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, pm * dy, -pm * dz), new p5.Vector(-rndRng(0.95, 1.0), rndRng(0.95, 1.0), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm * dx, -pm * dy, -pm * dz), new p5.Vector(rndRng(0.95, 1.0), -rndRng(0.95, 1.0), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, -pm * dy, -pm * dz), new p5.Vector(-rndRng(0.95, 1.0), -rndRng(0.95, 1.0), -rndRng(0.95, 1.0))), 0, outside, 0);
        } else if (geometryMode === GEM) {
            let pm = (0.48 - 0.10 * geometryParameter);
            let pm2 = (0.42 - 0.05 * geometryParameter);
            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx, dy, dz, outside));
            mesh.slice(new Plane(new p5.Vector(-pm2 * dx, -pm2 * dy, pm2 * dz), new p5.Vector(-rndRng(0.95, 1.0), -rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm2 * dx, -pm2 * dy, pm2 * dz), new p5.Vector(rndRng(0.95, 1.0), -rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm2 * dx, pm2 * dy, pm2 * dz), new p5.Vector(-rndRng(0.95, 1.0), rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm2 * dx, pm2 * dy, pm2 * dz), new p5.Vector(rndRng(0.95, 1.0), rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, 0, -pm * dz), new p5.Vector(-rndRng(0.95, 1.0), rndRng(-0.05, 0.05), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm * dx, 0, -pm * dz), new p5.Vector(rndRng(0.95, 1.0), rndRng(-0.05, 0.05), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(-pm * dx, 0, pm * dz), new p5.Vector(-rndRng(0.95, 1.0), rndRng(-0.05, 0.05), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(pm * dx, 0, pm * dz), new p5.Vector(rndRng(0.95, 1.0), rndRng(-0.05, 0.05), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, -pm * dy, -pm * dz), new p5.Vector(rndRng(-0.05, 0.05), -rndRng(0.95, 1.0), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, -pm * dy, pm * dz), new p5.Vector(rndRng(-0.05, 0.05), -rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, pm * dy, -pm * dz), new p5.Vector(rndRng(-0.05, 0.05), rndRng(0.95, 1.0), -rndRng(0.95, 1.0))), 0, outside, 0);
            mesh.slice(new Plane(new p5.Vector(0, pm * dy, pm * dz), new p5.Vector(rndRng(-0.05, 0.05), rndRng(0.95, 1.0), rndRng(0.95, 1.0))), 0, outside, 0);
        } else if (geometryMode === CRYSTAL) {
            let radius = 0.8 * dx;
            let pen = 0.3 * radius;
            let pm = (1.0 - 0.20 * geometryParameter);
            let pm2 = pm; //+rndRng(0.1,0.3)*radius;
            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, 2 * dx, dy, 2 * dz, outside));
            for (let i = 0; i < 6; i++) {
                let o = p5.Vector.fromAngles(0.5 * Math.PI, map(i, 0, 6, 0, 2.0 * Math.PI));
                let n = new p5.Vector(o.x, o.y, o.z);
                o.mult(radius);
                mesh.slice(new Plane(o, n), 0, outside, 0);
                o = new p5.Vector(o.x, -pm * dy, o.z);
                n = p5.Vector.fromAngles(-radians(rndRng(47, 57)), map(i, 0, 6, 0, 2.0 * Math.PI));
                mesh.slice(new Plane(o, n), pen, outside, 0);
                o = new p5.Vector(o.x, -pm * dy, o.z);
                n = p5.Vector.fromAngles(-radians(rndRng(47, 57)), map(i, 0, 6, 0, 2.0 * Math.PI) + Math.PI / 6.0);
                mesh.slice(new Plane(o, n), 1.2 * pen, outside, 0);
                o = new p5.Vector(-o.x, pm * dy, -o.z);
                n = new p5.Vector(-n.x, -n.y, -n.z);
                mesh.slice(new Plane(o, n), 1.2 * pen, outside, 0);
            }
            mesh.vertices.forEach(vertex => {
                let df = map(vertex.y, -dy / 2, dy / 2, 1.4, 0.6);
                vertex.x *= df;
                vertex.z *= df;
            });
            mesh.getExtents();
            mesh.getCenter();
            mesh.getFaceNormals();
        }
        base = mesh.copy();
        base.getExtents();
        meshes.push(mesh);
        getAllExtents();
        points = [];
        planes = [];
        numPoints = 0;
        refresh = true;
        active = 1;
        prevTime = millis();
        elapsedTime = 0;
    } catch {
        failed = true;
    }
    if (failed) initialGeometry();
    light4 = shadeMode === 0;
    fail = 0;
}

function draw() {
    if (refresh) {
        background(bkg);
        gl.disable(gl.DEPTH_TEST);
        push();
        if (auto) {
            noStroke()
            fill(bkg);
            ellipse(windowWidth / 2 - 6, -windowHeight / 2 + 6, 8, 8)
            fill(0, 0, 45 + 45 * Math.cos(radians(16 * frameCount)))
            ellipse(windowWidth / 2 - 6, -windowHeight / 2 + 6, 4, 4)
        } else {
            noStroke()
            fill(bkg);
            ellipse(windowWidth / 2 - 6, -windowHeight / 2 + 6, 8, 8)
        }
        rotateY(ay + viewAngle);
        zoom = geometryZoom * Math.min(windowHeight / rangey, windowWidth / rangex);
        lineWidth = Math.max(1.0, 0.0014 * Math.min(windowHeight, windowWidth));
        scale(zoom * manualZoom);
        translate(-centerx, -centery, 0);
        noLights();
        let bkgs = map(slices, 0, autoSlices, 1.04, (bkgMode ? 2.8 : 1.2));
        if (!explode) bkgs = 1.0 + (bkgs - 1.0) * 0.2;
        scale(bkgs);
        let mc = 0;
        meshes.forEach(mesh => {
            if (mc % 2 == 1 || !bkgMode) drawMeshBkg(mesh);
            mc++;
        });
        pop();
        gl.enable(gl.DEPTH_TEST);
        let ds = geometryMode === TRUNCATEDCUBE ? 1.0 : 0.8;
        if (viewMode === RENDERVIEW || viewMode === UNBROKENVIEW) {
            if (light4) pointLight(hue, 10, 50, 0, 0, 0);
            if (light1) pointLight((hue) % 360, sat + 10, 70, 0.4 * (rangex + rangez) * ds * manualZoom * Math.sin(ay + lightAngle + 0.24), 0.4 * ds * manualZoom * rangey, 0.4 * (rangex + rangez) * manualZoom * ds * Math.cos(ay + lightAngle + 0.24));
            if (light2) pointLight((hue + hueplus) % 360, sat / 2, 80, 0.4 * (rangex + rangez) * ds * manualZoom * Math.sin(ay + lightAngle), -0.35 * ds * manualZoom * rangey, 0.4 * (rangex + rangez) * manualZoom * ds * Math.cos(ay + lightAngle));
            if (light3) pointLight((hue + hueplus2) % 360, sat + 20, 50, 0, 0.35 * rangey, 0);
        }
        rotateY(ay + viewAngle);
        zoom = geometryZoom * Math.min(windowHeight / rangey, windowWidth / rangex);
        lineWidth = Math.max(1.0, 0.0014 * Math.min(windowHeight, windowWidth));
        scale(zoom * manualZoom);
        translate(-centerx, -centery, 0);
        meshes.forEach(mesh => drawMesh(mesh));
        if (viewMode === UNBROKENVIEW) {
            noStroke();
            base.draw([0, 0, 0], 0.0);
            noFill();
            strokeWeight(lineWidth);
            stroke(lineColor);
            base.drawBezier([0, 0, 0], 0.1, 0.0);
            strokeWeight(0.71 * lineWidth);
            stroke(lineColor);
            base.drawEdges([0, 0, 0], 0.0);
        }
        if (viewMode === ROTATIONVIEW) {
            strokeWeight(4.0 * lineWidth);
            stroke(0, 100, 80);
            points.forEach(p => point(p.x, p.y, p.z));
            strokeWeight(0.71 * lineWidth);
            planes.forEach(plane => plane.draw(600));
            strokeWeight(0.71 * lineWidth);
            meshes.forEach(mesh => {
                drawConnections(mesh);
            });
            strokeWeight(lineWidth);
            stroke(0);
            base.drawEdges([0, 0, 0], 0.0);
        }
        if (viewMode === SLICEVIEW) {
            strokeWeight(4.0 * lineWidth);
            stroke(0, 100, 80, 0.2);
            points.forEach(p => point(p.x, p.y, p.z));
            strokeWeight(0.35 * lineWidth);
            planes.forEach(plane => plane.draw(600));
            strokeWeight(lineWidth);
            stroke(0);
           
            base.drawEdges([0, 0, 0], 0.0);
           
           
           
        }
    }
    if (!auto && (viewMode === RENDERVIEW || viewMode === UNBROKENVIEW) && slices >= autoSlices) refresh = false;
    if (frameCount > 12) {
        if (slices < autoSlices) {
            addSlice();
        }
        if (auto) {
            if (millis() - prevTime > 10000) {
                initialGeometry();
            }
        }
    }
}

function getAllExtents() {
    minx = 5000;
    maxx = -5000;
    centerx = 0;
    miny = 5000;
    maxy = -5000;
    centery = 0;
    minz = 5000;
    maxz = -5000;
    centerz = 0;
    meshes.forEach(mesh => {
        let ff = f(mesh.center[0], mesh.center[1], mesh.center[2]);
        let d = sf() * (mesh.center[0] * scatterDirection.x + mesh.center[1] * scatterDirection.y + mesh.center[2] * scatterDirection.z);
        d *= constrain(map(d, -side / 4, side, 0.0, 2.0), 0.0, 2.0);
        minx = Math.min(minx, mesh.extents[0] + ff[0] * mesh.center[0] + d * scatterDirection.x);
        maxx = Math.max(maxx, mesh.extents[3] + ff[0] * mesh.center[0] + d * scatterDirection.x);
        miny = Math.min(miny, mesh.extents[1] + ff[1] * mesh.center[1] + d * scatterDirection.y);
        maxy = Math.max(maxy, mesh.extents[4] + ff[1] * mesh.center[1] + d * scatterDirection.y);
        minz = Math.min(minz, mesh.extents[2] + ff[2] * mesh.center[2] + d * scatterDirection.z);
        maxz = Math.max(maxz, mesh.extents[5] + ff[2] * mesh.center[2] + d * scatterDirection.z);
    });
    centerx = 0.5 * (maxx + minx);
    rangex = (maxx - minx);
    centery = 0.5 * (maxy + miny);
    rangey = (maxy - miny);
    centerz = 0.5 * (maxz + minz);
    rangez = (maxz - minz);
}

function drawMesh(mesh) {
    let ff = f(mesh.center[0], mesh.center[1], mesh.center[2]);
    
    if (viewMode === RENDERVIEW) {
        noStroke();
        mesh.draw(ff, sf());
        noFill();
        strokeWeight(lineWidth);
        stroke(lineColor);
        mesh.drawBezier(ff, 0.1, sf());
        strokeWeight(0.71 * lineWidth);
        stroke(lineColor);
        mesh.drawEdges(ff, sf());
    } else if (viewMode == MESHVIEW) {
        noStroke();
        mesh.draw(ff, sf());
        noFill();
        strokeWeight(lineWidth);
        stroke(lineColor);
        mesh.drawEdges(ff, sf());
    } else if (viewMode === SLICEVIEW) {
        push();
        
        strokeWeight(0.5 * lineWidth);
        stroke(0, 100, 50, 0.2);
        base.drawEdges([0, 0, 0], 0.0);
        pop();
        strokeWeight(lineWidth);
        stroke(0);
        noFill();
        mesh.drawBezier([0, 0, 0], 0.4, 0.0);
    } else if (viewMode === EXPLODEVIEW) {
        let d = sf() * (mesh.center[0] * scatterDirection.x + mesh.center[1] * scatterDirection.y + mesh.center[2] * scatterDirection.z);
        d *= constrain(map(d, -side / 4, side, 0.0, 2.0), 0.0, 2.0);
        strokeWeight(0.5 * lineWidth);
        stroke(0, 0.4);
        noFill();
        if(explode) mesh.drawBezier([0, 0, 0], 0.4, sf());
        strokeWeight(0.71 * lineWidth);
        stroke(0, 100, 80);
        line(mesh.center[0], mesh.center[1], mesh.center[2], (ff[0] + 1) * mesh.center[0] + d * scatterDirection.x, (ff[1] + 1) * mesh.center[1] + d * scatterDirection.y, (ff[2] + 1) * mesh.center[2] + d * scatterDirection.z);
        strokeWeight(3.0 * lineWidth);
        stroke(0, 100, 80);
        point(mesh.center[0], mesh.center[1], mesh.center[2]);
        point((ff[0] + 1) * mesh.center[0] + d * scatterDirection.x, (ff[1] + 1) * mesh.center[1] + d * scatterDirection.y, (ff[2] + 1) * mesh.center[2] + d * scatterDirection.z);
        strokeWeight(lineWidth);
        stroke(0);
        noFill();
        mesh.drawBezier(ff, 0.4, sf());
    } else if (viewMode === EXPLODEDVIEW) {
        let d = sf() * (mesh.center[0] * scatterDirection.x + mesh.center[1] * scatterDirection.y + mesh.center[2] * scatterDirection.z);
        d *= constrain(map(d, -side / 4, side, 0.0, 2.0), 0.0, 2.0);
        strokeWeight(lineWidth);
        stroke(0);
        noFill();
        mesh.drawBezier(ff, 0.4, sf());
    }
}

function drawMeshBkg(mesh) {
    let ff = f(mesh.center[0], mesh.center[1], mesh.center[2]);
    let c = bkgMode ? color(20) : color(100);
    noStroke();
    mesh.drawBkg(ff, sf(), c);
}

function drawConnections(mesh) {
    if (mesh.id != -1 && points) {
        let p = points[mesh.id];
        for (let i = 0; i < mesh.faces.length; i++) {
            let fid = mesh.faces[i].id;
            if (mesh.id<fid ) {
                let q = points[fid];
                line(p.x, p.y, p.z, q.x, q.y, q.z);
            }
        }
    }
}

function gap(x, y, z) {
    return (shadeMode === 0 || shadeMode === 3) ? constrain(map(y, miny, maxy, 8.0, -2.0), 0.0, 8.0) : 0.0;
}

function sf() {
    if (scatter) {
        return scatterFactor;
    }
    return 0.0;
}

function f(x, y, z) {
    if (explode) {
        if (explodeMode === GRADIENTYEXPLODE) {
            if (direction == 0) {
                let ff = constrain(map(y, -dy, dy / 2, 1.2, 0), 0.2, 1.2);
                return [ff, ff, ff];
            } else {
                let ff = constrain(map(y, -dy / 2, dy, 0, 1.2), 0.2, 1.2);
                return [ff, ff, ff];
            }
        }
        if (explodeMode === SYMMETRICYEXPLODE) {
            if (direction == 0) {
                let ff = constrain(map(abs(y), 0, dy, 0, 1.2), 0.2, 1.2);
                return [ff, ff, ff];
            }
        } else if (explodeMode === GRADIENTXEXPLODE) {
            if (direction == 0) {
                let ff = constrain(map(x, -dx, dx / 2, 1.2, 0), 0.2, 1.2);
                return [ff, ff, ff];
            } else {
                let ff = constrain(map(x, -dx / 2, dx, 0, 1.2), 0.2, 1.2);
                return [ff, ff, ff];
            }
        } else if (explodeMode === RADIALEXPLODE) {
            let ff = constrain(map(x * x + y * y + z * z, 0, (dx + dy + dz) * (dx + dy + dz) / 18.0, 0, 1.2), 0.2, 1.2);
            return [ff, ff, ff];
        }
        //UNIFORMEXPLODE
        return [0.5, 0.5, 0.5];
    }
    return [0, 0, 0];
}

function getRandomPoint(mesh) {
    let meshExtents = mesh.extents;
    if (pattern === VERTICALPATTERN) {
        return new p5.Vector(meshExtents[6] + 0.05 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.5 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.05 * rndRng(-meshExtents[11], meshExtents[11]));
    } else if (pattern == PLANEPATTERN) {
        return new p5.Vector(meshExtents[6] + 0.5 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.05 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.5 * rndRng(-meshExtents[11], meshExtents[11]));
    } else if (pattern == RADIALPATTERN) {
        return p5.Vector.fromAngles(rndRng(-Math.PI, Math.PI), rndRng(-0.5 * Math.PI, 0.5 * Math.PI), 0.5 * Math.min(Math.min(meshExtents[9], meshExtents[10]), meshExtents[11]));
    } else if (pattern == ORTHOPATTERN) {
        return new p5.Vector(meshExtents[0] + Math.floor(rndRng(1, 10)) * 0.1 * meshExtents[9], meshExtents[1] + Math.floor(rndRng(1, 10)) * 0.1 * meshExtents[10], meshExtents[2] + Math.floor(rndRng(1, 10)) * 0.1 * meshExtents[11]);
    }
    //UNIFORMPATTERN
    return new p5.Vector(meshExtents[6] + 0.5 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.5 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.5 * rndRng(-meshExtents[11], meshExtents[11]));
}

function addVoronoiPoint(container) {
    newMeshes.length = 0;
    try {
        if (numPoints === 0) {
            let firstPoint = new p5.Vector(0, 0, 0);
            points.push(firstPoint);
            numPoints++;
        }
        let newPoint;
        let mind2 = 100000000.0;
        let trial = 0;
        do {
            newPoint = getRandomPoint(container);
            for (let i = 0; i < points.length; i++) {
                let d2 = (newPoint.x - points[i].x) * (newPoint.x - points[i].x) + (newPoint.y - points[i].y) * (newPoint.y - points[i].y) + (newPoint.z - points[i].z) * (newPoint.z - points[i].z);
                if (d2 < mind2) {
                    mind2 = d2;
                    if (mind2 < 100.0) break;
                }
            }
            trial++;
        } while (mind2 < 100.0 && trial < 100);
        points.push(newPoint);
        numPoints++;
        meshes.length = 0;
        for (let i = 0; i < points.length; i++) {
            let mesh = base.copy();
            mesh.id = i;
            for (let j = 0; j < points.length; j++) {
                if (i != j) {
                    voronoiSlice(points[i], points[j], mesh, j);
                    if (!mesh.isValid() || mesh.vertices.length === 0) {
                        break;
                    }
                }
            }
            if (mesh.isValid() && mesh.vertices.length > 0) {
                mesh.getExtents();
                mesh.getCenter();
                mesh.getFaceNormals();
                newMeshes.push(mesh);
            }
        }
        meshes.length = 0;
        splice(meshes, newMeshes, 0);
        newMeshes.length = 0;
    } catch {
        console.log("Adding point failed, pretending nothing happened.");
        fail++;
    }
    refresh = true;
}

function voronoiSlice(p, q, mesh, j) {
    let origin = new p5.Vector(0.5 * (p.x + q.x), 0.5 * (p.y + q.y), 0.5 * (p.z + q.z));
    let normal = new p5.Vector((q.x - p.x) + rndRng(-.1, .1), (q.y - p.y) + rndRng(-.1, .1), (q.z - p.z) + rndRng(-.1, .1));
    let g = gap(origin.x, origin.y, origin.z)
    mesh.slice(new Plane(origin, normal), g * side / 800.0, inside, 0, j);
}

function addGlobalSlice(container) {
    let randomSlice = getRandomPlane(container);
    globalSlice(randomSlice[0], randomSlice[1]);
}

function getRandomPlane(mesh) {
    let meshExtents = mesh.extents
    if (pattern == VERTICALPATTERN) {
        let normal = new p5.Vector(rndRng(-.1, .1), rndRng(-1, 1), rndRng(-.1, .1));
        let origin = new p5.Vector(meshExtents[6] + 0.5 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.4 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.5 * rndRng(-meshExtents[11], meshExtents[11]));
        return [origin, normal];
    } else if (pattern == PLANEPATTERN) {
        if (geometryMode != TRUNCATEDCUBE && geometryMode != GEM) {
            let oy0, oy1, ny0, ny1;
            if (slices === 0) {
                oy0 = meshExtents[1] + .2 * meshExtents[10];
                oy1 = meshExtents[1] + 0.05 * meshExtents[10];
                ny0 = 0.9;
                ny1 = 1.0;
                let normal = new p5.Vector(rndRng(-.1, .1), rndRng(ny0, ny1), rndRng(-.1, .1));
                let origin = new p5.Vector(meshExtents[6] + 0.05 * rndRng(-meshExtents[9], meshExtents[9]), rndRng(oy0, oy1), meshExtents[8] + 0.05 * rndRng(-meshExtents[11], meshExtents[11]));
                fixedMesh = 0;
                return [origin, normal];
            } else if (slices === 1) {
                oy0 = meshExtents[4] - .2 * meshExtents[10];
                oy1 = meshExtents[4] - .05 * meshExtents[10];
                ny0 = -0.9;
                ny1 = -1.0;
                fixedMesh = 1;
                let normal = new p5.Vector(rndRng(-.1, .1), rndRng(ny0, ny1), rndRng(-.1, .1));
                let origin = new p5.Vector(meshExtents[6] + 0.05 * rndRng(-meshExtents[9], meshExtents[9]), rndRng(oy0, oy1), meshExtents[8] + 0.05 * rndRng(-meshExtents[11], meshExtents[11]));
                return [origin, normal];
            } else if (slices === 2) {
                fixedMesh = 2;
                let normal = new p5.Vector(rndRng(-.2, .2), rndRng(0.9, 1.0), rndRng(-.2, .2));
                let origin = new p5.Vector(meshExtents[6] + 0.05 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7], meshExtents[8] + 0.05 * rndRng(-meshExtents[11], meshExtents[11]));
                return [origin, normal];
            }
        }
        let normal = new p5.Vector(rndRng(-1, 1), rndRng(-.1, .1), rndRng(-1, 1));
        let origin = new p5.Vector(meshExtents[6] + 0.5 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.5 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.5 * rndRng(-meshExtents[11], meshExtents[11]));
        return [origin, normal];
    } else if (pattern == SPLINTERPATTERN) {
        if (direction === 0) {
            let normal = new p5.Vector(rndRng(-.2, .2), rndRng(0.7, 1.0), rndRng(-.2, .2));
            let origin = new p5.Vector(meshExtents[6] + 0.15 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.1 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.15 * rndRng(-meshExtents[11], meshExtents[11]));
            return [origin, normal];
        } else {
            let normal = new p5.Vector(rndRng(0.7, 1.0), rndRng(-.2, .2), rndRng(-.2, .2));
            let origin = new p5.Vector(meshExtents[6] + 0.1 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.2 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.1 * rndRng(-meshExtents[11], meshExtents[11]));
            return [origin, normal];
        }
    } else if (pattern == ORTHOPATTERN) {
        let roll = Math.floor(rndRng(0, 3));
        let normal = roll === 0 ? new p5.Vector(1, rndRng(-0.05, 0.05), rndRng(-0.05, 0.05)) : roll === 1 ? new p5.Vector(rndRng(-0.05, 0.05), 1, rndRng(-0.05, 0.05)) : new p5.Vector(rndRng(-0.05, 0.05), rndRng(-0.05, 0.05), 1);
        let origin = new p5.Vector(meshExtents[6] + 0.5 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.5 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.5 * rndRng(-meshExtents[11], meshExtents[11]));
        return [origin, normal];
    }
    //UNIFORMPATTERN
    let normal = new p5.Vector(rndRng(-1, 1), rndRng(-1, 1), rndRng(-1, 1));
    let origin = new p5.Vector(meshExtents[6] + 0.5 * rndRng(-meshExtents[9], meshExtents[9]), meshExtents[7] + 0.5 * rndRng(-meshExtents[10], meshExtents[10]), meshExtents[8] + 0.5 * rndRng(-meshExtents[11], meshExtents[11]));
    return [origin, normal];
}

function globalSlice(origin, normal) {
    newMeshes.length = 0;
    let normalFlip = p5.Vector.mult(normal, -1);
    let g = gap(origin.x, origin.y, origin.z)
    let meshCount = 0;
    try {
        meshes.forEach(mesh => {
            meshCount++;
            if (meshCount > fixedMesh) {
                let copy = mesh.copy();
                mesh.slice(new Plane(origin, normal), g * side / 800.0, inside, 0, slices);
                if (mesh.isValid() && mesh.vertices.length > 0) {
                    mesh.getExtents();
                    mesh.getCenter();
                    mesh.getFaceNormals();
                    newMeshes.push(mesh);
                }
                copy.slice(new Plane(origin, normalFlip), g * side / 800.0, inside, 0, slices);
                if (copy.isValid() && copy.vertices.length > 0) {
                    copy.getExtents();
                    copy.getCenter();
                    copy.getFaceNormals();
                    newMeshes.push(copy);
                }
            } else {
                newMeshes.push(mesh);
            }
        });
        planes.push(new Plane(origin, normal));
        meshes.length = 0;
        splice(meshes, newMeshes, 0);
        newMeshes.length = 0;
    } catch {
        console.log("Slice failed, pretending nothing happened.");
        fail++;
    }
    refresh = true;
}

function addSlice() {
    if (sliceMode === 0) {
        addVoronoiPoint(base);
    } else {
        addGlobalSlice(base);
    }
    slices++;
    getAllExtents();
    prevTime = millis();
    elapsedTime = 0;
    if (fail > 3) initialGeometry();
}

function cutInHalf() {
    let normal = new p5.Vector(-Math.sin(ay) + rndRng(-0.01, 0.01), rndRng(-0.01, 0.01), Math.cos(ay) + rndRng(-0.01, 0.01));
    let origin = new p5.Vector(rndRng(-1, 1), rndRng(-1, 1), rndRng(-1, 1));
    globalCut(origin, normal);
    light4 = false;
}

function globalCut(origin, normal) {
    newMeshes.length = 0;
    try {
        meshes.forEach(mesh => {
            mesh.slice(new Plane(origin, normal), 0, outside, 0, -1);
            if (mesh.isValid() && mesh.vertices.length > 0) {
                mesh.getExtents();
                mesh.getCenter();
                mesh.getFaceNormals();
                newMeshes.push(mesh);
            }
        });
        meshes.length = 0;
        splice(meshes, newMeshes, 0);
        newMeshes.length = 0;
    } catch {
        console.log("Slice failed, pretending nothing happened.");
    }
    refresh = true;
}

function mousePressed() {
    auto = !auto;
    refresh = true;
    elapsedTime = 0;
}

function keyPressed() {
    if (keyCode === RIGHT_ARROW) {
        ay += radians(5);
        refresh = true;
    } else if (keyCode === LEFT_ARROW) {
        ay -= radians(5);
        refresh = true;
    } else if (key === 'v' || key === 'V') {
        viewMode = (viewMode + 1) % NUMVIEWMODES;
        refresh = true;
    } else if (key === 'r' || key === 'R') {
        initialGeometry();
    } else if (key === 'a' || key === 'A') {
        addSlice();
    } else if (key === 's' || key === 'S') {
        addGlobalSlice(base);
    } else if (key === 'c' || key === 'C') {
        cutInHalf();
    } else if (key === '1') {
        viewMode = RENDERVIEW;
        refresh = true;
    } else if (key === '2') {
        viewMode = UNBROKENVIEW;
        refresh = true;
    } else if (key === '3') {
        viewMode = ROTATIONVIEW;
        refresh = true;
    } else if (key === '4') {
        viewMode = SLICEVIEW;
        refresh = true;
    } else if (key === '5') {
        viewMode = EXPLODEVIEW;
        refresh = true;
    } else if (key === '6') {
        viewMode = EXPLODEDVIEW;
        refresh = true;
    } else if (key === '7') {
        viewMode = MESHVIEW;
        refresh = true;
    } else if (key === '+') {
        manualZoom += 0.05;
        refresh = true;
    } else if (key === '-') {
        manualZoom -= 0.05;
        refresh = true;
    } else if (key === 'e' || key === 'E') {
        explode = !explode;
        scatter = !scatter;
        getAllExtents();
        refresh = true;
    }
}
class Plane {
    constructor(o, n) {
        this.origin = o;
        this.normal = n;
        this.normal.normalize();
        this.u = new p5.Vector(0, 0, 1).cross(this.normal);
        if (sqrt(this.u.dot(this.u)) < EPS) {
            this.u = new p5.Vector(0, 1, 0).cross(this.normal);
        }
        this.u.normalize();
        this.v = this.normal.cross(this.u);
    }
    offset(d) {
        return new Plane(p5.Vector.add(this.origin, p5.Vector.mult(this.normal, d)), this.normal);
    }
    flip() {
        return new Plane(this.origin, p5.Vector.mult(this.normal, -1));
    }
    local(x, y, z) {
        return new p5.Vector(this.u.x * (x - this.origin.x) + this.u.y * (y - this.origin.y) + this.u.z * (z - this.origin.z), this.v.x * (x - this.origin.x) + this.v.y * (y - this.origin.y) + this.v.z * (z - this.origin.z), this.normal.x * (x - this.origin.x) + this.normal.y * (y - this.origin.y) + this.normal.z * (z - this.origin.z));
    }
    draw(side) {
        // line(this.origin.x - 0.5 * side * this.u.x, this.origin.y - 0.5 * side * this.u.y, this.origin.z - 0.5 * side * this.u.z, this.origin.x + 0.5 * side * this.u.x, this.origin.y + 0.5 * side * this.u.y, this.origin.z + 0.5 * side * this.u.z);
        beginShape();
        vertex(this.origin.x - 0.5 * side * this.u.x - 0.1 * side * this.v.x, this.origin.y - 0.5 * side * this.u.y - 0.1 * side * this.v.y, this.origin.z - 0.5 * side * this.u.z - 0.1 * side * this.v.z);
        vertex(this.origin.x + 0.5 * side * this.u.x - 0.1 * side * this.v.x, this.origin.y + 0.5 * side * this.u.y - 0.1 * side * this.v.y, this.origin.z + 0.5 * side * this.u.z - +0.1 * side * this.v.z);
        vertex(this.origin.x + 0.5 * side * this.u.x + 0.1 * side * this.v.x, this.origin.y + 0.5 * side * this.u.y + 0.1 * side * this.v.y, this.origin.z + 0.5 * side * this.u.z + 0.1 * side * this.v.z);
        vertex(this.origin.x - 0.5 * side * this.u.x + 0.1 * side * this.v.x, this.origin.y - 0.5 * side * this.u.y + 0.1 * side * this.v.y, this.origin.z - 0.5 * side * this.u.z + 0.1 * side * this.v.z);
        endShape(CLOSE);
    }
}
class Halfedge {
    constructor(i) {
        this.index = i;
        this.UV = new p5.Vector();
    }
    nextInVertex() {
        return this.pair.next;
    }
    prevInVertex() {
        return this.prev.pair;
    }
}
class HEVertex {
    constructor(x, y, z, i) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.index = i;
    }
    distance(P) {
        let signedDistance = P.normal.dot(new p5.Vector(this.x - P.origin.x, this.y - P.origin.y, this.z - P.origin.z));
        return abs(signedDistance);
    }
    sideOfPlane(P) {
        let signedDistance = P.normal.dot(new p5.Vector(this.x - P.origin.x, this.y - P.origin.y, this.z - P.origin.z));
        return (signedDistance > EPS) ? 1 : (signedDistance < -EPS) ? -1 : 0;
    }
}
class Face {
    constructor(i, c) {
        this.index = i;
        if (c) {
            this.col = c;
        } else {
            this.col = color(0, 255, 0);
        }
        this.textureId = 0;
        this.id = -1;
    }
    order() {
        let lhe = this.he;
        let ord = 0;
        do {
            ord++;
            lhe = lhe.next;
        } while (lhe != this.he);
        return ord;
    }
    sideOfPlane(P) {
        let lhe = this.he;
        let sideOfVertex;
        let plus = 0;
        let minus = 0;
        do {
            sideOfVertex = lhe.v.sideOfPlane(P);
            if (sideOfVertex === 1) {
                plus++;
            } else if (sideOfVertex === -1) {
                minus++;
            }
            lhe = lhe.next;
        } while (lhe != this.he);
        if (plus > 0 && minus === 0) {
            return 1;
        } else if (plus === 0 && minus > 0) {
            return -1;
        } else {
            return 0;
        }
    }
}
class Edge {
    constructor(i) {
        this.index = i;
    }
}
class Mesh {
    constructor() {
        this.initialize();
    }
    initialize() {
        this.halfedges = [];
        this.vertices = [];
        this.faces = [];
        this.faceNormals = [];
        this.edges = [];
        this.extents = [];
        this.center = [0, 0, 0];
        this.id = -1;
    }
    create(data) {
        this.createRaw(data.vertexArray, data.faceArray, data.halfedgePairArray, data.faceColor);
        if (data.faceTextureIds) this.setFaceTextureIds(data.faceTextureIds);
        if (data.UVs) this.setUVs(data.UVs);
        this.getExtents();
        this.getCenter();
        this.getFaceNormals();
        
    }
    createRaw(vertexArray, faceArray, halfedgePairArray, col) {
        this.initialize();
        let i = 0;
        vertexArray.forEach(vertex => this.createVertex(vertex));
        faceArray.forEach(face => this.createFace(face, col[i++]));
        this.createEdges(halfedgePairArray);
        this.createGeometry();
        this.getExtents();
        this.getCenter();
        this.getFaceNormals();
    }
    createGeometry() {
        this.geo = new p5.Geometry();
        this.geo.vertices = [];
        let v;
        for (let i = 0; i < this.vertices.length; i++) {
            this.geo.vertices.push(new p5.Vector(this.vertices[i].x, this.vertices[i].y, this.vertices[i].z));
        }
        this.geo.faces = this.faces;
    }
    copy() {
        let copy = new Mesh();
        copy.createRaw(this.copyVertexArray(), this.copyFaceArray(), this.copyHalfedgePairArray(), this.copyFaceColor());
        copy.setFaceTextureIds(this.copyFaceTextureIds());
        copy.setUVs(this.copyUVs());
        return copy;
    }
    copyVertexArray() {
        let copy = [];
        for (let i = 0; i < this.vertices.length; i++) {
            copy.push([this.vertices[i].x, this.vertices[i].y, this.vertices[i].z]);
        }
        return copy;
    }
    copyFaceArray() {
        let copy = [];
        for (let i = 0; i < this.faces.length; i++) {
            let cf = [];
            let he = this.faces[i].he;
            do {
                cf.push(he.v.index);
                he = he.next;
            } while (he != this.faces[i].he);
            copy.push(cf);
        }
        return copy;
    }
    copyFaceColor() {
        let copy = [];
        for (let i = 0; i < this.faces.length; i++) {
            copy.push(this.faces[i].col);
        }
        return copy;
    }
    copyFaceTextureIds() {
        let copy = [];
        for (let i = 0; i < this.faces.length; i++) {
            copy.push(this.faces[i].textureId)
        }
        return copy;
    }
    copyHalfedgePairArray() {
        let oldtonew = [];
        let newtoold = [];
        let copy = [];
        let he;
        let index = 0;
        for (let i = 0; i < this.faces.length; i++) {
            he = this.faces[i].he;
            do {
                oldtonew[he.index] = index;
                newtoold.push(he.index);
                index++;
                he = he.next;
            } while (he != this.faces[i].he);
        }
        for (let i = 0; i < this.halfedges.length; i++) {
            copy.push(oldtonew[this.halfedges[newtoold[i]].pair.index]);
        }
        return copy;
    }
    copyUVs() {
        let newtoold = [];
        let copy = [];
        let he;
        for (let i = 0; i < this.faces.length; i++) {
            he = this.faces[i].he;
            do {
                newtoold.push(he.index);
                he = he.next;
            } while (he != this.faces[i].he);
        }
        var UV;
        for (let i = 0; i < this.halfedges.length; i++) {
            UV = this.halfedges[newtoold[i]].UV;
            copy.push([UV.x, UV.y]);
        }
        return copy;
    }
    createVertex(vertex) {
        this.vertices.push(new HEVertex(vertex[0], vertex[1], vertex[2], this.vertices.length));
    }
    createFace(face, col) {
        let f = new Face(this.faces.length, col);
        this.faces.push(f);
        let v;
        let he;
        let faceHalfedges = [];
        for (let i = 0; i < face.length; i++) {
            v = this.vertices[face[i]];
            he = new Halfedge(this.halfedges.length);
            this.halfedges.push(he);
            faceHalfedges.push(he);
            this.connectVertex(v, he);
            this.connectFace(f, he);
        }
        for (let i = 0, j = faceHalfedges.length - 1; i < faceHalfedges.length; j = i, i++) {
            this.connectHalfedges(faceHalfedges[j], faceHalfedges[i]);
        }
    }
    createEdges(halfedgePairArray) {
        for (let i = 0; i < this.halfedges.length; i++) {
            let pairIndex = halfedgePairArray[this.halfedges[i].index];
            if (!this.halfedges[i].pair) {
                this.pairHalfedges(this.halfedges[i], this.halfedges[pairIndex]);
                this.createEdge(this.halfedges[i]);
            }
        }
    }
    pairHalfedges(he1, he2) {
        he1.pair = he2;
        he2.pair = he1;
    }
    createEdge(he) {
        let e = new Edge(this.edges.length);
        this.connectEdge(e, he);
        this.edges.push(e);
    }
    connectHalfedges(he1, he2) {
        he1.next = he2;
        he2.prev = he1;
    }
    connectVertex(v, he) {
        if (!v.he) v.he = he;
        he.v = v;
    }
    connectFace(f, he) {
        if (!f.he) f.he = he;
        he.f = f;
    }
    connectEdge(e, he) {
        if (!e.he) e.he = he;
        he.e = e;
        he.pair.e = e;
    }
    drawBezier(f, bez, s) {
        let he;
        let fn;
        let ombez = 1.0 - bez;
        push();
        let d = s * (this.center[0] * scatterDirection.x + this.center[1] * scatterDirection.y + this.center[2] * scatterDirection.z);
        d *= constrain(map(d, -side / 4, side, 0.0, 2.0), 0.0, 2.0);
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2]);
        translate(d * scatterDirection.x, d * scatterDirection.y, d * scatterDirection.z);
        for (let i = 0; i < this.faces.length; i++) {
            // fill(this.faces[i].col);
            fn = this.faceNormals[i];
            push();
            // translate(fn[0],fn[1],fn[2]);
            he = this.faces[i].he;
            beginShape();
            do {
                vertex(ombez * he.v.x + bez * he.next.v.x, ombez * he.v.y + bez * he.next.v.y, ombez * he.v.z + bez * he.next.v.z);
                vertex(bez * he.v.x + ombez * he.next.v.x, bez * he.v.y + ombez * he.next.v.y, bez * he.v.z + ombez * he.next.v.z);
                bezierVertex(he.next.v.x, he.next.v.y, he.next.v.z, he.next.v.x, he.next.v.y, he.next.v.z, ombez * he.next.v.x + bez * he.next.next.v.x, ombez * he.next.v.y + bez * he.next.next.v.y, ombez * he.next.v.z + bez * he.next.next.v.z);
                he = he.next;
            } while (he != this.faces[i].he);
            endShape();
            pop();
        }
        pop();
    }
    draw(f, s, textures) {
        let he;
        push();
        let d = s * (this.center[0] * scatterDirection.x + this.center[1] * scatterDirection.y + this.center[2] * scatterDirection.z);
        d *= constrain(map(d, -side / 4, side, 0.0, 2.0), 0.0, 2.0);
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2]);
        translate(d * scatterDirection.x, d * scatterDirection.y, d * scatterDirection.z);
        for (let i = 0; i < this.faces.length; i++) {
            push();
            beginShape();
            if (textures) {
                texture(textures[this.faces[i].textureId]);
            } else {
                fill(this.faces[i].col);
            }
            he = this.faces[i].he;
            do {
                if (textures) {
                    vertex(he.v.x, he.v.y, he.v.z, he.UV.x + dux * map(counter, 0, numFrames, 0, 2), he.UV.y + duy * map(counter, 0, numFrames, 0, 2));
                } else {
                    vertex(he.v.x, he.v.y, he.v.z);
                }
                he = he.next;
            } while (he != this.faces[i].he);
            endShape(CLOSE);
            pop();
        }
        pop();
    }
    drawBkg(f, s, c) {
        let he;
        push();
        let d = s * (this.center[0] * scatterDirection.x + this.center[1] * scatterDirection.y + this.center[2] * scatterDirection.z);
        d *= constrain(map(d, -side / 4, side, 0.0, 2.0), 0.0, 2.0);
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2]);
        translate(d * scatterDirection.x, d * scatterDirection.y, d * scatterDirection.z);
        for (let i = 0; i < this.faces.length; i++) {
            push();
            beginShape();
            fill(c);
            he = this.faces[i].he;
            do {
                vertex(he.v.x, he.v.y, he.v.z);
                he = he.next;
            } while (he != this.faces[i].he);
            endShape(CLOSE);
            pop();
        }
        pop();
    }
    getFaceNormals() {
        let he, hen;
        this.faceNormals.length = 0;
        for (let i = 0; i < this.faces.length; i++) {
            let normal = [0, 0, 0];
            he = this.faces[i].he;
            do {
                normal[0] = (he.v.y - he.next.v.y) * (he.v.z + he.next.v.z);
                normal[1] = (he.v.z - he.next.v.z) * (he.v.x + he.next.v.x);
                normal[2] = (he.v.x - he.next.v.x) * (he.v.y + he.next.v.y);
                he = he.next;
            } while (he != this.faces[i].he);
            let fn = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
            normal[0] /= fn;
            normal[1] /= fn;
            normal[2] /= fn;
            this.faceNormals.push(normal);
        }
    }
    drawEdges(f, s) {
        let he;
        push();
        let d = s * (this.center[0] * scatterDirection.x + this.center[1] * scatterDirection.y + this.center[2] * scatterDirection.z);
        d *= constrain(map(d, -side / 4, side, 0.0, 2.0), 0.0, 2.0);
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2]);
        translate(d * scatterDirection.x, d * scatterDirection.y, d * scatterDirection.z);
        for (let i = 0; i < this.faces.length; i++) {
            he = this.faces[i].he;
            do {
                line(he.v.x, he.v.y, he.v.z, he.next.v.x, he.next.v.y, he.next.v.z);
                he = he.next;
            } while (he != this.faces[i].he);
        }
        pop();
    }
    indexVertices() {
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].index = i;
        }
    }
    indexHalfedges() {
        for (let i = 0; i < this.halfedges.length; i++) {
            this.halfedges[i].index = i;
        }
    }
    indexEdges() {
        for (let i = 0; i < this.edges.length; i++) {
            this.edges[i].index = i;
        }
    }
    indexFaces() {
        for (let i = 0; i < this.faces.length; i++) {
            this.faces[i].index = i;
        }
    }
    reconnectVertices() {
        for (let i = 0; i < this.halfedges.length; i++) {
            if (!this.halfedges[i].v.he) this.halfedges[i].v.he = this.halfedges[i];
        }
    }
    isValid() {
        for (let i = 0; i < this.halfedges.length; i++) {
            if (this.halfedges[i].v == null) return false;
            if (this.halfedges[i].pair == null) return false;
            if (this.halfedges[i].pair.pair == null) return false;
            if (this.halfedges[i].pair.pair != this.halfedges[i]) return false;
            if (this.halfedges[i].f == null) return false;
            if (this.halfedges[i].next == null) return false;
            if (this.halfedges[i].next.prev == null) return false;
            if (this.halfedges[i].next.prev != this.halfedges[i]) return false;
            if (this.halfedges[i].prev == null) return false;
            if (this.halfedges[i].prev.next == null) return false;
            if (this.halfedges[i].prev.next != this.halfedges[i]) return false;
        }
        for (let i = 0; i < this.vertices.length; i++) {
            if (this.vertices[i].he == null) return false;
        }
        for (let i = 0; i < this.edges.length; i++) {
            if (this.edges[i].he == null) return false;
        }
        for (let i = 0; i < this.faces.length; i++) {
            if (this.faces[i].he == null) return false;
        }
        return true; //maybe
    }
    getExtents() {
        this.extents = [1000000.0, 1000000.0, 1000000.0, -1000000.0, -1000000.0, -1000000.0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < this.vertices.length; i++) {
            this.extents[0] = min(this.vertices[i].x, this.extents[0]);
            this.extents[1] = min(this.vertices[i].y, this.extents[1]);
            this.extents[2] = min(this.vertices[i].z, this.extents[2]);
            this.extents[3] = max(this.vertices[i].x, this.extents[3]);
            this.extents[4] = max(this.vertices[i].y, this.extents[4]);
            this.extents[5] = max(this.vertices[i].z, this.extents[5]);
        }
        this.extents[6] = 0.5 * (this.extents[0] + this.extents[3]);
        this.extents[7] = 0.5 * (this.extents[1] + this.extents[4]);
        this.extents[8] = 0.5 * (this.extents[2] + this.extents[5]);
        this.extents[9] = (this.extents[3] - this.extents[0]);
        this.extents[10] = (this.extents[4] - this.extents[1]);
        this.extents[11] = (this.extents[5] - this.extents[2]);
    }
    getCenter() {
        let x = 0.0;
        let y = 0.0;
        let z = 0.0;
        for (let i = 0; i < this.vertices.length; i++) {
            x += this.vertices[i].x;
            y += this.vertices[i].y;
            z += this.vertices[i].z;
        }
        if (this.vertices.length > 0) {
            x /= this.vertices.length;
            y /= this.vertices.length;
            z /= this.vertices.length;
        }
        this.center[0] = x;
        this.center[1] = y;
        this.center[2] = z;
    }
    setFaceTextureIds(textureIds) {
        for (let i = 0; i < this.faces.length; i++) {
            this.faces[i].textureId = textureIds[i];
        }
    }
    setUVs(UVs) {
        for (let i = 0; i < this.halfedges.length; i++) {
            this.halfedges[i].UV = new p5.Vector(UVs[i][0], UVs[i][1]);
        }
    }
}
class MeshData {
    constructor(vertexArray, faceArray, halfedgePairArray, faceColor, faceTextureIds, UVs) {
        this.vertexArray = vertexArray;
        this.faceArray = faceArray;
        this.halfedgePairArray = halfedgePairArray;
        this.faceColor = faceColor;
        this.faceTextureIds = faceTextureIds;
        this.UVs = UVs;
    }
}
class MeshDataFactory {
    static createBoxWithCenterAndSize(x, y, z, width, height, depth, col) {
        let vertices = [
            [-0.5, -0.5, -0.5],
            [0.5, -0.5, -0.5],
            [0.5, 0.5, -0.5],
            [-0.5, 0.5, -0.5],
            [-0.5, -0.5, 0.5],
            [0.5, -0.5, 0.5],
            [0.5, 0.5, 0.5],
            [-0.5, 0.5, 0.5]
        ];
        let faces = [
            [0, 1, 2, 3],
            [7, 6, 5, 4],
            [1, 0, 4, 5],
            [3, 2, 6, 7],
            [2, 1, 5, 6],
            [0, 3, 7, 4]
        ];
        let faceTextureIds = [1, 2, 3, 4, 5, 6];
        let halfedgePairs = [8, 16, 12, 20, 14, 18, 10, 22, 0, 23, 6, 17, 2, 19, 4, 21, 1, 11, 5, 13, 3, 15, 7, 9];
        let UVs = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1]
        ];
        let scaledVertices = [];
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * width, y + vertices[i][1] * height, z + vertices[i][2] * depth]);
        }
        return new MeshData(scaledVertices, faces, halfedgePairs, [col, col, col, col, col, col], faceTextureIds, UVs);
    }
    static createOctahedronWithCenterAndSize(x, y, z, width, height, depth, col) {
        let vertices = [
            [-0.5, 0.0, 0.0],
            [0.0, 0.5, 0.0],
            [0.5, 0.0, 0.0],
            [0.0, -0.5, 0.0],
            [0.0, 0.0, 0.5],
            [0.0, 0.0, 0 - .5]
        ];
        let faces = [
            [0, 1, 4],
            [1, 2, 4],
            [2, 3, 4],
            [3, 0, 4],
            [1, 0, 5],
            [2, 1, 5],
            [3, 2, 5],
            [0, 3, 5]
        ];
        let faceTextureIds = [1, 1, 1, 1, 1, 1, 1, 1, 1];
        let halfedgePairs = [12, 5, 10, 15, 8, 1, 18, 11, 4, 21, 2, 7, 0, 23, 16, 3, 14, 19, 6, 17, 22, 9, 20, 13];
        let UVs = [
            [0, 0],
            [1, 0],
            [0.5, 1],
            [1, 0],
            [0, 0],
            [0.5, 1],
            [0, 0],
            [1, 0],
            [0.5, 1],
            [1, 0],
            [0, 0],
            [0.5, 1],
            [1, 0],
            [0, 0],
            [0.5, 1],
            [0, 0],
            [1, 0],
            [0.5, 1],
            [1, 0],
            [0, 0],
            [0.5, 1],
            [0, 0],
            [1, 0],
            [0.5, 1]
        ];
        let scaledVertices = [];
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * width, y + vertices[i][1] * height, z + vertices[i][2] * depth]);
        }
        return new MeshData(scaledVertices, faces, halfedgePairs, [col, col, col, col, col, col, col, col], faceTextureIds, UVs);
    }
    static create(vertexArray, faceArray, col) {
        let numberOfEdges = 0;
        for (let i = 0; i < this.faces.length; i++) {
            numberOfEdges += this.faces[i].length;
        }
        let halfedgePairArray = [];
        let edges = [];
        for (let i = 0; i < this.faces.length; i++) {
            for (let j = 0; j < this.faces[i].length; j++) {
                edges.push([this.faces[i][j], this.faces[i][(j + 1) % this.faces[i].length]]);
                halfedgePairArray.push(-1);
            }
        }
        for (let i = 0; i < edges.length; i++) {
            if (halfedgePairArray[i] == -1) {
                for (let j = i + 1; j < edges.length; j++) {
                    if (edges[i][0] === edges[j][1] && edges[i][1] === edges[j][0]) {
                        halfedgePairArray[i] = j;
                        halfedgePairArray[j] = i;
                    }
                }
            }
        }
        return new MeshData(vertexArray, faceArray, halfedgePairArray, col);
    }
}
class EdgeIntersection {
    constructor(e, v) {
        this.e = e;
        this.v = v;
    }
}
class SliceMesh extends Mesh {
    copy() {
        let copy = new SliceMesh();
        copy.createRaw(this.copyVertexArray(), this.copyFaceArray(), this.copyHalfedgePairArray(), this.copyFaceColor());
        copy.setFaceTextureIds(this.copyFaceTextureIds());
        copy.setUVs(this.copyUVs());
        return copy;
    }
    slice(P, offset, col, sliceId, capId) {
        let offsetP = P.offset(-offset);
        let intersections = [];
        let es = this.edges.length;
        for (let i = 0; i < es; i++) {
            this.sliceEdge(this.edges[i], offsetP, intersections);
        }
        let fs = this.faces.length;
        for (let i = 0; i < fs; i++) {
            this.sliceFace(this.faces[i], intersections);
        }
        this.deleteFrontFaces(offsetP);
        this.capSlice(col, offsetP, sliceId, capId);
    }
    sliceEdge(e, P, intersections) {
        let he = e.he;
        let hep = he.pair;
        let v = he.v;
        let vp = hep.v;
        let u = new p5.Vector(vp.x - v.x, vp.y - v.y, vp.z - v.z);
        let w = new p5.Vector(v.x - P.origin.x, v.y - P.origin.y, v.z - P.origin.z);
        let D = P.normal.dot(u);
        let N = -P.normal.dot(w);
        if (abs(D) < EPS) {
            return;
        }
        let f = N / D;
        if (f < -EPS || f > OPEPS) {
            return;
        } else if (f < EPS) {
            intersections.push(new EdgeIntersection(e, v));
        } else if (f > OMEPS) {
            intersections.push(new EdgeIntersection(e, vp));
        } else {
            this.splitEdge(e, f);
            let nv = this.vertices[this.vertices.length - 1];
            intersections.push(new EdgeIntersection(e, nv));
        }
    }
    splitEdge(e, f) {
        let he = e.he;
        let hep = he.pair;
        let hen = he.next;
        let hepn = hep.next;
        let v = he.v;
        let vp = hep.v;
        this.createVertex([(1.0 - f) * v.x + f * vp.x, (1.0 - f) * v.y + f * vp.y, (1.0 - f) * v.z + f * vp.z]);
        let splitv = this.vertices[this.vertices.length - 1];
        let heNew = new Halfedge(this.halfedges.length);
        this.halfedges.push(heNew);
        this.connectVertex(splitv, heNew);
        this.connectFace(he.f, heNew);
        let hepNew = new Halfedge(this.halfedges.length);
        this.halfedges.push(hepNew);
        this.connectVertex(splitv, hepNew);
        this.connectFace(hep.f, hepNew);
        this.connectHalfedges(he, heNew);
        this.connectHalfedges(heNew, hen);
        heNew.UV = p5.Vector.lerp(he.UV, hen.UV, f);
        this.connectHalfedges(hep, hepNew);
        this.connectHalfedges(hepNew, hepn);
        hepNew.UV = p5.Vector.lerp(hep.UV, hepn.UV, 1.0 - f);
        this.pairHalfedges(he, hepNew);
        this.connectEdge(e, he);
        this.pairHalfedges(hep, heNew);
        this.createEdge(hep);
    }
    sliceFace(f, intersections) {
        let vi;
        let vj;
        for (let i = 0; i < intersections.length; i++) {
            if (intersections[i].e.he.f === f || intersections[i].e.he.pair.f === f) {
                if (!vi) {
                    vi = intersections[i].v;
                } else
                if (vi != intersections[i].v) {
                    vj = intersections[i].v;
                    break;
                }
            }
        }
        if (vi && vj) this.splitFace(f, vi.index, vj.index);
    }
    splitFace(f, i, j) {
        let vi = this.vertices[i];
        let hei = f.he;
        while (hei.v != vi) {
            hei = hei.next;
            if (hei === f.he) return;
        }
        let vj = this.vertices[j];
        let hej = f.he;
        while (hej.v != vj) {
            hej = hej.next;
            if (hej === f.he) return;
        }
        if (hei.next === hej || hej.next === hei) return;
        let heip = hei.prev;
        let hejp = hej.prev;
        let heNew = new Halfedge(this.halfedges.length);
        let hepNew = new Halfedge(this.halfedges.length);
        heNew.UV = hej.UV.copy();
        hepNew.UV = hei.UV.copy();
        this.connectVertex(vi, hepNew);
        this.connectVertex(vj, heNew);
        this.pairHalfedges(heNew, hepNew);
        this.createEdge(heNew);
        this.halfedges.push(heNew);
        this.halfedges.push(hepNew);
        this.connectHalfedges(heip, hepNew);
        this.connectHalfedges(hepNew, hej);
        this.connectHalfedges(hejp, heNew);
        this.connectHalfedges(heNew, hei);
        heNew.f = f;
        let he = hej;
        let nf = new Face(this.faces.length, f.col);
        this.faces.push(nf);
        nf.textureId = f.textureId;
        do {
            this.connectFace(nf, he);
            he = he.next;
        } while (he != hej);
        f.he = hei;
    }
    removeVertex(v) {
        let index = this.vertices.indexOf(v);
        if (index > -1) {
            this.vertices.splice(index, 1);
        }
    }
    removeFace(f) {
        let index = this.faces.indexOf(f);
        if (index > -1) {
            this.faces.splice(index, 1);
        }
    }
    removeHalfedge(he) {
        let index = this.halfedges.indexOf(he);
        if (index > -1) {
            this.halfedges.splice(index, 1);
        }
    }
    removeEdge(e) {
        let index = this.edges.indexOf(e);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }
    deleteFace(f) {
        let he = f.he;
        do {
            if (he.v.he === he) he.v.he = null;
            if (he.pair) {
                he.pair.pair = null;
                he.pair.e = null;
            }
            this.removeHalfedge(he);
            this.removeEdge(he.e);
            he = he.next;
        } while (he != f.he);
        this.removeFace(f);
        this.reconnectVertices();
        this.indexHalfedges();
        this.indexFaces();
        this.indexEdges();
        let checklist = this.vertices.slice();
        for (let i = 0; i < checklist.length; i++) {
            if (!checklist[i].he) this.removeVertex(checklist[i]);
        }
        this.indexVertices();
    }
    deleteFrontFaces(P) {
        let checklist = this.faces.slice();
        for (let i = 0; i < checklist.length; i++) {
            if (checklist[i].sideOfPlane(P) === 1) {
                this.deleteFace(checklist[i]);
            }
        }
    }
    capSlice(col, P, id, capId) {
        let cap = new Face(this.faces.length, col);
        let caphe, trial;
        let capHalfedges = [];
        for (let i = 0; i < this.halfedges.length; i++) {
            if (this.halfedges[i].pair == null) {
                caphe = new Halfedge(this.halfedges.length + capHalfedges.length);
                capHalfedges.push(caphe);
                this.pairHalfedges(this.halfedges[i], caphe);
                this.createEdge(this.halfedges[i]);
                this.connectVertex(this.halfedges[i].next.v, caphe);
                let local = P.local(caphe.v.x, caphe.v.y, caphe.v.z);
                caphe.UV = new p5.Vector((local.x + 400.0) / 800.0, (local.y + 400.0) / 800.0);
                this.connectFace(cap, caphe);
                cap.textureId = id;
                cap.id = capId
            }
        }
        for (let i = 0; i < capHalfedges.length; i++) {
            this.halfedges.push(capHalfedges[i]);
        }
        if (capHalfedges.length > 0) this.faces.push(cap);
        for (let i = 0; i < capHalfedges.length; i++) {
            caphe = capHalfedges[i];
            if (!caphe.next) {
                for (let j = 0; j < capHalfedges.length; j++) {
                    trial = capHalfedges[j];
                    if (i != j && trial.v === caphe.pair.v) {
                        this.connectHalfedges(caphe, trial);
                        break;
                    }
                }
            }
        }
    }
}