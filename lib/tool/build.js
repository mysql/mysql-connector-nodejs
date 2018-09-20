/*
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
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

const exec = require('child_process').exec;
const fs = require('../Adapters/fs');
const os = require('os');
const path = require('path');
const pkg = require('../../package.json');
const qs = require('querystring');

/**
 * Encode metadata in the standard format.
 * @private
 * @param {Object} metadata - key:value map
 * @returns {string} The encoded string.
 */
function encode (metadata) {
    return `${qs.stringify(metadata, '\n', ': ', { encodeURIComponent: qs.unescape })}\n`;
}

/**
 * Try to retrieve source control metadata from specific environment variables.
 * @private
 * @returns {Object}
 */
function getEnvironmentMetadata () {
    const metadata = { version: pkg.version };

    const branch = process.env.BRANCH_NAME;

    if (branch) {
        metadata.branch = branch;
    }

    const revision = process.env.PUSH_REVISION;

    if (revision) {
        metadata.commit = revision;
        metadata.short = revision.substring(0, 7);
    }

    return metadata;
}

/**
 * Execute `git log` to retrieve source control metadata.
 * @private
 * @returns {Promise}
 */
function fetchGitMetadata () {
    const env = getEnvironmentMetadata();
    const command = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";

    return new Promise((resolve) => {
        exec(command, (err, stdout) => {
            const metadata = Object.assign({}, env, qs.parse(stdout));

            if (err || !stdout) {
                // the file should be created regardless
                return resolve(metadata);
            }

            const branch = metadata.branch.slice(metadata.branch.indexOf('>') + 2);

            resolve(Object.assign({}, metadata, { branch }));
        });
    });
}

/**
 * Generate the source metadata file.
 * @private
 * @returns {Promise}
 */
exports.generateSourceMetadataFile = function () {
    const sourceMetadataFile = path.join('docs', 'INFO_SRC');

    return fetchGitMetadata().then(metadata => fs.writeFile(sourceMetadataFile, encode(metadata)));
};

/**
 * Generate the package metadata file
 * @private
 * @returns {Promise}
 */
exports.generatePackageMetadataFile = function () {
    const packageMetadataFile = path.join('docs', 'INFO_BIN');
    const date = (new Date()).toISOString();
    const metadata = {
        'build-date': date.replace('T', ' ').slice(0, date.lastIndexOf('.')),
        'os-info': `${os.type()} ${os.release()}.${os.arch()}`
    };

    return fs.writeFile(packageMetadataFile, encode(metadata));
};
