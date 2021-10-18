
// for setting up levels
var levelMap;

// sound
var bg1;
var bg2;
var scene1_rocks;
var scene2_rocks;
var doveS;
var bgMusic;
var walk;
var jumpS;
var portalS;
var wind;

// preload images and sounds
function preload() {
    bg1 = loadImage("images/backdrop1.jpg");
    bg2 = loadImage("images/backdrop2.jpg");
    scene1_rocks = loadImage("images/scene_1_rocks.png");
    scene2_rocks = loadImage("images/scene_2_rocks.png");
    doveS = new Audio('sounds/whistle.mp3');
    bgMusic = new Audio('sounds/Mae.mp3');
    walk = new Audio("sounds/walk.mp3");
    jumpS = new Audio("sounds/jump.mp3");
    portalS = new Audio("sounds/portal.mp3");
    wind = new Audio("sounds/wind.mp3");
    doveS.volume = 0.05;
    doveS.reverb = 1;
    jumpS.volume = 0.25;
    portalS.volume = 0.05;
    wind.volume = 0.5;
}

function setup()
{
    createCanvas(2000, 1000 /*, WEBGL */);
    angleMode(DEGREES);

    levelMap = [
        
    // 0
    {
        Canvas: 1900, // canvas width 
        CanvasH: 1000, // canvas height
        
        player: new Player(250, 450, 30, 100), // player
        
        portal: new Portal(1700, 600, 50, 50), // portal
        
        // bezier curves
        curves: [new Curv(200, 610, 705, 640, -100), new Curv(170 + 700, 590, 590 + 700, 550, -110), new Curv(170 + 800, 550, 570 + 800, 520, -75), new Curv(170 + 1350, 710, 570 + 1200, 700, -40), new Curv(170 + 1350 + 200, 710, 500 + 1200 + 200, 700, -30)],
        
        // doves
        hope: [new Hope (1100, 400)],
        
        // evil black squids
        badplayer: [],
        
        // story text
        storytxt: [
        new StoryTxt("- this is the wonderful world of anastasia yadira -", 300, 200, 30, -15,
        100, 200, 600, 400, false),
        new StoryTxt("- anastasia needs to gather hope -", 1000, 200, 30, -5,
        900, 400, 100, 200, false),
        new StoryTxt("- anastasia needs some relief -", 1200, 300, 30, 5,
        1150, 300, 100, 200, false),
        new StoryTxt("- here, in this land, of desemira -", 1650, 450, 25, 15,
        1400, 530, 300, 200, false)],

    },
        
    // 1
    {
        Canvas: 3000, // canvas width
        CanvasH: 1000, // canvas height
        
        player: new Player(100, 580, 30, 100), // player
        
        portal: new Portal(2820, 520, 50, 50), // portal
        
        // bezier curves
        curves: [new Curv(75, 800, 300, 750, -50),
                 new Curv(50, 500, 320, 545, -20), 
                 new Curv(430, 670, 700, 650, -80), 
                 new Curv(430, 430, 530, 420, -35), 
                 new Curv(610, 330, 730, 340, -20), 
                 new Curv(800, 260, 900, 250, -35), 
                 new Curv(400, 90, 700, 150, -30), 
                 new Curv(165, 200, 270, 200, -20), 
                 new Curv(1015, 340, 1230, 330, -25), 
                 new Curv(1420, 340, 1600, 330, -20), 
                 new Curv(1830 - 10, 360 + 10, 1960, 380, -25), 
                 new Curv(1830 + 335 - 10, 360 + 10, 1960 + 335, 380, -25), 
                 new Curv(1830 + 665 - 10, 360 + 10, 1960 + 665, 380, -20), 
                 new Curv(2070 + 665, 600, 1960 + 1000, 610, -30)],
        
        // doves
        hope: [new Hope (200, 120), new Hope (1500, 240)],
        
        // evil black squids
        badplayer: [new Badplayer(550, 520, 410, 660, "left", 1),
                   new Badplayer(550, 10, 410, 660, "right", 2)],
        
        // story text
        storytxt: [],
        

        },
    ];
}


// for scouting map
var scoutMap = [0, 0];

// transition for scenes
var trans = 0;

// detect when portal can be open
var portalAccess = false;

// for curve detection
var pi = Math.PI;

// current level
var level = 0;

// camera for game
var cam;

// for rectangular collision hit boxes
function rectCollide (one, two) {
    return one.x + one.w > two.x &&
        one.y + one.h > two.y &&
        one.x < two.x + two.w &&
        one.y < two.y + two.h;
};

// camera that is set to follow an element (player in this case)
class Camera {

    constructor (x, y) {
        this.x = x; this.y = y; this.w = innerWidth; this.h = innerHeight;
    }
    
    view (plyer) {
        this.x=plyer.x;
        this.y=plyer.y;
        this.w = innerWidth;
        this.h = innerHeight;
        this.x = constrain(this.x,this.w/2, levelMap[level].Canvas - this.w/2);
        this.y = constrain(this.y,this.h/2, levelMap[level].CanvasH - this.h / 2);
        translate((this.w / 2) - this.x,(this.h / 2) - this.y);
    };
};

// particles for snow effect
var particles = { x: [], y: [], s: [], r: [], upAmount: [] };

/** Key stuff **/
var keys = [];
function keyPressed () {
    keys[keyCode] = true;
};
function keyReleased (){
    keys[keyCode] = false;
};

// for reseting game when dead
function reset () {
    
    trans = 50;
    
    levelMap[level].player.x = levelMap[level].player.origx;
    levelMap[level].player.y = levelMap[level].player.origy;
    levelMap[level].player.g = 0;
    
    for(var i in levelMap[level].hope)
    {
        levelMap[level].hope[i].collected = false;
        levelMap[level].hope[i].anim = levelMap[level].hope[i].s;
        levelMap[level].hope[i].fadeIn = 0;
        levelMap[level].hope[i].fly = 2000;
    }
};

// hope sprite
function hope () {

    push();
    translate(270, 226);
    scale(2.7);
    rotate(- 4 + sin(frameCount * 10) * 12);
    ellipse(12,0,25,4);
    rotate(1 + sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 + sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 + sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 + sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 + sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 + sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    pop();
    
    push();
    translate(239, 226);
    scale(-2.7);
    rotate(- 4 - sin(frameCount * 10) * 12);
    ellipse(12,0,25,4);
    rotate(1 - sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 - sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 - sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 - sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 - sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    rotate(1 - sin(frameCount * 10) * 10);
    ellipse(12,0,25,4);
    pop();
}
function hopeSprite (x, y, s) {
    push();
    translate(x, y + sin(frameCount * 5) * 4);
    scale(s / 100);
    noFill();
    stroke(255, 255, 255, 30);
    strokeWeight(5);
    ellipse(255,224,31,37);
    hope();
    stroke(255, 255, 255);
    strokeWeight(1);
    hope();
    strokeWeight(2);
    ellipse(255,224,25,30);
    ellipse(251,220,1,1);
    ellipse(259,220,1,1);
    triangle(250, 226, 254, 230, 258, 226);
    pop();
}

// class for dove
class Hope {
    constructor (x, y) {
        this.x = x; this.y = y;
        this.w = 40; this.h = 40;
        this.s = 40;
        this.collected = false;
        this.anim = this.s;
        this.fadeIn = 0;
        this.fly = 2000;
    }
    draw () {
        
        // if collect start effect
        if (this.collected === true)
        {
            noStroke();
            fill(255, 255, 255, 50 - this.fadeIn);
            ellipse(this.x + this.s / 2, this.y + this.fadeIn / 2, this.fadeIn * 1.5, this.fadeIn * 1.5);
            ellipse(this.x + this.s / 2, this.y + this.fadeIn / 2, this.fadeIn, this.fadeIn);
            ellipse(this.x, this.y, this.fadeIn, this.fadeIn);
            ellipse(this.x + this.fadeIn, this.y, this.fadeIn, this.fadeIn);
        }

        hopeSprite(this.x - 108, this.y - 94 - 2000 + this.fly, 50);
        
        // play dove chirps
        if(rectCollide(this, levelMap[level].player) && this.collected === false)
        {
            doveS.play();
            this.collected = true;
        }
        
        // make bird fly if collected
        if (this.collected === true)
        {
            this.fly /= 1.003;
            this.fadeIn += 2;
        }
    }
}

// class for portal
class Portal {
    
    constructor (x, y, w, h) {
        this.particles = { x: [], y: [], s: [], r: [], upAmount: [] };
        this.x = x;  this.y = y;
        this.w = w;  this.h = h;
    }
    
    draw () {
        
        // start particle effect if portal is activated 
        if(portalAccess)
        {
            
            // go to next level once collided
            if(levelMap[level].player.x + levelMap[level].player.w >= this.x && 
            levelMap[level].player.y + levelMap[level].player.h >= this.y &&
            levelMap[level].player.x <= this.x + this.w &&
            levelMap[level].player.y <=  this.y + this.h)
            {
                portalS.play();
                reset();
                level ++;
            }
            
            // particle effect
            fill(250, 242, 243, 150);
            noStroke();
            
            for(var i = 0; i < this.particles.x.length; ++i)
            {
                push();
                translate(this.particles.x[i], this.particles.y[i]);
                rotate(this.particles.r[i]);
                ellipse(0, this.particles.upAmount[i], this.particles.s[i], this.particles.s[i]);
                pop();

                this.particles.s[i] -= 2;
                this.particles.upAmount[i] += this.particles.s[i] / 20;

                if(this.particles.s[i] <= 0)
                {
                    this.particles.x[i] = this.x + this.w / 2;
                    this.particles.y[i] = this.y + this.h / 2;
                    this.particles.s[i] = random(0, this.w);
                    this.particles.r[i] = random(0, 360);
                    this.particles.upAmount[i] = 0;
                }

            }

            if(this.particles.x.length <= 50)
            {
                this.particles.x.push(10000);
                this.particles.y.push(10000);
                this.particles.s.push(random(0, this.w));
                this.particles.r.push(random(0, 360));
            }
        }
        
        // base portal
        noFill();
        stroke(255, 255, 255, 50);
        strokeWeight(5);
        ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w/1.1, this.h/1.1);
        strokeWeight(8);
        ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w/1.1, this.h/1.1);
        stroke(255, 255, 255);
        strokeWeight(2);
        ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w/1.1, this.h/1.1);
    }
};

// slender enemy sprite
function slender (sw) {
    
    noFill();
    ellipse(193, 179, 100, 100);
    bezier(195, 229, 159+ sin(frameCount * 6) * 5, 269+ sin(frameCount * 6) * 5, 153+ sin(frameCount * 6) * 5, 282, 182+ sin(frameCount * 1) * 4, 356+ sin(frameCount * 5) * 2);
    bezier(207, 228, 225+ sin(frameCount * 6) * 5, 269+ sin(frameCount * 6) * 5, 153+ sin(frameCount * 4) * 6, 282, 223+ sin(frameCount * 6) * 5, 356+ sin(frameCount * 3) * 19);
    bezier(198, 230, 225+ sin(frameCount * 6) * 5, 332+ sin(frameCount * 6) * 5, 153+ sin(frameCount * 4) * 3, 244, 149+ sin(frameCount * 4) * 6, 356+ sin(frameCount * 7) * 10);
    bezier(170, 224, 108+ sin(frameCount * 6) * 5, 325+ sin(frameCount * 6) * 5, 190+ sin(frameCount * 5) * 6, 242, 125+ sin(frameCount * 3) * 8, 356+ sin(frameCount * 3) * 8);
    bezier(218, 224, 196+ sin(frameCount * 6) * 5, 338+ sin(frameCount * 6) * 5, 271+ sin(frameCount * 8) * 4, 297, 242+ sin(frameCount * 7) * 10, 356+ sin(frameCount * 4) * 6);
    bezier(218, 223, 269+ sin(frameCount * 6) * 5, 361+ sin(frameCount * 6) * 5, 231+ sin(frameCount * 5) * 5, 339, 232+ sin(frameCount * 3) * 19, 356+ sin(frameCount * 6) * 5);
    bezier(213, 225, 249+ sin(frameCount * 6) * 5, 354+ sin(frameCount * 6) * 5, 200+ sin(frameCount * 2) * 18, 273, 215+ sin(frameCount * 5) * 2, 356+ sin(frameCount * 1) * 4);
    bezier(178, 227, 204, 301+ sin(frameCount * 6) * 5, 156, 258, 168+ sin(frameCount * 6) * 8, 356);
    
    line(225, 139, 250, 128);
    line(162, 139, 134, 128);
    line(243, 169, 250, 128);
    line(144, 169, 134, 128);
    
    if(sw === "left")
    {
        push();
        translate(-10, -10);
        line(163, 200, 176, 180);
        line(193, 200, 176, 180);
        line(193, 200, 209, 180);
        line(223, 200, 209, 180);
        pop();
    }
    
    if(sw === "right")
    {
        push();
        translate(10, -10);
        line(163, 200, 176, 180);
        line(193, 200, 176, 180);
        line(193, 200, 209, 180);
        line(223, 200, 209, 180);
        pop();
    }
}
function slenderSprite (sw, x, y, s) {
    push();
    translate(x, y);
    scale(s / 100);
    stroke(0, 0, 0, 50);
    strokeWeight(15);
    slender(sw);
    stroke(0);
    strokeWeight(3);
    slender(sw);
    pop();
}

// slender class
class Badplayer {
    
    constructor (x, y, leftBound, rightBound, switcher, speed) {
        this.x = x;  this.y = y;
        this.w = 30;  this.h = 60;
        this.s = speed;  this.g = 1;
        this.xorig = x; this.yorig = y;
        this.leftBound = leftBound;  this.rightBound = rightBound;
        this.switcher = switcher;
    }
    
    draw () {
        fill(255);
        slenderSprite(this.switcher, this.x - 39, this.y - 38, 28);
    }
    
    update () {
        
        // go from left and right
        if(this.x <= this.leftBound) { this.switcher = "right"; }
        if(this.x >= this.rightBound) { this.switcher = "left"; }
        if(this.switcher === "left") { this.x -= this.s; }
        if(this.switcher === "right") { this.x += this.s; }
        
        // set gravity for slender
        this.y += this.g;

        this.g += 0.98;
        
        // if players touched enemy reset map
        if(levelMap[level].player.x + levelMap[level].player.w >= this.x && 
        levelMap[level].player.y + levelMap[level].player.h >= this.y &&
        levelMap[level].player.x <= this.x + this.w &&
        levelMap[level].player.y <=  this.y + this.h)
        {
            reset();
        }
    }
}

// class for bezier collision
class Curv {    
  constructor (x1 ,y1 ,x2 , y2, c) {
    this.x1 = x1;  this.y1 = y1;
    this.x2 = x2;  this.y2 = y2;
    this.c = c;
  }
  draw () {
    
    stroke(255);  
    strokeWeight(2);
    
    // collisions for elements in game on bezier
    for(var i = 0; i < this.x2 - this.x1; i += 1)
    {
        // point(this.x1 + i, this.y1 + (this.c*sin(pi*(i/((this.x2-this.x1)/57.4)))) + (this.y2 - this.y1)*i/(this.x2 - this.x1));
        
        for(var j = 0; j < levelMap[level].badplayer.length; j++)
        {
            if(levelMap[level].badplayer[j].x + levelMap[level].badplayer[j].w >= (this.x1 + i) && 
            levelMap[level].badplayer[j].y + levelMap[level].badplayer[j].h >= this.y1 + (this.c*sin(pi*(i/((this.x2-this.x1)/57.4)))) + (this.y2 - this.y1)*i/(this.x2 - this.x1) &&
            levelMap[level].badplayer[j].x <= (this.x1 + i) + 2 &&
            levelMap[level].badplayer[j].y + levelMap[level].badplayer[j].h / 1.5 <=  this.y1 + (this.c*sin(pi*(i/((this.x2-this.x1)/57.4)))) + (this.y2 - this.y1)*i/(this.x2 - this.x1) + 6)
            {
                levelMap[level].badplayer[j].y = this.y1 + (this.c*sin(pi*(i/((this.x2-this.x1)/57.4)))) + (this.y2 - this.y1)*i/(this.x2 - this.x1) - levelMap[level].badplayer[j].h;
                
                levelMap[level].badplayer[j].g = 0;
            }
        }
    
        if(levelMap[level].player.x + levelMap[level].player.w >= (this.x1 + i) && 
        levelMap[level].player.y + levelMap[level].player.h >= this.y1 + (this.c*sin(pi*(i/((this.x2-this.x1)/57.4)))) + (this.y2 - this.y1)*i/(this.x2 - this.x1) &&
        levelMap[level].player.x <= (this.x1 + i) + 2 &&
        levelMap[level].player.y + levelMap[level].player.h / 1.5 <=  this.y1 + (this.c*sin(pi*(i/((this.x2-this.x1)/57.4)))) + (this.y2 - this.y1)*i/(this.x2 - this.x1) + 6)
        {
            levelMap[level].player.y = this.y1 + (this.c*sin(pi*(i/((this.x2-this.x1)/57.4)))) + (this.y2 - this.y1)*i/(this.x2 - this.x1) - levelMap[level].player.h;
            
            levelMap[level].player.jump = false;
            levelMap[level].player.g = 1;
        }        
    }
  }
}

// appearing text in game
class StoryTxt {
    
    constructor (m, tx, ty, s, r, x, y, w, h, seeBox) {
        this.m = m;
        this.tx = tx; this.ty = ty;
        this.s = s; this.r = r;
        this.x = x; this.y = y;
        this.w = w; this.h = h;
        this.seeBox = seeBox;
        this.inView = false;
        this.show = 300;
    }
    
    draw () {
        
        // showcase
        noStroke();
        textFont("serif");
        textSize(this.s);
        fill(255, 255, 255, 30  - this.show);
        push();
        translate(this.tx, this.ty);
        rotate(this.r);
        text(this.m, 0, 0 - this.s / 12);
        text(this.m, 0, 0 + this.s / 12);
        text(this.m, 0 + this.s / 12, 0 + this.s / 12);
        text(this.m, 0 - this.s / 12, 0 - this.s / 12);
        fill(255, 255, 255, 300 - this.show);
        text(this.m, 0, 0);
        pop();
        
        // if collide in apear box make woosh sound and fade in text
        if(rectCollide(this,levelMap[level].player) && !this.inView)
        {
            this.inView = true;
            wind.play();
        }
        
        if(this.inView)
        {
            this.show /= 1.1;
        }
        
        if(this.seeBox)
        {
            fill(255);
            rect(this.x, this.y, this.w, this.h);
        }
    }
    
}

// sprite for anastasia
function ana (stage) {

    if(stage === "stag")
    {
        ellipse(200, 111, 40, 50);
        beginShape();
        vertex(193, 135);
        vertex(207, 135);
        vertex(210 + 10, 242);
        vertex(190 - 10, 242);
        vertex(193, 135);
        endShape();
    }

    if(stage === "stag")
    {
        bezier(201, 86, 217, 87, 169, 88, 163, 129 + sin(frameCount * 2) * 4);
        bezier(201, 86, 217, 87, 169, 88, 176, 129 + sin(frameCount * 3) * 4);
        bezier(201, 86, 217, 87, 169, 88, 176, 93 + sin(frameCount * 2) * 9);
        bezier(201, 86, 217, 87, 169, 71, 150, 100 + sin(frameCount * 2) * 4);
        bezier(201, 86, 217, 87, 169, 71, 150, 125 + sin(frameCount * 1) * 7);
        push();
        translate(400, 0);
        scale(-1.00, 1.00);
        bezier(201, 86, 217, 87, 169, 88, 163, 129 + sin(frameCount * 2) * 4);
        bezier(201, 86, 217, 87, 169, 88, 176, 129 + sin(frameCount * 3) * 4);
        bezier(201, 86, 217, 87, 169, 88, 176, 93 + sin(frameCount * 2) * 9);
        bezier(201, 86, 217, 87, 169, 71, 150, 100 + sin(frameCount * 2) * 4);
        bezier(201, 86, 217, 87, 169, 71, 150, 125 + sin(frameCount * 1) * 7);
        pop();
    }

    if(stage === "move" && levelMap[level].player.jump === false)
    {
        push();
        translate(197, 160);
        rotate(sin(frameCount * 8) * 30);
        line(0, 0, -19, 23);
        line(0 -sin(frameCount * 8) * 10, 39 +sin(frameCount * 1) * 5, -18, 23);
        pop();

        push();
        translate(216, 160);
        rotate(-77-sin(frameCount * 8) * 30);
        line(0, 0, -19, 23);
        line(-9 +sin(frameCount * 8) * 10, 39 -sin(frameCount * 1) * 5, -18, 23);
        pop();

        push();
        translate(190, 243);
        rotate(-25+ sin(frameCount * 8) * 35);
        line(0, 0, 0, 20);

        line(-11 - sin(frameCount * 8) * 12, 45, 0, 20);
        pop();

        push();
        translate(210, 243);
        rotate(5 - sin(frameCount * 8) * 35);
        line(0, 0, 0, 20);
        line(-11 + sin(frameCount * 8) * 12, 45, 0, 20);
        pop();
    }

    if(stage === "move")
    {
        push();
        translate(10,0);
        bezier(201, 86, 217, 87, 169, 88, 163, 129 + sin(frameCount * 2) * 4);
        bezier(201, 86, 217, 87, 169, 88, 176, 129 + sin(frameCount * 3) * 4);
        bezier(201, 86, 217, 87, 169, 88, 176, 93 + sin(frameCount * 2) * 9);
        bezier(201, 86, 217, 87, 169, 71, 150, 100 + sin(frameCount * 2) * 4);
        bezier(201, 86, 217, 87, 169, 71, 150, 125 + sin(frameCount * 1) * 7);
        pop();

        ellipse(200 + 10, 111, 40, 50);
        beginShape();
        vertex(193 + 10, 135);
        vertex(207 + 10, 135);
        vertex(210 + 10, 242);
        vertex(190 - 10, 242);
        vertex(193 + 8, 135);
        endShape();
    }

    if(stage === "stag" && levelMap[level].player.jump === false)
    {
        line(189, 160 + sin(frameCount * 2) * 4, 172, 183);
        line(189, 199 + sin(frameCount * 2) * 4, 172, 183);
        line(210, 160 + sin(frameCount * 2) * 4, 228, 183);
        line(210, 199 + sin(frameCount * 2) * 4, 228, 183);
    }

    if(stage === "stag" || levelMap[level].player.jump === true)
    {

        line(190, 243, 190, 243 + 40);
        line(210, 243, 210, 243 + 40);
    }

    if(levelMap[level].player.jump === true && stage === "stag")
    {
        line(189, 160, 172, 183 - 50);
        line(210, 160, 228, 183 - 50);
    }

    if(levelMap[level].player.jump === true && stage === "move")
    {
        line(189 + 5, 160, 172 + 5, 183 - 50);
        line(210 + 8, 160, 228 + 8, 183 - 50);
    }    
};
function anaSprite(x, y, s){
    
    push();
    translate(x, y);
    scale(s / 100);
    
    
    // right
    if((keys[39] || keys[68]))
    {
        noFill();
        strokeWeight(15);
        stroke(255, 255, 255, 20);
        ana("move");
        strokeWeight(10);
        stroke(255, 255, 255, 50);
        ana("move");
        strokeWeight(3);
        stroke(255);
        ana("move");
    }
    
    // left
    else if((keys[37] || keys[65]))
    {
        push();
        translate(400, 0);
        scale(-1.00, 1.00);
        noFill();
        strokeWeight(15);
        stroke(255, 255, 255, 20);
        ana("move");
        strokeWeight(10);
        stroke(255, 255, 255, 50);
        ana("move");
        strokeWeight(3);
        stroke(255);
        ana("move");
        pop();
    }
    
    else
    {
        push();
        translate(400, 0);
        scale(-1.00, 1.00);
        noFill();
        strokeWeight(15);
        stroke(255, 255, 255, 20);
        ana("stag");
        strokeWeight(10);
        stroke(255, 255, 255, 50);
        ana("stag");
        strokeWeight(3);
        stroke(255);
        ana("stag");
        pop();
    }
    
    pop();
};

// class for main player
class Player {
  
  constructor (x, y, w, h)
  {
    this.x = x;  this.y = y;
    this.origy = y;  this.origx = x;
    this.w = w;  this.h = h;
    this.s = 5;   this.g = 1;
    this.CanX = 0; this.CanY = 0;
    this.jump = false;
    cam = new Camera(this.x,this.y);
  }
  update () {
        
        // move with keys
        if((keys[37] || keys[65])) { this.x -= this.s; }
        if((keys[39] || keys[68])) { this.x += this.s; }

        // jump with keys
        if((keys[38] || keys[32] || keys[87]) && !this.jump) {
            this.jump = true;
            this.g = -10;
            jumpS.play();
        }
        
      // walk sound
        if((keys[37] || keys[65] || keys[39] || keys[68]) && levelMap[level].player.jump === false)
        {
            walk.play();
            walk.volume = 0.05;
        } else
        {
            walk.volume = 0;
            walk.currentTime = 0;
        }
      // gravity
        this.y += this.g;
        this.g += 0.55;

        if(this.y >= levelMap[level].CanvasH)
        {
            reset();
        }

        if(this.x <= 0)
        {
            this.x = 0; 
        }

        if(this.x >= levelMap[level].Canvas - this.w)
        {
            this.x = levelMap[level].Canvas - this.w;
        }
    }
    draw () {
        // draw player
        push();
        translate(this.x, this.y);
        anaSprite(-85, -40, 50);
        pop();
    }
}

// snow effect
function snow (w){
    
    push();
    noStroke();
    
    //particles
    for(var i = 0; i < particles.x.length; ++i)
    {
        //fill
        fill(255, 255, 255, 200);
        ellipse(particles.x[i], particles.y[i], particles.s[i], particles.s[i]); // circle for particle
        
        //particles.s[i] -= 0.4; // size decreases
        particles.y[i] += particles.s[i]; // particl goes up
        particles.x[i] -= 0.5;
        
        if(particles.y[i] >= height) // is particle is totally shrunk
        {
            //reset particle
            particles.x[i] = random(0, w);
            particles.y[i] = -10;
            particles.s[i] = random(1, 3);
        }
    }
    
    //appear
    if(particles.x.length <= 150)
    {
        particles.x.push(random(0, w));
        particles.y.push(random(-600, -10));
        particles.s.push(random(1, 3));
        particles.r.push(random(0, 360));
    }
    pop();
};

// draw all elements
function drawLevels () {
    
    portalAccess = true;

    push();
    translate(scoutMap[0], scoutMap[1]);
    cam.view(levelMap[level].player);
    
    // level bg's
    switch (level) {
            case 0:
        image(bg1, 0, 0);
        snow(levelMap[level].Canvas + 100);
        image(scene1_rocks, 0, 0);
                break;
            
        case 1:
        image(bg2, 0, 0);
        snow(levelMap[level].Canvas + 100);
        image(scene2_rocks, 0, 0);
                break;
    }
    
    for(var i in levelMap[level].curves)
    {
      levelMap[level].curves[i].draw();
    }
    
    for(var i in levelMap[level].hope) {
      levelMap[level].hope[i].draw();
        if(levelMap[level].hope[i].collected === false) { 
            portalAccess = false;
        }
    }
    
    for(var i in levelMap[level].storytxt) {
      levelMap[level].storytxt[i].draw();
    }
    
    for(var i in levelMap[level].badplayer) {
        levelMap[level].badplayer[i].draw();
        levelMap[level].badplayer[i].update();
    }
    
    levelMap[level].portal.draw();
    levelMap[level].player.draw();
    levelMap[level].player.update();
    pop();
};

var startMusicDelay = 0;

function draw() {
    
    // if in levels
    startMusicDelay ++;
    if(startMusicDelay >= 100)
    {
        bgMusic.play();
        startMusicDelay = 100;
    }
    
    textAlign(CENTER, CENTER);
    background(0);
    drawLevels();
    
    trans /= 1.1;
    fill(255, 255, 255, trans);
    rect(0, 0, window.innerWidth, window.innerHeight);
    
}