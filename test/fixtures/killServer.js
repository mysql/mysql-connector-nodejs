/*
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

const http = require('http');
const path = require('path');

// POST http://v1.41/containers/<container-id>/kill
module.exports = function (id, waitFor) {
    waitFor = waitFor || 2000;

    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            path: `/v1.41/containers/mysql-connector-nodejs_${id}/kill`,
            socketPath: path.join('/var', 'run', 'docker.sock')
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
                // The operation should idempotent. We do not care if it fails
                // because the container is not running.
                if (response.statusCode === 204 || response.statusCode === 409) {
                    return setTimeout(() => resolve(), waitFor);
                }

                reject(new Error('Unable to kill server.'));
            });
        });

        request.on('error', err => {
            reject(err);
        });

        request.end();
    });
};
