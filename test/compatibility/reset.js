'use strict';

/* eslint-env node, mocha */

const config = require('../../test/properties');
const expect = require('chai').expect;
const mysqlx = require('../../');

describe('session reset behavior with older servers', () => {
    const baseConfig = Object.assign({}, config, { port: 33065, schema: undefined, socket: undefined });

    context('closing legacy sessions', () => {
        let session;

        beforeEach('create legacy session', () => {
            return mysqlx.getSession(baseConfig)
                .then(s => { session = s; });
        });

        afterEach('destroy legacy session', () => {
            return session.close();
        });

        it('new connections are assigned new ids', () => {
            let beforeClose, afterClose;

            return session.sql('SELECT CONNECTION_ID()')
                .execute(row => { beforeClose = row[0]; })
                .then(() => session.close())
                .then(() => mysqlx.getSession(baseConfig))
                .then(s => {
                    session = s;
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute(row => { afterClose = row[0]; });
                })
                .then(() => expect(beforeClose).to.not.equal(afterClose));
        });
    });

    context('re-using idle connections from a pool', () => {
        let client;

        beforeEach('create pool', () => {
            client = mysqlx.getClient(baseConfig, { pooling: { maxSize: 1 } });
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        it('new connections are assigned new ids', () => {
            let beforeReset, afterReset;

            return client.getSession()
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute(row => { beforeReset = row[0]; })
                        .then(() => session.close())
                        .then(() => client.getSession())
                        .then(session => {
                            return session.sql('SELECT CONNECTION_ID()')
                                .execute(row => { afterReset = row[0]; });
                        })
                        .then(() => expect(afterReset).to.not.equal(beforeReset));
                });
        });
    });

    context('reaching the maximum number of connections supported by the server', () => {
        let client;

        beforeEach('create pool', () => {
            client = mysqlx.getClient(baseConfig, { pooling: { maxSize: 1 } });
        });

        beforeEach('update mysqlx_max_connections', () => {
            return mysqlx.getSession(baseConfig)
                .then(session => {
                    return session.sql('SET GLOBAL mysqlx_max_connections=1')
                        .execute()
                        .then(() => session.close());
                });
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        afterEach('reset mysqlx_max_connections', () => {
            return mysqlx.getSession(baseConfig)
                .then(session => {
                    return session.sql('SET GLOBAL mysqlx_max_connections=100')
                        .execute()
                        .then(() => session.close());
                });
        });

        it('BUG#29436892 does not fail when re-creating an idle connection', () => {
            return client.getSession()
                .then(session => session.close())
                .then(() => client.getSession());
        });
    });
});
