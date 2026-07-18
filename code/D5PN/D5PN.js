//D5PN 2004 - rmake by Frederik Vanhoutt (wblut)
'use strict'
p5.disableFriendlyErrors = true
let rescale
let num
let ax, ay
let x, y, z, tx, ty, tz, bx, by, mx, my, sf
let a, b, c, d, e
let points = []
const getScale = () => {
    rescale = Math.min(windowWidth, windowHeight) / 5.0
    sf = 100.0 / rescale
    b = new Arc(0, 0, 1.6 * rescale, 0, 2 * Math.PI, 0.1, 48)
    c = new Arc(0, 0, 1.89 * rescale, 0, 2 * Math.PI, 0.05, 48)
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL)
    addScreenPositionFunction()
    smooth()
    noCursor()
    getScale()
    ellipseMode(CENTER)
    points = [
        [0, 0, 1],
        [0.894427, 0, 0.447214],
        [0.276393, 0.850651, 0.447214],
        [-0.723607, 0.525731, 0.447214],
        [-0.723607, -0.525731, 0.447214],
        [0.276393, -0.850651, 0.447214],
        [0.723607, 0.525731, -0.447214],
        [-0.276393, 0.850651, -0.447214],
        [-0.894427, 0, -0.447214],
        [-0.276393, -0.850651, -0.447214],
        [0.723607, -0.525731, -0.447214],
        [0, 0, -1],
        [0.360729, 0, 0.932671],
        [0.672883, 0, 0.739749],
        [0.111471, 0.343074, 0.932671],
        [0.207932, 0.63995, 0.739749],
        [-0.291836, 0.212031, 0.932671],
        [-0.544374, 0.395511, 0.739749],
        [-0.291836, -0.212031, 0.932671],
        [-0.544374, -0.395511, 0.739749],
        [0.111471, -0.343074, 0.932671],
        [0.207932, -0.63995, 0.739749],
        [0.784354, 0.343074, 0.516806],
        [0.568661, 0.63995, 0.516806],
        [-0.0839038, 0.851981, 0.516806],
        [-0.432902, 0.738584, 0.516806],
        [-0.83621, 0.183479, 0.516806],
        [-0.83621, -0.183479, 0.516806],
        [-0.432902, -0.738585, 0.516806],
        [-0.0839036, -0.851981, 0.516806],
        [0.568661, -0.63995, 0.516806],
        [0.784354, -0.343074, 0.516806],
        [0.964719, 0.212031, 0.156077],
        [0.905103, 0.395511, -0.156077],
        [0.0964608, 0.983023, 0.156077],
        [-0.0964609, 0.983023, -0.156077],
        [-0.905103, 0.395511, 0.156077],
        [-0.964719, 0.212031, -0.156077],
        [-0.655845, -0.738585, 0.156077],
        [-0.499768, -0.851981, -0.156077],
        [0.499768, -0.851981, 0.156077],
        [0.655845, -0.738584, -0.156077],
        [0.964719, -0.212031, 0.156077],
        [0.905103, -0.39551, -0.156077],
        [0.499768, 0.851981, 0.156077],
        [0.655845, 0.738584, -0.156077],
        [-0.655845, 0.738584, 0.156077],
        [-0.499768, 0.851981, -0.156077],
        [-0.905103, -0.395511, 0.156077],
        [-0.964719, -0.212031, -0.156077],
        [0.0964609, -0.983023, 0.156077],
        [-0.0964608, -0.983023, -0.156077],
        [0.432902, 0.738584, -0.516806],
        [0.0839037, 0.851981, -0.516806],
        [-0.568661, 0.63995, -0.516806],
        [-0.784354, 0.343074, -0.516806],
        [-0.784354, -0.343074, -0.516806],
        [-0.568661, -0.63995, -0.516806],
        [0.0839038, -0.851981, -0.516806],
        [0.432902, -0.738584, -0.516806],
        [0.83621, -0.183479, -0.516806],
        [0.83621, 0.183479, -0.516806],
        [0.291836, 0.212031, -0.932671],
        [0.544374, 0.395511, -0.739749],
        [-0.111471, 0.343074, -0.932671],
        [-0.207932, 0.63995, -0.739749],
        [-0.360729, 0, -0.932671],
        [-0.672883, 0, -0.739749],
        [-0.111471, -0.343074, -0.932671],
        [-0.207932, -0.63995, -0.739749],
        [0.291836, -0.212031, -0.932671],
        [0.544374, -0.39551, -0.739749],
        [0.479506, 0.348381, 0.805422],
        [-0.183155, 0.563693, 0.805422],
        [-0.592702, 0, 0.805422],
        [-0.183155, -0.563693, 0.805422],
        [0.479506, -0.348381, 0.805422],
        [0.985456, 0, -0.169933],
        [0.304523, 0.937224, -0.169933],
        [-0.79725, 0.579236, -0.169933],
        [-0.79725, -0.579236, -0.169933],
        [0.304523, -0.937224, -0.169933],
        [0.79725, 0.579236, 0.169933],
        [-0.304523, 0.937224, 0.169933],
        [-0.985456, 0, 0.169933],
        [-0.304522, -0.937224, 0.169933],
        [0.79725, -0.579236, 0.169933],
        [0.183155, 0.563693, -0.805422],
        [-0.479506, 0.348381, -0.805422],
        [-0.479506, -0.348381, -0.805422],
        [0.183155, -0.563693, -0.805422],
        [0.592702, 1.2143e-007, -0.805422]
    ]
    ax = 0
    ay = 0
    num = 92
}

function draw() {
    background(25)
    ay += radians(0.2)
    for (let i = 0; i < num; i++) {
        x = rescale * points[i][0]
        y = rescale * points[i][1]
        z = rescale * points[i][2]
        tx = x * Math.cos(ay) + y * Math.sin(ax) * Math.sin(ay) + z * Math.cos(ax) * Math.sin(ay)
        ty = y * Math.cos(ax) - z * Math.sin(ax)
        tz = 0.72 * (-x * Math.sin(ay) + y * Math.sin(ax) * Math.cos(ay) + z * Math.cos(ax) * Math.cos(ay))
        bx = 1.80 * rescale * tx / Math.sqrt(tx * tx + ty * ty)
        by = 1.80 * rescale * ty / Math.sqrt(tx * tx + ty * ty)
        let at = Math.atan2(by, bx)
        if (tz > 0) {
            push()
            translate(0.9 * bx, 0.9 * by, 0)
            fill(160);
            rotateZ(at)
            box(max(1, rescale / 20))
            pop()
            push()
            translate(bx, by, 0)
            fill(160)
            rotateZ(at)
            box(max(1, rescale / 20))
            pop()
        }
        push()
        fill(120 + sf * tz, 120 + sf * tz, 120 + sf * tz, 100 + 1.4 * sf * tz)
        ellipse(tx, ty, 0.095 / sf * (100 + tz), 0.095 / sf * (100 + tz))
        translate(tx, ty, tz)
        ellipse(0, 0, 1, 1)
        pop()
        fill(120 + sf * tz, 120 + sf * tz, 120 + sf * tz, 100 + 1.4 * sf * tz)
        fill(40 + sf * tz, 40 + sf * tz, 40 + sf * tz, 100 + 1.4 * sf * tz)
        let sp = screenPosition(tx, ty, tz)
        ellipse(sp.x, sp.y, rescale / 25, rescale / 25)
        fill(sf * tz, sf * tz, sf * tz, 100 + 1.4 * sf * tz)
        a = new Arc(0, 0, 1.8 * rescale, at, tz / (5 * rescale) * Math.PI, abs(0.1 * tz / rescale), 12)
        d = new Arc(0, 0, 1.35 * rescale, at, tz / (10 * rescale) * Math.PI, abs(0.01 * tz / rescale), 12)
        e = new Arc(0, 0, 2.0 * rescale, at, -tz / (10 * rescale) * Math.PI, abs(0.01 * tz / rescale), 12);
        fill(sf * tz, sf * tz, sf * tz, 10);
        a.draw()
        d.draw()
        e.draw()
        if (tz > 0) {
            stroke(120, 100)
            line(1.05 * bx, 1.05 * by, 1.1 * bx, 1.1 * by)
            line(0.8 * bx, 0.8 * by, 0.75 * bx, 0.75 * by)
            noStroke()
        }
    }
    b.draw();
    c.draw();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
    getScale()
    frameCount = 0
}

class Arc {
    constructor(xx, yy, rr, aa, ss, ww, segs) {
        this.cx = xx
        this.cy = yy
        this.r = rr
        this.sa = aa
        this.span = ss
        this.w = ww
        this.segments = segs
    }
    draw() {
        let da = this.span / this.segments
        let ca = this.sa
        let cca, sca, ccap, scap
        for (let i = 0; i < this.segments; i++) {
            cca = Math.cos(ca)
            sca = Math.sin(ca)
            ccap = Math.cos(ca + da)
            scap = Math.sin(ca + da)
            triangle(this.cx + cca * this.r * (1 - this.w), this.cy + sca * this.r * (1 - this.w), this.cx + cca * this.r, this.cy + sca * this.r, this.cx + ccap * this.r, this.cy + scap * this.r)
            triangle(this.cx + cca * this.r * (1 - this.w), this.cy + sca * this.r * (1 - this.w), this.cx + ccap * this.r * (1 - this.w), this.cy + scap * this.r * (1 - this.w), this.cx + ccap * this.r, this.cy + scap * this.r)
            ca += da
        }
    }
}