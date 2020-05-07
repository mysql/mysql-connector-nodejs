'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const fixtures = require('../../../fixtures');
const expect = require('chai').expect;

describe('transaction support', () => {
    let session;

    const baseConfig = { schema: undefined };

    beforeEach('create default session', () => {
        return fixtures.createSession(baseConfig)
            .then(newSession => {
                session = newSession;
            });
    });

    beforeEach('create temporary schema', () => {
        return fixtures.createSchema(config.schema);
    });

    beforeEach('create temporary table', () => {
        return session.sql(`CREATE TABLE ${config.schema}.test (name VARCHAR(4))`)
            .execute();
    });

    afterEach('delete temporary schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close default session', () => {
        return session.close();
    });

    context('committing transactions', () => {
        it('executes the work in the scope of an ongoing transaction', () => {
            return session.startTransaction()
                .then(() => {
                    return session.sql(`INSERT INTO ${config.schema}.test VALUES ('bar')`)
                        .execute();
                })
                .then(() => {
                    return session.commit();
                })
                .then(() => {
                    return session.sql(`SELECT COUNT(*) FROM ${config.schema}.test`)
                        .execute();
                })
                .then(res => {
                    return expect(res.fetchOne()[0]).to.equal(1);
                });
        });
    });

    context('rolling back transactions', () => {
        it('discards the work in the scope of an ongoing transaction', () => {
            return session.startTransaction()
                .then(() => {
                    return session.sql(`INSERT INTO ${config.schema}.test VALUES ('bar')`)
                        .execute();
                })
                .then(() => {
                    return session.rollback();
                })
                .then(() => {
                    return session.sql(`SELECT COUNT(*) FROM ${config.schema}.test`)
                        .execute();
                })
                .then(res => {
                    return expect(res.fetchOne()[0]).to.equal(0);
                });
        });
    });
});
