import Phaser from 'phaser';
import GameState from '../utils/GameState.js';

export default class PatternScene extends Phaser.Scene {
    constructor() { super('PatternScene'); }

    create() {
        const { width, height } = this.cameras.main;
        const bg = this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);
        this.tweens.add({
            targets: bg,
            scale: { from: bg.scaleX, to: bg.scaleX * 1.05 },
            duration: 8000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // UI
        this.level = GameState.getLevel('pattern');
        this.score = GameState.getScore('pattern');
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, { font: '32px Arial', fill: '#fff', stroke: '#000', strokeThickness: 5 });
        this.levelText = this.add.text(20, 60, `Level: ${this.level}`, { font: '32px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 5 });

        this.createBackButton(width, height);

        // Mascot - proportional size and position
        const mascotSz = Math.min(width, height) * 0.0007;
        this.mascot = this.add.image(width - Math.min(width * 0.08, 70), height - Math.min(height * 0.15, 70), 'mascot').setScale(mascotSz);

        const titleFontSz = Math.round(Math.min(height * 0.08, width * 0.05, 40));
        this.add.text(width / 2, height * 0.1, 'Complete the Pattern!', {
            font: `bold ${titleFontSz}px Arial`, fill: '#fff', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5);

        // Groups for cleanup
        this.patternGroup = this.add.group();
        this.optionsGroup = this.add.group();

        this.generatePattern();

        // No dragging, we use click events now.
    }

    handleAnswer(selectedValue, gameObject) {
        if (selectedValue === this.correctAnswer) {
            // Success
            this.sound.play('correct');

            if (this.dropZoneBg) {
                this.dropZoneBg.setStrokeStyle(6, 0x00ff00);
                this.dropZoneBg.setFillStyle(0xbbffbb, 1);
            }
            if (this.dropZoneText) {
                this.dropZoneText.setText(this.correctAnswer);
            }

            // Animate clicked object out
            this.tweens.add({
                targets: gameObject,
                scale: 0,
                duration: 200,
                onComplete: () => gameObject.destroy()
            });

            // Update Score and Check Level
            const result = GameState.addScoreAndCheckLevelUp('pattern', 15);
            this.score = result.newScore;
            this.scoreText.setText(`Score: ${this.score}`);

            this.playConfetti();

            // Disable other options while waiting for next round
            this.optionsGroup.getChildren().forEach(child => child.disableInteractive());

            if (result.leveledUp) {
                this.level = result.newLevel;
                this.levelText.setText(`Level: ${this.level}`);
                this.celebrateLevelUp(this.level);
            } else {
                this.animateMascotHappy();
                this.time.delayedCall(1500, () => this.generatePattern());
            }
        } else {
            // Wrong Answer
            this.sound.play('wrong');
            this.animateMascotSad();

            // Jiggle animation for incorrect answer
            this.tweens.add({
                targets: gameObject,
                x: gameObject.x - 10,
                duration: 50,
                yoyo: true,
                repeat: 3
            });
        }
    }

    generatePattern() {
        this.patternGroup.clear(true, true);
        this.optionsGroup.clear(true, true);

        // Different themes for patterns
        const itemSets = [
            ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'], // Colors
            ['⭐', '🔺', '🟦', '🔶', '💖', '💠'], // Shapes
            ['A', 'B', 'C', 'D', 'E', 'F'],       // Alphabets
            ['1', '2', '3', '4', '5', '6'],       // Numbers
            ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒']  // Fruits
        ];

        // Strict 1-to-10 Level Mapping ensuring completely distinct question logic per level
        let setIndex = 0;
        let selectedPattern = [];
        let missingIndexRange = [5, 5]; // Default: missing at the end

        switch (this.level) {
            case 1: setIndex = 0; selectedPattern = [0, 1, 0, 1, 0, 1]; break; // Colors, ABAB
            case 2: setIndex = 1; selectedPattern = [0, 1, 0, 1, 0, 1]; break; // Shapes, ABAB
            case 3: setIndex = 4; selectedPattern = [0, 0, 1, 0, 0, 1]; break; // Fruits, AABAAB
            case 4: setIndex = 3; selectedPattern = [0, 1, 1, 0, 1, 1]; break; // Numbers, ABBABB
            case 5: setIndex = 2; selectedPattern = [0, 1, 2, 0, 1, 2]; break; // Alpha, ABCABC
            case 6: setIndex = 0; selectedPattern = [0, 0, 1, 0, 0, 1]; missingIndexRange = [2, 4]; break; // Colors AABAAB (Missing middle)
            case 7: setIndex = 1; selectedPattern = [0, 1, 1, 0, 1, 1]; missingIndexRange = [2, 4]; break; // Shapes ABBABB (Missing middle)
            case 8: setIndex = 4; selectedPattern = [0, 1, 2, 0, 1, 2]; missingIndexRange = [2, 4]; break; // Fruits ABCABC (Missing middle)
            case 9: setIndex = 3; selectedPattern = [0, 1, 2, 0, 1, 2]; missingIndexRange = [2, 4]; break; // Nums ABCABC (Missing middle)
            default: setIndex = 2; selectedPattern = [0, 0, 1, 1, 0, 1]; missingIndexRange = [1, 4]; break; // Alpha Complex (Missing early/middle)
        }

        const selectedSet = itemSets[setIndex];

        // Shuffle the set to pick 3 random distinct elements for the pattern
        const shuffledSet = Phaser.Utils.Array.Shuffle([...selectedSet]);
        const items = [shuffledSet[0], shuffledSet[1], shuffledSet[2]];

        // Generate full sequence of 6 length
        const sequence = selectedPattern.map(idx => items[idx]);

        // We leave one empty for the user based on the missing index range
        const missingIndex = Phaser.Math.Between(missingIndexRange[0], missingIndexRange[1]);

        let displaySequence = [...sequence]; // copy
        displaySequence[missingIndex] = '?';
        this.correctAnswer = sequence[missingIndex];

        const { width, height } = this.cameras.main;

        // All sizes fully proportional to screen, no isMobile breakpoint
        const itemSpacing = Math.min(width / 6.5, height * 0.17);
        const patternWidth = 6 * itemSpacing;
        const startX = width / 2 - (patternWidth / 2) + (itemSpacing / 2);
        const patternY = height * 0.48;

        const boxSize = Math.round(itemSpacing * 0.82);
        const fontSize = `${Math.round(boxSize * 0.55)}px Arial`;

        // Display current Pattern Sequence
        displaySequence.forEach((item, index) => {
            const x = startX + index * itemSpacing;

            if (item === '?') {
                this.dropZoneBg = this.add.rectangle(x, patternY, boxSize, boxSize, 0xffffff, 0.4).setStrokeStyle(4, 0xffff00);
                this.dropZoneText = this.add.text(x, patternY, '?', { font: fontSize, fill: '#333', fontStyle: 'bold' }).setOrigin(0.5);
                this.patternGroup.add(this.dropZoneBg);
                this.patternGroup.add(this.dropZoneText);
            } else {
                const bg = this.add.rectangle(x, patternY, boxSize, boxSize, 0xffffff, 0.9).setStrokeStyle(4, 0x000000);
                const text = this.add.text(x, patternY, item, { font: fontSize, fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
                this.patternGroup.add(bg);
                this.patternGroup.add(text);
            }
        });

        // --- Generate Options Choices (Correct + 2 Wrong) ---
        let options = [this.correctAnswer];

        const availableWrong = selectedSet.filter(item => item !== this.correctAnswer);
        Phaser.Utils.Array.Shuffle(availableWrong);
        options.push(availableWrong[0]);
        options.push(availableWrong[1]);

        Phaser.Utils.Array.Shuffle(options);

        // Compact centered layout: box size + fixed gap, group centered at screen midpoint
        const optBoxSize = Math.round(Math.min(height * 0.15, width * 0.18, 80));
        const optGap = Math.round(optBoxSize * 0.55);           // gap between box edges
        const optStep = optBoxSize + optGap;                    // center-to-center distance
        const totalGroupW = optStep * 2 + optBoxSize;           // total span of 3 buttons
        const optionsStartX = width / 2 - totalGroupW / 2 + optBoxSize / 2; // leftmost center
        const optionsY = height * 0.84;
        const optFontSize = `${Math.round(optBoxSize * 0.5)}px Arial`;

        options.forEach((opt, idx) => {
            const x = optionsStartX + idx * optStep;

            // Shadow
            const shadow = this.add.rectangle(4, 4, optBoxSize, optBoxSize, 0x000000, 0.3);
            const bg = this.add.rectangle(0, 0, optBoxSize, optBoxSize, 0xffd700, 1).setStrokeStyle(3, 0xcc8800);
            const text = this.add.text(0, 0, opt, { font: optFontSize, fill: '#222', fontStyle: 'bold' }).setOrigin(0.5);

            const container = this.add.container(x, optionsY, [shadow, bg, text]);
            container.setSize(optBoxSize, optBoxSize);
            container.setInteractive({ useHandCursor: true });

            container.on('pointerover', () => { bg.setStrokeStyle(4, 0xffffff); container.setScale(1.12); });
            container.on('pointerout', () => { bg.setStrokeStyle(3, 0xcc8800); container.setScale(1); });
            container.on('pointerdown', () => {
                this.tweens.add({
                    targets: container, scale: 0.92, duration: 80, yoyo: true,
                    onComplete: () => this.handleAnswer(opt, container)
                });
            });

            this.optionsGroup.add(container);
        });
    }

    playConfetti() {
        const emitter = this.add.particles(this.cameras.main.width / 2, this.cameras.main.height / 2 - 40, 'coin', {
            angle: { min: 0, max: 360 },
            speed: { min: 200, max: 400 },
            gravityY: 300,
            lifespan: 2000,
            scale: { start: 0.1, end: 0 },
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
            blendMode: 'ADD'
        });

        this.time.delayedCall(1500, () => emitter.stop());
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
                this.generatePattern();
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
        if (!this.mascot) return;
        this.tweens.add({
            targets: this.mascot,
            y: this.mascot.y - 50,
            duration: 150,
            yoyo: true,
            repeat: 2
        });
    }

    animateMascotSad() {
        if (!this.mascot) return;
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

        // Shadow layer
        this.add.rectangle(bx + 3, by + 3, btnW, btnH, 0x000000, 0.35).setDepth(9);
        // Button background
        const btnBg = this.add.rectangle(bx, by, btnW, btnH, 0xe8350a, 1)
            .setStrokeStyle(2, 0xff7755)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });
        // Shine strip
        this.add.rectangle(bx, by - btnH * 0.18, btnW - 4, btnH * 0.35, 0xffffff, 0.15).setDepth(11);

        const iconFontSz = Math.round(Math.min(height * 0.035, 18));
        const icon = this.add.text(bx - btnW * 0.28, by, '◀', {
            font: `bold ${iconFontSz}px Arial`, fill: '#fff'
        }).setOrigin(0.5).setDepth(12);

        const labelFontSz = Math.round(Math.min(height * 0.035, 18));
        this.add.text(bx + btnW * 0.1, by, 'Back', {
            font: `bold ${labelFontSz}px Arial`, fill: '#fff', stroke: '#a02000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(12);

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0xff4422, 1);
            btnBg.setStrokeStyle(3, 0xffdd00);
        });
        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0xe8350a, 1);
            btnBg.setStrokeStyle(2, 0xff7755);
        });
        btnBg.on('pointerdown', () => {
            this.scene.start('HomeScene');
        });
    }

}