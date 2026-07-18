class PerlinScalarField {
    constructor() {
        this.layers = [];
        this.ts = [];
        blockedLayers = [];
        this.blockedsize = [];
        this.ns = [hl.random(0.008, 0.022), 0, hl.random(0.008, 0.022)];
        this.ns2 = [hl.random(0.008, 0.025), hl.random(0.008, 0.025), hl.random(0.008, 0.025)];
        let nt = -1;
        let nb = 0;
        this.hole = hl.randomInt(5, 9);
        do {
            nt = -1;
            nb = 0;
            for (let i = 0; i < NUMLAYERS + 1; i++) {
                this.layers[i] = hl.randomBool(0.60);
                nt += this.layers[i] ? 1 : 0;
                this.ts[i] = hl.random(0.007, 0.012);
                blockedLayers[i] = hl.randomBool(0.65) ? [false, false, false] : [
                    hl.randomBool(0.28), hl.randomBool(0.28), hl.randomBool(0.28)
                ];
                if (blockedLayers[i][0] || blockedLayers[i][1] || blockedLayers[i][2]) nb++;
                this.blockedsize[i] = [3 + hl.randomInt(3), 3 + hl.randomInt(3), 3 + hl.randomInt(3)];
                if (blockedLayers[i][0] || blockedLayers[i][1] || blockedLayers[i][2]) this.ts[i] = 0.2;
            }
        } while (nt < 4 || nt > 8 || nb > nt / 2 + 1);
        this.layers[NUMLAYERS] = true;
        this.layers[NUMLAYERS + 1] = true;
    }
    value(i, j, k) {
        let elev = constrain(noise(this.ns[0] * i - 25, this.ns[2] * k + 23) - 0.3, 0.0, 1.0);
        let v = elev * (0.5 + 0.5 * cos(map(j, 0, J, 0, PI))) * (0.5 + 0.5 * sin(map(k, 0, K, 0, PI /
            4.0))) * (0.5 + 0.5 * sin(map(i, 0, I, 0, PI / 4.0))) + (1.0 - elev) * noise(noise(this
            .ns2[0] * i, this.ns2[1] * j, this.ns2[2] * k + 15), noise(this.ns2[1] * i, this.ns2[
            2] * j + 7, this.ns2[0] * k), noise(this.ns2[2] * i - 31, this.ns2[0] * j, this.ns2[
            1] * k));
        let layer = floor(JRange * (v - 0.5 / NUMLAYERS));
        let centerValue = layer / JRange + 0.5 / NUMLAYERS;
        let label = extmod(layer, NUMLAYERS);
        for (let s = 0; s < inclusions.length; s++) {
            if (inclusions[s].quickCheck(i, j, k)) {
                let ib = inclusions[s].inInclusion(i, j, k);
                if (ib > -2 && this.dist2(i,j,k,I/2,J/2,K/2)<(I/2+8)*(I/2+8)) return ib;
            }
        }
        let lhole = this.hole + Math.floor(-3 + 6 * noise(0.085 * j));
        if (noise(0.035 * i + 117, 0.085 * j - 37, 0.035 * k + 39) < blockLayer) {
            if (extmod(i + Math.floor(lhole / 2), lhole) < lhole - 3 && extmod(k + Math.floor(lhole / 2),
                    lhole) < lhole - 3) return NUMLAYERS;
            if (extmod(i + Math.floor(lhole / 2), lhole) < lhole - 2 && extmod(k + Math.floor(lhole / 2),
                    lhole) < lhole - 2) return -1;
            if (extmod(i + Math.floor(lhole / 2), lhole) === lhole - 1 || extmod(k + Math.floor(lhole /
                    2), lhole) === lhole - 1) return -1;
        }
        if (((blockedLayers[label][0] && extmod(i, this.blockedsize[label][0]) < 1) || (blockedLayers[
                label][2] && extmod(k, this.blockedsize[label][2]) < 1) || (blockedLayers[label][1] &&
                extmod(j, this.blockedsize[label][1]) < 1)) && (noise(0.03 * i - 37, 0.03 * j + 87, 0.03 *
                k - 113) < 0.62)) {
            return -1;
        }
        if (!drawHidden && !this.layers[label]) return -1;
        if (layer < NUMLAYERS && (i > I + iOffset * OFFSETFACTOR - 6 * (label % 4) || k > K + kOffset *
                OFFSETFACTOR - 6 * (label % 4))) return -1;
        //if(layer < NUMLAYERS && j-jOffset*OFFSETFACTOR > J*(noise(0.017*i+513,0.017*k-668)-0.2)) return -1;
        if(this.dist2(i,j,k,I/2,J/2,K/2)>(I*I/4)) return -1;
        return (abs(v - centerValue) < this.ts[label]) ? label : -1;
    }


    dist2(i,j,k,oi,oj,ok){
        return (i-iOffset*OFFSETFACTOR-oi)*(i-iOffset*OFFSETFACTOR-oi)+(j-jOffset*OFFSETFACTOR-oj)*(j-jOffset*OFFSETFACTOR-oj)+(k-kOffset*OFFSETFACTOR-ok)*(k-kOffset*OFFSETFACTOR-ok);

    }
}