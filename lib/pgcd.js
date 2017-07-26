/**************************************************************
 * preserve-gwava-created-date
 * 
 * exit codes:
 *   3 - missing command line arguments
 *   4 - null variable in OracleTask
 *   5 - invalid filename
 *   6 - could not establish Oracle database connection
 *   7 - unable to push task to queue
 *
 * todo: CLI to determine log level (default to info)
 **************************************************************/
var argv = require('minimist')(process.argv.slice(2));
const log4js = require('log4js');
var Logger = require('./modules/Logger');
const log = Logger.getLogger(argv['l']);

// parse command line arguments
if (process.argv.slice(2).length == 0) {
	log.fatal('No command line arguments given. Run \'node pgcd.js -h\' for more information.');
	log4js.shutdown(function() { process.exit(3); });
}

var colors = require('colors');

if (argv['h']) {
	console.log('~preserve-gwava-created-date~'.white.bgBlue +
				'\nCreated by John Walker under the GNU General Public License v3.0\n' +
				'\nCommand-line options: (f, h, p, t, and u are required)' +
				'\n-f - Path to .csv file' +
				'\n-i - Host IP Address' +
				'\n-p - Host port' +
				'\n-t - Table' +
				'\n-u - Username' +
				'\n-l - Log file path (optional - defaults to pwd). Make sure you have write permissions.' +
				'\n-d - Flag log to run in debug mode. No argument required.' +
				'\n-h - See these options');

	process.exit(0)
}

// Check for missing flags and values
if (!argv['f'] || !argv['i'] || !argv['p'] || !argv['t'] || !argv['u'] ||
	argv['f']==true || argv['i']==true || argv['p']==true || argv['t']==true || argv['u']==true) {
	log.fatal('Missing command-line argument(s). Run \'node pgcd.js -h\' for more information.');
	log4js.shutdown(function() { process.exit(3); });
}

// set debug mode if flagged
if (argv['d']) {
	log.level = 'debug';
	log.debug('Debugging mode enabled');
}

// Read csv file
var fs = require('fs');

readFile = function (callback) {
	filename = argv['f'];
	fs.readFile(filename, 'utf8', function (err, data) {
		if (err) {
			log.fatal(err);
			log4js.shutdown(function() { process.exit(5) });
		}
		log.info('Loaded contents of file \'' + filename + '\' into memory.');
		log.debug(data);

		callback(null, data);
	});
}

// Parse csv data to array
var parse = require('csv-parse');

parseCSV = function(string, callback) {
	log.info('Parsing string to CSV.');
	parse(string, {comment: '#'}, function(err, data) {
		log.debug(data);
		callback(null, data);
	});
}

// Convert date to unix timestamp
var Doc = require("./doc");
var moment = require('moment');

convertOracleTimestamps = function(data, callback) {
	log.info('Creating Doc objects');

	var docs = data.reduce(function(result, element) {
		log.info('Processing element: ' + element[0] + ' - ' + element[1]);

		var date = moment(element[1], 'MM-DD-YYYY');

		if (isNaN(date)) { // todo: write skipped files to their own .csv file
			log.warn('Skipping date conversion for \'' + element + '\': incorrect date format.');
		} else if (element[0].match(/\d{7}/g) == null) {
			log.warn('Skipping date conversion for \'' + element + '\': incorrect document ID format.');
		} else {
			doc = new Doc(element[0], date.unix());
			result.push(doc);
			log.info('Data is verified and new Doc has been pushed to list.');
		}

		return result;
	}, []);

	log.debug(docs);

	callback(null, docs);
}

// Get Oracle user password
const async = require("async");
var passwordPrompt = require('./modules/password-prompt');

promptForPassword = function(docs, callback) {
	log.info('Will now attempt to connect to Oracle database.'.underline);
	passwordPrompt.hidden("Please enter the Oracle database password:".black.bgWhite + ' ', function(password) {
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
				log.fatal(err);
				log4js.shutdown(function() { process.exit(6) });
			}
			log.debug(connection);
			log.info('Connection to Oracle DB was successful!'.underline);
			log.info('Will now queue update commands.');

			// queue to limit concurrent connections to 5, 1000 ms timeout
			var q = require('./queue')(log);

			// execute update statements
			async.forEachOf(docs, function(doc, key, callback) {
				log.info('Queuing ' + (key+1) + ' of ' + docs.length + '.');
				log.debug(doc);

				let task = new OracleTask(doc, connection, docs.length, cb);

				q.push(
					task,
					function(err, results) {
						if (err) {
							log.fatal(err);
							log4js.shutdown(function() { process.exit(7) });
						}

						log.info(results);
					}
				);	

				callback();
			}, function(err) {
				if (err) {
					log.error('Error: ' + err);
				}
			});
		}
	);
}

// todo: HTTP POST request on some recontribute endpoint in Knova
updateKnova = function(data, callback) {
	log.info(data);
	
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
		log.error(err);
	}
	log.info(result);
	log.info('Done.');
});
