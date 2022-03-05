
//// sound
var doveS;
var bgMusic;
var walk;
var jumpS;
var portalS;
var wind;
var squid;

var testSpriteImg;
var testSprite;
var testSprite2;
var testSprite3;
var staggeredFrames = 8;




/** COLLIDERS **/

// define bezier collision at a point
// give slight margin of error for a smoother feel
function bezierCollisionPoint (i, obj1, obj2, p) {
    return obj1.y + obj1.h + 7 >= (obj2.y1+obj2.c*p.sin((pi*(i-obj2.x1))/(obj2.x2-obj2.x1)) + ((obj2.y2-obj2.y1)*(i-obj2.x1))/(obj2.x2-obj2.x1)) && obj1.y + obj1.h - 10 <= (obj2.y1+obj2.c*p.sin((pi*(i-obj2.x1))/(obj2.x2-obj2.x1)) + ((obj2.y2-obj2.y1)*(i-obj2.x1))/(obj2.x2-obj2.x1)) &&
    obj1.x + obj1.w >= (i) &&
    obj1.x <= (i);
}


// ratio of speed resistance based on curvature
// cut it in half for a smoother feel
// make velocity almost look constant at all times
function formatDeriv(y, p) {
    return 1 - (0.5) * p.abs((2/(1+p.exp(y))  - 1));
}

// p.abs(x) -> | x |
// p.pow(x, y) -> x ^ y
// p.exp(x) -> e^x
function derivResistance (i, obj, p) {
    // i -> player point
    // obj1 -> player
    // obj2 -> curvature
    // p -> pass if using p5 material (Math.pow)
    
    var der = obj.c * (pi/(obj.x2-obj.x1)) * p.cos((pi*(i-obj.x1))/(obj.x2-obj.x1)) + (obj.y2-obj.y1)/(obj.x2-obj.x1);
    return formatDeriv(der, p);
}

// for rectangular collision hit boxes
// gets x, y, w, and h of two objects and returns the collision for operations
function rectCollide (one, two) {
    return one.x + one.w > two.x &&
    one.y + one.h > two.y &&
    one.x < two.x + two.w &&
    one.y < two.y + two.h;
};

// only view objects if they are visible in camera for efficency
var view = function(obj){
    return obj.x + (window.innerWidth / 2) * (100 / levelMap[level].spanSize) - cam.x < window.innerWidth * (100 / levelMap[level].spanSize) && 
        obj.x + (window.innerWidth / 2) * (100 / levelMap[level].spanSize) - cam.x > -obj.w && 
        obj.y + (window.innerHeight / 2) * (100 / levelMap[level].spanSize) - cam.y < window.innerHeight * (100 / levelMap[level].spanSize) && 
        obj.y + (window.innerHeight / 2) * (100 / levelMap[level].spanSize) - cam.y > -obj.h;
};





/** OBJECTS **/
// camera that is set to follow an element
class Camera {

    constructor (x, y) {
        this.x = x; this.y = y;
        this.w = window.innerWidth; this.h = window.innerHeight;
        this.scaleW = 0;
        this.scaleH = 0;
    }

    view (plyer, p) {

        // set spangrow to be initialized with map
        spanGrow = levelMap[level].spanSize;

        // interpolation for camera following player
        this.x = p.lerp(this.x, plyer.x + levelMap[level].spanX, 0.05);
        this.y = p.lerp(this.y, plyer.y + levelMap[level].spanY, 0.05);

        // scale based on map span grow settings
        p.scale(spanGrow / 100);
        
        this.w = window.innerWidth;
        this.h = window.innerHeight;

        // scale width and height based on span grow
        this.scaleW = (this.w / (spanGrow / 100)) / 2;
        this.scaleH = (this.h / (spanGrow / 100)) / 2;

        // constrain player to ends of screen
        this.x = p.constrain(this.x, this.scaleW, levelMap[level].Canvas - this.scaleW);
        this.y = p.constrain(this.y, this.scaleH, levelMap[level].CanvasH - this.scaleH);

        // translate accordingly
        p.translate(this.scaleW - this.x, this.scaleH - this.y);
    };
};

// class for bezier collision
class Curv {    
    constructor (x1 ,y1 ,x2 , y2, c) {

        this.x1 = x1;  this.y1 = y1;
        this.x2 = x2;  this.y2 = y2;
        this.c = c;
        
        // create x, y, w, and h around curve
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        
        this.deleteObj = false;
    }

    draw (p) {

        // create a box around bezier curve for camera purposes
        if(this.c <= 0)
        {
            if(this.y1 <= this.y2)
            {
                this.x = this.x1 + 12;
                this.y = this.y1 - p.abs(this.c);
                this.w = this.x2 - this.x1 - 24;
                this.h = (this.y2 - this.y1) + p.abs(this.c);
            } else
            {
                this.x = this.x1 + 12;
                this.y = this.y2 - p.abs(this.c);
                this.w = this.x2 - this.x1 - 24;
                this.h = (this.y1 - this.y2) + p.abs(this.c);
            }
        } else {
            if(this.y1 <= this.y2)
            {
                this.x = this.x1 + 12;
                this.y = this.y1;
                this.w = this.x2 - this.x1 - 24;
                this.h = (this.y2 - this.y1) + p.abs(this.c);
            } else
            {
                this.x = this.x1 + 12;
                this.y = this.y2;
                this.w = this.x2 - this.x1 - 24;
                this.h = (this.y1 - this.y2) + p.abs(this.c);
            }
        }

        p.stroke(255);
        if(this.deleteObj) p.stroke(255, 0, 0);
        p.strokeWeight(2);

        // show collision box for spectator mode
        if(spectMode)
        {
            p.noFill();
            // p.rect(this.x, this.y, this.w, this.h);
            for(var i = this.x1; i < this.x2; i += 10)
                p.point(i, (this.y1+(this.c*p.sin((pi*(i-(this.x1)))/(this.x2-this.x1))) + ((this.y2-this.y1)*(i-this.x1))/(this.x2-this.x1)));
        }
        
        // create knobs for adjustments for spectator mode
        if(view(this))
        {
            if(spectMode)
            {
                this.deleteObj = applyNob(this.x1, this.y1, "DEL", this.deleteObj, p, 0);
                this.deleteObj = applyNob(this.x2, this.y2, "DEL", this.deleteObj, p, 0);
                this.deleteObj = applyCurve(this, p, 79, "DEL", this.deleteObj);
                this.x1 = applyNob(this.x1, this.y1, "x", this, p, 79);
                this.y1 = applyNob(this.x1, this.y1, "y", this, p, 79);
                this.x2 = applyNob(this.x2, this.y2, "x", this, p, 79);
                this.y2 = applyNob(this.x2, this.y2, "y", this, p, 79);
                this.c = applyCurve(this, p, 79, "", null);
            }
        }
    }
}

// class for main player
class Sprite {
    constructor (spriteSheetImage, spriteW, spriteH, framejson) {
        this.spriteSheetImage = spriteSheetImage;
        this.spriteW = spriteW;
        this.spriteH = spriteH;
        this.framejson = framejson;
        this.currentState = "idle";
        this.stageProgress = 0;
        this.sc = 1;
    }
    
    changeStagePlusScale (stageSwitch, sc) {
        this.currentState = stageSwitch;
        this.sc = sc;
    }
    
    changeStage (stageSwitch) {
        this.currentState = stageSwitch;
    }
    
    changeScale (sc) {
        this.sc = sc;
    }
    
    draw (x, y, w, h, p) {
        
        var position = p.floor(this.stageProgress/staggeredFrames) % this.framejson[this.currentState].frames;
        var frameX = position * this.spriteW;
        var frameY = this.framejson[this.currentState].id * this.spriteH;
        this.stageProgress ++;
        
        p.push();
        p.translate(x, y);
        if(this.sc === -1) p.translate(this.spriteW * w, 0);
        p.scale(w * this.sc, h);
        var m = this.spriteSheetImage.get(frameX, frameY, this.spriteW, this.spriteH);
        p.image(m, 0, 0);
        p.pop();
    }
}
class Player {

    constructor (x, y, w, h)
    {
        this.x = x;  this.y = y;
        this.xvel = 0;
        this.yvel = 0;
        this.origy = y;  this.origx = x;
        this.w = w;  this.h = h;
        this.s = 6;   this.g = 1;
        this.CanX = 0; this.CanY = 0;
        this.jump = false;
        cam = new Camera(this.x,this.y);
    }
    update (p) {
        
        // show collision box around player on spectator mode
        // apply knobs
        if(spectMode)
        {
            p.stroke(255, 255, 255);
            p.noFill();
            p.rect(this.x, this.y, this.w, this.h);
            this.x = applyNob(this.x, this.y, "x", this, p, 73);
            this.y = applyNob(this.x, this.y, "y", this, p, 73);
        }

        // move with keys
        if((keys[37] || keys[65])) this.xvel -= 2;
        if((keys[39] || keys[68])) this.xvel += 2;

        if(!keys[37] && !keys[39] && !keys[65] && !keys[68]) this.xvel *= 0.7;
        
        // constrain x velocity 
        this.xvel = p.constrain(this.xvel, -this.s, this.s);

        // jump with keys
        if((keys[38] || keys[32] || keys[87]) && !this.jump && this.g <= 5) {
            this.jump = true;
            this.g = -10;
            jumpS.play();
        }

        // walk sound
        if((keys[37] || keys[65] || keys[39] || keys[68]) && this.jump === false && this.g <= 5)
        {
            walk.play();
            walk.volume = 0.03;
        } else
        {
            walk.volume = 0;
            walk.currentTime = 0;
        }

        if(!movingPlayer)
        {
            // gravity
            this.y += this.g;
            this.g += 0.35;
        }
        
        // max out gravity
        if(this.g >= 10) this.g = 10;
        
        // reset player if past end of screen
        if(this.y >= levelMap[level].CanvasH) reset();
        
        // don't go past left part of screen
        if(this.x <= 0) this.x = 0; 
        
        // don't go past right part of screen
        if(this.x >= levelMap[level].Canvas - this.w) this.x = levelMap[level].Canvas - this.w;
        
        // apply collisions on velocity
        this.applyCollision(0, this.g, p);
        this.x += this.xvel;
        this.applyCollision(this.xvel, 0, p);
    }
    draw (p = p5.instance) {
        // draw player
        p.push();
        p.translate(this.x + 24, this.y + 9);
        anaSprite(-85, -40, 115, p);
        p.pop();
    }
}

// box collider
class Box {
    constructor (x, y, w, h) {
        this.x = x; this.y = y;
        this.w = w; this.h = h;
        this.deleteObj = false;
    }
    draw (p) {
        
        // show collision of boxes on spectator mode
        if(view(this))
        {
            if(spectMode)
            {
                this.deleteObj = applyNob(this.x, this.y, "DEL", this.deleteObj, p, 0);
                this.deleteObj = applyNob(this.x, this.y, "DEL-WH", this, p, this.deleteObj);
                this.x = applyNob(this.x, this.y, "x", this, p, 80);
                this.y = applyNob(this.x, this.y, "y", this, p, 80);
                this.w = applyNob(this.x, this.y, "w", this, p, 80);
                this.h = applyNob(this.x, this.y, "h", this, p, 80);
                
                p.stroke(255, 255, 255);
                if(this.deleteObj) p.stroke(255, 0, 0);
                p.noFill();
                p.rect(this.x, this.y, this.w, this.h);
            }
        }
    }
}






/** VISUAL **/
// sprite for anastasia
function ana (stage, p) {
    
    testSprite.draw(0, 0, 1, 1, p);
    
    if(stage === "stag")
    {
        testSprite.changeStage("idle");
    }

    if(stage === "move" && levelMap[level].player.jump === false)
    {
        testSprite.changeStagePlusScale("walking", 1);
    }
    
    if(stage === "move2" && levelMap[level].player.jump === false)
    {
        testSprite.changeStagePlusScale("walking", -1);
    }

    if(stage === "move" && levelMap[level].player.jump === true)
    {

        testSprite.changeStagePlusScale("jump", 1);
    }
    
    if(stage === "move2" && levelMap[level].player.jump === true)
    {

        testSprite.changeStagePlusScale("jump", -1);
    }
};
function anaSprite(x, y, s, p){

    p.push();
    p.translate(x, y);
    p.scale(s / 100);

    // right
    if((keys[39] || keys[68]))
    {
        ana("move", p);
    }

    // left
    else if((keys[37] || keys[65]))
    {
        ana("move2", p);
    }

    else
    {
        ana("stag", p);
    }
    p.pop();
};




    

/** LEVELS **/
var levelMap;

// current level
var level = 0;

// for scouting map
var scoutMap = [0, 0];

// spectator mode
var spectMode = true;

var spriteImages;
var backgroundImages;

// for setting up levels
function populateMaps (p) {
    
    backgroundImages = {
        all: {},
        isolation: {
            desolation: [
                p.loadImage("images/backdrop1.jpg"),
                p.loadImage("images/map1.png"),
                p.loadImage("images/clouds.png"),
                p.loadImage("images/moonstag.png")
            ]
        }
    };
    
    testSpriteImg = p.loadImage("images/knight2.png");
    testSprite = new Sprite(testSpriteImg, 128, 128, {
        idle: {
            id: 8,
            frames: 7
        },
        walking: {
            id: 0,
            frames: 9
        },
        jump: {
            id: 9,
            frames: 12
        },
    });
    
    testSprite2 = new Sprite(testSpriteImg, 128, 128, {
        flies: {
            id: 13,
            frames: 12
        },
    });
    
    testSprite3 = new Sprite(testSpriteImg, 128, 128, {
        flies: {
            id: 13,
            frames: 12
        },
    });
    
    levelMap = [
    {
        bgImg: [backgroundImages.isolation.desolation[0]],
        bgImg2: [backgroundImages.isolation.desolation[1]],
        fgImg: [backgroundImages.isolation.desolation[2]],
        stagImg: [[backgroundImages.isolation.desolation[3], {xOffset: -1500, yOffset: -2000}]],
        
        Canvas: 20000, // canvas width 
        CanvasH: 10000, // canvas height
        spanX: 0, spanY: 0, spanSize: 50,
        
        player: new Player(250 + 1000, 9200, 30, 100), // player
        
        // portal: new Portal(3000, 600, 50, 50), // portal
        
        // bezier curves
        curves: [new Curv(1058, 9466, 1526, 9474, -4),new Curv(1526, 9474, 1863, 9516, -4),new Curv(1863, 9516, 2342, 9406, -27),new Curv(2342, 9406, 2705, 9244, -7),new Curv(2705, 9244, 3121, 9243, -7),new Curv(3121, 9243, 3597, 9236, 5),new Curv(3597, 9236, 4052, 9125, 8),new Curv(3526, 8986, 3987, 9112, -7),new Curv(3596, 8976, 4098, 8879, 1),new Curv(3516, 8801, 4037, 8870, -7),new Curv(3040, 8717, 3267, 8747, -16),new Curv(2550, 8622, 2841, 8681, -20),new Curv(2105, 8554, 2322, 8567, -13),new Curv(2474, 8486, 2728, 8286, -34),new Curv(2964, 8292, 3092, 8217, -28),new Curv(3618, 8331, 4610, 8314, -8),new Curv(4610, 8314, 5020, 8415, 9),new Curv(5020, 8415, 5362, 8543, -8),new Curv(5362, 8543, 6134, 8634, 24),new Curv(6556, 8740, 6799, 8750, 7),new Curv(6799, 8750, 6946, 8798, -20),new Curv(6946, 8798, 7628, 8897, 38),new Curv(7628, 8897, 7995, 8901, 0),new Curv(8404, 8982, 8546, 8912, -23),new Curv(3092, 8217, 3318, 8235, -13),new Curv(6134, 8634, 6318, 8683, -18),new Curv(7995, 8901, 8266, 9012, -7),new Curv(877, 9348, 1058, 9466, -5),new Curv(8654, 8780, 8855, 8689, -1),new Curv(8844, 8628, 9084, 8591, 0),new Curv(9028, 8559, 9334, 8578, -12),new Curv(9247, 8531, 9704, 8607, -30),new Curv(9704, 8607, 9913, 8393, -43),new Curv(9913, 8393, 10360, 8236, -25),new Curv(9694, 7883, 10302, 8187, -38),new Curv(9769, 7877, 10247, 7716, 13),new Curv(9687, 7546, 10178, 7689, -17),new Curv(8616, 7103, 9687, 7546, -11),new Curv(7507, 6778, 8616, 7103, -23),new Curv(6272, 6713, 7507, 6778, -40),new Curv(4714, 6854, 5963, 6733, 3),new Curv(3625, 6904, 4714, 6854, 16),new Curv(1590, 6818, 3305, 6903, 11),new Curv(1270, 6761, 1590, 6818, 0),new Curv(1022, 6774, 1270, 6761, -13),new Curv(753, 6636, 1084, 6615, 12),new Curv(-10, 6633, 753, 6636, 1),new Curv(120, 6587, 1038, 6215, 6),new Curv(23, 6092, 615, 6190, -8),new Curv(615, 6190, 910, 6221, -14),new Curv(751, 5660, 978, 5573, -20),new Curv(116, 6056, 751, 5660, -22),new Curv(50, 5347, 746, 5499, 19),new Curv(271, 5266, 762, 5109, -29),new Curv(762, 5109, 1056, 5041, -2),new Curv(1056, 5041, 2650, 4906, -30),new Curv(2650, 4906, 4249, 5021, -27),new Curv(4249, 5021, 5445, 5058, 25),new Curv(5445, 5058, 6698, 4859, 16),new Curv(6698, 4859, 7143, 4757, -8),new Curv(7143, 4757, 8057, 4610, 27),new Curv(8057, 4610, 8292, 4714, 58),new Curv(8292, 4714, 8718, 4582, -7),new Curv(8718, 4582, 8844, 4711, 28),new Curv(8844, 4711, 8996, 4832, -9),new Curv(8996, 4832, 9605, 4707, -1),new Curv(9660, 4917, 10098, 4825, -47),new Curv(10098, 4825, 10301, 4771, 16),new Curv(10301, 4771, 10433, 4750, -10),new Curv(746, 5499, 897, 5536, -1),new Curv(156, 5324, 271, 5266, 2),new Curv(10337, 1421, 10661, 1416, -46),new Curv(10661, 1416, 10970, 1258, 67),new Curv(10970, 1258, 11470, 1262, -12),new Curv(11470, 1262, 11594, 1405, -6),new Curv(11594, 1405, 12574, 1396, -5),new Curv(12574, 1396, 13680, 1389, -2),new Curv(13680, 1389, 14527, 1398, 2),new Curv(14527, 1398, 14777, 1394, 3),new Curv(14777, 1394, 15027, 1356, -16),new Curv(8443, 4056, 10308, 4716, -104),new Curv(7805, 3866, 8443, 4056, 18),new Curv(7515, 3666, 7805, 3866, 10),new Curv(7397, 3727, 7515, 3666, -23),new Curv(7200, 3725, 7278, 3698, -17),new Curv(7021, 3637, 7105, 3665, -16),new Curv(7146, 3555, 7222, 3485, -12),new Curv(6945, 3368, 7138, 3423, -14),new Curv(7098, 3287, 7187, 3191, -21),new Curv(7253, 3132, 7368, 3063, -1),new Curv(7431, 2998, 7570, 2901, -7),new Curv(7671, 2829, 7772, 2752, -13),new Curv(7859, 2683, 7927, 2619, -9),new Curv(7978, 2567, 8275, 2409, -34),new Curv(8372, 2306, 8650, 2129, -50),new Curv(8650, 2129, 8898, 2023, 19),new Curv(9053, 1926, 9411, 1706, -46),new Curv(9599, 1644, 9856, 1506, -21),new Curv(10129, 1424, 10337, 1421, 26),new Curv(9989, 1446, 10129, 1424, -9),new Curv(15576, 2143, 16238, 2023, -40),new Curv(15011, 2519, 15421, 2469, -43),new Curv(14541, 3034, 14749, 2924, -25),new Curv(14256, 3574, 14412, 3468, -18),new Curv(13919, 4005, 14089, 3833, -40),new Curv(13485, 4294, 13723, 4200, -31),new Curv(13374, 4392, 13485, 4294, 4),new Curv(12761, 4893, 13300, 4709, -32),new Curv(12654, 4939, 13273, 5075, -22),new Curv(12939, 5285, 13386, 5129, -33),new Curv(12808, 5333, 13261, 5469, -18),new Curv(12937, 6340, 14188, 6526, -29),new Curv(13052, 5682, 13373, 5533, -24),new Curv(12950, 5752, 13285, 5815, -31),new Curv(13099, 5999, 13344, 5856, -28),new Curv(13044, 6038, 13219, 6104, -13),new Curv(13145, 6194, 13298, 6162, -13),new Curv(13004, 6232, 13249, 6318, -16),new Curv(14188, 6526, 15624, 7061, -31),new Curv(15624, 7061, 17333, 7513, 71),new Curv(17333, 7513, 17553, 7554, -5),new Curv(17553, 7554, 17763, 7499, 13),new Curv(17763, 7499, 17978, 7525, -17),new Curv(17978, 7525, 18370, 7408, -30),new Curv(18370, 7408, 18532, 7411, -4),new Curv(18532, 7411, 19268, 7405, -18),new Curv(19268, 7405, 19380, 7432, -6),new Curv(19380, 7432, 19500, 7427, -21),new Curv(19500, 7427, 19718, 7473, -2),new Curv(19718, 7473, 19840, 7611, 55),new Curv(7094, 3718, 7228, 3791, 36),new Curv(7278, 3698, 7399, 3808, 60),
        ],
        
        boxes: [new Box(736, 9045, 170, 528),new Box(8654, 8780, 29, 72),new Box(8846, 8632, 26, 136),new Box(9028, 8559, 23, 137),new Box(9247, 8531, 34, 239),new Box(4047, 9132, 4, 417),new Box(3942, 9546, 103, 521),new Box(6272, 6713, 88, 253),new Box(5903, 6742, 97, 244),new Box(3625, 6910, 65, 241),new Box(3236, 6911, 108, 228),new Box(994, 6635, 29, 153),new Box(994, 6635, 88, 34),new Box(845, 6651, 219, 48),new Box(753, 6687, 288, 47),new Box(9590, 4750, 63, 288),new Box(9517, 4730, 100, 100),new Box(14974, 1359, 58, 300),new Box(7039, 3664, 71, 90),new Box(7235, 3703, 47, 150),new Box(7405, 3723, 102, 95),],
        
        // camera boxes
        camboxes: [],
    
        // doves
        hope: [],
        
        // evil black squids
        badplayer: [],
        
        // story text
        storytxt: [],
            
        // checkpoints
        checkpoints: [],

        // shadow floaters
        floaters: [],
        },
    ];
};

// snow effect
// particles for snow effect
var particles = { x: [], y: [], s: [], r: [], upAmount: [] };
function snow (p) {

    p.push();
    p.noStroke();

    //particles
    for(var i = 0; i < particles.x.length; ++i)
    {
        //fill
        p.fill(255, 255, 255, 200);
        p.ellipse(particles.x[i], particles.y[i], particles.s[i], particles.s[i]); // circle for particle

        particles.y[i] += particles.s[i]; // particl goes up
        particles.x[i] -= 0.5;

        if(particles.y[i] >= cam.y + window.innerHeight + 600) // is particle is totally shrunk
        {
            //reset particle
            particles.x[i] = p.random(-600, window.innerWidth + 600) + cam.x - (window.innerWidth / 2);
            particles.y[i] = -10 + cam.y - (window.innerHeight / 2);
            particles.s[i] = p.random(1, 3);
        }
    }

    //appear
    if(particles.x.length <= 400)
    {
        particles.x.push(
            p.random(0, window.innerWidth) + 
            cam.x - (window.innerWidth / 2));
        particles.y.push(
            p.random(-600, -10) + 
            cam.y - (window.innerHeight / 2));
        particles.s.push(p.random(1, 3));
        particles.r.push(p.random(0, 360));
    }
    p.pop();
};

// draw all elements
function drawLevels (p) {

    portalAccess = true;

    p.push();
    p.translate(scoutMap[0], scoutMap[1]);
    cam.view(levelMap[level].player, p);

    /** DRAW ALL MAP ELEMENTS**/
    
    // IN BACK IMAGES
    for(var i = 0; i < levelMap[level].bgImg.length; i++) p.image(levelMap[level].bgImg[i], 0, 0);
    
    for(var i = 0; i < levelMap[level].stagImg.length; i++)
        p.image(levelMap[level].stagImg[i][0], 
        cam.x - (window.innerWidth / 2) + levelMap[level].stagImg[i][1].xOffset, 
        cam.y - (window.innerHeight / 2) + levelMap[level].stagImg[i][1].yOffset);

    for(var i = 0; i < levelMap[level].bgImg2.length; i++) p.image(levelMap[level].bgImg2[i], 0, 0);
    
    for(var i = 0; i < levelMap[level].curves.length; i++) levelMap[level].curves[i].draw(p);
    for(var i = 0; i < levelMap[level].boxes.length; i++) levelMap[level].boxes[i].draw(p);

    for(var i = 0; i < levelMap[level].hope.length; i++) {
        levelMap[level].hope[i].draw();
        if(levelMap[level].hope[i].collected === false) portalAccess = false;
    }

    for(var i = 0; i < levelMap[level].storytxt.length; i++) levelMap[level].storytxt[i].draw();
    for(var i = 0; i < levelMap[level].checkpoints.length; i++) levelMap[level].checkpoints[i].draw();

    for(var i = 0; i < levelMap[level].badplayer.length; i++) {
        levelMap[level].badplayer[i].draw();
        levelMap[level].badplayer[i].update();
    }

    for(var i = 0; i < levelMap[level].floaters.length; i++) levelMap[level].floaters[i].apply();
    for(var i = 0; i < levelMap[level].camboxes.length; i++) levelMap[level].camboxes[i].draw();

    // levelMap[level].portal.draw();
    levelMap[level].player.draw(p);
    levelMap[level].player.update(p);
    
    testSprite2.changeStage("flies");
    testSprite3.changeStage("flies");
    testSprite2.draw(4900, 8200 + 50, 1, 1, p);
    testSprite3.draw(18250, 7250, 1, 1, p);
    
    /** IN FRONT IMAGES **/
    for(var i = 0; i < levelMap[level].fgImg.length; i++) p.image(levelMap[level].fgImg[i], 0, 0);

    // LIVE CAMERA SPANNING DETECTION
    if(levelMap[level].spanSize <= spanLiveSize) levelMap[level].spanSize += 0.2;
    if(levelMap[level].spanSize >= spanLiveSize) levelMap[level].spanSize -= 0.2;
    if(levelMap[level].spanSize === spanLiveSize) levelMap[level].spanSize = spanLiveSize;

    if(levelMap[level].spanX <= spanLiveX) levelMap[level].spanX += 2;
    if(levelMap[level].spanX >= spanLiveX) levelMap[level].spanX -= 2;
    if(levelMap[level].spanX === spanLiveX) levelMap[level].spanX = spanLiveX;

    if(levelMap[level].spanY <= spanLiveY) levelMap[level].spanY += 2;
    if(levelMap[level].spanY >= spanLiveY) levelMap[level].spanY -= 2;
    if(levelMap[level].spanY === spanLiveY) levelMap[level].spanY = spanLiveY;

    p.pop();
};





/** COLLISIONS **/
Player.prototype.applyCollision = function(xvel, yvel, p) {
    
    p.stroke(255, 0, 0);
    p.strokeWeight(5);
    
    // get midpoint of player for bezier collision
    var middlepoint = this.x + this.w / 2;

    for(var i = 0; i < levelMap[level].curves.length; i++)
    {
        var c = levelMap[level].curves[i];
        if(!view(c)) continue;   
        if(!rectCollide(this, c)) continue;
        if(!(bezierCollisionPoint(middlepoint, this, c, p))) continue;
        
        if (yvel > 0) {
            this.y = (c.y1+c.c*p.sin((pi*(middlepoint-c.x1))/(c.x2-c.x1)) + ((c.y2-c.y1)*(middlepoint-c.x1))/(c.x2-c.x1)) - this.h;
            this.jump = false;
            this.g = 0;
            this.xvel = (derivResistance(middlepoint, c, p)) * this.xvel;
        }
    }
    
    for(var i = 0; i < levelMap[level].boxes.length; i++)
    {
        var b = levelMap[level].boxes[i];
        
        if(view(b))
        {
            if(!rectCollide(this, b)) continue;
            
            if (xvel < 0) {
                this.x = b.x + b.w;
                this.xvel = 0;
            }
            if (xvel > 0) {
                this.x = b.x - this.w;
                this.xvel = 0;
            }
            if (yvel < 0) {
                this.y = b.y + b.h;
                this.g = 0;
            }
            if (yvel > 0) {
                this.y = b.y - this.h;
                this.jump = false;
                this.g = 0;
            }
            
        }
    }
    
};





/** LEVEL EDITOR ASSETS **/
// clicked state
var clickDalay = 0;
var clicked = false;
var imgGround = "";
var img;
var input;

function applyNob (setx, sety, xory, obj, p, k) {

    let mX = p.mouseX * (100 / levelMap[level].spanSize) + cam.x - (window.innerWidth / 2) * (100 / levelMap[level].spanSize);
    let mY = p.mouseY * (100 / levelMap[level].spanSize) + cam.y - (window.innerHeight / 2) * (100 / levelMap[level].spanSize);
    
    if(xory === "DEL")
    {
        if(p.mouseIsPressed && mX > setx - 30 && mX < setx + 20 + 30 && mY > sety - 30 && mY < sety + 20 + 30 && keys[85]) obj = true;
        return obj;
    }
    
    if(xory === "DEL-WH")
    {
        setx -= (obj.x - obj.w);
        sety -= (obj.y - obj.h);
        if(p.mouseIsPressed && mX > setx + obj.x - 30 && mX < setx + obj.x + 20 + 30 && mY > sety + obj.y - 30 && mY < sety + obj.y + 20 + 30 && keys[85]) k = true;
        return k;
    }

    if(xory === "x" || xory === "y")
    {
        if(p.mouseIsPressed && mX > setx - 30 && mX < setx + 20 + 30 && mY > sety - 30 && mY < sety + 20 + 30 && keys[k])
        {
            setx = mX - 10;
            sety = mY - 10;
            movingPlayer = true;
        }
        else
        {
            movingPlayer = false;
        }
        
        p.stroke(255, 255, 255, 50);
        p.fill(255, 255, 255, 30);
        p.ellipse(setx - 30 + 40, sety - 30 + 40, 20 + 60, 20 + 60);

        p.fill(255, 255, 255, 100);

        if(mX > setx && mX < setx + 20 && mY > sety && mY < sety + 20) p.fill(255, 255, 255, 150);

        p.rect(setx, sety, 20, 20);
        
        if(xory === "x") return setx;
        else return sety;
    }
    else if (xory !== "DEL" && xory !== "DEL-WH")
    {   
        setx -= (obj.x - obj.w);
        sety -= (obj.y - obj.h);
        
        if(p.mouseIsPressed && mX > setx + obj.x - 30 && mX < setx + obj.x + 20 + 30 && mY > sety + obj.y - 30 && mY < sety + obj.y + 20 + 30 && keys[k])
        {
            setx = mX - 10 - obj.x;
            sety = mY - 10 - obj.y;
            movingPlayer = true;
        }
        else
        {
            movingPlayer = false;
        }
        
        p.stroke(255, 255, 255, 50);
        p.fill(255, 255, 255, 30);
        p.ellipse(setx + obj.x - 30 + 40, sety + obj.y - 30 + 40, 20 + 60, 20 + 60);
        p.fill(255, 255, 255, 100);
        
        if(mX > setx + obj.x && mX < setx + obj.x + 20 && mY > sety + obj.y && mY < sety + obj.y + 20) p.fill(255, 255, 255, 150);

        p.rect(setx + obj.x, sety + obj.y, 20, 20);
        
        if(xory === "w") return setx;
        else return sety;
    }
};
function applyCurve (obj, p, k, xory, obj2) {   

    let setx = (obj.x1 + obj.x2) / 2;
    let sety = (obj.y1 + obj.y2) / 2 + obj.c - 10;

    p.stroke(255, 255, 255, 50);
    p.fill(255, 255, 255, 30);
    p.ellipse(setx - 30 + 40, sety - 30 + 40, 20 + 60, 20 + 60);
    p.fill(255, 255, 255, 100);

    let mX = p.mouseX * (100 / levelMap[level].spanSize) + cam.x - (window.innerWidth / 2) * (100 / levelMap[level].spanSize);
    let mY = p.mouseY * (100 / levelMap[level].spanSize) + cam.y - (window.innerHeight / 2) * (100 / levelMap[level].spanSize);

    if(mX > setx && mX < setx + 20 && mY > sety && mY < sety + 20) p.fill(255, 255, 255, 150);
    if(p.mouseIsPressed && mX > setx - 30 && mX < setx + 20 + 30 && mY > sety - 30 && mY < sety + 20 + 30 && keys[k]) sety = mY - 10;

    p.rect(setx, sety, 20, 20);
    
    if(xory === "DEL")
    {
        if(p.mouseIsPressed && mX > setx - 30 && mX < setx + 20 + 30 && mY > sety - 30 && mY < sety + 20 + 30 && keys[85]) obj2 = true;
            
            return obj2;
    }

    return -(((obj.y1 + obj.y2) / 2 - 10) - sety);
}

// draw level editor
function buttonAsset (x, y, w, h, txt, txtSize, state, p) {
    p.fill(255, 255, 255, 50);
    p.textSize(txtSize);
    
    if(p.mouseX > x && p.mouseX < x + w && p.mouseY > y && p.mouseY < y + h)
    {
        p.fill(255, 255, 255, 100);
        
        if(p.mouseIsPressed && !clicked)
        {
            switch(state)
            {
                case "curve":
                    levelMap[level].curves.push(
                        new Curv(cam.x - (window.innerWidth / 2) + 150, cam.y - (window.innerHeight / 2) + 80, cam.x - (window.innerWidth / 2) + 500, cam.y - (window.innerHeight / 2) + 80, -40)
                    );
                    break;
                case "print":
                    var writer = p.createWriter("level.txt");
                    
                    for(var i = 0; i < levelMap[level].curves.length; i++)
                    {
                        if(!levelMap[level].curves[i].deleteObj)
                            writer.write("new Curv(" + p.round(levelMap[level].curves[i].x1) + ", " + p.round(levelMap[level].curves[i].y1) + ", " + p.round(levelMap[level].curves[i].x2) + ", " + p.round(levelMap[level].curves[i].y2) + ", " + p.round(levelMap[level].curves[i].c)+ "),");
                    }
                    writer.write("\n\n");
                    
                    for(var i = 0; i < levelMap[level].boxes.length; i++)
                    {
                        if(!levelMap[level].boxes[i].deleteObj)
                            writer.write("new Box(" + p.round(levelMap[level].boxes[i].x) + ", " + p.round(levelMap[level].boxes[i].y) + ", " + p.round(levelMap[level].boxes[i].w) + ", " + p.round(levelMap[level].boxes[i].h) + "),");
                    }

                    writer.close();
                    break;
                case "box":
                    levelMap[level].boxes.push(
                        new Box(cam.x - (window.innerWidth / 2) + 150, cam.y - (window.innerHeight / 2) + 120, 100, 100)
                    );
                    break;
                case "spect":
                    switch(spectMode)
                    {
                        case true:
                                spectMode = false;
                            break;
                        case false:
                                spectMode = true;
                            break;
                    }
                    break;
            }
            
            clickDalay = 50;
            clicked = true;
        }
    }
    
    p.rect(x, y, w, h);
    p.text(txt, x + w / 2, y + h / 2);
};
function spectateModeAssets (p) {

    p.stroke(255);
    p.fill(255, 255, 255, 50);

    if(spectMode)
    {
        p.rect(0, 0, 100, window.innerHeight);

        buttonAsset(10, 10, 80, 80, "CURVE", 20, "curve", p);
        buttonAsset(10, 10 + 90, 80, 80, "BOX", 20, "box", p);
        buttonAsset(100, 0, 80, 30, "PRINT", 20, "print", p);
    }

    buttonAsset(window.innerWidth - 100, 0, 100, 30, "SPECT: " + spectMode, 17, "spect", p);

    clickDalay --;

    if(clickDalay <= 0)
    {
        clickDalay = 0;
        clicked = false;
    }
};






// transition for scenes
var trans = 0;

// detect when portal can be open
var portalAccess = false;

// for curve detection
var pi = Math.PI;

// for live camera span;ning
var spanLiveSize;
var spanLiveX;
var spanLiveY;

// camera for game
var cam;

var spanGrow;

var movingPlayer = false;

/** Key stuff **/
var keys = [];

// for reseting game when player is dead
function reset () {
    trans = 50;
    levelMap[level].player.x = levelMap[level].player.origx;
    levelMap[level].player.y = levelMap[level].player.origy;
    levelMap[level].player.g = -10;
};

var startMusicDelay = 0;
var h = window.innerHeight;

new p5(function (p5){
    
    p5.keyPressed = function () {
        keys[p5.keyCode] = true;
    };
    p5.keyReleased = function (){
        keys[p5.keyCode] = false;
    };
    
    p5.preload = function () {
        
        // load game sounds
        doveS = new Audio('sounds/whistle.mp3');
        bgMusic = new Audio('sounds/desolation.wav');
        walk = new Audio("sounds/walk.mp3");
        jumpS = new Audio("sounds/jump.mp3");
        portalS = new Audio("sounds/portal.mp3");
        wind = new Audio("sounds/wind.mp3");
        squid = new Audio("sounds/squid.mp3");

        populateMaps(p5);

        // fine tune volume and reverb settings
        doveS.volume = 0.05;
        doveS.reverb = 1;
        jumpS.volume = 0.25;
        portalS.volume = 0.05;
        wind.volume = 1;
        squid.volume = 0.2;
    }
    
    p5.setup = function () {
        p5.createCanvas(window.innerWidth, window.innerHeight);
        p5.angleMode(p5.RADIANS);
        p5.frameRate(60);
    }
    
    p5.draw = function () {
        
        p5.createCanvas(window.innerWidth, window.innerHeight);

        // if in levels
         startMusicDelay ++;
         if(startMusicDelay >= 100)
         {
             bgMusic.play();
             startMusicDelay = 100;
         }

        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.background(0);
        drawLevels(p5);

        spectateModeAssets(p5);

        trans /= 1.1;
        p5.fill(255, 255, 255, trans);
        p5.rect(0, 0, window.innerWidth, window.innerHeight);
    }
    
});