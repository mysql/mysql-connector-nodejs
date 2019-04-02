'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');

describe('transaction savepoints', () => {
    let session;

    beforeEach('create session', () => {
        const options = Object.assign({}, config, { schema: undefined });

        return mysqlx.getSession(options)
            .then(s => {
                session = s;
            });
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('creates savepoint with a generated name if not provided', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint())
            .then(actual => expect(actual).to.be.a('string').and.not.be.empty);
    });

    it('creates a savepoint with the given name', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(actual => expect(actual).to.equal('foo'));
    });

    it('does not create a savepoint with empty string', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint(''))
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('Invalid Savepoint name.'));
    });

    it('releases a valid savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(point => session.releaseSavepoint(point));
    });

    it('fails to release a savepoint identified with empty string', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.releaseSavepoint(''))
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('Invalid Savepoint name.'));
    });

    it('fails to release an non-matching savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.releaseSavepoint('s'))
            .then(() => expect.fail())
            .catch(err => {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(1305);
            });
    });

    it('rolls back to a valid savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(point => session.rollbackTo(point));
    });

    it('fails to rollback to a savepoint identified by an empty string', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.rollbackTo(''))
            .then(() => expect.fail())
            .catch(err => expect(err.message).to.equal('Invalid Savepoint name.'));
    });

    it('fails to rollback to a non-matching savepoint', () => {
        return session.startTransaction()
            .then(() => session.setSavepoint('foo'))
            .then(() => session.rollbackTo('s'))
            .then(() => expect.fail())
            .catch(err => {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(1305);
            });
    });
});
