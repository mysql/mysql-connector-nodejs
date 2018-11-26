'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional connection pooling', () => {
    context('creating a pool', () => {
        it('should allow to specify the pool options using a plain JavaScript object', () => {
            expect(() => mysqlx.getClient(config, { pooling: { enabled: true } })).to.not.throw();
        });

        it('should allow to specify the pool options using a JSON string', () => {
            expect(() => mysqlx.getClient(config, JSON.stringify({ pooling: { enabled: true } }))).to.not.throw();
        });

        it('should fail when unknown options are provided', () => {
            expect(() => mysqlx.getClient(config, { foo: 'bar' })).to.throw(`Client option 'foo' is not recognized as valid.`);
            expect(() => mysqlx.getClient(config, { pooling: { foo: 'bar' } })).to.throw(`Client option 'pooling.foo' is not recognized as valid.`);
        });

        it('should fail when invalid option values are provided', () => {
            expect(() => mysqlx.getClient(config, { pooling: { maxSize: 'foo' } })).to.throw(`Client option 'pooling.maxSize' does not support value 'foo'.`);
            expect(() => mysqlx.getClient(config, { pooling: { enabled: 2.2 } })).to.throw(`Client option 'pooling.enabled' does not support value '2.2'.`);
        });
    });

    context('when the pool is not full', () => {
        it('should retrieve a valid connection', () => {
            const client = mysqlx.getClient(config);

            return expect(client.getSession()).to.be.fulfilled
                .then(session => {
                    return expect(session.inspect()).to.deep.include({ pooling: true });
                })
                .then(() => {
                    return client.close();
                });
        });

        it('should allow to retrieve connections in parallel', () => {
            const client = mysqlx.getClient(config);

            return expect(Promise.all([client.getSession(), client.getSession()])).to.be.fulfilled
                .then(() => {
                    return client.close();
                });
        });

        it('should start from a clean session slate', () => {
            const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 2 } });
            const expected = [[null]];
            const actual = [];

            return client.getSession()
                .then(session => {
                    return session.sql('SET @a = 5').execute()
                        .then(() => session.close());
                })
                .then(() => {
                    return client.getSession();
                })
                .then(session => {
                    return session.sql('SELECT @a = 5').execute(row => actual.push(row))
                        .then(() => session.close());
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                    return client.close();
                });
        });

        it('it should not fail to retrieve a connection with short maximum idle times', () => {
            const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 4, maxIdleTime: 1 } });

            return client.getSession()
                .then(() => client.getSession())
                .then(() => client.getSession())
                .then(() => expect(client.getSession()).to.be.fulfilled)
                .then(() => client.close());
        });
    });

    context('when the pool is full', () => {
        context('and there are idle connections', () => {
            it('should wait indefinetily for a valid connection with the default timeout', () => {
                const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 1 } });

                return client.getSession()
                    .then(session => {
                        return session.close();
                    })
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            // wait for a few millis before passing
                            setTimeout(resolve, 1000);
                            client.getSession().then(resolve).catch(reject);
                        });
                    })
                    .then(() => {
                        return client.close();
                    });
            });

            it('should retrieve a valid connection if one is made available in the meantime', () => {
                const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 2 } });

                return Promise.all([client.getSession(), client.getSession()])
                    .then(sessions => {
                        return expect(Promise.all([client.getSession(), sessions[0].close(), sessions[1].close(), client.getSession()])).to.be.fulfilled;
                    })
                    .then(() => {
                        return client.close();
                    });
            });

            it('should retrieve a valid connection if the timeout is above the maximum idle time', function () {
                const maxIdleTime = 100;
                const queueTimeout = maxIdleTime * 50;

                const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 1, maxIdleTime, queueTimeout } });

                return client.getSession()
                    .then(session => {
                        return session.close();
                    })
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => client.getSession().then(resolve).catch(reject), maxIdleTime * 10);
                        });
                    })
                    .then(session => {
                        return expect(session.inspect()).to.deep.include({ pooling: true });
                    })
                    .then(() => {
                        return client.close();
                    });
            });

            it('should start from a clean session slate', () => {
                const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 1 } });
                const expected = [[null]];
                const actual = [];

                return client.getSession()
                    .then(session => {
                        return session.sql('SET @a = 5').execute()
                            .then(() => session.close());
                    })
                    .then(() => {
                        return client.getSession();
                    })
                    .then(session => {
                        return session.sql('SELECT @a = 5').execute(row => actual.push(row))
                            .then(() => session.close());
                    })
                    .then(() => {
                        expect(actual).to.deep.equal(expected);
                        return client.close();
                    });
            });

            it('should fail if the timeout is exceeded', () => {
                const queueTimeout = 100;
                const maxIdleTime = queueTimeout * 10;

                const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;
                const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 1, maxIdleTime, queueTimeout } });

                return client.getSession()
                    .then(() => {
                        return expect(client.getSession()).to.be.rejectedWith(error);
                    })
                    .then(() => {
                        return client.close();
                    });
            });
        });

        context('and there are no idle connections', () => {
            it('should wait indefinetily for a valid connection with the default timeout', () => {
                const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 1 } });

                return client.getSession()
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            // wait for a few millis before passing
                            setTimeout(resolve, 1000);
                            client.getSession().then(resolve).catch(reject);
                        });
                    })
                    .then(() => {
                        return client.close();
                    });
            });

            it('should fail after the timeout is exceeded', () => {
                const queueTimeout = 200;
                const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

                const client = mysqlx.getClient(config, { pooling: { enabled: true, maxSize: 1, queueTimeout } });

                return client.getSession()
                    .then(() => {
                        return expect(client.getSession()).to.be.rejectedWith(error);
                    })
                    .then(() => {
                        return client.close();
                    });
            });
        });
    });

    context('session state', () => {
        it('should make idle connections unusable', () => {
            const maxIdleTime = 1;
            const client = mysqlx.getClient(config, { pooling: { maxIdleTime } });
            const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

            return client.getSession()
                .then(session => {
                    return session.close()
                        .then(() => {
                            return new Promise(resolve => setTimeout(resolve, maxIdleTime * 10));
                        })
                        .then(() => {
                            return expect(session.getSchemas()).to.be.rejectedWith(error);
                        });
                })
                .then(() => {
                    return client.close();
                });
        });

        context('killing connections', () => {
            it('should not fail when closing connections that have been killed', () => {
                let connectionId;
                const client = mysqlx.getClient(config, { pooling: { maxSize: 2 } });

                return client.getSession()
                    .then(session => {
                        return session.sql('SELECT CONNECTION_ID()').execute(row => { connectionId = row[0]; })
                            .then(() => {
                                return session.close();
                            });
                    })
                    .then(() => {
                        return client.getSession();
                    })
                    .then(session => {
                        return session.sql(`KILL ${connectionId}`).execute();
                    })
                    .then(() => {
                        return expect(client.close()).to.be.fulfilled;
                    });
            });

            it('should properly re-use a connection that has been killed', () => {
                let connectionId;
                const client = mysqlx.getClient(config, { pooling: { maxSize: 2 } });

                return client.getSession()
                    .then(session => {
                        return session.sql('SELECT CONNECTION_ID()').execute(row => { connectionId = row[0]; })
                            .then(() => {
                                return session.close();
                            });
                    })
                    .then(() => {
                        return client.getSession();
                    })
                    .then(session => {
                        return session.sql(`KILL ${connectionId}`).execute();
                    })
                    .then(() => {
                        return expect(client.getSession()).to.be.fulfilled;
                    })
                    .then(() => {
                        return client.close();
                    });
            });
        });
    });
});
