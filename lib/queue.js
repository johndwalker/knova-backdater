/************************
 * Defines async queue to be used to handle concurrent connections to database
 * Credit: Tyler Harris
 * https://github.com/tdharris
 ************************/

module.exports = function(log) {

	var async = require('async');

	var q = async.queue(function(task, callback) {
		task.process(log);
		callback(null, 'Task pushed to queue.');
	}, 5); // concurrency

	// queue monitoring / log statements
	q.drain = function() { log.debug('Queue is drained.'); };
	q.saturated = function() { 
		console.log('Concurrency limit ('+q.concurrency+') has been reached. Additional tasks will be queued.');
		console.log('stats:', 'currently processing', q.running()+'/'+q.concurrency, 'of', q.length()); 
	};

	return q;
};
