'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional transaction savepoints', () => {
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

    it('should create savepoint with a generated name if not provided', () => {
        return session
            .startTransaction()
            .then(() => {
                return expect(session.setSavepoint()).to.eventually.be.a('string').and.not.be.empty;
            });
    });

    it('should create a savepoint with the given name', () => {
        return session
            .startTransaction()
            .then(() => {
                return expect(session.setSavepoint('foo')).to.eventually.equal('foo');
            });
    });

    it('should not create a savepoint with empty string', () => {
        return session
            .startTransaction()
            .then(() => {
                return expect(session.setSavepoint('')).to.be.rejectedWith('Invalid Savepoint name.');
            });
    });

    it('should release a valid savepoint', () => {
        return session
            .startTransaction()
            .then(() => {
                return session.setSavepoint('foo');
            })
            .then(point => {
                return expect(session.releaseSavepoint(point)).to.be.fulfilled;
            });
    });

    it('should not release a savepoint with empty string', () => {
        return session
            .startTransaction()
            .then(() => {
                return session.setSavepoint('foo');
            })
            .then(point => {
                return expect(session.releaseSavepoint('')).to.be.rejectedWith('Invalid Savepoint name.');
            });
    });

    it('should raise error on an invalid savepoint', () => {
        return session
            .startTransaction()
            .then(() => {
                return session.setSavepoint('foo');
            })
            .then(point => {
                return expect(session.releaseSavepoint('s')).to.be.rejected.then((err) => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1305);
                });
            });
    });

    it('should rollback to a valid savepoint', () => {
        return session
            .startTransaction()
            .then(() => {
                return session.setSavepoint('foo');
            })
            .then(point => {
                return expect(session.rollbackTo(point)).to.be.fulfilled;
            });
    });

    it('should not rollback to a savepoint with an empty string', () => {
        return session
            .startTransaction()
            .then(() => {
                return session.setSavepoint('foo');
            })
            .then(point => {
                return expect(session.rollbackTo('')).to.be.rejectedWith('Invalid Savepoint name.');
            });
    });

    it('should raise error on an invalid savepoint', () => {
        return session
            .startTransaction()
            .then(() => {
                return session.setSavepoint('foo');
            })
            .then(point => {
                return expect(session.rollbackTo('s')).to.be.rejected.then((err) => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1305);
                });
            });
    });
});
