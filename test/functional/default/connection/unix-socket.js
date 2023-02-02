/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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
    const baseConfig = { host: undefined, port: undefined, socket: process.env.MYSQLX_SOCKET, schema: undefined };

    before('skip tests on Windows or when the socket path is not defined', function () {
        const socketConfig = { ...config, ...baseConfig };

        if (socketConfig.socket && os.platform() !== 'win32') {
            return;
        }

        return this.skip();
    });

    context('with a connection configuration object', () => {
        it('connects via the socket file available at the specified path', async () => {
            const socketConfig = { ...config, ...baseConfig };
            const want = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            const session = await mysqlx.getSession(socketConfig);
            expect(session.inspect()).to.deep.include(want);

            await session?.close();
        });

        it('ignores TLS configuration options when connecting via a socket file', async () => {
            const socketConfig = { ...config, ...baseConfig, tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } };
            const want = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            const session = await mysqlx.getSession(socketConfig);
            expect(session.inspect()).to.deep.include(want);

            await session?.close();
        });
    });

    context('with a connection string', () => {
        it('connects via the socket file available at the specified path using custom notation', async () => {
            const socketConfig = { ...config, ...baseConfig };
            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})`;
            const want = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            const session = await mysqlx.getSession(uri);
            expect(session.inspect()).to.deep.include(want);

            await session?.close();
        });

        it('connects via the socket file available at the specified path using percent encoding notation', async () => {
            const socketConfig = { ...config, ...baseConfig };
            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@${encodeURIComponent(socketConfig.socket)}`;
            const want = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            const session = await mysqlx.getSession(uri);
            expect(session.inspect()).to.deep.include(want);

            await session?.close();
        });

        it('ignores custom notation TLS configuration options when connecting via a socket file', async () => {
            const socketConfig = { ...config, ...baseConfig, tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } };
            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=REQUIRED&ssl-ca=(${socketConfig.tls.ca})?ssl-crl=(${socketConfig.tls.ca})`;
            const want = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            const session = await mysqlx.getSession(uri);
            expect(session.inspect()).to.deep.include(want);

            await session?.close();
        });

        it('ignores percent encoding notation TLS configuration options when connecting via a socket file', async () => {
            const socketConfig = { ...config, ...baseConfig, tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } };
            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=REQUIRED&ssl-ca=${encodeURIComponent(socketConfig.tls.ca)}?ssl-crl=${encodeURIComponent(socketConfig.tls.ca)}`;
            const want = { host: undefined, port: undefined, socket: socketConfig.socket, tls: false };

            const session = await mysqlx.getSession(uri);
            expect(session.inspect()).to.deep.include(want);

            await session?.close();
        });
    });
});
