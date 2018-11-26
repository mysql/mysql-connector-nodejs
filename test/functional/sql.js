'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional raw SQL', () => {
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

            it('should set the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'MYSQL41', password, user });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => {
                                actual = schemas[0];
                            })
                            .then(() => {
                                return expect(actual).to.equal(expected);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });
        });

        context('PLAIN', () => {
            it('should set the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'PLAIN' });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => {
                                actual = schemas[0];
                            })
                            .then(() => {
                                return expect(actual).to.equal(expected);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });
        });

        context('SHA256_MEMORY', () => {
            beforeEach('make sure the password is already cached', () => {
                return mysqlx.getSession(config);
            });

            it('should set the given default schema', () => {
                const options = Object.assign({}, config, { auth: 'SHA256_MEMORY' });
                const expected = options.schema;

                let actual;

                return mysqlx.getSession(options)
                    .then(session => {
                        return session.sql('SELECT DATABASE()')
                            .execute(schemas => {
                                actual = schemas[0];
                            })
                            .then(() => {
                                return expect(actual).to.equal(expected);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });
        });
    });
});
