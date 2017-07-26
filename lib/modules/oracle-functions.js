/**********************************
 * Connect and disconnect methods for oracledb
 * 
 **********************************/
var oracledb = require('oracledb');

exports.doconnect = function(dbConfig, cb) {
  oracledb.getConnection(
    {
      user          : dbConfig.user,
      password      : dbConfig.password,
      connectString : dbConfig.connectString
    },
    cb);
};

exports.dorelease = function(conn, log, cb) {
  conn.close(function (err) {
    if (err)
      cb(err);
  });

  log.info('Connection to Oracle DB has been closed successfully.');

  cb(null, 'Finished updating table.');
};
