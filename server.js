const { json } = require('stream/consumers');
const WebSocket = require('ws');
const ws = new WebSocket.Server({ port: 7071 }); //init a websockets

const clients = new Map(); // everyone connected

ws.on("connection", (w) => {
    // joining code here
    const id = uuidv4();
    const metadata = {id};
    clients.set(ws, metadata);

    w.on('message', m => {
        // update code here
        // m is a string so extracts its data
        const message = JSON.parse(m);
        const metadata = clients.get(w);

        console.log(metadata.id + " is making the request for: " + m);

        [...clients.keys()].forEach((client) => {
            client.send(message);
        })
    })

    ws.on("close", () => {
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