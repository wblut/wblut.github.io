'use strict'
p5.disableFriendlyErrors = true;
let triangleGrid;
let I, J, K,Lx,Ly;
let grid;
let heightMap;
let luminosity;
let darkness;
let warpspace;
let warplevel;
let warps;
let aa,bb,ii,alim,blim;
let SQRT3O6 = Math.sqrt(3.0) / 6.0;

function randomElement(a){
return a[floor(random(a.length))];

}


function randomInt(a,b){
    return floor(random(a,b));
}

function setup() {
    noiseSeed(randomInt(0,1000000));
    createCanvas(windowWidth, windowHeight);
    I =128;
    J =128;
    K =128;
    Lx=2.4*I;
    Ly=sin(PI/3.0)*Lx;
    setOffset();
    heightMap = new Array(I * K)
    init();
    background(255, 250, 246);
}

function setOffset(){
    alim=Lx*max(3,2*floor(windowWidth/2.0/Lx)+1);
    aa=-alim/2;
    blim=Ly*max(2,2*floor(windowHeight/2.0/Ly));
    bb=-blim/2;
    ii=0;
    frameRate(60);
}

function init(){

    grid = new PerlinGrid();
    triangleGrid = new TriangleGrid(0, 0, 2.0);
    triangleGrid.centerOn(I / 2, J / 2, K / 2);
    prepare();
    let pal;
    for (let i = 0; i < 4; i++) {
        pal = getPalette();
        triangleGrid.addMaterial(i, new Palette(pal[0], pal[1], pal[2], pal[3]));
    }
    luminosity = random(0.5, 1.0);
    darkness = random(0.5, 1.0);
    warps=[];
    warps[0] = randomElement([warp1, warp2,  warp6, warp7, warp8, warp9, warp10, warp11, warp12, warp13]);
    for(let w=1;w<16;w++){
      do{
    warps[w]= randomElement([warp1, warp2,   warp6, warp7, warp8, warp9, warp10, warp11, warp12, warp13]);
  }
  while(warps[w]===warps[w-1]);
}
    warplevel=randomElement([0,0,0, 0,1,1,1,1,2,2]);
    warpspace =true;
}

function reset(){
     init();
     do{
    aa+=Lx; 
    if(aa>alim/2+Lx){
        bb+=Ly;
        ii++;
        if(bb>blim/2+0.5*Ly){
            bb=-blim/2;
            ii=0;
            frameRate(5);
        } 
        if((ii%2)===0){
            aa=-alim/2;
                    }else{
            aa=-alim/2-0.5*Lx;
                    }

    }  
}while(aa<-1.2*windowWidth/2 || bb<-1.2*windowHeight/2||aa>1.2*windowWidth/2 || bb>1.2*windowHeight/2);

}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(255, 250, 246);
    setOffset();
}

function prepare() {
    frameCount = 1;
    triangleGrid.triangleMap.clear();
    heightMap = new Array(I * K);
    for (let i = 0; i < I * K; i++) {
        heightMap[i] = -1;
    }

}

function draw() {

    translate(windowWidth/2+aa, windowHeight/2+bb);
    for (let f=0;f<J;f++) {
        triangleGrid.addGridLevel(grid, f);
    } 

    triangleGrid.drawFill();
    noFill();
    triangleGrid.drawOutlines();
    triangleGrid.drawLines();
    reset();

    
}


class TriangleConstants {
    constructor() {
        this.SQRT3O6 = Math.sqrt(3.0) / 6.0;
    }
    x(ox, L, a, b, c) {
        return ox + (2.0 * b - a - c) * this.SQRT3O6 * L;
    }
    y(oy, L, a, b, c) {
        return oy - (c - a) * 0.5 * L;
    }
    vrtx(ox, oy, L, a, b, c) {
        vertex(this.x(ox, L, a, b, c), this.y(oy, L, a, b, c))
    }
    pt(ox, oy, L, a, b, c) {
        point(this.x(ox, L, a, b, c), this.y(oy, L, a, b, c))
    }
    ln(ox, oy, L, a, b, c, a2, b2, c2) {
        line(this.x(ox, L, a, b, c), this.y(oy, L, a, b, c), this.x(ox, L, a2, b2, c2), this.y(oy, L, a2, b2, c2))
    }
    triangleHashKey(a, b, c) {
        let ha = a - c;
        let hb = b - c;
        let A = ha >= 0 ? 2 * ha : -2 * ha - 1;
        let B = hb >= 0 ? 2 * hb : -2 * hb - 1;
        return floor(A >= B ? A * A + A + B : A + B * B);
    }

}

class Triangle extends TriangleConstants {
    constructor(a, b, c) {
        super();
        this.SQRT3O6 = Math.sqrt(3.0) / 6.0;
        this.a = a;
        this.b = b;
        this.c = c;
       
        this.hash = this.triangleHashKey(a, b, c);
    }
    decorate(i, j, k, orientation, material, element) {
        this.i = i;
        this.j = j;
        this.k = k;
        this.z = i+j+k;
        this.orientation = orientation;
        this.material = material;
        this.element = element;
    }

    getZ() {
        return this.z;
    }

    getTriangleType() {
        return extmod(this.a + this.b + this.c, 3);
    }

    draw(ox, oy, L) {
        switch (this.getTriangleType()) {
            case 1:
                beginShape();
                this.vrtx(ox, oy, L, this.a - 1, this.b, this.c);
                this.vrtx(ox, oy, L, this.a, this.b - 1, this.c);
                this.vrtx(ox, oy, L, this.a, this.b, this.c - 1);
                endShape(CLOSE);
                break;
            case 2:
                beginShape();
                this.vrtx(ox, oy, L, this.a + 1, this.b, this.c);
                this.vrtx(ox, oy, L, this.a, this.b + 1, this.c);
                this.vrtx(ox, oy, L, this.a, this.b, this.c + 1);
                endShape(CLOSE);
                break;
            default:
                console.log("not a triangle");
        }
    }

}

class DefaultMaterial {
    getColor(tri) {
        return color(((tri.orientation + 1) % 3) * 127.5);
    }
}

class Palette {
    constructor(col0, col1, col2, col3) {
        this.pal = [];
        this.pal[0] = col0;
        this.pal[1] = col1;
        this.pal[2] = col2;
        this.pal[3] = col3;
    }

    getColor(tri) {
        if(tri.orientation===0 || tri.orientation===2) return this.pal[tri.orientation];
        return lerpColor(this.pal[1], this.pal[3],(tri.j%J)*1.0/J);


    }

}

function getPalette() {
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
    let paletteRoll = Math.floor(random(palettes.length));
    let pal = [];
    for (let i = 0; i < 4; i++) {
        pal[i] = palettes[paletteRoll][i];
    }
    return pal;
}


function toColor(code) {
    let c = toValue(code.substring(0, 1));
    let m = toValue(code.substring(1, 2));
    let y = toValue(code.substring(2, 3));
    let k = toValue(code.substring(3, 4));
    return color(255 * (1.0 - c) * (1.0 - k), 255 * (1.0 - m) * (1.0 - k), 255 * (1.0 - y) * (1.0 - k));
}

function toValue(code) {
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
let di, dj, dk, di2, dj2, dk2;
let fi, fj, fk, fi2, fj2, fk2;
let oj;
let radius;
class PerlinGrid {

    constructor() {
        di = randomInt(7, 27)
        dj = randomInt (7, 27)
        dk = randomInt (7, 27)
        di2 = randomInt (7, 27)
        dj2 = randomInt (7, 27)
        dk2 = randomInt (7, 27)
        do{
            fi = random(100) < 50 ? 0 : 1
            fj = random(100) < 50 ? 0 : 1
            fk = random(100) < 50 ? 0 : 1
        
            fi2 = random(100) < 50 ? 0 : 1
            fj2 = random(100) < 50 ? 0 : 1
            fk2 = random(100) < 50 ? 0 : 1
        }while(fi+fj+fk+fi2+fj2+fk2===0 ||fi+fj+fk===3 ||fi2+fj2+fk2===3 );
        radius = random (8, 13)
      

    }

    value(i, j, k) {
    
        let d2 = (i - 0.5 * I + 0.5) * (i - 0.5 * I + 0.5) + (j - 0.5 * J + 0.5) * (j - 0.5 * J + 0.5) + (k - 0.5 * K + 0.5) * (k - 0.5 * K + 0.5);
                    if (d2 < (27+ fi * i % di + fj * j % dj + fk * k % dk) * (27 + fi2 * i % di2 + fj2 * j % dj2 + fk2 * k % dk2) && d2 > (24 + fi * i % di + fj * j % dj + fk * k % dk) * (24 + fi2 * i % di2 + fj2 * j % dj2 + fk2 * k % dk2)) {
                       return (floor(fi *i/di+fj *j/dj+fk*k/dk+fi2*i/di2+fj2 *j/dj2+fk2*k/dk2 ))%4;
                    }
                    return -1;
}
}

function extmod(i, n) {
  let nn=max(1,floor(n+0.5));
    return (i % nn+ nn) % nn;

}

function warp1(i, j, k) {
    if (i % I > k % K) return [i, j, k];
    return [i, J - j - 1, k];
}


function warp2(i, j, k) {
    if (i % I > k % K) return [i, j, k];
    return [K - 1 - k, j, I - 1 - i];
}





function warp6(i, j, k) {
    if (j % J > J / 2) return [k, j, i];
    return [i, j, k];
}

function warp7(i, j, k) {
    if (k % K > K / 2) return [j, i, k];
    return [i, j, k];
}

function warp8(i, j, k) {
    if (i % I > I / 2) return [i, k, j];
    return [i, j, k];
}

function warp9(i, j, k) {
    if (j % 33 < 8) return [k,j,i];
    return [i, j, k];
}

function warp10(i, j, k) {
    if (k % K < K / 2) return [j, i, k];
    return [i, j, k];
}

function warp11(i, j, k) {
    if (i % I < I / 2) return [i, k, j];
    return [i, j, k];
}

function warp12(i, j, k) {
    return [k, i, j];
}

function warp13(i, j, k) {
    return [j, k, i];
}



class TriangleGrid extends TriangleConstants {

    constructor(ox, oy, L) {
        super();
        this.zx = ox;
        this.ox = ox;
        this.zy = oy;
        this.oy = oy;
        this.L = L;
        this.triangleMap = new Map();
        this.materials = new Map();
        this.defaultMaterial = new DefaultMaterial();

    }

    addMaterial(index, mat) {
        this.materials.set(index, mat);
    }

    centerOn(i, j, k) {
        let a = k - j;
        let b = i - k;
        let c = j - i;
        this.ox = this.zx - this.x(this.zx, this.L, a, b, c);
        this.oy = this.zy - this.y(this.zy, this.L, a, b, c);
    }

    findTriangle(a, b, c) {
        let triangleHash = this.triangleHashKey(a, b, c);
        return this.triangleMap.get(triangleHash);
    }

    addGridLevel(grid, level) {
        let ijkmap = [];
        for (let i = 0; i < I; i++) {
            for (let k = 0; k < K; k++) {
                let layer = grid.value(i,level,k);
                if (layer >= 0) {
                  if(warpspace && warplevel>0){
                    ijkmap =  warps[0](i, level, k);
                    for(let w=1;w<warplevel;w++){
                      ijkmap = warps[w](ijkmap[0], ijkmap[1], ijkmap[2]);
                    }
                    this.addCube(ijkmap[0], ijkmap[1], ijkmap[2], layer % 4, layer);
                    if (level > heightMap[k + K * i]) heightMap[k + K * i] = level;
                  }else{

                    this.addCube(i,level,k, layer % 4, layer);
                    if (level > heightMap[k + K * i]) heightMap[k + K * i] = level;
                  }
                
                }
            }
        }
    }



    addCube(i, j, k, material, element) {
        let a = k - j;
        let b = i - k;
        let c = j - i;


        let tri = new Triangle(a, b, c - 1);
        tri.decorate(i, j, k, 0, material, element);
        this.addTriangle(tri);

        tri = new Triangle(a, b + 1, c);
        tri.decorate(i, j, k, 0, material, element);
        this.addTriangle(tri);

        tri = new Triangle(a - 1, b, c);
        tri.decorate(i, j, k, 1, material, element);
        this.addTriangle(tri);

        tri = new Triangle(a, b, c + 1);
        tri.decorate(i, j, k, 1, material, element);
        this.addTriangle(tri);

        tri = new Triangle(a, b - 1, c);
        tri.decorate(i, j, k, 2, material, element);
        this.addTriangle(tri);

        tri = new Triangle(a + 1, b, c);
        tri.decorate(i, j, k, 2, material, element);
        this.addTriangle(tri);
    }

    addTriangle(triangleToAdd) {

        let tri = this.findTriangle(triangleToAdd.a, triangleToAdd.b, triangleToAdd.c);

        if (typeof tri === 'undefined') {
            this.triangleMap.set(triangleToAdd.hash, triangleToAdd);

        } else if (tri.getZ() < triangleToAdd.getZ()) {
            this.triangleMap.set(triangleToAdd.hash, triangleToAdd);

        }
    }



    isOutline(tri, neighbor) {
        if (neighbor === 'undefined') return true;
        return false;
    }

    isLine(tri, neighbor) {
        if (this.isOutline(tri, neighbor)) return false;
        if (typeof neighbor === 'undefined') return true;
        if ( tri.hash < neighbor.hash) return false; // only draw lines once
        if (tri.orientation != neighbor.orientation) return true;
        if (abs(tri.getZ() - neighbor.getZ()) > 1) return true;
        if (tri.material != neighbor.material) return true;
        return false;
    }


    drawFill() {
        push();
        strokeWeight(0.5);
        let mat;
        for (let [key, tri] of this.triangleMap) {
            
                mat = this.materials.get(tri.material);
                let col = (mat == null ? this.defaultMaterial : mat).getColor(tri);
                if (tri.orientation === 1) {
                    let f = map(heightMap[tri.k + K * tri.i] - tri.j, 0, J, 1.0 - luminosity, darkness);
                    if (f > 0.5) {
                        col = lerpColor(col, color(0), 2 * (f - 0.5));
                    } else {
                        col = lerpColor(color(255), col, 2 * f);
                    }
                }
                fill(col);
                stroke(col,0.5);
                tri.draw(this.ox, this.oy, this.L);
                tri.z=-1;
        }
        pop();
    }



    

    drawLines() {
        beginShape(LINES);
        stroke(0);
        strokeWeight(1.0);
        for (let [key, tri] of this.triangleMap) {
            
                this.drawLine(tri, 0);
                this.drawLine(tri, 1);
                this.drawLine(tri, 2);
            
        }
        endShape();
    }

    drawOutlines() {

        beginShape(LINES);
        stroke(0);
        strokeWeight(2.0);

        for (let [key, tri] of this.triangleMap) {
            
                this.drawOutline(tri, 0);
                this.drawOutline(tri, 1);
                this.drawOutline(tri, 2);
            
        }
        endShape();
    }


    drawLine(tri, i) {
        let neighbor;

        if (tri.getTriangleType() === 1) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a - 1, tri.b, tri.c - 1);
                    if (this.isLine(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a - 1, tri.b - 1, tri.c);
                    if (this.isLine(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b - 1, tri.c - 1);
                    if (this.isLine(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                    }
                    break;
                default:
            }
        } else if (tri.getTriangleType() === 2) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a + 1, tri.b, tri.c + 1);
                    if (this.isLine(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a + 1, tri.b + 1, tri.c);
                    if (this.isLine(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b + 1, tri.c + 1);
                    if (this.isLine(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                    }
                    break;
                default:
            }
        }
    }

    drawOutline(tri, i, ) {
        let neighbor;

        if (tri.getTriangleType() === 1) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a - 1, tri.b, tri.c - 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a - 1, tri.b - 1, tri.c);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a - 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b - 1, tri.c - 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b - 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c - 1);
                    }
                    break;
                default:
            }
        } else if (tri.getTriangleType() === 2) {
            switch (i) {
                case 0:
                    neighbor = this.findTriangle(tri.a + 1, tri.b, tri.c + 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                    }
                    break;
                case 1:
                    neighbor = this.findTriangle(tri.a + 1, tri.b + 1, tri.c);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a + 1, tri.b, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                    }
                    break;
                case 2:
                    neighbor = this.findTriangle(tri.a, tri.b + 1, tri.c + 1);
                    if (this.isOutline(tri, neighbor)) {
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b + 1, tri.c);
                        this.vrtx(this.ox, this.oy, this.L, tri.a, tri.b, tri.c + 1);
                    }
                    break;
                default:
            }
        }
    }
}

