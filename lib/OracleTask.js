function OracleTask (sqlString) {
	this.sqlString = sqlString;
}

OracleTask.prototype.getSqlString = function() {
	return this.sqlString;
}

module.exports = OracleTask;
