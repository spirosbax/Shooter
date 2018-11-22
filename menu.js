var menu = {
    preload: () => {
        game.load.image('starfield','./assets/starfield.png');
        game.load.image('lvl1','./assets/lvl1.png',10,10);

        game.load.bitmapFont('font', './assets/font/font.png', './assets/font/font.xml');
    },
    create: () => {
        starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield'); 

        button1 = game.add.button(75,50, "lvl1", click1 , this, function(){});
        button1.scale.setTo(0.3,0.3);

		// button2 = game.add.button(game.width-200,50, "lvl2", click2, this, function(){});
        // button2.scale.setTo(0.3,0.3)
    },
    update: function() {
        starfield.tilePosition.y += background_speed;
    }
}
