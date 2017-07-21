/************************
 * Defines async queue to be used to handle concurrent connections to database
 * Credit: Tyler Harris
 * https://github.com/tdharris
 ************************/

module.exports = function() {

	var async = require('async');

	var q = async.queue(function(task, done) {
		task.process();
		done(null, 'Finished task.');
	}, 5); // concurrency

	// queue monitoring / log statements
	q.drain = function() { console.log('All items have been processed'); };
	q.saturated = function() { 
		console.log('Concurrency limit ('+q.concurrency+') has been reached. Additional tasks will be queued.');
		console.log('stats:', 'currently processing', q.running()+'/'+q.concurrency, 'of', q.length()); 
	};

	return q;
};
