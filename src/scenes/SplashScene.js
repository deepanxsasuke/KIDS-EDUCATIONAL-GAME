import Phaser from 'phaser';

export default class SplashScene extends Phaser.Scene {
    constructor() {
        super('SplashScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background: Vibran linear gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4169E1, 0x4169E1, 1);
        bg.fillRect(0, 0, width, height);


        // 3. Logo: Center with premium animations
        const isLandscape = width > height;
        const logoScale = Math.min(width * (isLandscape ? 0.4 : 0.75), height * 0.45, 400) / 512;
        const logoY = height * (isLandscape ? 0.35 : 0.4);

        const logo = this.add.image(width / 2, logoY, 'logo');
        logo.setOrigin(0.5, 0.5);
        logo.setScale(logoScale);

        // Logo Floating Animation
        this.tweens.add({
            targets: logo,
            y: logoY - 15,
            duration: 2500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Logo Scale Animation (Pulse)
        this.tweens.add({
            targets: logo,
            scale: logoScale * 1.05,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // 4. Credits: Premium typography
        const creditSize = Math.max(Math.min(width * 0.04, 20), 14);
        const credits = this.add.text(width / 2, height * 0.85, 'Made by Surya Brothers', {
            fontFamily: 'Inter',
            fontSize: `${creditSize}px`,
            fontWeight: 'bold',
            color: '#FFFFFF',
            align: 'center'
        });
        credits.setOrigin(0.5, 0.5);
        credits.setAlpha(0);

        this.tweens.add({
            targets: credits,
            alpha: 1,
            y: height * (isLandscape ? 0.72 : 0.78),
            duration: 1200,
            ease: 'Power2.out',
            delay: 800
        });

        // 5. Slogan: Vibrant and engaging
        const sloganSize = Math.max(Math.min(width * 0.07, 38), 22);
        const slogan = this.add.text(width / 2, height * (isLandscape ? 0.88 : 0.86), 'Play Smart. Grow Smart.', {
            fontFamily: 'Outfit',
            fontSize: `${sloganSize}px`,
            fontWeight: '900',
            color: '#FFD700',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: true,
                fill: true
            }
        });
        slogan.setOrigin(0.5, 0.5);
        slogan.setAlpha(0);
        slogan.setScale(0.8);

        this.tweens.add({
            targets: slogan,
            alpha: 1,
            scale: 1,
            duration: 1500,
            ease: 'Back.easeOut',
            delay: 1800
        });

        // 6. Transition to HomeScene
        this.time.delayedCall(3800, () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('HomeScene');
            });
        });
    }
}
