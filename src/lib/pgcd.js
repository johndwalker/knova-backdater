/**************************************************************
 * preserve-gwava-created-date
 * 
 * todo: save id list to disk
 *       cli to run failed http requests
 *
 * exit codes:
 *   3 - missing command line arguments
 *   4 - null variable in OracleTask
 *   5 - invalid filename
 *   6 - could not establish Oracle database connection
 *   7 - unable to push task to queue
 *   8 - file write error
 **************************************************************/
var argv = require('minimist')(process.argv.slice(2));
const log4js = require('log4js');
var Logger = require('./modules/Logger');
const log = Logger.getLogger(argv['l']);
log.debug(process.argv);

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
				'\n-s - String with token (url with {id} token included)' +
				'\n-l - Log file path (optional - defaults to pwd). Make sure you have write permissions.' +
				'\n-v - Flag log to run in debug mode. No argument required.' +
				'\n-k - Only run knova-recontributor (coming soon!)', // todo: implement this feature
				'\n-h - See these options');

	process.exit(0)
}

// Check for missing flags and values
if (!argv['f'] || !argv['i'] || !argv['p'] || !argv['t'] || !argv['u'] || !argv['s'] ||
	argv['f']==true || argv['i']==true || argv['p']==true || argv['t']==true || argv['u']==true) {
	log.fatal('Missing command-line argument(s). Run \'node pgcd.js -h\' for more information.');
	log4js.shutdown(function() { process.exit(3); });
}

// set debug mode if flagged
if (argv['v']) {
	log.level = 'debug';
	log.debug('Debugging mode enabled');
}

// Read csv file
var fs = require('fs');
var isUtf8 = require('is-utf8');
const dos2unix = require('ssp-dos2unix').dos2unix

readFile = function (callback) {
	filename = argv['f'];

	// verify file is utf8 encoded
	if (!isUtf8(fs.readFileSync(filename))) {
		return callback(new Error(filename + ' is not utf8 encoded!'));
	}

	// dos2unix the file just in case..
	// Convert line endings of a single non-binary, non-irregular file from 
	// '\r\n' to '\n'.
	dos2unix(filename, {native: false, feedback: true, writable: true})

	fs.readFile(filename, 'utf8', function (err, data) {
		if (err) {
			log.fatal(err);
			log4js.shutdown(function() { process.exit(5) });
			return callback(err);
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
	parse(string, {}, function(err, data) {
		if(err) return callback(err)
		log.debug(data);
		callback(null, data);
	});
}

// Convert date to unix timestamp
var Doc = require("./doc");
var moment = require('moment');

convertOracleTimestamps = function(data, callback) {
	log.info('Creating Doc objects and converting timestamps.');

	var skippedDocs = [];

	var docs = data.reduce(function(result, element) {
		log.info('Processing element: ' + element[0] + ' - ' + element[1]);

		var date = moment(element[1], 'MM-DD-YYYY');

		if (isNaN(date)) { // todo: write skipped files to their own .csv file
			log.warn('Skipping date conversion for \'' + element + '\': incorrect date format.');
			skippedDocs.push(new Doc(element[0], element[1]));
		} else if (element[0].match(/\d{7}/g) == null) {
			log.warn('Skipping date conversion for \'' + element + '\': incorrect document ID format.');
			skippedDocs.push(new Doc(element[0], element[1]));
		} else {
			doc = new Doc(element[0], date.valueOf()); // unix/epoch date in milliseconds
			result.push(doc);
			log.info('Data is verified and new Doc has been pushed to list.');
		}

		return result;
	}, []);

	log.debug(docs);

	callback(null, docs, skippedDocs);
}

// write skipped docs to csv file
var WriteCSV = require('./modules/WriteCSV');

writeSkippedDocs = function(docs, skippedDocs, callback) {
	if (skippedDocs) {
		log.info('Writing skipped docs to file for later reference.');

		WriteCSV.writeCSVArrayToFile(skippedDocs, 'skippedDocs.csv', log, function(err, result) {
			if (err) {
				log.error(err);
				log4js.shutdown(function() { process.exit(8) });
			}

			log.info(result);

			callback(null, docs);
		});
	} else {
		log.info('No skipped files to write. Continuing with procedure.');
		callback(null, docs);
	}
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
	dbConfig = new DBConfig(argv['u'], password, argv['i'], argv['p'], argv['t']);
	log.debug(JSON.stringify(dbConfig));
	OracleFunctions.doconnect(
		dbConfig,
		function(err, connection) {
			if (err) {
				log.fatal(err);
				log4js.shutdown(function() { process.exit(6) });
				return;
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
						log.debug('q.push task callback fired.');

						if (err) {
							log.error(err);
						}

						log.info(results);
					}
				);	

				callback();
			}, function(err) {
				if (err) {
					log.error(err);
				}
			});
		}
	);
}

// write docs that were not able to be processed to file
writeUnprocessedDocs = function(processedDocs, unprocessedDocs, callback) {
	if (unprocessedDocs) {
		log.info('Writing unprocessed docs to file for later reference.');

		WriteCSV.writeCSVArrayToFile(unprocessedDocs, 'unprocessedDocs.csv', log, function(err, result) {
			if (err) {
				log.error(err);
				log4js.shutdown(function() { process.exit(8) });
			}

			log.info(result);

			callback(null, processedDocs);
		});
	} else {
		log.info('No unprocessed docs to write to disk. Continuing with procedure.');
		callback(null, processedDocs);
	}
}

writeProcessedDocs = function(processedDocs, callback) {
	if (processedDocs) {
		log.info('Writing processed docs to file for later reference.');

		var filepath = 'processedDocs.csv';

		var idList = [];
		processedDocs.forEach(function (item, key) {
			idList.push(item.id);
		});

		fs.writeFile('processedDocs.csv', idList, function(err) {
			if (err) {
				callback(err);
			}

			log.info('File \'processedDocs.csv\' written successfully.');

			callback(null, idList);
		});
	} else {
		log.info('No processed docs to write to disk. Continuing with procedure.');
		callback(null, null);
	}
}

var knovaRecontributor = require('knova-recontributor');

updateKnova = function(IDList, callback) {
	log.debug('updateKnova method called.');
	log.debug(IDList);

	var url = argv['s'];

	knovaRecontributor.updateKnova(IDList, url, callback);
}

// Execute functions synchronously
async.waterfall([
	readFile,
	parseCSV,
	convertOracleTimestamps,
	writeSkippedDocs,
	promptForPassword,
	connectExecute,
	writeUnprocessedDocs,
	writeProcessedDocs,
	updateKnova
], function (err, result) {
	if (err) {
		log.error(err);
	}
	log.info('Done.');
	log4js.shutdown(function() { process.exit(0) });
});

