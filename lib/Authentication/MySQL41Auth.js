"use strict";

var crypto = require('crypto');

var sha1 = function (text) {
    var s = crypto.createHash('sha1');
    s.update(text, 'utf8');
    return s.digest();
};

var doubleSha1 = function (text) {
    var round1 = crypto.createHash('sha1');
    round1.update(text, 'utf8');
    var round2 = crypto.createHash('sha1');
    round2.update(round1.digest());
    return round2.digest();
};

var xor = function (buf1, buf2) {
    if (buf1.length !== 20 || buf2.lenth !== 20) {
//    throw;
    }
    var res = new Buffer(20);
    for (var i = 0; i < 20; ++i) {
        res[i] = buf1[i] ^ buf2[i];
    }
    return res;
};

/**
 * MySQL 4.1 Authentication
 *
 * @implements {module:mysqlx/Authentication:IAuthenticator}
 * @param properties
 * @constructor
 */
function MySQL41Auth(properties) {
    this._user = properties.user;
    this._password = properties.password;
}

module.exports = MySQL41Auth;

MySQL41Auth.prototype.verifyServer = function (serverMethods) {
    return (serverMethods.indexOf(this.name) !== -1);
};

MySQL41Auth.prototype.name = "MYSQL41";

MySQL41Auth.prototype.getInitialAuthData = function () {
    return;
};

MySQL41Auth.prototype.getNextAuthData = function (serverData) {
    var buf1 = sha1(this._password);
    var hash = crypto.createHash('sha1');

    var tmpBuffer = new Buffer(40);
    serverData.copy(tmpBuffer);
    doubleSha1(this._password).copy(tmpBuffer, 20);
    var pass = xor(buf1, hash.digest());

    var data = new Buffer(this._user.length + pass.length + 3);
    data[0] = 0x00;
    data.write(this._user, 1);
    data[this._user.length + 1] = 0x00;
    pass.copy(data, this._user.length + 2);
    data[this._user.length + 2 + data.length] = 0x00;
    return data;
};
