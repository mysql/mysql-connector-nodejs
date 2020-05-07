'use strict';

const dns = require('dns');

module.exports = function (host) {
    return new Promise(resolve => {
        dns.resolve6(host, (err, addresses) => {
            if (err) {
                // ignore errors
                return resolve();
            }

            resolve(addresses[0]);
        });
    });
};
