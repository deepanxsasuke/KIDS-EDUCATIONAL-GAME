import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: 'Loading SmartKid...',
            style: { font: '40px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 6 }
        });
        loadingText.setOrigin(0.5, 0.5);

        // Load generated placeholders
        this.load.image('bg', '/assets/bg.png');
        this.load.image('mascot', '/assets/mascot.png');
        this.load.image('coin', '/assets/coin.png');
        this.load.image('logo', '/assets/logo.png');
        this.load.image('particle', '/assets/particle.png');

        // Load audio
        this.load.audio('correct', '/assets/correct.wav');
        this.load.audio('wrong', '/assets/wrong.wav');
        this.load.audio('bgm', '/assets/bgm.wav');

        this.load.on('complete', () => {
            this.scene.start('SplashScene');
        });
    }
}
