var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-demo', {
    preload : preload,
    create : create,
    update : update,
    render : render
});

var explosions;
var player;

var enemy2;
var enemy3;

var enemy2LaunchTimer;
var enemy3LaunchTimer;

var healthUp;
var shieldsUp;
var shredingBullet;
var shredCount = 0
var bulletRain;

var starfield;
var cursors;
var bank;
var shipTrail;
var bullets;
var fireButton;
var bulletTimer = 0;

var timeBetweenWaves = 10000;
var enemy2Spacing = 1000;
var enemy3Launched = false;

var ACCLERATION = 600;
var DRAG = 400;
var MAXSPEED = 400;

var ENEMY_SPEED = 300;
var BULLET_SPEED = 400;
var BULLET_SPACING = 250;

function preload() {

   //We need this because the assets are on github pages
    // Remove the next 2 lines if running locally
    //game.load.baseURL = 'https://spirosbax.github.io/Shooter/';
   // game.load.crossOrigin = 'anonymous';

    game.load.image('starfield', './assets/starfield.png');
    game.load.image('ship', './assets/ship.png');

    game.load.image('bullet', './assets/bullets/bullet.png');
    game.load.image('bullet2', './assets/bullets/bullet2.png');

    game.load.image('enemy2', './assets/enemies/enemy2.png');
    game.load.image('enemy3', './assets/enemies/enemy3.png');
    game.load.image('enemy3Bullet', './assets/bullets/blue-enemy-bullet.png');
    game.load.spritesheet('explosion', './assets/explode.png', 128, 128);

    game.load.image('healthUp', './assets/upgrades/healthUp.png');
    game.load.image('shieldsUp', './assets/upgrades/shieldsUp.png');
    game.load.image('shredingBullet', './assets/upgrades/shredBullet.png');
    game.load.image('tripleBullet', './assets/upgrades/tripleBullet.png');
    game.load.image('bulletRain', './assets/upgrades/bulletRain.png');

    game.load.bitmapFont('font', './assets/font/font.png', './assets/font/font.xml');

    game.load.audio('background', './assets/audio/Wice_StarFighter.mp3');
    game.load.audio('shoot', './assets/audio/EnemyShoot.wav');
    game.load.audio('collide', './assets/audio/Explosion.wav');
    game.load.audio('hit', './assets/audio/EnemyDamage.wav');
    game.load.audio('healthAudio', './assets/audio/healthUp.wav');
    game.load.audio('shieldsAudio', './assets/audio/shieldsUp.ogg');
    // game.load.audio('shieldsDownAudio', './assets/audio/shieldsDown.mp3');
}

function create() {
    // start background music
    game.add.audio("background", 0.2, loop=true).play();

    game.scale.pageAlignHorizontally = true;

    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');

    //  And some controls to play the game with
    cursors = game.input.keyboard.createCursorKeys();
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

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
    player.got_shred = false;
    player.got_triple = false;
    player.got_rain = false;
    player.health = 100;
    player.shields = 100;
    player.score = 0;
    player.alive = true;
    player.damage = function(damageAmount){
        if(this.shields <= 0){
            this.health -= damageAmount;
        }else{
            if (damageAmount > this.shields){
                var remainder = damageAmount - this.shields
                this.shields = 0
                this.health -= remainder
            }else{
                this.shields -= damageAmount
            }
        }
        if(this.health <= 0){
            this.alive = false;
        }
    }

    //  Our bullet group
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 1);
    bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('checkWorldBounds', true);

    // shred bullet
    shredBullet = game.add.group();
    shredBullet.enableBody = true;
    shredBullet.physicsBodyType = Phaser.Physics.ARCADE;
    shredBullet.createMultiple(30, 'bullet2');
    shredBullet.setAll('anchor.x', 0.5);
    shredBullet.setAll('anchor.y', 1);
    shredBullet.setAll('outOfBoundsKill', true);
    shredBullet.setAll('checkWorldBounds', true);

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
    enemy2.createMultiple(5, 'enemy2');
    enemy2.setAll('anchor.x', 0.5);
    enemy2.setAll('anchor.y', 0.5);
    enemy2.forEach(function(enemy){
        addEnemyEmitterTrail(enemy);
        enemy.damageAmount = 30;
        enemy.events.onKilled.add(function(){
            enemy.trail.kill();
        });
    });
    game.time.events.add(1000, launchEnemy2);

    // The baddies!
    enemy3 = game.add.group();
    enemy3.enableBody = true;
    enemy3.physicsBodyType = Phaser.Physics.ARCADE;
    enemy3.createMultiple(30, 'enemy3');
    enemy3.setAll('anchor.x', 0.5);
    enemy3.setAll('anchor.y', 0.5);
    enemy3.setAll('scale.x', 0.5);
    enemy3.setAll('scale.y', 0.5);
	enemy3.setAll('angle', 180);
    enemy3.forEach(function(enemy){
        addEnemyEmitterTrail(enemy);
        enemy.damageAmount = 10;
        enemy.events.onKilled.add(function(){
            enemy.trail.kill();
        });
    });
    // game.time.events.add(1000, launchEnemy3);

    //  Enemy3 enemy's bullets
    enemy3Bullet = game.add.group();
    enemy3Bullet.enableBody = true;
    enemy3Bullet.physicsBodyType = Phaser.Physics.ARCADE;
    enemy3Bullet.createMultiple(30, 'enemy3Bullet');
    enemy3Bullet.callAll('crop', null, {x: 90, y: 0, width: 90, height: 40});
    enemy3Bullet.setAll('alpha', 0.9);
    enemy3Bullet.setAll('anchor.x', 0.5);
    enemy3Bullet.setAll('anchor.y', 0.5);
    enemy3Bullet.setAll('outOfBoundsKill', true);
    enemy3Bullet.setAll('checkWorldBounds', true);
    enemy3Bullet.forEach(function(bullet){
        bullet.damageAmount = 20;
        bullet.body.setSize(20, 20);
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
    shields = game.add.bitmapText(game.world.width - 200, 10, 'font', '');
    shipHp = game.add.bitmapText(game.world.width - 400, 10, 'font', '');
    score = game.add.bitmapText(game.world.width - 600, 10, 'font', '');
    statsRender = function () {
        shields.text = 'Shields: ' + Math.max(player.shields, 0) +'%';
        shipHp.text = 'HP: ' + Math.max(player.health, 0);
        score.text = 'Score: ' + Math.max(player.score, 0);
    };

    //  Game over text
    gameOver = game.add.bitmapText(game.world.centerX, game.world.centerY, 'font', 'GAME OVER!');
    gameOver.anchor.setTo(0.5, 0.5);
    gameOver.visible = false;

    healthUp = game.add.group();
    healthUp.enableBody = true;
    healthUp.physicsBodyType = Phaser.Physics.ARCADE;
    healthUp.createMultiple(30, 'healthUp');

    shieldsUp = game.add.group();
    shieldsUp.enableBody = true;
    shieldsUp.physicsBodyType = Phaser.Physics.ARCADE;
    shieldsUp.createMultiple(30, 'shieldsUp');

    shredingBullet = game.add.group();
    shredingBullet.enableBody = true;
    shredingBullet.physicsBodyType = Phaser.Physics.ARCADE;
    shredingBullet.createMultiple(30, 'shredingBullet');

    tripleBullet = game.add.group();
    tripleBullet.enableBody = true;
    tripleBullet.physicsBodyType = Phaser.Physics.ARCADE;
    tripleBullet.createMultiple(1, 'tripleBullet');

    bulletRain = game.add.group();
    bulletRain.enableBody = true;
    bulletRain.physicsBodyType = Phaser.Physics.ARCADE;
    bulletRain.createMultiple(1, 'bulletRain');
}

function launchUpgrade1() {
    var upgrade = healthUp.getFirstExists(false);
	if (upgrade) {
		upgrade.reset(game.width, game.rnd.integerInRange(100, game.height-100));
		upgrade.body.velocity.x = -ENEMY_SPEED;
		upgrade.body.velocity.y = 0
		upgrade.body.drag.y = 100;

		if (upgrade.y > game.height ) {
			upgrade.kill();
		}
	}
}

function launchUpgrade2() {
    var upgrade = shieldsUp.getFirstExists(false);
	if (upgrade) {
		upgrade.reset(game.width, game.rnd.integerInRange(100, game.height-100));
		upgrade.body.velocity.x = -ENEMY_SPEED;
		upgrade.body.velocity.y = 0
		upgrade.body.drag.y = 100;

		if (upgrade.y > game.height ) {
			upgrade.kill();
		}
	}
}

function launchUpgrade3() {
    var upgrade = shredingBullet.getFirstExists(false);
	if (upgrade) {
		upgrade.reset(game.width, game.rnd.integerInRange(100, game.height-100));
		upgrade.body.velocity.x = -ENEMY_SPEED;
		upgrade.body.velocity.y = 0
		upgrade.body.drag.y = 100;

		if (upgrade.y > game.height ) {
			upgrade.kill();
		}
	}
}

function launchUpgrade4() {
    var upgrade = tripleBullet.getFirstExists(false);
	if (upgrade) {
		upgrade.reset(game.width, game.rnd.integerInRange(100, game.height-100));
		upgrade.body.velocity.x = -ENEMY_SPEED;
		upgrade.body.velocity.y = 0
		upgrade.body.drag.y = 100;

		if (upgrade.y > game.height ) {
			upgrade.kill();
		}
	}
}

function launchUpgrade5() {
    var upgrade = bulletRain.getFirstExists(false);
	if (upgrade) {
		upgrade.reset(game.width, game.rnd.integerInRange(100, game.height-100));
		upgrade.body.velocity.x = -ENEMY_SPEED;
		upgrade.body.velocity.y = 0
		upgrade.body.drag.y = 100;

		if (upgrade.y > game.height ) {
			upgrade.kill();
		}
	}
}


function launchEnemy2() {
    // var MIN_ENEMY_SPACING = 300;
    // var MAX_ENEMY_SPACING = 1000;

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
    }else{
        console.log("No enemies left")
    }

    //  Send another enemy soon
    enemy2LaunchTimer = game.time.events.add(game.rnd.integerInRange(enemy2Spacing, enemy2Spacing + 1000), launchEnemy2);
}

function launchEnemy3() {
    var startingY = game.rnd.integerInRange(100, game.height - 100);
    var horizontalSpeed = 180;
    var spread = 60;
    var frequency = 70;
    var horizontalSpacing = 70;
    var numEnemiesInWave = 3;

    //  Launch wave
    for (var i =0; i < numEnemiesInWave; i++) {
        var enemy = enemy3.getFirstExists(false);
        if (enemy) {
            enemy.startingY = startingY;
            enemy.reset(800 + (horizontalSpacing * i), game.height / 2)
            enemy.body.velocity.x = -horizontalSpeed;

            //  Set up firing
            var bulletSpeed = 400;
            var firingDelay = 2000;
            enemy.bullets = 2;
            enemy.lastShot = 0;

            //  Update function for each enemy
            enemy.update = function(){
                //  Wave movement
                this.body.y = this.startingY + Math.sin((this.x) / frequency) * spread;

                //  Squish and rotate ship for illusion of "banking"
                bank = Math.cos((this.x + 60) / frequency)
                this.scale.y = 0.5 - Math.abs(bank) / 8;
                this.angle = 180 - bank * 2;
                					//  Fire
                enemyBullet = enemy3Bullet.getFirstExists(false);
                if (enemyBullet &&
                    this.alive &&
                    this.bullets &&
                    this.y > game.width / 8 &&
                    game.time.now > firingDelay + this.lastShot) {
                        this.lastShot = game.time.now;
                        this.bullets--;
                        enemyBullet.reset(this.x, this.y + this.height / 2);
                        var angle = game.physics.arcade.moveToObject(enemyBullet, player, bulletSpeed);
                        enemyBullet.angle = game.math.radToDeg(angle);
                    }

                //  Kill enemies once they go off screen
                if (this.y > game.width + 400) {
                    this.kill();
                    this.x = -20;
                }
            }
        }
    }

    //  Send another wave soon
    enemy3LaunchTimer = game.time.events.add(game.rnd.integerInRange(timeBetweenWaves, timeBetweenWaves + 4000), launchEnemy3);
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
    game.physics.arcade.overlap(enemy2, shredBullet, bulletCollide, null, this);

    // player with upgrades
    game.physics.arcade.overlap(player, healthUp, playerHeal, null, this);
    game.physics.arcade.overlap(player, shieldsUp, playerShieldsFix, null, this);
    game.physics.arcade.overlap(player, shredingBullet, playerShredBullet, null, this);
    game.physics.arcade.overlap(player, tripleBullet, playerTripleBullet, null, this);
    game.physics.arcade.overlap(player, bulletRain, playerBulletRain, null, this);

    // enemy 3
    game.physics.arcade.overlap(player, enemy3, shipCollide, null, this); // player with enemy3

    game.physics.arcade.overlap(enemy3, bullets, bulletCollide, null, this); // bullet with enemy3
    game.physics.arcade.overlap(enemy3, shredBullet, bulletCollide, null, this); // shred bullet with enemy3

    game.physics.arcade.overlap(player, enemy3Bullet, enemyHitsPlayer, null, this);

    //  Move ship towards mouse pointer
    if (game.input.y < game.width - 20 &&
        game.input.y > 20 &&
        game.input.x > 20 &&
        game.input.x < game.height - 20) {
        var minDist = 20;
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
   BULLET_SPACING = player.got_rain ? 50 : BULLET_SPACING

    if (!player.got_triple) {
		//  To avoid them being allowed to fire too fast we set a time limit
		if (game.time.now > bulletTimer) {
            var bullet;
            if (player.got_shred){
                bullet = shredBullet.getFirstExists(false);
                shredCount--
            }else{
                bullet = bullets.getFirstExists(false);
            }
			if (bullet) {
				//  And fire it
				//  Make bullet come out of tip of ship with right angle
				var bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
				bullet.reset(player.x + bulletOffset, player.y);
				bullet.angle = player.angle;
				game.physics.arcade.velocityFromAngle(bullet.angle, BULLET_SPEED, bullet.body.velocity);
				bullet.body.velocity.y += player.body.velocity.y;

				bulletTimer = game.time.now + BULLET_SPACING;

 			    game.add.audio('shoot', 0.5).play();
			}
		}
    }else{
		if (game.time.now > bulletTimer) {
			for (var i = 0; i < 3; i++) {
				if (player.got_shred){
					bullet = shredBullet.getFirstExists(false);
					shredCount--
				}else{
					bullet = bullets.getFirstExists(false);
				}
				if (bullet) {
					//  Make bullet come out of tip of ship with right angle
					var bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
					bullet.reset(player.x + bulletOffset, player.y);
					//  "Spread" angle of 1st and 3rd bullets
					var spreadAngle;
					if (i === 0) spreadAngle = -20;
					if (i === 1) spreadAngle = 0;
					if (i === 2) spreadAngle = 20;
					bullet.angle = player.angle + spreadAngle;
					game.physics.arcade.velocityFromAngle(spreadAngle , BULLET_SPEED, bullet.body.velocity);
				}
				bulletTimer = game.time.now + BULLET_SPACING;
			}
 			game.add.audio('shoot', 0.5).play();
		}
	}
}

function shipCollide(player, enemy) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(enemy.body.x + enemy.body.halfWidth, enemy.body.y + enemy.body.halfHeight);
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);

    player.damage(enemy.damageAmount);
    enemy.kill();
    statsRender();
    game.add.audio('collide', 0.5).play();
}


function bulletCollide(enemy, bullet) {

    if (player.score > 0) {
        if (player.score % 5 == 0) {
            launchUpgrade1()
        }
        if (player.score % 10 == 0) {
            launchUpgrade2()
        }
        if (player.score % 20 == 0) {
            if (!player.got_triple) {
                launchUpgrade4()
            }
        }

        if (player.score % 30 == 0) {
            launchUpgrade3()
        }

        if (player.score % 40 == 0) {
            launchUpgrade5()
        }
    }
    // if (player.shields == 0) {
    //     player.shieldDownPlaying = true
    //     console.log("SHIELDS DOWN")
    //     game.add.audio('shieldsDownAudio').play();
    // }

    var explosion = explosions.getFirstExists(false);
    explosion.reset(bullet.body.x + bullet.body.halfWidth, bullet.body.y + bullet.body.halfHeight);
    explosion.body.velocity.y = enemy.body.velocity.y;
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    enemy.kill();
    if (!player.got_shred) {
        bullet.kill();
    }

    player.score += 1;
    statsRender();

    game.add.audio('hit', 0.2).play();

    //  Pacing
    var scoreThreshold = 5
    //  Enemies come quicker as score increases
    enemy2Spacing *= 0.9;
    //  Blue enemies come in after a score of 1000
    if (!enemy3Launched && player.score >= scoreThreshold) {
        console.log("LAUNCH ENEMY3")
        // update time between waves
        launchEnemy3();
        enemy3Launched = true;
        //  Slow green enemies down now that there are other enemies
        enemy2Spacing *= 2;
    }else if(enemy3Launched){
        //accelerate rate of enemy3 launches
        timeBetweenWaves *= 0.5
    }
    if ((shredCount <= 0) && (player.got_shred)) {
        player.got_shred = false
        console.log("Shred end");
    }
}

function enemyHitsPlayer(player, bullet) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x + player.body.halfWidth, player.body.y + player.body.halfHeight);
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);

    player.damage(bullet.damageAmount);
    bullet.kill();
    statsRender();
}

function playerHeal(player, healthUp){
    healthUp.kill()
    player.health = 100
    game.add.audio('healthAudio',0.5).play();
    console.log("GOT healthUp")
}

function playerShieldsFix(player, shieldsUp){
    shieldsUp.kill()
    player.shields = 100
    game.add.audio('shieldsAudio').play();
    console.log("GOT shields")
}

function playerShredBullet(player, shredBullet){
    shredBullet.kill()
    player.got_shred = true
    shredCount = 40
    console.log("GOT shred")
}

function playerTripleBullet(player, tripleBullet){
    tripleBullet.kill()
    player.got_triple = true
    console.log("GOT triple")
}

function playerBulletRain(player, bulletRain){
    bulletRain.kill()
    player.got_rain = true
    console.log("GOT rain")
}

function restart () {
    //  Reset the enemies
    BULLET_SPACING = 250
    enemy2.callAll('kill');
    enemy3.callAll('kill');
    enemy3Bullet.callAll('kill');
    healthUp.callAll('kill');
    shieldsUp.callAll('kill');
    shredBullet.callAll('kill');
    tripleBullet.callAll('kill');
    bulletRain.callAll('kill');

    player.got_shred = false
    player.got_triple = false
    shredCount = 0

    game.time.events.remove(enemy2LaunchTimer);
    game.time.events.add(1000, launchEnemy2);
    game.time.events.add(1000, launchUpgrade1);
    game.time.events.remove(enemy3LaunchTimer);

    //  Reset pacing
    enemy2Spacing = 1000;
    enemy3Launched = false

    //  Hide the text
    gameOver.visible = false;

    //  Revive the player
    player.revive();
    player.health = 100;
    player.shields = 50;
    player.score = 0;
    player.alive = true;
    statsRender();
}
