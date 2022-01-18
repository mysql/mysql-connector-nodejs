/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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
const mysqlx = require('../../../..');

describe('connection pool', () => {
    const baseConfig = { schema: undefined };

    context('when the pool is empty', () => {
        it('25 connections can be retrieved by default until the pool is full', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            // We need a timeout to ensure the test is useful.
            const queueTimeout = 100;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, queueTimeout } });
            const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

            return Promise.all([...Array(25).keys()].map(() => pool.getSession()))
                .then(() => {
                    // The pool should be full by now.
                    return pool.getSession();
                })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(error);
                    return pool.close();
                });
        });

        it('maxSize number of connections can be retrieved until the pool is full', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            // We need a specific pool size and a timeout to ensure the test
            // is useful.
            const maxSize = 10;
            const queueTimeout = 100;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize, queueTimeout } });
            const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

            return Promise.all([...Array(maxSize).keys()].map(() => pool.getSession()))
                .then(() => {
                    // The pool should be full by now.
                    return pool.getSession();
                })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(error);
                    return pool.close();
                });
        });
    });

    context('when the pool is neither empty nor full', () => {
        it('connections that are retrieved do not contain any previous session state', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 2 } });
            const expected = [[null]];
            const actual = [];

            return pool.getSession()
                .then(session => {
                    return session.sql('SET @a = 5')
                        .execute()
                        .then(() => {
                            return session.close();
                        });
                })
                .then(() => {
                    return pool.getSession();
                })
                .then(session => {
                    return session.sql('SELECT @a = 5')
                        .execute(row => actual.push(row))
                        .then(() => {
                            return session.close();
                        });
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                    return pool.close();
                });
        });

        it('BUG#28657404 connections can be retrieved while they become idle', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 4, maxIdleTime: 1 } });

            return pool.getSession()
                .then(() => {
                    return pool.getSession();
                })
                .then(() => {
                    return pool.getSession();
                })
                .then(() => {
                    return pool.getSession();
                })
                .then(() => {
                    return pool.close();
                });
        });
    });

    context('when the pool is full', () => {
        context('and there are idle connections', () => {
            it('waits indefinitely for connections that do not expire', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);
                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 1 } });

                return pool.getSession()
                    .then(session => {
                        return session.close();
                    })
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            // wait for a few millis before passing
                            setTimeout(resolve, 1000);
                            pool.getSession().then(resolve).catch(reject);
                        });
                    })
                    .then(() => {
                        return pool.close();
                    });
            });

            it('connections can be retrieved if they are released before queueTimeout', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);
                const queueTimeout = 2000;
                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 1, queueTimeout } });

                return pool.getSession()
                    .then(session => {
                        return new Promise(resolve => setTimeout(resolve, queueTimeout / 4))
                            .then(() => {
                                return session.close();
                            });
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(() => {
                        return pool.close();
                    });
            });

            it('connections can be retrieved if they expire before queueTimeout', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);
                const maxIdleTime = 100;
                const queueTimeout = 1000;
                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxIdleTime, maxSize: 1, queueTimeout } });

                return pool.getSession()
                    .then(session => {
                        return session.close();
                    })
                    .then(() => {
                        return new Promise(resolve => setTimeout(resolve, maxIdleTime * 2));
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(() => {
                        return pool.close();
                    });
            });

            it('connections that are retrieved do not contain any session state', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);
                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 1 } });
                const expected = [[null]];
                const actual = [];

                return pool.getSession()
                    .then(session => {
                        return session.sql('SET @a = 5')
                            .execute()
                            .then(() => {
                                return session.close();
                            });
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(session => {
                        return session.sql('SELECT @a = 5')
                            .execute(row => actual.push(row))
                            .then(() => {
                                return session.close();
                            });
                    })
                    .then(() => {
                        expect(actual).to.deep.equal(expected);
                        return pool.close();
                    });
            });

            it('those connections are prioritized over new ones', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);
                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 3 } });
                const connections = [];

                return pool.getSession()
                    .then(session1 => {
                        return session1.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]))
                            .then(() => {
                                return pool.getSession();
                            })
                            .then(session2 => {
                                return session2.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]))
                                    // close the second session
                                    .then(() => {
                                        return session2.close();
                                    });
                            })
                            .then(() => {
                                return pool.getSession();
                            })
                            .then(session3 => {
                                return session3.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]))
                                    // close the first session
                                    .then(() => {
                                        session1.close();
                                    });
                            })
                            .then(() => {
                                return pool.getSession();
                            })
                            .then(session4 => {
                                return session4.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]));
                            });
                    })
                    .then(() => {
                        expect(connections).to.have.lengthOf(4);
                        expect(connections[2]).to.equal(connections[1]);
                        expect(connections[3]).to.equal(connections[0]);

                        return pool.close();
                    });
            });

            it('those connections are prioritized over the ones that have expired', () => {
                const maxIdleTime = 100;
                const poolingConfig = Object.assign({}, config, baseConfig);
                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 3, maxIdleTime } });

                let idleConnectionId;

                return pool.getSession()
                    .then(session1 => {
                        return pool.getSession()
                            .then(session2 => {
                                return session2.sql('SELECT CONNECTION_ID()')
                                    .execute()
                                    .then(res => {
                                        idleConnectionId = res.fetchOne()[0];
                                    })
                                    .then(() => {
                                        return session1.close();
                                    })
                                    .then(() => {
                                        return new Promise(resolve => setTimeout(resolve, maxIdleTime * 2));
                                    })
                                    .then(() => {
                                        return session2.close();
                                    });
                            });
                    })
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(session3 => {
                        return session3.sql('SELECT CONNECTION_ID()')
                            .execute();
                    })
                    .then(res => {
                        expect(res.fetchOne()[0]).to.equal(idleConnectionId);
                        return pool.close();
                    });
            });
        });

        context('and there are no idle connections', () => {
            it('waits indefinitely for connection that do not become idle', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);
                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 1 } });

                return pool.getSession()
                    .then(session => {
                        return new Promise((resolve, reject) => {
                            // we want to release the existing connection after trying to acquire a new one
                            setTimeout(resolve, 1000);
                            return pool.getSession()
                                .then(() => {
                                    // after the connection is eventually acquired, we can destroy the pool
                                    return pool.close()
                                        .then(resolve);
                                })
                                .catch(reject);
                        })
                            // release the connection in order to be re-used by session in the queue
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('connections fail to be retrieved when queueTimeout is exceeded', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);

                const queueTimeout = 200;
                const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 1, queueTimeout } });

                return pool.getSession()
                    .then(() => {
                        return pool.getSession();
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.message).to.equal(error);
                        return pool.close();
                    });
            });

            it('active connections that have been released before fail to be retrieved when queueTimeout is exceeded', () => {
                const poolingConfig = Object.assign({}, config, baseConfig);

                const queueTimeout = 200;
                const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

                const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize: 1, queueTimeout } });

                return pool.getSession()
                    .then(session => {
                        // Release the connection back into the pool
                        return session.close();
                    })
                    .then(() => {
                        // Re-activate the connection.
                        return pool.getSession();
                    })
                    .then(() => {
                        // Try to acquire a new connection.
                        return pool.getSession();
                    })
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        expect(err.message).to.equal(error);
                        return pool.close();
                    });
            });
        });
    });

    context('when connections are closed by an application', () => {
        it('they become unusable whilst they are idle', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const pool = mysqlx.getClient(poolingConfig);

            return pool.getSession()
                .then(session => {
                    return session.close()
                        .then(() => {
                            return session.getSchemas();
                        })
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_CONNECTION_CLOSED);
                            return pool.close();
                        });
                });
        });

        it('they keep being unusable after they expire', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);

            const maxIdleTime = 10;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxIdleTime } });

            return pool.getSession()
                .then(session => {
                    return session.close()
                        .then(() => {
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime * 10));
                        })
                        .then(() => {
                            return session.getSchemas();
                        })
                        .then(() => {
                            return expect.fail();
                        })
                        .catch(err => {
                            expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_CONNECTION_CLOSED);
                            return pool.close();
                        });
                });
        });
    });

    context('when connections are killed in the server', () => {
        it('they can still be closed by the client', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);

            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxSize: 2 } });
            const connections = [];

            return pool.getSession()
                .then(session1 => {
                    return session1.sql('SELECT CONNECTION_ID()')
                        .execute(row => connections.push(row[0]))
                        .then(() => {
                            return session1.close();
                        });
                })
                .then(() => {
                    return Promise.all([pool.getSession(), pool.getSession()]);
                })
                .then(sessions => {
                    // sessions[0] has the same id as session1
                    return sessions[1].sql(`KILL ${connections[0]}`)
                        .execute()
                        .then(() => {
                            return sessions[0].close();
                        });
                })
                .then(() => {
                    // The server sends a message to notify the client
                    // that the connection has been killed. However, this
                    // message is not sent immediately, but only after
                    // around 1 second. So, we need to wait a bit more
                    // than that.
                    return new Promise(resolve => setTimeout(resolve, 1500));
                })
                .then(() => {
                    return pool.close();
                });
        });

        it('they can still be re-used by the client', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);

            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxSize: 2 } });
            const connections = [];

            return pool.getSession()
                .then(session1 => {
                    return session1.sql('SELECT CONNECTION_ID()')
                        .execute(row => connections.push(row[0]))
                        .then(() => {
                            return session1.close();
                        });
                })
                .then(() => {
                    return Promise.all([pool.getSession(), pool.getSession()]);
                })
                .then(sessions => {
                    return Promise.all([sessions[0].close(), sessions[1].sql(`KILL ${connections[0]}`).execute()]);
                })
                .then(() => {
                    // The server sends a message to notify the client
                    // that the connection has been killed. However, this
                    // message is not sent immediately, but only after
                    // around 1 second. So, we need to wait a bit more
                    // than that.
                    return new Promise(resolve => setTimeout(resolve, 1500));
                })
                .then(() => {
                    return pool.getSession();
                })
                .then(session4 => {
                    return session4.sql('SELECT CONNECTION_ID()')
                        .execute(row => connections.push(row[0]));
                })
                .then(() => {
                    expect(connections).to.have.lengthOf(2);
                    // session1 and session4 have different ids since the connection was re-created
                    expect(connections[0]).to.not.equal(connections[1]);

                    return pool.close();
                });
        });
    });

    context('when closing the pool', () => {
        it('active connections are closed in the server', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);

            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxSize: 3 } });

            const processIds = [];
            const connectionIds = [];

            return pool.getSession()
                .then(session => {
                    // The "session.close()" method is not called, which means
                    // the connection will be active until the pool is closed.
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute(row => connectionIds.push(row[0]));
                })
                .then(() => {
                    return pool.close();
                })
                .then(() => {
                    return mysqlx.getSession(poolingConfig);
                })
                .then(session => {
                    return session.sql('SHOW PROCESSLIST')
                        .execute(row => processIds.push(row[0]))
                        .then(() => {
                            return session.close();
                        });
                })
                .then(() => {
                    expect(processIds).to.not.include.members(connectionIds);
                });
        });

        it('idle connections are closed in the server', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);

            const pool = mysqlx.getClient(poolingConfig);

            const processIds = [];
            const connectionIds = [];

            return pool.getSession()
                .then(session => {
                    // The "session.close()" method is called and the
                    // "maxIdleTime" property is not set, which means the
                    // connection will be idle until the pool is closed.
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute(row => connectionIds.push(row[0]))
                        .then(() => {
                            return session.close();
                        });
                })
                .then(() => {
                    return pool.close();
                })
                .then(() => {
                    return mysqlx.getSession(poolingConfig);
                })
                .then(session => {
                    return session.sql('SHOW PROCESSLIST')
                        .execute(row => processIds.push(row[0]))
                        .then(() => {
                            return session.close();
                        });
                })
                .then(() => {
                    expect(processIds).to.not.include.members(connectionIds);
                });
        });

        it('expired connections are closed in the server', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);

            const maxIdleTime = 100;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxIdleTime } });

            const processIds = [];
            const connectionIds = [];

            return Promise.all([pool.getSession(), pool.getSession()])
                .then(sessions => {
                    return sessions[0].sql('SELECT CONNECTION_ID()')
                        .execute(row => connectionIds.push(row[0]))
                        .then(() => {
                            // This one will expire and will not be re-used.
                            return sessions[0].close();
                        })
                        .then(() => {
                            // Make sure the first connection expires ("maxIdleTime" is exceeded).
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime * 2));
                        })
                        .then(() => {
                            // This one never expires and will be re-used.
                            return sessions[1].close();
                        });
                })
                .then(() => {
                    return pool.getSession();
                })
                .then(() => {
                    return pool.close();
                })
                .then(() => {
                    return mysqlx.getSession(poolingConfig);
                })
                .then(session => {
                    return session.sql('SHOW PROCESSLIST')
                        .execute(row => processIds.push(row[0]))
                        .then(() => {
                            return session.close();
                        });
                })
                .then(() => {
                    expect(processIds).to.not.include.members(connectionIds);
                });
        });

        it('standalone connections are gracefully closed', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);

            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: false } });

            return pool.getSession()
                .then(() => {
                    return pool.close();
                });
        });

        it('queued connection requests are not fullfilled', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxSize: 2 } });

            return Promise.all([pool.getSession(), pool.getSession()])
                .then(() => {
                    return new Promise(resolve => {
                        // We need to ensure the test only finishes after the
                        // queued connection request is processed.
                        pool.getSession().then(resolve);
                        pool.close();
                    });
                })
                .then(session => {
                    return expect(session).to.not.exist;
                });
        });
    });

    context('when acquiring connections in parallel', () => {
        const totalRequestsInQueue = 4;

        beforeEach('reduce the number of allowed connections in the server', () => {
            return fixtures.setServerGlobalVariable('mysqlx_max_connections', totalRequestsInQueue - 1);
        });

        afterEach('reset the number of allowed connections in the server', () => {
            return fixtures.setServerGlobalVariable('mysqlx_max_connections', 100);
        });

        it('succeeds to re-use connections if they are released before queueTimeout', function () {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const maxSize = totalRequestsInQueue / 2;
            const queueTimeout = 500;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize, queueTimeout } });
            const connections = [...Array(totalRequestsInQueue)];

            const connectAndWaitBeforeClose = () => {
                return pool.getSession()
                    .then(session => {
                        // we want to handle the connection requests while
                        // there is still no room to accommodate them, so, we
                        // need to wait for the other connection requests
                        // before releasing the existing connections from the
                        // pool
                        return new Promise(resolve => setTimeout(resolve, queueTimeout / 2))
                            .then(() => {
                                return session.close();
                            });
                    });
            };

            return Promise.all(connections.map(() => connectAndWaitBeforeClose()))
                .then(() => {
                    return pool.close();
                });
        });

        it('fails to re-use connections if they are released after queueTimeout', function () {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const maxSize = totalRequestsInQueue / 2;
            const queueTimeout = 500;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxSize, queueTimeout } });
            const connections = [...Array(totalRequestsInQueue)];
            const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

            const connectAndWaitBeforeClose = () => {
                return pool.getSession()
                    .then(session => {
                        // we want to handle the connection requests while
                        // there is still no room to accommodate them, so, we
                        // need to wait for the other connection requests
                        // before releasing the existing connections from the
                        // pool
                        return new Promise(resolve => setTimeout(resolve, queueTimeout * 2))
                            .then(() => {
                                return session.close();
                            });
                    });
            };

            return Promise.all(connections.map(() => connectAndWaitBeforeClose()))
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(error);
                    return pool.close();
                });
        });

        it('succeeds to re-create connections if they expire before queueTimeout', function () {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const maxSize = totalRequestsInQueue / 2;
            const queueTimeout = 500;
            const maxIdleTime = queueTimeout / 2;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxIdleTime, maxSize, queueTimeout } });

            return pool.getSession()
                .then(session1 => {
                    return pool.getSession()
                        .then(session2 => {
                            return session2.close();
                        })
                        .then(() => {
                            // we want one of the connections to expire
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime + maxIdleTime / 2));
                        })
                        .then(() => {
                            // we still release the other connection just so
                            // we accommodate two more parallel requests
                            return session1.close();
                        })
                        .then(() => {
                            // at this moment the pool should contain one
                            // expired connection and one idle connection
                            return Promise.all([pool.getSession(), pool.getSession()]);
                        })
                        .then(() => {
                            return pool.close();
                        });
                });
        });

        it('fails to re-create connections if they expire after queueTimeout', function () {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const maxSize = totalRequestsInQueue / 2;
            const queueTimeout = 500;
            const maxIdleTime = queueTimeout / 2;
            const pool = mysqlx.getClient(poolingConfig, { pooling: { enabled: true, maxIdleTime, maxSize, queueTimeout } });
            const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

            return pool.getSession()
                .then(() => {
                    return pool.getSession()
                        .then(session2 => {
                            return session2.close();
                        })
                        .then(() => {
                            // we want one of the connections to expire
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime + maxIdleTime / 2));
                        })
                        .then(() => {
                            // right now, we should not have room to
                            // accommodate two parallel requests
                            return Promise.all([pool.getSession(), pool.getSession()]);
                        });
                })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal(error);
                    return pool.close();
                });
        });
    });

    context('when the pool has been closed', () => {
        it('fulfills new connection requests', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxSize: 2 } });

            return Promise.all([pool.getSession(), pool.getSession()])
                .then(() => {
                    return pool.close();
                })
                .then(() => {
                    return pool.getSession();
                })
                .then(session => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(session).to.exist;
                    return pool.close();
                });
        });

        it('queued connection requests are not fullfilled', () => {
            const poolingConfig = Object.assign({}, config, baseConfig);
            const pool = mysqlx.getClient(poolingConfig, { pooling: { maxSize: 2 } });

            return Promise.all([pool.getSession(), pool.getSession()])
                .then(() => {
                    return new Promise(resolve => {
                        // We need to ensure the test only finishes after the
                        // queued connection request is processed.
                        pool.getSession().then(resolve);
                        pool.close();
                    });
                })
                .then(() => {
                    return Promise.all([pool.getSession(), pool.getSession()]);
                })
                .then(() => {
                    return new Promise(resolve => {
                        // We need to ensure the test only finishes after the
                        // queued connection request is processed.
                        pool.getSession().then(resolve);
                        pool.close();
                    });
                })
                .then(session => {
                    return expect(session).to.not.exist;
                });
        });
    });
});
