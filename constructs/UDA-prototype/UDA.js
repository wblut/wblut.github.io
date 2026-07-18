/*
Generative geometry by Frederik Vanhoutte, wblut

A system capable of deep tranquility and great turmoil, a reflection on intentionality and serendipity, on safe boredom and discomforting chaos

mouse:

click top right: create a new iteration
click top left: cycle through views
click bottom left: decrease explosion factor
click bottom right: increase explosion factor
click mid edges left, right, top and bottom: rotate
click center: toggle lines and missing elements

keyboard:

'l' or 'L': toggle lines
'k' or 'K': toggle missing elements
'n' and "N": adjust noise level
'a' or 'A': add additional breakpoint
'e': decrease explosion factor
'E': increase explosion factor
'r' or 'R': create a new iteration

'v' or 'V': change view
'+' and '-': zoom in and out
arrow keys: move viewpoint
's' or 'S' : square screenshot
'd' :  save 16:9 screenshot
'D' :  save 4:3 screenshot
'f' :  save 9:16 screenshot
'F' :  save 3:4 screenshot



*/


'use strict'
p5.disableFriendlyErrors = true
const OMEPS = 0.9999
const EPS = 0.0001
const OPEPS = 1.0001
let gl
let slices
let side
let zoom, manualZoom
let bases, unbases, meshes, newMeshes
let points
let numPoints
let inside, outside, lineColor, bkg, shade
let geometryZoom, randomZoom
let ax, ay, ty, gy, tx
let numberOfVoronoi
let minx, maxx, centerx, rangex
let miny, maxy, centery, rangey
let minz, maxz, centerz, rangez
let ix, iy, iz
let dx, dy, dz
let refresh
let explode
let skewx, skewy, skewz
let randx, randy, randz;
let allExtents
let fail
let viewAngle
let retain
let sliceChance
let shape
let lineWidth
let saveImage
let saveSizeX, saveSizeY
let prevWidth, prevHeight
let paletteRoll
let permutationId
let name
let skewString
let randString
let pol
let cover
let box
let pyrSides
let viewMode
let renderMode
let numModes
let edgesOn
let unbaseOn
let fadeDir
let noiseLevel
let noiseFrequency

const randomRange = (a, b) => {
    return a + (b - a) * random(1.0)
}

const randomValue = (a) => {
    return a * random(1.0)
}


const diceRoll = (n) => {
    let roll =n*random(1.0)
    return Math.floor(roll+1)
}
function windowResized() {
    const {
        width,
        height
    } = {
        width: windowWidth,
        height: windowHeight
    } 
    pixelDensity(2)
    resizeCanvas(width, height)
    refresh = true
}
function setup() {
    const {
        width,
        height
    } = {
        width: windowWidth,
        height: windowHeight
    }
    pixelDensity(2)
    setAttributes('antialias', true)
    createCanvas(width, height, WEBGL)
    gl = document.getElementById('defaultCanvas0').getContext('webgl')
    colorMode(RGB)
    ay = Math.PI
    refresh = true
    fixed()
    variation()
    name = shape + (shape == 'PYR' || shape == 'STK' || shape == 'WLL' || shape == 'PLR' || shape == 'GAL' ? pyrSides : '') + ((pol && (shape == 'TRI' || shape == 'PYR')) ? 'i' : '') + (box ? 'b' : '') + (cover ? 't ' : ' ') + randString + '-' + String(ix).padStart(2, '0') + String(iy).padStart(2, '0') + String(iz).padStart(2, '0') + '-' + skewString + ' ' + 'PAL' + String(paletteRoll + 1).padStart(2, '0') + '-' + String(permutationId).padStart(3, '0')
    console.log('Name: ' + name)
    console.log('Shape: ' + (shape + (shape == 'PYR' || shape == 'STK' || shape == 'WLL' || shape == 'PLR' || shape == 'GAL' ? pyrSides : '') + ((pol && (shape == 'TRI' || shape == 'PYR')) ? 'i' : '') + (box ? 'b' : '') + (cover ? 't' : '')))
    console.log('Slice pattern: ' +  (String(ix).padStart(2, '0') + String(iy).padStart(2, '0') + String(iz).padStart(2, '0') + '-' + skewString))
    console.log('Break points: ' +(randString))
    console.log('Color: ' + 'PAL' + String(paletteRoll + 1).padStart(2, '0') + '-' + String(permutationId).padStart(3, '0'))
    numModes = 7
    noiseLevel = (diceRoll(5) - 1) * 5
    noiseFrequency = 0.005
    randomZoom = randomRange(0.9, 1.0)
    manualZoom = randomZoom
}
const fixed = () => {
    viewMode = diceRoll(3) + 1
    edgesOn = true
    unbaseOn = random(1.0) < 0.5
    renderMode=(edgesOn?0:1) + (unbaseOn?0:2)
    ax = radians(2 * Math.floor(-2+5*random(1.0)))
    colors()
    let page = select('body');
    page.style('background-color', color(red(bkg), green(bkg), blue(bkg)))
    numberOfVoronoi = (diceRoll(5) + 1) * 5
    side = 600
    explode = 0.1 * (diceRoll(6) - 1)
    viewAngle = randomRange(-Math.PI / 5.0, Math.PI / 5.0)
    shape = '';
    shapes()
    do {
        ix = 3 + diceRoll(7)
        iy = 3 + diceRoll(7)
        iz = 3 + diceRoll(7)
    } while (ix * iy * iz > 240 || ix * iy * iz < 24)
    noiseSeed(diceRoll(1000000))
    retain = 0.35 + diceRoll(6) * 0.05
    sliceChance = 0.30 + diceRoll(10) * 0.05
    skewx = (diceRoll(2) - 1) * 0.2
    skewy = (diceRoll(2) - 1) * 0.2
    skewz = (diceRoll(2) - 1) * 0.2
    skewString = ''
    if (skewx > 0) {
        skewString += 'X'
    }
    if (skewy > 0) {
        skewString += 'Y'
    }
    if (skewz > 0) {
        skewString += 'Z'
    }
    if (skewString == '') {
        skewString = '0'
    }
    skewString += '-' + Math.floor(sliceChance * 100) + '-' + Math.floor(retain * 100)
    do {
        randx = (diceRoll(2) - 1) * 0.5
        randy = (diceRoll(2) - 1) * 0.5
        randz = (diceRoll(2) - 1) * 0.5
    } while (randx + randy + randz === 0)
    randString = numberOfVoronoi + '-'
    if (randx > 0) {
        randString += 'X'
    }
    if (randy > 0) {
        randString += 'Y'
    }
    if (randz > 0) {
        randString += 'Z'
    }
    pol = randomRange(0.0, 100.0) > 50
    box = randomRange(0.0, 100.0) > 50
    cover = randomRange(0.0, 100.0) > 50
    fadeDir = new p5.Vector(randomRange(-1, 1), randomRange(-1, 1), randomRange(0, 1))
    fadeDir.normalize()
}
const shapes = () => {
    let roll = -1//diceRoll(12)
    pyrSides = 3 + diceRoll(7)
    switch (roll) {
        case 1:
            shape = 'CUB'
            break
        case 2:
            shape = 'HEX'
            break
        case 3:
            shape = 'TWR'
            break
        case 4:
            shape = 'DSK'
            break
        case 5:
            shape = 'PYR'
            break
        case 6:
            shape = 'BLK'
            break
        case 7:
            shape = 'STK'
            break
        case 8:
            shape = 'PLR'
            break
        case 9:
            shape = 'WLL'
            break
        case 10:
            shape = 'CYL'
            break
        case 11:
            shape = 'HEX2'
            break
        case 12:
            shape = 'GAL'
            pyrSides = 3 + diceRoll(4)
            break
        default:
            shape = 'CUB'
    }
}
const variation = () => {
    initialGeometry()
}
const initialGeometry = () => {
    let failed = false
    let trial = 0
    gy = 0
    try {
        meshes = []
        bases = []
        unbases = []
        newMeshes = []
        slices = 0
        meshes.length = 0
        let mesh
        switch (shape) {
            case 'CUB':
                dx = side
                dy = side
                dz = side
                geometryZoom = 0.55
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx + 5, dy + 5, dz + 5, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                break
            case 'BLK':
                dx = side
                dy = 0.4 * side
                dz = side
                geometryZoom = 0.65
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx + 5, dy + 5, dz + 5, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                break
            case 'CRS':
                dx = 0.2 * side
                dy = side
                dz = 0.2 * side
                geometryZoom = 0.6
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx + 5, dy + 5, dz + 5, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(-0.3 * side, 0, 0, 0.4 * side + 5, dy * .2, dz, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0.3 * side, 0, 0, 0.4 * side + 5, dy * .2, dz, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, -0.3 * side, dx, dy * .2, 0.4 * side + 5, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0.3 * side, dx, dy * .2, 0.4 * side + 5, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                dx *= 5
                dz *= 5
                break
            case 'HEX':
                dx = 0.5 * side
                dy = 0.5 * side
                dz = 0.25 * side
                geometryZoom = 0.6
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createPrismWithCenterSizeAndSides(0, 0, 0, dx, dz + 5, 6, 0, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                break
            case 'HEX2':
                dx = 0.5 * side
                dy = 0.5 * side
                dz = 2.0 * side
                geometryZoom = 0.8
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createPrismWithCenterSizeAndSides(0, 0, 0, dx, dz + 5, 6, 0, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                box = false
                break
            case 'DSK':
                dx = side
                dy = side
                dz = 0.5 * side
                geometryZoom = 0.6
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createPrismWithCenterSizeAndSides(0, 0, 0, dx, dz + 5, 24, 0, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                break
            case 'CYL':
                dx = side
                dy = side
                dz = 2.5 * side
                geometryZoom = 0.6
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createPrismWithCenterSizeAndSides(0, 0, 0, dx, dz + 5, 24, 0, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                box = false
                break
            case 'TRI':
                dx = 0.5 * side
                dy = 0.5 * side
                dz = 0.25 * side
                geometryZoom = 0.55
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createPrismWithCenterSizeAndSides(0, 0, 0, dx, dz + 5, 3, pol ? radians(210) : radians(30), outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                gy = 0 //0.05 * side*(pol?1:-1)
                break
            case 'PYR':
                dx = 0.4 * side
                dy = side
                dz = 0.4 * side
                geometryZoom = 0.6
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createPyramidWithCenterSizeAndSides(0, 0, 0, dx, dy + 5, pyrSides, pol, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                gy = 0
                break
            case 'TWR':
                dx = 0.2 * side
                dy = side
                dz = 0.2 * side
                geometryZoom = 0.6
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createRodWithCenterSizeAndSides(0, 0, 0, dx + 5, dy + 5, 6, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                break
            case 'MNL':
                dx = 0.4 * side
                dy = 0.9 * side
                dz = 0.1 * side
                geometryZoom = 0.6
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx + 5, dy + 5, dz + 5, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
                break
            case 'STK':
                dx = 0.6 * side
                dy = side
                dz = 0.6 * side
                geometryZoom = 0.6
                for (let i = 0; i <= pyrSides; i++) {
                    mesh = new SliceMesh()
                    mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, -0.05 * pyrSides * dy + 0.075 * dy * i, 0, dx + pyrSides * 0.05, 0.012 * dy, dz + pyrSides * 0.05, outside))
                    mesh.getExtents()
                    mesh.getCenter()
                    mesh.getFaceNormals()
                    meshes.push(mesh)
                }
                break
            case 'GAL':
                if (pol) {
                    dx = side
                    dy = side
                    dz = side
                    geometryZoom = 0.65
                    for (let i = 0; i <= pyrSides; i++) {
                        for (let j = 0; j <= pyrSides; j++) {
                            mesh = new SliceMesh()
                            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(i * dx / pyrSides - 0.5 * dx, 0, j * dz / pyrSides - 0.5 * dz, dx / pyrSides * 0.8, randomRange(dy * 0.1, dy * 0.9), dz / pyrSides * 0.8, outside))
                            mesh.getExtents()
                            mesh.getCenter()
                            mesh.getFaceNormals()
                            meshes.push(mesh)
                        }
                    }
                } else {
                    dx = 2 * side
                    dy = side
                    dz = side
                    geometryZoom = 0.65
                    for (let i = 0; i <= pyrSides; i++) {
                        for (let j = 0; j <= pyrSides; j++) {
                            mesh = new SliceMesh()
                            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, i * dy / pyrSides - 0.5 * dy, j * dz / pyrSides - 0.5 * dz, randomRange(dx * 0.1, dx * 0.9), dy / pyrSides * 0.8, dz / pyrSides * 0.8, outside))
                            mesh.getExtents()
                            mesh.getCenter()
                            mesh.getFaceNormals()
                            meshes.push(mesh)
                        }
                    }
                }
                break
            case 'WLL':
                dx = side
                dy = 1.2 * side
                dz = 0.6 * side
                geometryZoom = 0.6
                for (let i = 0; i <= pyrSides; i++) {
                    mesh = new SliceMesh()
                    mesh.create(MeshDataFactory.createBoxWithCenterAndSize(-0.05 * pyrSides * dx + 0.075 * dx * i, 0, 0, 0.012 * dx, dy + pyrSides * 0.05, dz + pyrSides * 0.05, outside))
                    mesh.getExtents()
                    mesh.getCenter()
                    mesh.getFaceNormals()
                    meshes.push(mesh)
                }
                break
            case 'PLR':
                dx = 0.5 * side
                dy = side
                dz = side
                geometryZoom = 0.6
                for (let i = 0; i <= pyrSides; i++) {
                    mesh = new SliceMesh()
                    mesh.create(MeshDataFactory.createSkewedBoxWithCenterAndSize(randomRange(-dx, dx), 0, -0.5 * dz + i * dz / pyrSides, dx * 0.4 + 5, dy + 5, 0.8 * dz / pyrSides, randomRange(-dz, dz), 0, outside))
                    mesh.getExtents()
                    mesh.getCenter()
                    mesh.getFaceNormals()
                    meshes.push(mesh)
                }
                cover = true
                break
            default:
                mesh = new SliceMesh()
                mesh.create(MeshDataFactory.createBoxWithCenterAndSize(0, 0, 0, dx + 5, dy + 5, dz + 5, outside))
                mesh.getExtents()
                mesh.getCenter()
                mesh.getFaceNormals()
                meshes.push(mesh)
        }
        getAllExtents()
        mesh = new SliceMesh()
        mesh.create(MeshDataFactory.createBoxWithCenterAndSize(centerx, maxy + 0.05 * side, centerz, 1.5 * Math.max(rangex, rangez), 0.01 * side, 1.5 * Math.max(rangex, rangez), outside))
        mesh.getExtents()
        mesh.getCenter()
        mesh.getFaceNormals()
        meshes.push(mesh)
        if (cover) {
            mesh = new SliceMesh()
            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(centerx, miny - 0.05 * side, centerz, 1.5 * Math.max(rangex, rangez), 0.01 * side, 1.5 * Math.max(rangex, rangez), outside))
            mesh.getExtents()
            mesh.getCenter()
            mesh.getFaceNormals()
            meshes.push(mesh)
        }
        if (box) {
            mesh = new SliceMesh()
            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(centerx - 0.75 * Math.max(rangex, rangez) - 0.025 * side, centery, centerz, 0.01 * side, rangey + 0.05 * side, 1.5 * Math.max(rangex, rangez), outside))
            mesh.getExtents()
            mesh.getCenter()
            mesh.getFaceNormals()
            meshes.push(mesh)
            mesh = new SliceMesh()
            mesh.create(MeshDataFactory.createBoxWithCenterAndSize(centerx + 0.75 * Math.max(rangex, rangez) + 0.025 * side, centery, centerz, 0.01 * side, rangey + 0.05 * side, 1.5 * Math.max(rangex, rangez), outside))
            mesh.getExtents()
            mesh.getCenter()
            mesh.getFaceNormals()
            meshes.push(mesh)
        }
        if (dx / ix < 15) ix = Math.floor(dx / 15)
        if (dy / iy < 15) iy = Math.floor(dy / 15)
        if (dz / iz < 15) iz = Math.floor(dz / 15)
        for (let i = 0; i < ix; i++) {
            globalSlice(minx + (1.0 / ix) * rangex * (i + 0.5), 0, 0, 1, randomRange(-skewx, skewx), randomRange(-skewx, skewx), 0, 100 * sliceChance)
        }
        for (let j = 0; j < iy; j++) {
            globalSlice(0, miny + (1.0 / iy) * rangey * (j + 0.5), 0, randomRange(-skewy, skewy), 1, randomRange(-skewy, skewy), 0, 100 * sliceChance)
        }
        for (let k = 0; k < iz; k++) {
            globalSlice(0, 0, minz + (1.0 / iz) * rangez * (k + 0.5), randomRange(-skewz, skewz), randomRange(-skewz, skewz), 1, 0, 100 * sliceChance)
        }
        meshes.forEach(mesh => {
            if (randomRange(0.0, 1.0) < retain && !isVeryThinMesh(mesh, 2)) {
                let base = mesh.copy()
                base.getExtents()
                bases.push(base)
            } else {
                let unbase = mesh.copy()
                unbase.getExtents()
                unbases.push(unbase)
            }
        })
        meshes.length = 0
        splice(meshes, bases, 0)
        getAllExtents()
        points = []
        numPoints = 0
        refresh = true
        trial++
    } catch {
        failed = true
    }
    if (failed && trial < 100) initialGeometry()
    fail = 0
    tx = 0
    ty = 0
}
const isVeryThinMesh = (mesh, treshold) => {
    let ean
    mesh.faceNormals.forEach(normal => {
        ean = extentAlongNormal(mesh, normal)
        if (ean < treshold) {
            return true
        }
    })
    return false
}
const extentAlongNormal = (mesh, normal) => {
    let mind = 100000
    let maxd = -100000
    let projv
    mesh.vertices.forEach(v => {
        projv = v.x * normal[0] + v.y * normal[1] + v.z * normal[2]
        if (projv < mind) mind = projv
        if (projv > maxd) maxd = projv
    })
    return maxd - mind
}
const globalSlice = (ox, oy, oz, nx, ny, nz, g, chance) => {
    newMeshes.length = 0
    let origin = new p5.Vector(ox, oy, oz)
    let normal = new p5.Vector(nx, ny, nz)
    let normalFlip = p5.Vector.mult(normal, -1)
    try {
        meshes.forEach(mesh => {
            if (diceRoll(100) - 1 < chance) {
                let copy = mesh.copy()
                mesh.slice(new Plane(origin, normal), g, outside, slices)
                if (mesh.isValid() && mesh.vertices.length > 0) {
                    mesh.getExtents()
                    mesh.getCenter()
                    mesh.getFaceNormals()
                    newMeshes.push(mesh)
                }
                copy.slice(new Plane(origin, normalFlip), g, outside, slices)
                if (copy.isValid() && copy.vertices.length > 0) {
                    copy.getExtents()
                    copy.getCenter()
                    copy.getFaceNormals()
                    newMeshes.push(copy)
                }
            } else {
                newMeshes.push(mesh)
            }
        })
        meshes.length = 0
        splice(meshes, newMeshes, 0)
        newMeshes.length = 0
    } catch {
        console.log('Slice failed, pretending nothing happened.')
        fail++
    }
    refresh = true
}

function draw() {
    if (saveImage) {
        prevWidth = width
        prevHeight = height
        resizeCanvas(saveSizeX, saveSizeY)
        refresh = true
    }
    if (refresh) {
        if (saveImage) {
            pixelDensity(1)
            zoom = geometryZoom * Math.min(Math.min(saveSizeX, saveSizeY) / rangey, 0.5 * (Math.min(saveSizeX, saveSizeY) / rangex + Math.min(saveSizeX, saveSizeY) / rangez))
        } else {
            zoom = geometryZoom * Math.min(Math.min(width, height) / rangey, 0.5 * (Math.min(width, height) / rangex + Math.min(width, height) / rangez))
        }
        background(bkg)
        noLights()
        lineWidth = saveImage ? 2 : 1 //Math.min(1.0, Math.min(width,height)/540.0)
        scale(zoom * manualZoom)
        gl.disable(gl.DEPTH_TEST)
        if (viewMode > 5) {
            push()
            translate(-centerx - tx, -centery - ty - gy)
            drawGradient()
            pop()
        }
        let mc = 0
        if (viewMode > 4) {
            push()
            translate(-centerx, -centery + ty - gy, -centerz)
            mc = 0
            meshes.forEach(mesh => {
                push()
                translate(side * (mc % 3 - 1), 0, 0)
                scale(1.0 + 0.5 * ((mc / 2) % 5))
                drawMeshBackground(mesh)
                pop()
                mc++
            })
            pop()
        }
        push()
        rotateX(ax)
        rotateY(ay + viewAngle)
        translate(-centerx, -centery + ty - gy, -centerz)
        if (viewMode > 3) {
            mc = 0
            meshes.forEach(mesh => {
                push()
                scale(1.2 + Math.abs(0.33 - explode) * ((mc / 2) % 5))
                drawMeshShade(mesh)
                pop()
                mc++
            })
        }
        if (viewMode > 2) {
            mc = 0
            meshes.forEach(mesh => {
                push()
                scale(1.0 + Math.abs(0.3 - explode) * ((mc / 2) % 5))
                drawMeshGray(mesh)
                pop()
                mc++
            })
        }
        rotateY(ay - viewAngle)
        if (viewMode > 1) {
            mc = 0
            meshes.forEach(mesh => {
                push()
                scale(1.0 + Math.abs(0.33 - explode) * ((mc / 2) % 5))
                drawMeshShade(mesh)
                pop()
                mc++
            })
        }
        pop()
        push()
        gl.enable(gl.DEPTH_TEST)
        rotateX(ax)
        rotateY(ay + viewAngle)
        translate(-centerx, -centery + ty - gy, -centerz)
        if (viewMode > 0) {
            meshes.forEach(mesh => drawMesh(mesh))
        } else {
            bases.forEach(mesh => {
                let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
                if (unbaseOn) {
                    noFill()
                    stroke(lineColor)
                    strokeWeight(lineWidth)
                    if (edgesOn || viewMode === 0) {
                        mesh.drawEdges(ff)
                        if (saveImage) {
                            mesh.drawVertices(ff, 0.5 * lineWidth / zoom / manualZoom)
                        }
                    }
                } else {
                    if (!edgesOn) {
                        noStroke()
                    } else {
                        stroke(lineColor)
                    }
                    mesh.draw(ff, 50)
                }
            })
        }
        unbases.forEach(mesh => {
            let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
            if (unbaseOn) {
                noFill()
                stroke(lineColor)
                strokeWeight(lineWidth)
                if (edgesOn || viewMode === 0) {
                    mesh.drawEdges(ff)
                    if (saveImage) {
                        mesh.drawVertices(ff, 0.5 * lineWidth / zoom / manualZoom)
                    }
                }
            } else {
                if (!edgesOn) {
                    noStroke()
                } else {
                    stroke(lineColor)
                }
                mesh.draw(ff, 50)
            }
        })
        pop()
        if (frameCount > 12 && slices < numberOfVoronoi) {
            addSlice()
        } else if (slices >= numberOfVoronoi) {
            if (slices === numberOfVoronoi) {
                
            }
            refresh = false
        }
    }
    if (saveImage) {
        save('UDA' + '_' + name.replaceAll(' ', '_') + '_' + Date.now() + '.png')
        resizeCanvas(prevWidth, prevHeight)
        refresh = true
        saveImage = false
        pixelDensity(2)
    }
}
const drawGradient = () => {
    push()
    let r2 = 0.25 * width / zoom * 0.25 * height / zoom
    for (let i = -0.5 * width / (zoom * manualZoom); i < 0.5 * width / (zoom * manualZoom); i += 40) {
        for (let j = -0.5 * height / (zoom * manualZoom); j < 0.5 * height / (zoom * manualZoom); j += 40) {
            noStroke()
            let cc = noise(-35 + i * 0.0032, 37 + j * 0.0032)
            let cr = noise(20 + i * 0.0032, 20 + j * 0.0032)
            let ccr = noise(105 + i * 0.0016, -39 + j * 0.0016)
            let alph = constrain(150 * cr * map(i * i + j * j, 0, r2, 0, 1.0), 0, 255)
            if (cc < 0.35) {
                fill(red(inside), green(inside), blue(inside), alph)
            } else if (cc < 0.60) {
                fill(red(shade), green(shade), blue(shade), alpha(shade) * alph / 150.0)
            } else {
                fill(red(outside), green(outside), blue(outside), alph)
            }
            if (cr > 0) {
                if (ccr < 0.5) {
                    rect(i - 20 * cr * (1.0 - alph / 255.0), j - 20 * cr * (1.0 - alph / 255.0), 40 * cr * (1.0 - alph / 255.0), 40 * cr * (1.0 - alph / 255.0));
                } else {
                    ellipse(i, j, 40 * cr * (1.0 - alph / 255.0), 40 * cr * (1.0 - alph / 255.0))
                }
            }
        }
    }
    pop()
}
const getAllExtents = () => {
    minx = 50000
    maxx = -50000
    centerx = 0
    miny = 50000
    maxy = -50000
    centery = 0
    minz = 50000
    maxz = -50000
    centerz = 0
    meshes.forEach(mesh => {
        let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
        minx = Math.min(minx, mesh.extents[0] + ff[0] * mesh.center[0])
        maxx = Math.max(maxx, mesh.extents[3] + ff[0] * mesh.center[0])
        miny = Math.min(miny, mesh.extents[1] + ff[1] * mesh.center[1])
        maxy = Math.max(maxy, mesh.extents[4] + ff[1] * mesh.center[1])
        minz = Math.min(minz, mesh.extents[2] + ff[2] * mesh.center[2])
        maxz = Math.max(maxz, mesh.extents[5] + ff[2] * mesh.center[2])
    })
    bases.forEach(mesh => {
        let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
        minx = Math.min(minx, mesh.extents[0] + ff[0] * mesh.center[0])
        maxx = Math.max(maxx, mesh.extents[3] + ff[0] * mesh.center[0])
        miny = Math.min(miny, mesh.extents[1] + ff[1] * mesh.center[1])
        maxy = Math.max(maxy, mesh.extents[4] + ff[1] * mesh.center[1])
        minz = Math.min(minz, mesh.extents[2] + ff[2] * mesh.center[2])
        maxz = Math.max(maxz, mesh.extents[5] + ff[2] * mesh.center[2])
    })
    unbases.forEach(mesh => {
        let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
        minx = Math.min(minx, mesh.extents[0] + ff[0] * mesh.center[0])
        maxx = Math.max(maxx, mesh.extents[3] + ff[0] * mesh.center[0])
        miny = Math.min(miny, mesh.extents[1] + ff[1] * mesh.center[1])
        maxy = Math.max(maxy, mesh.extents[4] + ff[1] * mesh.center[1])
        minz = Math.min(minz, mesh.extents[2] + ff[2] * mesh.center[2])
        maxz = Math.max(maxz, mesh.extents[5] + ff[2] * mesh.center[2])
    })
    centerx = 0.5 * (maxx + minx)
    rangex = (maxx - minx)
    centery = 0.5 * (maxy + miny)
    rangey = (maxy - miny)
    centerz = 0.5 * (maxz + minz)
    rangez = (maxz - minz)
    allExtents = [minx, miny, minz, maxx, maxy, maxz, centerx, centery, centerz, rangex, rangey, rangez]
}
const drawMesh = (mesh) => {
    let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
    noStroke()
    mesh.draw(ff)
    noFill()
    strokeWeight(lineWidth)
    stroke(lineColor)
    if (edgesOn) {
        mesh.drawEdges(ff)
        if (saveImage) {
            mesh.drawVertices(ff, 0.5 * lineWidth / zoom / manualZoom)
        }
    }
}
const drawMeshGray = (mesh, i) => {
    let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
    let c = color(15 + i)
    noStroke()
    mesh.drawFixedColor(ff, c)
}
const drawMeshBackground = (mesh, i) => {
    let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
    let c = color(15 + i, 25)
    noStroke()
    mesh.drawFixedColor(ff, c)
}
const drawMeshShade = (mesh, i) => {
    let ff = f(mesh.center[0], mesh.center[1], mesh.center[2])
    let c = shade
    noStroke()
    mesh.drawFixedColor(ff, c)
}
const gap = (x, y, z) => {
    return 0.0
}
const f = (x, y, z) => {
    let ff = explode
    return [explode, explode, explode]
}
const getRandomPoint = (meshExtents) => {
    return new p5.Vector(meshExtents[6] + randx * randomRange(-meshExtents[9], meshExtents[9]), meshExtents[7] + randy * randomRange(-meshExtents[10], meshExtents[10]), meshExtents[8] + randz * randomRange(-meshExtents[11], meshExtents[11]))
}
const addVoronoiPoint = () => {
    newMeshes.length = 0
    try {
        if (numPoints === 0) {
            let firstPoint = new p5.Vector(0, 0, 0)
            points.push(firstPoint)
            numPoints++
        }
        let newPoint
        let mind2 = 100000000.0
        let trial = 0
        do {
            newPoint = getRandomPoint(allExtents)
            for (let i = 0; i < points.length; i++) {
                let d2 = (newPoint.x - points[i].x) * (newPoint.x - points[i].x) + (newPoint.y - points[i].y) * (newPoint.y - points[i].y) + (newPoint.z - points[i].z) * (newPoint.z - points[i].z)
                if (d2 < mind2) {
                    mind2 = d2
                    if (mind2 < 100.0) break
                }
            }
            trial++
        } while (mind2 < 100.0 && trial < 100)
        points.push(newPoint)
        numPoints++
        meshes.length = 0
        for (let i = 0; i < points.length; i++) {
            bases.forEach(base => {
                let mesh = base.copy()
                mesh.id = i
                for (let j = 0; j < points.length; j++) {
                    if (i != j) {
                        voronoiSlice(points[i], points[j], mesh, j)
                        if (!mesh.isValid() || mesh.vertices.length === 0) {
                            break
                        }
                    }
                }
                if (mesh.isValid() && mesh.vertices.length > 0) {
                    mesh.getExtents()
                    mesh.getCenter()
                    mesh.getFaceNormals()
                    newMeshes.push(mesh)
                }
            })
        }
        meshes.length = 0
        splice(meshes, newMeshes, 0)
        newMeshes.length = 0
    } catch {
        console.log('Adding point failed, pretending nothing happened.')
        fail++
    }
    refresh = true
}
const voronoiSlice = (p, q, mesh, j) => {
    let origin = new p5.Vector(0.5 * (p.x + q.x), 0.5 * (p.y + q.y), 0.5 * (p.z + q.z))
    let normal = new p5.Vector((q.x - p.x) + randomRange(-.1, .1), (q.y - p.y) + randomRange(-.1, .1), (q.z - p.z) + randomRange(-.1, .1))
    let g = gap(origin.x, origin.y, origin.z)
    mesh.slice(new Plane(origin, normal), g * side / 800.0, inside, j)
}
const addSlice = () => {
    addVoronoiPoint()
    slices++
    getAllExtents()
    if (fail > 3) initialGeometry()
}
function mousePressed() {
    if (mouseX < 0.2 * width) {
        if (mouseY < 0.2 * height) {
            viewMode = (viewMode + 1) % numModes
            refreshScreen()
        } else if (mouseY > 0.8 * height) {
            explode = Math.max(0.0, explode - 0.05)
            getAllExtents()
            refreshScreen()
        } else {
            ay -= radians(5)
            tx -= 5
            tx = Math.max(-side / 2, tx)
            refreshScreen()
        }
    } else if (mouseX > 0.8 * width) {
        if (mouseY < 0.2 * height) {
            variation()
            refresh = true
        } else if (mouseY > 0.8 * height) {
            explode = Math.min(2.0, explode + 0.05)
            getAllExtents()
            refreshScreen()
        } else {
            ay += radians(5)
            tx += 5
            tx = Math.min(side / 2, tx)
            refreshScreen()
        }
    } else {
        if (mouseY < 0.2 * height) {
            ty -= 5
            ax -= radians(2)
            ax = Math.max(radians(-20), ax)
            refreshScreen()
          
        } else if (mouseY > 0.8 * height) {
            ty += 5
            ax += radians(2)
            ax = Math.min(radians(20), ax)
            refreshScreen()
            
        }
     else{
        renderMode=(renderMode+1)%4
        edgesOn = (renderMode===1)||(renderMode===3)
       
        unbaseOn = (renderMode===2)||(renderMode===3)
        refreshScreen()
    }
}

}
function keyPressed() {
    if (keyCode === RIGHT_ARROW) {
        ay += radians(5)
        tx += 5
        tx = Math.min(side / 2, tx)
        refreshScreen()
    } else if (keyCode === LEFT_ARROW) {
        ay -= radians(5)
        tx -= 5
        tx = Math.max(-side / 2, tx)
        refreshScreen()
    } else if (keyCode === DOWN_ARROW) {
        ty += 5
        ax += radians(2)
        ax = Math.min(radians(20), ax)
        refreshScreen()
    } else if (keyCode === UP_ARROW) {
        ty -= 5
        ax -= radians(2)
        ax = Math.max(radians(-20), ax)
        refreshScreen()
    } else if (key === 'r' || key === 'R') {
        variation()
    } else if (key === 'a' || key === 'A') {
        addSlice()
    } else if (key === 's' || key === 'S') {
        saveImage = true
        saveSizeX = 4800
        saveSizeY = 4800
    } else if (key === 'd') {
        saveImage = true
        saveSizeX = 7680
        saveSizeY = 4320
    } else if (key === 'D') {
        saveImage = true
        saveSizeX = 6400
        saveSizeY = 4800
    } else if (key === 'n') {
        noiseLevel = Math.max(-150, noiseLevel - 5)
        refreshScreen()
    } else if (key === 'N') {
        noiseLevel = Math.min(150, noiseLevel + 5)
        refreshScreen()
    } else if (key === 'f') {
        saveImage = true
        saveSizeX = 4320
        saveSizeY = 7680
    } else if (key === 'F') {
        saveImage = true
        saveSizeX = 4800
        saveSizeY = 6400
    } else if (key === '+') {
        manualZoom += 0.05
        manualZoom = Math.min(2.0, manualZoom)
        refreshScreen()
    } else if (key === '-') {
        manualZoom -= 0.05
        manualZoom = Math.max(0.5, manualZoom)
        refreshScreen()
    } else if (key === 'e') {
        explode = Math.max(0.0, explode - 0.05)
        getAllExtents()
        refreshScreen()
    } else if (key === 'E') {
        explode = Math.min(2.0, explode + 0.05)
        getAllExtents()
        refreshScreen()
    } else if (key === 'v') {
        viewMode = (viewMode + 1) % numModes
        refreshScreen()
    } else if (key === 'l' || key === 'L') {
        edgesOn = !edgesOn
        refreshScreen()
    } else if (key === 'k' || key === 'K') {
        unbaseOn = !unbaseOn
        refreshScreen()
    }
}
const refreshScreen = () => {
    refresh = true
}
const colors = () => {
    let lineAlpha = 200
    let palettes = [
        [color(240, 234, 231), color(209, 227, 230), color(255), color(100, 255, 255)],
        [color(244, 236, 233), color(222, 185, 167), color(182, 83, 51), color(209, 107, 69)],
        [color(252, 240, 233), color(217, 238, 229), color(253, 253, 250), color(124, 170, 131)],
        [color(230, 230, 231), color(183, 143, 130), color(255), color(116, 75, 64)],
        [color(243, 239, 228), color(169, 192, 184), color(219, 198, 155), color(178, 158, 148)],
        [color(234, 237, 234), color(59, 104, 125), color(158, 125, 91), color(118, 208, 250)],
        [color(255, 210, 177), color(186, 120, 86), color(148, 111, 105), color(126, 73, 47)],
        [color(230, 230, 228), color(110, 115, 103), color(187, 183, 174), color(255, 210, 177)],
        [color(100, 154, 161), color(240, 208, 124), color(182, 234, 235), color(255, 228, 144)],
        [color(239, 233, 223), color(206, 212, 190), color(226, 220, 217), color(251, 248, 235)],
        [color(206, 212, 190), color(239, 233, 223), color(81, 80, 93), color(233, 239, 244)],
        [color(178, 187, 158), color(241, 241, 243), color(121, 151, 151), color(207, 214, 203)],
        [color(240, 240, 238), color(224, 223, 218), color(133, 150, 149), color(251, 228, 215)],
        [color(252, 220, 207), color(130, 157, 150), color(119, 102, 116), color(223, 205, 170)],
        [color(250, 211, 180), color(247, 225, 155), color(212, 182, 164), color(241, 236, 225)],
        [color(159, 138, 143), color(204, 231, 227), color(57, 52, 53), color(224, 251, 247)],
        [color(85, 87, 99), color(151, 186, 188), color(204, 134, 84), color(223, 218, 213)],
        [color(200, 143, 100), color(227, 219, 215), color(66, 23, 6), color(182, 207, 217)],
        [color(247, 238, 224), color(179, 105, 74), color(238, 238, 240), color(62, 60, 65)],
        [color(239, 201, 156), color(77, 143, 141), color(97, 113, 108), color(229, 238, 240)],
        [color(227, 225, 207), color(218, 129, 100), color(83, 81, 51), color(253, 234, 223)],
        [color(200, 205, 210), color(242, 248, 239), color(57, 83, 112), color(220, 230, 220)],
        [color(251, 240, 214), color(225, 231, 238), color(140, 128, 97), color(42, 39, 48)],
        [color(53, 52, 57), color(213, 214, 217), color(243, 174, 147), color(58, 79, 89)],
        [color(35, 57, 72), color(241, 246, 249), color(97, 113, 108), color(155, 130, 69)],
        [color(179, 105, 74), color(84, 127, 128), color(241, 246, 249), color(42, 39, 48)],
        [toColor('A130'), toColor('0270'), toColor('A570'), toColor('16X0')],
        [toColor('0120'), toColor('1430'), toColor('1660'), toColor('3640')],
        [toColor('11A0'), toColor('4430'), toColor('1240'), toColor('3560')],
        [toColor('2140'), toColor('5370'), toColor('3220'), toColor('6430')]
    ]
    for (let i = 0; i < palettes.length; i++) {
        for (let j = 0; j < 4; j++) {
            if (red(palettes[i][j]) > 220 && green(palettes[i][j]) < 60 && blue(palettes[i][j]) < 60) console.log(i)
            if (red(palettes[i][j]) < 60 && green(palettes[i][j]) > 220 && blue(palettes[i][j]) < 60) console.log(i)
            if (red(palettes[i][j]) < 60 && green(palettes[i][j]) < 60 && blue(palettes[i][j]) > 220) console.log(i)
        }
    }
    paletteRoll = Math.floor(palettes.length*random(1.0))
    let tmp
    let index = [0, 1, 2, 3]
    for (let i = 3; i > 1; i--) {
        let j = diceRoll(i);
        tmp = index[i]
        index[i] = index[j]
        index[j] = tmp
    }
    permutationId = index[1] + 4 * index[2] + 16 * index[3]
    inside = palettes[paletteRoll][index[0]]
    outside = palettes[paletteRoll][index[1]]
    shade = palettes[paletteRoll][index[2]]
    bkg = palettes[paletteRoll][index[3]]
    lineColor = color(0)
    inside = color(red(inside), green(inside), blue(inside))
    outside = color(red(outside), green(outside), blue(outside))
    bkg = color(red(bkg), green(bkg), blue(bkg))
    shade = color(red(shade), green(shade), blue(shade), -40 + diceRoll(3) * 50)
}


const toColor=(code)=> {
    let c = toValue(code.substring(0, 1));
    let m = toValue(code.substring(1, 2));
    let y = toValue(code.substring(2, 3));
    let k = toValue(code.substring(3, 4));
    return color(255 * (1.0 - c) * (1.0 - k), 255 * (1.0 - m) * (1.0 - k), 255 * (1.0 - y) * (1.0 - k));
}

const toValue=(code)=> {
    switch (code) {
        case '0':
            return 0.0;
        case 'A':
            return 0.08;
        case '1':
            return 0.13;
        case '2':
            return 0.2;
        case '3':
            return 0.3;
        case '4':
            return 0.4;
        case '5':
            return 0.5;
        case '6':
            return 0.6;
        case '7':
            return 0.7;
        case 'X':
            return 1.0;
        default:
            return 0;
    }
}

class Plane {
    constructor(o, n) {
        this.origin = o
        this.normal = n
        this.normal.normalize()
        this.u = new p5.Vector(0, 0, 1).cross(this.normal)
        if (sqrt(this.u.dot(this.u)) < EPS) {
            this.u = new p5.Vector(0, 1, 0).cross(this.normal)
        }
        this.u.normalize()
        this.v = this.normal.cross(this.u)
    }
    offset(d) {
        return new Plane(p5.Vector.add(this.origin, p5.Vector.mult(this.normal, d)), this.normal)
    }
    flip() {
        return new Plane(this.origin, p5.Vector.mult(this.normal, -1))
    }
    local(x, y, z) {
        return new p5.Vector(this.u.x * (x - this.origin.x) + this.u.y * (y - this.origin.y) + this.u.z * (z - this.origin.z), this.v.x * (x - this.origin.x) + this.v.y * (y - this.origin.y) + this.v.z * (z - this.origin.z), this.normal.x * (x - this.origin.x) + this.normal.y * (y - this.origin.y) + this.normal.z * (z - this.origin.z))
    }
    draw(side) {
        line(this.origin.x - 0.5 * side * this.u.x, this.origin.y - 0.5 * side * this.u.y, this.origin.z - 0.5 * side * this.u.z, this.origin.x + 0.5 * side * this.u.x, this.origin.y + 0.5 * side * this.u.y, this.origin.z + 0.5 * side * this.u.z)
        beginShape()
        vertex(this.origin.x - 0.5 * side * this.u.x - 0.1 * side * this.v.x, this.origin.y - 0.5 * side * this.u.y - 0.1 * side * this.v.y, this.origin.z - 0.5 * side * this.u.z - 0.1 * side * this.v.z)
        vertex(this.origin.x + 0.5 * side * this.u.x - 0.1 * side * this.v.x, this.origin.y + 0.5 * side * this.u.y - 0.1 * side * this.v.y, this.origin.z + 0.5 * side * this.u.z - +0.1 * side * this.v.z)
        vertex(this.origin.x + 0.5 * side * this.u.x + 0.1 * side * this.v.x, this.origin.y + 0.5 * side * this.u.y + 0.1 * side * this.v.y, this.origin.z + 0.5 * side * this.u.z + 0.1 * side * this.v.z)
        vertex(this.origin.x - 0.5 * side * this.u.x + 0.1 * side * this.v.x, this.origin.y - 0.5 * side * this.u.y + 0.1 * side * this.v.y, this.origin.z - 0.5 * side * this.u.z + 0.1 * side * this.v.z)
        endShape(CLOSE)
    }
}
class Halfedge {
    constructor(i) {
        this.index = i
    }
    nextInVertex() {
        return this.pair.next
    }
    prevInVertex() {
        return this.prev.pair
    }
}
class HEVertex {
    constructor(x, y, z, i) {
        this.x = x
        this.y = y
        this.z = z
        this.index = i
    }
    distance(P) {
        let signedDistance = P.normal.dot(new p5.Vector(this.x - P.origin.x, this.y - P.origin.y, this.z - P.origin.z))
        return abs(signedDistance)
    }
    sideOfPlane(P) {
        let signedDistance = P.normal.dot(new p5.Vector(this.x - P.origin.x, this.y - P.origin.y, this.z - P.origin.z))
        return (signedDistance > EPS) ? 1 : (signedDistance < -EPS) ? -1 : 0
    }
}
class Face {
    constructor(i, c) {
        this.index = i
        if (c) {
            this.col = c
        } else {
            this.col = color(0, 255, 0)
        }
        this.id = -1
    }
    order() {
        let lhe = this.he
        let ord = 0
        do {
            ord++
            lhe = lhe.next
        } while (lhe != this.he)
        return ord
    }
    extents() {
        let lhe = this.he
        let ord = 0
        let ext = [lhe.v.x, lhe.v.y, lhe.v.z, lhe.v.x, lhe.v.y, lhe.v.z]
        do {
            ord++
            ext[0] = Math.min(ext[0], lhe.v.x)
            ext[1] = Math.min(ext[1], lhe.v.y)
            ext[2] = Math.min(ext[2], lhe.v.z)
            ext[3] = Math.max(ext[3], lhe.v.x)
            ext[4] = Math.max(ext[4], lhe.v.y)
            ext[5] = Math.max(ext[5], lhe.v.z)
            lhe = lhe.next
        } while (lhe != this.he)
        return ext
    }
    sideOfPlane(P) {
        let lhe = this.he
        let sideOfVertex
        let plus = 0
        let minus = 0
        do {
            sideOfVertex = lhe.v.sideOfPlane(P)
            if (sideOfVertex === 1) {
                plus++
            } else if (sideOfVertex === -1) {
                minus++
            }
            lhe = lhe.next
        } while (lhe != this.he)
        if (plus > 0 && minus === 0) {
            return 1
        } else if (plus === 0 && minus > 0) {
            return -1
        } else {
            return 0
        }
    }
}
class Edge {
    constructor(i) {
        this.index = i
    }
}
class Mesh {
    constructor() {
        this.initialize()
    }
    initialize() {
        this.halfedges = []
        this.vertices = []
        this.faces = []
        this.faceNormals = []
        this.edges = []
        this.extents = []
        this.center = [0, 0, 0]
        this.id = -1
    }
    create(data) {
        this.createRaw(data.vertexArray, data.faceArray, data.halfedgePairArray, data.faceColor)
        this.getExtents()
        this.getCenter()
        this.getFaceNormals()

    }
    createRaw(vertexArray, faceArray, halfedgePairArray, col) {
        this.initialize()
        let i = 0
        vertexArray.forEach(vertex => this.createVertex(vertex))
        faceArray.forEach(face => this.createFace(face, col[i++]))
        this.createEdges(halfedgePairArray)

        this.getExtents()
        this.getCenter()
        this.getFaceNormals()
    }
    copy() {
        let copy = new Mesh()
        copy.createRaw(this.copyVertexArray(), this.copyFaceArray(), this.copyHalfedgePairArray(), this.copyFaceColor())
        return copy
    }
    copyVertexArray() {
        let copy = []
        for (let i = 0; i < this.vertices.length; i++) {
            copy.push([this.vertices[i].x, this.vertices[i].y, this.vertices[i].z])
        }
        return copy
    }
    copyFaceArray() {
        let copy = []
        for (let i = 0; i < this.faces.length; i++) {
            let cf = []
            let he = this.faces[i].he
            do {
                cf.push(he.v.index)
                he = he.next
            } while (he != this.faces[i].he)
            copy.push(cf)
        }
        return copy
    }
    copyFaceColor() {
        let copy = []
        for (let i = 0; i < this.faces.length; i++) {
            copy.push(this.faces[i].col)
        }
        return copy
    }
    copyHalfedgePairArray() {
        let oldtonew = []
        let newtoold = []
        let copy = []
        let he
        let index = 0
        for (let i = 0; i < this.faces.length; i++) {
            he = this.faces[i].he
            do {
                oldtonew[he.index] = index
                newtoold.push(he.index)
                index++
                he = he.next
            } while (he != this.faces[i].he)
        }
        for (let i = 0; i < this.halfedges.length; i++) {
            copy.push(oldtonew[this.halfedges[newtoold[i]].pair.index])
        }
        return copy
    }
    createVertex(vertex) {
        this.vertices.push(new HEVertex(vertex[0], vertex[1], vertex[2], this.vertices.length))
    }
    createFace(face, col) {
        let f = new Face(this.faces.length, col)
        this.faces.push(f)
        let v
        let he
        let faceHalfedges = []
        for (let i = 0; i < face.length; i++) {
            v = this.vertices[face[i]]
            he = new Halfedge(this.halfedges.length)
            this.halfedges.push(he)
            faceHalfedges.push(he)
            this.connectVertex(v, he)
            this.connectFace(f, he)
        }
        for (let i = 0, j = faceHalfedges.length - 1; i < faceHalfedges.length; j = i, i++) {
            this.connectHalfedges(faceHalfedges[j], faceHalfedges[i])
        }
    }
    createEdges(halfedgePairArray) {
        for (let i = 0; i < this.halfedges.length; i++) {
            let pairIndex = halfedgePairArray[this.halfedges[i].index]
            if (!this.halfedges[i].pair) {
                this.pairHalfedges(this.halfedges[i], this.halfedges[pairIndex])
                this.createEdge(this.halfedges[i])
            }
        }
    }
    pairHalfedges(he1, he2) {
        he1.pair = he2
        he2.pair = he1
    }
    createEdge(he) {
        let e = new Edge(this.edges.length)
        this.connectEdge(e, he)
        this.edges.push(e)
    }
    connectHalfedges(he1, he2) {
        he1.next = he2
        he2.prev = he1
    }
    connectVertex(v, he) {
        if (!v.he) v.he = he
        he.v = v
    }
    connectFace(f, he) {
        if (!f.he) f.he = he
        he.f = f
    }
    connectEdge(e, he) {
        if (!e.he) e.he = he
        he.e = e
        he.pair.e = e
    }
    draw(f, a) {
        let he
        push()
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2])
        let c, cf
        for (let i = 0; i < this.faces.length; i++) {
            beginShape()
            he = this.faces[i].he
            c = this.faces[i].col
            cf = constrain(map(he.v.x * fadeDir.x + he.v.y * fadeDir.y + he.v.z * fadeDir.z, 0.6 * side, -0.6 * side, 0, 1.5), 0, 1)
            fill(color(cf * red(c), cf * green(c), cf * blue(c), a || 255))
            do {
                vertex(he.v.x + noiseLevel * (1 - 2 * noise(noiseFrequency * he.v.x + 100, noiseFrequency * he.v.y, noiseFrequency * he.v.z)), he.v.y + noiseLevel * (1 - 2 * noise(noiseFrequency * he.v.x, noiseFrequency * he.v.y + 100, noiseFrequency * he.v.z)), he.v.z + noiseLevel * (1 - 2 * noise(noiseFrequency * he.v.x, noiseFrequency * he.v.y, noiseFrequency * he.v.z + 100)))
                he = he.next
            } while (he != this.faces[i].he)
            endShape(CLOSE)
        }
        pop()
    }
    drawFixedColor(f, c) {
        let he
        push()
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2])
        for (let i = 0; i < this.faces.length; i++) {
            beginShape()
            he = this.faces[i].he
            fill(c)
            do {
                vertex(he.v.x, he.v.y, he.v.z)
                he = he.next
            } while (he != this.faces[i].he)
            endShape(CLOSE)
        }
        pop()
    }
    getFaceNormals() {
        let he
        this.faceNormals.length = 0
        for (let i = 0; i < this.faces.length; i++) {
            let normal = [0, 0, 0]
            he = this.faces[i].he
            do {
                normal[0] = (he.v.y - he.next.v.y) * (he.v.z + he.next.v.z)
                normal[1] = (he.v.z - he.next.v.z) * (he.v.x + he.next.v.x)
                normal[2] = (he.v.x - he.next.v.x) * (he.v.y + he.next.v.y)
                he = he.next
            } while (he != this.faces[i].he)
            let fn = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2])
            normal[0] /= fn
            normal[1] /= fn
            normal[2] /= fn
            this.faceNormals.push(normal)
        }
    }
    drawEdges(f) {
        let he
        push()
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2])
        beginShape(LINES)
        for (let i = 0; i < this.faces.length; i++) {
            he = this.faces[i].he
            do {
                vertex(he.v.x + noiseLevel * (1 - 2 * noise(noiseFrequency * he.v.x + 100, noiseFrequency * he.v.y, noiseFrequency * he.v.z)), he.v.y + noiseLevel * (1 - 2 * noise(noiseFrequency * he.v.x, noiseFrequency * he.v.y + 100, noiseFrequency * he.v.z)), he.v.z + noiseLevel * (1 - 2 * noise(noiseFrequency * he.v.x, noiseFrequency * he.v.y, noiseFrequency * he.v.z + 100)))
                vertex(he.next.v.x + noiseLevel * (1 - 2 * noise(noiseFrequency * he.next.v.x + 100, noiseFrequency * he.next.v.y, noiseFrequency * he.next.v.z)), he.next.v.y + noiseLevel * (1 - 2 * noise(noiseFrequency * he.next.v.x, noiseFrequency * he.next.v.y + 100, noiseFrequency * he.next.v.z)), he.next.v.z + noiseLevel * (1 - 2 * noise(noiseFrequency * he.next.v.x, noiseFrequency * he.next.v.y, noiseFrequency * he.next.v.z + 100)))
                he = he.next
            } while (he != this.faces[i].he)
        }
        endShape()
        pop()
    }
    drawVertices(f, r) {
        let v
        push()
        translate(f[0] * this.center[0], f[1] * this.center[1], f[2] * this.center[2])
        noStroke();
        fill(lineColor)
        for (let i = 0; i < this.vertices.length; i++) {
            v = this.vertices[i]
            push()
            translate(v.x + noiseLevel * (1 - 2 * noise(noiseFrequency * v.x + 100, noiseFrequency * v.y, noiseFrequency * v.z)), v.y + noiseLevel * (1 - 2 * noise(noiseFrequency * v.x, noiseFrequency * v.y + 100, noiseFrequency * v.z)), v.z + noiseLevel * (1 - 2 * noise(noiseFrequency * v.x, noiseFrequency * v.y, noiseFrequency * v.z + 100)))
            sphere(r)
            pop()
        }
        pop()
    }
    indexVertices() {
        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i].index = i
        }
    }
    indexHalfedges() {
        for (let i = 0; i < this.halfedges.length; i++) {
            this.halfedges[i].index = i
        }
    }
    indexEdges() {
        for (let i = 0; i < this.edges.length; i++) {
            this.edges[i].index = i
        }
    }
    indexFaces() {
        for (let i = 0; i < this.faces.length; i++) {
            this.faces[i].index = i
        }
    }
    reconnectVertices() {
        for (let i = 0; i < this.halfedges.length; i++) {
            if (!this.halfedges[i].v.he) this.halfedges[i].v.he = this.halfedges[i]
        }
    }
    isValid() {
        for (let i = 0; i < this.halfedges.length; i++) {
            if (this.halfedges[i].v == null) return false
            if (this.halfedges[i].pair == null) return false
            if (this.halfedges[i].pair.pair == null) return false
            if (this.halfedges[i].pair.pair != this.halfedges[i]) return false
            if (this.halfedges[i].f == null) return false
            if (this.halfedges[i].next == null) return false
            if (this.halfedges[i].next.prev == null) return false
            if (this.halfedges[i].next.prev != this.halfedges[i]) return false
            if (this.halfedges[i].prev == null) return false
            if (this.halfedges[i].prev.next == null) return false
            if (this.halfedges[i].prev.next != this.halfedges[i]) return false
        }
        for (let i = 0; i < this.vertices.length; i++) {
            if (this.vertices[i].he == null) return false
        }
        for (let i = 0; i < this.edges.length; i++) {
            if (this.edges[i].he == null) return false
        }
        for (let i = 0; i < this.faces.length; i++) {
            if (this.faces[i].he == null) return false
        }
        return true //maybe
    }
    getExtents() {
        this.extents = [1000000.0, 1000000.0, 1000000.0, -1000000.0, -1000000.0, -1000000.0, 0, 0, 0, 0, 0, 0]
        for (let i = 0; i < this.vertices.length; i++) {
            this.extents[0] = min(this.vertices[i].x, this.extents[0])
            this.extents[1] = min(this.vertices[i].y, this.extents[1])
            this.extents[2] = min(this.vertices[i].z, this.extents[2])
            this.extents[3] = max(this.vertices[i].x, this.extents[3])
            this.extents[4] = max(this.vertices[i].y, this.extents[4])
            this.extents[5] = max(this.vertices[i].z, this.extents[5])
        }
        this.extents[6] = 0.5 * (this.extents[0] + this.extents[3])
        this.extents[7] = 0.5 * (this.extents[1] + this.extents[4])
        this.extents[8] = 0.5 * (this.extents[2] + this.extents[5])
        this.extents[9] = (this.extents[3] - this.extents[0])
        this.extents[10] = (this.extents[4] - this.extents[1])
        this.extents[11] = (this.extents[5] - this.extents[2])
    }
    getCenter() {
        let x = 0.0
        let y = 0.0
        let z = 0.0
        for (let i = 0; i < this.vertices.length; i++) {
            x += this.vertices[i].x
            y += this.vertices[i].y
            z += this.vertices[i].z
        }
        if (this.vertices.length > 0) {
            x /= this.vertices.length
            y /= this.vertices.length
            z /= this.vertices.length
        }
        this.center[0] = x
        this.center[1] = y
        this.center[2] = z
    }
}
class MeshData {
    constructor(vertexArray, faceArray, halfedgePairArray, faceColor) {
        this.vertexArray = vertexArray
        this.faceArray = faceArray
        this.halfedgePairArray = halfedgePairArray
        this.faceColor = faceColor
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
        ]
        let faces = [
            [0, 1, 3],[ 1, 2, 3],
            [7, 6, 4], [ 6, 5, 4],
            [1, 0, 5], [ 0, 4, 5],
            [3, 2, 7],[ 2, 6, 7],
            [2, 1, 6],[ 1, 5, 6],
            [0, 3, 4], [ 3, 7, 4]
        ]
        let scaledVertices = []
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * width, y + vertices[i][1] * height, z + vertices[i][2] * depth])
        }
        return this.create(scaledVertices, faces, [col, col, col, col, col, col, col, col, col, col, col, col])
    }
    static createSkewedBoxWithCenterAndSize(x, y, z, width, height, depth, sx, sz, col) {
        let vertices = [
            [-0.5, -0.5, -0.5],
            [0.5, -0.5, -0.5],
            [0.5, 0.5, -0.5],
            [-0.5, 0.5, -0.5],
            [-0.5, -0.5, 0.5],
            [0.5, -0.5, 0.5],
            [0.5, 0.5, 0.5],
            [-0.5, 0.5, 0.5]
        ]
        let faces = [
            [0, 1, 3],[ 1, 2, 3],
            [7, 6, 4], [ 6, 5, 4],
            [1, 0, 5], [ 0, 4, 5],
            [3, 2, 7],[ 2, 6, 7],
            [2, 1, 6],[ 1, 5, 6],
            [0, 3, 4], [ 3, 7, 4]
        ]
        let scaledVertices = []
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * width + vertices[i][1] * sx, y + vertices[i][1] * height, z + vertices[i][2] * depth + vertices[i][1] * sz])
        }
        return this.create(scaledVertices, faces, [col, col, col, col, col, col, col, col, col, col, col, col])
    }
    static createOctahedronWithCenterAndSize(x, y, z, width, height, depth, col) {
        let vertices = [
            [-0.5, 0.0, 0.0],
            [0.0, 0.5, 0.0],
            [0.5, 0.0, 0.0],
            [0.0, -0.5, 0.0],
            [0.0, 0.0, 0.5],
            [0.0, 0.0, 0 - .5]
        ]
        let faces = [
            [0, 1, 4],
            [1, 2, 4],
            [2, 3, 4],
            [3, 0, 4],
            [1, 0, 5],
            [2, 1, 5],
            [3, 2, 5],
            [0, 3, 5]
        ]
        let scaledVertices = []
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * width, y + vertices[i][1] * height, z + vertices[i][2] * depth])
        }
        return this.create(scaledVertices, faces, [col, col, col, col, col, col, col, col])
    }
    static createPrismWithCenterSizeAndSides(x, y, z, radius, depth, N, angle, col) {
        let vertices = []
        for (let i = 0; i < N; i++) {
            vertices.push([Math.cos(i * 2 * Math.PI / N + angle), Math.sin(i * 2 * Math.PI / N + angle), -0.5])
        }
        for (let i = 0; i < N; i++) {
            vertices.push([Math.cos(i * 2 * Math.PI / N + angle), Math.sin(i * 2 * Math.PI / N + angle), 0.5])
        }
        let faces = []
        for (let i = 0; i < N; i++) {
            faces.push([i, (i + 1) % N, ((i + 1) % N) + N, i + N])
        }
        let cover = []
        let bottom = []
        for (let i = 0; i < N; i++) {
            cover.push(i + N)
            bottom.push(N - 1 - i)
        }
        faces.push(bottom)
        faces.push(cover)
        let colors = []
        for (let i = 0; i < N + 2; i++) {
            colors.push(col)
        }
        let scaledVertices = []
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * radius, y + vertices[i][1] * radius, z + vertices[i][2] * depth])
        }
        return this.create(scaledVertices, faces, colors)
    }
    static createRodWithCenterSizeAndSides(x, y, z, radius, height, N, col) {
        let vertices = []
        for (let i = 0; i < N; i++) {
            vertices.push([Math.cos(i * 2 * Math.PI / N), -0.5, Math.sin(i * 2 * Math.PI / N)])
        }
        for (let i = 0; i < N; i++) {
            vertices.push([Math.cos(i * 2 * Math.PI / N), 0.5, Math.sin(i * 2 * Math.PI / N)])
        }
        let faces = []
        for (let i = 0; i < N; i++) {
            faces.push([i, (i + 1) % N, ((i + 1) % N) + N, i + N])
        }
        let cover = []
        let bottom = []
        for (let i = 0; i < N; i++) {
            cover.push(i + N)
            bottom.push(N - 1 - i)
        }
        faces.push(bottom)
        faces.push(cover)
        let colors = []
        for (let i = 0; i < N + 2; i++) {
            colors.push(col)
        }
        let scaledVertices = []
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * radius, y + vertices[i][1] * height, z + vertices[i][2] * radius])
        }
        return this.create(scaledVertices, faces, colors)
    }
    static createPyramidWithCenterSizeAndSides(x, y, z, radius, height, N, inverted, col) {
        let vertices = []
        vertices.push([0, inverted ? 0.5 : -0.5, 0])
        for (let i = 0; i < N; i++) {
            vertices.push([Math.cos(i * 2 * Math.PI / N), inverted ? -0.5 : 0.5, Math.sin(i * 2 * Math.PI / N)])
        }
        let faces = []
        for (let i = 0; i < N; i++) {
            faces.push([i + 1, (i + 1) % N + 1, 0])
        }
        let bottom = []
        for (let i = 0; i < N; i++) {
            bottom.push(N - 1 - i + 1)
        }
        faces.push(bottom)
        let colors = []
        for (let i = 0; i < N + 1; i++) {
            colors.push(col)
        }
        let scaledVertices = []
        for (let i = 0; i < vertices.length; i++) {
            scaledVertices.push([x + vertices[i][0] * radius, y + vertices[i][1] * height, z + vertices[i][2] * radius])
        }
        return this.create(scaledVertices, faces, colors)
    }
    static create(vertexArray, faceArray, col) {
        let numberOfEdges = 0
        for (let i = 0; i < faceArray.length; i++) {
            numberOfEdges += faceArray[i].length
        }
        let halfedgePairArray = []
        let edges = []
        for (let i = 0; i < faceArray.length; i++) {
            for (let j = 0; j < faceArray[i].length; j++) {
                edges.push([faceArray[i][j], faceArray[i][(j + 1) % faceArray[i].length]])
                halfedgePairArray.push(-1)
            }
        }
        for (let i = 0; i < edges.length; i++) {
            if (halfedgePairArray[i] == -1) {
                for (let j = i + 1; j < edges.length; j++) {
                    if (edges[i][0] === edges[j][1] && edges[i][1] === edges[j][0]) {
                        halfedgePairArray[i] = j
                        halfedgePairArray[j] = i
                    }
                }
            }
        }
        return new MeshData(vertexArray, faceArray, halfedgePairArray, col)
    }
}
class EdgeIntersection {
    constructor(e, v) {
        this.e = e
        this.v = v
    }
}
class SliceMesh extends Mesh {
    copy() {
        let copy = new SliceMesh()
        copy.createRaw(this.copyVertexArray(), this.copyFaceArray(), this.copyHalfedgePairArray(), this.copyFaceColor())
        return copy
    }
    slice(P, offset, col, capId) {
        let offsetP = P.offset(-offset)
        let intersections = []
        let es = this.edges.length
        for (let i = 0; i < es; i++) {
            this.sliceEdge(this.edges[i], offsetP, intersections)
        }
        let fs = this.faces.length
        for (let i = 0; i < fs; i++) {
            this.sliceFace(this.faces[i], intersections)
        }
        this.deleteFrontFaces(offsetP)
        this.capSlice(col, offsetP, capId)
     

    }
    sliceEdge(e, P, intersections) {
        let he = e.he
        let hep = he.pair
        let v = he.v
        let vp = hep.v
        let u = new p5.Vector(vp.x - v.x, vp.y - v.y, vp.z - v.z)
        let w = new p5.Vector(v.x - P.origin.x, v.y - P.origin.y, v.z - P.origin.z)
        let D = P.normal.dot(u)
        let N = -P.normal.dot(w)
        if (abs(D) < EPS) {
            return
        }
        let f = N / D
        if (f < -EPS || f > OPEPS) {
            return
        } else if (f < EPS) {
            intersections.push(new EdgeIntersection(e, v))
        } else if (f > OMEPS) {
            intersections.push(new EdgeIntersection(e, vp))
        } else {
            this.splitEdge(e, f)
            let nv = this.vertices[this.vertices.length - 1]
            intersections.push(new EdgeIntersection(e, nv))
        }
    }
    splitEdge(e, f) {
        let he = e.he
        let hep = he.pair
        let hen = he.next
        let hepn = hep.next
        let v = he.v
        let vp = hep.v
        this.createVertex([(1.0 - f) * v.x + f * vp.x, (1.0 - f) * v.y + f * vp.y, (1.0 - f) * v.z + f * vp.z])
        let splitv = this.vertices[this.vertices.length - 1]
        let heNew = new Halfedge(this.halfedges.length)
        this.halfedges.push(heNew)
        this.connectVertex(splitv, heNew)
        this.connectFace(he.f, heNew)
        let hepNew = new Halfedge(this.halfedges.length)
        this.halfedges.push(hepNew)
        this.connectVertex(splitv, hepNew)
        this.connectFace(hep.f, hepNew)
        this.connectHalfedges(he, heNew)
        this.connectHalfedges(heNew, hen)
        this.connectHalfedges(hep, hepNew)
        this.connectHalfedges(hepNew, hepn)
        this.pairHalfedges(he, hepNew)
        this.connectEdge(e, he)
        this.pairHalfedges(hep, heNew)
        this.createEdge(hep)
    }
    sliceFace(f, intersections) {
        let vi
        let vj
        for (let i = 0; i < intersections.length; i++) {
            if (intersections[i].e.he.f === f || intersections[i].e.he.pair.f === f) {
                if (!vi) {
                    vi = intersections[i].v
                } else
                if (vi != intersections[i].v) {
                    vj = intersections[i].v
                    break
                }
            }
        }
        if (vi && vj) this.splitFace(f, vi.index, vj.index)
    }
    splitFace(f, i, j) {
        let vi = this.vertices[i]
        let hei = f.he
        while (hei.v != vi) {
            hei = hei.next
            if (hei === f.he) return
        }
        let vj = this.vertices[j]
        let hej = f.he
        while (hej.v != vj) {
            hej = hej.next
            if (hej === f.he) return
        }
        if (hei.next === hej || hej.next === hei) return
        let heip = hei.prev
        let hejp = hej.prev
        let heNew = new Halfedge(this.halfedges.length)
        let hepNew = new Halfedge(this.halfedges.length)
        this.connectVertex(vi, hepNew)
        this.connectVertex(vj, heNew)
        this.pairHalfedges(heNew, hepNew)
        this.createEdge(heNew)
        this.halfedges.push(heNew)
        this.halfedges.push(hepNew)
        this.connectHalfedges(heip, hepNew)
        this.connectHalfedges(hepNew, hej)
        this.connectHalfedges(hejp, heNew)
        this.connectHalfedges(heNew, hei)
        heNew.f = f
        let he = hej
        let nf = new Face(this.faces.length, f.col)
        this.faces.push(nf)
        do {
            this.connectFace(nf, he)
            he = he.next
        } while (he != hej)
        f.he = hei
        return nf
    }

    triangulateFace(f) {
        let fo=f.order()
       if(fo<4) return
        let he
        let he2
        let nf
        do{
            he=f.he
            he2=f.he.next.next
            nf=splitFace(f,he.v.index,he2.v.index)
            he=he.next
            he2=he2.next

        }while(typeof nf=== 'undefined')
       this.triangulateFace(nf)
        
    }
    removeVertex(v) {
        let index = this.vertices.indexOf(v)
        if (index > -1) {
            this.vertices.splice(index, 1)
        }
    }
    removeFace(f) {
        let index = this.faces.indexOf(f)
        if (index > -1) {
            this.faces.splice(index, 1)
        }
    }
    removeHalfedge(he) {
        let index = this.halfedges.indexOf(he)
        if (index > -1) {
            this.halfedges.splice(index, 1)
        }
    }
    removeEdge(e) {
        let index = this.edges.indexOf(e)
        if (index > -1) {
            this.edges.splice(index, 1)
        }
    }
    deleteFace(f) {
        let he = f.he
        do {
            if (he.v.he === he) he.v.he = null
            if (he.pair) {
                he.pair.pair = null
                he.pair.e = null
            }
            this.removeHalfedge(he)
            this.removeEdge(he.e)
            he = he.next
        } while (he != f.he)
        this.removeFace(f)
        this.reconnectVertices()
        this.indexHalfedges()
        this.indexFaces()
        this.indexEdges()
        let checklist = this.vertices.slice()
        for (let i = 0; i < checklist.length; i++) {
            if (!checklist[i].he) this.removeVertex(checklist[i])
        }
        this.indexVertices()
    }
    deleteFrontFaces(P) {
        let checklist = this.faces.slice()
        for (let i = 0; i < checklist.length; i++) {
            if (checklist[i].sideOfPlane(P) === 1) {
                this.deleteFace(checklist[i])
            }
        }
    }
    capSlice(col, P, capId) {
        let cap = new Face(this.faces.length, col)
        let caphe, trial
        let capHalfedges = []
        for (let i = 0; i < this.halfedges.length; i++) {
            if (this.halfedges[i].pair == null) {
                caphe = new Halfedge(this.halfedges.length + capHalfedges.length)
                capHalfedges.push(caphe)
                this.pairHalfedges(this.halfedges[i], caphe)
                this.createEdge(this.halfedges[i])
                this.connectVertex(this.halfedges[i].next.v, caphe)
                let local = P.local(caphe.v.x, caphe.v.y, caphe.v.z)
                this.connectFace(cap, caphe)
                cap.id = capId
            }
        }
        for (let i = 0; i < capHalfedges.length; i++) {
            this.halfedges.push(capHalfedges[i])
        }
        if (capHalfedges.length > 0) this.faces.push(cap)
        for (let i = 0; i < capHalfedges.length; i++) {
            caphe = capHalfedges[i]
            if (!caphe.next) {
                for (let j = 0; j < capHalfedges.length; j++) {
                    trial = capHalfedges[j]
                    if (i != j && trial.v === caphe.pair.v) {
                        this.connectHalfedges(caphe, trial)
                        break
                    }
                }
            }
        }
    }
}
