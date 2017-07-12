var http = require('http');
var csvParser = require('./lib/csvParser')

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end();
}).listen(8080);

csvParser.readFile('test/tid_date.csv');
