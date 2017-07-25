/***********************************
 * DBConfig
 *
 * Contains necessary info to establish Oracle DB connection
 ***********************************/

DBConfig = function(user, password, ipAddress, port, table) {
	this.user = user,
	this.password = password,
	this.ipAddress = ipAddress,
	this.port = port,
	this.table = table,
	connectString = function() {
		return this.ipAddress + ':' + this.port + '/' + this.table;
	}
}

module.exports = DBConfig;
