var http = require('http');
var fs = require('fs');
var parse = require('csv-parse');
var moment = require('moment');
const async = require("async");
var OracleTask = require("./OracleTask.js");

readFile = function (callback) {
	// How it will work:
	// Through browser, drag-and-drop upload, save file path in config file
	// This function will load the config file and load the file referenced
	// That way it doesn't require an argument, and will be compatable with async.waterfall
	fs.readFile('../test/gwava_tid_create_dates.csv', 'utf8', function (err, data) {
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
	var docs = data.reduce(function(result, element) {
		var date = moment(element[1], 'MM-DD-YYYY');

		if (isNaN(date)) {
			console.warn('Warning: skipping date conversion for \'' + element + '\': incorrect date format.');
		} else if (element[0].match(/\d{7}/g) == null) {
			console.warn('Warning: skipping date conversion for \'' + element + '\': incorrect document ID format.');
		} else {
			result.push({
				id: element[0],
				unixDate: date.unix()
			});
		}

		return result;
	}, []);

	callback(null, docs);
}

generateSql = function(docs, callback) {
	// http://docs.oracle.com/javadb/10.6.2.1/ref/rrefsqlj26498.html
	// Create update statements for each ID

	var oracleTasks = new Array();

	for (var i in docs) {
		oracleTasks.push(new OracleTask(
			'UPDATE KADMIN.DOCUMENT ' +
			'SET CREATED=' + docs[i].unixDate + ' ' +
			'WHERE DOCUMENTID = ' + docs[i].id + ';'
		));

		console.log(oracleTasks[i].getSqlString());
	}

	callback(null, oracleTasks);
}

connectExecute = function(oracleTasks, callback) {
	// todo: connect to knova

	// queue system to limit concurrent connections to 5, 1000 ms timeout
	var q = require('./queue')();

	for (var i in oracleTasks) {
		q.push(
			function() {
				console.log('Processing task: ' + oracleTasks[i].getSqlString());
			}, function(err, results) {
				if (err) {
					console.log('Error: ' + err);
					return 0;
				}

				console.log('Success: ' + results);
			}
		);
	}

	// todo: disconnect from knova

	callback(null, 'placeholder for connectExecute');
}

updateKnova = function(data, callback) {
	console.log(data);
	// HTTP POST request on some recontribute endpoint in Knova
	callback(null, 'placeholder for updateKnova');
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
