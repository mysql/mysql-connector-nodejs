'use strict';

/* eslint-env node, mocha */

const sessionConfig = require('lib/DevAPI/SessionConfig');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

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

    context('save()', () => {
        it('should emit a `save` event', () => {
            const config = sessionConfig('foo');

            config.on('save', next => {
                return next(config);
            });

            return expect(config.save()).to.be.fulfilled.then(result => {
                expect(result.getName).to.be.a('function');
                expect(result.getName()).to.equal('foo');
            });
        });
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
