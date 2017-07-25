/**************************************************************
 * preserve-gwava-created-date
 * 
 * exit codes:
 *   3 - missing command line arguments
 *   4 - null variable in OracleTask
 **************************************************************/
 
 // parse command line arguments
if (process.argv.slice(2).length == 0) {
	console.error('ERROR: No command line arguments given.' +
				  '\nRun \'node pgcd.js -h\' for more information.');
	process.exit(3);
}

var argv = require('minimist')(process.argv.slice(2));

if (argv['h']) {
	console.log('~preserve-gwava-created-date~' +
				'\nCreated by John Walker under the GNU General Public License v3.0\n' +
				'\nCommand-line options: (f, h, p, t, and u are required)' +
				'\n-f - Path to .csv file' +
				'\n-i - Host IP Address' +
				'\n-p - Host port' +
				'\n-t - Table' +
				'\n-u - Username' +
				'\n-l - Log file path (optional - defaults to project top directory)' +
				'\n-h - See these options');

	process.exit(0)
}

// Check for missing flags and values
if (!argv['f'] || !argv['i'] || !argv['p'] || !argv['t'] || !argv['u'] ||
	argv['f']==true || argv['i']==true || argv['p']==true || argv['t']==true || argv['u']==true) {
	console.error('ERROR: Missing command-line argument(s)' +
				  '\nRun \'node pgcd.js -h\' for more information.');
	process.exit(3);
}

// Read csv file
var fs = require('fs');

readFile = function (callback) {
	filename = argv['f'];
	fs.readFile(filename, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		console.log('Loaded contents of file \'' + filename + '\' into memory.');

		callback(null, data);
	});
}

// Parse csv data to array
var parse = require('csv-parse');

parseCSV = function(string, callback) {
	console.log('Parsing string to CSV.');
	parse(string, {comment: '#'}, function(err, data) {
		callback(null, data);
	});
}

// Convert date to unix timestamp
var moment = require('moment');
var Doc = require("./doc");

convertOracleTimestamps = function(data, callback) {
	var docs = data.reduce(function(result, element) {
		var date = moment(element[1], 'MM-DD-YYYY');

		if (isNaN(date)) {
			console.warn('Warning: skipping date conversion for \'' + element + '\': incorrect date format.');
		} else if (element[0].match(/\d{7}/g) == null) {
			console.warn('Warning: skipping date conversion for \'' + element + '\': incorrect document ID format.');
		} else {
			result.push(new Doc(element[0], date.unix()));
		}

		return result;
	}, []);

	callback(null, docs);
}

// Get Oracle user password
const async = require("async");
var passwordPrompt = require('./modules/password-prompt');

promptForPassword = function(docs, callback) {
	passwordPrompt.hidden("Password: ", function(password) {
	    callback(null, docs, password);
	});
}

// Connect to Oracle DB and process tasks
var OracleFunctions = require('./modules/oracle-functions');
var OracleTask = require("./OracleTask");
var DBConfig = require("./modules/DBConfig");

connectExecute = function(docs, password, cb) {
	OracleFunctions.doconnect(
		new DBConfig(argv['u'], password, argv['i'], argv['p'], argv['t']),
		function(err, connection) {
			if (err) {
				console.error(err.message);
				return;
			}
			console.log('Connection to Oracle DB was successful!');

			// queue to limit concurrent connections to 5, 1000 ms timeout
			var q = require('./queue')();

			// execute update statements
			async.forEachOf(docs, function(doc, key, callback) {
				q.push(
					new OracleTask(doc, connection, docs.length, cb),
					function(err, results) {
						if (err) {
							console.error('Error: ' + err);
							return 0;
						}

						console.log('Success: ' + results);
					}
				);	
				
				callback();
			}, function(err) {
				if (err) console.error('Error: hello' + err.message);
			});
		}
	);
}

// todo: HTTP POST request on some recontribute endpoint in Knova
updateKnova = function(data, callback) {
	console.log(data);
	
	callback(null, 'placeholder for updateKnova');
}

// Execute functions synchronously
async.waterfall([
	readFile,
	parseCSV,
	convertOracleTimestamps,
	promptForPassword,
	connectExecute,
	updateKnova
], function (err, result) {
	if (err) {
		console.log(err);
	}
	console.log(result);
	console.log('Done.');
});
