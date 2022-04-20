/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const Level = require('../../lib/logger').Level;
const cp = require('child_process');
const config = require('../config');

/**
 * Log collection process.
 * @typedef {Object} LogProc
 * @prop {number} id - the process id
 * @prop {Object[]} logs - a list of log entries
 */

/**
 * Extract JSON log entries of a given section and process from log raw
 * content.
 * @private
 * @function
 * @param {Object} options
 * @param {string} options.log - the raw log content
 * @param {string} options.section - the relevant log section
 * @param {number} options.pid - the associated child process id
 * @param {string} [options.level] - the log level
 * @returns {string}
 */
function extractJSON ({ log, section, pid, level } = {}) {
    // We want to skip the log label which uses a given pattern.
    const pattern = new RegExp(`${section.toUpperCase()} ${pid}: \\[${level}\\]`);
    const match = log.match(pattern);

    if (!match) {
        return `[${log.slice(1)}]`;
    }

    const remainder = log.slice(0, match.index).concat(',').concat(log.slice(match.index + match[0].length));

    return extractJSON({ log: remainder, section, pid, level });
}

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
    // A custom connection configuration can be provided via the options
    // object.
    options = Object.assign({ config, level: Level.INFO }, options);

    return new Promise((resolve, reject) => {
        // The connection configuration is made available to each script via
        // the MYSQLX_CLIENT_CONFIG environment variable.
        const env = Object.assign({}, process.env, { MYSQLX_CLIENT_CONFIG: JSON.stringify(options.config), NODE_DEBUG: section || '*' });
        // We should prevent warnings from popping up in the stderr stream, in
        // order make it easier to collect legitimate log content.
        // To do that, we append the "--no-warnings" flag to the list of flags
        // provided to the parent process.
        // https://nodejs.org/docs/v14.0.0/api/process.html#process_event_warning
        const child = cp.fork(path, args, { env, execArgv: process.execArgv.concat('--no-warnings'), silent: true });
        const proc = { id: child.pid, logs: [] };

        // Textual log accumulator.
        let log = '';

        // Pipe stdout to the parent process (so mocha can display it).
        child.stdout.pipe(process.stdout);

        // Both errors and log data come as JSON text on stderr.
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', data => {
            // An Error JSON object contains the "message" and "stack"
            // properties.
            if (data.match(/.*Error:.+/)) {
                const info = JSON.parse(data);
                const error = new Error(info.message);
                error.stack = info.stack;

                return reject(error);
            }

            // If the data does not contain any section matching the
            // the filter, it can be ignored.
            // By this point, we should be only dealing with legitimate log
            // content, however, although the pid will probably be always the
            // same we are only interested in content from a specific section.
            if (!data.match(`${section.toUpperCase()} ${child.pid}: `)) {
                return;
            }

            // Otherwise (if its content from the given section) we append it
            // to the relevant text log accumulator.
            log += data;
        });

        child.on('close', () => {
            // The logs property will contain an array where each item is a
            // proper log entry represented by a plain JavaScript object.
            proc.logs = proc.logs.concat(JSON.parse(extractJSON({ log, section, pid: child.pid, level: options.level })));

            resolve(proc);
        });

        child.on('error', reject);
    });
};
