const jSQL = require("jsql");

const database = new jSQL.Database(__dirname + "/data/database");

const json = {
    "id": 1,
    "users": ["user1", "user3"]
}

database.execute("+|'info'|'conversation-data'|" + JSON.stringify(json));
