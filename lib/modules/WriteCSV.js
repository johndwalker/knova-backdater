var stringify = require('csv-stringify');
var fs = require('fs');

exports.writeCSVArrayToFile = function(array, filename, log, callback) {
	log.info('Writing \'' + filename + '\' to disk...')

	stringify(array, function(err, output){
		if (err) {
			callback(err);
		}

		log.debug(output);

		fs.writeFile(filename, output, function(err) {
			if (err) {
				callback(err);
			}

			callback(null, 'File \'' + filename + '\' written successfully.');
		});
	});
}
