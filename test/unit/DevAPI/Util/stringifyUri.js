'use strict';

/* eslint-env node, mocha */

const stringifyUri = require('lib/DevAPI/Util/stringifyUri');
const expect = require('chai').expect;

describe('stringifyUri', () => {
    context('local socket', () => {
        it('should stringify an URI containing just the socket', () => {
            expect(stringifyUri({ socket: 'foo' })).to.equal('mysqlx://(foo)');
        });

        it('should stringify an URI containing a username', () => {
            expect(stringifyUri({ dbUser: 'foo', socket: 'bar' })).to.equal('mysqlx://foo@(bar)');
        });

        it('should stringify an URI containing a schema', () => {
            expect(stringifyUri({ schema: 'foo', socket: 'bar' })).to.equal('mysqlx://(bar)/foo');
        });

        it('should stringify an insecure URL', () => {
            expect(stringifyUri({ ssl: false, socket: 'bar' })).to.equal('mysqlx://(bar)?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing security options', () => {
            expect(stringifyUri({ ssl: true, socket: 'bar', sslOptions: { ca: 'baz', crl: 'qux' } })).to.equal('mysqlx://(bar)?ssl-mode=VERIFY_CA&ssl-ca=(baz)&ssl-crl=(qux)');
        });

        it('should stringify an URI containing a username and a password', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', socket: 'baz' })).to.equal('mysqlx://bar:foo@(baz)');
        });

        it('should stringify an URI containing a password less username', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', socket: 'bar' })).to.equal('mysqlx://foo:@(bar)');
        });

        it('should stringify an URI containing a username and a schema', () => {
            expect(stringifyUri({ dbUser: 'foo', schema: 'bar', socket: 'baz' })).to.equal('mysqlx://foo@(baz)/bar');
        });

        it('should stringify an insecure URI containing a username', () => {
            expect(stringifyUri({ dbUser: 'foo', ssl: false, socket: 'bar' })).to.equal('mysqlx://foo@(bar)?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing a username and security options', () => {
            expect(stringifyUri({ dbUser: 'foo', ssl: true, socket: 'bar', sslOptions: { ca: 'baz', crl: 'qux' } })).to.equal('mysqlx://foo@(bar)?ssl-mode=VERIFY_CA&ssl-ca=(baz)&ssl-crl=(qux)');
        });

        it('should stringify an URI containing a username, a password and a schema', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', schema: 'baz', socket: 'qux' })).to.equal('mysqlx://bar:foo@(qux)/baz');
        });

        it('should stringify an URI containing a password less username and a schema', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', schema: 'bar', socket: 'baz' })).to.equal('mysqlx://foo:@(baz)/bar');
        });

        it('should stringify an insecure URI containing a username and a password', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', socket: 'baz', ssl: false })).to.equal('mysqlx://bar:foo@(baz)?ssl-mode=DISABLED');
        });

        it('should stringify an insecure URI containing a password less username and a password', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', socket: 'bar', ssl: false })).to.equal('mysqlx://foo:@(bar)?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing a username, a password and security options', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', socket: 'baz', ssl: true, sslOptions: { ca: 'qux' } })).to.equal('mysqlx://bar:foo@(baz)?ssl-mode=VERIFY_CA&ssl-ca=(qux)');
        });

        it('should stringify an URI containing a password less username, a password and security options', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', socket: 'bar', ssl: true, sslOptions: { ca: 'baz' } })).to.equal('mysqlx://foo:@(bar)?ssl-mode=VERIFY_CA&ssl-ca=(baz)');
        });

        it('should stringify an URI containing a username, a password, a schema and security options', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', schema: 'baz', socket: 'qux', ssl: true, sslOptions: { ca: 'quux' } })).to.equal('mysqlx://bar:foo@(qux)/baz?ssl-mode=VERIFY_CA&ssl-ca=(quux)');
        });

        it('should stringify an URI containing a password less username, a password, a schema and security options', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', schema: 'bar', socket: 'baz', ssl: true, sslOptions: { ca: 'qux' } })).to.equal('mysqlx://foo:@(baz)/bar?ssl-mode=VERIFY_CA&ssl-ca=(qux)');
        });
    });

    context('local or remote host', () => {
        it('should stringify an URI containing just the host', () => {
            expect(stringifyUri({ host: 'foo' })).to.equal('mysqlx://foo');
        });

        it('should stringify an URI containing a port', () => {
            expect(stringifyUri({ host: 'foo', port: 3357 })).to.equal('mysqlx://foo:3357');
        });

        it('should stringify an URI containing a username', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar' })).to.equal('mysqlx://foo@bar');
        });

        it('should stringify an URI containing a schema', () => {
            expect(stringifyUri({ host: 'foo', schema: 'bar' })).to.equal('mysqlx://foo/bar');
        });

        it('should stringify an insecure URI', () => {
            expect(stringifyUri({ host: 'foo', ssl: false })).to.equal('mysqlx://foo?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing security options', () => {
            expect(stringifyUri({ host: 'foo', ssl: true, sslOptions: { ca: 'bar', crl: 'baz' } })).to.equal('mysqlx://foo?ssl-mode=VERIFY_CA&ssl-ca=(bar)&ssl-crl=(baz)');
        });

        it('should stringify an URI containing a username and a password', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz' })).to.equal('mysqlx://bar:foo@baz');
        });

        it('should stringify an URI containing a password less username', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar' })).to.equal('mysqlx://foo:@bar');
        });

        it('should stringify an URI containing a username and a port', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', port: 3357 })).to.equal('mysqlx://foo@bar:3357');
        });

        it('should stringify an URI containing a username and a schema', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', schema: 'baz' })).to.equal('mysqlx://foo@bar/baz');
        });

        it('should stringify an insecure URI containing a username and a schema', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', schema: 'baz', ssl: false })).to.equal('mysqlx://foo@bar/baz?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing a username and security options', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', ssl: true, sslOptions: { ca: 'baz', crl: 'qux' } })).to.equal('mysqlx://foo@bar?ssl-mode=VERIFY_CA&ssl-ca=(baz)&ssl-crl=(qux)');
        });

        it('should stringify an URI containing a port and a schema', () => {
            expect(stringifyUri({ host: 'foo', schema: 'bar', port: 3357 })).to.equal('mysqlx://foo:3357/bar');
        });

        it('should stringify an insecure URI containing a port and a schema', () => {
            expect(stringifyUri({ host: 'foo', port: 3357, schema: 'baz', ssl: false })).to.equal('mysqlx://foo:3357/baz?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing a port and security options', () => {
            expect(stringifyUri({ host: 'foo', port: 3357, ssl: true, sslOptions: { ca: 'bar', crl: 'baz' } })).to.equal('mysqlx://foo:3357?ssl-mode=VERIFY_CA&ssl-ca=(bar)&ssl-crl=(baz)');
        });

        it('should stringify an URI containing a schema and security options', () => {
            expect(stringifyUri({ host: 'foo', schema: 'bar', ssl: true, sslOptions: { ca: 'baz', crl: 'qux' } })).to.equal('mysqlx://foo/bar?ssl-mode=VERIFY_CA&ssl-ca=(baz)&ssl-crl=(qux)');
        });

        it('should stringify an URI containing a username, a password and a port', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', port: 3357 })).to.equal('mysqlx://bar:foo@baz:3357');
        });

        it('should stringify an URI containing a password less username and a port', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar', port: 3357 })).to.equal('mysqlx://foo:@bar:3357');
        });

        it('should stringify an URI containing a username, a password and a schema', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', schema: 'qux' })).to.equal('mysqlx://bar:foo@baz/qux');
        });

        it('should stringify an URI containing a password less username and a schema', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar', schema: 'baz' })).to.equal('mysqlx://foo:@bar/baz');
        });

        it('should stringify an insecure URI containing a username, a password and and a schema', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', schema: 'qux', ssl: false })).to.equal('mysqlx://bar:foo@baz/qux?ssl-mode=DISABLED');
        });

        it('should stringify an insecure URI containing a password less username and a schema', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar', schema: 'baz', ssl: false })).to.equal('mysqlx://foo:@bar/baz?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing a username, a password and security options', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', ssl: true, sslOptions: { ca: 'qux', crl: 'quux' } })).to.equal('mysqlx://bar:foo@baz?ssl-mode=VERIFY_CA&ssl-ca=(qux)&ssl-crl=(quux)');
        });

        it('should stringify an URI containing a password less username and security options', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar', ssl: true, sslOptions: { ca: 'baz', crl: 'qux' } })).to.equal('mysqlx://foo:@bar?ssl-mode=VERIFY_CA&ssl-ca=(baz)&ssl-crl=(qux)');
        });

        it('should stringify an URI containing a username, a port and a schema', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', schema: 'baz', port: 3357 })).to.equal('mysqlx://foo@bar:3357/baz');
        });

        it('should stringify an insecure URI containing a username, a port and schema', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', port: 3357, schema: 'baz', ssl: false })).to.equal('mysqlx://foo@bar:3357/baz?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing a username, a port and security options', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', port: 3357, ssl: true, sslOptions: { ca: 'baz', crl: 'qux' } })).to.equal('mysqlx://foo@bar:3357?ssl-mode=VERIFY_CA&ssl-ca=(baz)&ssl-crl=(qux)');
        });

        it('should stringify an URI containing a username, a schema and security options', () => {
            expect(stringifyUri({ dbUser: 'foo', host: 'bar', schema: 'baz', ssl: true, sslOptions: { ca: 'qux', crl: 'quux' } })).to.equal('mysqlx://foo@bar/baz?ssl-mode=VERIFY_CA&ssl-ca=(qux)&ssl-crl=(quux)');
        });

        it('should stringify an URI containing a username, a password, a port and a schema', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', port: 3357, schema: 'qux' })).to.equal('mysqlx://bar:foo@baz:3357/qux');
        });

        it('should stringify an URI containing a password less username, a port and a schema', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar', port: 3357, schema: 'baz' })).to.equal('mysqlx://foo:@bar:3357/baz');
        });

        it('should stringify an insecure URI containing a username, a password, a port and a schema', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', port: 3357, schema: 'qux', ssl: false })).to.equal('mysqlx://bar:foo@baz:3357/qux?ssl-mode=DISABLED');
        });

        it('should stringify an insecure URI containing a password less username, a port and a schema', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar', port: 3357, schema: 'baz', ssl: false })).to.equal('mysqlx://foo:@bar:3357/baz?ssl-mode=DISABLED');
        });

        it('should stringify an URI containing a username, a password, a port and security options', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', port: 3357, ssl: true, sslOptions: { ca: 'qux', crl: 'quux' } })).to.equal('mysqlx://bar:foo@baz:3357?ssl-mode=VERIFY_CA&ssl-ca=(qux)&ssl-crl=(quux)');
        });

        it('should stringify an URI containing a username, a password, a port, a schema and security options', () => {
            expect(stringifyUri({ dbPassword: 'foo', dbUser: 'bar', host: 'baz', port: 3357, schema: 'qux', ssl: true, sslOptions: { ca: 'quux' } })).to.equal('mysqlx://bar:foo@baz:3357/qux?ssl-mode=VERIFY_CA&ssl-ca=(quux)');
        });

        it('should stringify an URI containing a password less username, a port, a schema and security options', () => {
            expect(stringifyUri({ dbPassword: '', dbUser: 'foo', host: 'bar', port: 3357, schema: 'baz', ssl: true, sslOptions: { ca: 'qux' } })).to.equal('mysqlx://foo:@bar:3357/baz?ssl-mode=VERIFY_CA&ssl-ca=(qux)');
        });
    });

    it('should throw error if neither a host nor a socket are not defined', () => {
        expect(() => stringifyUri({})).to.throw('Either a host or socket must be provided');
    });
});
