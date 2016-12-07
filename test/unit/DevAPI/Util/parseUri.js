'use strict';

/* eslint-env node, mocha */

const parseUri = require('lib/DevAPI/Util/parseUri');
const expect = require('chai').expect;

describe('MySQLx URL parsing', () => {
    it('should parse an URI with a hostname', () => {
        const expected = {
            dbUser: 'user',
            dbPassword: 'password',
            host: 'hostname',
            port: '3357'
        };

        expect(parseUri('mysqlx://user:password@hostname:3357')).to.deep.equal(expected);
    });

    it('should parse an URI with an arbitrary IPv4 host', () => {
        const expected = {
            dbUser: 'user',
            dbPassword: 'password',
            host: '127.0.0.1',
            port: '3357'
        };

        expect(parseUri('mysqlx://user:password@127.0.0.1:3357')).to.deep.equal(expected);
    });

    it('should parse an URI with a loopback IPv6 host', () => {
        const expected = {
            dbUser: 'user',
            dbPassword: 'password',
            host: '::',
            port: '3357'
        };

        expect(parseUri('mysqlx://user:password@[::]:3357')).to.deep.equal(expected);
    });

    it('should parse an URI with an arbitrary IPv6 host', () => {
        const expected = {
            dbUser: 'user',
            dbPassword: 'password',
            host: 'a1:a2:a3:a4:a5:a6:a7:a8',
            port: '3357'
        };

        expect(parseUri('mysqlx://user:password@[a1:a2:a3:a4:a5:a6:a7:a8]:3357')).to.deep.equal(expected);
    });

    it('should throw an error if the host is not provided', () => {
        expect(() => parseUri('mysqlx://user:password')).to.throw(Error);
    });

    context('for an old-format (without scheme)', () => {
        it('should parse a complete URI', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: 'password',
                host: 'hostname',
                port: '3357'
            };

            expect(parseUri('user:password@hostname:3357')).to.deep.equal(expected);
        });

        it('should parse a URI if the password is not provided', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            };

            expect(parseUri('user@hostname:3357')).to.deep.equal(expected);
        });

        it('should parse a URI if the password is empty', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            };

            expect(parseUri('user:@hostname:3357')).to.deep.equal(expected);
        });

        it('should parse a URI if the port is not provided', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: '',
                host: 'hostname',
                port: undefined
            };

            expect(parseUri('user@hostname')).to.deep.equal(expected);
        });

        it('should parse a URI if the port is empty', () => {
            const expected = {
                dbUser: 'user',
                dbPassword: '',
                host: 'hostname',
                port: undefined
            };

            expect(parseUri('user@hostname:')).to.deep.equal(expected);
        });

        it('should throw an error if the username is not provided', () => {
            ['@hostname', '@hostname:3357'].forEach(invalid => {
                expect(() => parseUri(invalid)).to.throw(Error, 'Invalid URI');
            });
        });

        it('should throw an error if the username is empty', () => {
            [':password@hostname', ':@hostname:3357'].forEach(invalid => {
                expect(() => parseUri(invalid)).to.throw(Error, 'Invalid URI');
            });
        });

        it('should throw an error if the host is not provided', () => {
            ['root', 'root@', 'root:password@'].forEach(invalid => {
                expect(() => parseUri(invalid)).to.throw(Error, 'Invalid URI');
            });
        });

        it('should throw an error if the host is empty', () => {
            ['root@:3357', 'root:password@:3357'].forEach(invalid => {
                expect(() => parseUri(invalid)).to.throw(Error, 'Invalid URI');
            });
        });
    });
});
