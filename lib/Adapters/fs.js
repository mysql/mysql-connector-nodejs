/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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

const fs = require('fs');

/**
 * Promise-based wrapper for the core `fs` module.
 * @private
 */

exports.readFile = function (path, options) {
    options = typeof options !== 'string'
        ? Object.assign({}, { encoding: null, flag: 'r' }, options)
        : options;

    return new Promise((resolve, reject) => {
        fs.readFile(path, options, (err, data) => {
            if (err) {
                return reject(err);
            }

            resolve(data);
        });
    });
};

exports.writeFile = function (path, data, options) {
    options = typeof options !== 'string'
        ? Object.assign({}, { encoding: 'utf8', mode: 0o666, flag: 'w' }, options)
        : options;

    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, options, (err) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
};
