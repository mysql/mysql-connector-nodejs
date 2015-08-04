"use strict";

function NullAuth() {}

module.exports = NullAuth;

NullAuth.prototype.name = "NULL";

NullAuth.prototype.run = function (protocol) {
    return true;
};

require('./').register(NullAuth);
