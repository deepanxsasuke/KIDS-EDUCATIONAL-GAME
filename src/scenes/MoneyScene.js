import Phaser from 'phaser';
import GameState from '../utils/GameState.js';

export default class MoneyScene extends Phaser.Scene {
    constructor() { super('MoneyScene'); }

    create() {
        this.hasEverInteracted = false; // Track if user has ever dragged a coin
        const { width, height } = this.cameras.main;
        const bg = this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height).setDepth(0);
        this.tweens.add({
            targets: bg,
            scale: { from: bg.scaleX, to: bg.scaleX * 1.05 },
            duration: 8000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        



        // Explicitly clear any lingering input events just in case
        this.input.off('dragstart');
        this.input.off('drag');
        this.input.off('dragenter');
        this.input.off('dragleave');
        this.input.off('drop');
        this.input.off('dragend');

        this.level = GameState.getLevel('money');
        this.score = GameState.getScore('money');
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
            font: '32px Arial', fill: '#fff', stroke: '#000', strokeThickness: 5
        }).setDepth(10);
        this.levelText = this.add.text(20, 60, `Level: ${this.level}`, {
            font: '32px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 5
        }).setDepth(10);

        this.createBackButton(width, height);

        // Proportional sizing for all devices
        const mascotSz = Math.min(width, height) * 0.0007;
        this.mascot = this.add.image(
            width - Math.min(width * 0.08, 70),
            height - Math.min(height * 0.15, 70),
            'mascot'
        ).setScale(mascotSz).setDepth(5);

        const instrFont = Math.round(Math.min(height * 0.06, 32));
        this.add.text(width / 2, height * 0.1, 'Solve the math problem!', {
            font: `${instrFont}px Arial`, fill: '#fff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);

        const qFont = Math.round(Math.min(height * 0.1, 52));
        this.questionText = this.add.text(width / 2, height * 0.25, '', {
            font: `${qFont}px Arial`, fill: '#ffeb3b', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(10);

        // Piggy Bank (Target)
        const bankFont = Math.round(Math.min(height * 0.11, 60));
        this.piggyBank = this.add.text(width / 2, height * 0.52, '🐷 Bank', {
            font: `${bankFont}px Arial`, fill: '#fff', stroke: '#000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(3);

        // Drop zone
        const zoneW = Math.min(width * 0.45, 320);
        const zoneH = Math.min(height * 0.22, 140);
        this.piggyZone = this.add.rectangle(width / 2, height * 0.52, zoneW, zoneH, 0xffffff, 0.3)
            .setStrokeStyle(4, 0xffff00)
            .setInteractive({ dropZone: true })
            .setDepth(2);

        this.coinsGroup = this.add.group();
        this.generateProblem();

        // ── Drag Events ───────────────────────────────────────────────────

        this.input.on('dragstart', (pointer, gameObject) => {
            this.hasEverInteracted = true; // Permanently stop hints from appearing again

            // Stop all hint animations once user starts interacting
            if (this.hintTweens) {
                this.hintTweens.forEach(t => t.stop());
                this.hintTweens = null;
            }
            if (this.handHintTween) {
                this.handHintTween.stop();
                this.handHintTween = null;
                if (this.handHint) this.handHint.destroy();
            }

            this.children.bringToTop(gameObject);
            const img = gameObject.list[0];
            if (img && img.setTint) img.setTint(0xaaaaaa);
            // Scale up slightly on pick
            this.tweens.add({
                targets: gameObject, scale: 1.15, duration: 100, ease: 'Back.easeOut'
            });
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragenter', (pointer, gameObject, dropZone) => {
            this.piggyZone.setStrokeStyle(6, 0x00ff00);
            this.piggyZone.setFillStyle(0xffffff, 0.5);
        });

        this.input.on('dragleave', (pointer, gameObject, dropZone) => {
            this.piggyZone.setStrokeStyle(4, 0xffff00);
            this.piggyZone.setFillStyle(0xffffff, 0.3);
        });

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            if (gameObject.answerValue === this.correctAnswer) {
                // Success
                this.sound.play('correct');

                const result = GameState.addScoreAndCheckLevelUp('money', 10);
                this.score = result.newScore;
                this.scoreText.setText(`Score: ${this.score}`);

                this.piggyZone.setStrokeStyle(4, 0xffff00);
                this.piggyZone.setFillStyle(0xffffff, 0.3);

                this.playConfetti();
                this.coinsGroup.clear(true, true);

                if (result.leveledUp) {
                    this.level = result.newLevel;
                    this.levelText.setText(`Level: ${this.level}`);
                    this.celebrateLevelUp(this.level);
                } else {
                    this.animateMascotHappy();
                    this.time.delayedCall(1000, () => this.generateProblem());
                }
            } else {
                // Wrong answer
                const img = gameObject.list[0];
                if (img && img.clearTint) img.clearTint();

                this.tweens.add({
                    targets: gameObject,
                    x: gameObject.input.dragStartX,
                    y: gameObject.input.dragStartY,
                    scale: 1,
                    duration: 300,
                    ease: 'Back.easeOut'
                });

                this.sound.play('wrong');
                this.animateMascotSad();
            }
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            if (!dropped) {
                const img = gameObject.list[0];
                if (img && img.clearTint) img.clearTint();

                this.tweens.add({
                    targets: gameObject,
                    x: gameObject.input.dragStartX,
                    y: gameObject.input.dragStartY,
                    scale: 1,
                    duration: 300,
                    ease: 'Back.easeOut'
                });

                this.sound.play('wrong');
                this.animateMascotSad();
            }
        });
    }



    generateProblem() {
        // Guarantee a fresh group on scene restart
        if (this.coinsGroup) {
            this.coinsGroup.clear(true, true);
        } else {
            this.coinsGroup = this.add.group();
        }

        let minNum, maxNum, isSubtract;
        switch (this.level) {
            case 1: minNum = 1; maxNum = 10; isSubtract = false; break;
            case 2: minNum = 11; maxNum = 20; isSubtract = false; break;
            case 3: minNum = 21; maxNum = 40; isSubtract = false; break;
            case 4: minNum = 11; maxNum = 30; isSubtract = true; break;
            case 5: minNum = 31; maxNum = 50; isSubtract = true; break;
            case 6: minNum = 41; maxNum = 99; isSubtract = false; break;
            case 7: minNum = 51; maxNum = 99; isSubtract = true; break;
            case 8: minNum = 100; maxNum = 200; isSubtract = false; break;
            case 9: minNum = 100; maxNum = 200; isSubtract = true; break;
            default: minNum = 200; maxNum = 500; isSubtract = Phaser.Math.Between(0, 1) === 1; break;
        }

        const num1 = Phaser.Math.Between(minNum, maxNum);
        const num2 = Phaser.Math.Between(minNum, maxNum);

        if (isSubtract) {
            const max = Math.max(num1, num2);
            const min = Math.min(num1, num2);
            this.correctAnswer = max - min;
            this.questionText.setText(`₹${max} - ₹${min} = ?`);
        } else {
            this.correctAnswer = num1 + num2;
            this.questionText.setText(`₹${num1} + ₹${num2} = ?`);
        }

        let answers = [
            this.correctAnswer,
            this.correctAnswer + Phaser.Math.Between(1, 10),
            this.correctAnswer - Phaser.Math.Between(1, 10)
        ];
        if (answers[1] === answers[0]) answers[1] += 2;
        if (answers[2] === answers[0] || answers[2] === answers[1]) answers[2] -= 2;
        Phaser.Utils.Array.Shuffle(answers);

        const { width, height } = this.cameras.main;

        // ── Centered coin row — measured from actual Phaser displayWidth ──
        const coinScale = Math.min(height * 0.00045, width * 0.00028, 0.24);
        const coinFontSz = Math.round(Math.min(height * 0.065, 36));

        // Measure real coin size using a temp off-screen image
        const _probe = this.add.image(-9999, -9999, 'coin').setScale(coinScale);
        const realCoinW = _probe.displayWidth;
        _probe.destroy();

        // Gap = 45% of coin width; ample breathing room between coins
        const gap = realCoinW * 0.45;
        const totalRowW = realCoinW * 3 + gap * 2;
        const rowStartX = (width - totalRowW) / 2 + realCoinW / 2;

        // Raise coins higher so kids have plenty of upward drag room to bank
        const rowY = height * 0.78;

        this.hintTweens = []; // Track hint tweens to stop them later

        for (let i = 0; i < 3; i++) {
            const x = rowStartX + i * (realCoinW + gap);
            const y = rowY;

            const coinImage = this.add.image(0, 0, 'coin').setScale(coinScale);
            // Slightly lower text position for better balance
            const coinText = this.add.text(0, realCoinW * 0.25, `₹${answers[i]}`, {
                font: `bold ${coinFontSz}px Arial`,
                fill: '#111',
                stroke: '#fff',
                strokeThickness: 4
            }).setOrigin(0.5);

            const coinContainer = this.add.container(x, y, [coinImage, coinText]);
            coinContainer.setSize(realCoinW, realCoinW);
            coinContainer.setInteractive({ draggable: true });
            coinContainer.setDepth(4);

            coinContainer.answerValue = answers[i];
            coinContainer.input.dragStartX = x;
            coinContainer.input.dragStartY = y;

            // ── Requirement 6: Drag-Up Hint Animation ──
            // Staggered idle float tween — hints at dragging upward 
            // (keeping the subtle float on the coins themselves)
            const floatTween = this.tweens.add({
                targets: coinContainer,
                y: y - 12,
                duration: 1200 + i * 100,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: i * 300
            });
            this.hintTweens.push(floatTween);

            this.coinsGroup.add(coinContainer);
        }

        // ── Explicit Hand "Drag Up" Hint (Sequential across all coins) ──
        if (!this.hasEverInteracted) {
            const startY = rowY + 20;
            const endY = height * 0.55; // Up towards the piggy bank
            const coinPositions = [
                rowStartX,
                rowStartX + realCoinW + gap,
                rowStartX + (realCoinW + gap) * 2
            ];

            this.handHint = this.add.text(coinPositions[0], startY, '👆🏻', {
                font: `${Math.round(height * 0.12)}px Arial`
            }).setOrigin(0.5).setDepth(20).setAlpha(1);

            // Play sequential hint animation across coins 0, 1, 2
            this.playSequentialHint = (index) => {
                if (this.hasEverInteracted || !this.handHint || !this.handHint.active) return;

                this.handHint.x = coinPositions[index];
                this.handHint.y = startY;
                this.handHint.setAlpha(0);

                this.handHintTween = this.tweens.add({
                    targets: this.handHint,
                    x: width / 2,
                    y: height * 0.52,                    // Target the piggy bank
                    alpha: { start: 1, from: 1, to: 1 }, // Keep fully opaque
                    duration: 1500,                      // Time per drag
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        if (!this.hasEverInteracted) {
                            // Wait 500ms then show hint on next coin
                            this.time.delayedCall(500, () => {
                                this.playSequentialHint((index + 1) % 3);
                            });
                        }
                    }
                });
            };

            // Start the hint sequence
            this.playSequentialHint(0);
        }


    }

    playConfetti() {
        const emitter = this.add.particles(this.cameras.main.width / 2, 280, 'coin', {
            angle: { min: 0, max: 360 },
            speed: { min: 200, max: 400 },
            gravityY: 300,
            lifespan: 2000,
            scale: { start: 0.1, end: 0 },
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
            blendMode: 'ADD'
        });
        emitter.setDepth(20);
        this.time.delayedCall(1000, () => emitter.stop());
    }

    celebrateLevelUp(newLevel) {
        this.sound.play('correct');

        const { width, height } = this.cameras.main;
        const levelUpText = this.add.text(width / 2, height / 2, `Level ${newLevel}\nUnlocked!`, {
            font: 'bold 80px Arial', fill: '#ffeb3b', stroke: '#000',
            strokeThickness: 12, align: 'center'
        }).setOrigin(0.5).setAlpha(0).setDepth(25);

        this.tweens.add({
            targets: levelUpText,
            alpha: 1,
            scale: { from: 0.5, to: 1.2 },
            duration: 500,
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                levelUpText.destroy();
                this.generateProblem();
            }
        });

        this.tweens.add({
            targets: this.mascot,
            y: this.mascot.y - 80,
            angle: 15,
            duration: 200,
            yoyo: true,
            repeat: 6,
            onYoyo: () => { this.mascot.angle = this.mascot.angle > 0 ? -15 : 15; },
            onComplete: () => { this.mascot.angle = 0; }
        });
    }

    animateMascotHappy() {
        this.tweens.add({
            targets: this.mascot, y: this.mascot.y - 50,
            duration: 150, yoyo: true, repeat: 2
        });
    }

    animateMascotSad() {
        this.tweens.add({
            targets: this.mascot, x: this.mascot.x - 20,
            duration: 80, yoyo: true, repeat: 3
        });
    }

    createBackButton(width, height) {
        const btnW = Math.round(Math.min(width * 0.18, 110));
        const btnH = Math.round(Math.min(height * 0.08, 44));
        const bx = width - btnW / 2 - 12;
        const by = btnH / 2 + 10;

        this.add.rectangle(bx + 3, by + 3, btnW, btnH, 0x000000, 0.35).setDepth(14);
        const btnBg = this.add.rectangle(bx, by, btnW, btnH, 0xe8350a, 1)
            .setStrokeStyle(2, 0xff7755).setDepth(15).setInteractive({ useHandCursor: true });
        this.add.rectangle(bx, by - btnH * 0.18, btnW - 4, btnH * 0.35, 0xffffff, 0.15).setDepth(16);

        const iconFontSz = Math.round(Math.min(height * 0.035, 18));
        const icon = this.add.text(bx - btnW * 0.28, by, '◀', {
            font: `bold ${iconFontSz}px Arial`, fill: '#fff'
        }).setOrigin(0.5).setDepth(17);
        this.add.text(bx + btnW * 0.1, by, 'Back', {
            font: `bold ${iconFontSz}px Arial`, fill: '#fff', stroke: '#a02000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(17);

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0xff4422, 1); btnBg.setStrokeStyle(3, 0xffdd00); });
        btnBg.on('pointerout', () => { btnBg.setFillStyle(0xe8350a, 1); btnBg.setStrokeStyle(2, 0xff7755); });
        btnBg.on('pointerdown', () => {
            // Instant transition to avoid any timeline/tween freezes on mobile devices
            this.scene.start('HomeScene');
        });
    }
}
