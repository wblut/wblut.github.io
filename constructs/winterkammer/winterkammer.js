'use strict';
let baseZoom;
let REFSIZE = 1700;
const NUMLAYERS = 10;
const padding = 2;
let tiles = [];
let redrawbkg;
let masterRandom;
let aspect;
let backgroundColor;
let lineColor;
let currentTime;
let resizeTimer;
let seeds = [];
let trigger;
let palettes = [];
let startTime;
let backgroundTile;
let mirroredX, mirroredY;
let width, height;

function genTokenData(projectNum) {
  let data = {};
  let hash = "0x";
  for (var i = 0; i < 64; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  data.hash = hash;
  data.tokenId = (
    projectNum * 1000000 +
    Math.floor(Math.random() * 1000)
  ).toString();
  return data;
}

let tokenData = genTokenData(123);
/*

tokenData = {
  hash: "0x11ac16678959949c12d5410212301960fc496813cbc3495bf77aeed738579738",
  tokenId: "123000456",
};

*/
class MasterRNG {
  constructor() {
    this.useA = false;
    let sfc32 = function (uint128Hex) {
      let a = parseInt(uint128Hex.substring(0, 8), 16);
      let b = parseInt(uint128Hex.substring(8, 16), 16);
      let c = parseInt(uint128Hex.substring(16, 24), 16);
      let d = parseInt(uint128Hex.substring(24, 32), 16);
      return function () {
        a |= 0;
        b |= 0;
        c |= 0;
        d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
      };
    };
    this.prngA = new sfc32(tokenData.hash.substring(2, 34));
    this.prngB = new sfc32(tokenData.hash.substring(34, 66));
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA();
      this.prngB();
    }
  }

  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA() : this.prngB();
  }


  randomSeed() { return Math.floor(1e9 * this.random_dec()); }
  roll() { return this.random_dec(); }
  randomFloat(N) { return N * this.roll(); }
  randomIntExcl(N) { return Math.floor(N * this.roll()); }
  randomFloatRange(a, b) { return a + b * this.roll(); }
  randomIntRangeIncl(a, b) {
    return Math.floor(this.randomFloatRange(a, b + 1));

  };

}


class TileRNG {//MT19937
  constructor(seed = Date.now() >>> 0) {
    this.N = 624;
    this.M = 397;
    this.MATRIX_A = 0x9908b0df;
    this.UPPER_MASK = 0x80000000;
    this.LOWER_MASK = 0x7fffffff;
    this.mt = new Uint32Array(this.N);
    this.mti = this.N + 1;
    this.seed(seed >>> 0);
  }
  seed(s) {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < this.N; this.mti++) {
      const x = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
      this.mt[this.mti] = (((((x & 0xffff0000) >>> 16) * 1812433253) << 16) + ((x & 0x0000ffff) * 1812433253) + this.mti) >>> 0;
    }
  }
  saveState() {
    return { mt: new Uint32Array(this.mt), mti: this.mti };
  }
  restoreState(state) {
    this.mt = new Uint32Array(state.mt);
    this.mti = state.mti >>> 0;
  }
  int32() {
    let y;
    const mag01 = [0x0, this.MATRIX_A];
    if (this.mti >= this.N) {
      let kk;
      for (kk = 0; kk < this.N - this.M; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < this.N - 1; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
      this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
      this.mti = 0;
    }
    y = this.mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }
  nextDouble() {
    const a = this.int32() >>> 5;
    const b = this.int32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }
  nextInt(bound) {
    if (!Number.isFinite(bound) || bound <= 0) return 0;
    const max = 0xffffffff;
    const threshold = (max + 1) % bound;
    while (true) {
      const r = this.int32();
      if (r >= threshold) return r % bound;
    }
  }

  roll() { return this.nextDouble(); }
  randomFloat(N) { return N * this.roll(); }
  randomIntExcl(N) { return Math.floor(N * this.roll()); }
  randomFloatRange(a, b) { return a + b * this.roll(); }
  randomIntRangeIncl(a, b) {
    return Math.floor(this.randomFloatRange(a, b + 1));
  };

}


let masterPalette;
let numberOfPalettes;

function setup() {
  width=windowWidth;
  height=windowHeight;
  masterRandom = new MasterRNG();
  resizeTimer = 10;
  createCanvas(width, height);
  aspect = width / height;
  baseZoom = zoomForAspect(aspect);
  frameRate(30);
  redrawbkg = true;
  for (let s = 0; s < 32; s++) {
    seeds[s] = masterRandom.randomSeed();
  }
  
  setupColors();
  setupTiles();
  startTime = Date.now();

}

function zoomForAspect(aspect) {
  if (aspect < 1.0) return map(aspect, 9.0 / 16.0, 1.0, 1.05, 1.16);
  if (aspect > 1.0) return map(aspect, 1.0, 16.0 / 9.0, 1.16, 1.1);
  return 1.16;
}

function setupColors() {
  masterPalette = [
    [color(200), color(15), color(255), color(25)],
    [color(240, 234, 231), color(209, 227, 230), color(255), color(100, 255, 255)],
    [color(244, 236, 233), color(222, 185, 167), color(182, 83, 51), color(209, 107, 69)],
    [color(252, 240, 233), color(217, 238, 229), color(253, 253, 250), color(124, 170, 131)],
    [color(243, 239, 228), color(169, 192, 184), color(219, 198, 155), color(178, 158, 148)],
    [color(59, 104, 125), color(234, 237, 234), color(158, 125, 91), color(118, 208, 250)],
    [color(255, 210, 177), color(186, 120, 86), color(148, 111, 105), color(126, 73, 47)],
    [color(110, 115, 103), color(230, 230, 228), color(187, 183, 174), color(255, 210, 177)],
    [color(100, 154, 161), color(240, 208, 124), color(182, 234, 235), color(255, 228, 144)],
    [color(239, 233, 223), color(206, 212, 190), color(226, 220, 217), color(251, 248, 235)],
    [color(178, 187, 158), color(241, 241, 243), color(121, 151, 151), color(207, 214, 203)],
    [color(240, 240, 238), color(224, 223, 218), color(133, 150, 149), color(251, 228, 215)],
    [color(250, 211, 180), color(247, 225, 155), color(212, 182, 164), color(241, 236, 225)],
    [color(247, 238, 224), color(179, 105, 74), color(238, 238, 240), color(62, 60, 65)],
    [color(239, 201, 156), color(77, 143, 141), color(97, 113, 108), color(229, 238, 240)],
    [color(200, 205, 210), color(242, 248, 239), color(57, 83, 112), color(220, 230, 220)],
    [color(179, 105, 74), color(241, 246, 249), color(84, 127, 128), color(42, 39, 48)],
    [color(235, 222, 178), color(255, 204, 77), color(235, 128, 77), color(222, 102, 0)],
    [color(204, 222, 153), color(128, 178, 77), color(178, 204, 204), color(102, 153, 178)],
  ];
  numberOfPalettes = 2 + masterRandom.randomIntExcl(4);
  for (let i = 0; i < numberOfPalettes; i++) {
    palettes[i] = masterPalette[masterRandom.randomIntExcl(masterPalette.length)];
  }
  backgroundColor = color(255, 250, 246);
  lineColor = color(67, 31, 19)

}


class Composition {
  constructor() {
    const type = masterRandom.randomIntExcl(4);
    switch(type){
      case 0:
      this.type1();
      break;
      case 1:
      this.type2();
      break;
       case 2:
      this.type3();
      break;
       case 3:
      this.type4();
      break;
      default:

    }


  }

  type1() {
    this.numberOfTiles = 14;
    this.seeds = seeds;
    this.centers = [-92, 38, 92, -46, 46, 22, 46, -46,22, 22, 46, -46, 22, -46, 46, 0, 0, 0, -46, 0, 46, 46, 0, -46, 0, 80, 0, 0, -80, 0, 23, 10, -23, -23, -10, 23, 46, 22, -46, -46, 22, 46];
    this.dims = [32, 40, 32, 20, 20, 64, 20, 20, 64, 64, 20, 20, 64, 20, 20, 40, 40, 40, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 10, 30, 10, 10, 10, 10, 20, 64, 20, 20, 64, 20];
    this.zoom = [0.5, 1.0, 1.0, 1.0, 1.0, 1.6, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 1.0, 1.0];
    this.aspectRange = [0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 1.7, 100, 1.7, 100, 0.0, 0.565, 0.0, 0.565, 0, 100, 0, 100, 0, 100];
    this.size = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 6, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0];
    this.type = [1, masterRandom.roll()<0.35?0:4, masterRandom.roll()<0.35?0:4, masterRandom.roll()<0.35?0:4, masterRandom.roll()<0.35?0:4,  0, 0,masterRandom.roll()<0.35?0:4, masterRandom.roll()<0.35?0:4, 0, 2, 2, 3, 3];
    REFSIZE = 1700;
  }

  type2() {
    this.numberOfTiles = 17;
    this.seeds = seeds;
    this.centers = [-20, 0, 0, 0, -32, 0, 0, -48, 0, 0, 0, -11, 42, 0, 0, 0, 0, 42, 0, 76, 0, 0, 0, -10, -10, 0, 0, 0, -10, 0, 0, 76, 0, -56, 0, 56, 56, 0, -56, 0, -64, 0, 0, 62, 0, -42, 17, 0, -42, 17, 0];
    this.dims = [64, 20, 20, 10, 10, 10, 32, 40, 32, 10, 10, 30, 32, 32, 32, 32, 32, 32, 40, 40, 40, 10, 10, 32, 32, 10, 10, 10, 32, 10, 40, 40, 40, 32, 32, 32, 32, 32, 32, 20, 48, 20, 20, 20, 20, 10, 10, 10, 10, 10, 10];
    this.zoom = [1.0, 2.0, 0.5, 2.0, 2.0, 2.0, 1.0, 2.0, 2.0, 2.0, 1.0, 2.0, 2.0, 2.0, 3.0, 2.0, 2.0];
    this.aspectRange = [0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 1.7, 100, 1.7, 100, 0, 0.565, 0, 0.565, 0, 100, 0, 100];
    this.size = [0, 0, 0, 0, 2, 6, 2, 2, 0, 0, 0, 0, 2, 2, 6, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0];
    this.type = [0, 2, 1, 2, masterRandom.roll()<0.35?0:4, 0, 1, 3, 3, 3, 3, 0, masterRandom.roll()<0.75?0:4, masterRandom.roll()<0.75?0:4, masterRandom.roll()<0.35?0:4, 2, 3];
    REFSIZE = 2000;
  }

 type3() {
    this.numberOfTiles =17;
    this.seeds = seeds;
    this.centers = [0, 30, 0,-46,20,46,46,-20,-46,0,88,0,0,-88,0,-21,15,21,21,15,-21,-21,17,21,21,17,-21,-42,90,42,-42,90,42,42,90,-42,42,90,-42,-42,-90,42,-42,-90,42,42,-90,-42,42,-90,-42];
    this.dims = [30, 90, 30,32,32,32,32,32,32,32,32,32,32,32,32,10,40,10,10,40,10,10,44,10,10,44,10,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20];
    this.zoom = [1.6,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0];
    this.aspectRange = [0, 100,1.7,100,1.7,100,0,0.565,0,0.565,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0,100];
    this.size = [2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,8,2,2,2,8,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    this.type = [masterRandom.roll()<0.25?0:4,masterRandom.roll()<0.25?0:4,masterRandom.roll()<0.25?0:4,masterRandom.roll()<0.25?0:4,masterRandom.roll()<0.25?0:4,2,2,3,3,1,3,1,3,1,3,1,3];
    REFSIZE = 1800;
  }

  type4() {
    this.numberOfTiles =16;
    this.seeds = seeds;
    this.centers = [0, 0, 0,20,0,-20,-20,0,20,20,-20,0,-20,20,0,0,20,-20,0,-20,20,0,0,0,0,-60,0,0,90,0,-30,-30,30,30,-30,-30,-30,30,30,120,120,-120,-30,30,30,30,30,-30];
    this.dims = [20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,50,20,20,50,20,60,20,20,20,20,60,10,10,10,40,40,40,10,10,10,10,10,10];
    this.zoom = [2,2,2,2,2,2,2,2,2,2,2,2,2,0.5,2,2];
    this.aspectRange = [0, 100,0,100,0,100,0,100,0,100,0,100,0,100,0,100,0,0.565,0,0.565,1.7,100,1.7,100,0,100,0,100,0,100,0,100];
    this.size = [4,4,4,2, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 2,2,2,2, 0,0,0,0, 0,0,0,0, 0,0,0,0];
    this.type = [2,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,3,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,masterRandom.roll()<0.5?0:4,2,1,3,3];
    REFSIZE = 1800;
  }

}


function setupTiles() {
  mirroredX = masterRandom.roll() < 0.5;
  mirroredY = masterRandom.roll() < 0.5;
  tiles = [];
  const types = ['tile','naked', 'sigil', 'placeholder', 'flatpack'];
  let composition = new Composition();
  for (let t = 0; t < composition.numberOfTiles; t++) {
    switch (types[composition.type[t]]) {
      case 'tile':
        tiles[t] = new Tile({
          seed: composition.seeds[t],
          center: { i: composition.centers[3 * t], j: composition.centers[3 * t + 1], k: composition.centers[3 * t + 2] },
          dims: { I: composition.dims[3 * t], J: composition.dims[3 * t + 1], K: composition.dims[3 * t + 2] },
          offsets: { i: composition.dims[3 * t], j: composition.dims[3 * t + 1], k: composition.dims[3 * t + 2] },
          zoom: composition.zoom[t],
          aspectRange: { min: composition.aspectRange[2 * t], max: composition.aspectRange[2 * t + 1] }
        })
        break;
      case 'naked':
        tiles[t] = new NakedTile({
          seed: composition.seeds[t],
          center: { i: composition.centers[3 * t], j: composition.centers[3 * t + 1], k: composition.centers[3 * t + 2] },
          dims: { I: composition.dims[3 * t], J: composition.dims[3 * t + 1], K: composition.dims[3 * t + 2] },
          offsets: { i: composition.dims[3 * t], j: composition.dims[3 * t + 1], k: composition.dims[3 * t + 2] },
          zoom: composition.zoom[t],
          aspectRange: { min: composition.aspectRange[2 * t], max: composition.aspectRange[2 * t + 1] }
        })
        break;
      case 'sigil':
        tiles[t] = new SigilTile({
          size: { sizeI: composition.size[4 * t], sizeJ: composition.size[4 * t + 1], sizeK: composition.size[4 * t + 2], padding: composition.size[4 * t + 3] },
          seed: composition.seeds[t],
          center: { i: composition.centers[3 * t], j: composition.centers[3 * t + 1], k: composition.centers[3 * t + 2] },
          dims: { I: composition.dims[3 * t], J: composition.dims[3 * t + 1], K: composition.dims[3 * t + 2] },
          offsets: { i:0, j: 0, k: 0 },
          zoom: composition.zoom[t],
          aspectRange: { min: composition.aspectRange[2 * t], max: composition.aspectRange[2 * t + 1] }
        })
        break;
      case 'placeholder':
        tiles[t] = new Placeholder({
          center: { i: composition.centers[3 * t], j: composition.centers[3 * t + 1], k: composition.centers[3 * t + 2] },
          dims: { I: composition.dims[3 * t], J: composition.dims[3 * t + 1], K: composition.dims[3 * t + 2] },
          zoom: composition.zoom[t],
          aspectRange: { min: composition.aspectRange[2 * t], max: composition.aspectRange[2 * t + 1] }
        })
        break;
        case 'flatpack':
         tiles[t] = new FlatPackTile({
          seed: composition.seeds[t],
          center: { i: composition.centers[3 * t], j: composition.centers[3 * t + 1], k: composition.centers[3 * t + 2] },
          dims: { I: composition.dims[3 * t], J: composition.dims[3 * t + 1], K: composition.dims[3 * t + 2] },
          offsets: { i: composition.dims[3 * t], j: composition.dims[3 * t + 1], k: composition.dims[3 * t + 2] },
          zoom: composition.zoom[t],
          aspectRange: { min: composition.aspectRange[2 * t], max: composition.aspectRange[2 * t + 1] }
        })
        break;
      default:
    }
  }

  for (const h of tiles) h.prepare();

  backgroundTile = new BackgroundTile({
    seed: masterRandom.randomSeed(),
    center: { i: 0, j: 0, k: 0 },
    dims: { I: 48, J: 48, K: 48 },
    offsets: { i: 0, j: 0, k: 0 },
    zoom: 16,
    aspectRange: { min: 0, max: 100 }
  });

  backgroundTile.prepare();

}

function windowResized() {
   width=windowWidth;
  height=windowHeight;
  resizeCanvas(width,height);
  aspect = width / height;
  baseZoom = zoomForAspect(aspect);
  redrawbkg = true;
  for (const h of tiles) h.prepare();
  resizeTimer = 30;
}

function draw() {
  currentTime = Date.now();
  if (redrawbkg) {
    background(backgroundColor);
  }

  translate(width / 2, height / 2);
  scale(mirroredX ? -1 : 1, mirroredY?-1:1);
  scale(min(width, height) / REFSIZE);
  if (redrawbkg || resizeTimer > 0) {
    backgroundTile.draw();
  }
  for (const h of tiles) {
    h.draw();
    if (h.BUILT && currentTime - h.lastBuiltTime > h.lifespan && currentTime - startTime > 10000) {
      h.prepare(0);
     if(masterRandom.roll() < 0.25) trigger = true;
      console.log('trigger: on');
    }
  }

  if (resizeTimer > 0) resizeTimer--;
  redrawbkg = false;
}


class TriangleConstants {
  constructor() { this.SQRT3O6 = Math.sqrt(3.0) / 6.0; }
  x(ox, L, a, b, c) { return ox + (2 * b - a - c) * this.SQRT3O6 * L; }
  y(oy, L, a, b, c) { return oy - (c - a) * 0.5 * L; }
  vrtx(ox, oy, L, a, b, c) { vertex(this.x(ox, L, a, b, c), this.y(oy, L, a, b, c)); }
  vrtxijk(ox, oy, L, i, j, k) { vertex(this.x(ox, L, k - j, i - k, j - i), this.y(oy, L, k - j, i - k, j - i)); }
  triangleHashKey(a, b, c) {
    const ha = a - c, hb = b - c;
    const A = ha >= 0 ? 2 * ha : -2 * ha - 1;
    const B = hb >= 0 ? 2 * hb : -2 * hb - 1;
    return floor(A >= B ? A * A + A + B : A + B * B);
  }
}

class Placeholder extends TriangleConstants {
  constructor({ center, dims, zoom = 1.0, aspectRange}) {
    super();
    this.ci = center.i; this.cj = center.j; this.ck = center.k;
    this.zoom = zoom * baseZoom;
    this.I = dims.I; this.J = dims.J; this.K = dims.K;
    this.aspectRangeMin = aspectRange.min ?? 0.0;
    this.aspectRangeMax = aspectRange.max ?? 100.0;
    this.prepare();
    this.lastBuiltTime = Date.now();
    this.active = true;
    this.RENDERED = false;
  }
  centerOn(i, j, k) { this.tris.centerOn(i, j, k); }
  prepare() {
    this.tris = new TriangleGrid({ ox: 0.0, oy: 0.0, L: this.zoom * 6.0, zoom: this.zoom, I: this.I, J: this.J, K: this.K, heightMap: this.heightMap });
    this.centerOn(this.ci, this.cj, this.ck);
    this.active = true;
    this.RENDERED = false;
  }

  drawFrame() {
    if (!this.RENDERED || resizeTimer > 0) {
      fill(backgroundColor);
      strokeWeight(constrain(1.4 * baseZoom, 0.7, 1.4));
      stroke(lerpColor(backgroundColor, lineColor, 0.8), 0.75);
      beginShape();
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, this.J, 0,);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, this.J, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, 0, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, this.J, this.K);
      endShape(CLOSE);

    }
 
  }

  draw() {
     push();
   
    if (!this.active) {

      return;
    }

    if (aspect > this.aspectRangeMax || aspect < this.aspectRangeMin) return;
    this.drawFrame();
    this.RENDERED = true;
pop();
  }
}

class Tile extends TriangleConstants {
  constructor({ seed, center, dims, offsets, zoom = 1.0, aspectRange}) {
    super();
    this.seed = seed;
    this.tileRandom = new TileRNG(this.seed);
    this.ci = center.i; this.cj = center.j; this.ck = center.k;
    this.zoom = zoom * baseZoom;
    this.I = dims.I; this.J = dims.J; this.K = dims.K;
    this.iOffset = offsets.i || 0; this.jOffset = offsets.j || 0; this.kOffset = offsets.k || 0;
    this.aspectRangeMin = aspectRange.min ?? 0.0;
    this.aspectRangeMax = aspectRange.max ?? 100.0;
    this.prepare();
    this.lastBuiltTime = Date.now();
    this.first = true;
    this.active = true;
    this.delay = -masterRandom.randomIntExcl(64);
  }
  centerOn(i, j, k) { this.tris.centerOn(i, j, k); }

  getMaterials() {
    this.materials = new Map();
    for (let i = 0; i < NUMLAYERS + 1; i++) {
      const pal = getPalette(this.tileRandom.randomIntExcl(palettes.length));
      if (i === 0) this.bkg = lerpColor(backgroundColor, pal[this.tileRandom.randomIntExcl(4)], 0.08);
      this.materials.set(i, new Palette(pal[0], pal[1], pal[2], pal[3], this.I + this.J + this.K));
    }
    this.tris.materials = this.materials;
  }

  prepare(delay) {
    this.lifespan = this.tileRandom.randomIntRangeIncl(4000, 12000);
    this.flipIJK = this.tileRandom.randomIntExcl(5);
    noiseSeed(this.seed);
    this.heightMap = new Array(this.I * this.K).fill(-1);
    this.brightBlend = this.tileRandom.randomFloatRange(0.4, 0.8);
    this.darkBlend = this.tileRandom.randomFloatRange(0.2, 0.5);
    this.brightColor = color(255);
    this.darkColor = color(0);
    this.drawOrder = this.tileRandom.randomIntExcl(3);
    this.grid = new PerlinGrid({ I: this.I, J: this.J, K: this.K, numLayers: NUMLAYERS, randomGen: this.tileRandom });
    this.tris = new TriangleGrid({ ox: 0.0, oy: 0.0, L: this.zoom * 6.0, zoom: this.zoom, I: this.I, J: this.J, K: this.K, heightMap: this.heightMap });
    this.getMaterials();
    this.tris.defaultMaterial = DEFAULT_MATERIAL;
    this.centerOn(this.ci, this.cj, this.ck);
    this.BUILT = false;
    this.RENDERED = false;
    this.BUILDSTEP = delay ?? this.delay;


  }

  drawFrame(clear) {


    if ((clear && resizeTimer <= 0) || resizeTimer > 0) {

      fill(this.bkg);
      strokeWeight(constrain(1.4 * baseZoom, 0.7, 1.4));
      stroke(lerpColor(backgroundColor, lineColor, 0.8), 0.75);

      beginShape();
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, this.J, 0,);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, this.J, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, 0, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, this.J, this.K);
      endShape(CLOSE);

    }
   
  }

  draw() {
push();
   
    if (aspect > this.aspectRangeMax || aspect < this.aspectRangeMin) return;
    if (this.RENDERED) return;

    if (this.BUILDSTEP <= 0 || (this.BUILT && !this.RENDERED)) this.drawFrame(this.first || (this.BUILDSTEP <= 0 && this.tileRandom.roll() < 0.32));

    if (resizeTimer > 0) return;
    if (this.BUILT && !this.RENDERED) {
      this.tris.drawFill(this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
      this.tris.drawOutlines();
      this.tris.drawLines();
      this.RENDERED = true;
      return;
    }
    this.first = false;
    const startStep = this.BUILDSTEP - 1;
    const endStep = this.BUILDSTEP - 3;
    noiseSeed(this.seed);
    switch (this.drawOrder) {
      case 0:
        if (this.BUILDSTEP > 0) {
          this.tris.addGridILevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillI(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesI(startStep, endStep, this.zoom);
        this.tris.drawLinesI(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.I) {
          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      case 1:
        if (this.BUILDSTEP > 0) {
          this.tris.addGridJLevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillJ(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesJ(startStep, endStep, this.zoom);
        this.tris.drawLinesJ(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.J) {

          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      case 2:
        if (this.BUILDSTEP > 0) {

          this.tris.addGridKLevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillK(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesK(startStep, endStep, this.zoom);
        this.tris.drawLinesK(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.K) {

          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      default:

    }
    pop();
  }
}


class FlatPackTile extends TriangleConstants {
  constructor({ seed, center, dims, offsets, zoom = 1.0, aspectRange}) {
    super();
    this.seed = seed;
    this.tileRandom = new TileRNG(this.seed);
    this.ci = center.i; this.cj = center.j; this.ck = center.k;
    this.zoom = zoom * baseZoom;
    this.I = dims.I; this.J = dims.J; this.K = dims.K;
    this.iOffset = offsets.i || 0; this.jOffset = offsets.j || 0; this.kOffset = offsets.k || 0;
    this.aspectRangeMin = aspectRange.min ?? 0.0;
    this.aspectRangeMax = aspectRange.max ?? 100.0;
    this.prepare();
    this.lastBuiltTime = Date.now();
    this.first = true;
    this.active = true;
    this.delay = -masterRandom.randomIntExcl(64);
  }
  centerOn(i, j, k) { this.tris.centerOn(i, j, k); }

  getMaterials() {
    this.materials = new Map();
    for (let i = 0; i < NUMLAYERS + 1; i++) {
      const pal = getPalette(this.tileRandom.randomIntExcl(palettes.length));
      if (i === 0) this.bkg = lerpColor(backgroundColor, pal[this.tileRandom.randomIntExcl(4)], 0.08);
      this.materials.set(i, new Palette(pal[0], pal[1], pal[2], pal[3], this.I + this.J + this.K));
    }
    this.tris.materials = this.materials;
  }

  prepare(delay) {
    this.lifespan = this.tileRandom.randomIntRangeIncl(4000, 12000);
    this.flipIJK = this.tileRandom.randomIntExcl(5);
    noiseSeed(this.seed);
    this.heightMap = new Array(this.I * this.K).fill(-1);
    this.brightBlend = this.tileRandom.randomFloatRange(0.4, 0.8);
    this.darkBlend = this.tileRandom.randomFloatRange(0.2, 0.5);
    this.brightColor = color(255);
    this.darkColor = color(0);
    this.drawOrder = this.tileRandom.randomIntExcl(3);
    this.grid =this.tileRandom.roll()<0.5?new PerlinGrid({ I: this.I, J: this.J, K: this.K, numLayers: NUMLAYERS, randomGen: this.tileRandom }): new FlatPack({ I: this.I, J: this.J, K: this.K, numLayers: NUMLAYERS, tileRandom: this.tileRandom });
    this.tris = new TriangleGrid({ ox: 0.0, oy: 0.0, L: this.zoom * 6.0, zoom: this.zoom, I: this.I, J: this.J, K: this.K, heightMap: this.heightMap });
    this.getMaterials();
    this.tris.defaultMaterial = DEFAULT_MATERIAL;
    this.centerOn(this.ci, this.cj, this.ck);
    this.BUILT = false;
    this.RENDERED = false;
    this.BUILDSTEP = delay ?? this.delay;


  }

  drawFrame(clear) {


    if ((clear && resizeTimer <= 0) || resizeTimer > 0) {

      fill(this.bkg);
      strokeWeight(constrain(1.4 * baseZoom, 0.7, 1.4));
      stroke(lerpColor(backgroundColor, lineColor, 0.8), 0.75);

      beginShape();
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, this.J, 0,);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, this.J, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, 0, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, this.I, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, this.tris.L, 0, this.J, this.K);
      endShape(CLOSE);

    }
   
  }

  draw() {
push();
   
    if (aspect > this.aspectRangeMax || aspect < this.aspectRangeMin) return;
    if (this.RENDERED) return;

    if (this.BUILDSTEP <= 0 || (this.BUILT && !this.RENDERED)) this.drawFrame(this.first || (this.BUILDSTEP <= 0 && this.tileRandom.roll() < 0.32));

    if (resizeTimer > 0) return;
    if (this.BUILT && !this.RENDERED) {
      this.tris.drawFill(this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
      this.tris.drawOutlines();
      this.tris.drawLines();
      this.RENDERED = true;
      return;
    }
    this.first = false;
    const startStep = this.BUILDSTEP - 1;
    const endStep = this.BUILDSTEP - 3;
    noiseSeed(this.seed);
    switch (this.drawOrder) {
      case 0:
        if (this.BUILDSTEP > 0) {
          this.tris.addGridILevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillI(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesI(startStep, endStep, this.zoom);
        this.tris.drawLinesI(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.I) {
          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      case 1:
        if (this.BUILDSTEP > 0) {
          this.tris.addGridJLevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillJ(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesJ(startStep, endStep, this.zoom);
        this.tris.drawLinesJ(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.J) {

          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      case 2:
        if (this.BUILDSTEP > 0) {

          this.tris.addGridKLevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillK(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesK(startStep, endStep, this.zoom);
        this.tris.drawLinesK(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.K) {

          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      default:

    }
    pop();
  }
}


class NakedTile extends TriangleConstants {
  constructor({ seed, center, dims, offsets, zoom = 1.0, aspectRange}) {
    super();
    this.seed = seed;
    this.tileRandom = new TileRNG(this.seed);
    this.ci = center.i; this.cj = center.j; this.ck = center.k;
    this.zoom = zoom * baseZoom;
    this.I = dims.I; this.J = dims.J; this.K = dims.K;
    this.iOffset = offsets.i || 0; this.jOffset = offsets.j || 0; this.kOffset = offsets.k || 0;
    this.aspectRangeMin = aspectRange.min ?? 0.0;
    this.aspectRangeMax = aspectRange.max ?? 100.0;
    this.prepare();
    this.lastBuiltTime = Date.now();
    this.first = true;
    this.delay = -masterRandom.randomIntExcl(64);

  }
  centerOn(i, j, k) { this.tris.centerOn(i, j, k); }

  getMaterials() {
    this.materials = new Map();
    for (let i = 0; i < NUMLAYERS + 1; i++) {
      const pal = getPalette(this.tileRandom.randomIntExcl(palettes.length));
      if (i === 0) this.bkg = lerpColor(backgroundColor, pal[this.tileRandom.randomIntExcl(4)], 0.08);
      this.materials.set(i, new Palette(pal[0], pal[1], pal[2], pal[3], this.I + this.J + this.K));
    }
    this.tris.materials = this.materials;
  }

  prepare(delay) {
    this.lifespan = this.tileRandom.randomIntRangeIncl(4000, 12000);
    this.flipIJK = this.tileRandom.randomIntExcl(5);
    noiseSeed(this.seed);
    this.heightMap = new Array(this.I * this.K).fill(-1);
    this.brightBlend = this.tileRandom.randomFloatRange(0.4, 0.8);
    this.darkBlend = this.tileRandom.randomFloatRange(0.2, 0.5);
    this.brightColor = color(255);
    this.darkColor = color(0);
    this.drawOrder = this.tileRandom.randomIntExcl(3);

    this.grid = new PerlinGrid({ I: this.I, J: this.J, K: this.K, numLayers: NUMLAYERS, randomGen: this.tileRandom, symmetric: true });

    this.tris = new TriangleGrid({ ox: 0.0, oy: 0.0, L: this.zoom * 6.0, zoom: this.zoom, I: this.I, J: this.J, K: this.K, heightMap: this.heightMap });
    this.getMaterials();
    this.tris.defaultMaterial = DEFAULT_MATERIAL;
    this.centerOn(this.ci, this.cj, this.ck);
    this.BUILT = false;
    this.RENDERED = false;
    this.BUILDSTEP = delay ?? this.delay;


  }

  drawFrame(clear) {



    if ((clear && resizeTimer <= 0) || resizeTimer > 0) {
      fill(backgroundColor);
      noStroke()


      beginShape();
      this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, 0, this.J, 0,);
      this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, this.I, this.J, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, this.I, 0, 0);
      this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, this.I, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, 0, 0, this.K);
      this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, 0, this.J, this.K);
      endShape(CLOSE);
    }
  
  }

  draw() {
    push();
    
    if (aspect > this.aspectRangeMax || aspect < this.aspectRangeMin) return;
    if (this.RENDERED) return;

    if (this.BUILDSTEP <= 0 || (this.BUILT && !this.RENDERED)) this.drawFrame(this.first || (this.BUILDSTEP <= 0 && this.tileRandom.roll() < 0.32));
    if (resizeTimer > 0) return;
    if (this.BUILT && !this.RENDERED) {
      this.tris.drawFill(this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
      this.tris.drawOutlines();
      //this.tris.drawLines();
      this.RENDERED = true;
      return;
    }
    this.first = false;
    const startStep = this.BUILDSTEP - 1;
    const endStep = this.BUILDSTEP - 3;
    noiseSeed(this.seed);
    switch (this.drawOrder) {
      case 0:
        if (this.BUILDSTEP > 0) {
          this.tris.addGridILevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillI(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesI(startStep, endStep, this.zoom);
        //this.tris.drawLinesI(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.I) {
          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      case 1:
        if (this.BUILDSTEP > 0) {
          this.tris.addGridJLevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillJ(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesJ(startStep, endStep, this.zoom);
        //this.tris.drawLinesJ(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.J) {

          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      case 2:
        if (this.BUILDSTEP > 0) {

          this.tris.addGridKLevel(this.grid, startStep, this.flipIJK, {
            iOffset: this.iOffset,
            jOffset: this.jOffset,
            kOffset: this.kOffset, angle: 0
          });
        }
        this.tris.drawFillK(startStep, endStep, this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
        noFill();
        this.tris.drawOutlinesK(startStep, endStep, this.zoom);
        // this.tris.drawLinesK(startStep, endStep);
        this.BUILDSTEP++;
        if (this.BUILDSTEP > this.J) {

          this.BUILT = true;
          this.lastBuiltTime = Date.now();
        }
        break;
      default:

    }
    pop();
  }




}

class BackgroundTile extends TriangleConstants {
  constructor({ seed, center, dims, offsets, zoom = 1.0, aspectRange }) {
    super();
    this.seed = seed;
    this.tileRandom = new TileRNG(this.seed);
    this.ci = center.i; this.cj = center.j; this.ck = center.k;
    this.zoom = zoom * baseZoom;
    this.I = dims.I; this.J = dims.J; this.K = dims.K;
    this.iOffset = offsets.i || 0; this.jOffset = offsets.j || 0; this.kOffset = offsets.k || 0;
    this.aspectRangeMin = aspectRange.min ?? 0.0;
    this.aspectRangeMax = aspectRange.max ?? 100.0;
    this.prepare();

  }
  centerOn(i, j, k) { this.tris.centerOn(i, j, k); }

  getMaterials() {
    this.materials = new Map();
    for (let i = 0; i < NUMLAYERS + 1; i++) {
      const pal = getPalette(this.tileRandom.randomIntExcl(palettes.length));
      this.materials.set(i, new Palette(lerpColor(backgroundColor, pal[0], 0.65), lerpColor(backgroundColor, pal[1], 0.65), lerpColor(backgroundColor, pal[2], 0.65), lerpColor(backgroundColor, pal[3], 0.65), this.I + this.J + this.K));
    }
    this.tris.materials = this.materials;
  }

  prepare(delay) {

    this.flipIJK = this.tileRandom.randomIntExcl(5);
    noiseSeed(this.seed);
    this.heightMap = new Array(this.I * this.K).fill(-1);
    this.brightBlend = this.tileRandom.randomFloatRange(0.4, 0.8);
    this.darkBlend = this.tileRandom.randomFloatRange(0.2, 0.5);
    this.brightColor = color(255);
    this.darkColor = color(0);
    this.drawOrder = this.tileRandom.randomIntExcl(3);

    this.grid = new PerlinGrid({ I: this.I, J: this.J, K: this.K, numLayers: NUMLAYERS, randomGen: this.tileRandom, symmetric: true });

    this.tris = new TriangleGrid({ ox: 0.0, oy: 0.0, L: this.zoom * 6.0, zoom: this.zoom, I: this.I, J: this.J, K: this.K, heightMap: this.heightMap });
    for (let r = 0; r < this.J; r++) {
      this.tris.addGridJLevel(this.grid, r, this.flipIJK, {
        iOffset: this.iOffset,
        jOffset: this.jOffset,
        kOffset: this.kOffset, angle: 0
      });
    }



    this.getMaterials();
    this.tris.defaultMaterial = DEFAULT_MATERIAL;
    this.centerOn(this.ci, this.cj, this.ck);



  }

  draw() {

    if (aspect > this.aspectRangeMax || aspect < this.aspectRangeMin) return;



    this.tris.drawFill(this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
    this.tris.drawAllLines();



  }

}

class SigilTile extends TriangleConstants {
  constructor({ seed, center, dims, size, offsets, zoom = 1, aspectRange}) {
    super();
    this.seed = seed;
    this.tileRandom = new TileRNG(this.seed);
    this.ci = center.i; this.cj = center.j; this.ck = center.k;
    this.zoom = zoom * baseZoom;
    this.I = dims.I; this.J = dims.J; this.K = dims.K;
    this.iOffset = offsets.i || 0; this.jOffset = offsets.j || 0; this.kOffset = offsets.k || 0;
    this.aspectRangeMin = aspectRange.min ?? 0.0;
    this.aspectRangeMax = aspectRange.max ?? 100.0
    this.sizeI = size.sizeI;
    this.sizeJ = size.sizeJ;
    this.sizeK = size.sizeK;
    this.padding = size.padding;
    this.prepare();
    this.lastBuiltTime = Date.now();
    this.active = true;

  }
  centerOn(i, j, k) { this.tris.centerOn(i, j, k); }

  getMaterials() {
    this.materials = new Map();
    for (let i = 0; i < NUMLAYERS + 1; i++) {
      const pal = getPalette(this.tileRandom.randomIntExcl(palettes.length));
      if (i === 0) this.bkg = lerpColor(backgroundColor, pal[this.tileRandom.randomIntExcl(4)], 0.08);
      this.materials.set(i, new Palette(pal[0], pal[1], pal[2], pal[3], this.I + this.J + this.K));
    }
    this.tris.materials = this.materials;
  }

  prepare() {
    this.lifespan = this.tileRandom.randomIntRangeIncl(4000, 12000);
    this.flipIJK = this.tileRandom.randomIntRangeIncl(3, 4);
    noiseSeed(this.seed);
    this.heightMap = new Array(this.I * this.K).fill(-1);
    this.brightBlend = this.tileRandom.randomFloatRange(0.4, 0.8);
    this.darkBlend = this.tileRandom.randomFloatRange(0.2, 0.5);
    this.brightColor = color(255);
    this.darkColor = color(0);
    this.grid = new TraceCube(this.sizeI, this.sizeJ, this.sizeK, this.padding, this.tileRandom);
    this.tris = new TriangleGrid({ ox: 0.0, oy: 0.0, L: this.zoom * 6.0, zoom: this.zoom, I: this.I, J: this.J, K: this.K, heightMap: this.heightMap });
    this.getMaterials();
    this.tris.defaultMaterial = DEFAULT_MATERIAL;
    this.centerOn(this.ci, this.cj, this.ck);
    this.active = true;

  }

  drawFrame() {

    strokeWeight(constrain(1.4 * baseZoom, 0.7, 1.4));
    //stroke(lineColor);
    noStroke();
    fill(backgroundColor);
    beginShape();
    this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, 0, this.J, 0,);
    this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, this.I, this.J, 0);
    this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, this.I, 0, 0);
    this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, this.I, 0, this.K);
    this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, 0, 0, this.K);
    this.vrtxijk(this.tris.ox, this.tris.oy, 0.95 * this.tris.L, 0, this.J, this.K);
    endShape(CLOSE);
  
  }

  draw() {
    push();
   
    if (!this.active) {
      if (trigger && this.tileRandom.roll() < 0.25) {
        this.prepare();
        trigger = false;
         console.log('trigger: off');
         
      }
      return;
    }
    this.tris.clear();
    if (aspect > this.aspectRangeMax || aspect < this.aspectRangeMin) return;
    this.drawFrame();

    if (resizeTimer > 0) return;
    for (let j = 0; j < this.J; j++) {
      this.tris.addGridJLevel(this.grid, j, this.gridIJK, {
        iOffset: this.iOffset,
        jOffset: this.jOffset,
        kOffset: this.kOffset, angle: this.angle
      });
    }

    this.tris.drawFill(this.brightBlend, this.darkBlend, this.brightColor, this.darkColor);
    this.tris.drawOutlines();
    this.tris.drawLines();
    this.active = false;
    pop();
  }

}


class Triangle extends TriangleConstants {
  constructor(a, b, c, flip) {
    super();
    this.a = a; this.b = b; this.c = c;
    this.hash = this.triangleHashKey(a, b, c);
    this.flip = flip;
  }
  decorate(i, j, k, orientation, material, element) {
    this.i = i; this.j = j; this.k = k;
    this.z = i + j + k;
    this.orientation = orientation;
    this.material = material;
    this.element = element;
  }
  getZ() { return this.z; }
  getTriangleType() { return extmod(this.a + this.b + this.c, 3); }
  draw(ox, oy, L) {
    const t = this.getTriangleType();
    if (t !== 1 && t !== 2) return;
    const s = (t === 1) ? -1 : +1;
    beginShape();
    this.vrtx(ox, oy, L, this.a + s, this.b, this.c);
    this.vrtx(ox, oy, L, this.a, this.b + s, this.c);
    this.vrtx(ox, oy, L, this.a, this.b, this.c + s);
    endShape(CLOSE);
  }
}

const DEFAULT_MATERIAL = { getColor(tri) { return color(((tri.orientation + 1) % 3) * 127.5); } };

class Palette {
  constructor(col0, col1, col2, col3, limit) { this.pal = [col0, col1, col2, col3]; this._limit = limit; }
  getColor(tri) {
    if (tri.orientation === 0) return lerpColor(this.pal[0], lerpColor(this.pal[2], this.pal[1], 0.5), ((tri.i + tri.j + tri.k) % (this._limit ?? 64)) / (this._limit ?? 64));
    if (tri.orientation === 2) return lerpColor(this.pal[2], lerpColor(this.pal[3], this.pal[0], 0.5), ((tri.i + tri.j + tri.k) % (this._limit ?? 64)) / (this._limit ?? 64));
    return lerpColor(this.pal[1], this.pal[3], ((tri.i + tri.j + tri.k) % (this._limit ?? 64)) / (this._limit ?? 64));
  }
}
function getPalette(r) {

  const idx = [0, 1, 2, 3]; shuffle(idx);
  const pal = [];
  for (let i = 0; i < 4; i++) pal[idx[i]] = palettes[r][i];
  return pal;
}

class PerlinGrid {
  constructor({ I, J, K, numLayers, randomGen }) {
    this.I = I;
    this.J = J;
    this.K = K;
    this.gridRNG = randomGen;
    this.numLayers = numLayers;
    this.layers = []; this.ts = []; this.blocked = []; this.blockedsize = [];
    this.ns = [this.gridRNG.randomFloatRange(0.008, 0.022), 0, this.gridRNG.randomFloatRange(0.008, 0.022)];
    this.ns2 = [this.gridRNG.randomFloatRange(0.008, 0.025), this.gridRNG.randomFloatRange(0.008, 0.032), this.gridRNG.randomFloatRange(0.008, 0.025)];
    this.nsi = this.ns2[0] / 0.75;
    this.nsj = this.ns2[1] / 0.75;
    this.nsk = this.ns2[2] / 0.75;
    this.hole = this.gridRNG.randomIntRangeIncl(5, 9);
    let nt, nb;
    this.symm = this.gridRNG.randomIntExcl(10);
    this.symm2 = 0;
    do {
      this.symm2 = this.gridRNG.randomIntExcl(12);
    } while (this.symm2 === this.symm);
    do {
      this.symm3 = this.gridRNG.randomIntExcl(16);
    } while (this.symm3 === this.symm2);
    this.tilted = this.gridRNG.roll() < 0.5;
    this.rotationMode = this.gridRNG.randomIntExcl(2);


   // do {
      nt = nb = 0;
      for (let i = 0; i <= this.numLayers; i++) {
        const blocked = (this.gridRNG.roll() < 0.3)
          ? [false, false, false]
          : [this.gridRNG.roll() < 0.15, this.gridRNG.roll() < 0.15, this.gridRNG.roll() < 0.15];
        const anyBlocked = blocked[0] || blocked[1] || blocked[2];
        const active = (this.layers[i] = this.gridRNG.roll() < 1.60);
        nt += active ? 1 : 0; if (active && anyBlocked) nb++;
        this.ts[i] = anyBlocked ? this.gridRNG.randomFloatRange(0.05, 0.05) : this.gridRNG.randomFloatRange(0.010, 0.016);
        this.blocked[i] = blocked;
        this.blockedsize[i] = [this.gridRNG.randomIntRangeIncl(2, 6), this.gridRNG.randomIntRangeIncl(2, 6), this.gridRNG.randomIntRangeIncl(2, 6)];
      }
    //} while (nt < 4 || nt > 8 || nb > nt / 2 + 1);
  }

  value(i, j, k) {
    for (let r = 0; r < 3; r++) {
      switch (r === 0 ? this.symm : r === 1 ? this.symm2 : this.symm3) {
        case 0:
          if (j < k) {
            let t = j;
            j = k;
            k = t;
          }
          break;
        case 1:
          if (j > k) {
            let t = j;
            j = k;
            k = t;
          }
          break;
        case 2:
          if (i < k) {
            let t = i;
            i = k;
            k = t;
          }
          break;
        case 3:
          if (i > k) {
            let t = i;
            i = k;
            k = t;
          }
          break;
        case 4:
          if (i < j) {
            let t = i;
            i = j;
            j = t;
          }
          break;
        case 5:
          if (i > j) {
            let t = i;
            i = j;
            j = t;
          }
          break;

        default:
      }
    }
    const NUMLAYERS = this.numLayers;
    const fi16 = floor(i / 16), fk16 = floor(k / 16), fj16 = floor(j / 16);
    const fi24 = floor(i / 24), fk24 = floor(k / 24), fj24 = floor(j / 24);
    let bi = i, bj = j, bk = k;
    if (this.tilted && ((fi16 + fk16 + fj16) & 1) === 0) { bi = j; bj = i; }
    if (this.tilted && ((fi24 + fk24 + fj24) & 1) === 0) { const t = bi; bi = k; bk = t; }
    const nxi = this.nsi * i, nxj = this.nsj * j, nxk = this.nsk * k;
    const elev = constrain(noise(this.ns[0] * i - 25, this.ns[2] * k + 23) - 0.2, 0.0, 1.0);
    const v =
      elev * (0.5 + 0.5 * cos(map(j, 0, this.J, 0, PI))) +
      (1.0 - elev) * noise(
        noise(nxi, nxj, nxk + 15),
        noise(nxi, nxj + 7, nxk),
        noise(nxi - 31, nxj, nxk)
      );
    const layer = floor(this.J / 2.5 * (v - 0.05));
    const label = extmod(layer, NUMLAYERS);
    const lhole = this.hole + floor(-3 + 6 * noise(0.085 * j));
    const holeN = noise(0.035 * bi + 117, 0.085 * bj - 37, 0.035 * bk + 39);
    if (holeN < 0.35) {
      const half = floor(lhole / 2);
      const mbi = extmod(bi + half, lhole);
      const mbk = extmod(bk + half, lhole);
      if (mbi < lhole - 3 && mbk < lhole - 3) return NUMLAYERS;
      if (mbi < lhole - 2 && mbk < lhole - 2) return -1;
      if (mbi === lhole - 1 || mbk === lhole - 1) return -1;
    }
    const b = this.blocked[label], bs = this.blockedsize[label];
    if ((b[0] && extmod(bi, bs[0]) < 2) ||
      (b[2] && extmod(bk, bs[2]) < 2) ||
      (b[1] && extmod(bj, bs[1]) < 2)) return -1;
    if (!this.layers[label]) return -1;
    return (abs(layer * 2.5 / this.J + 0.5 / NUMLAYERS - v) < this.ts[label]) ? label : -1;
  }
}

class TraceCube {
  // Constants
  EMPTY = -1;
  START = 7;
  BLOCKED = 8;
  LEFT = 0;
  RIGHT = 1;
  DOWN = 2;
  UP = 3;
  BACK = 4;
  FRONT = 5;

  constructor(sI, sJ, sK, p, tileRandom) {
    this.padding = p;
    this.factor = 1 + 2 * this.padding;
    this.sizeI = sI;
    this.voxelSizeI = sI * this.factor;
    this.sizeJ = sJ;
    this.voxelSizeJ = sJ * this.factor;
    this.sizeK = sK;
    this.voxelSizeK = sK * this.factor;
    this.randomGen = tileRandom;
    this.state = Array.from({ length: this.sizeI }, () =>
      Array.from({ length: this.sizeJ }, () =>
        Array.from({ length: this.sizeK }, () => this.EMPTY)
      )
    );
    for (let n = 0; n < 160; n++) this.randomPath();
    this.voxels = this.pattern();
  }

  value(i, j, k) {
    if (i < 0 || j < 0 || k < 0 || i >= this.voxelSizeI || j >= this.voxelSizeJ || k >= this.voxelSizeK) return -1;

    return this.voxels[i][j][k] ? 0 : -1;
  }

  randomPath() {
    let startI, startJ, startK;
    let startTrial = 0;
    do {
      startI = this.randomGen.randomIntExcl(this.sizeI);
      startJ = this.randomGen.randomIntExcl(this.sizeJ);
      startK = this.randomGen.randomIntExcl(this.sizeK);
      startTrial++;
    } while (
      this.state[startI][startJ][startK] !== this.EMPTY &&
      startTrial < 1000
    );


    if (startTrial >= 100) return;

    let currentI = startI;
    let currentJ = startJ;
    let currentK = startK;
    this.setState(currentI, currentJ, currentK, this.START);

    let possible = true;
    let steps = 0;

    let MAXSTEPS = this.randomGen.randomIntExcl(9);
    MAXSTEPS *= MAXSTEPS;

    if (MAXSTEPS > 0) {
      do {
        let stepTrial = 0;
        let roll;
        do {
          let allowed;
          do {
            allowed = true;
            roll = this.randomGen.randomIntExcl(6);

            if (currentI === 0 && roll === this.LEFT) allowed = false;
            if (currentJ === 0 && roll === this.DOWN) allowed = false;
            if (currentK === 0 && roll === this.BACK) allowed = false;
            if (currentI === this.sizeI - 1 && roll === this.RIGHT) allowed = false;
            if (currentJ === this.sizeJ - 1 && roll === this.UP) allowed = false;
            if (currentK === this.sizeK - 1 && roll === this.FRONT) allowed = false;
          } while (!allowed);

          possible = true;

          switch (roll) {
            case this.LEFT:
              if (this.state[currentI - 1][currentJ][currentK] > -1) {
                possible = false;
              } else {
                currentI--;
                this.setState(currentI, currentJ, currentK, this.LEFT);
              }
              break;

            case this.RIGHT:
              if (this.state[currentI + 1][currentJ][currentK] > -1) {
                possible = false;
              } else {
                currentI++;
                this.setState(currentI, currentJ, currentK, this.RIGHT);
              }
              break;

            case this.DOWN:
              if (this.state[currentI][currentJ - 1][currentK] > -1) {
                possible = false;
              } else {
                currentJ--;
                this.setState(currentI, currentJ, currentK, this.DOWN);
              }
              break;

            case this.UP:


              if (this.state[currentI][currentJ + 1][currentK] > -1) {
                possible = false;
              } else {
                currentJ++;
                this.setState(currentI, currentJ, currentK, this.UP);
              }
              break;

            case this.BACK:
              if (this.state[currentI][currentJ][currentK - 1] > -1) {
                possible = false;
              } else {
                currentK--;
                this.setState(currentI, currentJ, currentK, this.BACK);
              }
              break;

            case this.FRONT:
              if (this.state[currentI][currentJ][currentK + 1] > -1) {
                possible = false;
              } else {
                currentK++;
                this.setState(currentI, currentJ, currentK, this.FRONT);
              }
              break;
          }

          stepTrial++;
        } while (!possible && stepTrial < 100);

        if (possible) steps++;
      } while (possible && steps < MAXSTEPS);
    }
  }

  setState(i, j, k, roll) {
    const dd = this.sizeI + this.sizeJ + this.sizeK;
    for (let d = -dd; d <= dd; d++) {
      const ii = i + d;
      const jj = j + d;
      const kk = k + d;
      if (
        ii >= 0 && jj >= 0 && kk >= 0 &&
        ii < this.sizeI && jj < this.sizeJ && kk < this.sizeK
      ) {
        this.state[ii][jj][kk] = this.BLOCKED;
      }
    }
    this.state[i][j][k] = roll;
  }

  pattern() {


    // Initialize 3D boolean grid with false
    const result = Array.from({ length: this.voxelSizeI }, () =>
      Array.from({ length: this.voxelSizeJ }, () =>
        Array.from({ length: this.voxelSizeK }, () => false)
      )
    );

    for (let i = 0; i < this.sizeI; i++) {
      for (let j = 0; j < this.sizeJ; j++) {
        for (let k = 0; k < this.sizeK; k++) {
          const roll = this.state[i][j][k];


          switch (roll) {
            case this.EMPTY:
            case this.BLOCKED:
              break;

            case this.START: {
              const x = this.factor * i + this.padding;
              const y = this.factor * j + this.padding;
              const z = this.factor * k + this.padding;
              result[x][y][z] = true;
              break;
            }

            case this.LEFT: {
              for (let d = 0; d < 2 * this.padding + 2; d++) {
                const x = this.factor * i + this.padding + d;
                const y = this.factor * j + this.padding;
                const z = this.factor * k + this.padding;
                result[x][y][z] = true;
              }
              break;
            }

            case this.RIGHT: {
              for (let d = 0; d < 2 * this.padding + 2; d++) {
                const x = this.factor * i + this.padding - d;
                const y = this.factor * j + this.padding;
                const z = this.factor * k + this.padding;
                result[x][y][z] = true;
              }
              break;
            }

            case this.BACK: {
              for (let d = 0; d < 2 * this.padding + 2; d++) {
                const x = this.factor * i + this.padding;
                const y = this.factor * j + this.padding;
                const z = this.factor * k + this.padding + d;
                result[x][y][z] = true;
              }
              break;
            }

            case this.FRONT: {
              for (let d = 0; d < 2 * this.padding + 2; d++) {
                const x = this.factor * i + this.padding;
                const y = this.factor * j + this.padding;
                const z = this.factor * k + this.padding - d;
                result[x][y][z] = true;
              }
              break;
            }

            case this.DOWN: {
              for (let d = 0; d < 2 * this.padding + 2; d++) {
                const x = this.factor * i + this.padding;
                const y = this.factor * j + this.padding + d;
                const z = this.factor * k + this.padding;
                result[x][y][z] = true;
              }
              break;
            }

            case this.UP: {
              for (let d = 0; d < 2 * this.padding + 2; d++) {
                const x = this.factor * i + this.padding;
                const y = this.factor * j + this.padding - d;
                const z = this.factor * k + this.padding;
                result[x][y][z] = true;
              }
              break;
            }

            default:
              break;
          }

        }
      }
    }

    return result;
  }
}


class FlatPack {
  constructor({ I, J, K, numLayers,tileRandom }) {
    this.I = I;
    this.J = J;
    this.K = K;
    this.numLayers = numLayers;
    this.tileRandom=tileRandom;
    this.hole = this.tileRandom.roll() < 0.5
    this.lI = this.I / 4 + this.tileRandom.randomIntRangeIncl(-4, this.I / 4 - 4);
    this.lK = (this.I === this.K) ? this.lI : this.K / 4 + this.tileRandom.randomIntRangeIncl(-4, this.K / 4 - 4);
    this.uI = this.I - this.lI;
    this.uK = (this.I === this.K) ? this.uI : this.K - this.lK;
    this.dir =this.tileRandom.randomIntExcl(3);
    this.symm = this.tileRandom.randomIntExcl(6);
     this.symm2 = this.tileRandom.randomIntExcl(9);
      this.symm3 = this.tileRandom.randomIntExcl(12);
     this.rock=new PerlinGrid({ I: this.I, J: this.J, K: this.K, numLayers: NUMLAYERS, randomGen: this.tileRandom });

  }

  value(i, j, k) {
   const nv=noise(0.035*i,0.035*j,0.035*k);
   let v;
   if(nv<0.45){
v=this.rock.value(i,j,k);
 return v==-1?-1:(4+v)%NUMLAYERS;
   }
   
    
    if (i > this.I / 3 && i < 2 * this.I / 3 && k > this.K / 3 && k < 2 * this.K / 3 && (j % 5) < 3) return -1;
     for(let r=0;r<3;r++){
    switch (r===0?this.symm:r===1?this.symm2:this.symm3) {
      case 0:
        if (j < k) {
          let t = j;
          j = k;
          k = t;
        }
        break;
      case 1:
        if (j > k) {
          let t = j;
          j = k;
          k = t;
        }
        break;
      case 2:
        if (i < k) {
          let t = i;
          i = k;
          k = t;
        }
        break;
      case 3:
        if (i > k) {
          let t = i;
          i = k;
          k = t;
        }
        break;
      case 4:
        if (i < j) {
          let t = i;
          i = j;
          j = t;
        }
        break;
      case 5:
        if (i > j) {
          let t = i;
          i = j;
          j = t;
        }
        break;

      default:
    }
  }
    if (i > this.lI && i < this.uI && k > this.lK && k < this.uK && (j % 5) < 3) return 1;
    return this.dir === 0 ? ((i % 5) == 1 ? 0 : -1) : this.dir === 1 ? ((j % 5) == 1 ? 0 : -1) : ((k % 5) == 1 ? 0 : -1);
  }
}


const TRI_NEIGHBORS = {
  1: [
    { n: [-1, 0, -1], a: [0, 0, -1], b: [-1, 0, 0] },
    { n: [-1, -1, 0], a: [-1, 0, 0], b: [0, -1, 0] },
    { n: [0, -1, -1], a: [0, -1, 0], b: [0, 0, -1] },
  ],
  2: [
    { n: [+1, 0, +1], a: [0, 0, +1], b: [+1, 0, 0] },
    { n: [+1, +1, 0], a: [+1, 0, 0], b: [0, +1, 0] },
    { n: [0, +1, +1], a: [0, +1, 0], b: [0, 0, +1] },
  ]
};

class TriangleGrid extends TriangleConstants {
  constructor({ ox, oy, L, zoom, I, J, K, heightMap }) {
    super();
    this.zx = this.ox = ox;   // visual origin
    this.zy = this.oy = oy;
    this.L = L;
    this.zoom = zoom;
    this.I = I; this.J = J; this.K = K;
    this.heightMap = heightMap;
    this.triangleMap = new Map();
    this.materials = new Map();
    this.defaultMaterial = DEFAULT_MATERIAL;
  }

  [Symbol.iterator]() { return this.triangleMap.values(); }
  values() { return this.triangleMap.values(); }

  addMaterial(index, mat) { this.materials.set(index, mat); }

  centerOn(i, j, k) {
    const a = k - j, b = i - k, c = j - i;
    this.ox = this.zx - this.x(this.zx, this.L, a, b, c);
    this.oy = this.zy - this.y(this.zy, this.L, a, b, c);
  }

  clear() {
    this.triangleMap.clear();
    this.heightMap.fill(0);
  }

  findTriangle(a, b, c) { return this.triangleMap.get(this.triangleHashKey(a, b, c)); }

  addGridJLevel(grid, level, flip, { iOffset, jOffset, kOffset }) {
    const I = this.I, J = this.J, K = this.K;
    const j = level;
    for (let i = 0; i < I; i++) for (let k = 0; k < K; k++) {
      const edge =
        (i === I - 1 && j === 0) || (k === K - 1 && j === 0) ||
        (i === 0 && j === J - 1) || (k === 0 && j === J - 1) ||
        (i === I - 1 && k === 0) || (k === K - 1 && i === 0);
      const pad = (i < padding || i >= I - padding || k < padding || k >= K - padding || j < padding || j >= J - padding);

      const layer = edge ? -1 : pad ? -1 :
        grid.value(Math.floor(i + iOffset),
          Math.floor(j + jOffset),
          Math.floor(k + kOffset));

      const idx = k + K * i;

      if (layer >= 0) {
        this.addCube(i, j, k, layer === NUMLAYERS ? layer : layer % 4, layer, edge || (flip === 0 ? i > I / 2 : flip === 1 ? j > J / 2 : flip === 2 ? k > K / 2 : flip === 3));
        if (j > this.heightMap[idx]) this.heightMap[idx] = j;
      }
    }
  }

  addGridILevel(grid, level, flip, { iOffset, jOffset, kOffset }) {
    const I = this.I, J = this.J, K = this.K;
    const i = level;
    for (let j = 0; j < J; j++) for (let k = 0; k < K; k++) {
      const edge =
        (i === I - 1 && j === 0) || (k === K - 1 && j === 0) ||
        (i === 0 && j === J - 1) || (k === 0 && j === J - 1) ||
        (i === I - 1 && k === 0) || (k === K - 1 && i === 0);
      const pad = (i < padding || i >= I - padding || k < padding || k >= K - padding || j < padding || j >= J - padding);

      const layer = edge ? -1 : pad ? -1 :
        grid.value(Math.floor(i + iOffset),
          Math.floor(j + jOffset),
          Math.floor(k + kOffset));

      const idx = k + K * i;

      if (layer >= 0) {
        this.addCube(i, j, k, layer === NUMLAYERS ? layer : layer % 4, layer, edge || (flip === 0 ? i > I / 2 : flip === 1 ? j > J / 2 : flip === 2 ? k > K / 2 : flip === 3));
        if (j > this.heightMap[idx]) this.heightMap[idx] = j;
      }
    }
  }

  addGridKLevel(grid, level, flip, { iOffset, jOffset, kOffset }) {
    const I = this.I, J = this.J, K = this.K;
    const k = level;
    for (let i = 0; i < I; i++) for (let j = 0; j < J; j++) {
      const edge =
        (i === I - 1 && j === 0) || (k === K - 1 && j === 0) ||
        (i === 0 && j === J - 1) || (k === 0 && j === J - 1) ||
        (i === I - 1 && k === 0) || (k === K - 1 && i === 0);
      const pad = (i < padding || i >= I - padding || k < padding || k >= K - padding || j < padding || j >= J - padding);

      const layer = edge ? -1 : pad ? -1 :
        grid.value(Math.floor(i + iOffset),
          Math.floor(j + jOffset),
          Math.floor(k + kOffset));

      const idx = k + K * i;

      if (layer >= 0) {
        this.addCube(i, j, k, layer === NUMLAYERS ? layer : layer % 4, layer, edge || (flip === 0 ? i > I / 2 : flip === 1 ? j > J / 2 : flip === 2 ? k > K / 2 : flip === 3));
        if (j > this.heightMap[idx]) this.heightMap[idx] = j;
      }
    }
  }

  addCube(i, j, k, material, element, flip) {
    const a = k - j, b = i - k, c = j - i, s = (flip ? -1 : 1);
    const place = (A, B, C, o) => { const t = new Triangle(A, B, C, flip); t.decorate(i, j, k, o, material, element); this.addTriangle(t, flip); };
    place(a, b, c - s, 0);
    place(a, b + s, c, 0);
    place(a - s, b, c, 1);
    place(a, b, c + s, 1);
    place(a, b - s, c, 2);
    place(a + s, b, c, 2);
  }

  addTriangle(triangleToAdd, flip) {
    const tri = this.findTriangle(triangleToAdd.a, triangleToAdd.b, triangleToAdd.c);
    if (typeof tri === 'undefined' || ((flip) ? tri.getZ() >= triangleToAdd.getZ() : tri.getZ() <= triangleToAdd.getZ())) {
      this.triangleMap.set(triangleToAdd.hash, triangleToAdd);
    }
  }

  isOutline(tri, neighbor) { return (typeof neighbor === 'undefined') || (tri.element !== neighbor.element); }
  isLine(tri, neighbor) {
    if (this.isOutline(tri, neighbor)) return false;
    if (tri.hash < neighbor.hash) return false;
    if (tri.orientation !== neighbor.orientation) return true;
    if (Math.abs(tri.getZ() - neighbor.getZ()) > 6) return true;
    if (tri.material !== neighbor.material) return true;
    return false;
  }

  getColor(tri, brightBlend, darkBlend, brightCol, darkCol) {
    const mat = this.materials.get(tri.material);
    let col = (mat == null ? this.defaultMaterial : mat).getColor(tri);


    if (tri.orientation === 1) {
      const brightness = map(constrain(this.heightMap[tri.k + this.K * tri.i] - tri.j, 0, this.J), 0, this.J, 1.0, 0.0);
      col = (brightness > 0.5) ? lerpColor(col, brightCol ?? color(255), constrain(2 * (brightness - 0.5), 0, brightBlend)) : lerpColor(col, darkCol, constrain(1.0 - 2 * brightness, 0, darkBlend));
    }
    return col;
  }

  drawFill(brightBlend, darkBlend, brightCol, darkCol) {


    for (const tri of this.triangleMap.values()) {

      const col = this.getColor(tri, brightBlend, darkBlend, brightCol, darkCol);
      fill(col); stroke(red(col), green(col), blue(col), 0.5); tri.draw(this.ox, this.oy, this.L);

    }
    endShape();
  }

  drawLines() { this._drawEdges(false, 0.7, 0.8); }
  drawOutlines() { this._drawEdges(true, constrain(1.4 * baseZoom, 0.7, 1.4), 0.8); }
  drawAllLines() { this._drawEdges(false, 0.7, 0.85); this._drawEdges(true, 0.7, 0.85); }
  _drawEdges(outline, w = 0.7, alpha = 1.0) {
    beginShape(LINES);
    stroke(lerpColor(backgroundColor, lineColor, alpha)); strokeWeight(w);
    for (const tri of this.triangleMap.values()) {
      (outline ? this._drawOutline : this._drawLine).call(this, tri, 0);
      (outline ? this._drawOutline : this._drawLine).call(this, tri, 1);
      (outline ? this._drawOutline : this._drawLine).call(this, tri, 2);
    }
    endShape();
  }

  _drawLine(tri, edgeIndex) {
    const t = tri.getTriangleType(); if (t !== 1 && t !== 2) return;
    const d = TRI_NEIGHBORS[t][edgeIndex];
    const neighbor = this.findTriangle(tri.a + d.n[0], tri.b + d.n[1], tri.c + d.n[2]);
    if (!this.isLine(tri, neighbor)) return;
    this.vrtx(this.ox, this.oy, this.L, tri.a + d.a[0], tri.b + d.a[1], tri.c + d.a[2]);
    this.vrtx(this.ox, this.oy, this.L, tri.a + d.b[0], tri.b + d.b[1], tri.c + d.b[2]);
  }

  _drawOutline(tri, edgeIndex) {
    const t = tri.getTriangleType(); if (t !== 1 && t !== 2) return;
    const d = TRI_NEIGHBORS[t][edgeIndex];
    const neighbor = this.findTriangle(tri.a + d.n[0], tri.b + d.n[1], tri.c + d.n[2]);
    if (!this.isOutline(tri, neighbor)) return;
    this.vrtx(this.ox, this.oy, this.L, tri.a + d.a[0], tri.b + d.a[1], tri.c + d.a[2]);
    this.vrtx(this.ox, this.oy, this.L, tri.a + d.b[0], tri.b + d.b[1], tri.c + d.b[2]);
  }
  drawFillJ(j, j2, brightBlend, darkBlend, brightCol, darkCol) {
    beginShape(TRIANGLES);
    for (const tri of this.triangleMap.values()) if (tri.j > j2 && tri.j <= j) {
      const mat = this.materials.get(tri.material);
      const col = this.getColor(tri, brightBlend, darkBlend, brightCol, darkCol);

      fill(col); noStroke(); tri.draw(this.ox, this.oy, this.L);
    }
    endShape();
  }

  drawLinesJ(j, j2) {
    beginShape(LINES);
    stroke(lineColor); strokeWeight(0.7);
    for (const tri of this.triangleMap.values()) if (tri.j > j2 && tri.j <= j) {
      this._drawLine(tri, 0); this._drawLine(tri, 1); this._drawLine(tri, 2);
    }
    endShape();
  }

  drawOutlinesJ(j, j2) {
    beginShape(LINES);
    stroke(lineColor); strokeWeight(constrain(1.4 * baseZoom, 0.7, 1.4));
    for (const tri of this.triangleMap.values()) if (tri.j > j2 && tri.j <= j) {
      this._drawOutline(tri, 0); this._drawOutline(tri, 1); this._drawOutline(tri, 2);
    }
    endShape();
  }


  drawFillI(i, i2, brightBlend, darkBlend, brightCol, darkCol) {
    beginShape(TRIANGLES);
    for (const tri of this.triangleMap.values()) if (tri.i > i2 && tri.i <= i) {
      const mat = this.materials.get(tri.material);
      const col = this.getColor(tri, brightBlend, darkBlend, brightCol, darkCol);

      fill(col); noStroke(); tri.draw(this.ox, this.oy, this.L);
    }
    endShape();
  }

  drawLinesI(i, i2) {
    beginShape(LINES);
    stroke(lineColor); strokeWeight(0.7);
    for (const tri of this.triangleMap.values()) if (tri.i > i2 && tri.i <= i) {
      this._drawLine(tri, 0); this._drawLine(tri, 1); this._drawLine(tri, 2);
    }
    endShape();
  }

  drawOutlinesI(i, i2) {
    beginShape(LINES);
    stroke(lineColor); strokeWeight(constrain(1.4 * baseZoom, 0.7, 1.4));
    for (const tri of this.triangleMap.values()) if (tri.i > i2 && tri.i <= i) {
      this._drawOutline(tri, 0); this._drawOutline(tri, 1); this._drawOutline(tri, 2);
    }
    endShape();
  }

  drawFillK(k, k2, brightBlend, darkBlend, brightCol, darkCol) {

    for (const tri of this.triangleMap.values()) if (tri.k > k2 && tri.k <= k) {
      const mat = this.materials.get(tri.material);
      const col = this.getColor(tri, brightBlend, darkBlend, brightCol, darkCol);

      fill(col); noStroke(); tri.draw(this.ox, this.oy, this.L);
    }
  }

  drawLinesK(k, k2) {
    beginShape(LINES);
    stroke(lineColor); strokeWeight(0.7);
    for (const tri of this.triangleMap.values()) if (tri.k > k2 && tri.k <= k) {
      this._drawLine(tri, 0); this._drawLine(tri, 1); this._drawLine(tri, 2);
    }
    endShape();
  }

  drawOutlinesK(k, k2) {
    beginShape(LINES);
    stroke(lineColor); strokeWeight(constrain(1.4 * baseZoom, 0.7, 1.4));
    for (const tri of this.triangleMap.values()) if (tri.k > k2 && tri.k <= k) {
      this._drawOutline(tri, 0); this._drawOutline(tri, 1); this._drawOutline(tri, 2);
    }
    endShape();
  }


}
function extmod(i, n) { const nn = max(1, floor(n + 0.5)); return (i % nn + nn) % nn; }

