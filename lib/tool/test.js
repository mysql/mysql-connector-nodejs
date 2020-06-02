/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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

const mysqlx = require('../../');
const BACKOFF_INCREASE = 1000; // fixed increased in backoff

/**
 * Delay pinging hosts for a given period of time.
 * @private
 * @param {object[]} [hosts] - the list of hosts to ping
 * @param {number} [waitFor] - time to wait
 * @returns {Promise}
 */
function pingAfter (hosts, waitFor) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return ping(hosts, waitFor + BACKOFF_INCREASE).then(resolve).catch(reject);
        }, waitFor);
    });
};

/**
 * Ping a list of hosts until they are available.
 * @private
 * @param {object[]} [hosts] - the list of hosts to ping
 * @param {number} [backoff] - initial backoff
 * @returns {Promise}
 */
function ping (hosts, backoff) {
    hosts = hosts || [];
    backoff = backoff || 0;

    const pipeline = hosts.map(host => mysqlx.getSession({ host: host.trim() }));

    return Promise.all(pipeline)
        .then(sessions => {
            return sessions.map(session => session.close());
        })
        .catch(err => {
            // The server is not yet available.
            if ((err.code && err.code === 'ECONNREFUSED')) {
                return pingAfter(hosts, backoff);
            }

            // Altought it is returning an error, the server is available.
            if (err.info && err.info.code) {
                return;
            }

            throw err;
        });
};

exports.ping = ping;
