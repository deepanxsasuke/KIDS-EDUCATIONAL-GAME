import Phaser from 'phaser';
import GameState from '../utils/GameState.js';
import { LEVELS, MAX_LEVELS, LEVEL_CATEGORIES, texKey } from '../utils/LevelData.js';

// ─────────────────────────────────────────────────────────────────────────────
// DIFFICULTY TABLE  (indexed by level number)
//   shownFirst  – always reveal the first letter
//   shownLast   – always reveal the last letter
//   distractors – number of fake tiles added to the tray
// ─────────────────────────────────────────────────────────────────────────────
function difficultyFor(level) {
    if (level === 1)  return { shownFirst: true,  shownLast: true,  distractors: 0 };
    if (level <= 3)   return { shownFirst: true,  shownLast: false, distractors: 1 };
    if (level <= 6)   return { shownFirst: false, shownLast: false, distractors: 2 };
    /* 7-10 */        return { shownFirst: false, shownLast: false, distractors: 3 };
}

export default class PatternScene extends Phaser.Scene {
    constructor() { super('PatternScene'); }

    // ─────────────────────────────────────────────────────────────────
    // SCENE LIFECYCLE
    // ─────────────────────────────────────────────────────────────────
    init() {
        this.events.once('shutdown', this.shutdown, this);
    }

    create() {
        const { width, height } = this.cameras.main;

        // ── Background ──────────────────────────────────────────────
        const bg = this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);
        this.tweens.add({
            targets: bg,
            scale: { from: bg.scaleX, to: bg.scaleX * 1.05 },
            duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // ── State ────────────────────────────────────────────────────
        this.level      = Math.max(1, Math.min(GameState.getLevel('pattern') || 1, MAX_LEVELS));
        this.score      = GameState.getScore('pattern') || 0;
        this.hintsUsed  = 0;
        this.dropZones  = [];
        this.letterTiles = [];
        this.hintBusy   = false;
        this.tutorialShown = false;
        this.hasEverInteracted = false;
        
        this.currentLevelWords = [...(LEVELS[this.level] || LEVELS[1])];
        this.currentWordIndex  = GameState.getWordIndex('pattern') || 0;
        if (this.currentWordIndex >= this.currentLevelWords.length) {
            this.currentWordIndex = 0;
        }

        // ── HUD ──────────────────────────────────────────────────────
        this.scoreText = this.add.text(20, 18, `⭐ ${this.score}`, {
            font: 'bold 28px Arial', fill: '#fff', stroke: '#000', strokeThickness: 5
        }).setDepth(30);
        this.levelText = this.add.text(20, 54, `Level ${this.level}/${MAX_LEVELS}`, {
            font: 'bold 24px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 4
        }).setDepth(30);
        this.progressText = this.add.text(20, 84,
            `Word: 1/${this.currentLevelWords.length}`, {
            font: 'bold 18px Arial', fill: '#81c784', stroke: '#000', strokeThickness: 3
        }).setDepth(30);

        const titleFontSz = Math.round(Math.min(height * 0.055, width * 0.05, 36));
        this.add.text(width / 2, height * 0.05, 'Spell the Word!', {
            font: `bold ${titleFontSz}px Arial`, fill: '#fff', stroke: '#222', strokeThickness: 6
        }).setOrigin(0.5).setDepth(30);

        this.createBackButton(width, height);

        // ── Mascot ───────────────────────────────────────────────────
        const mascotSz = Math.min(width, height) * 0.0007;
        this.mascot = this.add.image(width - 48, height - 56, 'mascot')
            .setScale(mascotSz).setDepth(30);
        this.tweens.add({
            targets: this.mascot, y: this.mascot.y - 10,
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // ── Game Object Group ────────────────────────────────────────
        this.gameGroup = this.add.group();

        // ── Global drag/drop events (set up once) ────────────────────
        this.setupDragHandlers();

        // ── Load first word ──────────────────────────────────────────
        this.loadLevel();
    }

    // ─────────────────────────────────────────────────────────────────
    // DRAG & DROP  (global handlers, registered once per scene create)
    // ─────────────────────────────────────────────────────────────────
    setupDragHandlers() {
        // Stop hints on first interact
        this.input.on('dragstart', (pointer, gameObject) => {
            this.hasEverInteracted = true;
            if (this.handHintTween) {
                this.handHintTween.stop();
                this.handHintTween = null;
            }
            if (this.handHint) {
                this.handHint.destroy();
                this.handHint = null;
            }
        });

        // Global drag mover – moves the dragged container
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.setDepth(50);
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        // Highlight zone on enter
        this.input.on('dragenter', (pointer, gameObject, target) => {
            if (!target.zoneData || target.zoneData.filled) return;
            target.zoneData.visual
                .setFillStyle(0xfff9c4, 0.95)
                .setStrokeStyle(4, 0xfdd835);
        });

        // Un-highlight on leave
        this.input.on('dragleave', (pointer, gameObject, target) => {
            if (!target.zoneData || target.zoneData.filled) return;
            target.zoneData.visual
                .setFillStyle(0xffffff, 0.65)
                .setStrokeStyle(3, 0xb39ddb);
        });

        // Evaluate drop
        this.input.on('drop', (pointer, gameObject, target) => {
            if (!target.zoneData) return;
            const zd = target.zoneData;

            if (zd.filled) {
                this.returnTile(gameObject);
                return;
            }

            if (gameObject.tileData.letter === zd.expectedLetter) {
                this.snapTileToZone(gameObject, zd);
            } else {
                this.rejectTile(gameObject);
            }
        });

        // Not dropped on anything → return to tray
        this.input.on('dragend', (pointer, gameObject, dropped) => {
            gameObject.setDepth(20);
            if (!dropped) this.returnTile(gameObject);
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // LOAD LEVEL  (called on first load and after completing any word)
    // ─────────────────────────────────────────────────────────────────
    loadLevel() {
        // ── Discard previous interactives BEFORE destroy ─────────────
        // Prevents Phaser's input manager from keeping dead references
        // (dead refs can block ALL input events in subsequent words)
        this.letterTiles.forEach(t => {
            try { if (t && t.input) t.disableInteractive(); } catch (e) {}
        });
        this.dropZones.forEach(zd => {
            try { if (zd.zone && zd.zone.input) zd.zone.removeInteractive(); } catch (e) {}
        });

        this.tweens.killAll();
        this.gameGroup.clear(true, true);
        this.dropZones   = [];
        this.letterTiles = [];
        this.hintBusy    = false;

        // Restart background animation (killed by tweens.killAll above)
        const bg = this.children.list.find(
            o => o.type === 'Image' && o.texture?.key === 'bg'
        );
        if (bg) {
            this.tweens.add({
                targets: bg, scale: { from: bg.scaleX, to: bg.scaleX * 1.05 },
                duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }
        if (this.mascot) {
            this.tweens.add({
                targets: this.mascot, y: this.mascot.y - 10,
                duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        const { width, height } = this.cameras.main;

        // ── HUD update ───────────────────────────────────────────────
        const totalWords = this.currentLevelWords.length;
        if (this.progressText) {
            this.progressText.setText(`Word: ${this.currentWordIndex + 1}/${totalWords}`);
        }
        if (this.levelText) {
            this.levelText.setText(`Level ${this.level}/${MAX_LEVELS}`);
        }

        // ── Resolve current word entry ───────────────────────────────
        const wordEntry = this.currentLevelWords[this.currentWordIndex];
        const word      = wordEntry.word.toUpperCase();   // e.g. "APPLE"
        const imgKey    = texKey(this.level, wordEntry.word); // e.g. "L1_apple"

        // ── Difficulty: which letters to show vs. hide ───────────────
        const { shownFirst, shownLast, distractors } = difficultyFor(this.level);

        let missingIndexes = [];
        for (let i = 0; i < word.length; i++) {
            if (shownFirst && i === 0) continue;
            if (shownLast  && i === word.length - 1) continue;
            missingIndexes.push(i);
        }
        // Never leave 0 blanks on a very short word
        if (missingIndexes.length === 0 && word.length > 0) {
            missingIndexes = [Math.floor(word.length / 2)];
        }

        // Distractor letters (NOT already in the word)
        const ALPHABET    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const wordLetters = new Set(word.split(''));
        const wrongLetters = [];
        for (let i = 0; i < distractors; i++) {
            let letter, attempts = 0;
            do { letter = ALPHABET[Phaser.Math.Between(0, 25)]; attempts++; }
            while (wordLetters.has(letter) && attempts < 50);
            wrongLetters.push(letter);
        }

        this.currentData = {
            word, imgKey,
            missingIndexes,
            wrongLetters,
            points: 10 + this.level * 2
        };

        // ── Image Card ───────────────────────────────────────────────
        const imgSz = Math.min(width * 0.30, height * 0.28, 190);
        const imgX  = width / 2;
        const imgY  = height * 0.26;

        const imgShadow = this.add.rectangle(
            imgX + 4, imgY + 5, imgSz + 24, imgSz + 24, 0x000000, 0.15
        ).setDepth(4);
        this.addG(imgShadow);

        const imgCard = this.add.rectangle(
            imgX, imgY, imgSz + 24, imgSz + 24, 0xffffff, 0.95
        ).setStrokeStyle(5, 0xe0d0ff).setDepth(5);
        this.addG(imgCard);

        const wordImg = this.add.image(imgX, imgY, imgKey)
            .setDisplaySize(imgSz, imgSz).setDepth(6);
        this.addG(wordImg);

        this.tweens.add({
            targets: wordImg, y: imgY - 7,
            duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // ── Word Boxes (letter slots) ─────────────────────────────────
        const missing   = missingIndexes;
        const boxSz     = Math.min(width / (word.length + 2.5), height * 0.115, 68);
        const boxGap    = boxSz * 0.16;
        const totalW    = word.length * (boxSz + boxGap) - boxGap;
        const startX    = width / 2 - totalW / 2 + boxSz / 2;
        const wordY     = height * 0.57;
        const letFontSz = Math.round(boxSz * 0.54);

        for (let i = 0; i < word.length; i++) {
            const letter    = word[i];
            const bx        = startX + i * (boxSz + boxGap);
            const isMissing = missing.includes(i);

            if (isMissing) {
                // ── Drop zone ──────────────────────────────────────────
                const visual = this.add.rectangle(bx, wordY, boxSz, boxSz, 0xffffff, 0.65)
                    .setStrokeStyle(3, 0xb39ddb).setDepth(5);
                this.addG(visual);

                this.tweens.add({
                    targets: visual, alpha: { from: 0.65, to: 1 },
                    duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });

                const zLabel = this.add.text(bx, wordY, '_', {
                    font: `bold ${letFontSz}px Arial`, fill: '#bbb'
                }).setOrigin(0.5).setDepth(7);
                this.addG(zLabel);

                const zone = this.add.zone(bx, wordY, boxSz, boxSz)
                    .setRectangleDropZone(boxSz, boxSz).setDepth(6);
                const zoneData = {
                    zone, visual, letterText: zLabel,
                    expectedLetter: letter,
                    filled: false, x: bx, y: wordY
                };
                zone.zoneData = zoneData;
                this.dropZones.push(zoneData);
                this.addG(zone);

            } else {
                // ── Pre-filled letter ──────────────────────────────────
                const fbg = this.add.rectangle(bx, wordY, boxSz, boxSz, 0xe8f5e9, 1)
                    .setStrokeStyle(3, 0x66bb6a).setDepth(5);
                const ftxt = this.add.text(bx, wordY, letter, {
                    font: `bold ${letFontSz}px Arial`, fill: '#1b5e20'
                }).setOrigin(0.5).setDepth(7);
                this.addG(fbg);
                this.addG(ftxt);
            }
        }

        // ── Letter Tile Tray ─────────────────────────────────────────
        const missingLetters = missing.map(i => word[i]);
        const shuffled = Phaser.Utils.Array.Shuffle([
            ...missingLetters,
            ...wrongLetters
        ]);

        const tileSz     = Math.min(width / (shuffled.length + 2), height * 0.11, 64);
        const tileGap    = tileSz * 0.22;
        const totalTileW = shuffled.length * (tileSz + tileGap) - tileGap;
        const trayX0     = width / 2 - totalTileW / 2 + tileSz / 2;
        const trayY      = height * 0.83;
        const tileFontSz = Math.round(tileSz * 0.54);

        shuffled.forEach((letter, idx) => {
            const tx = trayX0 + idx * (tileSz + tileGap);
            const ty = trayY;

            const container = this.add.container(tx, ty).setDepth(20);
            const shadow    = this.add.rectangle(3, 4, tileSz, tileSz, 0x000000, 0.22);
            const tileBg    = this.add.rectangle(0, 0, tileSz, tileSz, 0xffca28, 1)
                                  .setStrokeStyle(3, 0xf57f17);
            const tileTxt   = this.add.text(0, 0, letter, {
                font: `bold ${tileFontSz}px Arial`, fill: '#3e2000'
            }).setOrigin(0.5);

            container.add([shadow, tileBg, tileTxt]);

            // ── Draggable with EXPLICIT centered hit area ─────────────
            // Using { draggable:true } without hitArea lets Phaser compute
            // bounds from the container's children — this can produce a
            // rectangle that covers the whole canvas and blocks every click.
            // An explicit Rectangle(−w/2, −h/2, w, h) is always correct.
            const hitArea = new Phaser.Geom.Rectangle(
                -tileSz / 2, -tileSz / 2, tileSz, tileSz
            );
            container.setSize(tileSz, tileSz);
            container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            container.input.cursor = 'pointer';
            this.input.setDraggable(container);

            container.tileData = {
                letter, origX: tx, origY: ty,
                tileBg, tileText: tileTxt, shadow, locked: false
            };

            // Local drag handler – redundancy with global ensures movement
            // even when global fires slightly out of order on mobile
            container.on('drag', (ptr, dragX, dragY) => {
                container.setDepth(50);
                container.x = dragX;
                container.y = dragY;
            });

            this.addG(container);
            this.letterTiles.push(container);
        });

        // ── Hint Button ──────────────────────────────────────────────
        this.createHintButton(width, height);

        // ── Category pop-in banner ───────────────────────────────────
        const category = LEVEL_CATEGORIES[this.level] || `Level ${this.level}`;
        const popText  = this.add.text(width / 2, height * 0.44,
            `Level ${this.level}: ${category}`, {
            font: 'bold 22px Arial', fill: '#fff', stroke: '#333', strokeThickness: 5
        }).setOrigin(0.5).setDepth(25).setAlpha(0);
        this.addG(popText);

        this.tweens.add({
            targets: popText, alpha: 1, y: height * 0.44 - 6,
            duration: 500, ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.tweens.add({ targets: popText, alpha: 0, duration: 400 });
                });
            }
        });

        // ── Tutorial tip (Level 1, first word only) ──────────────────
        if (this.level === 1 && this.currentWordIndex === 0 && !this.tutorialShown) {
            this.time.delayedCall(1200, () => this.showTutorialTip());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // HINT BUTTON
    // ─────────────────────────────────────────────────────────────────
    createHintButton(width, height) {
        const bx = width - 60;
        const by = height * 0.46;
        const hintsLeft = 2 - (this.hintsUsed || 0);

        const hBg = this.add.circle(bx, by, 30, 0x7b1fa2, 1)
            .setStrokeStyle(3, 0xce93d8).setDepth(28);
        if (hintsLeft > 0) {
            hBg.setInteractive({ useHandCursor: true });
        } else {
            hBg.setFillStyle(0x757575);
        }
        this.addG(hBg);

        const icon = this.add.text(bx, by, '💡', { font: '20px Arial' }).setOrigin(0.5).setDepth(29);
        const label = this.add.text(bx, by + 42, `HINT (${hintsLeft})`, {
            font: 'bold 13px Arial', fill: '#fff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(29);
        this.addG(icon);
        this.addG(label);
        
        this.hintLabel = label;
        this.hintBg    = hBg;

        this.tweens.add({
            targets: [hBg, icon, label], scale: { from: 1, to: 1.1 },
            duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        hBg.on('pointerover', () => hBg.setFillStyle(0x9c27b0));
        hBg.on('pointerout',  () => hBg.setFillStyle(0x7b1fa2));
        hBg.on('pointerdown', () => this.showHint());
    }

    // ─────────────────────────────────────────────────────────────────
    // HINT ANIMATION  (hand glides a tile to its correct zone)
    // ─────────────────────────────────────────────────────────────────
    showHint() {
        if (this.hintBusy || this.hintsUsed >= 2) return;
        const targetZone = this.dropZones.find(zd => !zd.filled);
        if (!targetZone) return;
        const targetTile = this.letterTiles.find(
            t => t.tileData.letter === targetZone.expectedLetter && !t.tileData.locked
        );
        if (!targetTile) return;

        this.hintsUsed = (this.hintsUsed || 0) + 1;
        const hintsLeft = 2 - this.hintsUsed;
        if (this.hintLabel) this.hintLabel.setText(`HINT (${Math.max(0, hintsLeft)})`);
        if (hintsLeft <= 0 && this.hintBg) {
            this.hintBg.setFillStyle(0x757575);
            this.hintBg.disableInteractive();
        }

        this.hintBusy = true;

        // Flash the zone
        this.tweens.add({
            targets: targetZone.visual,
            alpha: { from: 0.4, to: 1 }, scale: { from: 0.95, to: 1.08 },
            duration: 300, yoyo: true, repeat: 2
        });

        // Hand pointer (if texture exists)
        const hasPointer = this.textures.exists('hint_pointer');
        const hand = hasPointer
            ? this.add.image(targetTile.tileData.origX, targetTile.tileData.origY + 20, 'hint_pointer')
                .setDepth(100).setScale(3.0)
            : null;

        this.tweens.add({
            targets: hand || targetTile,
            x: targetTile.x,
            y: targetTile.y + (hand ? 15 : 0),
            duration: 300,
            onComplete: () => {
                targetTile.setDepth(50);
                this.tweens.add({
                    targets: targetTile,
                    x: targetZone.x, y: targetZone.y,
                    duration: 650, ease: 'Cubic.easeInOut',
                    onUpdate: () => {
                        if (hand) { hand.x = targetTile.x; hand.y = targetTile.y + 15; }
                    },
                    onComplete: () => {
                        this.snapTileToZone(targetTile, targetZone, true);
                        if (hand) hand.destroy();
                        this.hintBusy = false;
                    }
                });
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // TUTORIAL ANIMATION  (Level 1 – first word idle tip)
    // ─────────────────────────────────────────────────────────────────
    showTutorialTip() {
        this.tutorialShown = true;
        if (this.hasEverInteracted) return;

        const targetZone = this.dropZones.find(zd => !zd.filled);
        if (!targetZone) return;
        const targetTile = this.letterTiles.find(
            t => t.tileData.letter === targetZone.expectedLetter && !t.tileData.locked
        );
        if (!targetTile) return;

        const { height } = this.cameras.main;
        const td = targetTile.tileData;
        
        if (!this.handHint) {
            this.handHint = this.add.text(td.origX, td.origY, '👆🏻', {
                font: `${Math.round(height * 0.12)}px Arial`
            }).setOrigin(0.5).setDepth(100).setAlpha(1);
            this.addG(this.handHint);
        }

        this.playTutorialHint = () => {
            if (this.hasEverInteracted || !this.handHint || !this.handHint.active) return;
            
            // In case target changes
            const tZone = this.dropZones.find(zd => !zd.filled);
            if (!tZone) return;
            const tTile = this.letterTiles.find(
                t => t.tileData.letter === tZone.expectedLetter && !t.tileData.locked
            );
            if (!tTile) return;

            const tileData = tTile.tileData;

            this.handHint.x = tileData.origX + 20;
            this.handHint.y = tileData.origY + 30;
            this.handHint.setAlpha(0);

            this.handHintTween = this.tweens.add({
                targets: this.handHint,
                x: tZone.x,
                y: tZone.y + 15,
                alpha: { start: 1, from: 1, to: 1 },
                duration: 1500,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    if (!this.hasEverInteracted) {
                        this.time.delayedCall(500, () => {
                            this.playTutorialHint();
                        });
                    }
                }
            });
        };
        
        this.playTutorialHint();
    }

    // ─────────────────────────────────────────────────────────────────
    // SNAP TILE → ZONE  (correct placement)
    // Phase 1 → Scale pop   (0.65 → 1.25, 130 ms)
    // Phase 2 → Vibrate     (±6 px × 8 ticks × 35 ms)
    // Phase 3 → Settle      (back to scale 1, 120 ms)
    // ─────────────────────────────────────────────────────────────────
    snapTileToZone(tile, zoneData, fromHint = false) {
        zoneData.filled      = true;
        tile.tileData.locked = true;
        tile.disableInteractive();

        const td    = tile.tileData;
        const baseX = zoneData.x;
        const baseY = zoneData.y;

        this.tweens.killTweensOf(zoneData.visual);

        tile.x = baseX;
        tile.y = baseY;
        td.shadow.setVisible(false);

        // ── Green "correct" style ────────────────────────────────────
        zoneData.visual
            .setFillStyle(0xc8e6c9, 1)
            .setStrokeStyle(4, 0x4caf50)
            .setAlpha(1);
        zoneData.letterText.setText('').setAlpha(0);
        td.tileBg.setFillStyle(0x81c784, 1).setStrokeStyle(3, 0x388e3c);
        td.tileText.setColor('#1b5e20');

        // ── Phase 1: Pop scale ───────────────────────────────────────
        this.tweens.add({
            targets: [tile, zoneData.visual],
            scale: { from: 0.65, to: 1.25 },
            duration: 130, ease: 'Back.easeOut',
            onComplete: () => {

                // ── Phase 2: Rapid vibrate (8 ticks × 35 ms) ────────
                let tick = 0;
                const AMP = 6;
                this.time.addEvent({
                    delay: 35, repeat: 7,
                    callback: () => {
                        tile.x = baseX + (tick++ % 2 === 0 ? AMP : -AMP);
                    }
                });

                // ── Phase 3: Settle ──────────────────────────────────
                this.time.delayedCall(300, () => {
                    tile.x = baseX;
                    this.tweens.add({
                        targets: [tile, zoneData.visual],
                        scale: 1, duration: 120, ease: 'Sine.easeOut'
                    });
                });
            }
        });

        if (!fromHint) this.sound.play('correct');
        this.checkCompletion();
    }

    // ─────────────────────────────────────────────────────────────────
    // REJECT TILE  (wrong placement → shake → return)
    // ─────────────────────────────────────────────────────────────────
    rejectTile(tile) {
        this.sound.play('wrong');
        const td = tile.tileData;
        td.tileBg.setFillStyle(0xef9a9a);
        this.animateMascotSad();

        let tick = 0;
        this.time.addEvent({
            delay: 55, repeat: 5,
            callback: () => { tile.x += (tick++ % 2 === 0) ? 14 : -14; }
        });

        this.time.delayedCall(360, () => {
            this.returnTile(tile);
            td.tileBg.setFillStyle(0xffca28);
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // RETURN TILE  (back to tray original position)
    // ─────────────────────────────────────────────────────────────────
    returnTile(tile) {
        if (tile.tileData.locked) return;
        const td = tile.tileData;
        this.tweens.add({
            targets: tile, x: td.origX, y: td.origY,
            duration: 250, ease: 'Back.easeOut'
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // CHECK COMPLETION  (all drop zones filled?)
    // ─────────────────────────────────────────────────────────────────
    checkCompletion() {
        if (!this.dropZones.every(zd => zd.filled)) return;

        this.time.delayedCall(350, () => {
            this.playConfetti();
            this.animateMascotHappy();

            this.score += this.currentData.points;
            GameState.setScore('pattern', this.score);
            this.scoreText.setText(`⭐ ${this.score}`);

            this.currentWordIndex++;
            GameState.setWordIndex('pattern', this.currentWordIndex);
            
            const totalWords = this.currentLevelWords.length;

            if (this.currentWordIndex < totalWords) {
                // Next picture in same level
                this.time.delayedCall(1800, () => this.loadLevel());
            } else {
                // Level complete
                if (this.level >= MAX_LEVELS) {
                    this.time.delayedCall(1800, () => {
                        this.scene.start('CelebrationScene', {
                            gameId: 'pattern', sceneName: 'PatternScene'
                        });
                    });
                } else {
                    this.level++;
                    GameState.setLevel('pattern', this.level);
                    this.score += 50;   // level bonus
                    GameState.setScore('pattern', this.score);
                    this.scoreText.setText(`⭐ ${this.score}`);
                    this.levelText.setText(`Level ${this.level}/${MAX_LEVELS}`);
                    this.celebrateLevelUp(this.level);
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // EFFECTS
    // ─────────────────────────────────────────────────────────────────
    playConfetti() {
        const { width, height } = this.cameras.main;
        const emitter = this.add.particles(width / 2, height * 0.4, 'coin', {
            angle: { min: 0, max: 360 },
            speed: { min: 180, max: 420 },
            gravityY: 320,
            lifespan: 2000,
            scale: { start: 0.12, end: 0 },
            tint: [0xff5252, 0x69f0ae, 0x448aff, 0xffeb3b, 0xe040fb, 0xff6d00],
            blendMode: 'ADD',
            quantity: 18
        });
        this.time.delayedCall(1800, () => emitter.destroy());
    }

    celebrateLevelUp(newLevel) {
        const { width, height } = this.cameras.main;
        const category = LEVEL_CATEGORIES[newLevel] || `Level ${newLevel}`;

        const overlay = this.add.rectangle(
            width / 2, height / 2, width, height, 0x000000, 0.4
        ).setDepth(60);

        const banner = this.add.text(
            width / 2, height / 2,
            `🎉 Level ${newLevel}\n${category}!`, {
            font: 'bold 56px Arial', fill: '#ffeb3b',
            stroke: '#000', strokeThickness: 10, align: 'center'
        }).setOrigin(0.5).setAlpha(0).setDepth(61);

        this.tweens.add({
            targets: banner, alpha: 1,
            scale: { from: 0.5, to: 1.15 },
            duration: 550, ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: banner, scale: 1, duration: 250, delay: 1600,
                    onComplete: () => {
                        this.tweens.add({
                            targets: [banner, overlay], alpha: 0, duration: 400,
                            onComplete: () => {
                                banner.destroy();
                                overlay.destroy();
                                this.hintsUsed = 0;
                                this.currentWordIndex  = 0;
                                GameState.setWordIndex('pattern', 0);
                                this.currentLevelWords = [...(LEVELS[this.level] || LEVELS[1])];
                                this.loadLevel();
                            }
                        });
                    }
                });
            }
        });

        this.playConfetti();
    }

    animateMascotHappy() {
        if (!this.mascot) return;
        this.tweens.add({
            targets: this.mascot,
            y: this.mascot.y - 40,
            angle: { from: -8, to: 8 },
            duration: 130, yoyo: true, repeat: 4,
            onComplete: () => { this.mascot.angle = 0; }
        });
    }

    animateMascotSad() {
        if (!this.mascot) return;
        this.tweens.add({
            targets: this.mascot, x: this.mascot.x - 16,
            duration: 70, yoyo: true, repeat: 3
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // BACK BUTTON
    // ─────────────────────────────────────────────────────────────────
    createBackButton(width, height) {
        const btnW = Math.round(Math.min(width * 0.18, 110));
        const btnH = Math.round(Math.min(height * 0.08, 44));
        const bx   = width - btnW / 2 - 12;
        const by   = btnH / 2 + 10;

        this.add.rectangle(bx + 3, by + 3, btnW, btnH, 0x000000, 0.35).setDepth(39);
        const btnBg = this.add.rectangle(bx, by, btnW, btnH, 0xe8350a, 1)
            .setStrokeStyle(2, 0xff7755).setDepth(40)
            .setInteractive({ useHandCursor: true });
        this.add.rectangle(bx, by - btnH * 0.18, btnW - 4, btnH * 0.35, 0xffffff, 0.15).setDepth(41);

        const fsz = Math.round(Math.min(height * 0.035, 18));
        this.add.text(bx - btnW * 0.28, by, '◀', {
            font: `bold ${fsz}px Arial`, fill: '#fff'
        }).setOrigin(0.5).setDepth(42);
        this.add.text(bx + btnW * 0.1, by, 'Back', {
            font: `bold ${fsz}px Arial`, fill: '#fff', stroke: '#a02000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(42);

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0xff4422); btnBg.setStrokeStyle(3, 0xffdd00); });
        btnBg.on('pointerout',  () => { btnBg.setFillStyle(0xe8350a); btnBg.setStrokeStyle(2, 0xff7755); });
        btnBg.on('pointerdown', () => this.scene.start('HomeScene'));
    }

    // ─────────────────────────────────────────────────────────────────
    // HELPER
    // ─────────────────────────────────────────────────────────────────
    addG(obj) {
        if (obj) this.gameGroup.add(obj);
        return obj;
    }

    // ─────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────
    shutdown() {
        this.input.off('drag');
        this.input.off('dragenter');
        this.input.off('dragleave');
        this.input.off('drop');
        this.input.off('dragend');
    }
}