function initColors() {
    let pal;
    palettes = [];
    for (let i = 0; i < NUMLAYERS + 2; i++) {
        pal = i === NUMLAYERS ? getLayerXPalette() : i === NUMLAYERS + 1 ? getInclusionPalette() :
        getPalette();
        palettes[i] = pal;
        mainDrawingGrid.addMaterial(i, new Palette(pal[0], pal[1], pal[2], pal[3]));
        frameGrid.addMaterial(i, new Palette(pal[0], pal[1], pal[2], pal[3]));
    }
}

function changeColors() {
    let pal;
    palettes = [];
    for (let i = 0; i < NUMLAYERS + 2; i++) {
        pal = i === NUMLAYERS ? getLayerXPalette() : i === NUMLAYERS + 1 ? getInclusionPalette() :
        getPalette();
        palettes[i] = pal;
        mainDrawingGrid.addMaterial(i, new Palette(pal[0], pal[1], pal[2], pal[3]));
        frameGrid.addMaterial(i, new Palette(pal[0], pal[1], pal[2], pal[3]));
    }
}

function getPaletteMineral() {
    let palettes = [
        [color(103, 171, 174), color(160, 202, 214), color(127, 185, 196),
            color(51, 60, 101), "ocean"
        ]
    ];
    let paletteRoll = hl.randomInt(palettes.length - 1);
    let pal = [];
    for (let i = 0; i < 4; i++) {
        pal[i] = palettes[paletteRoll][i];
    }
    return pal;
}

function getPalette() {
    let palettes = [
        [color(244, 236, 233), color(222, 185, 167), color(182, 83, 51),
            color(209, 107, 69), "brick"
        ],
        [color(252, 240, 233), color(217, 238, 229), color(253, 253, 250),
            color(124, 170, 131), "jade"
        ],
        [color(243, 239, 228), color(169, 192, 184), color(219, 198, 155),
            color(178, 158, 148), "clay"
        ],
        [color(255, 210, 177), color(186, 120, 86), color(148, 111, 105),
            color(126, 73, 47), "earth"
        ],
        [color(230, 230, 228), color(110, 115, 103), color(187, 183, 174),
            color(255, 210, 177), "tan rock"
        ],
        [color(239, 233, 223), color(206, 212, 190), color(226, 220, 217),
            color(251, 248, 235), "grey green rock"
        ],
        [color(206, 212, 190), color(239, 233, 223), color(81, 80, 93),
            color(233, 239, 244), "green rock"
        ],
        [color(222, 250, 207), color(157, 145, 1), color(102, 120, 116),
            color(213, 225, 170), "emerald"
        ],
        [color(240, 211, 180), color(247, 225, 155), color(212, 182, 184),
            color(241, 236, 225), "sunny sand rock"
        ],
        [color(139, 148, 163), color(204, 231, 227), color(57, 52, 53),
            color(224, 251, 247), "ocean rock"
        ],
        [color(85, 87, 99), color(250, 204, 128), color(204, 134, 84),
            color(223, 218, 213), "desert rock"
        ],
        [color(200, 143, 100), color(227, 219, 215), color(66, 23, 6),
            color(182, 207, 217), "dusty desert rock"
        ],
        [color(239, 201, 156), color(77, 143, 141), color(97, 113, 108),
            color(229, 238, 240), "sunlit ocean rock"
        ],
        [color(227, 205, 207), color(218, 129, 100), color(83, 61, 51),
            color(253, 234, 223), "pink rock"
        ],
        [color(35, 57, 72), color(141, 146, 149), color(97, 113, 108),
            color(155, 130, 69), "dark clay"
        ],
        [toColor('A130'), toColor('0270'), toColor('A570'), toColor('16X0'), "warm orange"],
        [toColor('0120'), toColor('1430'), toColor('1660'), toColor('3640'), "organ pink"],
        [toColor('2140'), toColor('5370'), toColor('3220'), toColor('6430'), "vegetation green"],
        [color(103, 171, 174), color(160, 202, 214), color(127, 185, 196),
            color(51, 60, 101), "ocean"
        ]
    ];
    let paletteRoll = hl.randomInt(palettes.length - 1);
    let pal = [];
    for (let i = 0; i < 4; i++) {
        pal[i] = palettes[paletteRoll][flatColor ? 0 : i];
    }
    return pal;
}

function getLayerXPalette() {
    let palettes = [
        [color(200), color(150), color(255), color(85)],
        [color(50), color(80), color(35), color(25)],
        [color(251, 240, 214), color(255, 245, 224), color(140, 128, 97),
            color(42, 39, 48), "yellowish metal"
        ],
        [color(240, 240, 238), color(224, 223, 218), color(133, 150, 149),
            color(221, 228, 215), "greenish metal"
        ],
        [color(240, 238, 238), color(214, 218, 253), color(133, 149, 150),
            color(215, 215, 228), "bluish metal"
        ]
    ];
    let paletteRoll = hl.randomInt(palettes.length - 1);
    let pal = [];
    for (let i = 0; i < 4; i++) {
        pal[i] = palettes[paletteRoll][flatColor ? 0 : i];
    }
    return pal;
}

function getInclusionPalette() {
    let palettes = [
        [color(200), color(150), color(255), color(85)],
        [color(50), color(80), color(35), color(25)],
        [color(251, 240, 214), color(255, 245, 224), color(140, 128, 97),
            color(42, 39, 48), "yellowish metal"
        ],
        [color(240, 240, 238), color(224, 223, 218), color(133, 150, 149),
            color(221, 228, 215), "greenish metal"
        ],
        [color(240, 238, 238), color(214, 218, 253), color(133, 149, 150),
            color(215, 215, 228), "bluish metal"
        ],
        [color(100, 154, 161), color(240, 208, 124), color(182, 234, 235),
            color(255, 228, 144), "cyan and gold"
        ],
        [color(222, 250, 207), color(157, 145, 1), color(102, 120, 116),
            color(213, 225, 170), "emerald"
        ],
        [color(139, 148, 163), color(204, 231, 227), color(57, 52, 53),
            color(224, 251, 247), "ocean rock"
        ],
        [color(53, 52, 57), color(213, 214, 217), color(243, 174, 147),
            color(58, 79, 89), "dusk steel"
        ],
        [toColor('A130'), toColor('0270'), toColor('A570'), toColor('16X0'), "warm orange"],
        [toColor('0120'), toColor('1430'), toColor('1660'), toColor('3640'), "organ pink"]
    ];
    let paletteRoll = hl.randomInt(palettes.length - 1);
    let pal = [];
    for (let i = 0; i < 4; i++) {
        pal[i] = palettes[paletteRoll][flatColor ? 0 : i];
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
class DefaultMaterial {
    getColor(tri) {
        return backgroundColor;
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
        if (tri.orientation === 0 || tri.orientation === 2) return this.pal[tri.orientation];
        return lerpColor(this.pal[1], this.pal[3], (tri.j % J) * 1.0 / J);
    }
}