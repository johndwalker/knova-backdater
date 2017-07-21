/***********************************
 *
 * todo: split into two different classes (one for doc and sql, other to wrap with method and other info)
 * todo: remove global variables
 ***********************************/
var oracleFunctions = require('./modules/oracle-functions');
var numCompletedTasks = 0;
var globalTotalTasks;
var globalConnection;
var globalCallback;

function OracleTask (id, unixDate, sqlString) {
	this.id = id;
	this.unixDate = unixDate;
	this.sqlString = sqlString;
}

OracleTask.prototype.setConnection = function(connection) {
	console.log('setting connection');
	globalConnection = connection; 
}

OracleTask.prototype.setTotalTasks = function(totalTasks) {
	console.log('setting totalTasks to: ' + totalTasks);
	globalTotalTasks = totalTasks;

}

OracleTask.prototype.setCallback = function(callback) {
	console.log('setting callback');
	globalCallback = callback;
}

OracleTask.prototype.process = function() {
	if (!globalConnection || !globalTotalTasks || !globalCallback) {
		console.error('Error: global variables not set in OracleTask.');
		process.exit(4);
	}

	console.log('Processing task: ' + this.sqlString + 
				'\nWhere id==' + this.id + ' and unixDate==' + this.unixDate);

	globalConnection.execute(
		this.sqlString,
		{ unixDate: this.unixDate, id: this.id },
		{ autoCommit: true },
		function(err, result) {
			numCompletedTasks += 1;

			if (err) {
				console.error(err);
			} else {
				console.log("Number of inserted rows: " + result.rowsAffected);
			}

			// close the connection when finished
			if (globalTotalTasks == numCompletedTasks) {
				console.log('totalTasks==numCompletedTasks\nWill now close connection.');
				oracleFunctions.dorelease(globalConnection, globalCallback);
			}
		}
	);
}

module.exports = OracleTask;
