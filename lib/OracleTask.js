/***********************************
 * OracleTask
 *
 * Exit code 4 - null variable in OracleTask
 ***********************************/
const log4js = require('log4js');
var oracleFunctions = require('./modules/oracle-functions');
var numCompletedTasks = 0;

function OracleTask (doc, connection, totalTasks, cb) {
	this.doc = doc;
	this.connection	= connection;
	this.totalTasks	= totalTasks;
	this.cb = cb;
}

OracleTask.prototype.process = function(log) {
	if (!this.doc || !this.connection || !this.totalTasks || !this.cb) {
		log.error('Error: variable(s) set to null in OracleTask.');
		log4js.shutdown(function() { process.exit(4) });
	}

	log.info('Executing SQL command: ' + this.doc.sqlCommand());
	log.info(':unixDate=' + this.doc.unixDate + ', :id=' + this.doc.id);

	var self = this;

	self.connection.execute(
		self.doc.sqlCommand(),
		{ unixDate: self.doc.unixDate, id: self.doc.id },
		{ autoCommit: true },
		function(err, result) {
			numCompletedTasks += 1;

			if (err) {
				log.error(err);
			} else {
				log.info("Successfully inserted row.");
			}

			// close the connection when finished
			if (self.totalTasks == numCompletedTasks) {
				log.info('All tasks complete.');
				log.info('Closing Oracle DB connection...');
				oracleFunctions.dorelease(self.connection, log, self.cb);
			}
		}
	);
}

module.exports = OracleTask;
