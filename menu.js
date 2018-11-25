var menu = {
    preload: () => {
        game.load.image('starfield','./assets/starfield.png');
        game.load.image('lvl1','./assets/lvl1.png',10,10);
        game.load.image('lvl2','./assets/lvl2.png',10,10);

        game.load.bitmapFont('font', './assets/font/font.png', './assets/font/font.xml');
    },
    create: () => {
        starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield')

        button1 = game.add.button(game.width/2 - 100,game.height/2 - 200, "lvl1", click1 , this, function(){})
        button2 = game.add.button(game.width/2 - 100,game.height/2 - 50, "lvl2", click2 , this, function(){})
    },
    update: function() {
        starfield.tilePosition.x -= 2
    }
}
