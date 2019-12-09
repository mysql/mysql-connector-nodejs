'use strict';

const child = require('child_process');

module.exports = function (id, waitFor) {
    waitFor = waitFor || 5000; // 5 seconds should be enough

    return new Promise((resolve, reject) => {
        child.execFile('docker', ['stop', id], err => {
            if (err) {
                return reject(err);
            }

            setTimeout(resolve, waitFor);
        });
    });
};
