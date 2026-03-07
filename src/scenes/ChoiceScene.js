import Phaser from 'phaser';
import GameState from '../utils/GameState.js';

export default class ChoiceScene extends Phaser.Scene {
    constructor() { super('ChoiceScene'); }

    create() {
        const { width, height } = this.cameras.main;
        this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height).setDepth(0);

        this.level = GameState.getLevel('choice');
        this.score = GameState.getScore('choice');
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, { font: '32px Arial', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setDepth(10);
        this.levelText = this.add.text(20, 60, `Level: ${this.level}`, { font: '32px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 5 }).setDepth(10);

        // Timer display for level 5+
        this.timerText = this.add.text(width / 2, 110, '', {
            font: 'bold 40px Arial', fill: '#ff0000', stroke: '#fff', strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);

        this.createBackButton(width, height);

        // Proportional mascot
        const mascotSz = Math.min(width, height) * 0.0007;
        this.mascot = this.add.image(width - Math.min(width * 0.08, 70), height - Math.min(height * 0.15, 70), 'mascot').setScale(mascotSz).setDepth(5);

        // Story container - fully proportional
        const boxWidth = Math.min(width * 0.88, 680);
        const boxHeight = Math.min(height * 0.38, 200);
        const storyFontSz = Math.round(Math.min(height * 0.055, boxWidth * 0.038, 30));

        this.add.rectangle(width / 2, height * 0.32, boxWidth, boxHeight, 0xffffff, 0.85)
            .setStrokeStyle(5, 0xff9900)
            .setOrigin(0.5)
            .setDepth(1);

        this.storyText = this.add.text(width / 2, height * 0.32, '', {
            font: `${storyFontSz}px Arial`, fill: '#000', align: 'center', wordWrap: { width: boxWidth - 40 }
        }).setOrigin(0.5).setDepth(2);

        const btnW = Math.min(width * 0.82, 480);
        const btnH = Math.min(height * 0.12, 70);
        const btnFontSz = Math.round(Math.min(btnH * 0.38, btnW * 0.055, 22));

        this.btn1 = this.createChoiceButton(width / 2, height * 0.65, btnW, btnH, btnFontSz, '', () => this.handleChoice(0));
        this.btn2 = this.createChoiceButton(width / 2, height * 0.80, btnW, btnH, btnFontSz, '', () => this.handleChoice(1));

        this.levelStories = {
            1: [
                { text: "You find a toy at the park. What do you do?", choices: ["Keep it!", "Give it to an adult"], correct: 1 },
                { text: "Your friend drops their ice cream and is crying.", choices: ["Laugh at them", "Share yours"], correct: 1 },
                { text: "It is time for bed, but you want to play more.", choices: ["Go to sleep", "Stay up late"], correct: 0 },
                { text: "You accidentally broke a vase. Mom asks who did it.", choices: ["Tell the truth", "Blame the dog"], correct: 0 },
                { text: "Someone is sitting alone at lunch.", choices: ["Ignore them", "Invite them to sit"], correct: 1 }
            ],
            2: [
                { text: "You see someone struggling with homework.", choices: ["Help them", "Laugh at them"], correct: 0 },
                { text: "You find a pencil on a desk.", choices: ["Keep it", "Ask whose it is"], correct: 1 },
                { text: "The teacher is talking.", choices: ["Listen quietly", "Talk to a friend"], correct: 0 },
                { text: "It's time to clean up the classroom.", choices: ["Play with toys", "Help clean up"], correct: 1 },
                { text: "You accidentally bump into a classmate.", choices: ["Run away", "Say sorry"], correct: 1 }
            ],
            3: [
                { text: "Your younger sibling is sleeping.", choices: ["Play music loudly", "Play quietly"], correct: 1 },
                { text: "Dinner is ready but you are watching TV.", choices: ["Turn it off", "Ignore Mom"], correct: 0 },
                { text: "You are asked to share your toys.", choices: ["Say no", "Share them"], correct: 1 },
                { text: "You finish drinking a glass of milk.", choices: ["Leave cup on table", "Put cup in sink"], correct: 1 },
                { text: "It's your sibling's birthday.", choices: ["Complain", "Make them a card"], correct: 1 }
            ],
            4: [
                { text: "You want to play on the swing but someone is there.", choices: ["Push them", "Wait your turn"], correct: 1 },
                { text: "You lose a board game.", choices: ["Say 'Good game'", "Throw a tantrum"], correct: 0 },
                { text: "Your friend wants to play a different game.", choices: ["Compromise", "Refuse"], correct: 0 },
                { text: "Someone falls down at the playground.", choices: ["Ask if they are okay", "Laugh at them"], correct: 0 },
                { text: "You accidentally break your friend's toy.", choices: ["Hide it", "Tell them & apologize"], correct: 1 }
            ],
            5: [
                { text: "You see empty trash on the grass.", choices: ["Throw it in a bin", "Ignore it"], correct: 0 },
                { text: "You see a beautiful flower in the park.", choices: ["Pick it", "Leave it to grow"], correct: 1 },
                { text: "A neighbor is carrying heavy groceries.", choices: ["Hold the door", "Walk past"], correct: 0 },
                { text: "You have an empty plastic water bottle.", choices: ["Throw in trash", "Recycle it"], correct: 1 },
                { text: "You see a cute squirrel outdoors.", choices: ["Throw a rock at it", "Watch quietly"], correct: 1 }
            ],
            6: [
                { text: "A stranger offers you free candy.", choices: ["Take it", "Say no & tell adult"], correct: 1 },
                { text: "Your ball rolls into the busy street.", choices: ["Run after it", "Ask an adult for help"], correct: 1 },
                { text: "You need to cross the street.", choices: ["Jaywalk safely", "Use the crosswalk"], correct: 1 },
                { text: "You are going out to ride a bike.", choices: ["Ride without a helmet", "Wear a helmet"], correct: 1 },
                { text: "You find unknown medicine on the table.", choices: ["Don't touch it", "Eat it"], correct: 0 }
            ],
            7: [
                { text: "A new internet game asks for your real name.", choices: ["Type real name", "Use a nickname"], correct: 1 },
                { text: "Your time limit for the tablet is up.", choices: ["Turn it off", "Sneak 5 more mins"], correct: 0 },
                { text: "Someone is being mean in a game chat.", choices: ["Tell parents", "Be mean back"], correct: 0 },
                { text: "An internet ad says 'You won a prize!'.", choices: ["Click it", "Ignore it"], correct: 1 },
                { text: "You see a funny picture of a friend.", choices: ["Send to everyone", "Ask before sharing"], correct: 1 }
            ],
            8: [
                { text: "It is time to eat dinner.", choices: ["Sit down directly", "Wash hands front/back"], correct: 1 },
                { text: "You have to cough while near others.", choices: ["Cough in the air", "Cover mouth with elbow"], correct: 1 },
                { text: "You are very thirsty after playing hard.", choices: ["Drink soda", "Drink water"], correct: 1 },
                { text: "It is extremely sunny outside today.", choices: ["Wear sunscreen", "Go out without it"], correct: 0 },
                { text: "You just ate a sticky piece of candy.", choices: ["Go straight to bed", "Brush your teeth"], correct: 1 }
            ],
            9: [
                { text: "You borrow a fun library book.", choices: ["Keep it forever", "Return it on time"], correct: 1 },
                { text: "You have homework but want to play.", choices: ["Homework first", "Play first"], correct: 0 },
                { text: "You promised to help with household chores.", choices: ["Pretend to forget", "Do the chores"], correct: 1 },
                { text: "You are given a house plant to take care of.", choices: ["Water it often", "Ignore it"], correct: 0 },
                { text: "You found a dog without a collar outside.", choices: ["Chase it", "Tell an adult"], correct: 1 }
            ],
            10: [
                { text: "Someone got a bad haircut and people laugh.", choices: ["Laugh too", "Tell them it looks nice"], correct: 1 },
                { text: "You see a harmless bug in the house.", choices: ["Step on it", "Ask to catch & release"], correct: 1 },
                { text: "A friend makes a mistake in class.", choices: ["Make fun of them", "Encourage them"], correct: 1 },
                { text: "Someone gives you a gift you don't like.", choices: ["Say it's ugly", "Say thank you"], correct: 1 },
                { text: "You have two cookies and your friend has none.", choices: ["Eat both of them", "Share one"], correct: 1 }
            ]
        };

        this.currentStoryIndex = -1;
        this.inputEnabled = false;
        this.startNextStory();
    }

    createChoiceButton(x, y, w, h, fontSz, text, callback) {
        const bg = this.add.rectangle(x, y, w, h, 0x0066ff, 1)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(4, 0xffffff)
            .setDepth(3);

        const label = this.add.text(x, y, text, {
            font: `bold ${fontSz}px Arial`, fill: '#fff', wordWrap: { width: w - 40 }, align: 'center'
        }).setOrigin(0.5).setDepth(4);

        bg.on('pointerover', () => bg.setStrokeStyle(6, 0xffff00));
        bg.on('pointerout', () => bg.setStrokeStyle(4, 0xffffff));
        bg.on('pointerdown', () => {
            if (this.inputEnabled) callback();
        });

        return { bg, label };
    }

    startNextStory() {
        if (this.survivalTimerEvent) this.survivalTimerEvent.remove();
        this.timerText.setText('');

        let currentLevelStories = this.levelStories[this.level] || this.levelStories[10];

        this.currentStoryIndex = (this.currentStoryIndex + 1) % currentLevelStories.length;
        this.currentStory = currentLevelStories[this.currentStoryIndex];

        this.storyText.setText(this.currentStory.text);

        // Scale difficulty by level
        // Level > 1: Randomize choice button order
        this.choiceMapping = [0, 1];
        if (this.level >= 2 && Phaser.Math.Between(0, 1) === 1) {
            this.choiceMapping = [1, 0];
        }

        this.btn1.label.setText(this.currentStory.choices[this.choiceMapping[0]]);
        this.btn2.label.setText(this.currentStory.choices[this.choiceMapping[1]]);

        this.btn1.bg.setFillStyle(0x0066ff, 1);
        this.btn2.bg.setFillStyle(0x0066ff, 1);

        this.inputEnabled = true;

        // Level >= 5: Countdown timer (e.g. 10 seconds shrinking down to 4 seconds at Lvl 10)
        if (this.level >= 5) {
            this.timeLeft = Math.max(12 - this.level, 4); // Fast!
            this.timerText.setText(this.timeLeft.toString());

            this.survivalTimerEvent = this.time.addEvent({
                delay: 1000,
                repeat: this.timeLeft - 1,
                callback: () => {
                    this.timeLeft--;
                    if (this.timeLeft > 0) {
                        this.timerText.setText(this.timeLeft.toString());
                    } else {
                        this.timerText.setText('TIME OUT!');
                        if (this.inputEnabled) this.handleChoice(-1); // Force wrong answer
                    }
                }
            });
        }
    }

    handleChoice(btnIdx) {
        if (!this.inputEnabled) return;
        this.inputEnabled = false;
        if (this.survivalTimerEvent) this.survivalTimerEvent.remove();

        const isTimeOut = btnIdx === -1;

        let chosenBtn = null;
        let isCorrect = false;

        if (!isTimeOut) {
            // Check mapped index against correct answer index
            const actualChoiceIdx = this.choiceMapping[btnIdx];
            isCorrect = (actualChoiceIdx === this.currentStory.correct);
            chosenBtn = btnIdx === 0 ? this.btn1 : this.btn2;
        }

        if (isCorrect) {
            this.sound.play('correct');

            // Update Score and Check Level
            const result = GameState.addScoreAndCheckLevelUp('choice', 20);
            this.score = result.newScore;
            this.scoreText.setText(`Score: ${this.score}`);

            chosenBtn.bg.setFillStyle(0x00cc00, 1);

            this.playConfetti();

            if (result.leveledUp) {
                this.level = result.newLevel;
                this.levelText.setText(`Level: ${this.level}`);
                this.celebrateLevelUp(this.level);
            } else {
                this.animateMascotHappy();
                this.time.delayedCall(2000, () => this.startNextStory());
            }
        } else {
            this.sound.play('wrong');
            if (chosenBtn) chosenBtn.bg.setFillStyle(0xcc0000, 1);
            this.animateMascotSad();

            // Give them another try
            this.time.delayedCall(1500, () => {
                if (chosenBtn) chosenBtn.bg.setFillStyle(0x0066ff, 1);

                // If it was a timeout, we restart entirely
                if (isTimeOut) {
                    this.startNextStory();
                } else {
                    this.inputEnabled = true;
                }
            });
        }
    }

    playConfetti() {
        const emitter = this.add.particles(this.cameras.main.width / 2, 200, 'coin', {
            angle: { min: 0, max: 360 },
            speed: { min: 200, max: 400 },
            gravityY: 300,
            lifespan: 2000,
            scale: { start: 0.1, end: 0 },
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
            blendMode: 'ADD'
        });
        emitter.setDepth(20);
        this.time.delayedCall(1500, () => emitter.stop());
    }

    animateMascotHappy() {
        this.tweens.add({
            targets: this.mascot,
            y: this.mascot.y - 50,
            duration: 150,
            yoyo: true,
            repeat: 3
        });
    }

    celebrateLevelUp(newLevel) {
        this.sound.play('correct');

        const { width, height } = this.cameras.main;
        const levelUpText = this.add.text(width / 2, height / 2, `Level ${newLevel}\nUnlocked!`, {
            font: 'bold 80px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 12, align: 'center'
        }).setOrigin(0.5).setAlpha(0).setDepth(25);

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
                this.currentStoryIndex = -1; // Reset to start fresh inside the new level's array
                this.startNextStory();
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

    animateMascotSad() {
        this.tweens.add({
            targets: this.mascot,
            x: this.mascot.x - 20,
            duration: 80,
            yoyo: true,
            repeat: 4
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
            this.scene.start('HomeScene');
        });
    }

}
