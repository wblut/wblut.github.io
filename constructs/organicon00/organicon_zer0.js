/*
Organicon, variation zer0, Frederik Vanhoutte, @wblut, 2022
This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 Unported License. To view a copy of this license, visit https://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
p5.js, GNU Lesser General Public License as published by the Free Software Foundation, version 2.1.
*/

'use strict'
const REFSIZE = 5400.0
const spheres = []
let rescale
let numberOfFrames
let numberOfSpheres
let simpleSymmetry, superSymmetry, symmetryRoll, symmetryDegree
let tracer
let recursion
let ring
let bigC
let startRadius
let decay

let active
let r0, r1,r2,r3,r4
let start
let startHue
let hueRange
let sr
let nrand
const getScale = () => {
    rescale = Math.min(windowWidth, windowHeight) / REFSIZE
}

const randomRange = (a, b) => {
    return a + (b - a) * fxrand()
}

const randomValue = (a) => {
    return a * fxrand()
}

const roll = () => {
    nrand=Math.floor(randomRange(2, 6))
    numberOfSpheres = Math.floor(randomRange(8, 24))
    simpleSymmetry = (randomValue(100) < 10) ? 0 : 100
    superSymmetry = (simpleSymmetry === 100) ? randomValue(100) < 25 : false
    symmetryRoll = randomValue(100)
    symmetryDegree = 4
    do {
        symmetryDegree = Math.floor(randomRange(2, 8))
    } while (symmetryDegree === 4)
    ring = randomRange(0.2, 0.8)
    bigC = new Sphere(0.0, 0.0, 0.0, randomRange(800, 1600))
    startRadius = randomValue(400)
    decay = randomRange(0.4, 1.4)

    recursion =2
    numberOfFrames = 800
    r0=random(0.9,1.2)
    r1=random(0.7,0.9)
    r2=r1-random(0.02,0.075)
    r3=random(0.5,0.6)
    r4=r3-random(0.01,0.05)
    startHue=randomRange(0,360)
    hueRange=randomRange(12,60)
    sr=randomRange(0.0,0.5)
 
}

const variation = () => {
    createSpheres(1500 + startRadius, numberOfSpheres)
}

const createSpheres = (radius, nr) => {
    let pmin = new Point(10000, 10000, 10000)
    let pmax = new Point(-10000, -10000, -10000)
    do{
    spheres.length = 0
    let p, q
     pmin = new Point(10000, 10000, 10000)
     pmax = new Point(-10000, -10000, -10000)
    let r
    for (let i = 0; i < nr; i++) {
        p = randomPointInSphere(radius)
        r = randomRange(80.0, 500.0)
        minComponent(pmin, p)
        maxComponent(pmax, p)
        spheres[i] = new Sphere(p.x, p.y, p.z, r)
        if (symmetryRoll < 25) {
            for (let sd = 1; sd < symmetryDegree; sd++) {
                q = rotatePoint(p, 2.0 * Math.PI / symmetryDegree * sd)
                minComponent(pmin, q)
                maxComponent(pmax, q)
                i++
                spheres[i] = new Sphere(q.x, q.y,0, r)
            }
        } else {
            if (randomValue(100) < simpleSymmetry) {
                q = scalePoint(p, -1, 1)
                minComponent(pmin, q)
                maxComponent(pmax, q)
                i++
                spheres[i] = new Sphere(q.x, q.y, 0,r)
                if (superSymmetry) {
                    q = scalePoint(p, -1, -1)
                    minComponent(pmin, q)
                    maxComponent(pmax, q)
                    i++
                    spheres[i] = new Sphere(q.x, q.y, 0,r)
                    q = scalePoint(p, 1, -1)
                    minComponent(pmin, q)
                    maxComponent(pmax, q)
                    i++
                    spheres[i] = new Sphere(q.x, q.y,0, r)
                }
            }
        }
    }
}while(pmax.x-pmin.x<400 || pmax.y-pmin.y<400)
    let d = 0.0
    spheres.forEach(sphere => {
        sphere.x -= 0.5 * (pmin.x + pmax.x)
        sphere.y -= 0.5 * (pmin.y + pmax.y)
        sphere.z -= 0.5 * (pmin.z + pmax.z)
        d = Math.max(d, sphere.x * sphere.x + sphere.y * sphere.y + sphere.z * sphere.z)
    })
    d = Math.sqrt(d)
    spheres.forEach(sphere => {
        sphere.x *= radius / d
        sphere.y *= radius / d
        sphere.z *= radius / d
    })
}

const rotateSpheres = (a) => {

    let ca = Math.cos(a)
    let sa = Math.sin(a)
let y,z
    spheres.forEach(sphere => {
        y=sphere.y
        z=sphere.z
        sphere.y= ca * y - sa * z
        sphere.z= sa * y + ca * z
        
    })

}

const minComponent = (p, c) => {
    p.x = Math.min(p.x, c.x)
    p.y = Math.min(p.y, c.y)
    p.z = Math.min(p.z, c.z)
}

const maxComponent = (p, c) => {
    p.x = Math.max(p.x, c.x)
    p.y = Math.max(p.y, c.y)
    p.z = Math.max(p.z, c.z)
}

function setup() {
    createCanvas(windowWidth, windowHeight)
    smooth()
    noCursor()
    colorMode(HSB)
    active=true
    getScale()
    roll()
    variation()
    tracer = new Tracer(0.0, 0.0, 0.0)
    textAlign(RIGHT)
}

function draw() {
    let frames=1
    blendMode(BLEND)
   if(isFxpreview){
     numberOfFrames=800
        frames=800
        active=false
   }
    translate(windowWidth / 2, windowHeight / 2)
    noStroke()
    fill(0,0,0)
    
    if(frameCount<=numberOfFrames){
        rect(windowWidth/2-100,windowHeight/2-20,100,20)
       
    }
    if(frameCount<numberOfFrames){
        
        fill(0,0,90)
        let fr=(frameCount*100.0/numberOfFrames)
        text(fr.toFixed(0)+"%", windowWidth / 2-6,windowHeight/2-6)
    
    }

    if(active){
        noStroke()
        
        fill(0,0,45+45*Math.cos(radians(16*frameCount)))
    
       
        ellipse(windowWidth / 2-6,-windowHeight/2+6,4,4)
       
    }else{
        noStroke()
        fill(0,0,0)
        ellipse(windowWidth / 2-6,-windowHeight/2+6,4,4)
    }
    if (frameCount === 1) {
        
        background(0,0,0)
    }
  if(frameCount>3*numberOfFrames/4||frameCount<numberOfFrames/4) blendMode(ADD)
    scale(rescale)
    for(let frame=0;frame<frames;frame++){
      
    

    
        if (frameCount<numberOfFrames) {
            let nr = startRadius + ((frameCount/2) % 6 + 1) * 250
    
            for (let i = 0; i < nr * nr / 1000; i++) {
                resetTracerRandomInRing(tracer, nr, nr - ring * 100)
               
                for (let rec = 0; rec < recursion; rec++) {
                  
                    weightedInversion(tracer, spheres, decay)
                   
                    singleInversion(tracer, bigC)
                   
                        sqpoint(0.5 * tracer.x + 0.5 * tracer.ix, 0.5 * tracer.y + 0.5 * tracer.iy,  0.5 * tracer.z + 0.5 * tracer.iz)
                   
                        sqpoint(tracer.ix, tracer.iy, tracer.iz)
                    
                }
            }
       
             nr = startRadius + ((frameCount/2) % 15 + 1) * 100
            let aoffset = randomRange(0,2.0 * Math.PI)
            for (let i = 0; i < nr/2; i++) {
                tracer.x = nr * Math.cos(i * Math.PI / nr + aoffset)
                tracer.y = nr * Math.sin(i *  Math.PI / nr + aoffset)
                tracer.z=0
                for (let rec = 0; rec < recursion+1; rec++) {
                    weightedInversion(tracer, spheres, decay)
                   // singleInversion(tracer, bigC)
                   
                        sqpoint(0.5 * tracer.x + 0.5 * tracer.ix, 0.5 * tracer.y + 0.5 * tracer.iy,  0.5 * tracer.z + 0.5 * tracer.iz)
                    
                    
                        sqpoint(tracer.ix, tracer.iy, tracer.iz)
                    
                }
            }
        } 
    
    if(frame>0){
        frameCount++
    }
    if(frameCount<numberOfFrames && frameCount%(numberOfFrames/nrand)===0){
        variation()
    }


    }
    if(frameCount===numberOfFrames-1){
        start=new Date()
    }
    let current=new Date()
    if (current-start>30000 && active &&frameCount>numberOfFrames-1) {
        reset()
    }
}


function sqpoint(x,y,z){
   


    let d2=(x*x+y*y)/2000000.0
    let id2=1.0/d2
    let sq=sr+(1.0-sr)*Math.exp(-d2)
    
    strokeWeight(4*rescale)
    //if(frameCount<numberOfFrames/4 || frameCount>3*numberOfFrames/4){
      
        stroke((startHue+randomRange(-5,5)+constrain(sqrt(d2),0,2)*hueRange)%360,constrain(d2*50,0,50)+randomRange(-5,5),100,.2)
        point(sq*x,sq*y)
   // }
    stroke((startHue+randomRange(-5,5)+constrain(sqrt(d2),0,2)*hueRange)%360,constrain(d2*50,0,50)+randomRange(-5,5),100,.4)
    point(sq*x*id2,sq*y*id2)
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
    getScale()
    frameCount = 0
}


function mousePressed() {
    if(!active){
       reset()
    }
    active = !active
}

const reset = () => {
    frameCount = 0
    variation()
    start=new Date()
}

class Point {
    constructor(x, y,z) {
        this.x = x
        this.y = y
        this.z = z
    }
}

const rotatePoint = (p, a) => {
    let ca = Math.cos(a)
    let sa = Math.sin(a)
    return new Point(ca * p.x - sa * p.y, sa * p.x + ca * p.y,0)
}

const scalePoint = (p, sx, sy) => {
    return new Point(sx * p.x, sy * p.y,0)
}

const randomPointInSphere = (radius) => {
    let r = radius * Math.sqrt(randomValue(1.0))
    let t = randomValue(2 * Math.PI)
    return new Point(r * Math.cos(t), r * Math.sin(t),0)

    
}

const resetTracerRandomInSphere = (tracer, radius) => {
    let r = Math.sqrt(randomValue(1.0))
    let t = randomValue(2 * Math.PI)
    tracer.x = radius * r * Math.cos(t)
    tracer.y = radius * r * Math.sin(t)
    tracer.z=0
    
}

const resetTracerRandomInRing = (tracer, outerRadius, innerRadius) => {
    let r
    do {
        r = Math.sqrt(randomValue(1.0))
    } while (r * outerRadius < innerRadius)
    let t = randomValue(2 * Math.PI)
    tracer.x = outerRadius * r * Math.cos(t)
    tracer.y = outerRadius * r * Math.sin(t)
    tracer.z=0
   
}

const resetTracerRandomOnSphere = (tracer, radius) => {
    let r = radius
    let t = randomValue(2 * Math.PI)
    tracer.x = r * Math.cos(t)
    tracer.y = r * Math.sin(t)
    tracer.z=0
}

class Tracer {
    constructor(x, y,z) {
        this.x = x
        this.y = y
        this.z = z
        this.ix = 0.0
        this.iy = 0.0
        this.iz = 0.0

       
    }
}

class Sphere {
    constructor(x, y, z,r) {
        this.x = x
        this.y = y
        this.z = z
        this.r = r
        this.r2 = r * r
    }

}

const singleInversion = (tracer, sphere) => {
    let d2 = (tracer.x - sphere.x) * (tracer.x - sphere.x) + (tracer.y - sphere.y) * (tracer.y - sphere.y) + (tracer.z - sphere.z) * (tracer.z - sphere.z)
    tracer.ix = sphere.x + (tracer.x - sphere.x) * sphere.r2 / d2
    tracer.iy = sphere.y + (tracer.y - sphere.y) * sphere.r2 / d2
    tracer.iz = sphere.z + (tracer.z - sphere.z) * sphere.r2 / d2
}
const weightedInversion = (tracer, spheres, decay) => {
    let accWeight = 0.0
    let weight = 0.0
    let x = 0.0
    let y = 0.0
    let z = 0.0
    let rs = 1.0 + Math.min(decay / 1.24 - 1.0, 0.0)
    spheres.forEach(sphere => {
        weight = 1.0 / Math.pow((tracer.x - sphere.x) * (tracer.x - sphere.x) + (tracer.y - sphere.y) * (tracer.y - sphere.y)+ (tracer.z - sphere.z) * (tracer.z - sphere.z), decay)
        singleInversion(tracer, sphere)
        x += weight * tracer.ix
        y += weight * tracer.iy
        z += weight * tracer.iz
        accWeight += weight
    })
    tracer.x = x / (rs * accWeight)
    tracer.y = y / (rs * accWeight)
    tracer.z = z / (rs * accWeight)
}