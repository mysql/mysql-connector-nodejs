"use strict";

/**
 * PLAIN authentication scheme, sending username and password in plain text
 *
 * @implements {module:mysqlx/Authentication:IAuthenticator}
 * @param properties
 * @constructor
 */
function PlainAuth(properties) {
    this._user = properties.user;
    this._password = properties.password;
}

module.exports = PlainAuth;

PlainAuth.prototype.verifyServer = function (serverMethods) {
    return (serverMethods.indexOf(this.name) !== -1);
};

PlainAuth.prototype.name = "PLAIN";

PlainAuth.prototype.getInitialAuthData = function () {
    var data = new Buffer(this._user.length + this._password.length + 3);
    data[0] = 0x00;
    data.write(this._user, 1);
    data[this._user.length + 1] = 0x00;
    data.write(this._password, this._user.length + 2);
    data[this._user.length + this._password.length + 2] = 0x00;
    return data;
};

PlainAuth.prototype.getNextAuthData = function (serverData) {
    throw new Error("Unexpected data: " + serverData);
};
