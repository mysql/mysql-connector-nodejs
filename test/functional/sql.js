'use strict';

/* eslint-env node, mocha */

const config = require('../properties');
const expect = require('chai').expect;
const fixtures = require('../fixtures');
const mysqlx = require('../../');

describe('raw SQL', () => {
    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
    });

    afterEach('delete default schema', () => {
        return fixtures.deleteDefaultSchema();
    });

    context('using default schema with multiple authentication mechanisms', () => {
        let password, user;

        context('MYSQL41', () => {
            beforeEach('setup test account', () => {
                password = 'test_mnp_password';
                user = 'test_mnp_user';

                return fixtures.createAccount({ password, plugin: 'mysql_native_password', user });
            });

            afterEach('delete test account', () => {
                return fixtures.deleteAccount({ user });
            });

            it('sets the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'MYSQL41', password, user });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => { actual = schemas[0]; })
                            .then(() => expect(actual).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });

        context('PLAIN', () => {
            it('sets the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'PLAIN' });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => { actual = schemas[0]; })
                            .then(() => expect(actual).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });

        context('SHA256_MEMORY', () => {
            beforeEach('make sure the password is already cached', () => {
                return mysqlx.getSession(config)
                    .then(session => session.close());
            });

            it('sets the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'SHA256_MEMORY' });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => { actual = schemas[0]; })
                            .then(() => expect(actual).to.equal(expected))
                            .then(() => session.close());
                    });
            });
        });
    });

    context('BUG#30162858', () => {
        it('maps a MySQL BLOB to a Node.js Buffer', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const bin = new Buffer('foo');
            const expected = [[bin]];
            const actual = [];

            return mysqlx.getSession(config)
                .then(session => {
                    return session.sql('CREATE TABLE test (bin BLOB)')
                        .execute()
                        .then(() => session.sql(`INSERT INTO test (bin) VALUES (x'${bin.toString('hex')}')`).execute())
                        .then(() => session.sql('SELECT * FROM test').execute(row => actual.push(row)))
                        .then(() => expect(actual).to.deep.equal(expected))
                        .then(() => session.close());
                });
        });
    });
});
