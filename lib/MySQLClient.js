var url = require('url');
var MySQLSession = require('./MySQLSession');
var Exception = require('./MySQLException');

function MySQLClient(connectionString) 
{
  ParseConnectionString(connectionString);
  this.ConnectionString = connectionString;
}

MySQLClient.prototype.openSession = function (options)
{
  return new MySQLSession();
}

function ParseConnectionString(connString) 
{
  try {
    var props = url.parse(connString, true, true);
    if (props.protocol != 'mysql:')
      throw new MySQLException(props.proto + ' is not a valid MySQL protocol');
  } catch (ex) {
    throw new MySQLException('Unable to parse connection string ' + connStr, ex);
  }
}

module.exports = MySQLClient;