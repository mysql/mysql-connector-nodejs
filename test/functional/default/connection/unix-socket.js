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

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../');
const os = require('os');

describe('connecting to the MySQL server using a Unix socket', () => {
    const baseConfig = { host: undefined, port: undefined, schema: undefined };

    context('when the socket path points to an existing local socket', () => {
        it('succeeds using a configuration object', function () {
            const socketConfig = Object.assign({}, config, baseConfig);

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const expected = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            return mysqlx.getSession(socketConfig)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);
                    return session.close();
                });
        });

        it('succeeds using the custom notation for the socket path in the URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig);

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})`;
            const expected = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);
                    return session.close();
                });
        });

        it('succeeds using the percent encoded notation for the socket path in the URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig);

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@${encodeURIComponent(socketConfig.socket)}`;
            const expected = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);
                    return session.close();
                });
        });

        it('ignores tls options provided with a configuration file', function () {
            const socketConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } });

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const expected = { host: undefined, port: undefined, schema: undefined, socket: socketConfig.socket, tls: false };

            return mysqlx.getSession(socketConfig)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);

                    return session.close();
                });
        });

        it('ignores tls options provided using custom notation in a URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } });

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=REQUIRED&ssl-ca=(${socketConfig.tls.ca})?ssl-crl=(${socketConfig.tls.ca})`;
            const expected = { host: undefined, port: undefined, schema: undefined, socket: config.socket, tls: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);

                    return session.close();
                });
        });

        it('ignores tls options provided using percent encoded notation in a URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } });

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=REQUIRED&ssl-ca=${encodeURIComponent(socketConfig.tls.ca)}?ssl-crl=${encodeURIComponent(socketConfig.tls.ca)}`;
            const expected = { host: undefined, port: undefined, schema: undefined, socket: config.socket, tls: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);

                    return session.close();
                });
        });
    });
});
