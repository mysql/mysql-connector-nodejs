

function MySQLException(msg, ex) {
  this.Exception = ex;
  this.Message = msg;
}

module.exports = MySQLException;