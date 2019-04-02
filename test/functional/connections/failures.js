'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');

describe('server drops the connection', () => {
    const schemalessSocketConfig = Object.assign({}, config, { schema: undefined, socket: undefined });

    beforeEach(() => {
        return mysqlx.getSession(schemalessSocketConfig)
            .then(session => {
                return session.sql('SET GLOBAL mysqlx_wait_timeout=1').execute()
                    .then(() => session.close());
            });
    });

    afterEach(() => {
        return mysqlx.getSession(schemalessSocketConfig)
            .then(session => {
                return session.sql('SET GLOBAL mysqlx_wait_timeout=28800').execute()
                    .then(() => session.close());
            });
    });

    context('with SSL', () => {
        it('the session becomes unusable on subsequent operations', () => {
            const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

            return mysqlx.getSession(schemalessSocketConfig)
                .then(session => {
                    return new Promise(resolve => setTimeout(resolve, 2000))
                        .then(() => session.sql('SELECT 1').execute());
                })
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });
    });

    context('without SSL', () => {
        it('the session becomes unusable on subsequent operations', () => {
            const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

            return mysqlx.getSession(Object.assign({}, schemalessSocketConfig, { ssl: false }))
                .then(session => {
                    return new Promise(resolve => setTimeout(resolve, 2000))
                        .then(() => session.sql('SELECT 1').execute());
                })
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });
    });
});
