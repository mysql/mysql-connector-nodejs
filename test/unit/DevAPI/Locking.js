'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const locking = require('../../../lib/DevAPI/Locking');
const td = require('testdouble');

describe('Locking', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    it('sets the default lock type and mode', () => {
        const query = locking();

        expect(query.getRowLock()).to.equal(locking.Type.NONE);
        expect(query.getRowLock()).to.equal(locking.LockContention.DEFAULT);
    });

    context('lockShared()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = locking({ preparable: { forceRestart } });

            statement.lockShared();

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('allows the default locking mode', () => {
            const query = locking().lockShared();

            expect(query.getRowLock()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.DEFAULT);
        });

        it('sets a valid given locking mode', () => {
            let query = locking().lockShared(locking.LockContention.NOWAIT);

            expect(query.getRowLock()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.NOWAIT);

            query.lockShared(locking.LockContention.SKIP_LOCKED);

            expect(query.getRowLock()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.SKIP_LOCKED);
        });

        it('throws an error if the locking mode is not valid', () => {
            expect(() => locking().lockShared('foo')).to.throw('Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".');
        });
    });

    context('lockExclusive()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = locking({ preparable: { forceRestart } });

            statement.lockExclusive();

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('allows the default locking mode', () => {
            const query = locking().lockExclusive();

            expect(query.getRowLock()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.DEFAULT);
        });

        it('sets a valid given locking mode', () => {
            let query = locking().lockExclusive(locking.LockContention.NOWAIT);

            expect(query.getRowLock()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.NOWAIT);

            query.lockExclusive(locking.LockContention.SKIP_LOCKED);

            expect(query.getRowLock()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.SKIP_LOCKED);
        });

        it('throws an error if the locking mode is not valid', () => {
            expect(() => locking().lockExclusive('foo')).to.throw('Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".');
        });
    });
});
