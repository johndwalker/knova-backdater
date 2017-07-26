/******************
 * Logger
 ******************/
const log4js = require('log4js');

exports.getLogger = function(path) {
	this.path = path;

	if (!this.path) {
		this.path = 'pgcd.log';
	}
	
	log4js.configure({
		appenders: { 
			pgcd: { type: 'file', filename: this.path },
			console: { type: 'console' }
		},
		categories: {
			default: { appenders: ['pgcd', 'console'], level: 'info' }
		}
	});

	return log4js.getLogger('pgcd');
}