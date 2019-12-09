'use strict';

const child = require('child_process');

module.exports = function (id, waitFor) {
    waitFor = waitFor || 30000; // hope 30 seconds is enough

    return new Promise((resolve, reject) => {
        child.execFile('docker', ['start', id], err => {
            if (err) {
                return reject(err);
            }

            setTimeout(resolve, waitFor);
        });
    });
};
