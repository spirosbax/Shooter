var level2 = {
    preload: function() {
        game.load.image('starfield', './assets/starfield.png');
        game.load.image('ship', './assets/ship.png');

        game.load.image('bullet', './assets/bullets/bullet.png');
        game.load.image('shredingBullet', './assets/bullets/bullet2.png');

        game.load.image('enemy2', './assets/enemies/enemy1.png');
        game.load.image('enemy3', './assets/enemies/green-enemy.png');
        game.load.image('enemy3Bullet', './assets/bullets/blue-enemy-bullet.png')

        game.load.image('boss2', './assets/enemies/boss2.png');
        game.load.spritesheet('explosion', './assets/explode.png', 128, 128);

        game.load.image('healthUp', './assets/upgrades/healthUp.png');
        game.load.image('shieldsUp', './assets/upgrades/shieldsUp.png');
        game.load.image('shredBulletUp', './assets/upgrades/shredBullet.png');
        game.load.image('tripleBullet', './assets/upgrades/tripleBullet.png');
        game.load.image('bulletRain', './assets/upgrades/bulletRain.png');

        game.load.bitmapFont('font', './assets/font/font.png', './assets/font/font.xml');

        game.load.audio('background', './assets/audio/Wice_StarFighter.mp3');
        game.load.audio('shoot', './assets/audio/EnemyShoot.wav');
        game.load.audio('collide', './assets/audio/Explosion.wav');
        game.load.audio('hit', './assets/audio/EnemyDamage.wav');
        game.load.audio('healthAudio', './assets/audio/healthUp.wav');
        game.load.audio('shieldsAudio', './assets/audio/shieldsUp.ogg');
    },

    create: function() {
        cur_level = 2
        enemy3Angle = 270
        enemy3Launched = false
        // start background music
        game.add.audio("background", 0.2, loop=true).play();
        game.scale.pageAlignHorizontally = true;
        //  The scrolling starfield background
        starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');
        //  And some controls to play the game with
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        wUp = game.input.keyboard.addKey(Phaser.Keyboard.W);
        aLeft = game.input.keyboard.addKey(Phaser.Keyboard.A);
        sDown = game.input.keyboard.addKey(Phaser.Keyboard.S);
        dRight = game.input.keyboard.addKey(Phaser.Keyboard.D);

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
        player.health = 200
        console.log("IN LEVEL 2");
        player.shields = 200;
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

        // boss2 code
        boss2 = game.add.sprite(0, 0, 'boss2');
        game.physics.enable(boss2, Phaser.Physics.ARCADE);
        boss2.startingY = game.height/2
        boss2.exists = false;
        boss2.alive = false;
        boss2.anchor.setTo(0.5, 0.5);
        boss2.damageAmount = 50;
        boss2.hp = 2000
        boss2.angle = 270;
        boss2.scale.x = 0.6;
        boss2.scale.y = 0.6;
        boss2.body.maxVelocity.setTo(100, 80);
        boss2.dying = false;
        boss2.finishOff = function() {
           if (!boss2.dying) {
                boss2.dying = true;
                bossDeath.x = boss2.x;
                bossDeath.y = boss2.y;
                bossDeath.start(false, 1000, 50, 20);
                //  kill boss2 after explotions
                game.time.events.add(1000, function(){
                    var explosion = explosions.getFirstExists(false);
                    var beforeScaleX = explosions.scale.x;
                    var beforeScaleY = explosions.scale.y;
                    var beforeAlpha = explosions.alpha;
                    explosion.reset(boss2.body.x + boss2.body.halfWidth, boss2.body.y + boss2.body.halfHeight);
                    explosion.alpha = 0.4;
                    explosion.scale.x = 3;
                    explosion.scale.y = 3;
                    var animation = explosion.play('explosion', 30, false, true);
                    animation.onComplete.addOnce(function(){
                        explosion.scale.x = beforeScaleX;
                        explosion.scale.y = beforeScaleY;
                        explosion.alpha = beforeAlpha;
                        game.add.audio('collide', 1).play();
                    });
                    boss2.kill();
                    boss2.dying = false;
                    bossDeath.on = false;

                });
               wonLevel2();
            };
        };

        boss2.fire = function() {
            for (let i = 0; i < 3; ++i) {
                enemyBullet = enemy3Bullet.getFirstExists(false);
                if (enemyBullet && this.x && this.y) {
                    enemyBullet.reset(this.x, (this.y - 20 - (30*i)) + this.height / 2);
                    var angle = game.physics.arcade.moveToObject(enemyBullet, player, bulletSpeed);
                    enemyBullet.angle = game.math.radToDeg(angle);
                }
            }
        };

        boss2.update = function() {
            if (!boss2.alive) return;
            var angleToPlayer = game.math.radToDeg(game.physics.arcade.angleBetween(boss2, player)) - 90;
            var anglePointing = 180 - Math.abs(boss2.angle);
            if (anglePointing - angleToPlayer < 18) {
                boss2.fire();
            }
        }

        //  Big explosion for boss2
        bossDeath = game.add.emitter(boss2.x, boss2.y);
        bossDeath.width = boss2.width / 2;
        bossDeath.height = boss2.height / 2;
        bossDeath.makeParticles('explosion', [0,1,2,3,4,5,6,7], 20);
        bossDeath.setAlpha(0.9, 0, 900);
        bossDeath.setScale(0.3, 1.0, 0.3, 1.0, 1000, Phaser.Easing.Quintic.Out);

        //  Our bullet group
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 1);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        // shredingBullet
        shredingBullet = game.add.group();
        shredingBullet.enableBody = true;
        shredingBullet.physicsBodyType = Phaser.Physics.ARCADE;
        shredingBullet.createMultiple(30, 'shredingBullet');
        shredingBullet.setAll('anchor.x', 0.5);
        shredingBullet.setAll('anchor.y', 1);
        shredingBullet.setAll('outOfBoundsKill', true);
        shredingBullet.setAll('checkWorldBounds', true);

        //  Add an emitter for the ship's trail
        shipTrail = game.add.emitter(player.x - 20, player.y, 400);
        shipTrail.height = 10;
        shipTrail.makeParticles('bullet');
        shipTrail.setYSpeed(20, -20);
        shipTrail.setXSpeed(-140, -120);
        shipTrail.setRotation(50, -50);
        shipTrail.setAlpha(1, 0.01, 800);
        shipTrail.setScale(0.05, 0.4, 0.05, 0.4, 2000, Phaser.Easing.Quintic.Out);
        shipTrail.start(false, 5000, 10);

        // The baddies!
        enemy2 = game.add.group();
        enemy2.enableBody = true;
        enemy2.physicsBodyType = Phaser.Physics.ARCADE;
        enemy2.createMultiple(5, 'enemy2');
        enemy2.setAll('anchor.x', 0.5);
        enemy2.setAll('anchor.y', 0.5);
        enemy2.setAll('scale.x', 2);
        enemy2.setAll('scale.x', 2);
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
        enemy3.forEach(function(enemy){
            addEnemyEmitterTrail(enemy);
            enemy.damageAmount = 10;
            enemy.events.onKilled.add(function(){
                enemy.trail.kill();
            });
        });

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

        tripleBullet = game.add.group();
        tripleBullet.enableBody = true;
        tripleBullet.physicsBodyType = Phaser.Physics.ARCADE;
        tripleBullet.createMultiple(30, 'tripleBullet');

        shredBulletUp = game.add.group();
        shredBulletUp.enableBody = true;
        shredBulletUp.physicsBodyType = Phaser.Physics.ARCADE;
        shredBulletUp.createMultiple(30, 'shredBulletUp');

        bulletRain = game.add.group();
        bulletRain.enableBody = true;
        bulletRain.physicsBodyType = Phaser.Physics.ARCADE;
        bulletRain.createMultiple(30, 'bulletRain');

        // console.log("boss2 AFTER CREATED");
        // console.log(boss2);
    },


    update: function() {
        //  Scroll the background
        starfield.tilePosition.x -= 2;
        //  Reset the player, then check for movement keys
        player.body.acceleration.y = 0;
        player.body.acceleration.x = 0;

        if (cursors.up.isDown || wUp.isDown) {
            player.body.acceleration.y = -ACCLERATION;
        } else if (cursors.down.isDown || sDown.isDown) {
            player.body.acceleration.y = ACCLERATION;
        } else if (cursors.left.isDown || aLeft.isDown) {
            player.body.acceleration.x = -ACCLERATION;
        } else if (cursors.right.isDown || dRight.isDown) {
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

        if (boss2.alive) {
            if (boss2.x > game.width / 2 + 150) {
                boss2.x -= 1
            } else {
                boss2.y = boss2.startingY + Math.sin((boss1BankX) / 70) * 100;
                boss1BankX += 1
            }

        }

        //  Check collisions
        game.physics.arcade.overlap(player, enemy2, shipCollide, null, this);
        game.physics.arcade.overlap(enemy2, bullets, playerHitEnemy, null, this);
        game.physics.arcade.overlap(enemy2, shredingBullet, playerHitEnemy, null, this);

        // enemy 3
        game.physics.arcade.overlap(player, enemy3, shipCollide, null, this); // player with enemy3
        game.physics.arcade.overlap(enemy3, bullets, playerHitEnemy, null, this); // bullet with enemy3
        game.physics.arcade.overlap(enemy3, shredingBullet, playerHitEnemy, null, this); // shred bullet with enemy3
        game.physics.arcade.overlap(player, enemy3Bullet, enemyHitsPlayer, null, this);

        // boss2
        // console.log("boss2 IN UPDATE");
        // console.log(boss2);
        game.physics.arcade.overlap(boss2, bullets, playerHitsBoss, bossHitTest, this);
        game.physics.arcade.overlap(boss2, shredingBullet, playerHitsBoss, bossHitTest, this);
        game.physics.arcade.overlap(player, boss2.rayLeft, rayHitsPlayer, null, this);
        game.physics.arcade.overlap(player, boss2.rayRight, rayHitsPlayer, null, this);

        // player with upgrades
        game.physics.arcade.overlap(player, healthUp, playerHeal, null, this);
        game.physics.arcade.overlap(player, shieldsUp, playerShieldsFix, null, this);
        game.physics.arcade.overlap(player, shredBulletUp, playerShredBullet, null, this);
        game.physics.arcade.overlap(player, tripleBullet, playerTripleBullet, null, this);
        game.physics.arcade.overlap(player, bulletRain, playerBulletRain, null, this);

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
    },
};
