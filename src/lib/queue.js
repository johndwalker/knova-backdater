/************************
 * Defines async queue to be used to handle concurrent connections to database
 * Credit: Tyler Harris
 * https://github.com/tdharris
 ************************/

module.exports = function(log) {

	var async = require('async');

	var q = async.queue(function(task, callback) {
		task.process(log, callback);
	}, 5); // concurrency

	// queue monitoring / log statements
	q.drain = function() { log.debug('Queue is drained.'); };
	q.saturated = function() { 
		log.info('Concurrency limit ('+q.concurrency+') has been reached. Additional tasks will be queued.');
		log.info('Stats:', 'Currently processing', q.running()+'/'+q.concurrency, 'of', q.length()); 
	};

	return q;
};
