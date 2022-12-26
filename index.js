const fs = require("fs");
const jSQL = require("jsql");
const net = require("net");
const { send } = require("process");
const logger = require("./logger");

const database = new jSQL.Database(__dirname + "/data/database");

let instances = [];

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
        instances = remove(instances, instance);
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
                logger.log("INCOMING", instance.username + " executed " + JSON.stringify(args));
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
                            try {
                                const conversation = database.execute(".|'conversations'|'" + args[2] + "'");
                                const matching = [];
                                for (let i = conversation.length - 1; i >= 0; i--) {
                                    matching.push(conversation[i]);
                                }
                                read(instance, args[2]);
                                respond(socket, { "status": 400, "comment": "", "content": { "messages": matching } });
                            } catch {
                                respond(socket, { "status": 404, "comment": "Conversation not found", "content": {} });
                            }
                        } else if (args.length == 4) {
                            try {
                                const conversation = database.execute(".|'conversations'|'" + args[2] + "'");
                                const matching = [];
                                let addedMessages = 0;
                                for (let i = conversation.length - 1; i >= 0; i--) {
                                    matching.push(conversation[i]);
                                    if (conversation[i].action == "MESSAGE") {
                                        addedMessages++;
                                    }
                                    if (addedMessages >= 10 * args[3]) {
                                        break;
                                    }
                                }
                                respond(socket, { "status": 400, "comment": "", "content": { "messages": matching } });
                            } catch {
                                respond(socket, { "status": 404, "comment": "Conversation not found", "content": {} });
                            }
                        } else {
                            respond(socket, { "status": 400, "comment": "", "content": {} });
                        }
                    } else {
                        respond(socket, { "status": 400, "comment": "", "content": {} });
                    }
                } else if (args[0] == "unread") {
                    if (args.length == 2) {
                        try {
                            const conversation = database.execute(".|'conversations'|'" + args[1] + "'");
                            if (conversation) {
                                const cond = {
                                    "username": [ [ instance.username ], [ true ] ]
                                }
                                const unreads = database.execute(".|'info'|'accounts'|" + JSON.stringify(cond))[0].unread;
                                if (!unreads.includes(args[1])) {
                                    unreads.push(parseInt(args[1]));
                                    const set = {
                                        "unread": unreads
                                    }
                                    database.execute("^|'info'|'accounts'|" + JSON.stringify(set) + "|" + JSON.stringify(cond));
                                }
                                respond(socket, { "status": 200, "comment": "", "content": {} });
                            } else {
                                respond(socket, { "status": 404, "comment": "Conversation not found", "content": {} });
                            }
                        } catch {
                            respond(socket, { "status": 404, "comment": "Conversation not found", "content": {} });
                        }
                    } else {
                        respond(socket, { "status": 400, "comment": "", "content": {} });
                    }
                } else if (args[0] == "message") {
                    const c = {
                        "username": [ [ instance.username ], [ true ] ]
                    }
                    const unread = database.execute(".|'info'|'accounts'|" + JSON.stringify(c))[0].unread.includes(parseInt(args[1]));
                    if (unread) {
                        read(instance, args[1]);
                    }
                    const message = {
                        "id": null,
                        "time": new Date().toUTCString(),
                        "executor": instance.username,
                        "action": "MESSAGE",
                        "target": null,
                        "content": args[2]
                    }
                    try {
                        const conversation = database.execute(".|'conversations'|'" + args[1] + "'");
                        let id;
                        try {
                            id = conversation[conversation.length - 1].id + 1;
                        } catch {
                            id = 0;
                        }
                        message.id = id;
                        message.target = id;
                        database.execute("+|'conversations'|'" + args[1] + "'|" + JSON.stringify(message));
                        fs.appendFileSync(__dirname + "/data/conversations/" + args[1] + ".log", "[" + message.time + "] [" + message.id + "] [" + message.executor + "] [" + message.action + "] [" + message.target + "]: " + message.content + "\n");
                        respond(socket, { "status": 200, "comment": "", "content": {} });
                        const notification = {
                            "conversation": args[1],
                            "time": message.time,
                            "executor": message.executor,
                            "action": message.action,
                        }
                        notify(instance, args[1], notification, true);
                    } catch {
                        respond(socket, { "status": 404, "comment": "Conversation not found", "content": {} });
                    }
                } else {
                    respond(socket, { "status": 400, "comment": "", "content": {} });
                }
            } else {
                logger.log("INCOMING", socket.address().address + " executed " + JSON.stringify(args));
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
                            const condition = {
                                "recipient": [ [ newInstance.username ], [ true ] ]
                            }
                            const notifications = database.execute(".|'info'|'outgoing'|" + JSON.stringify(condition));
                            notifications.forEach(notification => {
                                respond(newInstance.socket, { "status": 103, "comment": "Notification", "content": notification.event });
                            });
                            const cond = {
                                "recipient": [ [ args[1] ], [ true ] ]
                            }
                            database.execute("-|'info'|'outgoing'|" + JSON.stringify(cond));
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
    try {
        socket.write(JSON.stringify(data));
        let instance;
        instances.forEach(element => {
            if (element.socket === socket) {
                instance = element;
            }
        });
        if (instance) {
            logger.log("OUTGOING", instance.username + " response " + JSON.stringify(data));
        } else {
            logger.log("OUTGOING", socket.address().address + " response " + JSON.stringify(data));
        }
    } catch {
        instances.forEach(element => {
            if (element.socket == socket) {
                instances = remove(instances, element);
            }
        });
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

function remove(array, value) {
    let result = [];
    array.forEach(element => {
        if (element != value) {
            result.push(element);
        }
    });
    return result;
}

function notify(instance, conversationID, message, markUnread) {
    const cond = {
        "id": [ [ conversationID ], [ true ] ]
    }
    const members = database.execute(".|'info'|'conversation-data'|" + JSON.stringify(cond))[0].users;
    const recipients = remove(members, instance.username);
    let notifications = [];
    recipients.forEach(recipient => {
        const notification = {
            "recipient": recipient,
            "event": message
        }
        notifications.push(notification);
        const condition = {
            "username": [ [ recipient ], [ true ] ]
        }
        if (markUnread) {
            let unreads = database.execute(".|'info'|'accounts'|" + JSON.stringify(condition))[0].unread;
            if (!unreads.includes(parseInt(conversationID))) {
                unreads.push(parseInt(conversationID));
                const set = {
                    "unread": unreads
                }
                database.execute("^|'info'|'accounts'|" + JSON.stringify(set) + "|" + JSON.stringify(condition));
            }
        }
    });
    notifications.forEach(notification => {
        let sent = false;
        instances.forEach(element => {
            if (notification.recipient == element.username) {
                respond(element.socket, { "status": 103, "comment": "Notification", "content": notification.event });
                sent = true;
            }
        });
        if (sent) {
            notifications = remove(notifications, notification);
        }
    });
    notifications.forEach(unsent => {
        database.execute("+|'info'|'outgoing'|" + JSON.stringify(unsent));
    });
}

function read(instance, conversationID) {
    const message = {
        "conversation": conversationID,
        "time": new Date().toUTCString(),
        "executor": instance.username,
        "action": "READ"
    }
    try {
        const cond = {
            "id": [ [ 0 ], [ true ]]
        }
        const conversationData = database.execute(".|'info'|'conversation-data'|" + JSON.stringify(cond));
        const upto = conversationData[0].upto[conversationData[0].users.indexOf(instance.username)];
        const conversation = database.execute(".|'conversations'|'" + conversationID + "'");
        if (upto < conversation[conversation.length - 1].id) {
            let id;
            try {
                id = conversation[conversation.length - 1].id;
            } catch {
                id = 0;
            }
            const newUpto = conversationData[0].upto;
            newUpto[conversationData[0].users.indexOf(instance.username)] = id;
            const set = {
                "upto": newUpto
            }
            const cond = {
                "id": [ [ conversationID ], [ true ] ]
            }
            database.execute("^|'info'|'conversation-data'|" + JSON.stringify(set) + "|" + JSON.stringify(cond));
            fs.appendFileSync(__dirname + "/data/conversations/" + conversationID + ".log", "[" + message.time + "] [null] [" + message.executor + "] [" + message.action + "] [null]: Read all new messages\n");
            notify(instance, conversationID, message, false);
        }
        const condition = {
            "username": [ [ instance.username ], [ true ] ]
        }
        let unreads = database.execute(".|'info'|'accounts'|" + JSON.stringify(condition))[0].unread;
        if (!unreads.includes(conversationID)) {
            unreads = remove(unreads, conversationID);
            const set = {
                "unread": unreads
            }
            database.execute("^|'info'|'accounts'|" + JSON.stringify(set) + "|" + JSON.stringify(condition));
        }
    } catch {
        respond(socket, { "status": 404, "comment": "Conversation not found", "content": {} });
    }
}
