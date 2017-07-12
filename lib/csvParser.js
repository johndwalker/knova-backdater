var fs = require('fs');
var parse = require('csv-parse');

exports.readFile = function (filename) {
	fs.readFile(filename, 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		console.log('Loaded contents of file \'tid_date.csv\' into memory.');
		console.log(data);

		// parse string to csv
		parseCSV(data);
	});
}

parseCSV = function(string) {
	console.log('Parsing string to CSV.');
	parse(string, {comment: '#'}, function(err, output) {
		console.log(output);
		console.log('test: ' + output[0][0]);
		console.log('test: ' + output[0][1]);
	});
}
