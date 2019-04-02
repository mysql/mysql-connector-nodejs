'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');

describe('connection pooling', () => {
    const schemalessConfig = Object.assign({}, config, { schema: undefined });

    context('creating a pool', () => {
        it('allows to specify the pool options using a plain JavaScript object', () => {
            expect(() => mysqlx.getClient(schemalessConfig, { pooling: { enabled: true } })).to.not.throw();
        });

        it('allows to specify the pool options using a JSON string', () => {
            expect(() => mysqlx.getClient(schemalessConfig, JSON.stringify({ pooling: { enabled: true } }))).to.not.throw();
        });

        it('fails when unknown options are provided', () => {
            expect(() => mysqlx.getClient(schemalessConfig, { foo: 'bar' })).to.throw(`Client option 'foo' is not recognized as valid.`);
            expect(() => mysqlx.getClient(schemalessConfig, { pooling: { foo: 'bar' } })).to.throw(`Client option 'pooling.foo' is not recognized as valid.`);
        });

        it('fails when invalid option values are provided', () => {
            expect(() => mysqlx.getClient(schemalessConfig, { pooling: { maxSize: 'foo' } })).to.throw(`Client option 'pooling.maxSize' does not support value 'foo'.`);
            expect(() => mysqlx.getClient(schemalessConfig, { pooling: { enabled: 2.2 } })).to.throw(`Client option 'pooling.enabled' does not support value '2.2'.`);
        });
    });

    context('when the pool is not full', () => {
        it('retrieves a valid connection', () => {
            const client = mysqlx.getClient(schemalessConfig);

            return client.getSession()
                .then(session => expect(session.inspect()).to.deep.include({ pooling: true }))
                .then(() => client.close());
        });

        it('allows to retrieve connections in parallel', () => {
            const client = mysqlx.getClient(schemalessConfig);

            return Promise.all([client.getSession(), client.getSession()])
                .then(() => client.close());
        });

        it('starts from a clean session slate', () => {
            const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 2 } });
            const expected = [[null]];
            const actual = [];

            return client.getSession()
                .then(session => {
                    return session.sql('SET @a = 5').execute()
                        .then(() => session.close());
                })
                .then(() => client.getSession())
                .then(session => {
                    return session.sql('SELECT @a = 5').execute(row => actual.push(row))
                        .then(() => session.close());
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                    return client.close();
                });
        });

        it('allows to retrieve connections with short maximum idle times', () => {
            const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 4, maxIdleTime: 1 } });

            return client.getSession()
                .then(() => client.getSession())
                .then(() => client.getSession())
                .then(() => client.getSession())
                .then(() => client.close());
        });
    });

    context('when the pool is full', () => {
        context('and there are idle connections', () => {
            it('waits indefinitely for a valid connection with the default timeout', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 1 } });

                return client.getSession()
                    .then(session => session.close())
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            // wait for a few millis before passing
                            setTimeout(resolve, 1000);
                            client.getSession().then(resolve).catch(reject);
                        });
                    })
                    .then(() => client.close());
            });

            it('retrieves a valid connection if one is made available and there is no queueTimeout', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 2 } });

                return Promise.all([client.getSession(), client.getSession()])
                    .then(sessions => Promise.all([client.getSession(), sessions[0].close(), sessions[1].close(), client.getSession()]))
                    .then(() => client.close());
            });

            it('retrieves a valid connection if one is made available before exceeding the queueTimeout', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 1, queueTimeout: 2000 } });

                return client.getSession()
                    .then(session => {
                        const delayed = new Promise(resolve => {
                            setTimeout(() => session.close().then(resolve), 500);
                        });

                        return Promise.all([client.getSession(), delayed]);
                    })
                    .then(() => client.close());
            });

            it('retrieves a valid connection if the timeout is above the maximum idle time', function () {
                const maxIdleTime = 100;
                const queueTimeout = maxIdleTime * 50;

                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 1, maxIdleTime, queueTimeout } });

                return client.getSession()
                    .then(session => session.close())
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => client.getSession().then(resolve).catch(reject), maxIdleTime * 10);
                        });
                    })
                    .then(session => expect(session.inspect()).to.deep.include({ pooling: true }))
                    .then(() => client.close());
            });

            it('starts from a clean session slate', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 1 } });
                const expected = [[null]];
                const actual = [];

                return client.getSession()
                    .then(session => {
                        return session.sql('SET @a = 5').execute()
                            .then(() => session.close());
                    })
                    .then(() => client.getSession())
                    .then(session => {
                        return session.sql('SELECT @a = 5').execute(row => actual.push(row))
                            .then(() => session.close());
                    })
                    .then(() => {
                        expect(actual).to.deep.equal(expected);
                        return client.close();
                    });
            });

            it('fails if the timeout is exceeded', () => {
                const queueTimeout = 100;
                const maxIdleTime = queueTimeout * 10;

                const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 1, maxIdleTime, queueTimeout } });

                return client.getSession()
                    .then(() => client.getSession())
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal(error);
                        return client.close();
                    });
            });

            it('prioritizes idle connections instead of unused ones', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 3 } });
                const connections = [];

                return client.getSession()
                    .then(session1 => {
                        return session1.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]))
                            .then(() => client.getSession())
                            .then(session2 => {
                                return session2.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]))
                                    // close the second session
                                    .then(() => session2.close());
                            })
                            .then(() => client.getSession())
                            .then(session3 => {
                                return session3.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]))
                                    // close the first session
                                    .then(() => session1.close());
                            })
                            .then(() => client.getSession())
                            .then(session4 => {
                                return session4.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]));
                            });
                    })
                    .then(() => {
                        expect(connections).to.have.lengthOf(4);
                        expect(connections[2]).to.equal(connections[1]);
                        expect(connections[3]).to.equal(connections[0]);

                        return client.close();
                    });
            });

            it('prioritizes idle connections instead of closed ones', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 3, maxIdleTime: 10 } });
                const connections = [];

                return client.getSession()
                    .then(session1 => {
                        return session1.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]))
                            .then(() => client.getSession())
                            .then(session2 => {
                                return session2.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]))
                                    // close the second session
                                    .then(() => session2.close());
                            })
                            .then(() => new Promise(resolve => {
                                setTimeout(() => client.getSession().then(resolve), 100);
                            }))
                            .then(session3 => {
                                return session3.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]))
                                    // close the first session
                                    .then(() => session1.close());
                            })
                            .then(() => new Promise(resolve => {
                                setTimeout(() => client.getSession().then(resolve), 100);
                            }))
                            .then(session4 => {
                                return session4.sql('SELECT CONNECTION_ID()')
                                    .execute(row => connections.push(row[0]));
                            });
                    })
                    .then(() => {
                        expect(connections).to.have.lengthOf(4);
                        expect(connections[2]).to.equal(connections[1]);
                        expect(connections[3]).to.equal(connections[0]);

                        return client.close();
                    });
            });

            it('re-uses idle connections after some period of inactivity', () => {
                const baseConfig = Object.assign({}, schemalessConfig, { connectTimeout: 100 });
                const client = mysqlx.getClient(baseConfig, { pooling: { maxSize: 2 } });

                const connections = [];

                return client.getSession()
                    .then(session1 => {
                        return session1.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]))
                            .then(() => session1.close());
                    })
                    .then(() => {
                        return new Promise(resolve => setTimeout(() => client.getSession().then(resolve), 200));
                    })
                    .then(session2 => {
                        return session2.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]))
                            .then(() => session2.close());
                    })
                    .then(() => {
                        expect(connections).to.have.lengthOf(2);
                        expect(connections[1]).to.equal(connections[0]);

                        return client.close();
                    });
            });
        });

        context('and there are no idle connections', () => {
            it('waits indefinitely for a valid connection with the default timeout', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 1 } });

                return client.getSession()
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            // wait for a few millis before passing
                            setTimeout(resolve, 1000);
                            client.getSession().then(resolve).catch(reject);
                        });
                    })
                    .then(() => client.close());
            });

            it('fails after the timeout is exceeded', () => {
                const queueTimeout = 200;
                const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

                const client = mysqlx.getClient(schemalessConfig, { pooling: { enabled: true, maxSize: 1, queueTimeout } });

                return client.getSession()
                    .then(() => client.getSession())
                    .then(() => expect.fail())
                    .catch(err => {
                        expect(err.message).to.equal(error);
                        return client.close();
                    });
            });
        });
    });

    context('session state', () => {
        it('makes idle connections unusable', () => {
            const maxIdleTime = 1;
            const client = mysqlx.getClient(schemalessConfig, { pooling: { maxIdleTime } });
            const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

            return client.getSession()
                .then(session => {
                    return session.close()
                        .then(() => {
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime * 10));
                        })
                        .then(() => session.getSchemas())
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.message).to.equal(error);
                            return client.close();
                        });
                });
        });

        context('killing connections', () => {
            it('allows to close connections that have been killed', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { maxSize: 2 } });
                const connections = [];

                return client.getSession()
                    .then(session1 => {
                        return session1.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]))
                            .then(() => session1.close());
                    })
                    .then(() => {
                        return Promise.all([client.getSession(), client.getSession()]);
                    })
                    .then(sessions => {
                        // sessions[0] haves the same id as session1
                        return sessions[1].sql(`KILL ${connections[0]}`)
                            .execute()
                            .then(() => sessions[0].close());
                    })
                    .then(() => {
                        return client.close();
                    });
            });

            it('re-uses connections that have been killed', () => {
                const client = mysqlx.getClient(schemalessConfig, { pooling: { maxSize: 2 } });
                const connections = [];

                return client.getSession()
                    .then(session1 => {
                        return session1.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]))
                            .then(() => {
                                return session1.close();
                            });
                    })
                    .then(() => {
                        return Promise.all([client.getSession(), client.getSession()]);
                    })
                    .then(sessions => {
                        return Promise.all([sessions[0].close(), sessions[1].sql(`KILL ${connections[0]}`).execute()]);
                    })
                    .then(() => client.getSession())
                    .then(session4 => {
                        return session4.sql('SELECT CONNECTION_ID()')
                            .execute(row => connections.push(row[0]));
                    })
                    .then(() => {
                        expect(connections).to.have.lengthOf(2);
                        // session1 and session4 haves different ids since the connection was re-created
                        expect(connections[0]).to.not.equal(connections[1]);

                        return client.close();
                    });
            });
        });
    });

    context('closing the pool', () => {
        it('closes all the active connections in the server', () => {
            const client = mysqlx.getClient(schemalessConfig, { pooling: { maxSize: 3 } });
            const processIds = [];
            const connectionIds = [];

            const trackConnectionId = () => {
                return client.getSession()
                    .then(session => {
                        return session.sql('SELECT CONNECTION_ID()')
                            .execute(row => connectionIds.push(row[0]));
                    });
            };

            return Promise.all([trackConnectionId(), trackConnectionId(), trackConnectionId()])
                .then(() => client.close())
                .then(() => mysqlx.getSession(schemalessConfig))
                .then(session => {
                    return session.sql('SHOW PROCESSLIST')
                        .execute(row => processIds.push(row[0]))
                        .then(() => session.close());
                })
                .then(() => {
                    expect(processIds).to.not.include.members(connectionIds);
                });
        });
    });
});
