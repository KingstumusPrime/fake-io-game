const WebSocket = require('ws');
const ws = new WebSocket.WebSocketServer({
  port: 7071,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed if context takeover is disabled.
  }
});

const clients = new Map(); // everyone connected
const servers = new Map();
let isX = false; // goes O then X then O then X then O then X ect..
ws.on("connection", (w) => {
    // joining code here
    const id = uuidv4();
    const metadata = {id: id, uid: null};
    clients.set(w, metadata);
    servers.set(id, w);


    w.on('message', m => {
        // update code here
        // m is a string so extracts its data
        const message = JSON.parse(m);
        const metadata = clients.get(w);

        console.log(metadata.id + " is making the request for: " + m);
        if(message.type == "join"){
            clients.get(w)["uid"] = message.id;
            [...clients.keys()][0].send(JSON.stringify({type: "getW", socket: metadata.id}));
            [...clients.keys()].forEach((client) => {
                if(client != w){
                    client.send(JSON.stringify(message));
                }
    
            })
        }

        else if(message.type == "giveW"){ // give w is server only
            servers.get(message.socket).send(JSON.stringify({type: "receiveW", world: message.world})); // send the world
        }
        else if(message.type == "getClan"){
            console.log("YESSIR")
            w.send(JSON.stringify({type: "getClan", clan: (isX? "X" : "O") }));
            isX = !isX;
        }
        else{
        [...clients.keys()].forEach((client) => {
            if(client != w){
                client.send(JSON.stringify(message));
            }

        })
        }
    })

    w.on("close", () => {
        [...clients.keys()].forEach((client) => {
            if(client != w){
                client.send(JSON.stringify({type: "leave",id: clients.get(w).uid})); // tell all clients someone left
            }

        })
        clients.delete(w);
    });
})

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

console.log("STARTING SERVER!")