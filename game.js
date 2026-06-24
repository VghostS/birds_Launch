class Bird extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);

        this.setScale(0.4); 
        this.play('bird_fly'); 

        // Your custom randomizations
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
        // If data.level exists, use it. Otherwise, default to 1.
        this.currentLevel = data.level || 1;
        
        // Define level parameters based on the current level
        if (this.currentLevel === 1) {
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
        }
    }

    preload() {
        this.load.image('bg', 'assets/bg.png'); 
        this.load.image('tree', 'assets/tree.png');
        this.load.image('nut', 'assets/nut.png'); 

        this.load.spritesheet('bird_sheet', 'assets/bird.png', { frameWidth: 406, frameHeight: 368 });
        
        // Your custom monkey frames
        this.load.spritesheet('monkey_idle', 'assets/monkey_idle.png', { frameWidth: 800, frameHeight: 450 });
        this.load.spritesheet('monkey_throw', 'assets/monkey_throw.png', { frameWidth: 784, frameHeight: 441 });
    }

    create() {
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;
        const centerX = gameWidth / 2;

        let bg = this.add.image(centerX, gameHeight / 2, 'bg'); 
        bg.setDisplaySize(gameWidth, gameHeight);
        this.tree = this.add.sprite(gameWidth - 1850, gameHeight - 580, 'tree');

        // --- Game Manager Variables ---
        // this.totalBirds = 5; 
        // this.currentNuts = 5;
        this.birdsFedCount = 0;
        // this.timeRemaining = 25; 
        this.isGameOver = false;

        this.throwCooldown = 1000; 
        this.lastThrowTime = 0;

        // --- Centered UI Setup ---
        this.timerText = this.add.text(centerX, 20, `Time: ${this.timeRemaining}s`, { fontFamily: 'Peralta', fontSize: '40px', fill: '#ffcc00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);
        this.nutsText = this.add.text(centerX - 300, 20, `Nuts: ${this.currentNuts}`, { fontFamily: 'Peralta', fontSize: '40px', fill: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);
        this.birdsFedText = this.add.text(centerX + 300, 20, `Fed: 0/${this.totalBirds}`, { fontFamily: 'Peralta', fontSize: '40px', fill: '#ffffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);

        this.cooldownBarBg = this.add.rectangle(centerX - 300, 80, 150, 10, 0x000000).setOrigin(0.5, 0);
        this.cooldownBar = this.add.rectangle(centerX - 300, 80, 150, 10, 0x00ff00).setOrigin(0.5, 0);

        // Timer Tick Event
        this.levelTimer = this.time.addEvent({
            delay: 1000,
            callback: this.onTimerTick,
            callbackScope: this,
            loop: true
        });

        // --- Monkey Setup ---
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('monkey_idle', { start: 0, end: 53 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'throw', frames: this.anims.generateFrameNumbers('monkey_throw', { start: 0, end: 8 }), frameRate: 15, repeat: 0 });

        // Your custom monkey positioning
        this.monkey = this.add.sprite(gameWidth - 1750, gameHeight - 520, 'monkey_idle');
        this.monkey.scale = 0.5; 
        this.monkey.play('idle');

        this.monkey.on('animationcomplete-throw', () => {
            this.monkey.play('idle');
        });

        // --- Bird Setup ---
        this.anims.create({ key: 'bird_fly', frames: this.anims.generateFrameNumbers('bird_sheet', { start: 0, end: 37 }), frameRate: 25, repeat: -1 });

        this.birds = []; 
        for (let i = 0; i < this.totalBirds; i++) {
            let startY = 150 + (i * 100); 
            let newBird = new Bird(this, 300 + Math.random()*500, startY, 'bird_sheet');
            this.birds.push(newBird);
        }

        if(this.currentLevel === 1) {
        // Add the instructional text to the center of the screen
        let instructions = this.add.text(centerX, gameHeight-150, 
            "Tap the bird to throw the nut.\nThey look the same once fed,\nso remember who's eaten!", { 
            fontFamily: 'Peralta', // <-- Right here!
            fontSize: '35px', 
            fill: '#ffffff', 
            align: 'center',
            stroke: '#000000', 
            strokeThickness: 8 
        }).setOrigin(0.5);

        // Tween to fade it out after a delay
        this.tweens.add({
            targets: instructions,
            alpha: 0,           // Fade to transparent
            delay: 4000,        // Wait 4 seconds before fading
            duration: 1000,     // Take 1 second to fade out
            onComplete: () => instructions.destroy() // Remove from memory when done
        });
    }
    }

    // --- Core Logic ---

    onTimerTick() {
        if (this.isGameOver) return;

        this.timeRemaining--;
        this.timerText.setText(`Time: ${this.timeRemaining}s`);

        if (this.timeRemaining <= 0) {
            this.triggerGameOver(false);
        }
    }

    canThrowNut() {
        let now = this.time.now;
        if (now - this.lastThrowTime < this.throwCooldown) return false;
        if (this.currentNuts <= 0 || this.isGameOver) return false;
        return true;
    }

    birdFed() {
        this.birdsFedCount++;
        this.updateUI();
        
        // We ONLY check for the Win condition here now.
        // We will check for the Lose condition after the nut is actually thrown.
        if (this.birdsFedCount >= this.totalBirds) {
            this.triggerGameOver(true);
        } 
    }

    monkeyThrowAt(targetBird) {
        this.currentNuts--;
        this.lastThrowTime = this.time.now;
        this.updateUI();

        // Cooldown Bar Animation
        this.cooldownBar.width = 0;
        this.tweens.add({
            targets: this.cooldownBar,
            width: 150,
            duration: this.throwCooldown,
            ease: 'Linear'
        });

        this.monkey.play('throw');

        // Delay nut spawn to match monkey animation
        this.time.delayedCall(500, () => {
            let spawnX = this.monkey.x + 50; 
            let spawnY = this.monkey.y - 20; 
            new VisualNut(this, spawnX, spawnY, targetBird, 1.0);
        }, [], this); 

        // --- NEW: The "Out of Ammo" Loss Check ---
        // If we have 0 nuts, haven't fed all birds, and haven't already won...
        if (this.currentNuts <= 0 && this.birdsFedCount < this.totalBirds && !this.isGameOver) {
            
            // We use a delayed call here (1500ms) so the game doesn't instantly end 
            // the millisecond you click. This gives the player time to see the monkey 
            // throw the last nut and watch it hit (or see the red X) before the screen fades to black.
            this.time.delayedCall(1500, () => {
                if (!this.isGameOver) { // Double check in case the timer ran out during this 1.5 seconds
                    this.triggerGameOver(false);
                }
            });
        }
    }

    birdFed() {
        this.birdsFedCount++;
        this.updateUI();
        
        // We ONLY check for the Win condition here now.
        // We will check for the Lose condition after the nut is actually thrown.
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

    // --- End Game & Transitions ---
    triggerGameOver(won) {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.levelTimer.remove(); // Stop the timer

        // Delay the UI pop-up slightly to let the nut hit the bird
        this.time.delayedCall(1000, () => {
            const centerX = this.scale.width / 2;
            const centerY = this.scale.height / 2;

            // Create a black screen overlay (alpha 0 to start)
            let overlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000);
            overlay.setAlpha(0);

            // Fade in the black overlay (Equivalent to blackANim in Unity)
            this.tweens.add({
                targets: overlay,
                alpha: 0.8,
                duration: 1000,
                onComplete: () => {
                    // Show Win/Loss Text
                    let message = won ? "YOU WIN!" : "GAME OVER";
                    let color = won ? "#00ff00" : "#ff0000";
                    
                    this.add.text(centerX, centerY - 50, message, {fontFamily: 'Peralta', fontSize: '100px', fill: color, fontStyle: 'bold' }).setOrigin(0.5);
                    let promptString = won ? "Click anywhere for Next Level!" : "Click anywhere to Restart Level!";
                    let restartText = this.add.text(centerX, centerY + 80, promptString, { fontSize: '40px', fill: '#ffffff' }).setOrigin(0.5);

                    // Blink the restart text
                    this.tweens.add({ targets: restartText, alpha: 0, duration: 800, yoyo: true, repeat: -1 });

                    // Wait for a click to reload the scene (Equivalent to SceneManager.LoadScene)
                    this.input.once('pointerdown', () => {
                        if (won) {
                            // Go to next level!
                            this.scene.restart({ level: this.currentLevel + 1 });
                        } else {
                            // Restart current level on loss
                            this.scene.restart({ level: this.currentLevel });
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
    scene: [GameScene]
};

const game = new Phaser.Game(config);