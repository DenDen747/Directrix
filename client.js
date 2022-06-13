// Node.js socket client script
const net = require('net');
const readline = require('readline')
const util = require('util')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const socket = new net.Socket();

socket.connect(8080, "localhost", () => {
    var recursiveAsyncReadLine = function () {
        rl.question('', function (answer) {
          if (answer == 'exit') //we need some base case, for recursion
            return rl.close(); //closing RL and returning from function.
          socket.write(replaceAll(answer, "|", "\u0007"));
          recursiveAsyncReadLine(); //Calling this function again to ask new question
        });
      };
      
      recursiveAsyncReadLine(); //we have to actually start our recursion somehow
});

socket.on("data", (data) => {
    //console.log(JSON.parse(data.toString()));
    console.log(util.inspect(JSON.parse(data.toString()), false, null, true /* enable colors */))
})

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
