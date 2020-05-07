'use strict';

const http = require('http');
const path = require('path');

// POST http://v1.24/containers/<container-id>/stop
module.exports = function (id, waitFor) {
    waitFor = waitFor || 2000;

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            path: `/v1.24/containers/mysql-connector-nodejs_${id}_1/stop`,
            socketPath: path.join('/tmp', 'docker.sock')
        };

        const request = http.request(options);

        request.on('response', response => {
            // needs both 'error' and 'data' handlers
            response.on('error', err => {
                reject(err);
            });

            // the response does not have any content, so the 'data'
            // handler should be a noop
            response.on('data', () => {});

            response.on('end', () => {
                if (response.statusCode === 204 || response.statusCode === 304) {
                    return setTimeout(() => resolve(), waitFor);
                }

                reject(new Error(`Unable to disconnect service.`));
            });
        });

        request.end();
    });
};
