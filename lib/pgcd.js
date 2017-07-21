/**************************************************************
 * preserve-gwava-created-date
 * 
 * exit codes:
 *   3 - missing command line arguments
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

var fs = require('fs');

readFile = function (callback) {
	fs.readFile(argv['f'], 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		console.log('Loaded contents of file \'gwava_tid_create_dates.csv\' into memory.');
		//console.log(data);

		callback(null, data);
	});
}

var parse = require('csv-parse');

// convert string to array of csv data
parseCSV = function(string, callback) {
	console.log('Parsing string to CSV.');
	parse(string, {comment: '#'}, function(err, data) {
		callback(null, data);
	});
}

var moment = require('moment');

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

var OracleTask = require("./OracleTask");

generateSql = function(docs, callback) {
	var oracleTasks = new Array();

	for (var i in docs) {
		oracleTasks.push(new OracleTask(
			docs[i].id,
			docs[i].unixDate,
			'UPDATE DOCUMENT ' +
			'SET CREATED=:unixDate ' +
			'WHERE DOCUMENTID = :id'
		));

		console.log(oracleTasks[i].getSqlString());
	}

	callback(null, oracleTasks);
}

const async = require("async");
var oracledb = require('oracledb');

var dbConfig = {
	user: argv['u'],
	ipAddress: argv['i'],
	port: argv['p'],
	table: argv['t'],
	connectString: function () {
		return this.ipAddress + ':' + this.port + '/' + this.table;
	}
}

var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function hidden(query, callback) {
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

promptForPassword = function(oracleTasks, callback) {
	hidden("Password: ", function(password) {
	    console.log("Your password : " + password);
	    callback(null, oracleTasks, password);
	});
}

connectExecute = function(oracleTasks, password, callback) {
	
	oracledb.getConnection(
		{
			user          : dbConfig.user,
			password      : password,
			connectString : dbConfig.connectString()
		},
		function(err, connection) {
			if (err) {
				console.error(err.message);
				return;
			}
			console.log('Connection to Oracle DB was successful!');

			// queue system to limit concurrent connections to 5, 1000 ms timeout
			var q = require('./queue')();
			var numCompletedTasks = 0;

			//for (var i in oracleTasks) {
			async.forEachOf(oracleTasks, function(value, key, callback) {
				q.push(
					function() {
						console.log('Processing task: ' + value.getSqlString() + 
									'\nWhere id==' + value.getId() + ' and unixDate==' + value.getUnixDate());

						connection.execute(
							value.getSqlString(),
							{ unixDate: value.getUnixDate(), id: value.getId() },
							{ autoCommit: true },
							function(err, result) {
								numCompletedTasks += 1;

								if (err) {
									console.error(err);
								} else {
									console.log("Number of inserted rows: " + result.rowsAffected);
								}

								// close the connection when finished
								if (oracleTasks.length == numCompletedTasks) {
									connection.close(
										function(err) {
											if (err) {
												console.error(err.message);
												return;
											}
											console.log('Connection to Oracle DB has been closed successfully.');
										}
									);
								}
							}
						);
					}, function(err, results) {
						if (err) {
							console.error('Error: ' + err);
							return 0;
						}

						console.log('Success: ' + results);
					}
				);	

				callback();
			}, function (err) {
				if (err) console.error('Error: ' + err.message);			
			});
		}
	);

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
