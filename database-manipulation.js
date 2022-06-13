const jSQL = require("jsql");

const database = new jSQL.Database(__dirname + "/data/database");

const send = {
    "id": 0,
    "time": "Fri, 10 Jun 2022 18:28:43 GMT",
    "executor": "user1",
    "action": "MESSAGE",
    "target": 0,
    "content": "This is a test message"
}

const read = {
    "id": 1,
    "time": "Fri, 10 Jun 2022 18:28:45 GMT",
    "executor": "user2",
    "action": "READ",
    "target": 0,
    "content": null
}

const edit = {
    "id": 2,
    "time": "Fri, 10 Jun 2022 18:28:50 GMT",
    "executor": "user1",
    "action": "EDIT",
    "target": 0,
    "content": "The test message has been edited"
}

const readEdit = {
    "id": 3,
    "time": "Fri, 10 Jun 2022 18:28:51 GMT",
    "executor": "user2",
    "action": "READ",
    "target": 2,
    "content": null
}

const del = {
    "id": 3,
    "time": "Fri, 10 Jun 2022 18:28:54 GMT",
    "executor": "user1",
    "action": "DELETE",
    "target": 0,
    "content": null
}

const readDelete = {
    "id": 4,
    "time": "Fri, 10 Jun 2022 18:28:55 GMT",
    "executor": "user2",
    "action": "READ",
    "target": 3,
    "content": null
}

const notification = {
    "recipient": "user2",
    "event": {
        "id": 0,
        "time": "Fri, 10 Jun 2022 18:28:43 GMT",
        "executor": "user1",
        "action": "MESSAGE",
        "target": 0,
        "content": "This is a test message"
    }
}

database.execute("+|table|'info'|'outgoing'");
