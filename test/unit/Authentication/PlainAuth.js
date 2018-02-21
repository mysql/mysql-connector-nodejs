'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const plainAuth = require('lib/Authentication/PlainAuth');

describe('PlainAuth', () => {
    it('should mix-in AuthPlugin', () => {
        expect(plainAuth({ dbUser: 'foo' }).getPassword).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).getUser).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).run).to.be.a('function');
    });

    it('should throw error if more authentation details are requested', () => {
        expect(() => plainAuth({ user: 'foo', password: 'bar' }).getNextAuthData('moar')).to.throw(/Unexpected/);
    });

    context('getName()', () => {
        it('should return the name assigned to the plugin', () => {
            expect(plainAuth({ user: 'foo' }).getName()).to.equal('PLAIN');
        });
    });

    context('getInitialAuthData()', () => {
        it('should be able to create an initial authentication payload without a password', () => {
            expect(plainAuth({ user: 'foo' }).getInitialAuthData().toString()).to.equal('\0foo\0');
        });

        it('should should generate the payload according to the spec', () => {
            expect(plainAuth({ user: 'foo', password: 'bar' }).getInitialAuthData().toString()).to.equal('\0foo\0bar');
        });
    });
});
