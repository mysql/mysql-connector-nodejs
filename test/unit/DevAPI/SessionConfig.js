'use strict';

/* eslint-env node, mocha */

const sessionConfig = require('lib/DevAPI/SessionConfig');
const expect = require('chai').expect;

describe('SessionConfig', () => {
    it('should throw error if the name is invalid', () => {
        ['', ' '.repeat(33), ',', '.', '-'].forEach(invalid => {
            expect(() => sessionConfig(invalid)).to.throw('Invalid persistent session name');
        });
    });

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

    context('setUri()', () => {
        it('should update the uri of a given session', () => {
            expect(sessionConfig('foo', 'bar').setUri('baz').getUri()).to.equal('baz');
        });
    });

    // Tests both `setAppData()` and `getAppData()`.
    it('should encapsulate application specific parameters', () => {
        expect(sessionConfig().setAppData('foo', 'bar').getAppData('foo')).to.equal('bar');
    });

    context('toObject()', () => {
        it('should return a deep copy of the session configuration state', () => {
            const config = sessionConfig('foo');
            const copy = config.toObject();

            copy.name = 'bar';

            expect(config.getName()).to.equal('foo');
        });
    });
});
