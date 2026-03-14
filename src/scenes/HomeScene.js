import Phaser from 'phaser';
import GameState from '../utils/GameState.js';
import { App } from '@capacitor/app';

export default class HomeScene extends Phaser.Scene {
    constructor() { super('HomeScene'); }

    create() {

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const isPortrait = height > width;

        // Setup Background Music
        const setupMusic = () => {
            if (this.cache.audio.exists('bgm')) {
                let bgm = this.sound.get('bgm');
                if (!bgm) {
                    bgm = this.sound.add('bgm', { loop: true, volume: 1.0 });
                }
                
                if (GameState.isMusicEnabled() && !bgm.isPlaying) {
                    bgm.play();
                }
            }
        };

        // Try playing immediately
        setupMusic();

        // One-time interaction listener to handle browser autoplay restrictions
        const startAudioOnInteraction = () => {
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
            setupMusic();
            this.input.off('pointerdown', startAudioOnInteraction);
        };
        this.input.on('pointerdown', startAudioOnInteraction);

        const bg = this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);
        this.tweens.add({
            targets: bg,
            scale: { from: bg.scaleX, to: bg.scaleX * 1.05 },
            duration: 8000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

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

        // Exit Button
        this.createExitButton(width, height, pad);
    }

    createExitButton(width, height, pad) {
        const btnW = Math.round(Math.min(width * 0.18, 110));
        const btnH = Math.round(Math.min(height * 0.08, 44));
        const bx = btnW / 2 + pad;
        const by = btnH / 2 + pad;

        this.add.rectangle(bx + 3, by + 3, btnW, btnH, 0x000000, 0.35);
        const btnBg = this.add.rectangle(bx, by, btnW, btnH, 0xe8350a, 1)
            .setStrokeStyle(2, 0xff7755).setInteractive({ useHandCursor: true });
        this.add.rectangle(bx, by - btnH * 0.18, btnW - 4, btnH * 0.35, 0xffffff, 0.15);

        const iconFontSz = Math.round(Math.min(height * 0.035, 18));
        this.add.text(bx - btnW * 0.28, by, '🚪', {
            font: `bold ${iconFontSz}px Arial`, fill: '#fff'
        }).setOrigin(0.5);
        this.add.text(bx + btnW * 0.1, by, 'Exit', {
            font: `bold ${iconFontSz}px Arial`, fill: '#fff', stroke: '#a02000', strokeThickness: 2
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0xff4422, 1); btnBg.setStrokeStyle(3, 0xffdd00); });
        btnBg.on('pointerout', () => { btnBg.setFillStyle(0xe8350a, 1); btnBg.setStrokeStyle(2, 0xff7755); });
        
        btnBg.on('pointerdown', () => {
            if (window.confirm('Are you sure you want to exit?')) {
                if (App && typeof App.exitApp === 'function') {
                    App.exitApp();
                } else if (navigator && navigator.app && typeof navigator.app.exitApp === 'function') {
                    navigator.app.exitApp();
                } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                    window.Capacitor.Plugins.App.exitApp();
                } else {
                    window.close();
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
