'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const properties = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;
const config = Object.assign({}, properties, { schema: undefined });

describe('@functional session reset behavior', () => {
    context('closing legacy sessions', () => {
        let session;

        beforeEach('create legacy session', () => {
            return mysqlx.getSession(config)
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
                .then(() => mysqlx.getSession(config))
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
            client = mysqlx.getClient(config, { pooling: { maxSize: 1 } });
        });

        afterEach('destroy pool', () => {
            return client.close();
        });

        it('new connections are not assigned new ids', () => {
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
                        .then(() => expect(afterReset).to.equal(beforeReset));
                });
        });
    });
});
