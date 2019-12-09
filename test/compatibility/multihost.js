'use strict';

/* eslint-env node, mocha */

const config = require('../properties');
const expect = require('chai').expect;
const mysqlx = require('../../');
const util = require('../util');

describe('multihost', () => {
    const timeout = 120000; // 2 minutes
    const endpoints = [{
        id: 'nodejsmysqlxtest_multihost-primary_1',
        host: config.host,
        port: 33069,
        priority: 100
    }, {
        id: 'nodejsmysqlxtest_multihost-secondary1_1',
        host: config.host,
        port: 33070,
        priority: 90
    }, {
        id: 'nodejsmysqlxtest_multihost-secondary2_1',
        host: config.host,
        port: 33071,
        priority: 80
    }];

    context('server refusals', () => {
        // only endpoints with explicit priority make sense to make sure the server with the connection cap is attempted first

        context('limiting mysqlx_max_connections', () => {
            beforeEach('limit mysqlx_max_connections', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${endpoints[0].host}:${endpoints[0].port}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SET GLOBAL mysqlx_max_connections=1')
                            .execute()
                            .then(() => session.close());
                    });
            });

            afterEach('reset mysqlx_max_connections', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${endpoints[0].host}:${endpoints[0].port}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SET GLOBAL mysqlx_max_connections=100')
                            .execute()
                            .then(() => session.close());
                    });
            });

            context('standalone sessions', () => {
                it('fails over to the next appropriate endpoint when the server reached the connection limit', () => {
                    const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(session1 => {
                            expect(session1.inspect().port).to.equal(endpoints[0].port);
                            return mysqlx.getSession(uri)
                                .then(session2 => {
                                    expect(session2.inspect().port).to.equal(endpoints[1].port);
                                    return Promise.all([session1.close(), session2.close()]);
                                });
                        });
                });

                it('fails to connect when no more endpoints are available', () => {
                    const e = endpoints[0];
                    const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@[(address=${e.host}:${e.port}, priority=${e.priority}), (address=${e.host}:${e.port + 1000}, priority=${e.priority})]`;

                    return mysqlx.getSession(uri)
                        .then(session1 => {
                            expect(session1.inspect().port).to.equal(e.port);
                            return mysqlx.getSession(uri)
                                .then(() => expect.fail())
                                .catch(err => {
                                    expect(err.message).to.equal('Unable to connect to any of the target hosts.');
                                    return session1.close();
                                });
                        });
                });
            });

            context('pooling', () => {
                let client;

                beforeEach('create pool', () => {
                    client = mysqlx.getClient(`mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`);
                });

                afterEach('destroy pool', () => {
                    return client.close();
                });

                it('fails over to the next appropriate endpoint when the server reached the connection limit', () => {
                    return client.getSession()
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[0].port);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[1].port);
                        });
                });
            });
        });

        context('limiting max_connections', () => {
            // the server allows max_connections + 1, so we need an active session
            let session;

            beforeEach('create active session', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${endpoints[0].host}:${endpoints[0].port}`;

                return mysqlx.getSession(uri)
                    .then(s => {
                        session = s;
                    });
            });

            beforeEach('limit mysqlx_max_connections', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${endpoints[0].host}:${endpoints[0].port}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SET GLOBAL max_connections=1')
                            .execute()
                            .then(() => session.close());
                    });
            });

            afterEach('reset max_connections', () => {
                const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@${endpoints[0].host}:${endpoints[0].port}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        return session.sql('SET GLOBAL max_connections=151')
                            .execute()
                            .then(() => session.close());
                    });
            });

            afterEach('close active session', () => {
                return session.close();
            });

            context('standalone sessions', () => {
                it('fails over to the next appropriate endpoint when the server reached the connection limit', () => {
                    const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(session1 => {
                            expect(session1.inspect().port).to.equal(endpoints[0].port);
                            return mysqlx.getSession(uri)
                                .then(session2 => {
                                    expect(session2.inspect().port).to.equal(endpoints[1].port);
                                    return Promise.all([session1.close(), session2.close()]);
                                });
                        });
                });

                it('fails to connect when no more endpoints are available', () => {
                    const e = endpoints[0];
                    const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@[(address=${e.host}:${e.port}, priority=${e.priority}), (address=${e.host}:${e.port + 1000}, priority=${e.priority})]`;

                    return mysqlx.getSession(uri)
                        .then(session1 => {
                            expect(session1.inspect().port).to.equal(e.port);
                            return mysqlx.getSession(uri)
                                .then(() => expect.fail())
                                .catch(err => {
                                    expect(err.message).to.equal('Unable to connect to any of the target hosts.');
                                    return session1.close();
                                });
                        });
                });
            });

            context('pooling', () => {
                let client;

                beforeEach('create pool', () => {
                    client = mysqlx.getClient(`mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`);
                });

                afterEach('destroy pool', () => {
                    return client.close();
                });

                it('fails over to the next appropriate endpoint when the server reached the connection limit', () => {
                    return client.getSession()
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[0].port);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[1].port);
                        });
                });
            });
        });
    });

    context('network failures', () => {
        afterEach('enable all hosts', function () {
            // ensure at least 30s (the default wait period) for each endpoint
            this.timeout(timeout);

            return Promise.all(endpoints.map(e => util.enableHost(e.id)));
        });

        context('standalone sessions', () => {
            context('with priority', () => {
                it('fails over to the next appropriate endpoint when the first ceases to be available', function () {
                    this.timeout(timeout / 2);

                    const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[0].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints[0].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[1].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints[1].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[2].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.enableHost(endpoints[0].id);
                        })
                        .then(() => {
                            return util.disableHost(endpoints[2].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[0].port);
                            return session.close();
                        });
                });
            });

            context('with reverse priority', () => {
                it('fails over to the next appropriate endpoint when the first ceases to be available', function () {
                    this.timeout(timeout / 2);

                    const reversed = Array.from(endpoints).reverse();
                    const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@[${reversed.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[2].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(reversed[2].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[1].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(reversed[1].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[0].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.enableHost(reversed[2].id);
                        })
                        .then(() => {
                            return util.disableHost(reversed[0].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[2].port);
                            return session.close();
                        });
                });
            });

            context('without priority', () => {
                it('randomly fails over to a new endpoint when the first ceases to be available', function () {
                    this.timeout(timeout / 2);

                    let firstPort, secondPort, thirdPort;

                    const uri = `mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `${e.host}:${e.port}`).join(',')}]`;

                    return mysqlx.getSession(uri)
                        .then(session => {
                            expect(firstPort = session.inspect().port).to.be.oneOf(endpoints.map(e => e.port));
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints.filter(e => e.port === firstPort)[0].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(secondPort = session.inspect().port).to.be.oneOf(endpoints.filter(e => e.port !== firstPort).map(e => e.port));
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints.filter(e => e.port === secondPort)[0].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(thirdPort = session.inspect().port).to.be.oneOf(endpoints.filter(e => e.port !== secondPort).map(e => e.port));
                            return session.close();
                        })
                        .then(() => {
                            return util.enableHost(endpoints.filter(e => e.port === firstPort)[0].id);
                        })
                        .then(() => {
                            return util.disableHost(endpoints.filter(e => e.port === thirdPort)[0].id);
                        })
                        .then(() => {
                            return mysqlx.getSession(uri);
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints.filter(e => e.port === firstPort)[0].port);
                            return session.close();
                        });
                });
            });
        });

        context('pooling', () => {
            let client;

            afterEach('destroy pool', () => {
                return client.close();
            });

            context('with priority', () => {
                beforeEach('create pool', () => {
                    client = mysqlx.getClient(`mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`);
                });

                it('fails over to the next appropriate endpoint when the first ceases to be available', function () {
                    this.timeout(timeout / 2);

                    return client.getSession()
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[0].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints[0].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[1].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints[1].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[2].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.enableHost(endpoints[0].id);
                        })
                        .then(() => {
                            return util.disableHost(endpoints[2].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints[0].port);
                            return session.close();
                        });
                });
            });

            context('with reverse priority', () => {
                let reversed = Array.from(endpoints).reverse();

                beforeEach('create pool', () => {
                    client = mysqlx.getClient(`mysqlx://${config.dbUser}:${config.dbPassword}@[${reversed.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(',')}]`);
                });

                it('fails over to the next appropriate endpoint when the first ceases to be available', function () {
                    this.timeout(timeout / 2);

                    return client.getSession()
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[2].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(reversed[2].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[1].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(reversed[1].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[0].port);
                            return session.close();
                        })
                        .then(() => {
                            return util.enableHost(reversed[2].id);
                        })
                        .then(() => {
                            return util.disableHost(reversed[0].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(reversed[2].port);
                            return session.close();
                        });
                });
            });

            context('without priority', () => {
                beforeEach('create pool', () => {
                    client = mysqlx.getClient(`mysqlx://${config.dbUser}:${config.dbPassword}@[${endpoints.map(e => `${e.host}:${e.port}`).join(',')}]`);
                });

                it('randomly fails over to a new endpoint when the first ceases to be available', function () {
                    this.timeout(timeout / 2);

                    let firstPort, secondPort, thirdPort;

                    return client.getSession()
                        .then(session => {
                            expect(firstPort = session.inspect().port).to.be.oneOf(endpoints.map(e => e.port));
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints.filter(e => e.port === firstPort)[0].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(secondPort = session.inspect().port).to.be.oneOf(endpoints.filter(e => e.port !== firstPort).map(e => e.port));
                            return session.close();
                        })
                        .then(() => {
                            return util.disableHost(endpoints.filter(e => e.port === secondPort)[0].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(thirdPort = session.inspect().port).to.be.oneOf(endpoints.filter(e => e.port !== secondPort).map(e => e.port));
                            return session.close();
                        })
                        .then(() => {
                            return util.enableHost(endpoints.filter(e => e.port === firstPort)[0].id);
                        })
                        .then(() => {
                            return util.disableHost(endpoints.filter(e => e.port === thirdPort)[0].id);
                        })
                        .then(() => {
                            return client.getSession();
                        })
                        .then(session => {
                            expect(session.inspect().port).to.equal(endpoints.filter(e => e.port === firstPort)[0].port);
                            return session.close();
                        });
                });
            });
        });
    });
});
