'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const locking = require('lib/DevAPI/Locking');
const expect = require('chai').expect;

describe('DevAPI locking', () => {
    it('should set the default lock type and mode', () => {
        const query = locking();

        expect(query.getRowLock()).to.equal(locking.Type.NONE);
        expect(query.getRowLock()).to.equal(locking.LockContention.DEFAULT);
    });

    context('lockShared()', () => {
        it('should allow the default locking mode', () => {
            const query = locking().lockShared();

            expect(query.getRowLock()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.DEFAULT);
        });

        it('should set a valid given locking mode', () => {
            let query = locking().lockShared(locking.LockContention.NOWAIT);

            expect(query.getRowLock()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.NOWAIT);

            query.lockShared(locking.LockContention.SKIP_LOCKED);

            expect(query.getRowLock()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.SKIP_LOCKED);
        });

        it('should throw an error if the locking mode is not valid', () => {
            expect(() => locking().lockShared('foo')).to.throw('Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".');
        });
    });

    context('lockExclusive()', () => {
        it('should allow the default locking mode', () => {
            const query = locking().lockExclusive();

            expect(query.getRowLock()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.DEFAULT);
        });

        it('should set a valid given locking mode', () => {
            let query = locking().lockExclusive(locking.LockContention.NOWAIT);

            expect(query.getRowLock()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.NOWAIT);

            query.lockExclusive(locking.LockContention.SKIP_LOCKED);

            expect(query.getRowLock()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockContention()).to.equal(locking.LockContention.SKIP_LOCKED);
        });

        it('should throw an error if the locking mode is not valid', () => {
            expect(() => locking().lockExclusive('foo')).to.throw('Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".');
        });
    });
});
