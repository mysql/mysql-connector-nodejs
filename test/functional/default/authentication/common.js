/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

/* eslint-env node, mocha */

const Level = require('../../../../lib/logger').Level;
const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');
const warnings = require('../../../../lib/constants/warnings');

describe('common authentication tests', () => {
    const baseConfig = { schema: undefined };

    context('when deprecated authentication connection properties are used', () => {
        it('writes a deprecation warning to the log when debug mode is enabled', () => {
            // The non-dperecated properties should be null since JSON.stringify() removes undefined properties
            const scriptConfig = Object.assign({}, config, baseConfig, { dbPassword: config.password, dbUser: config.user, password: null, user: null });
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

            return fixtures.collectLogs('connection:options.dbUser', script, [JSON.stringify(scriptConfig)], { level: Level.WARNING })
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);
                    return expect(proc.logs[0]).to.equal(warnings.MESSAGES.WARN_DEPRECATED_DB_USER);
                });
        });

        it('writes a deprecation warning to stdout when debug mode is not enabled', done => {
            const deprecatedConfig = Object.assign({}, config, baseConfig, { dbPassword: config.password, dbUser: config.user, password: undefined, user: undefined });
            const deprecationWarningMessages = [];

            process.on('warning', warning => {
                if (warning.name && warning.code && warning.name === warnings.TYPES.DEPRECATION && warning.code.startsWith(warnings.CODES.DEPRECATION)) {
                    deprecationWarningMessages.push(warning.message);
                }

                if (warning.name && warning.name === 'NoWarning') {
                    process.removeAllListeners('warning');
                    expect(deprecationWarningMessages).to.deep.equal([warnings.MESSAGES.WARN_DEPRECATED_DB_PASSWORD, warnings.MESSAGES.WARN_DEPRECATED_DB_USER]);

                    return done();
                }
            });

            mysqlx.getSession(deprecatedConfig)
                .then(session => {
                    return session.close();
                })
                .then(() => {
                    return process.emitWarning('No more warnings.', 'NoWarning');
                });
        });
    });
});
