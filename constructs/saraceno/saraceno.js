'use strict'
const circles = []
let numberOfCircles
let tracer
let recursion
let bigC

let segments, newSegments
let sc


const roll = () => {
    numberOfCircles =48
    bigC = new Circle(0.0, 0.0, 300)

    recursion = 3
    sc=random(1.8,3.3)
}
const variation = () => {
    createCircles(600, numberOfCircles)
}
const createCircles = (radius, nr) => {
    let pmin = new Point(10000, 10000)
    let pmax = new Point(-10000, -10000)
    do {
        circles.length = 0
        let p, q
        pmin = new Point(10000, 10000)
        pmax = new Point(-10000, -10000)
        let r
        for (let i = 0; i < nr; i++) {
            do {
                p = randomPointInCircle(radius)
                r = random(40.0, 200.0)
            } while (intersecting(p, r))
            minComponent(pmin, p)
            maxComponent(pmax, p)
            circles[i] = new Circle(p.x, p.y, r)
        }
    } while (pmax.x - pmin.x < 400 || pmax.y - pmin.y < 400)
    let d = 0.0
    circles.forEach(circle => {
        circle.x -= 0.5 * (pmin.x + pmax.x)
        circle.y -= 0.5 * (pmin.y + pmax.y)
        d = Math.max(d, circle.x * circle.x + circle.y * circle.y)
    })
    d = Math.sqrt(d)
    circles.forEach(circle => {
        circle.x *= radius / d
        circle.y *= radius / d
    })
}
const intersecting = (p, r) => {
    for (let i = 0; i < circles.length; i++) {
        if (sqrt(sq(circles[i].x - p.x) + sq(circles[i].y - p.y)) < (circles[i].r + r)) return true
    }
    return false
}
const minComponent = (p, c) => {
    p.x = Math.min(p.x, c.x)
    p.y = Math.min(p.y, c.y)
}
const maxComponent = (p, c) => {
    p.x = Math.max(p.x, c.x)
    p.y = Math.max(p.y, c.y)
}

function setup() {
    createCanvas(windowWidth, windowHeight)
    smooth()
    noCursor()
    colorMode(HSL)
    roll()
    variation()
    tracer = new Tracer(0.0, 0.0, 1.0)
    segments = []
    newSegments = []
}

function draw() {
    blendMode(BLEND)
    if(frameCount===1) background(0)
    blendMode(ADD)
    translate(windowWidth / 2, windowHeight / 2)
    scale(sc)
    segments.length = 0
    newSegments.length = 0
    let inc=10.0
    let r=5*frameCount//Math.floor(1+(frameCount-1)/inc)
    let a=(frameCount-1)%inc
    let aInc=360.0/inc
    for (let i =0;i<360;i+=72 ){//aInc*a; i < aInc*a+aInc; i++) {
   
        segments.push(new Segment(r * cos(radians(i+90)), r * sin(radians(i+90)), r * cos(radians(i +162)), r * sin(radians(i +162)), color(50 + 14 * (r % 21), 100, 75, 0.1)))
    }


    strokeWeight(0.24)
    for (let rec = 0; rec < recursion; rec++) {
        for (let s = 0; s < segments.length; s++) {
            mapSegment(segments[s], newSegments)
        }
        segments.length = 0
        for (let s = 0; s < newSegments.length; s++) segments.push(newSegments[s])
        newSegments.length = 0
        
    }
    for (let s = 0; s < segments.length; s++) {
        mapSegmentSingle(segments[s], newSegments)
    }
    segments.length = 0
    for (let s = 0; s < newSegments.length; s++) segments.push(newSegments[s])
    newSegments.length = 0
    for (let s = 0; s < segments.length; s++) {
        stroke(segments[s].c)
        line(segments[s].x, segments[s].y, segments[s].x2, segments[s].y2)
 
    }
    if(r>600) noLoop()
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
    frameCount = 0
    loop()
}

class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}
const rotatePoint = (p, a) => {
    let ca = Math.cos(a)
    let sa = Math.sin(a)
    return new Point(ca * p.x - sa * p.y, sa * p.x + ca * p.y)
}

const scalePoint = (p, sx, sy) => {
    return new Point(sx * p.x, sy * p.y)
}

const randomPointInCircle = (radius) => {
    let r = radius * Math.sqrt(random(1.0))
    let t = random(2 * Math.PI)
    return new Point(r * Math.cos(t), r * Math.sin(t))
}
class Tracer {
    constructor(x, y, s) {
        this.x = x
        this.y = y
        this.ix = 0.0
        this.iy = 0.0
        this.size = s
    }
}
class Circle {
    constructor(x, y, r) {
        this.x = x
        this.y = y
        this.r = r
        this.r2 = r * r
        this.decay=random(0.7,1.6)
    }
}
const singleInversion = (tracer, circle) => {
    let d2 = (tracer.x - circle.x) * (tracer.x - circle.x) + (tracer.y - circle.y) * (tracer.y - circle.y)
    tracer.ix = circle.x + (tracer.x - circle.x) * circle.r2 / d2
    tracer.iy = circle.y + (tracer.y - circle.y) * circle.r2 / d2
}
const weightedInversion = (tracer, circles) => {
    let accWeight = 0.0
    let weight = 0.0
    let x = 0 
    let y = 0
    circles.forEach(circle => {
        let d = sqrt((tracer.x - circle.x) * (tracer.x - circle.x) + (tracer.y - circle.y) * (tracer.y - circle.y))
        weight = 1.0 / Math.pow(d, circle.decay)
        singleInversion(tracer, circle)
        x += weight * tracer.ix
        y += weight * tracer.iy
        accWeight += weight
    })
    tracer.x = x / accWeight
    tracer.y = y / accWeight
    singleInversion(tracer, bigC)
}
class Segment {
    constructor(x, y, x2, y2, c) {
        this.x = x
        this.y = y
        this.x2 = x2
        this.y2 = y2
        this.c = c
    }
}

function mapSegment(segment, segments) {
    const stack = [segment]
    while (stack.length > 0) {
        const seg = stack.pop()
        tracer.x = seg.x
        tracer.y = seg.y
        weightedInversion(tracer, circles)
        let xi = tracer.x
        let yi = tracer.y
        tracer.x = seg.x2
        tracer.y = seg.y2
        weightedInversion(tracer, circles)
        let x2i = tracer.x
        let y2i = tracer.y
        let d2i = sq(xi - x2i) + sq(yi - y2i)
        if (d2i < 10 && d2i >0.01) {
            segments.push(new Segment(xi, yi, x2i, y2i, seg.c))
        } else if (d2i >= 10 && d2i < 100000000) {
            const midX = 0.5 * (seg.x + seg.x2)
            const midY = 0.5 * (seg.y + seg.y2)
            stack.push(new Segment(seg.x, seg.y, midX, midY, seg.c))
            stack.push(new Segment(midX, midY, seg.x2, seg.y2, seg.c))
        }
    }
}

function mapSegmentSingle(segment, segments) {
    const stack = [segment]
    while (stack.length > 0) {
        const seg = stack.pop()
        tracer.x = seg.x
        tracer.y = seg.y
        singleInversion(tracer, bigC)
        let xi = tracer.x
        let yi = tracer.y
        tracer.x = seg.x2
        tracer.y = seg.y2
        singleInversion(tracer, bigC)
        let x2i = tracer.x
        let y2i = tracer.y
        let d2i = sq(xi - x2i) + sq(yi - y2i)
        if (d2i < 10 && d2i >0.01) {
            segments.push(new Segment(xi, yi, x2i, y2i, seg.c))
        } else if (d2i >= 10 && d2i < 100000000) {
            const midX = 0.5 * (seg.x + seg.x2)
            const midY = 0.5 * (seg.y + seg.y2)
            stack.push(new Segment(seg.x, seg.y, midX, midY, seg.c))
            stack.push(new Segment(midX, midY, seg.x2, seg.y2, seg.c))
        }
    }
}