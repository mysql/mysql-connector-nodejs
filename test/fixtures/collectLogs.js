/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

const cp = require('child_process');
const config = require('../config');

/**
 * Log collection process.
 * @typedef {Object} LogProc
 * @property {number} id - the process id
 * @property {Object[]} logs - a list of log entries
 */

/**
 * Runs a given script in a new process and collects the generated log entries matching a given pattern.
 * @private
 * @function
 * @param {string} [section] - filter a specific log section (supports wildcards)
 * @param {string} path - path to the script to run
 * @param {string[]} [args] - the list of script arguments
 * @param {Object} [options] - extended options
 * @returns {LogProc}
 */
module.exports = function (section, path, args, options) {
    args = args || [];
    // a custom connection configuration can be provided via the options object
    options = Object.assign({ config }, options);

    return new Promise((resolve, reject) => {
        // the connection configuration is made available to each script via
        // the MYSQLX_CLIENT_CONFIG environment variable
        const env = Object.assign({}, process.env, { MYSQLX_CLIENT_CONFIG: JSON.stringify(options.config), NODE_DEBUG: section || '*' });
        const child = cp.fork(path, args, { env, silent: true });
        const proc = { id: child.pid, logs: [] };

        // pipe stdout to the parent process (so mocha can display it)
        child.stdout.pipe(process.stdout);

        // both errors and log data come as text on stderr
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', data => {
            // errors are a JSON strings of objects containing the "message" and "stack" properties
            if (data.match(/.*Error:.+/)) {
                const info = JSON.parse(data);
                const error = new Error(info.message);
                error.stack = info.stack;

                return reject(error);
            }

            // if the section does not match the filter, it can be ignored
            if (!data.startsWith(section.toUpperCase())) {
                return;
            }

            proc.logs.push(JSON.parse(data.slice(data.indexOf(child.pid) + child.pid.toString().length + 2 /* account for ": " */)));
        });

        child.on('close', () => resolve(proc));
        child.on('error', reject);
    });
};
