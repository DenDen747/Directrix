const fs = require("fs");

function log(level, message) {
    let datetime = new Date().toUTCString()
    const s = "[" + datetime + "] [" + level + "]: " + message;
    console.log(s);
    fs.appendFileSync(__dirname + "/data/server.log", s + "\n", (err) => {
        console.log(err);
    });
}

module.exports = { log };
