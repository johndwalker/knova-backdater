/******************
 * doc.js
 * Stores document id and unix date
 * 
 ******************/
function Doc (id, unixDate) {
	this.id = id;
	this.unixDate = unixDate;
}

Doc.prototype.sqlCommand = function() {
	return 'UPDATE DOCUMENT ' + // todo: KADMIN.DOCUMENT
	       'SET CREATED=:unixDate ' +
		   'WHERE DOCUMENTID = :id'
}

module.exports = Doc;
