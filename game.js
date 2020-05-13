// Create Scenes
let titleScene = new Phaser.Scene('titleScene');
let gameScene = new Phaser.Scene('gameScene');
let gameOver = new Phaser.Scene('gameOver');
let newGame = new Phaser.Scene('newGame');
let helpMenu = new Phaser.Scene('helpMenu');

let player;
let cursors;
let platforms;
let banana;
let score = 0;
let scoreText;
let lives = 3;
let livesText;
let monster;
let go = false;

// Phaser Config
let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 300},
            debug: false
        }
    },
    scene: {
        titleScene,
        gameScene,
        newGame,
        helpMenu,
        gameOver
    }
};

let game = new Phaser.Game(config);

// Add scenes to Game
game.scene.add('titleScene', titleScene);
game.scene.add('gameScene', gameScene);
game.scene.add('newGame', newGame);
game.scene.add('helpMenu', helpMenu);
game.scene.add('gameOver', gameOver);

// Start the title scene
game.scene.start('titleScene');

// Load title scene assets
titleScene.preload = function () {
    // Load images for title scene
    this.load.image('background', 'images/bg.jpg');
}

// Create title scene
titleScene.create = function () {
    // Add background to game
    this.add.sprite(0, 0, 'background');

    // Used to set font for game
    let style = {font: "bold 32px Arial", fill: "#000", boundsAlignH: "center", boundsAlignV: "middle"};

    // Used to add text to the game
    this.add.text(250, 150, 'Collect Them All', style);
    this.add.text(100, 200, 'You must collect all bananas without being caught by the enemy', {
        font: "bold 20px Arial", fill: "#000", boundsAlignH: "center", boundsAlignV: "middle"
    });

    // Holds start button
    const start = this.add.text(350, 500, 'Start', style);
    start.setInteractive({useHandCursor: true});
    // When clicked start, change to game scene
    start.on('pointerdown', () => {
        this.scene.start('gameScene');
    });
}

// Load images and audio for game scene
gameScene.preload = function () {
    this.load.image('background', 'images/bg.jpg');
    this.load.image('banana', 'images/banana.png');
    this.load.image('monster', 'images/monster.png');
    this.load.image('platform', 'images/platform.png');
    this.load.spritesheet('player',
        'images/sprite.png',
        {frameWidth: 32, frameHeight: 48}
    );

    this.load.audio('over', 'sounds/gameover.mp3');
    this.load.audio('collect', 'sounds/collect.mp3');
    this.load.audio('fail', 'sounds/fail.mp3');
};

// Create game scene
gameScene.create = function () {
    // Add background to game
    this.add.sprite(0, 0, 'background');

    // Create platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(900, 600, 'platform').setScale(6).refreshBody();
    platforms.create(200, 400, 'platform').refreshBody();
    platforms.create(680, 300, 'platform').setScale(1.1).refreshBody();
    platforms.create(200, 150, 'platform').setScale(.6).refreshBody();

    // Create player
    player = this.physics.add.sprite(400, 300, 'player');
    // Sets how high player can jump
    player.setBounce(1.1);
    // Does not allow player to go through objects
    player.setCollideWorldBounds(true);

    // Used update player when it moves left
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });
    // Update player when it turns
    this.anims.create({
        key: 'turn',
        frames: [{key: 'player', frame: 4}],
        frameRate: 20
    });
    // Update player when it moves right
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player', {start: 5, end: 8}),
        frameRate: 10,
        repeat: -1
    });
    player.body.setGravityY(300);
    // Used to determine keyboard input
    cursors = this.input.keyboard.createCursorKeys();

    // Generate bananas
    banana = this.physics.add.group({
        key: 'banana',
        setXY: {x: Math.random() * 700, y: Math.random() * 500}
    });

    // Prevent monster from generating on top of player
    let x = Math.random() * (700) + 50;
    if(x >= 400 && x < 500) x += 200;

    // Generate monster
    monster = this.physics.add.group({
        key: 'monster',
        setXY: {x: x, y: Math.random() * 500}
    });
    // Used to make monster float
    monster.children.iterate(function (child) {
        child.setBounceX(1);
        child.setBounceY(1);
    });

    // Prevent overlaps with platform
    this.physics.add.collider(banana, platforms);
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(monster, platforms);

    // Show score and lives
    scoreText = this.add.text(16, 16, 'Score: 0', {fontSize: '32px', fill: '#000'});
    livesText = this.add.text(16, 46, 'Lives: 3', {fontSize: '32px', fill: '#000'});

    // When player collects banana, call collectBanana function
    this.physics.add.overlap(player, banana, collectBanana, null, this);
    // When player collides into monster, call hitMonster function
    this.physics.add.collider(player, monster, hitMonster, null, this);
};

// Called when player collects banana
function collectBanana(player, banana) {
    // Play sound when banana collected
    this.sound.play('collect');
    score += 10;
    // Change score
    scoreText.setText('Score: ' + score);
    // Remove banana from screen
    banana.disableBody(true, true);

    // Create new bananas
    banana = this.physics.add.group({
        key: 'banana',
        setXY: {x: Math.random() * 700, y: 0}
    });
    // Separate banana and platform
    this.physics.add.collider(banana, platforms);
    // When player collects banana, call collectBanana function
    this.physics.add.overlap(player, banana, collectBanana, null, this);
}

// Called when player collides into monster
function hitMonster(player, monster) {
    // If player has no more lives, end the game
    if (lives === 0) {
        this.sound.play('over');
        go = true;
    }
    // Else, subtract lives and update text
    else if (lives > 0) {
        this.sound.play('fail');
        lives -= 1;
        livesText.setText('Lives: ' + lives);
        monster.disableBody(true, true);
        // Generate new monster
        monster = this.physics.add.group({
            key: 'monster',
            setXY: {x: Math.random() * (700) + 50, y: Math.random() * 500}
        });
        // Allows monster to float
        monster.children.iterate(function (child) {
            child.setBounceX(1);
            child.setBounceY(1);
        });
        // Separate monster and platform
        this.physics.add.collider(monster, platforms);
        // When player collides into monster, call hitMonster function
        this.physics.add.collider(player, monster, hitMonster, null, this);
    }
}

// Update function when player moves and certain key pressed
gameScene.update = function () {
    // If h is pressed, pause the game and launch help menu
    this.input.keyboard.on('keydown_H', function (event) {
        this.scene.pause('gameScene');
        this.scene.launch('helpMenu');
    }, this);
    // If n is pressed, pause the game and launch new game menu
    this.input.keyboard.on('keydown_N', function (event) {
        this.scene.pause('gameScene');
        this.scene.launch('newGame');
    }, this);
    // If the game is over, remove the player and launch game over scene
    if (go) {
        player.setActive(false).setVisible(false);
        this.scene.pause('gameScene');
        this.scene.launch('gameOver');
    }
    // If arrow key is left, play this animation
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    }
    // If arrow key is right, play this animation
    else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    }
    // Otherwise play the turn animation
    else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }
    // If arrow key is up
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

// Scene for new game
newGame.create = function () {
    // Create Rectangles to hold text
    let graphics = this.add.graphics();
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillRect(300, 175, 230, 150);

    // Rectangle for yes button
    graphics.fillStyle(0x999999, 1);
    graphics.fillRect(315, 250, 75, 30);

    //Rectangle for no button
    graphics.fillStyle(0x999999, 1);
    graphics.fillRect(415, 250, 60, 30);

    // Create text for 'New Game?'
    this.add.text(325, 200, 'New Game?', {fontSize: '32px', fill: '#000'});
    // Create text for yes
    let yes = this.add.text(325, 250, 'Yes', {fontSize: '32px', fill: '#000'});
    // Show hand cursor when hover and make text into a button
    yes.setInteractive({useHandCursor: true});
    // When yes is selected, launch a new game
    yes.on('pointerdown', () => {
        this.scene.launch('gameScene');
        this.scene.stop('newGame');
    });
    //Create text for no
    let no = this.add.text(425, 250, 'No', {fontSize: '32px', fill: '#000'});
    no.setInteractive({useHandCursor: true});
    // When no is selected, resume game
    no.on('pointerdown', () => {
        this.scene.stop('newGame')
        this.scene.resume('gameScene');
    });

}

// Create help menu
helpMenu.create = function () {
    // Create rectangle to hold text
    let graphics = this.add.graphics();
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillRect(300, 175, 350, 270);

    // Text for help menu
    this.add.text(375, 200, 'Help Menu', {fontSize: '32px', fill: '#000'});
    this.add.text(410, 250, 'Rules', {fontSize: '25px', fill: '#000'});
    this.add.text(310, 280, 'Collect as much bananas as you can', {fontSize: '15px', fill: "#000"});
    this.add.text(340, 300, 'while avoiding the monster.', {fontSize: '15px', fill: "#000"});
    this.add.text(390, 325, 'Commands', {fontSize: '25px', fill: '#000'});
    this.add.text(330, 355, 'Use arrow keys to move and jump.', {fontSize: '15px', fill: '#000'});
    this.add.text(330, 370, 'Press N to open New Game menu.', {fontSize: '15px', fill: '#000'});
    this.add.text(360, 400, 'Press any key to exit.', {fontSize: '15px', fill: '#000'});
}

// When any key is pressed, resume game
helpMenu.update = function () {
    this.input.keyboard.on('keydown', function (event) {
        this.scene.stop('helpMenu');
        this.scene.resume('gameScene');
    }, this);
}

// Scene for game over
gameOver.create = function () {
    // Display text on screen
    this.add.text(325, 200, 'Game Over', {fontSize: '32px', fill: '#000'});
    this.add.text(250, 250, 'Press N for New Game', {fontSize: '32px', fill: '#000'});
}
// Update scene when key pressed
gameOver.update = function () {
    this.input.keyboard.on('keydown_N', function (event) {
        // Stop current scene
        this.scene.stop('gameOver');

        // Reset game over boolean
        go = false;
        // Reset lives and score
        lives = 3;
        score = 0;
        //Update score and lives text
        scoreText.setText('Score: ' + score);
        livesText.setText('Lives: ' + lives);

        // Launch game scene
        this.scene.launch('gameScene');
    }, this);
}