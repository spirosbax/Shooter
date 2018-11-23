var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameDiv')
console.log("Height:" + game.height);
console.log("Width:" + game.width);

// phaser state
var menu;
var level1;
var level2;

// enemies
var enemy2;
var enemy3;
var boss1;
var boss1BankX = 0;
var bossDeath;

// timers
var enemy2LaunchTimer;
var enemy3LaunchTimer;
var rainTimeout;

// player variables
var explosions;
var player;
var healthUp;
var shieldsUp;
var shredingBullet;
var shredCount = 0
var bulletRain;

// other
var starfield;
var cursors;
var bank;
var shipTrail;
var bullets;
var fireButton;
var bulletTimer = 0;

// tweakers
var timeBetweenWaves = 10000;
var enemy2Spacing = 1000;
var enemy3Launched = false;

var ACCLERATION = 4000;
var DRAG = 6000;
var MAXSPEED = 800;

var ENEMY_SPEED = 300;
var BULLET_SPEED = 400;
var BULLET_SPACING = 250;

game.state.add('level1', level1);
game.state.add('menu', menu);
game.state.start('menu')


function click1() {
    game.state.start('level1');
}

function launchHealthUp() {
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

function launchShieldsUp() {
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

function launchShredingBullet() {
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

function launchTripleBullet() {
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

function launchRain() {
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
    var enemy = enemy2.getFirstExists(false);
    if (enemy) {
        enemy.reset(800, game.rnd.integerInRange(player.world.y - 100, player.world.y + 100));
        enemy.body.velocity.x = -ENEMY_SPEED;
        enemy.body.velocity.y = game.rnd.integerInRange(0,-100);
        enemy.body.drag.y = 100;

        enemy.trail.start(false,800,1);

        // Update function for each enemy ship to update rotation etc
        enemy.update = function(){
            enemy.trail.x = enemy.x;
            enemy.trail.y = enemy.y;

            //kill enemies once they go off screen
            if (enemy.x < 0) {
                enemy.kill();
            }
        }
    }else{
        console.log("no enemies left")
    }

    // Send another enemy soon
    enemy2LaunchTimer = game.time.events.add(game.rnd.integerInRange(enemy2Spacing,enemy2Spacing+1000),launchEnemy2);
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
                this.angle = -bank * 2;
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


function fireBullet() {
    current_spacing = player.got_rain ? 100 : BULLET_SPACING
    if (shredCount <= 0) {
        player.got_shred = false
    }

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

				bulletTimer = game.time.now + current_spacing;

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
				bulletTimer = game.time.now + current_spacing;
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
    player.score += 1;

    if (player.score > 0) {
        if (player.score % 5 == 0) {
            launchHealthUp()
        }
        if (player.score % 11 == 0) {
            launchShieldsUp()
        }
        if (player.score % 23 == 0) {
            console.log(!player.got_triple);
            if (!player.got_triple) {
                launchTripleBullet()
            }
        }

        if (player.score % 34 == 0) {
            launchShredingBullet()
        }

        if (player.score % 43 == 0) {
            launchRain()
        }

        if (player.score == 1) {
            launchBoss()
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

function playerHitsBoss(boss1, bullet) {
    // console.log("BOSS inside playerHitsBoss");
    // console.log(boss1);

    bullet.kill()
    game.add.audio('hit', 0.2).play();
    if (player.got_shred) {
        boss1.hp -= 10
        player.score += 10
    } else {
        boss1.hp -= 1
        player.score += 1
    }

    if (boss1.hp < 5) {
        boss1.finishOff();
    }
}

function enemyHitsPlayer(player, bullet) {
    var explosion = explosions.getFirstExists(false);
    explosion.reset(player.body.x + player.body.halfWidth, player.body.y + player.body.halfHeight);
    explosion.alpha = 0.7;
    explosion.play('explosion', 30, false, true);
    // TODO add explosion sound

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
    console.log("GOT RAIN");
    game.time.events.add(4000, () => {
        player.got_rain = false
        console.log("RAIN STOPED");
    })

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
    boss1.kill()

    player.got_shred = false
    player.got_triple = false
    shredCount = 0

    game.time.events.remove(enemy2LaunchTimer);
    game.time.events.add(1000, launchEnemy2);
    game.time.events.add(1000, launchHealthUp);
    game.time.events.remove(enemy3LaunchTimer);

    //  Reset pacing
    enemy2Spacing = 1000;
    enemy3Launched = false

    //  Hide the text
    gameOver.visible = false;

    //  Revive the player
    player.revive();
    player.health = 100;
    player.shields = 100;
    player.score = 0;
    player.alive = true;
    statsRender();
}

function launchBoss() {
    game.time.events.remove(enemy2LaunchTimer);
    game.time.events.remove(enemy3LaunchTimer);
    console.log("Launch BOSS(1)");
    boss1.reset(game.width / 2 + 550, game.height / 2);
}

function bossHitTest(boss, bullet) {
    if ((bullet.x > boss.x + boss.width / 5 &&
        bullet.y > boss.y) ||
        (bullet.x < boss.x - boss.width / 5 &&
        bullet.y > boss.y)) {
      return false;
    } else {
      return true;
    }
}
