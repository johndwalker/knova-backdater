function OracleTask (id, unixDate, sqlString) {
	this.id = id;
	this.unixDate = unixDate;
	this.sqlString = sqlString;
}

OracleTask.prototype.getSqlString = function() {
	return this.sqlString;
}

OracleTask.prototype.getId = function() {
	return this.id;
}

OracleTask.prototype.getUnixDate = function() {
	return this.unixDate;
}

module.exports = OracleTask;
