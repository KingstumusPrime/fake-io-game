const canvas = document.querySelector("#canvas"); // get the canvas
const ctx = canvas.getContext("2d"); // the context
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class actor{ // base class for all players/objects
    constructor(x, y, scale=1, hurts, c="", id="", health=null){
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.hurts = hurts; // hurts is a in value of how much damage it does when you hit it can be a negative value
        this.health = health; // how much health the object has can be null
        this.c = c; // the class it is just like HTML
        this.id = id; // the id is just like HTML
    }

    update(){return;} // basic update function
    onCollide(a){
        if(a.health != null){
            a.health -= this.hurts;
            if(a.health <= 0){
                a.onKill();
            }
        }
        return;
    } // when we collide with another actor
    draw(ctx){return;} // draw function takes in the context
    onKill(){return}; // called when we run out of health
    inBounds(a){ // since all objects are squares (or could be squares just check if the x/y is correct the scale variable is how wide/tall the bounds are)
        return a.x <= this.scale + this.x && a.x >= this.x && a.y <= this.scale + this.y && a.y <= this.y;
    }
}

class entity extends actor{ // something that moves on the server
    constructor(x, y, scale, hurts, c="", id="", health=null){
        super(x, y, scale, hurts, c, id, health); //call the actors constructor
    }

    moveBy(x, y){
        this.x += x;
        this.y += y;
    }

    checkCollides(a){ // two way collision function
        if(this.inBounds(a)){
            this.onCollide(a);
            a.onCollide(this);
            if(a.health <= 0){
                a.onKill();
            }
            if(this.health <= 0){
                this.onKill();
            }
        }
    }

    onCollide(a){
        if(a.health != null){
            a.health -= this.hurts;
        }
    }
}

class testAct extends entity{
    constructor(x, y, scale, hurts, id="", health=-1){
        super(x, y, scale, hurts, "tester", id, health); //call the entities constructor
    }

    draw(ctx){
        ctx.fillRect(this.x, this.y, this.scale, this.scale); // just draw a square
    }

    update(){
        this.x += 1; // auto increment x just to test
    }

    onKill(){
        console.log("IM DEAD 💀💀💀");
        this.scale = 0;
    }
}

class Player extends entity{
    constructor(x, y, scale, hurts, speed, id="", health=-1){
        super(x, y, scale, hurts, "player", id, health); //call the entities constructor
        this.speed = speed;
    }

    checkKeys(keys){ // keys contains up down left and right as bools
        if(keys.left){
            this.moveBy(-this.speed, 0);
        }
        if(keys.right){
            this.moveBy(this.speed, 0);
        }
        if(keys.up){
            this.moveBy(0, -this.speed);
        }
        if(keys.down){
            this.moveBy(0, this.speed);
        }
        if(keys.mouse.v){
            keys.mouse.framesSince += 1;
        }
        if(keys.mouse.v == true && keys.mouse.framesSince % 12 == 0) { // mouse button down fire bullet
            const mag = Math.sqrt((mx - this.x) * (mx - this.x) + (my - this.y) * (my - this.y));
            world.appendField("bullets", new Bullet(this.x, this.y, 10, 10, 7, (mx - this.x) / mag, (my - this.y) / mag));
        }
    }

    draw(ctx){
        ctx.fillRect(this.x, this.y, this.scale, this.scale); // just draw a square
    }
    

}

// bullet class
class Bullet extends entity{
    constructor(x, y, scale, hurts, speed, vx, vy, dist, id="", health=-1){
        super(x, y, scale, hurts, "bullet", id, health); //call the entities constructor
        this.speed = speed;
        this.dist = dist; // how far it goes before termenation
        this.vx = vx * speed; // velocity x
        this.vy = vy * speed; // velocity y
    }

    draw(ctx){
        ctx.fillRect(this.x, this.y, this.scale, this.scale); // just draw a square
    }
    
    update(){
        this.moveBy(this.vx, this.vy); // just move
    }

}

// A basic holder for assorted objects (players, bullets, ect)
class World {
    constructor(entities, actors){
        this.objects = {
            "entities": entities,
            "actors": actors
        }
    }

    newField(name, value){
        this.objects[name] = value;
    }

    appendField(name, value){
        this.objects[name].push(value);
    }
}

// key down
window.addEventListener("keydown", (e) => {
    if(e.key == "w"){
        keys.up = true;
    }
    if(e.key == "s"){
        keys.down = true;
    }
    if(e.key == "a"){
        keys.left = true;
    }
    if(e.key == "d"){
        keys.right = true;
    }
})
// key up
window.addEventListener("keyup", (e) => {
    if(e.key == "w"){
        keys.up = false;
    }
    if(e.key == "s"){
        keys.down = false;
    }
    if(e.key == "a"){
        keys.left = false;
    }
    if(e.key == "d"){
        keys.right = false;
    }
})

// mouse clicked
canvas.onmousedown = function(e) {
    keys.mouse.v = true;
 }

 document.addEventListener('mousemove', (e) => {
    mx = e.x;
    my = e.y;
 });

 canvas.onmouseup = function(e){
    keys.mouse.v = false;
    keys.mouse.framesSince = 0; // reset the mouse timer
 }
var keys = {"up" :false, "down" : false, "left": false, "right": false, mouse: {v: false, framesSince: 0}};
var p = new Player(10, 10, 20, 10, 7, "aTest", 3);
var mx; // mouse x updated on click
var my; // mouse y updated on click
var world = new World([Player], []);
world.newField("bullets", []); // stores all bullets
function update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
    p.checkKeys(keys);
    p.update();
    world.objects["bullets"].forEach(e => {
        e.update();
        e.draw(ctx);
    });
    p.draw(ctx);
    window.requestAnimationFrame(update);
}

update();