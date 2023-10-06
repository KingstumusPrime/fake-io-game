const canvas = document.querySelector("#canvas"); // get the canvas
const ctx = canvas.getContext("2d"); // the context
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

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
        return  this.x < a.x + a.scale &&
        this.x + this.scale > a.x &&
        this.y < a.y + a.scale &&
        this.y + this.scale > a.y;
    }
}

class entity extends actor{ // something that moves on the server
    constructor(x, y, scale, hurts, c="", id="", health=null){
        super(x, y, scale, hurts, c, id, health); //call the actors constructor
        this.maxHealth = health;
    }

    moveBy(x, y){
        this.x += x;
        this.y += y;
    }

    checkCollides(a){ // two way collision function
        if(this.inBounds(a)){
            this.onCollide(a);
            if(a.c == "bullet"){
                a.onKill();
            }
            if(this.health <= 0){
                this.onKill();
            }
        }
    }

    onCollide(a){
        if(this.health != null && a.health != null){
            this.health -= a.hurts;
            ws.send(JSON.stringify({"type": "hurt", id: this.id, amount: a.hurts}));
        }
    }
    onKill(){
        ws.send(JSON.stringify({type: "kill", id: this.id})); // remove from EVERY world
        delete world.objects.entities[this.id]; // remove from world
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
            ws.send(JSON.stringify({type: "movement", "x": p.x, "y": p.y, id: this.id})); // send our new position to the server
        }
        if(keys.right){
            this.moveBy(this.speed, 0);
            ws.send(JSON.stringify({type: "movement","x": p.x, "y": p.y, id: this.id})); // send our new position to the server
        }
        if(keys.up){
            this.moveBy(0, -this.speed);
            ws.send(JSON.stringify({type: "movement","x": p.x, "y": p.y, id: this.id})); // send our new position to the server
        }
        if(keys.down){
            this.moveBy(0, this.speed);
            ws.send(JSON.stringify({type: "movement","x": p.x, "y": p.y, id: this.id})); // send our new position to the server
        }
        if(keys.mouse.v){
            keys.mouse.framesSince += 1;
        }
        if(keys.mouse.v == true && keys.mouse.framesSince % 12 == 0) { // mouse button down fire bullet
            const mag = Math.sqrt((mx - this.x) * (mx - this.x) + (my - this.y) * (my - this.y));
            const rand = Math.random();
            world.appendField("bullets", new Bullet(this.x + this.scale/2, this.y + this.scale/2, 10, 10, 7, (mx - this.x) / mag, (my - this.y) / mag, 0,this.id + rand, this.id, 1) );
            ws.send(JSON.stringify({type: "bullet", x: this.x + this.scale/2 , y: this.y + this.scale/2, mx: mx, my: my, parent: this.id, id: this.id + rand }));
        }
    }

    draw(ctx){
        ctx.fillRect(this.x, this.y, this.scale, this.scale)
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = this.scale/4;
        ctx.beginPath();
        ctx.arc(this.x + this.scale/2,this.y + this.scale/2,this.scale/2,0,360);
        ctx.stroke();
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.arc(this.x + this.scale/2,this.y + this.scale/2,this.scale/2,0,((this.health/this.maxHealth) * 360)*(Math.PI/180));
        ctx.stroke();
        ctx.restore();
    }
    
}

class Enemy extends entity{ // enemy is anyone else playing on your end you are player on theres you are enemy
    constructor(x, y, scale, hurts, id="", health=-1){
        super(x, y, scale, hurts, "enemy", id, health); //call the entities constructor
    }

    draw(ctx){
        ctx.save(); // get settings
        ctx.strokeStyle = "black";
        ctx.fillRect(this.x, this.y, this.scale, this.scale)
        ctx.lineWidth = this.scale/4;
        ctx.beginPath();
        const x = this.x + this.scale/2
        const y = this.y + this.scale/2
        ctx.moveTo(x - this.scale/2, y - this.scale/2);
        ctx.lineTo(x + this.scale/2, y + this.scale/2);
    
        ctx.moveTo(x + this.scale/2, y - this.scale/2);
        ctx.lineTo(x - this.scale/2, y + this.scale/2);
        ctx.stroke();
        const  s = this.scale*(this.health/this.maxHealth)
        // outer x that shows health
        ctx.strokeStyle = "red";
        ctx.beginPath();

        ctx.moveTo(x - s/2, y - s/2);
        ctx.lineTo(x + s/2, y + s/2);
    
        ctx.moveTo(x + s/2, y - s/2);
        ctx.lineTo(x - s/2, y + s/2);
        ctx.stroke();
        ctx.restore(); // undo our changes to the ctx
    }

}

// bullet class
class Bullet extends entity{
    constructor(x, y, scale, hurts, speed, vx, vy, dist, id="", parent, health=1){
        super(x, y, scale, hurts, "bullet", id, health); //call the entities constructor
        this.speed = speed;
        this.dist = dist; // how far it goes before termenation
        this.vx = vx * speed; // velocity x
        this.vy = vy * speed; // velocity y
        this.parent = parent; // who fired it
    }

    draw(ctx){
        ctx.fillRect(this.x, this.y, this.scale, this.scale); // just draw a square
    }
    
    update(){
        this.moveBy(this.vx, this.vy); // just movess
        this.dist -= this.vx + this.vy;
    }

    onKill(){
        console.log("kill B");
        console.log(this.id);
        delete world.objects["bullets"][this.id];
        ws.send(JSON.stringify({type: "killB", id: this.id}));
    }
}

// A basic holder for assorted objects (players, bullets, ect)
class World {
    constructor(entities, actors){
        this.objects = {
            "entities": {},
            "actors": {}
        };
        entities.forEach(e => {
            this.objects["entities"][e.id] = e;
        })
        actors.forEach(e => {
            this.objects["actors"][e.id] = e;
        })
    }

    newField(name, value){
        this.objects[name] = {};
        value.forEach(e => {
            this.objects[name][e.id] = e;
        })
    }

    appendField(name, value){
        this.objects[name][value.id] = value;
    }

    generateWorld(w){ // converts json into objects
        Object.keys(w.entities).forEach((id) => {
            const e = w.entities[id];
            if(e.id != p.id){
                this.objects.entities[e.id] = new Enemy(e.x, e.y, e.scale, e.hurts, e.id, e.health);
            }
        })
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
var p = new Player(Math.floor(Math.random() * 150), 0, 52, 10, 7, uuidv4(), 30);
var mx; // mouse x updated on click
var my; // mouse y updated on click

function update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
    p.checkKeys(keys);
    // update entities
    Object.keys(world.objects["entities"]).forEach(e => {
        world.objects["entities"][e].update();
        world.objects["entities"][e].draw(ctx);
    });
    // update bullets
    Object.keys(world.objects["bullets"]).forEach(e => {
        world.objects["bullets"][e].update();
        world.objects["bullets"][e].draw(ctx);
    });
    // check for collisions
    Object.keys(world.objects["bullets"]).forEach(bullet => {
        if(world.objects["bullets"][bullet].parent != p.id){
            p.checkCollides(world.objects["bullets"][bullet]); // calls the checkCollides event for both
        }

    })
    window.requestAnimationFrame(update);
}

async function connectToServer() {
    const ws = new WebSocket('ws://localhost:7071/ws');
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if(ws.readyState === 1) {
                clearInterval(timer)
                resolve(ws);
            }
        }, 10);
    });
}   
var ws;
var world = new World([p], []);
world.newField("bullets", []); // stores all bullets
async function init() {
    ws = await connectToServer();
    ws.send(JSON.stringify({type: "join", id: p.id}));
    ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        // on player move
        // example {x: 0, y: 0}
        if(data.type == "movement"){
            world.objects.entities[data.id].x = data["x"];
            world.objects.entities[data.id].y = data["y"];
        }

        // spawns a new bullet
        // {x: 0, y: 0, mx: 0, my: 0, id}
        if(data.type == "bullet"){
            const mag = Math.sqrt((data.mx - data.x) * (data.mx - data.x) + (data.my - data.y) * (data.my - data.y));
            world.appendField("bullets", new Bullet(data.x, data.y, 10, 10, 7, (data.mx - data.x) / mag, (data.my - data.y) / mag, 0, data.id, data.parent, 1) );
        }

        // kills someone
        // {id: xxxxxxx-xxxxxxxxxx-xxxxxxxxx}
        if(data.type == "kill"){
            delete world.objects.entities[data.id]; // remove from world
        }
        // kills a bullet
        // {id: xxxxxxx-xxxxxxxxxx-xxxxxxxxx}
        if(data.type == "killB"){
            console.log("KILL B")
            console.log(data.id)
            delete world.objects["bullets"][data.id];
        }
        // changes health
        // {id: xxxxxxxx, amount: 0}
        if(data.type == "hurt"){
            world.objects.entities[data.id].health -= data.amount;
        }
        if(data.type == "join"){ // add new "enemy"\
            world.appendField("entities", new Enemy(100, 100, 52, 10, data.id, 30));
        }
        // give us a new id
        if(data.type == "giveId"){
            world.objects.entities[p.id].id = data.id; // give the id
        }
        // server is asking for a current world
        if(data.type == 'getW'){
            ws.send(JSON.stringify({"type": "giveW", socket: data.socket, "world": JSON.stringify(world.objects)})); // the socket is who will receive the world
        }

        // we just joined and need a new world
        if(data.type == "receiveW"){
            world.generateWorld(JSON.parse(data.world)); // turns json into world
        }

        if(data.type == "leave"){
            delete world.objects.entities[data.id]; // just remove who left
        }
    };
    
    update();
}

init();