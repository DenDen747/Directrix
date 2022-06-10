const jSQL = require("jsql");
const net = require("net");
const { send } = require("process");
const logger = require("./logger");

const database = new jSQL.Database(__dirname + "/data/database");

const instances = [];

logger.log("INFO", "Starting server...");

const server = new net.Server();

server.listen(8080, "0.0.0.0", () => {
    logger.log("INFO", "Server started");
});

server.on("connection", (socket) => {
    logger.log("INFO", socket.address().address + " connected");
    
    socket.on("end", () => {
        let instance;
        instances.forEach(element => {
            if (element.socket === socket) {
                instance = element;
            }
        });
        if (instance) {
            logger.log("INFO", instance.username + " disconnected");
        } else {
            logger.log("INFO", socket.address().address + " disconnected");
        }
    });

    socket.on("data", (data) => {
        setTimeout(() => {
            const args = data.toString().split("\u0007");
            let instance;
            instances.forEach(element => {
                if (element.socket === socket) {
                    instance = element;
                }
            });
            if (instance) {
                logger.log("REQUEST", instance.username + " executed " + JSON.stringify(args));
                if (args[0] == "list") {
                    if (args[1] == "conversations") {
                        if (args.length == 2) {
                            const allConversations = database.execute(".|'info'|'conversation-data'");
                            let matching = [];
                            allConversations.forEach(conversation => {
                                if (conversation.users.includes(instance.username)) {
                                    const element = {
                                        "id": conversation.id,
                                        "unread": false,
                                        "users": conversation.users
                                    }
                                    const condition = {
                                        "username": [ [ instance.username ], [ true ] ]
                                    }
                                    const unreads = database.execute(".|'info'|'accounts'|" + JSON.stringify(condition))[0].unread;
                                    if (unreads.includes(conversation.id)) {
                                        element.unread = true;
                                    }
                                    matching.push(element);
                                }
                            });
                            respond(socket, { "status": 200, "comment": "", "content": { "conversations": matching } });
                        } else {
                            respond(socket, { "status": 400, "comment": "", "content": {} });
                        }
                    } else if (args[1] == "messages") {
                        if (args.length == 3) {

                        } else {
                            respond(socket, { "status": 400, "comment": "", "content": {} });
                        }
                    } else {
                        respond(socket, { "status": 400, "comment": "", "content": {} });
                    }
                } else {
                    respond(socket, { "status": 400, "comment": "", "content": {} });
                }
            } else {
                logger.log("REQUEST", socket.address().address + " executed " + JSON.stringify(args));
                if (args[0] == "signup") {
                    if (args.length == 3) {
                        const condition = {
                            "username": [ [ args[1] ], [ true ] ]
                        }
                        const rs = database.execute(".|'info'|'accounts'|" + JSON.stringify(condition));
                        if (rs.length > 0) {
                            respond(socket, { "status": 406, "comment": "Username taken", "content": {} });
                        } else if (is_empty(args[1])) {
                            respond(socket, { "status": 406, "comment": "Empty username", "content": {} });
                        } else {
                            const account = {
                                "username": args[1],
                                "password": args[2],
                                "unread": []
                            }
                            database.execute("+|'info'|'accounts'|" + JSON.stringify(account));
                            const newInstance = {
                                "username": args[1],
                                "socket": socket
                            }
                            instances.push(newInstance);
                            respond(socket, { "status": 201, "comment": "", "content": {} });
                        }
                    } else {
                        respond(socket, { "status": 400, "comment": "", "content": {} });
                    }
                } else if (args[0] == "login") {
                    if (args.length == 3) {
                        const condition = {
                            "&": {
                                "username": [ [ args[1] ], [ true ] ],
                                "password": [ [ args[2] ], [ true ] ]
                            }
                        }
                        const rs = database.execute(".|'info'|'accounts'|" + JSON.stringify(condition));
                        if (rs.length > 0) {
                            const newInstance = {
                                "username": args[1],
                                "socket": socket
                            }
                            instances.push(newInstance);
                            respond(socket, { "status": 202, "comment": "", "content": {} });
                        } else {
                            respond(socket, { "status": 401, "comment": "", "content": {} });
                        }
                    } else {
                        respond(socket, { "status": 400, "comment": "", "content": {} });
                    }
                } else {
                    respond(socket, { "status": 400, "comment": "", "content": {} });
                }
            }
        }, 100);
    });
});

server.on("close", () => {
    logger.log("INFO", "Stopping server...");
});

process.on("SIGINT", () => {
    logger.log("INFO", "Server stopped");
    process.exit(0);
});

function respond(socket, data) {
    socket.write(JSON.stringify(data));
    let instance;
    instances.forEach(element => {
        if (element.socket === socket) {
            instance = element;
        }
    });
    if (instance) {
        logger.log("RESPONSE", instance.username + " response " + JSON.stringify(data));
    } else {
        logger.log("RESPONSE", socket.address().address + " response " + JSON.stringify(data));
    }
}

function is_empty(x)
{
    return (                                                           //don't put newline after return
        (typeof x == 'undefined')
              ||
        (x == null)
              ||
        (x == false)        //same as: !x
              ||
        (x.length == 0)
              ||
        (x == 0)            // note this line, you might not need this. 
              ||
        (x == "")
              ||
        (x.replace(/\s/g,"") == "")
              ||
        (!/[^\s]/.test(x))
              ||
        (/^\s*$/.test(x))
    );
}
