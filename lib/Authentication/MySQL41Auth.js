"use strict";

var crypto = require('crypto');

var sha1 = function (text) {
    var s = crypto.createHash('sha1');
    s.update(text);//, 'utf8');
    return s.digest();
};

var xor = function (buf1, buf2) {
    if (buf1.length !== buf2.length) {
        throw new Error("Length of both buffers has to be identical");
    }
    var res = new Buffer(buf1.length);
    for (var i = 0; i < buf1.length; ++i) {
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
    if (serverData.length != 20) {
        throw new Error("Scramble buffer had invalid length - expected 20 bytes, got " + serverData.length)
    }
    var buf1 = sha1(this._password);
    var buf2 = sha1(buf1);

    var s = crypto.createHash('sha1');
    s.update(serverData);
    s.update(buf2);
    var tmpBuffer = s.digest();

    var pass = xor(buf1, tmpBuffer);

    var data = new Buffer(this._user.length + pass.length*2 + 3);
    data[0] = 0x00;
    data.write(this._user, 1);
    data[this._user.length + 1] = 0x00;
    data.write("*", this._user.length + 2);

    for (var i = 0, pos = this._user.length + 3; i < 20; pos += 2, ++i) {
        if (pass[i] <=16) {
            data.write("0" + pass[i].toString(16), pos);
        } else {
            data.write(pass[i].toString(16), pos);
        }
    }
    return data;
};

