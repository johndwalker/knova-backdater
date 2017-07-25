/***********************************
 * OracleTask
 *
 * Exit code 4 - null variable in OracleTask
 ***********************************/
var oracleFunctions = require('./modules/oracle-functions');
var numCompletedTasks = 0;

function OracleTask (doc, connection, totalTasks, cb) {
	this.doc = doc;
	this.connection	= connection;
	this.totalTasks	= totalTasks;
	this.cb = cb;
}

OracleTask.prototype.process = function() {
	if (!this.doc || !this.connection || !this.totalTasks || !this.cb) {
		console.error('Error: variable(s) set to null in OracleTask.');
		process.exit(4);
	}

	console.log('Processing task: ' + this.doc.sqlCommand() + 
				'\nWhere id==' + this.doc.id + ' and unixDate==' + this.doc.unixDate);

	var self = this;

	self.connection.execute(
		self.doc.sqlCommand(),
		{ unixDate: self.doc.unixDate, id: self.doc.id },
		{ autoCommit: true },
		function(err, result) {
			numCompletedTasks += 1;

			if (err) {
				console.error(err); // todo: log it in special error file
			} else {
				console.log("Number of inserted rows: " + result.rowsAffected); // todo: log it
			}

			// close the connection when finished
			if (self.totalTasks == numCompletedTasks) {
				console.log('All tasks complete.\nClosing Oracle DB connection.');
				oracleFunctions.dorelease(self.connection, self.cb);
			}
		}
	);
}

module.exports = OracleTask;
