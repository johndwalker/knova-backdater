/******************
 * Logger
 ******************/
const log4js = require('log4js');

log4js.configure({
	appenders: { 
		pgcd: { type: 'file', filename: './log/pgcd.log' },
		console: { type: 'console' }
	},
	categories: {
		default: { appenders: ['pgcd', 'console'], level: 'info' }
	}
});

exports.getLogger = function() {
	return log4js.getLogger('pgcd');
}