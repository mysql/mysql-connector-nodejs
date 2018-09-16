'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration server drops the connection', () => {
    beforeEach(() => {
        return mysqlx.getSession(config)
            .then(session => {
                return session.sql('SET GLOBAL mysqlx_wait_timeout=1').execute()
                    .then(() => session.close());
            });
    });

    afterEach(() => {
        return mysqlx.getSession(config)
            .then(session => {
                return session.sql('SET GLOBAL mysqlx_wait_timeout=28800').execute()
                    .then(() => session.close());
            });
    });

    context('with SSL', () => {
        it('should make a session unusable for subsequent operations', () => {
            const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

            return mysqlx.getSession(Object.assign({}, config, { socket: undefined }))
                .then(session => {
                    return new Promise(resolve => setTimeout(resolve, 3000))
                        .then(() => expect(session.sql('SELECT 1').execute()).to.be.rejectedWith(error));
                });
        });
    });

    context('without SSL', () => {
        it('should make a session unusable for subsequent operations', () => {
            const error = 'This session was closed. Use "mysqlx.getSession()" or "mysqlx.getClient()" to create a new one.';

            return mysqlx.getSession(Object.assign({}, config, { socket: undefined, ssl: false }))
                .then(session => {
                    return new Promise(resolve => setTimeout(resolve, 3000))
                        .then(() => expect(session.sql('SELECT 1').execute()).to.be.rejectedWith(error));
                });
        });
    });
});
