"use strict";

GLOBAL.chai = require("chai");
chai.config.includeStack = true;
const chaiAsPromised = require("chai-as-promised"),
    spies = require('chai-spies');

chai.use(chaiAsPromised);
chai.use(spies);

GLOBAL.mysqlx = require('../');
GLOBAL.Client = require('../lib/Protocol/Client');
GLOBAL.Server = require('../lib/Protocol/Server');
GLOBAL.Encoding = require('../lib/Protocol/Encoding');
GLOBAL.Messages = require('../lib/Protocol/Messages');

GLOBAL.nullStream = {
    on: function () {},
    write: function () {}
};

GLOBAL.NullStreamFactory = {
    createSocket: function () {
        return new Promise(function (resolve) {
            resolve(nullStream);
        });
    }
};

var NullAuth = require('../lib/Authentication/NullAuth');

GLOBAL.mysqlxtest = {
    getNullSession: function (done) {
        return mysqlx.getSession({
            authMethod: "NULL",
            socketFactory: NullStreamFactory
        }).catch(function (err) {
            done(err);
        });
    }
};
