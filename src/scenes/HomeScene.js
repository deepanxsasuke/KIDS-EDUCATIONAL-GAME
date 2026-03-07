import Phaser from 'phaser';
import GameState from '../utils/GameState.js';

export default class HomeScene extends Phaser.Scene {
    constructor() { super('HomeScene'); }

    create() {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const isPortrait = height > width;

        // Setup Background Music
        if (this.cache.audio.exists('bgm')) {
            if (!this.sound.get('bgm')) {
                const bgm = this.sound.add('bgm', { loop: true, volume: 1.0 });
                if (GameState.isMusicEnabled()) {
                    bgm.play();
                }
            } else {
                const bgm = this.sound.get('bgm');
                if (GameState.isMusicEnabled() && !bgm.isPlaying) {
                    bgm.play();
                }
            }
        }

        this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

        // Title: proportional font + proportional Y
        const titleFontSize = Math.round(Math.min(width * 0.07, height * 0.12, 64));
        this.add.text(width / 2, height * 0.12, 'SmartKid Games', {
            font: `bold ${titleFontSize}px Arial`, fill: '#fff', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        // Mascot: always bottom-right, sized proportionally
        const mascotScale = Math.min(width, height) * 0.0007;
        const mascot = this.add.image(width - Math.min(width * 0.1, 80), height - Math.min(height * 0.15, 80), 'mascot').setScale(mascotScale);
        this.tweens.add({
            targets: mascot, y: mascot.y - 15,
            duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Button dimensions proportional to screen
        const btnW = Math.min(width * 0.35, 240);
        const btnH = Math.min(height * 0.13, 65);
        const btnFont = `bold ${Math.round(Math.min(btnW * 0.1, 22))}px Arial`;

        if (isPortrait) {
            // Portrait: stack buttons vertically in center
            const startY = height * 0.38;
            const gap = height * 0.13;
            this.createButton(width / 2, startY, btnW, btnH, btnFont, 'Pattern Game', 'PatternScene', 0xff0066);
            this.createButton(width / 2, startY + gap, btnW, btnH, btnFont, 'Money Game', 'MoneyScene', 0x00cc00);
            this.createButton(width / 2, startY + gap * 2, btnW, btnH, btnFont, 'Time Game', 'TimeScene', 0x0066ff);
            this.createButton(width / 2, startY + gap * 3, btnW, btnH, btnFont, 'Choice Game', 'ChoiceScene', 0xff9900);
        } else {
            // Landscape: 2x2 grid of buttons
            const cx = width / 2;
            const gapX = btnW * 0.7;
            const row1Y = height * 0.4;
            const row2Y = height * 0.62;
            this.createButton(cx - gapX, row1Y, btnW, btnH, btnFont, 'Pattern Game', 'PatternScene', 0xff0066);
            this.createButton(cx + gapX, row1Y, btnW, btnH, btnFont, 'Money Game', 'MoneyScene', 0x00cc00);
            this.createButton(cx - gapX, row2Y, btnW, btnH, btnFont, 'Time Game', 'TimeScene', 0x0066ff);
            this.createButton(cx + gapX, row2Y, btnW, btnH, btnFont, 'Choice Game', 'ChoiceScene', 0xff9900);
        }

        // Music Toggle Button
        const pad = Math.min(width, height) * 0.02;
        const iconSz = Math.round(Math.min(width, height) * 0.04, 24);
        const musicBtn = this.add.text(width - pad, pad, GameState.isMusicEnabled() ? '🔊 Music' : '🔈 Muted', {
            font: `bold ${iconSz}px Arial`, fill: '#fff', stroke: '#000', strokeThickness: 4
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        musicBtn.on('pointerdown', () => {
            const isEnabled = GameState.toggleMusic();
            musicBtn.setText(isEnabled ? '🔊 Music' : '🔈 Muted');
            const bgm = this.sound.get('bgm');
            if (bgm) {
                if (isEnabled) {
                    if (!bgm.isPlaying) bgm.play();
                } else {
                    if (bgm.isPlaying) bgm.pause();
                }
            }
        });
    }

    createButton(x, y, w, h, font, text, targetScene, color) {
        const button = this.add.rectangle(x, y, w, h, color, 0.9)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(4, 0xffffff);

        const label = this.add.text(x, y, text, { font: font, fill: '#fff' }).setOrigin(0.5);

        button.on('pointerdown', () => {
            this.scene.start(targetScene);
        });

        button.on('pointerover', () => button.setStrokeStyle(6, 0xffff00));
        button.on('pointerout', () => {
            button.setStrokeStyle(4, 0xffffff);
            button.setScale(1);
            label.setScale(1);
        });
    }
}
