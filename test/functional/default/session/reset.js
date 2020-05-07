'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const config = require('../../../config');
const mysqlx = require('../../../..');

describe('session reset behavior', () => {
    const baseConfig = { schema: undefined };

    context('when using standalone sessions', () => {
        it('new connections are assigned new ids', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            let firstConnectionId, secondConnectionId;

            return mysqlx.getSession(resetConfig)
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            firstConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return mysqlx.getSession(resetConfig);
                })
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            secondConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return expect(firstConnectionId).to.not.equal(secondConnectionId);
                });
        });
    });

    context('when using a connection pool', () => {
        let client;

        beforeEach('create pool', () => {
            const resetConfig = Object.assign({}, config, baseConfig);

            client = mysqlx.getClient(resetConfig, { pooling: { maxSize: 1 } });
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        it('idle connections are not assigned a new id', () => {
            let firstConnectionId, secondConnectionId;

            return client.getSession()
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            firstConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return client.getSession();
                })
                .then(session => {
                    return session.sql('SELECT CONNECTION_ID()')
                        .execute()
                        .then(res => {
                            secondConnectionId = res.fetchOne()[0];
                            return session.close();
                        });
                })
                .then(() => {
                    return expect(firstConnectionId).to.equal(secondConnectionId);
                });
        });
    });
});
