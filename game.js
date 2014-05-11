/************************************
	Panda Class
************************************/

Panda = function () {

	this.cursors = game.input.keyboard.createCursorKeys();
    this.jumpSound = game.add.audio("jump");
    this.isDead = false;
 
    Panda.prototype.create = function () {

    	this.sprite = game.add.sprite(game.world.centerX, -30, 'panda');
	    game.physics.arcade.enable(this.sprite);
	 	
	    this.sprite.body.bounce.y = 0.3;
	    this.sprite.body.gravity.y = 300;
		this.sprite.body.setSize(20, 14, 5, 16);

		this.sprite.animations.add('left', [9, 10, 11], 10, true);
		this.sprite.animations.add('stand', [0], 20, true);
		this.sprite.animations.add('right', [6, 7, 8], 10, true);

    };

    Panda.prototype.update=  function () {

    	if(!this.isDead){

	    	if (this.cursors.right.isDown) {
	            this.sprite.body.velocity.x = 150;
	            this.sprite.animations.play('right');
	        }
	        if (this.cursors.left.isDown) {
	            this.sprite.body.velocity.x = -150;
	            this.sprite.animations.play('left');
	        }
	  
	        if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
	            this.sprite.body.velocity.x = 0;
	            this.sprite.animations.play('stand');
	        }

    	}


    };

    Panda.prototype.jump= function () {
        this.sprite.body.velocity.y = -450;
        this.jumpSound.play();
    }



};

/************************************
	Tire Class
************************************/
Tire = function () {

    this.sprite;
    this.setVelocity = true;
    this.touched = false;
    /* 80 - 150 */
    this.speed = Math.floor(Math.random()*(150-80+1)+80);

};
Tire.prototype = {

    create: function (ledgeWidth) {

    	// position for the tire to fall from
    	var defaultPosition = game.rnd.integerInRange(
    		game.world.centerX - ledgeWidth.width / 2 + 10, 
    		game.world.centerX + ledgeWidth.width / 2 - 10
    	);
    	this.sprite = game.add.sprite(defaultPosition, -50, "tires", 2);
    	game.physics.enable(this.sprite);

       	this.sprite.body.bounce.y = 0.7;
        this.sprite.body.velocity.y = 250;
        this.sprite.body.acceleration.y = 0;
        this.sprite.body.allowGravity = false;
        this.sprite.body.setSize(32, 32, 0, 0)

        this.sprite.animations.add('left', [0, 1, 2, 3, 0, 1, 2, 3], 10, true);
		this.sprite.animations.add('stand', [0], 20, true);
		this.sprite.animations.add('right', [3, 2, 1, 0, 3, 2, 1, 0], 10, true);

    },
    update: function () {
        if (this.sprite.y > game.world.height + 20) {
            this.sprite.kill();
            score++;
        }
    }
};



/************************************
	Game Class
************************************/
pandaPanic = function () {



    pandaPanic.prototype.create = function () {

    	this.score = 0;
    	this.tires = [];

    	game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 900;

    	game.add.tileSprite(0, 0, game.world.width, game.world.height, "jungleBackground");

        this.collisionSound = game.add.audio("collision");
        this.cursors = game.input.keyboard.createCursorKeys();

        this.panda  	= new Panda();
        this.panda.create();

        this.scoreCpt 	= new ScoreDisplay();
        this.scoreCpt.create();
        

        // set background and ledge
        this.ledge = game.add.sprite(game.world.centerX, 400, "ledge");
        this.ledge.anchor.setTo(.5);

        game.physics.enable(this.ledge, Phaser.Physics.ARCADE);
        this.ledge.body.allowGravity = false;
        this.ledge.body.immovable = true;

 		// clock
        this.clock = game.time.events;
        this.clock.start();
        this.clock.loop(2e3, this.generateTire, this);

    }

    pandaPanic.prototype.update =  function () {

        this.panda.update();
       

        // tires
        if (this.tires.length != 0) {

            for (var j = 0; j < this.tires.length; j++) {

	            if (this.tires[j] != undefined) {

			            if (this.tires[j].sprite.y > game.world.height + 20) {
			                this.tires[j].sprite.kill();
			                this.tires.splice(j, 1);
			                this.score++
			            }

	            game.physics.arcade.collide(this.ledge, this.tires[j].sprite, function () {
	                this.tires[j].sprite.body.allowGravity = true;
	                if (this.tires[j].setVelocity) {
	                    if (this.tires[j].sprite.x < game.world.centerX) {
	                        this.tires[j].sprite.body.velocity.x = +this.tires[j].speed;
	                        this.tires[j].sprite.animations.play('left');
	                    } else {
	                        this.tires[j].sprite.body.velocity.x = -this.tires[j].speed;
	                        this.tires[j].sprite.animations.play('right');
	                    }
	                    this.tires[j].setVelocity = false
	                }
	            }, null, this);

			            // collision with a tire
			            game.physics.arcade.collide(this.panda.sprite, this.tires[j].sprite, function () {
			                
			                for (var j = 0; j < this.tires.length; j++) {
			                    this.tires[j].sprite.kill();
			                    this.clock.destroy()
			                }

			                this.panda.sprite.body.velocity.y = -500;
			                this.collisionSound.play();
			                this.endGame();

			            }, null, this)

	                }
            }
        }

       
        game.physics.arcade.collide(this.panda.sprite, this.ledge, function () {}, null, this);
       
         // Falling down
        if (this.panda.sprite.y > game.world.height + 20) {

            for (var j = 0; j < this.tires.length; j++) {
                if (this.tires[j] != undefined) {
                    this.tires[j].sprite.kill();
                    this.clock.destroy()
                }
            }
			this.endGame();
        }

        if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && this.panda.sprite.body.touching.down) {
            this.panda.jump();
        }


        // saves the score
        if(localStorage.getItem("pandaScore")!=null && localStorage.getItem("pandaScore")<this.score){
        	localStorage.setItem("pandaScore", this.score);
        }
        this.scoreCpt.update(this.score);

    };


    pandaPanic.prototype.endGame = function (){

    	if(!this.panda.isDead){
    		this.collisionSound.play();
    	}

        this.ledge.body = null;
        this.opab = new OpacityBuilder();
        this.opab.create();
        this.opab.fadeIn("setMenu", 1e3, 2e3);

        this.panda.isDead = true;

    };

    pandaPanic.prototype.generateTire =  function () {

        var e = this.tires.length;
        this.tires[e] = new Tire();
        this.tires[e].create(this.ledge);

    }


};





/************************************
	Menu Class
************************************/
setMenu = function () {

    setMenu.prototype.create = function () {

    	// background
        game.add.tileSprite(0, 0, 
        	game.world.width, 
        	game.world.height, 
        	"jungleBackground"
        );
        // logo
        this.logo = game.add.sprite(
        	game.world.centerX, 
        	game.world.centerY , 
        	"logo"
        );
        // center logo
        this.logo.anchor.setTo( .5);

    };

    setMenu.prototype.update = function () {

        if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        	// animation
            var e = game.add.tween(this.logo);
            e.to({
                alpha: 0
            }, 1e3, Phaser.Easing.Linear.Out, true, 0, 0, true);
            e.onComplete.add(function () {
                game.state.start("pandaPanic", false, false)
            }, this)
        }
    };

   

};


/************************************
	Score Displayer Class
************************************/
ScoreDisplay = function () {

    ScoreDisplay.prototype.create = function () {
    	this.style = { font: "17px Arial", fill: "#ffffff"};
    	this.currentScore = game.add.text(560, 10, '', this.style);
    	this.currentScore.setShadow(0, 0, 'rgba(0,0,0,1)', 5);
    };

    ScoreDisplay.prototype.update = function (e, t) {
        this.currentScore.setText("Score: " + e +"\nHighscore: " + this.getHighscore());
    };

    ScoreDisplay.prototype.getHighscore = function () {
        return localStorage.getItem("pandaScore") == null ? 0 : localStorage.getItem("pandaScore");
    };

};



/************************************
	Inits the game / sets the loader
************************************/
initGame = function (){


    initGame.prototype.preload = function () {
        game.load.image("loader",  "assets/loadbar.png");
        game.load.image("overlay", "assets/1px.png")
    };

     initGame.prototype.create = function () {
        game.state.start("preload")
    };
};




/************************************
	Preloading
************************************/
preloadGame = function () {

    preloadGame.prototype.preload = function () {

        this.opab = new OpacityBuilder();
        this.opab.create();

        this.preloader = this.add.sprite(0, game.world.centerY, "loader");
        this.preloader.width = 650;
        this.preloader.height = 5;
        this.preloader.anchor.setTo(.5);

        this.load.setPreloadSprite(this.preloader);

        // loading assets
        game.load.image("overlay", "assets/1px.png");
        game.load.image("ledge", "assets/ledge.png");

        //http://www.vectorfree.com/jungle-plant-background
        game.load.image("jungleBackground", "assets/bgg.jpg");
       
        // http://textcraft.net/
        game.load.image("logo", "assets/pandapanic.png");

        // http://www.softicons.com/web-icons/fatcow-hosting-additional-icons-by-fatcow/tire-icon
        game.load.spritesheet("tires", "assets/tires.png", 32, 32);
        // https://bitbucket.org/c_xong/hectic-panda/src/34cf553732f3fae6de7dfb44bd67eff2c662dbb1/images/Panda_0.png?at=master
        game.load.spritesheet("panda", "assets/panda.png", 32, 32);

        // 
        game.load.audio("collision", ["assets/sounds/game_ov.wav"]);
        //http://www.freesound.org/people/fins/sounds/133280/
        game.load.audio("jump", ["assets/sounds/jump.wav"]);
        //http://www.newgrounds.com/audio/listen/575926
        game.load.audio("music", ["assets/sounds/loop.mp3"]);

    };

    preloadGame.prototype.create = function () {

        this.music = game.add.audio("music", 1, true);
        this.music.play("", 0, 1, true);
        this.preloader.alpha = 0;
        this.opab.fadeIn("setMenu", 1200, 0);

    };

};


/************************************
	Opacity Builder Class
************************************/
OpacityBuilder = function () {

    OpacityBuilder.prototype.create  = function () {
        this.overlay = game.add.tileSprite(0, 0, game.world.width, game.world.height, "overlay");
        this.overlay.alpha = 1;
    };

    OpacityBuilder.prototype.fadeIn = function (e, t, n) {

        this.overlay.alpha = 0;
        var r = game.add.tween(this.overlay);
        r.to({
            alpha: 1
        }, t, Phaser.Easing.Linear.Out, true, n, 0, true);
        r.onComplete.add(function () {
            game.state.start(e, false, false);
            this.overlay.alpha = 0
        }, this)

    };


};



/************************************
	Inits the game
************************************/
var game 		= new Phaser.Game(680, 480, Phaser.CANVAS, '');
// game boot and load
game.state.add( 'boot', initGame, true );
game.state.add('preload', preloadGame);
// menu and the score
game.state.add('setMenu',   setMenu);
// game container 
game.state.add('pandaPanic', pandaPanic);