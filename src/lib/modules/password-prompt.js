/************************************
 * Prompts the user for a password.
 * Displays '*' in place of the actual characters
 * Credit: Hors Sujet
 * https://stackoverflow.com/questions/24037545/how-to-hide-password-in-the-nodejs-console
 ************************************/
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

exports.hidden = function(query, callback) {
    var stdin = process.openStdin();
    process.stdin.on("data", function(char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length+1).join("*"));
                break;
        }
    });

    rl.question(query, function(value) {
        rl.history = rl.history.slice(1);
        callback(value);
    });
}
