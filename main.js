function checkTicTacToe(board) {
    // Check for rows
    for (let i = 0; i < 3; i++) {
      if (board[i * 3] === board[i * 3 + 1] && board[i * 3 + 1] === board[i * 3 + 2] && board[i * 3] !== "") {
        return board[i * 3] + " wins!"; // Player has won
      }
    }
  
    // Check for columns
    for (let i = 0; i < 3; i++) {
      if (board[i] === board[i + 3] && board[i + 3] === board[i + 6] && board[i] !== "") {
        return board[i] + " wins!"; // Player has won
      }
    }
  
    // Check for diagonals
    if (board[0] === board[4] && board[4] === board[8] && board[0] !== "") {
      return board[0] + " wins!"; // Player has won
    }
    if (board[2] === board[4] && board[4] === board[6] && board[2] !== "") {
      return board[2]  + " wins!";// Player has won
    }
  
    // Check for tie
    for (let i = 0; i < 9; i++) {
      if (board[i] === "") {
        return ""; // Game is not over yet
      }
    }
  
    // Game is a tie
    return "tie";
  }

const canvas = document.querySelector("#canvas"); // get the canvas
const ctx = canvas.getContext("2d"); // the context
var marginL = 0;
var marginT = 0;
canvas.width = 2700;
canvas.height = 2700;
var board = ["", "", "", "", "", "", "", "", ""]


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
        this.maxHealth = 60;
    }

    moveBy(x, y){
        this.x += x;
        this.y += y;
    }

    checkCollides(a){ // two way collision function
        if(this.inBounds(a)){
            this.onCollide(a);
            if(a.c == "bullet"){
                broadcastAll(`kb|${a.id}`);
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
        }
    }
    onKill(){
        delete world.objects.entities[this.id]; // remove from world
    }
}


class Player extends entity{
    constructor(x, y, scale, hurts, speed, clan, id="", health=-1){
        super(x, y, scale, hurts, "player", id, health); //call the entities constructor
        this.speed = speed;
        this.clan = clan;
    }

    checkKeys(keys){ // keys contains up down left and right as bools

        if(keys.left && !(this.x < 0)){
            this.moveBy(-this.speed, 0);

        }
        if(keys.right && !(this.x  + this.scale > canvas.width)){
            this.moveBy(this.speed, 0);
        }
        if(keys.up && !(this.y < 0)){
            this.moveBy(0, -this.speed);
        }
        if(keys.down && !(this.y  + this.scale > canvas.height)){
            this.moveBy(0, this.speed);
        }
        if(keys.mouse.v){
            keys.mouse.framesSince += 1;
        }
        if(keys.mouse.v == true && keys.mouse.framesSince % 12 == 0) { // mouse button down fire bullet
            const mag = Math.sqrt((mx - this.x) * (mx - this.x) + (my - this.y) * (my - this.y));
            const rand = Math.random();
            const b = new Bullet(this.x + this.scale/2, this.y + this.scale/2, 10, 10, 7, (mx - this.x) / mag, (my - this.y) / mag, 0,this.id + rand, this.clan, 1);
            broadcastAll(`b|${b.id}|${b.x}|${b.y}|${b.vx}|${b.vy}|${b.parent}`);
            world.appendField("bullets", b );
        }
        if(this.x +  marginL > window.screen.width * 0.4){
            marginL -= 7;
            canvas.style.marginLeft = marginL + "px";
        }
        if(this.x + marginL < window.screen.width * 0.6){
            marginL += 7;
            canvas.style.marginLeft = marginL + "px";
        }
        if(this.y + window.screen.height/8 + marginT > window.screen.height/2){
            marginT -= 7;
            canvas.style.marginTop = marginT + "px";
        }
        if(this.y + marginT < window.screen.height/2){
            marginT += 7;
            canvas.style.marginTop = marginT + "px";
        }
    }

    onKill(){
        this.x = Math.floor(Math.random() * canvas.width);
        this.y = Math.floor(Math.random() * canvas.height);
        this.health = this.maxHealth;
    }

    
}

class px extends Player{ // player that is an x
    constructor(x, y, scale, hurts, speed, id="", health=-1){
        super(x, y, scale, hurts, speed, "X", id, health); //call the player constructor
        this.speed = speed;
    }

    // only difference is drawing it
    draw(ctx){
        ctx.save(); // get settings
        ctx.strokeStyle = "black";
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

class po extends Player{ // player that is an O
    constructor(x, y, scale, hurts, speed, id="", health=-1){
        super(x, y, scale, hurts, speed, "O", id, health); //call the player constructor
    }

    // changed draw function
    draw(ctx){
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = this.scale/4;
        ctx.beginPath();
        ctx.arc(this.x + this.scale/2,this.y + this.scale/2,this.scale/2,0,360);
        ctx.stroke();
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.arc(this.x + this.scale/2,this.y + this.scale/2,this.scale/2,0,((this.health/this.maxHealth) * 360)*(Math.PI/180), false);
        ctx.stroke();
        ctx.restore();
    }
}

class Enemy extends entity{ // enemy is anyone else playing on your end you are player on theres you are enemy
    constructor(x, y, scale, hurts, id="", health=-1, clan=""){
        super(x, y, scale, hurts, "enemy", id, health); //call the entities constructor
        this.clan = clan;
    }
}

// enemy that looks like X
class ex extends Enemy{
    constructor(x, y, scale, hurts, id="", health=-1){
        super(x, y, scale, hurts, id, health, "X"); //call the entities constructor
    }

    draw(ctx){
        ctx.save(); // get settings
        ctx.strokeStyle = "black";
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

// enemy that looks like O
class eo extends Enemy{
    constructor(x, y, scale, hurts, id="", health=-1){
        super(x, y, scale, hurts, id, health, "O"); //call the entities constructor
    }

    // changed draw function
    draw(ctx){
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = this.scale/4;
        ctx.beginPath();
        ctx.arc(this.x + this.scale/2,this.y + this.scale/2,this.scale/2,0,360);
        ctx.stroke();
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.arc(this.x + this.scale/2,this.y + this.scale/2,this.scale/2,0,((this.health/this.maxHealth) * 360)*(Math.PI/180), false);
        ctx.stroke();
        ctx.restore();
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
        if(this.parent == "X"){
            ctx.fillStyle = "red";
        }else{
            ctx.fillStyle = "blue";
        }
        ctx.fillRect(this.x, this.y, this.scale, this.scale); // just draw a square
        ctx.fillStyle = "black"
    }
    
    update(){
        this.moveBy(this.vx, this.vy); // just movess
        this.dist -= this.vx + this.vy;
    }

    onKill(){
        delete world.objects["bullets"][this.id];
    }
}

// the zone that is captured
class Zone extends entity{
    constructor(x, y, scale, hurts, id){
        super(x, y, scale, hurts, "zone", id, 600); //call the entities constructor
        this.capped = {"X": this.maxHealth, "O" : this.maxHealth};
    }


    draw(ctx){
        const scale = this.scale * 0.5; // half of the box is used
        ctx.save();
        if(this.capped["O"] != this.maxHealth){
            this.health = this.capped["O"];
            ctx.strokeStyle = "blue";
        }else if(this.capped["X"] != this.maxHealth){
            this.health = this.capped["X"];
            ctx.strokeStyle = "red";
        }



        ctx.strokeRect(this.x, this.y, this.scale, this.scale);
        const bSize = this.scale * (this.health/this.maxHealth)
        if(this.health/this.maxHealth < 1 && this.health/this.maxHealth > 0){
            ctx.strokeRect(this.x + (this.scale - bSize)/2, this.y+ (this.scale - bSize)/2, bSize, bSize);
        }

        if(this.capped["X"] <= 0){ // the zone is captured by an X
            board[this.id] = "X"
            ctx.save(); // get settings
            ctx.strokeStyle = "red";
            ctx.lineWidth = scale/4;
            ctx.beginPath();
            const x = this.x + this.scale/2
            const y = this.y + this.scale/2
            ctx.moveTo(x - scale/2, y - scale/2);
            ctx.lineTo(x + scale/2, y + scale/2);
        
            ctx.moveTo(x + scale/2, y - scale/2);
            ctx.lineTo(x - scale/2, y + scale/2);
            ctx.stroke();
            ctx.restore();
        }else if(this.capped["O"] <= 0){
            board[this.id] = "O"
            ctx.save();
            ctx.strokeStyle = "blue";
            ctx.lineWidth = scale/4;
            ctx.beginPath();
            ctx.arc(this.x + this.scale/2,this.y + this.scale/2,scale/2,0,360);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }


    onCollide(a){
        if(this.health != null && a.health != null && this.capped["X"] > 0 && this.capped["O"] > 0){
            if(a.clan == "X"){
                this.capped[a.clan] -= a.hurts;
                this.capped["O"] = this.maxHealth;
            }else{
                this.capped[a.clan] -= a.hurts;
                this.capped["X"] = this.maxHealth;
            }
        }
    }

    checkInZone(e){ // e is a array of entities
        if(this.capped["X"] == 0 || this.capped["O"] == 0){return;} // do not check if capped
        let hasX = 0;
        let hasO = 0;
        e.forEach(entity => {
            if(this.inBounds(entity)){
                if(entity.clan == "X"){
                    hasX += 1;
                }else if(entity.clan == "O"){
                    hasO += 1;
                }
            }
        });
        if(hasX > 0 && !hasO > 0){
            this.capped["X"] -= 1;
            this.capped["O"] = this.maxHealth;
        } else if(!hasX > 0 && hasO > 0){
            this.capped["O"] -= 1;
            this.capped["X"] = this.maxHealth;
        }
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
                console.log(e.clan);
                if(e.clan == "X"){
                    this.objects.entities[e.id] = new ex(e.x, e.y, e.scale, e.hurts, e.id, e.health);
                }
                else if(e.clan == "O"){
                    this.objects.entities[e.id] = new eo(e.x, e.y, e.scale, e.hurts, e.id, e.health);
                }
            }
        })
        Object.keys(w.zones).forEach((zone => {
            const z = w.zones[zone];
            this.objects.zones[zone].health = z.health;
            this.objects.zones[zone].capped = z.capped;
        }))
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
    mx = e.x - marginL;
    my = e.y - marginT;
 });

 canvas.onmouseup = function(e){
    keys.mouse.v = false;
    keys.mouse.framesSince = 0; // reset the mouse timer
 }
var keys = {"up" :false, "down" : false, "left": false, "right": false, mouse: {v: false, framesSince: 0}};
var mx; // mouse x updated on click
var my; // mouse y updated on click
var enemyOnZ = false; // used to keep track if any enemies are on zones
var fSinceW = 0; // how many frames since a win
function update(){

    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas
    p.checkKeys(keys);
    // update zones if host
    Object.keys(world.objects["zones"]).forEach(zone => {
        if(isHost){
            const z = world.objects["zones"][zone];
            z.checkInZone(Object.values(world.objects.entities));
            broadcastAll(`z|${zone}|${z.capped["X"]}|${z.capped["O"]}`);
        }

    world.objects["zones"][zone].draw(ctx);

    })

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
        if(world.objects["bullets"][bullet].parent != p.clan){
            p.checkCollides(world.objects["bullets"][bullet]); // calls the checkCollides event for both
        }

    })
    if(checkTicTacToe(board) != ""){
        ctx.font = "100px serif";
        ctx.fillText(checkTicTacToe(board), window.screen.width/2 - marginL,  window.screen.height/2 - marginT);
        fSinceW += 1;
        if(fSinceW == 500){
            p.onKill();
            Object.keys(world.objects["zones"]).forEach(zone => {
                world.objects["zones"][zone].capped["X"] = world.objects["zones"][zone].maxHealth;
                world.objects["zones"][zone].capped["O"] = world.objects["zones"][zone].maxHealth;
            })
            board = ["", "", "", "","","","","",""]
        }
    }
    broadcastAll(`${p.id}|${p.x}|${p.y}|${p.health}`);
    window.requestAnimationFrame(update);

}

var ws;
var clan = "X"; // what side we are on
var p; // us
var world; // the world
var connected = false; // used to wait until we connnected to server
const z1 = new Zone(300, 300, 600, 0, 0);
const z2 = new Zone(1100, 300, 600, 0, 1);
const z3 = new Zone(1800, 300, 600, 0, 2);
const z4 = new Zone(300, 1100, 600, 0, 3);
const z5 = new Zone(1100, 1100, 600, 0, 4);
const z6 = new Zone(1800, 1100,600, 0, 5);
const z7 = new Zone(300, 1800, 600, 0, 6);
const z8 = new Zone(1100, 1800, 600, 0, 7);
const z9 = new Zone(1800, 1800, 600, 0, 8);
var isHost = false; // host is first person on the server
var peer; // our peer
var conns = new Map(); // our connection
async function getPeers(){
    const response = await fetch("https://tic-attack-toe-server.onrender.com/myapp/peerjs/peers");

    const peersArr = await response.json();
    if(peer.id == peersArr[0]){
        isHost = true;
    }else{
        isHost = false;
    }
    const list = peersArr ?? [];
    return list.filter((id) => id !== peer.id);
}

function broadcastAll(message){
    for(let [c, actor] of conns){
        c.send(message);
    }
}

async function init() {

    peer = await new Peer('', {
        host: 'tic-attack-toe-server.onrender.com',
        port: '443',
        path: '/myapp',
        key: 'peerjs'
      });


    peer.on('open', async function(id) {
        //p = new po( Math.floor(Math.random() * canvas.width), Math.floor(Math.random() * canvas.height), 52, 10, 7, uuidv4(), 60);



        console.log('My peer ID is: ' + id);
        const peers = await getPeers();

        console.log()
        if((peers.length + 1)%2 == 0 ){
            p = new po(10, 10, 52, 10, 7, id, 60);
        }else{
            p = new px(10, 10, 52, 10, 7, id, 60)
        }
        console.log(p);
        world = new World([p], []);
        world.newField("bullets", []); // stores all bullets
        world.newField("zones", [z1, z2, z3, z4, z5, z6, z7, z8, z9]); // stores all bullets

        console.log("connecting too", peers[0]);
        peers.forEach(p => {
            const conn = peer.connect(p, {reliable: true})
            conns.set(conn, "");
            conn.on("open", () => {
                console.log("CONNECTED TO SOMEONE");
                broadcastAll(`join|${peer.id}|${p.clan}`);
                conn.on("data", (d) => {
                    console.log("RECIVED SOME DATA!, ", d);
                    const data = d.split("|"); 
                    if(data[0] == "join"){
                        let enemy;
                        console.log(data[2]);
                        if(data[2] == "X"){
                           enemy = new ex(100, 100, 52, 10, data[1], 30);
                        }else{
                            enemy = new eo(100, 100, 52, 10, data[1], 30);                       
                        }
                        world.objects.entities[data[1]] = enemy;
                    }else if(data[0] == "b"){
                        const b =  new Bullet(parseInt(data[2]), parseInt(data[3]), 10, 10,1.3, parseInt(data[4]), parseInt(data[5]), 0, data[1], data[6], 1 );
                        world.objects.bullets[data[1]] = b;
                        console.log(b);
                    } if (data[0] == "kb"){
                        delete world.objects.bullets[data[1]];
                    } if(data[0] == "z"){
                        console.log(world.objects["zones"][parseInt(data[1])]);
                        world.objects["zones"][parseInt(data[1])].capped["X"] = parseInt(data[2]);
                        world.objects["zones"][parseInt(data[1])].capped["O"] = parseInt(data[3]);
                    }else if(data[0] == "newHost"){
                        getPeers();
                    }else{ // message is as follows: id|x|y|health
                        world.objects.entities[data[0]].x = parseInt(data[1]);
                        world.objects.entities[data[0]].y = parseInt(data[2]);
                        world.objects.entities[data[0]].health = parseInt(data[3]);
                    }
                })
                conn.on("close", () => {
                    console.log("conn close event");
                    delete world.objects.entities[conn.peer];
                });
                window.addEventListener("unload", () => {
                    conn.close();
                });
            });

        })
        peer.on("connection", (conn) => {
            conn.on("data", function(d) {
                console.log("RECIVED SOME DATA!, ", d);
                const data = d.split("|"); 

                if(data[0] == "join"){
                    conns.set(conn, "");
                    conn.send(`join|${peer.id}|${p.clan}`);
                    let enemy;
                    if(data[2] == "X"){
                       enemy = new ex(100, 100, 52, 10, data[1], 30);
                    }else{
                        enemy = new eo(100, 100, 52, 10, data[1], 30);                       
                    }

                    world.appendField("entities", enemy);
                }else if(data[0] == "b"){
                    const b =  new Bullet(parseInt(data[2]), parseInt(data[3]), 10, 10,1.3, parseInt(data[4]), parseInt(data[5]), 0, data[1], data[6], 1 );
                    world.objects.bullets[data[1]] = b;
                    console.log(b);
                }else if(data[0] == "z"){
                    console.log(world.objects["zones"][parseInt(data[1])]);
                    world.objects["zones"][parseInt(data[1])].capped["X"] = parseInt(data[2]);
                    world.objects["zones"][parseInt(data[1])].capped["O"] = parseInt(data[3]);
                }else if(data[0] == "newHost"){
                    getPeers();
                }else{ // message is as follows: id|x|y|health
                    console.log(world.objects.entities[data[0]]);
                    world.objects.entities[data[0]].x = parseInt(data[1]);
                    world.objects.entities[data[0]].y = parseInt(data[2]);
                    world.objects.entities[data[0]].health = parseInt(data[3]);
                }

                conn.on("close", () => {
                    console.log("conn close event");
                    delete world.objects.entities[conn.peer];
                })

                window.addEventListener("unload", () => {
                    if(isHost){
                        broadcastAll("newHost|");
                    }
                    conn.close();
                });
            });


        });

        update();
      });
}

init();