
let ca;
let seed;
let table = [];
let sizeCell = 1;
let rep;
let rowsDrawn = 0; // internal substitute for resetting frameCount

function preload() {

  table = loadStrings("LorenTabular1DCA_LongestCycle.txt");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  background(255);

  seed = parseSeedFromTable();
  ca = new WrappedLorenCA(Math.floor(width / sizeCell), seed);
  rep = 16;

  noStroke();
}

function draw() {

  for (let i = 0; i < rep; i++) {
    ca.update();

    const y = (rep * (rowsDrawn) + i) % Math.floor(height / sizeCell);
    ca.draw(sizeCell, y);
  }

  rowsDrawn++;


  if ((rep * rowsDrawn) >= Math.floor(height / sizeCell)) {
    noLoop();
  }
}

// Click mouse for random ruleset
function mousePressed() {
  seed = parseSeedFromTable();
  ca = new WrappedLorenCA(Math.floor(width / sizeCell), seed);

  rowsDrawn = 0;
  background(255);
  loop();
  console.log(seed);
}


function keyPressed() {
  if (key === ' ') {
    //const fname = nf(seed, 12) + ".png";
    //saveCanvas(fname);
    seed = parseSeedFromTable();
     ca = new WrappedLorenCA(Math.floor(width / sizeCell), seed);

    rowsDrawn = 0;
    background(255);
    loop();
  } else if (key === 'n' || key === 'N') {
    seed = parseSeedFromTable();
    ca = new WrappedLorenCA(int(width / sizeCell), seed);
    rowsDrawn = 0;
    background(255);
    loop();
    console.log(seed);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(255);
  // Recreate CA to match new width
  ca = new WrappedLorenCA(int(width / sizeCell), seed);
  rowsDrawn = 0;
  loop();
}

function parseSeedFromTable() {
  if (!table || table.length === 0) {

    return Math.floor(random(1e11, 1e12));
  }
  const line = random(table); 
  return parseInt(String(line).trim(), 10);
}

// ======================= WrappedLorenCA class (ported 1:1) =======================

class WrappedLorenCA {
  constructor(N, index) {
    this.N = max(N, 1);
    this.values = new Array(this.N).fill(false);
    this.startValues = new Array(this.N).fill(false);
    this.buffer = new Array(this.N).fill(false);
    this.rules = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    this.res = new Array(this.N).fill(1);
    this.age = 0;

    // The 9 entries of the ruleset are described by the seed in ternary notation
    // Fill rules row-major with successive index % 3 then index /= 3
    let idx = BigInt(index); // allow large seeds safely
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        // idx % 3
        let mod = Number(idx % 3n);
        this.rules[i][j] = mod;
        // idx /= 3
        idx = idx / 3n;
      }
    }

    // Initialize res array in blocks determined by noise
    // r = 2^(int(8*noise(100 + 0.0062*i)))
    let r = 0;
    for (let i = 0; i < this.N; i += r) {
      const exp = int(8 * noise(100 + 0.0062 * i));
      r = int(pow(2, exp));
      this.res[i] = r;
      for (let j = 1; j < r; j++) {
        if (i + j < this.N) this.res[i + j] = r;
      }
    }

    this.init();
  }

  init() {
    for (let i = 0; i < this.N; i++) {
      const v = random(100) < 50;
      this.startValues[i] = v;
      this.values[i] = v;
    }
    this.update(); // matches original
    this.age = 0;
  }

  reinit() {
    for (let i = 0; i < this.N; i++) {
      this.values[i] = this.startValues[i];
    }
    this.age = 0;
  }

  getN() {
    return this.N;
  }

  update() {
    let row, col, rule;

    for (let i = 0; i < this.N; i += this.res[i]) {
      if (this.age % this.res[i] === 0) {
        // NEAREST NEIGHBORS
        row = 0;
        if (this.getValue(i - this.res[i])) row++;
        if (this.getValue(i + this.res[i])) row++;

        // NEXT-NEAREST NEIGHBORS (with res lookups wrapped)
        col = 0;
        if (this.getValue(i - this.res[i] - this.res[(i - this.res[i] + this.N) % this.N])) col++;
        if (this.getValue(i + this.res[i] + this.res[(i + this.res[i]) % this.N])) col++;

        rule = this.rules[row][col];

        // 0: SWITCH OFF, 1: SWITCH ON, 2: UNCHANGED
        this.setBufferValue(i, rule === 0 ? false : (rule === 1 ? true : this.getValue(i)));
      } else {
        this.setBufferValue(i, this.getValue(i));
      }
    }

    this.bufferToValues();
    this.age++;

    // Randomly adjust res similar to original
    let r = 0;
    let halved = false;
    for (let i = 0; i < this.N; i += (halved ? 2 * r : r)) {
      halved = false;

      if (random(100) < 5 &&
          (this.res[i] === this.res[min(this.N - 1, i + this.res[i])]) &&
          (this.age % this.res[i]) === 0) {
        r = min(64, this.res[i] * 2);
      } else if (this.res[i] > 5 && random(100) < 2 && (this.age % (int(this.res[i] / 2))) === 0) {
        r = int(this.res[i] / 2);
        halved = true;
      } else {
        r = this.res[i];
      }

      this.res[i] = r;
      for (let j = 1; j < (halved ? 2 * r : r); j++) {
        if (i + j < this.N) this.res[i + j] = r;
      }
    }

    return true;
  }

  getValue(i) {
    if (i < 0) return false;
    if (i > this.N - 1) return false;
    return this.values[i];
  }

  setValue(i, value) {
    if (i < 0) return;
    if (i > this.N - 1) return;
    while (i < 0) i += this.N;
    this.values[i] = value;
  }

  getBufferValue(i) {
    if (i < 0) return false;
    if (i > this.N - 1) return false;
    while (i < 0) i += this.N;
    return this.buffer[i];
  }

  setBufferValue(i, value) {
    if (i < 0) return;
    if (i > this.N - 1) return;
    while (i < 0) i += this.N;
    for (let r = 0; r < this.res[i]; r++) {
      if (i + r < this.N) this.buffer[(i + r)] = value;
    }
  }

  bufferToValues() {
    let changed = false;
    for (let i = 0; i < this.N; i++) {
      if (this.buffer[i] !== this.values[i]) changed = true;
      this.values[i] = this.buffer[i];
    }
    return changed;
  }

  draw(L, offset) {
    // Draw one row of cells
    for (let i = 0; i < this.N; i++) {
      fill(this.getValue(i) ? 0 : 255);
      rect(i * L, offset * L, L, L);
    }
  }
}
