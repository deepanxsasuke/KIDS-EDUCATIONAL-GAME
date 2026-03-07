import Phaser from 'phaser';
import GameState from '../utils/GameState.js';

export default class TimeScene extends Phaser.Scene {
    constructor() { super('TimeScene'); }

    create() {
        const { width, height } = this.cameras.main;
        this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

        this.level = GameState.getLevel('time');
        this.score = GameState.getScore('time');
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, { font: '32px Arial', fill: '#fff', stroke: '#000', strokeThickness: 5 });
        this.levelText = this.add.text(20, 60, `Level: ${this.level}`, { font: '32px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 5 });

        this.createBackButton(width, height);

        // Proportional sizing for all devices
        const mascotSz = Math.min(width, height) * 0.0007;
        this.mascot = this.add.image(width - Math.min(width * 0.08, 70), height - Math.min(height * 0.15, 70), 'mascot').setScale(mascotSz);

        const titleFontSz = Math.round(Math.min(height * 0.07, 36));
        this.add.text(width / 2, height * 0.08, 'What time is it?', {
            font: `${titleFontSz}px Arial`, fill: '#fff', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5);

        // Clock: proportional radius
        const clockRadius = Math.round(Math.min(height * 0.28, width * 0.18, 120));
        const clockX = width / 2;
        const clockY = height * 0.42;

        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.lineStyle(6, 0x000000, 1);
        graphics.fillCircle(clockX, clockY, clockRadius);
        graphics.strokeCircle(clockX, clockY, clockRadius);

        // Add 1 to 12 markers
        for (let i = 1; i <= 12; i++) {
            const angle = Phaser.Math.DegToRad((i * 30) - 90);
            const textRadius = clockRadius * 0.78;
            const x = clockX + Math.cos(angle) * textRadius;
            const y = clockY + Math.sin(angle) * textRadius;
            const numFont = Math.round(clockRadius * 0.22);
            this.add.text(x, y, i.toString(), { font: `bold ${numFont}px Arial`, fill: '#000' }).setOrigin(0.5);
        }

        // Hands proportional to clock radius
        this.hourHand = this.add.rectangle(clockX, clockY, Math.round(clockRadius * 0.06), Math.round(clockRadius * 0.5), 0x000000).setOrigin(0.5, 1);
        this.minuteHand = this.add.rectangle(clockX, clockY, Math.round(clockRadius * 0.04), Math.round(clockRadius * 0.75), 0xff0000).setOrigin(0.5, 1);
        this.add.circle(clockX, clockY, Math.round(clockRadius * 0.07), 0x000000);

        // Option Buttons - evenly spaced across bottom
        this.optionButtons = [];
        const btnY = height * 0.88;
        const optionsSpacing = width / 3;
        const btnW = optionsSpacing * 0.75;
        const btnH = Math.min(height * 0.1, 55);
        const fontSz = Math.round(Math.min(btnW * 0.15, 22));

        for (let i = 0; i < 3; i++) {
            const btnX = optionsSpacing * 0.5 + (i * optionsSpacing);
            const btn = this.add.rectangle(btnX, btnY, btnW, btnH, 0x4B0082, 0.9)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(3, 0xffffff);
            const label = this.add.text(btnX, btnY, '12:00', { font: `bold ${fontSz}px Arial`, fill: '#fff' }).setOrigin(0.5);

            btn.on('pointerover', () => btn.setStrokeStyle(5, 0xffff00));
            btn.on('pointerout', () => btn.setStrokeStyle(3, 0xffffff));
            btn.on('pointerdown', () => this.checkAnswer(i));

            this.optionButtons.push({ rect: btn, text: label, value: 0 });
        }

        this.targetHour = 12;
        this.correctIndex = 0;
        this.startLevel();
    }

    startLevel() {
        // Generate random hour (1 to 12)
        this.targetHour = Phaser.Math.Between(1, 12);

        // Scale difficulty based on level strictly
        let possibleMinutes = [];
        switch (this.level) {
            case 1: possibleMinutes = [0]; break;         // O'clocks
            case 2: possibleMinutes = [30]; break;        // Half-hours
            case 3: possibleMinutes = [15, 45]; break;    // Quarter hours
            case 4: possibleMinutes = [10, 20, 40, 50]; break;  // 10 min increments
            case 5: possibleMinutes = [5, 25, 35, 55]; break;   // 5 min increments
            case 6: possibleMinutes = [0, 15, 30, 45]; break;   // 15 min mix
            case 7: possibleMinutes = [5, 10, 20, 25]; break;   // 5/10 min mix early half
            case 8: possibleMinutes = [35, 40, 50, 55]; break;  // 5/10 min mix late half
            case 9: possibleMinutes = [5, 15, 25, 35, 45, 55]; break; // 10 min offset mix
            default: possibleMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; break; // Full Mix
        }

        this.targetMinute = Phaser.Utils.Array.GetRandom(possibleMinutes);

        // Calculate hand angles
        // Minute hand travels 360 deg in 60 mins -> 6 deg per minute
        const angleMinute = this.targetMinute * 6;

        // Hour hand travels 360 deg in 12 hours -> 30 deg per hour
        // Plus an offset based on how far the minute hand has moved
        const hourOffset = (this.targetMinute / 60) * 30;
        const angleHour = (this.targetHour * 30) + hourOffset;

        // Animate hands
        this.tweens.add({
            targets: this.hourHand,
            angle: angleHour,
            duration: 800,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: this.minuteHand,
            angle: angleMinute,
            duration: 800,
            ease: 'Back.easeOut'
        });

        // Setup answers
        this.correctIndex = Phaser.Math.Between(0, 2);

        const correctTimeStr = `${this.targetHour}:${this.targetMinute.toString().padStart(2, '0')}`;

        // Generate wrong times
        let wrongList = [];
        let failsafe = 0;
        while (wrongList.length < 2 && failsafe < 50) {
            failsafe++;

            // Generate a random potential wrong time
            let wHour = Phaser.Math.Between(1, 12);
            let wMin = Phaser.Utils.Array.GetRandom(possibleMinutes);

            // Format string to ensure leading zeros for minutes
            let wTimeStr = `${wHour}:${wMin.toString().padStart(2, '0')}`;

            // Check if it's unique from correct time AND not already in wrongList
            if (wTimeStr !== correctTimeStr && !wrongList.includes(wTimeStr)) {
                wrongList.push(wTimeStr);
            }
        }

        let wrongIdx = 0;
        this.optionButtons.forEach((btn, i) => {
            btn.rect.setInteractive(); // enable if disabled
            if (i === this.correctIndex) {
                btn.text.setText(correctTimeStr);
            } else {
                btn.text.setText(wrongList[wrongIdx]);
                wrongIdx++;
            }
        });
    }

    checkAnswer(idx) {
        // Disable temporarily
        this.optionButtons.forEach(btn => btn.rect.disableInteractive());

        const btn = this.optionButtons[idx];

        if (idx === this.correctIndex) {
            this.sound.play('correct');

            // Update Score and Check Level
            const result = GameState.addScoreAndCheckLevelUp('time', 5);
            this.score = result.newScore;
            this.scoreText.setText(`Score: ${this.score}`);

            this.playConfetti();

            // Highlight correctly
            btn.rect.setFillStyle(0x00cc00, 1);

            if (result.leveledUp) {
                this.level = result.newLevel;
                this.levelText.setText(`Level: ${this.level}`);
                this.celebrateLevelUp(this.level);
            } else {
                this.animateMascotHappy();
                this.time.delayedCall(2000, () => {
                    btn.rect.setFillStyle(0x4B0082, 0.9);
                    this.startLevel();
                });
            }
        } else {
            this.sound.play('wrong');
            this.animateMascotSad();

            // Highlight incorrectly
            btn.rect.setFillStyle(0xcc0000, 1);

            this.time.delayedCall(1500, () => {
                btn.rect.setFillStyle(0x4B0082, 0.9);
                this.optionButtons.forEach(b => b.rect.setInteractive()); // re-enable
            });
        }
    }

    playConfetti() {
        const emitter = this.add.particles(this.cameras.main.width / 2, 100, 'coin', {
            angle: { min: 0, max: 360 },
            speed: { min: 200, max: 400 },
            gravityY: 300,
            lifespan: 2000,
            scale: { start: 0.1, end: 0 },
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
            blendMode: 'ADD'
        });

        this.time.delayedCall(1000, () => emitter.stop());
    }

    celebrateLevelUp(newLevel) {
        this.sound.play('correct');

        const { width, height } = this.cameras.main;
        const levelUpText = this.add.text(width / 2, height / 2, `Level ${newLevel}\nUnlocked!`, {
            font: 'bold 80px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 12, align: 'center'
        }).setOrigin(0.5).setAlpha(0);

        // Text animation
        this.tweens.add({
            targets: levelUpText,
            alpha: 1,
            scale: { from: 0.5, to: 1.2 },
            duration: 500,
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                levelUpText.destroy();
                this.optionButtons[this.correctIndex].rect.setFillStyle(0x4B0082, 0.9);
                this.startLevel();
            }
        });

        // Mascot dancing
        this.tweens.add({
            targets: this.mascot,
            y: this.mascot.y - 80,
            angle: 15,
            duration: 200,
            yoyo: true,
            repeat: 6,
            onYoyo: () => {
                this.mascot.angle = this.mascot.angle > 0 ? -15 : 15;
            },
            onComplete: () => {
                this.mascot.angle = 0;
            }
        });
    }

    animateMascotHappy() {
        this.tweens.add({
            targets: this.mascot,
            y: this.mascot.y - 50,
            duration: 150,
            yoyo: true,
            repeat: 2
        });
    }

    animateMascotSad() {
        this.tweens.add({
            targets: this.mascot,
            x: this.mascot.x - 20,
            duration: 80,
            yoyo: true,
            repeat: 3
        });
    }
    createBackButton(width, height) {
        const btnW = Math.round(Math.min(width * 0.18, 110));
        const btnH = Math.round(Math.min(height * 0.08, 44));
        const bx = width - btnW / 2 - 12;
        const by = btnH / 2 + 10;

        this.add.rectangle(bx + 3, by + 3, btnW, btnH, 0x000000, 0.35).setDepth(9);
        const btnBg = this.add.rectangle(bx, by, btnW, btnH, 0xe8350a, 1)
            .setStrokeStyle(2, 0xff7755).setDepth(10).setInteractive({ useHandCursor: true });
        this.add.rectangle(bx, by - btnH * 0.18, btnW - 4, btnH * 0.35, 0xffffff, 0.15).setDepth(11);

        const iconFontSz = Math.round(Math.min(height * 0.035, 18));
        const icon = this.add.text(bx - btnW * 0.28, by, '◀', {
            font: `bold ${iconFontSz}px Arial`, fill: '#fff'
        }).setOrigin(0.5).setDepth(12);
        this.add.text(bx + btnW * 0.1, by, 'Back', {
            font: `bold ${iconFontSz}px Arial`, fill: '#fff', stroke: '#a02000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(12);

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0xff4422, 1); btnBg.setStrokeStyle(3, 0xffdd00); });
        btnBg.on('pointerout', () => { btnBg.setFillStyle(0xe8350a, 1); btnBg.setStrokeStyle(2, 0xff7755); });
        btnBg.on('pointerdown', () => {
            this.scene.start('HomeScene');
        });
    }

}
