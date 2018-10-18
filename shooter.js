var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-demo', {
    preload : preload,
    create : create,
    update : update,
    render : render
});

var explosions;
var player;
var enemy2;
var starfield;
var cursors;
var bank;
var shipTrail;
var bullets;
var fireButton;
var bulletTimer = 0;

var ACCLERATION = 600;
var DRAG = 400;
var MAXSPEED = 400;

var MIN_ENEMY_SPACING = 300;
var MAX_ENEMY_SPACING = 1000;
var ENEMY_SPEED = 300;

function preload() {

    // We need this because the assets are on github pages
    // Remove the next 2 lines if running locally
    game.load.baseURL = 'https://spirosbax.github.io/Shooter/';
    game.load.crossOrigin = 'anonymous';

    game.load.image('starfield', 'assets/starfield.png');
    game.load.image('ship', 'assets/ship.png');
    game.load.image('bullet', 'assets/bullets/bullet.png');
    game.load.image('enemy2', 'assets/enemies/enemy2.png');
    game.load.spritesheet('explosion', 'assets/explode.png', 128, 128);

    game.load.audio('background', 'assets/audio/Wice_StarFighter.mp3');
    game.load.audio('shoot', 'assets/audio/EnemyShoot.wav');
    game.load.audio('collide', 'assets/audio/Explosion.wav');
    game.load.audio('hit', 'assets/audio/EnemyDamage.wav');
}

function create() {
    // start background music
    game.add.audio("background", volume=0.2, loop=true).play();

    game.scale.pageAlignHorizontally = true;

    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  Our bullet group
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    //  The hero!
    player = game.add.sprite(100, game.height / 2, 'ship');
    player.anchor.setTo(0.5, 0.5);
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.maxVelocity.setTo(MAXSPEED, MAXSPEED);
    player.body.drag.setTo(DRAG, DRAG);
    player.events.onKilled.add(function(){
        shipTrail.kill();
    });
    player.events.onRevived.add(function(){
        shipTrail.start(false, 5000, 10);
    });
    player.health = 100;
    player.shields = 100;
    player.score = 0;
    player.alive = true;

    //  And some controls to play the game with
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    //  Add an emitter for the ship's trail
    shipTrail = game.add.emitter(player.x - 20, player.y, 400);
    shipTrail.height = 10;
    shipTrail.makeParticles('bullet');
    shipTrail.setYSpeed(20, -20);
    shipTrail.setXSpeed(-140, -120);
    shipTrail.setRotation(50, -50);
    shipTrail.setAlpha(1, 0.01, 800);
    shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000,
            Phaser.Easing.Quintic.Out);
    shipTrail.start(false, 5000, 10);

    // The baddies!
    enemy2 = game.add.group();
    enemy2.enableBody = true;
    enemy2.physicsBodyType = Phaser.Physics.ARCADE;
    enemy2.createMultiple(3, 'enemy2');
    enemy2.setAll('anchor.x', 0.5);
    enemy2.setAll('anchor.y', 0.5);
    enemy2.forEach(function(enemy){
        addEnemyEmitterTrail(enemy);
        enemy.events.onKilled.add(function(){
            enemy.trail.kill();
            enemy.damageAmount = 20;
        });
    });

    //  An explosion pool
    explosions = game.add.group();
    explosions.enableBody = true;
    explosions.physicsBodyType = Phaser.Physics.ARCADE;
    explosions.createMultiple(30, 'explosion');
    explosions.setAll('anchor.x', 0.5);
    explosions.setAll('anchor.y', 0.5);
    explosions.forEach( function(explosion) {
        explosion.animations.add('explosion');
    });

    //  Shields stat
    shields = game.add.text(game.world.width - 150, 10, '', { font: '20px Arial', fill: '#fff' });
    shipHp = game.add.text(game.world.width - 320, 10, '', { font: '20px Arial', fill: '#fff' });
    score = game.add.text(game.world.width - 450, 10, '', { font: '20px Arial', fill: '#fff' });
    statsRender = function () {
        shields.text = 'Shields: ' + Math.max(player.shields, 0) +'%';
        shipHp.text = 'ShipHp: ' + Math.max(player.health, 0) +'%';
        score.text = 'Score: ' + Math.max(player.score, 0);
    };

    game.time.events.add(1000, launchEnemy2);

    //  Game over text
    gameOver = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER!', { font: '84px Arial', fill: '#fff' });
    gameOver.anchor.setTo(0.5, 0.5);
    gameOver.visible = false;
}

function launchEnemy2() {
    var enemy = enemy2.getFirstExists(false);
    if (enemy) {
        enemy.reset(800, game.rnd.integerInRange(player.world.y - 100, player.world.y + 100));
        enemy.body.velocity.x = -ENEMY_SPEED;
        enemy.body.velocity.y = game.rnd.integerInRange(0,-100);
        enemy.body.drag.y = 100;

        enemy.trail.start(false, 800, 1);
        enemy.trail.x = enemy.x;
        enemy.trail.y = enemy.y;

        // Update function for each enemy ship to update rotation etc
        enemy.update = function(){
            enemy.trail.x = enemy.x;
            enemy.trail.y = enemy.y;
        }

        //  Kill enemies once they go off screen
        if (enemy.y > game.height ) {
            enemy.kill();
      }
    }

    //  Send another enemy soon
    enemy2LaunchTimer = game.time.events.add(game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING), launchEnemy2);
    enemy2LaunchTimer = game.time.events.add(game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING), launchEnemy2);
}

function addEnemyEmitterTrail(enemy) {
    var enemyTrail = game.add.emitter(enemy.x, player.y - 10, 100);
    enemyTrail.width = 10;
    enemyTrail.makeParticles('explosion', [1,2,3,4,5]);
    enemyTrail.setXSpeed(20, -20);
    enemyTrail.setRotation(50,-50);
    enemyTrail.setAlpha(0.4, 0, 800);
    enemyTrail.setScale(0.01, 0.1, 0.01, 0.1, 1000, Phaser.Easing.Quintic.Out);
    enemy.trail = enemyTrail;
}

function update() {

    //  Scroll the background
    starfield.tilePosition.x -= 2;

    //  Reset the player, then check for movement keys
    player.body.acceleration.y = 0;
    player.body.acceleration.x = 0;

    if (cursors.up.isDown) {
        player.body.acceleration.y = -ACCLERATION;
    } else if (cursors.down.isDown) {
        player.body.acceleration.y = ACCLERATION;
    } else if (cursors.left.isDown) {
        player.body.acceleration.x = -ACCLERATION;
    } else if (cursors.right.isDown) {
        player.body.acceleration.x = ACCLERATION;
    }

    //  Stop at screen edges
    if (player.x > game.width - 30) {
        player.x = game.width - 30;
        player.body.acceleration.x = 0;
    }
    if (player.x < 30) {
        player.x = 30;
        player.body.acceleration.x = 0;
    }
    if (player.y > game.height - 15) {
        player.y = game.height - 15;
        player.body.acceleration.y = 0;
    }
    if (player.y < 15) {
        player.y = 15;
        player.body.acceleration.y = 0;
    }

    //  Fire bullet
    if (player.alive && (fireButton.isDown || game.input.activePointer.isDown)){
        fireBullet();
    }

    //  Keep the shipTrail lined up with the ship
    shipTrail.y = player.y;
    shipTrail.x = player.x - 20;

    //  Check collisions
    game.physics.arcade.overlap(player, enemy2, shipCollide, null, this);
    game.physics.arcade.overlap(enemy2, bullets, bulletCollide, null, this);

    //  Move ship towards mouse pointer
    if (game.input.y < game.width - 20 &&
        game.input.y > 20 &&
        game.input.x > 20 &&
        game.input.x < game.height - 20) {
        var minDist = 150;
        var disty = game.input.y - player.y;
        var distx = game.input.x - player.x;
        player.body.velocity.y = MAXSPEED * game.math.clamp(disty / minDist, -1, 1);
        player.body.velocity.x = MAXSPEED * game.math.clamp(distx / minDist, -1, 1);
    }

    statsRender();

    //  Game over?
	if (! player.alive && gameOver.visible === false){
        gameOver.visible = true;
        var fadeInGameOver = game.add.tween(gameOver);
        fadeInGameOver.to({alpha: 1}, 1000, Phaser.Easing.Quintic.Out);
        fadeInGameOver.onComplete.add(setResetHandlers);
        fadeInGameOver.start();
        function setResetHandlers() {
            //  The "click to restart" handler
            tapRestart = game.input.onTap.addOnce(_restart,this);
            spaceRestart = fireButton.onDown.addOnce(_restart,this);
            function _restart() {
                tapRestart.detach();
                spaceRestart.detach();
                restart();
            }
        }
        player.kill();
    }
}

function render() {

}

function fireBullet() {
    //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > bulletTimer) {
        var BULLET_SPEED = 400;
        var BULLET_SPACING = 250;
        //  Grab the first bullet we can from the pool
        var bullet = bullets.getFirstExists(false);

        if (bullet) {
            //  And fire it
            //  Make bullet come out of tip of ship with right angle
            var bulletOffset = 20 * Math.sin(game.math
                    .degToRad(player.angle));
            bullet.reset(player.x + bulletOffset, player.y);
            bullet.angle = player.angle;
            game.physics.arcade.velocityFromAngle(bullet.angle,
                    BULLET_SPEED, bullet.body.velocity);
            bullet.body.velocity.y += player.body.velocity.y;

            bulletTimer = game.time.now + BULLET_SPACING;
            game.add.audio('shoot').play();

        }
    }
}

function shipCollide(player, enemy) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(enemy.body.x + enemy.body.halfWidth, enemy.body.y + enemy.body.halfHeight);
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    enemy.kill();

    if(player.shields == 0){
        player.health -= 20;
    }else{
        player.shields -= 50;
    }
    if(player.health == 0){
        player.alive = false;
    }
    statsRender();

    game.add.audio('collide').play();
}


function bulletCollide(enemy, bullet) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(bullet.body.x + bullet.body.halfWidth, bullet.body.y + bullet.body.halfHeight);
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    enemy.kill();
    bullet.kill();

    player.score += 1;
    statsRender();

    game.add.audio('hit').play();
}

function restart () {
    //  Reset the enemies
    enemy2.callAll('kill');
    game.time.events.remove(enemy2LaunchTimer);
    game.time.events.add(1000, launchEnemy2);

    //  Revive the player
    player.revive();
    player.health = 100;
    player.shields = 50;
    player.score = 0;
    player.alive = true;
    stats.render();

    //  Hide the text
    gameOver.visible = false;

}
