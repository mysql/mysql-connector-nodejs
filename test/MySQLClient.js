var assert = require('assert');
var MySQLClient = require('../lib/MySQLClient');
var MySQLException = require('../lib/MySQLException');

describe('Basic Property Tests', function () {
  
  it('Setting connection string', function () {
    var connStr = "mysql://host";
    var client = new MySQLClient(connStr);
    assert.equal(client.ConnectionString, connStr);
  })
  /*
  it('Bad Protocol', function () {
    var connStr = "xxx://host";
      assert.throw(function () {
        var client = MySQLClient(connStr);
      }, MySQLException);
    })
    */
})
