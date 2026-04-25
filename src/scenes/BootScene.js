import Phaser from 'phaser';
import { LEVELS, texKey, imgPath } from '../utils/LevelData.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const width  = this.cameras.main.width;
        const height = this.cameras.main.height;

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: 'Loading SmartKid...',
            style: { font: '40px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 6 }
        });
        loadingText.setOrigin(0.5, 0.5);

        // ── Shared UI assets ────────────────────────────────────────
        this.load.image('bg',           '/assets/bg.png');
        this.load.image('mascot',       '/assets/mascot.png');
        this.load.image('coin',         '/assets/coin.png');
        this.load.image('logo',         '/assets/logo.png');
        this.load.image('particle',     '/assets/particle.png');
        this.load.image('hint_pointer', '/assets/hint_pointer.png');

        // ── Picture-to-Word level images (dynamic from LevelData) ───
        Object.keys(LEVELS).forEach(level => {
            LEVELS[level].forEach(entry => {
                this.load.image(
                    texKey(level, entry.word),   // e.g.  "L1_apple"
                    imgPath(level, entry)         // e.g.  "/assets/level-1/Apple.png"
                );
            });
        });

        // ── Audio ───────────────────────────────────────────────────
        this.load.audio('correct', '/assets/correct.wav');
        this.load.audio('wrong',   '/assets/wrong.wav');
        this.load.audio('bgm',     '/assets/bgm.wav');

        this.load.on('complete', () => {
            this.scene.start('SplashScene');
        });
    }
}
