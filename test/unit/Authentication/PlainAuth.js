'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const PlainAuth = require('lib/Authentication/PlainAuth');

describe('PlainAuth', () => {
    it('should throw if auth continue is requested', () => {
        const auth = new PlainAuth({ dbUser: 'foo', dbPassword: 'bar' });
        // TODO(Rui): use `Buffer.alloc()` on node >= 4.5.0.
        const data = new Buffer(20);
        data.fill(0);

        expect(() => auth.getNextAuthData(data)).to.throw(/Unexpected/);
    });

    it('password string should be long enough for 2*\\0 + username length + password length', () => {
        const username = 'foo';
        const password = 'bar';
        const auth = new PlainAuth({ dbUser: username, dbPassword: password });
        const result = auth.getInitialAuthData();

        expect(result.length).to.equal(2 + username.length + password.length);
    });

    it('password string should start with a \\0 byte', () => {
        var auth = new PlainAuth({ dbUser: 'foo', dbPassword: 'bar' });
        var result = auth.getInitialAuthData();

        expect(result[0]).to.equal(0);
    });

    it('password string should return the username starting at offset 1', () => {
        const username = 'foo';
        const password = 'bar';
        const auth = new PlainAuth({ dbUser: username, dbPassword: password });
        const result = auth.getInitialAuthData();

        expect(result.slice(1, username.length + 1).toString()).to.equal(username);
    });

    it('password string should have a \\0 byte after username', () => {
        const username = 'foo';
        const auth = new PlainAuth({ dbUser: username, dbPassword: 'bar' });
        const result = auth.getInitialAuthData();

        expect(result[username.length + 1]).to.equal(0);
    });

    it('password should return the password', () => {
        const username = 'foo';
        const password = 'bar';
        const auth = new PlainAuth({ dbUser: username, dbPassword: password });
        const result = auth.getInitialAuthData();

        expect(result.slice(username.length + 2, username.length + 2 + password.length).toString()).to.equal(password);
    });

    it('should allow empty passwords', () => {
        const username = 'foo';
        const auth = new PlainAuth({ dbUser: username });

        return expect(auth.getInitialAuthData()).to.not.throw;
    });
});
