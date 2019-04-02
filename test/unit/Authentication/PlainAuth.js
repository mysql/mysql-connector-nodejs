'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const plainAuth = require('../../../lib/Authentication/PlainAuth');

describe('PlainAuth', () => {
    it('mixes-in AuthPlugin', () => {
        expect(plainAuth({ dbUser: 'foo' }).getPassword).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).getSchema).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).getUser).to.be.a('function');
        expect(plainAuth({ dbUser: 'foo' }).run).to.be.a('function');
    });

    it('throws error if more authentation details are requested', () => {
        expect(() => plainAuth({ user: 'foo', password: 'bar' }).getNextAuthData('moar')).to.throw(/Unexpected/);
    });

    context('getName()', () => {
        it('returns the name assigned to the plugin', () => {
            expect(plainAuth({ user: 'foo' }).getName()).to.equal('PLAIN');
        });
    });

    context('getInitialAuthData()', () => {
        context('without a default schema', () => {
            it('is able to create an initial authentication payload without a password', () => {
                expect(plainAuth({ user: 'user' }).getInitialAuthData().toString()).to.equal('\0user\0');
            });

            it('generates the payload according to the spec', () => {
                expect(plainAuth({ password: 'foo', user: 'user' }).getInitialAuthData().toString()).to.equal('\0user\0foo');
            });
        });

        context('with a default schema', () => {
            it('is able to create an initial authentication payload without a password', () => {
                expect(plainAuth({ schema: 'schema', user: 'user' }).getInitialAuthData().toString()).to.equal('schema\0user\0');
            });

            it('generates the payload according to the spec', () => {
                expect(plainAuth({ password: 'foo', schema: 'schema', user: 'user' }).getInitialAuthData().toString()).to.equal('schema\0user\0foo');
            });
        });
    });
});
