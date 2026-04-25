import Phaser from 'phaser';
import GameState from '../utils/GameState.js';

export default class CelebrationScene extends Phaser.Scene {
    constructor() { super('CelebrationScene'); }

    init(data) {
        this.gameId = data.gameId || 'pattern';
        this.sceneName = data.sceneName || 'PatternScene';
    }

    create() {
        const { width, height } = this.cameras.main;

        // ── Smooth Colorful Gradient Background ──
        this.drawGradientBackground(width, height);

        // ── Floating Bubbles Background ──
        this.createFloatingBubbles(width, height);

        // ── Confetti Particle System ──
        this.createConfetti(width, height);

        // ── Cute Animal Character (Center) ──
        this.createDancingAnimal(width, height);

        // ── Text (Top Center) ──
        this.createCelebrationText(width, height);

        // ── Buttons (Bottom Center) ──
        this.createButtons(width, height);

        // Play celebration sound
        this.sound.play('correct');
    }

    drawGradientBackground(width, height) {
        const g = this.add.graphics();

        // Multi-layer gradient: purple → pink → orange → yellow
        const colors = [
            { y: 0, color: 0x6a11cb },
            { y: height * 0.25, color: 0xfc5c7d },
            { y: height * 0.5, color: 0xff9966 },
            { y: height * 0.75, color: 0xffd700 },
            { y: height, color: 0x43e97b }
        ];

        for (let i = 0; i < colors.length - 1; i++) {
            const steps = 30;
            const segmentH = (colors[i + 1].y - colors[i].y) / steps;
            for (let s = 0; s < steps; s++) {
                const t = s / steps;
                const r1 = (colors[i].color >> 16) & 0xff;
                const g1 = (colors[i].color >> 8) & 0xff;
                const b1 = colors[i].color & 0xff;
                const r2 = (colors[i + 1].color >> 16) & 0xff;
                const g2 = (colors[i + 1].color >> 8) & 0xff;
                const b2 = colors[i + 1].color & 0xff;

                const r = Math.round(r1 + (r2 - r1) * t);
                const gv = Math.round(g1 + (g2 - g1) * t);
                const b = Math.round(b1 + (b2 - b1) * t);

                const color = (r << 16) | (gv << 8) | b;
                g.fillStyle(color, 1);
                g.fillRect(0, colors[i].y + s * segmentH, width, segmentH + 1);
            }
        }
        g.setDepth(0);

        // Subtle pulsing overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.05).setDepth(1);
        this.tweens.add({
            targets: overlay,
            alpha: { from: 0.02, to: 0.08 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createFloatingBubbles(width, height) {
        const bubbleColors = [0xffffff, 0xffeb3b, 0xff80ab, 0x80d8ff, 0xb9f6ca];
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(8, 30);
            const color = Phaser.Utils.Array.GetRandom(bubbleColors);

            const bubble = this.add.circle(x, y, size, color, 0.15).setDepth(1);
            this.tweens.add({
                targets: bubble,
                y: bubble.y - Phaser.Math.Between(40, 120),
                x: bubble.x + Phaser.Math.Between(-30, 30),
                alpha: { from: 0.15, to: 0.3 },
                scale: { from: 1, to: 1.3 },
                duration: Phaser.Math.Between(3000, 6000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 200
            });
        }
    }

    createConfetti(width, height) {
        // Main confetti burst from top
        const emitter1 = this.add.particles(width / 2, -20, 'coin', {
            angle: { min: 70, max: 110 },
            speed: { min: 100, max: 300 },
            gravityY: 150,
            lifespan: 4000,
            scale: { start: 0.08, end: 0.02 },
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff9900, 0xff69b4],
            blendMode: 'NORMAL',
            frequency: 200,
            quantity: 2
        });
        emitter1.setDepth(15);

        // Side confetti bursts
        const emitter2 = this.add.particles(0, height * 0.3, 'coin', {
            angle: { min: -30, max: 30 },
            speed: { min: 150, max: 350 },
            gravityY: 200,
            lifespan: 3500,
            scale: { start: 0.06, end: 0.01 },
            tint: [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xee6ff8],
            blendMode: 'NORMAL',
            frequency: 400,
            quantity: 1
        });
        emitter2.setDepth(15);

        const emitter3 = this.add.particles(width, height * 0.3, 'coin', {
            angle: { min: 150, max: 210 },
            speed: { min: 150, max: 350 },
            gravityY: 200,
            lifespan: 3500,
            scale: { start: 0.06, end: 0.01 },
            tint: [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xee6ff8],
            blendMode: 'NORMAL',
            frequency: 400,
            quantity: 1
        });
        emitter3.setDepth(15);
    }

    createDancingAnimal(width, height) {
        const animalY = height * 0.42;
        const animalSize = Math.round(Math.min(width * 0.22, height * 0.14, 100));

        // Glow ring behind animal
        const glowRing = this.add.circle(width / 2, animalY, animalSize * 1.2, 0xffffff, 0.2).setDepth(4);
        this.tweens.add({
            targets: glowRing,
            scale: { from: 0.8, to: 1.3 },
            alpha: { from: 0.3, to: 0.1 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Inner glow
        const innerGlow = this.add.circle(width / 2, animalY, animalSize * 0.9, 0xffeb3b, 0.15).setDepth(4);
        this.tweens.add({
            targets: innerGlow,
            scale: { from: 1, to: 1.15 },
            alpha: { from: 0.15, to: 0.25 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // The cute animal (panda emoji)
        const animal = this.add.text(width / 2, animalY, '🐼', {
            font: `${animalSize}px Arial`
        }).setOrigin(0.5).setDepth(5);

        // Dance animation: bounce up and down + wiggle rotation
        this.tweens.add({
            targets: animal,
            y: animalY - 25,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: animal,
            angle: { from: -12, to: 12 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Scale pulse
        this.tweens.add({
            targets: animal,
            scaleX: { from: 1, to: 1.1 },
            scaleY: { from: 1, to: 0.92 },
            duration: 350,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 100
        });

        // Sparkle stars around the animal
        const sparkles = ['✨', '⭐', '🌟', '💫'];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = animalSize * 1.5;
            const sx = width / 2 + Math.cos(angle) * radius;
            const sy = animalY + Math.sin(angle) * radius;
            const sparkleSize = Math.round(animalSize * 0.3);

            const sparkle = this.add.text(sx, sy, Phaser.Utils.Array.GetRandom(sparkles), {
                font: `${sparkleSize}px Arial`
            }).setOrigin(0.5).setDepth(6).setAlpha(0);

            this.tweens.add({
                targets: sparkle,
                alpha: { from: 0, to: 1 },
                scale: { from: 0.3, to: 1.2 },
                y: sy - 20,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                delay: i * 300,
                ease: 'Sine.easeInOut'
            });
        }

        // Entry animation: animal scales from 0
        animal.setScale(0);
        this.tweens.add({
            targets: animal,
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            ease: 'Back.easeOut'
        });
    }

    createCelebrationText(width, height) {
        const titleSize = Math.round(Math.min(width * 0.07, height * 0.055, 36));
        const subtitleSize = Math.round(Math.min(width * 0.065, height * 0.045, 30));

        // Main title with emoji
        const title = this.add.text(width / 2, height * 0.1, '🎉 You completed this game!', {
            font: `bold ${titleSize}px Arial`,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

        // Subtitle
        const subtitle = this.add.text(width / 2, height * 0.18, 'Great job Smart Kid! 🌟', {
            font: `bold ${subtitleSize}px Arial`,
            fill: '#ffeb3b',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

        // Animate text in
        this.tweens.add({
            targets: title,
            alpha: 1,
            y: height * 0.12,
            duration: 800,
            ease: 'Back.easeOut',
            delay: 300
        });

        this.tweens.add({
            targets: subtitle,
            alpha: 1,
            y: height * 0.2,
            duration: 800,
            ease: 'Back.easeOut',
            delay: 600
        });

        // Gentle floating animation for text
        this.tweens.add({
            targets: title,
            y: title.y - 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 1200
        });

        this.tweens.add({
            targets: subtitle,
            y: subtitle.y - 3,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 1500
        });
    }

    createButtons(width, height) {
        const btnW = Math.min(width * 0.65, 300);
        const btnH = Math.min(height * 0.09, 55);
        const smallBtnW = Math.min(width * 0.45, 200);
        const smallBtnH = Math.min(height * 0.07, 42);
        const btnFont = Math.round(Math.min(btnH * 0.42, 22));
        const smallBtnFont = Math.round(Math.min(smallBtnH * 0.42, 18));
        const cornerRadius = Math.round(btnH * 0.35);
        const smallCornerRadius = Math.round(smallBtnH * 0.35);

        const nextGameY = height * 0.72;
        const exitY = height * 0.84;
        const replayY = height * 0.93;

        // Next Game mapping
        const nextGameMap = {
            'PatternScene': 'MoneyScene',
            'MoneyScene': 'TimeScene',
            'TimeScene': 'ChoiceScene',
            'ChoiceScene': 'PatternScene'
        };
        const nextScene = nextGameMap[this.sceneName] || 'HomeScene';

        // ── Next Game Button (Big Green) ──
        this.createRoundedButton(
            width / 2, nextGameY, btnW, btnH, cornerRadius, btnFont,
            '▶ Next Game', 0x2ecc71, 0x27ae60, 0x1e8449,
            () => this.scene.start(nextScene),
            300
        );

        // ── Exit Game Button (Red) ──
        this.createRoundedButton(
            width / 2, exitY, btnW, btnH, cornerRadius, btnFont,
            '🏠 Exit Game', 0xe74c3c, 0xc0392b, 0xa93226,
            () => this.scene.start('HomeScene'),
            500
        );

        // ── Replay Button (Small, Optional) ──
        this.createRoundedButton(
            width / 2, replayY, smallBtnW, smallBtnH, smallCornerRadius, smallBtnFont,
            '🔄 Replay', 0x3498db, 0x2980b9, 0x2471a3,
            () => {
                GameState.setLevel(this.gameId, 1);
                GameState.setScore(this.gameId, 0);
                this.scene.start(this.sceneName);
            },
            700
        );
    }

    createRoundedButton(x, y, w, h, radius, fontSize, text, color, hoverColor, darkColor, callback, delay) {
        const container = this.add.container(x, y).setDepth(20);

        // Shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(-w / 2 + 4, -h / 2 + 4, w, h, radius);

        // Button background
        const btnGraphics = this.add.graphics();
        btnGraphics.fillStyle(color, 1);
        btnGraphics.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
        btnGraphics.lineStyle(3, 0xffffff, 0.5);
        btnGraphics.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);

        // Shine effect
        const shineGraphics = this.add.graphics();
        shineGraphics.fillStyle(0xffffff, 0.15);
        shineGraphics.fillRoundedRect(-w / 2 + 4, -h / 2 + 2, w - 8, h * 0.4, { tl: radius, tr: radius, bl: 0, br: 0 });

        // Label text
        const label = this.add.text(0, 0, text, {
            font: `bold ${fontSize}px Arial`,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Interactive zone
        const hitZone = this.add.rectangle(0, 0, w, h, 0xffffff, 0)
            .setInteractive({ useHandCursor: true });

        container.add([shadow, btnGraphics, shineGraphics, label, hitZone]);

        // Hover effects
        hitZone.on('pointerover', () => {
            btnGraphics.clear();
            btnGraphics.fillStyle(hoverColor, 1);
            btnGraphics.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
            btnGraphics.lineStyle(3, 0xffff00, 0.8);
            btnGraphics.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
            label.setScale(1.05);
        });

        hitZone.on('pointerout', () => {
            btnGraphics.clear();
            btnGraphics.fillStyle(color, 1);
            btnGraphics.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
            btnGraphics.lineStyle(3, 0xffffff, 0.5);
            btnGraphics.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
            label.setScale(1);
        });

        hitZone.on('pointerdown', () => {
            btnGraphics.clear();
            btnGraphics.fillStyle(darkColor, 1);
            btnGraphics.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w, h, radius);
            this.time.delayedCall(150, callback);
        });

        // Entry animation
        container.setAlpha(0);
        container.setScale(0.8);

        this.tweens.add({
            targets: container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.easeOut',
            delay: delay
        });
    }
}
