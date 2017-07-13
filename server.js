var http = require('http');
var fs = require('fs');
var parse = require('csv-parse');
var moment = require('moment');
const async = require("async")

readFile = function (callback) {
	// How it will work:
	// Through browser, drag-and-drop upload, save file path in config file
	// This function will load the config file and load the file referenced
	// That way it doesn't require an argument, and will be compatable with async.waterfall
	fs.readFile('test/gwava_tid_create_dates.csv', 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		console.log('Loaded contents of file \'gwava_tid_create_dates.csv\' into memory.');
		//console.log(data);

		callback(null, data);
	});
}

// convert string to array of csv data
parseCSV = function(string, callback) {
	console.log('Parsing string to CSV.');
	parse(string, {comment: '#'}, function(err, data) {
		callback(null, data);
	});
}

convertOracleTimestamps = function(data, callback) {
	// https://momentjs.com/docs/

	for (i = 1; i < data.length; i++) {
		var date = moment(data[i][1], 'MM-DD-YYYY');
		data[i][1] = date.unix();
		console.log(date.format('YYYY-MM-DD') + ' -> ' + data[i][1]);
	}

	callback(null, data);
}

generateSql = function(data, callback) {
	// http://docs.oracle.com/javadb/10.6.2.1/ref/rrefsqlj26498.html
	// Create update statements for each ID



	callback(null, 'placeholder for generateSql');
}

connectExecute = function(data, callback) {
	console.log(data);
	// queue system to limit concurrent connections to 5
	callback(null, 'placeholderfor connectExecute');
}

updateKnova = function(data, callback) {
	console.log(data);
	// HTTP POST request on some recontribute endpoint in Knova
	callback(null, 'placholder for updateKnova');
}

async.waterfall([
	readFile,
	parseCSV,
	convertOracleTimestamps,
	generateSql,
	connectExecute,
	updateKnova
], function (err, result) {
	if (err) {
		console.log(err);
	}
	console.log(result);
	console.log('Done.');
});