"use strict";

var net = require('net');

function StreamFactory() {
}

StreamFactory.prototype.createSocket = function (properties) {
    var self = this;
    var options = properties;
    // TODO: Verify properties
    return new Promise(
        function (resolve, failure) {
            var socket = net.createConnection(options, function () {
                resolve(socket);
            });
            socket.on('error', function (err) {
                failure(err);
            });
        }
    );
};

module.exports = StreamFactory;
