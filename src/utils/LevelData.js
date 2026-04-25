// ─────────────────────────────────────────────────────────────────────────────
// LevelData.js  –  Single source of truth for all Picture-to-Word levels
//
// Each entry:
//   word  – lowercase word used in the letter-tile game
//   file  – actual filename (without extension) inside the level folder
//   ext   – file extension  (png | jpeg)
//
// Asset path convention:
//   /assets/level-{n}/{file}.{ext}
//
// Texture key convention (used in Phaser cache):
//   L{level}_{word}           e.g.  L1_apple,  L7_icecream
// ─────────────────────────────────────────────────────────────────────────────

export const LEVELS = {
    1: [
        { word: 'apple',     file: 'Apple',     ext: 'png'  },
        { word: 'banana',    file: 'Banana',    ext: 'png'  },
        { word: 'mango',     file: 'Mango',     ext: 'png'  },
        { word: 'orange',    file: 'Orange',    ext: 'png'  },
        { word: 'pineapple', file: 'Pineapple', ext: 'png'  },
    ],
    2: [
        { word: 'cat',      file: 'Cat',      ext: 'png' },
        { word: 'dog',      file: 'Dog',      ext: 'png' },
        { word: 'elephant', file: 'Elephant', ext: 'png' },
        { word: 'giraffe',  file: 'Giraffe',  ext: 'png' },
        { word: 'lion',     file: 'Lion',     ext: 'png' },
    ],
    3: [
        { word: 'blue',   file: 'Blue',   ext: 'jpeg' },
        { word: 'green',  file: 'Green',  ext: 'jpeg' },
        { word: 'purple', file: 'Purple', ext: 'jpeg' },
        { word: 'red',    file: 'Red',    ext: 'jpeg' },
        { word: 'yellow', file: 'Yellow', ext: 'jpeg' },
    ],
    4: [
        { word: 'eagle',   file: 'Eagle',   ext: 'png' },
        { word: 'owl',     file: 'Owl',     ext: 'png' },
        { word: 'parrot',  file: 'Parrot',  ext: 'png' },
        { word: 'peacock', file: 'Peacock', ext: 'png' },
        { word: 'sparrow', file: 'Sparrow', ext: 'png' },
    ],
    5: [
        { word: 'ear',  file: 'Ear',  ext: 'png' },
        { word: 'eye',  file: 'Eye',  ext: 'png' },
        { word: 'hand', file: 'Hand', ext: 'jpeg' },
        { word: 'leg',  file: 'Leg',  ext: 'jpeg' },
        { word: 'nose', file: 'Nose', ext: 'jpeg' },
    ],
    6: [
        { word: 'cloud',    file: 'Cloud',    ext: 'jpeg' },
        { word: 'mountain', file: 'Mountain', ext: 'jpeg' },
        { word: 'rainbow',  file: 'Rainbow',  ext: 'jpeg' },
        { word: 'river',    file: 'River',    ext: 'jpeg' },
        { word: 'tree',     file: 'Tree',     ext: 'jpeg' },
    ],
    7: [
        { word: 'burger',    file: 'Burger',    ext: 'png' },
        { word: 'icecream',  file: 'Icecream',  ext: 'png' },
        { word: 'noodles',   file: 'Noodles',   ext: 'png' },
        { word: 'pizza',     file: 'Pizza',     ext: 'png' },
        { word: 'sandwich',  file: 'Sandwich',  ext: 'png' },
    ],
    8: [
        { word: 'airplane', file: 'Airplane', ext: 'png' },
        { word: 'bicycle',  file: 'Bicycle',  ext: 'png' },
        { word: 'bus',      file: 'Bus',      ext: 'png' },
        { word: 'car',      file: 'Car',      ext: 'png' },
        { word: 'train',    file: 'Train',    ext: 'png' },
    ],
    9: [
        { word: 'doctor',      file: 'Doctor',      ext: 'jpeg' },
        { word: 'farmer',      file: 'Farmer',      ext: 'png' },
        { word: 'firefighter', file: 'Firefighter', ext: 'jpeg' },
        { word: 'police',      file: 'Police',      ext: 'jpeg' },
        { word: 'teacher',     file: 'Teacher',     ext: 'jpeg' },
    ],
    10: [
        { word: 'bed',          file: 'Bed',          ext: 'png' },
        { word: 'chair',        file: 'Chair',        ext: 'png' },
        { word: 'fan',          file: 'Fan',          ext: 'png' },
        { word: 'refrigerator', file: 'Refrigerator', ext: 'png' },
        { word: 'table',        file: 'Table',        ext: 'png' },
    ],
};

/** Total number of levels in the game */
export const MAX_LEVELS = Object.keys(LEVELS).length;

/** Friendly category label shown in level-up banners */
export const LEVEL_CATEGORIES = {
    1:  '🍎 Fruits',
    2:  '🐾 Animals',
    3:  '🎨 Colors',
    4:  '🐦 Birds',
    5:  '👁️ Body Parts',
    6:  '🌿 Nature',
    7:  '🍕 Food',
    8:  '🚗 Vehicles',
    9:  '👨 People',
    10: '🪑 Furniture',
};

/**
 * Returns the Phaser texture cache key for a given level + word.
 * @param {number|string} level
 * @param {string} word  – lowercase word
 */
export function texKey(level, word) {
    return `L${level}_${word}`;
}

/**
 * Returns the URL path to the image asset for a level entry.
 * @param {number|string} level
 * @param {{ file: string, ext: string }} entry
 */
export function imgPath(level, entry) {
    return `/assets/level-${level}/${entry.file}.${entry.ext}`;
}
