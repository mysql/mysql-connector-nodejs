'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const locking = require('lib/DevAPI/Locking');
const expect = require('chai').expect;

describe('DevAPI locking', () => {
    it('should set the default locking mode to `NONE` by default', () => {
        const query = locking();

        expect(query.getRowLock()).to.equal(locking.Type.NONE);
    });

    context('lockShared()', () => {
        it('should set the correct locking mode', () => {
            const query = locking().lockShared();

            expect(query.getRowLock()).to.equal(locking.Type.SHARED_LOCK);
        });
    });

    context('lockExclusive()', () => {
        it('should set the correct locking mode', () => {
            const query = locking().lockExclusive();

            expect(query.getRowLock()).to.equal(locking.Type.EXCLUSIVE_LOCK);
        });
    });
});
