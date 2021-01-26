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
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const os = require('os');
const path = require('path');
const sqlExecute = require('../../../../lib/DevAPI/SqlExecute');

describe('connection failures', () => {
    const baseConfig = { schema: undefined };

    context('while creating a session', () => {
        // Although we can create a user without a name in the server via:
        // CREATE USER ''@'%'
        // It does not allow userless client connections
        context('when a user is not provided', () => {
            it('fails using a configuration object', () => {
                const userlessConfig = Object.assign({}, config, baseConfig, { user: undefined });

                return mysqlx.getSession(userlessConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.match(/^Access denied for user ''/));
            });

            it('fails using a connection string', () => {
                const userlessConfig = Object.assign({}, config, baseConfig, { user: undefined });
                const uri = `mysqlx://${userlessConfig.host}:${userlessConfig.port}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.match(/^Access denied for user ''/));
            });
        });
    });

    context('with an existing idle session', () => {
        const testTimeout = 1; // in seconds
        const waitTimeout = testTimeout * 1000 * 2;
        const originalTimeout = 28800; // in seconds
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'idle.js');

        context('created with TCP and TLS', () => {
            const tcpConfig = { socket: undefined, ssl: true };

            beforeEach('restrict the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('makes the session unusable for subsequent operations', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, waitTimeout))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(errors.MESSAGES.ERR_CONNECTION_IDLE_FOR_TOO_LONG));
            });

            it('logs the server message sent when the connection is killed', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitTimeout], { config: droppedConnectionConfig })
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const readErrorNotice = proc.logs[proc.logs.length - 1];
                        expect(readErrorNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(readErrorNotice.type).to.equal('WARNING');
                        expect(readErrorNotice.scope).to.equal('GLOBAL');
                        expect(readErrorNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(readErrorNotice.payload.level).to.equal('ERROR');
                        expect(readErrorNotice.payload.code).to.equal(1810);
                        expect(readErrorNotice.payload.msg).to.equal('IO Read error: read_timeout exceeded');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    pool = mysqlx.getClient(droppedConnectionConfig, { pooling: { maxSize: 2, maxIdleTime: waitTimeout * 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(() => {
                            // wait for a bit more than the value of mysqlx_wait_timeout
                            return new Promise(resolve => setTimeout(resolve, waitTimeout + 100));
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });

        context('created with regular TCP', () => {
            const tcpConfig = { socket: undefined, ssl: false };

            beforeEach('restrict the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('makes the session unusable for subsequent operations', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, testTimeout * 1000 * 2))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(errors.MESSAGES.ERR_CONNECTION_IDLE_FOR_TOO_LONG));
            });

            it('logs the server message sent when the connection is killed', () => {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitTimeout], { config: droppedConnectionConfig })
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const readErrorNotice = proc.logs[proc.logs.length - 1];
                        expect(readErrorNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(readErrorNotice.type).to.equal('WARNING');
                        expect(readErrorNotice.scope).to.equal('GLOBAL');
                        expect(readErrorNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(readErrorNotice.payload.level).to.equal('ERROR');
                        expect(readErrorNotice.payload.code).to.equal(1810);
                        expect(readErrorNotice.payload.msg).to.equal('IO Read error: read_timeout exceeded');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const droppedConnectionConfig = Object.assign({}, config, baseConfig, tcpConfig);

                    pool = mysqlx.getClient(droppedConnectionConfig, { pooling: { maxSize: 2, maxIdleTime: waitTimeout * 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(() => {
                            // wait for a bit more than the value of mysqlx_wait_timeout
                            return new Promise(resolve => setTimeout(resolve, waitTimeout + 100));
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });

        context('created with a UNIX socket', () => {
            const socketConfig = { host: undefined, port: undefined, ssl: false };

            beforeEach('restrict the server connection timeout', function () {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', testTimeout, droppedConnectionConfig);
            });

            afterEach('reset the server connection timeout', function () {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.setServerGlobalVariable('mysqlx_wait_timeout', originalTimeout, droppedConnectionConfig);
            });

            it('makes the session unusable for subsequent operations', function () {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return mysqlx.getSession(droppedConnectionConfig)
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, waitTimeout))
                            .then(() => session.sql('SELECT 1').execute());
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(errors.MESSAGES.ERR_CONNECTION_IDLE_FOR_TOO_LONG));
            });

            it('logs the server message sent when the connection is killed', function () {
                const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                if (!droppedConnectionConfig.socket || os.platform() === 'win32') {
                    return this.skip();
                }

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [waitTimeout], { config: droppedConnectionConfig })
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const readErrorNotice = proc.logs[proc.logs.length - 1];
                        expect(readErrorNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(readErrorNotice.type).to.equal('WARNING');
                        expect(readErrorNotice.scope).to.equal('GLOBAL');
                        expect(readErrorNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(readErrorNotice.payload.level).to.equal('ERROR');
                        expect(readErrorNotice.payload.code).to.equal(1810);
                        expect(readErrorNotice.payload.msg).to.equal('IO Read error: read_timeout exceeded');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const droppedConnectionConfig = Object.assign({}, config, baseConfig, socketConfig);

                    pool = mysqlx.getClient(droppedConnectionConfig, { pooling: { maxSize: 2, maxIdleTime: waitTimeout * 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(() => {
                            // wait for a bit more than the value of mysqlx_wait_timeout
                            return new Promise(resolve => setTimeout(resolve, waitTimeout + 100));
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });
    });

    context('when a connection is killed from a different session', () => {
        const connectionConfig = { socket: undefined };

        context('via the Admin API', () => {
            it('makes the session unusable for subsequent operations', function () {
                const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);

                return mysqlx.getSession(killedConnectionConfig)
                    .then(session1 => {
                        return mysqlx.getSession(killedConnectionConfig)
                            .then(session2 => {
                                return sqlExecute(session2, 'kill_client', [{ id: session1._connectionId }], sqlExecute.Namespace.X_PLUGIN)
                                    .execute()
                                    .then(() => {
                                        return session2.close();
                                    });
                            })
                            .then(() => {
                                // the server does to send the notification immediately after the connection is killed
                                // if the connection is re-used in the meantime, the server will close it immediately
                                // so, we need to wait a bit
                                return new Promise(resolve => setTimeout(resolve, this.timeout() / 2));
                            })
                            .then(() => {
                                return session1.sql('SELECT 1')
                                    .execute();
                            });
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(errors.MESSAGES.ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION));
            });

            it('logs the server message sent when the connection is killed', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'admin-kill.js');

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script)
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const sessionKillNotice = proc.logs[proc.logs.length - 1];
                        expect(sessionKillNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(sessionKillNotice.type).to.equal('WARNING');
                        expect(sessionKillNotice.scope).to.equal('GLOBAL');
                        expect(sessionKillNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(sessionKillNotice.payload.level).to.equal('ERROR');
                        expect(sessionKillNotice.payload.code).to.equal(3169);
                        expect(sessionKillNotice.payload.msg).to.equal('Session was killed');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);

                    pool = mysqlx.getClient(killedConnectionConfig, { pooling: { maxSize: 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(sessions => {
                            return sqlExecute(sessions[1], 'kill_client', [{ id: sessions[0]._connectionId }], sqlExecute.Namespace.X_PLUGIN)
                                .execute();
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });

        context('via SQL', () => {
            it('makes the session unusable for subsequent operations', function () {
                const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);

                return mysqlx.getSession(killedConnectionConfig)
                    .then(session => {
                        return session.sql('SELECT CONNECTION_ID()')
                            .execute()
                            .then(res => {
                                return mysqlx.getSession(killedConnectionConfig)
                                    .then(session => {
                                        return session.sql('KILL ?')
                                            .bind(res.fetchOne()[0])
                                            .execute()
                                            .then(() => {
                                                return session.close();
                                            });
                                    });
                            })
                            .then(() => {
                                // the server does to send the notification immediately after the connection is killed
                                // if the connection is re-used in the meantime, the server will return a "Query execution was interrupted" error
                                // so, we need to wait a bit
                                return new Promise(resolve => setTimeout(resolve, this.timeout() / 2));
                            })
                            .then(() => {
                                return session.sql('SELECT 1')
                                    .execute();
                            });
                    })
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal(errors.MESSAGES.ERR_CONNECTION_KILLED_IN_DIFFERENT_SESSION));
            });

            it('logs the server message sent when the connection is killed', () => {
                const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'sql-kill.js');

                return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script)
                    .then(proc => {
                        // it should contain other notices
                        expect(proc.logs).to.be.an('array').and.have.length.above(0);
                        // but the session kill notice should be the last in the list
                        const sessionKillNotice = proc.logs[proc.logs.length - 1];
                        expect(sessionKillNotice).to.contain.keys('type', 'scope', 'payload');
                        expect(sessionKillNotice.type).to.equal('WARNING');
                        expect(sessionKillNotice.scope).to.equal('GLOBAL');
                        expect(sessionKillNotice.payload).to.contain.keys('level', 'code', 'msg');
                        expect(sessionKillNotice.payload.level).to.equal('ERROR');
                        expect(sessionKillNotice.payload.code).to.equal(3169);
                        expect(sessionKillNotice.payload.msg).to.equal('Session was killed');
                    });
            });

            context('on a connection pool', () => {
                let pool;

                beforeEach('create pool', () => {
                    const killedConnectionConfig = Object.assign({}, config, baseConfig, connectionConfig);

                    pool = mysqlx.getClient(killedConnectionConfig, { pooling: { maxSize: 2 } });
                });

                afterEach('destroy pool', () => {
                    return pool.close();
                });

                it('releases the connection even if maxIdleTime is not exceeded', () => {
                    return Promise.all([pool.getSession(), pool.getSession()])
                        .then(sessions => {
                            return sessions[0].sql('SELECT CONNECTION_ID()')
                                .execute()
                                .then(res => {
                                    return sessions[1].sql('KILL ?')
                                        .bind(res.fetchOne()[0])
                                        .execute();
                                });
                        })
                        .then(() => {
                            // by this point, the connections should have been released
                            return pool.getSession();
                        })
                        .then(session => {
                            return session.sql('select 1')
                                .execute();
                        })
                        .then(res => {
                            expect(res.fetchOne()).to.deep.equal([1]);
                        });
                });
            });
        });
    });
});
