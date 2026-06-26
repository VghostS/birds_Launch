class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('screenshot_monkey', 'assets/screenshot.png');
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        const width = this.scale.width; 
        const height = this.scale.height; 

        let bestLevel = this.registry.get('monkeyBestLevel') || 1;

        // ==========================================
        // LEFT SIDE: Game Preview Window
        // ==========================================
        
        this.add.rectangle(0, 0, width / 2, height, 0x4caf50).setOrigin(0);
        this.add.text(50, 20, 'Kodo Games', { fontFamily: 'Arial, sans-serif', fontSize: '45px', fill: '#ffffff', fontStyle: 'bold' });

        let preview = this.add.sprite(width / 4, height * 0.44, 'screenshot_monkey');
        if (preview.texture.key !== '__DEFAULT') {
            preview.setScale(Math.min((width / 2) / preview.width, (height * 0.8) / preview.height)); 
        }

        this.add.rectangle(0, height * 0.75, width / 2, height * 0.25, 0x333333).setOrigin(0);
        this.add.text(50, height * 0.82, 'Monkey Feeder', { fontFamily: 'Peralta', fontSize: '60px', fill: '#ffcc00' });
        this.add.text(50, height * 0.90, 'Working Memory + Tracking', { fontFamily: 'Arial, sans-serif', fontSize: '30px', fill: '#ffffff' });

        // ==========================================
        // RIGHT SIDE: Stats and Play Buttons
        // ==========================================
        
        this.add.rectangle(width / 2, 0, width / 2, height, 0xffffff).setOrigin(0);
        this.add.text(width / 2 + 80, 80, 'Instructions', { fontFamily: 'Arial, sans-serif', fontSize: '45px', fill: '#4caf50', fontStyle: 'bold' });
        
        let descText = "Tap the flying birds to feed them a nut. They look exactly the same once fed, so you must use your working memory to remember who has already eaten!\n\nDo not feed the same bird twice.";
        this.add.text(width / 2 + 80, 160, descText, { fontFamily: 'Arial, sans-serif', fontSize: '32px', fill: '#555555', wordWrap: { width: 750, useAdvancedWrap: true }, lineSpacing: 10 });

        this.add.text(width / 2 + 80, 480, 'Best Stat', { fontFamily: 'Arial, sans-serif', fontSize: '40px', fill: '#4caf50', fontStyle: 'bold' });
        this.add.text(width / 2 + 80, 540, `Level ${bestLevel}`, { fontFamily: 'Arial, sans-serif', fontSize: '50px', fill: '#333333', fontStyle: 'bold' });

        // --- Split Play and Tutorial Buttons ---
        let btnGraphics = this.add.graphics();
        
        let startX = width / 2 + 200; 
        let btnY = height - 250;
        let btnH = 100;
        let btnRadius = 50;

        let tutW = 100;
        let playW = 440;
        let playX = startX + tutW + 20; 

        // 1. Draw '?' Tutorial Button
        btnGraphics.fillStyle(0xeeeeee, 1);
        btnGraphics.fillRoundedRect(startX, btnY, tutW, btnH, btnRadius);
        this.add.text(startX + tutW / 2, btnY + btnH / 2, '?', { fontFamily: 'Arial, sans-serif', fontSize: '50px', fill: '#666666', fontStyle: 'bold' }).setOrigin(0.5);

        // 2. Draw 'Play' Button
        btnGraphics.fillStyle(0x4caf50, 1);
        btnGraphics.fillRoundedRect(playX, btnY, playW, btnH, btnRadius);
        this.add.text(playX + playW / 2, btnY + btnH / 2, 'Play', { fontFamily: 'Arial, sans-serif', fontSize: '40px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        // 3. Interactive Zones
        let tutZone = this.add.zone(startX + tutW / 2, btnY + btnH / 2, tutW, btnH).setInteractive();
        let playZone = this.add.zone(playX + playW / 2, btnY + btnH / 2, playW, btnH).setInteractive();
        
        tutZone.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            btnGraphics.fillStyle(0xdddddd, 1); 
            btnGraphics.fillRoundedRect(startX, btnY, tutW, btnH, btnRadius);
        });
        tutZone.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            btnGraphics.fillStyle(0xeeeeee, 1); 
            btnGraphics.fillRoundedRect(startX, btnY, tutW, btnH, btnRadius);
        });
        tutZone.on('pointerdown', () => {
            this.input.setDefaultCursor('default');
            tutZone.disableInteractive(); 
            playZone.disableInteractive();
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameScene', { level: 'tutorial' }); 
            });
        });

        playZone.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            btnGraphics.fillStyle(0x66bb6a, 1); 
            btnGraphics.fillRoundedRect(playX, btnY, playW, btnH, btnRadius);
        });
        playZone.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            btnGraphics.fillStyle(0x4caf50, 1); 
            btnGraphics.fillRoundedRect(playX, btnY, playW, btnH, btnRadius);
        });
        playZone.on('pointerdown', () => {
            this.input.setDefaultCursor('default');
            tutZone.disableInteractive(); 
            playZone.disableInteractive();
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameScene', { level: 1 }); 
            });
        });
    }
}

class Bird extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);

        this.setScale(0.4); 
        this.play('bird_fly'); 

        this.flySpeed = 200 + Math.random() * 200; 
        this.leftBoundary = 500;
        this.rightBoundary = scene.scale.width - 200; 
        
        this.wobbleAmplitude = 50 + Math.random() * 100; 
        this.wobbleFrequency = 1 + Math.random(); 
        this.startY = y + 50;
        this.randomTimeOffset = Math.random() * 100;
        this.movingDirection = 1; 

        this.hasGivenPoint = false; 

        this.setInteractive(); 
        this.on('pointerdown', this.onClick, this);
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta); 

        // TWEAK 1: We removed the check that freezes birds. 
        // Now they fly endlessly in the background even during the tutorial or game over!

        this.x += this.movingDirection * this.flySpeed * (delta / 1000);

        if (this.x >= this.rightBoundary) {
            this.x = this.rightBoundary;
            this.movingDirection = -1;
            this.setFlipX(true); 
        } else if (this.x <= this.leftBoundary) {
            this.x = this.leftBoundary;
            this.movingDirection = 1;
            this.setFlipX(false);
        }

        const timeInSec = time / 1000;
        this.y = this.startY + Math.sin((timeInSec + this.randomTimeOffset) * this.wobbleFrequency) * this.wobbleAmplitude;
    }

    onClick() {
        // We only block the click interaction if a menu is open, not their movement.
        if (this.scene.isPaused || this.scene.isGameOver) return;

        if (this.scene.canThrowNut()) {
            if (!this.hasGivenPoint) {
                this.hasGivenPoint = true;
                this.scene.birdFed();
            } else {
                this.scene.showCross(this.x, this.y);
            }
            this.scene.monkeyThrowAt(this);
        }
    }

    makeBirdBigger() {
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.6, 
            scaleY: 0.6,
            duration: 500, 
            yoyo: true,    
            ease: 'Sine.easeInOut'
        });
    }
}

class VisualNut extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, targetBird, travelTime) {
        super(scene, x, y, 'nut'); 
        scene.add.existing(this);

        this.targetBird = targetBird;
        this.startPoint = new Phaser.Math.Vector2(x, y);
        this.travelTime = travelTime * 1000; 
        this.timer = 0;
        this.arcHeight = 150; 
        
        this.setScale(0.5); 
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.targetBird || !this.targetBird.active) {
            this.destroy(); 
            return;
        }

        this.timer += delta;
        let percent = this.timer / this.travelTime;

        if (percent >= 1) {
            this.targetBird.makeBirdBigger();
            this.destroy();
            return;
        }

        let currentX = Phaser.Math.Linear(this.startPoint.x, this.targetBird.x, percent);
        let currentY = Phaser.Math.Linear(this.startPoint.y, this.targetBird.y, percent);
        currentY -= this.arcHeight * Math.sin(percent * Math.PI); 

        this.setPosition(currentX, currentY);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.currentLevel = data.level || 1;
        
        if (this.currentLevel === 'tutorial') {
            this.totalBirds = 3;  
            this.currentNuts = 5; 
            this.timeRemaining = 60; 
        } else if (this.currentLevel === 1) {
            this.totalBirds = 5;
            this.currentNuts = 5;
            this.timeRemaining = 25;
        } else if (this.currentLevel === 2) {
            this.totalBirds = 7;
            this.currentNuts = 7;
            this.timeRemaining = 30;
        } else if (this.currentLevel === 3) {
            this.totalBirds = 9;
            this.currentNuts = 9;
            this.timeRemaining = 35;
        } else {
            this.totalBirds = 9 + (this.currentLevel - 3);
            this.currentNuts = 9 + (this.currentLevel - 3);
            this.timeRemaining = 40;
        }
    }

    preload() {
        this.load.image('bg', 'assets/bg.png'); 
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png'); 

        this.load.spritesheet('bird_sheet', 'assets/bird.png', { frameWidth: 406, frameHeight: 368 });
        
        this.load.spritesheet('monkey_idle', 'assets/monkey_idle.png', { frameWidth: 344.4444, frameHeight: 193.83333 });
        this.load.spritesheet('monkey_throw', 'assets/monkey_throw.png', { frameWidth: 344.4444, frameHeight: 198.333333333333});

        this.load.spritesheet('nut_fill_sheet', 'assets/nut_fill.png', { frameWidth: 400, frameHeight: 225 });
    }

    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const centerX = gameWidth / 2;

        let bg = this.add.image(centerX, gameHeight / 2, 'bg'); 
        bg.setDisplaySize(gameWidth, gameHeight);
        this.tree = this.add.sprite(gameWidth - 1850, gameHeight - 580, 'tree');

        this.birdsFedCount = 0;
        this.isGameOver = false;
        this.isPaused = false; 

        this.throwCooldown = 1000; 
        this.lastThrowTime = 0;

        this.timerText = this.add.text(centerX, 20, `Time: ${this.timeRemaining}s`, { fontFamily: 'Peralta', fontSize: '40px', fill: '#ffcc00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);
        this.nutsText = this.add.text(centerX - 300, 20, `Nuts: ${this.currentNuts}`, { fontFamily: 'Peralta', fontSize: '40px', fill: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);
        this.birdsFedText = this.add.text(centerX + 300, 20, `Fed: 0/${this.totalBirds}`, { fontFamily: 'Peralta', fontSize: '40px', fill: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);

        this.levelTimer = this.time.addEvent({
            delay: 1000,
            callback: this.onTimerTick,
            callbackScope: this,
            loop: true
        });

        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('monkey_idle', { start: 0, end: 53 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'throw', frames: this.anims.generateFrameNumbers('monkey_throw', { start: 0, end: 8 }), frameRate: 15, repeat: 0 });

        this.monkey = this.add.sprite(gameWidth - 1750, gameHeight - 520, 'monkey_idle');
        this.monkey.scale = 1; 
        this.monkey.play('idle');
        this.monkey.on('animationcomplete-throw', () => { this.monkey.play('idle'); });

        this.anims.create({ key: 'nut_fill_anim', frames: this.anims.generateFrameNumbers('nut_fill_sheet', { start: 0, end: 50 }), frameRate: 30, repeat: 0 });
        this.cooldownNut = this.add.sprite(this.monkey.x+50, this.monkey.y - 120, 'nut_fill_sheet');
        this.cooldownNut.setScale(0.195).setAlpha(0);   

        this.readyNut = this.add.sprite(this.monkey.x+50, this.monkey.y - 120, 'nut');
        this.readyNut.setScale(0.5); 

        this.anims.create({ key: 'bird_fly', frames: this.anims.generateFrameNumbers('bird_sheet', { start: 0, end: 37 }), frameRate: 25, repeat: -1 });

        this.birds = []; 
        for (let i = 0; i < this.totalBirds; i++) {
            let startY = 150 + (i * 100); 
            let newBird = new Bird(this, 300 + Math.random()*500, startY, 'bird_sheet');
            this.birds.push(newBird);
        }

        if(this.currentLevel === 'tutorial') {
            this.runTutorialSequence(centerX, gameHeight / 2, gameWidth, gameHeight);
        }
    }

    runTutorialSequence(cx, cy, gw, gh) {
        this.isPaused = true; 

        let tutGroup = this.add.container(0, 0).setDepth(100);
        let bgBlocker = this.add.rectangle(cx, cy, gw, gh, 0x000000, 0.6).setInteractive();

        let modalBg = this.add.graphics();
        modalBg.fillStyle(0xffffff, 1);
        modalBg.fillRoundedRect(cx - 400, cy - 200, 800, 400, 30);

        let step = 1;

        // TWEAK 3: Adjusted the Y positions to completely separate the Title and Rules text
        let title = this.add.text(cx, cy - 140, 'Tutorial: The Stats', { fontFamily: 'Peralta', fontSize: '45px', fill: '#4caf50' }).setOrigin(0.5);
        let instructions = this.add.text(cx, cy - 10, "Look at the top of the screen!\n\nYou have a limited Time limit and a specific number of Nuts.\nYou must feed all the birds before you run out of either.", { fontFamily: 'Arial, sans-serif', fontSize: '28px', fill: '#333333', align: 'center', lineSpacing: 10 }).setOrigin(0.5);

        let btnGraphics = this.add.graphics();
        btnGraphics.fillStyle(0x4caf50, 1);
        btnGraphics.fillRoundedRect(cx - 125, cy + 100, 250, 60, 20);
        let btnText = this.add.text(cx, cy + 130, 'Next Steps', { fontFamily: 'Arial, sans-serif', fontSize: '28px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        let btnZone = this.add.zone(cx, cy + 130, 250, 60).setInteractive();

        btnZone.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            btnGraphics.clear();
            btnGraphics.fillStyle(0x66bb6a, 1);
            btnGraphics.fillRoundedRect(cx - 125, cy + 100, 250, 60, 20);
        });
        
        btnZone.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            btnGraphics.clear();
            btnGraphics.fillStyle(0x4caf50, 1);
            btnGraphics.fillRoundedRect(cx - 125, cy + 100, 250, 60, 20);
        });

        btnZone.on('pointerdown', () => {
            this.input.setDefaultCursor('default');
            
            if (step === 1) {
                step = 2;
                title.setText("Tutorial: The Rules");
                instructions.setText("1. Tap a flying bird to throw a nut.\n2. Once fed, birds look EXACTLY the same.\n3. Do NOT feed the same bird twice!\n\nTry feeding these 3 birds now.");
                btnText.setText("Play Practice");
            } else if (step === 2) {
                this.tweens.add({
                    targets: tutGroup,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        tutGroup.destroy();
                        this.isPaused = false; 
                    }
                });
            }
        });

        tutGroup.add([bgBlocker, modalBg, title, instructions, btnGraphics, btnText, btnZone]);
        
        tutGroup.setScale(0.9);
        this.tweens.add({ targets: tutGroup, scale: 1, duration: 300, ease: 'Back.easeOut' });
    }

    onTimerTick() {
        if (this.isGameOver || this.isPaused) return; 

        this.timeRemaining--;
        this.timerText.setText(`Time: ${this.timeRemaining}s`);

        if (this.timeRemaining <= 0) {
            this.triggerGameOver(false);
        }
    }

    canThrowNut() {
        let now = this.time.now;
        if (now - this.lastThrowTime < this.throwCooldown) return false;
        if (this.currentNuts <= 0 || this.isGameOver || this.isPaused) return false;
        return true;
    }

    monkeyThrowAt(targetBird) {
        this.currentNuts--;
        this.lastThrowTime = this.time.now;
        this.updateUI();

        this.readyNut.setAlpha(0);    
        this.cooldownNut.setAlpha(1); 
        this.cooldownNut.play('nut_fill_anim');
        
        this.cooldownNut.once('animationcomplete', () => {
            this.cooldownNut.setAlpha(0);
            this.readyNut.setAlpha(1);
        });

        this.monkey.play('throw');

        this.time.delayedCall(500, () => {
            let spawnX = this.monkey.x + 50; 
            let spawnY = this.monkey.y - 20; 
            new VisualNut(this, spawnX, spawnY, targetBird, 1.0);
        }, [], this); 

        if (this.currentNuts <= 0 && this.birdsFedCount < this.totalBirds && !this.isGameOver) {
            this.time.delayedCall(1500, () => {
                if (!this.isGameOver) { 
                    this.triggerGameOver(false);
                }
            });
        }
    }

    birdFed() {
        this.birdsFedCount++;
        this.updateUI();
        
        if (this.birdsFedCount >= this.totalBirds) {
            this.triggerGameOver(true);
        }
    }

    showCross(x, y) {
        let cross = this.add.text(x, y, "X", {fontFamily: 'Peralta', fontSize: '80px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5, 0.5);
        this.tweens.add({ targets: cross, y: y - 100, alpha: 0, duration: 1000, onComplete: () => cross.destroy() });
    }

    updateUI() {
        this.nutsText.setText(`Nuts: ${this.currentNuts}`);
        this.birdsFedText.setText(`Fed: ${this.birdsFedCount}/${this.totalBirds}`);
    }

    triggerGameOver(won) {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.levelTimer.remove(); 

        if (won && this.currentLevel !== 'tutorial') {
            let bestLevel = this.registry.get('monkeyBestLevel') || 1;
            if (this.currentLevel >= bestLevel) {
                this.registry.set('monkeyBestLevel', this.currentLevel + 1);
            }
        }

        this.time.delayedCall(1000, () => {
            const cx = this.scale.width / 2;
            const cy = this.scale.height / 2;

            // TWEAK 2: The New Clean End-Game Modal Layout
            let endGroup = this.add.container(0, 0).setDepth(100);

            // Dark Dimmer Overlay
            let overlay = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000);
            overlay.setAlpha(0);

            let modalBg = this.add.graphics();
            
            // 1. White Base Rectangle
            modalBg.fillStyle(0xffffff, 1);
            modalBg.fillRoundedRect(cx - 300, cy - 200, 600, 400, 30);
            
            // 2. Dynamic Colored Header (Green for Win, Red for Loss)
            let headerColor = won ? 0x4caf50 : 0xf44336;
            modalBg.fillStyle(headerColor, 1);
            modalBg.fillRoundedRect(cx - 300, cy - 200, 600, 100, 30);
            modalBg.fillRect(cx - 300, cy - 150, 600, 50); // Flattens the bottom corners of the header!

            // 3. Dynamic Title
            let titleStr = won ? "LEVEL COMPLETE" : "GAME OVER";
            if (this.currentLevel === 'tutorial') titleStr = won ? "TUTORIAL COMPLETE" : "TUTORIAL FAILED";
            let title = this.add.text(cx, cy - 150, titleStr, { fontFamily: 'Arial, sans-serif', fontSize: '40px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

            // 4. Score Calculation & Zoom Text
            let scoreText = "";
            if (this.currentLevel !== 'tutorial' && won) {
                // Generate a satisfying pseudo-score based on time and accuracy
                let calcScore = (this.timeRemaining * 10) + (this.currentNuts * 20) + (this.birdsFedCount * 50);
                scoreText = `Score: ${calcScore}`;
            } else if (this.currentLevel === 'tutorial' && won) {
                scoreText = "Great Job!";
            } else {
                scoreText = "Try Again!";
            }

            let scoreDisplay = this.add.text(cx, cy, scoreText, { fontFamily: 'Arial, sans-serif', fontSize: '60px', fill: '#333333', fontStyle: 'bold' }).setOrigin(0.5);
            scoreDisplay.setScale(0); // Set to 0 so we can zoom it in later!

            // 5. Blinking Action Prompt
            let promptStr = "";
            if (this.currentLevel === 'tutorial') {
                promptStr = won ? "Click to Return to Menu" : "Click to Retry Tutorial";
            } else {
                promptStr = won ? "Click for Next Level" : "Click to Return to Menu";
            }
            let promptText = this.add.text(cx, cy + 120, promptStr, { fontFamily: 'Arial, sans-serif', fontSize: '28px', fill: '#666666' }).setOrigin(0.5);
            promptText.setAlpha(0); // Hidden until zoom finishes

            endGroup.add([overlay, modalBg, title, scoreDisplay, promptText]);

            // The Animation Sequence
            this.tweens.add({
                targets: overlay,
                alpha: 0.8,
                duration: 500,
                onComplete: () => {
                    // Zoom in the Score text!
                    this.tweens.add({
                        targets: scoreDisplay,
                        scale: 1,
                        duration: 500,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            // Start blinking the bottom prompt text
                            this.tweens.add({ targets: promptText, alpha: 1, duration: 800, yoyo: true, repeat: -1 });

                            // Finally, activate the click-to-continue logic
                            this.input.once('pointerdown', () => {
                                this.cameras.main.fadeOut(500, 0, 0, 0);
                                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                                    if (this.currentLevel === 'tutorial') {
                                        if (won) this.scene.start('MenuScene');
                                        else this.scene.restart({ level: 'tutorial' });
                                    } else {
                                        if (won) this.scene.restart({ level: this.currentLevel + 1 });
                                        else this.scene.start('MenuScene');
                                    }
                                });
                            });
                        }
                    });
                }
            });
        });
    }
}

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH, 
        width: 1920, 
        height: 1080 
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);