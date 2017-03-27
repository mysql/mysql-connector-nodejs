'use strict';

/* eslint-env node, mocha */

const sessionConfig = require('lib/DevAPI/SessionConfig');
const expect = require('chai').expect;

describe('SessionConfig', () => {
    context('getName()', () => {
        it('should return the name of a given session', () => {
            expect(sessionConfig('foo').getName()).to.equal('foo');
        });
    });

    context('getUri()', () => {
        it('should return the uri of a given session', () => {
            expect(sessionConfig('foo', 'bar').getUri()).to.equal('bar');
        });
    });

    // Tests both `setAppData()` and `getAppData()`.
    it('should encapsulate application specific parameters', () => {
        expect(sessionConfig().setAppData('foo', 'bar').getAppData('foo')).to.equal('bar');
    });
});
