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

const config = require('../../../../config');
const errors = require('../../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../../fixtures');
const mysqlx = require('../../../../..');
const os = require('os');
const path = require('path');
const util = require('util');

describe('sha256_password authentication plugin on MySQL 8.0.3', () => {
    const user = 'user';
    const password = 'password';
    // mysql-8.0.3-sha256-password service defined in $root/test/docker/docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.3-sha256-password', schema: undefined };
    const socket = path.join(os.tmpdir(), `${baseConfig.host}.sock`);

    // Due to some limitation in the Docker image, the MySQL 8.0.3 server
    // instance available in the container does not create the initial user
    // accounts with the default authentication plugin (in this case,
    // sha256_password), so a suitable user account must be manually created.
    beforeEach('create a user with sha256_password plugin', async () => {
        await fixtures.createUser({ connectionConfig: baseConfig, user, password });
    });

    afterEach('delete the user created for a given test', async () => {
        await fixtures.dropUser({ connectionConfig: baseConfig, user });
    });

    context('connecting without an authentication mechanism', () => {
        it('succeeds over TCP with TLS using PLAIN', async () => {
            const authConfig = { ...config, ...baseConfig, password, socket: undefined, tls: { enabled: true }, user };

            const session = await mysqlx.getSession(authConfig);
            expect(session.inspect().auth).to.equal('PLAIN');

            await session?.close();
        });

        // The server does not have support for the client-side SHA256_MEMORY
        // mechanism.
        it('fails over regular TCP', async () => {
            const authConfig = { ...config, ...baseConfig, password, socket: undefined, tls: { enabled: false }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err).to.include.keys('info');
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
            } finally {
                await session?.close();
            }
        });

        it('succeeds over a Unix socket using PLAIN', async () => {
            const authConfig = { ...config, ...baseConfig, password, socket, tls: { enabled: false }, user };

            const session = await mysqlx.getSession(authConfig);
            expect(session.inspect().auth).to.equal('PLAIN');

            await session?.close();
        });
    });

    context('connecting with the MYSQL41 authentication mechanism', () => {
        const auth = 'MYSQL41';

        it('fails over TCP with TLS', async () => {
            const authConfig = { ...config, ...baseConfig, auth, password, socket: undefined, tls: { enabled: true }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
            } finally {
                await session?.close();
            }
        });

        it('fails over regular TCP', async () => {
            const authConfig = { ...config, ...baseConfig, password, auth, socket: undefined, tls: { enabled: false }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
            } finally {
                await session?.close();
            }
        });

        it('fails over a Unix socket', async () => {
            const authConfig = { ...config, ...baseConfig, password, auth, socket, tls: { enabled: false }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(errors.ER_ACCESS_DENIED_ERROR);
            } finally {
                await session?.close();
            }
        });
    });

    context('connecting with the PLAIN authentication mechanism', () => {
        const auth = 'PLAIN';

        it('succeeds over TCP with TLS', async () => {
            const authConfig = { ...config, ...baseConfig, auth, password, socket: undefined, tls: { enabled: true }, user };

            const session = await mysqlx.getSession(authConfig);
            expect(session.inspect().auth).to.equal(auth);

            await session?.close();
        });

        it('fails over regular TCP', async () => {
            const authConfig = { ...config, ...baseConfig, auth, password, socket: undefined, tls: { enabled: false }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(errors.ER_NOT_SUPPORTED_AUTH_MODE);
            } finally {
                await session?.close();
            }
        });

        it('succeeds over a Unix socket', async () => {
            const authConfig = { ...config, ...baseConfig, auth, password, socket, tls: { enabled: false }, user };

            const session = await mysqlx.getSession(authConfig);
            expect(session.inspect().auth).to.equal(auth);

            await session?.close();
        });
    });

    context('connecting with the SHA256_MEMORY authentication mechanism', () => {
        const auth = 'SHA256_MEMORY';

        it('fails over TCP with TLS', async () => {
            const authConfig = { ...config, ...baseConfig, auth, password, socket: undefined, tls: { enabled: true }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_AUTH_UNSUPPORTED_SERVER, 'SHA256_MEMORY'));
            } finally {
                await session?.close();
            }
        });

        it('fails over regular TLS', async () => {
            const authConfig = { ...config, ...baseConfig, auth, password, socket: undefined, tls: { enabled: false }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_AUTH_UNSUPPORTED_SERVER, 'SHA256_MEMORY'));
            } finally {
                await session?.close();
            }
        });

        it('fails over a Unix socket', async () => {
            const authConfig = { ...config, ...baseConfig, auth, password, socket, tls: { enabled: false }, user };

            let session;

            try {
                session = await mysqlx.getSession(authConfig);
                expect.fail();
            } catch (err) {
                expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_AUTH_UNSUPPORTED_SERVER, 'SHA256_MEMORY'));
            } finally {
                await session?.close();
            }
        });
    });
});
