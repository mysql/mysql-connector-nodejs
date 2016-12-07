'use strict';

/* eslint-env node, mocha */

const parseUri = require('lib/DevAPI/Util/parseUri');
const expect = require('chai').expect;

describe('MySQLx URL parsing', () => {
    [
        {
            should: 'parse a full URL',
            in: 'mysqlx://root:pass@hostname:3357/test',
            exp: {
                dbUser: 'root',
                dbPassword: 'pass',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse a empty password',
            in: 'mysqlx://root:@hostname:3357/test',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse a no password',
            in: 'mysqlx://root@hostname:3357/test',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse a full URL without port',
            in: 'mysqlx://root:pass@hostname/test',
            exp: {
                dbUser: 'root',
                dbPassword: 'pass',
                host: 'hostname',
                port: undefined
            }
        },
        {
            should: 'parse a empty password',
            in: 'mysqlx://root:@hostname/test',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: undefined
            }
        },
        {
            should: 'parse a no password',
            in: 'mysqlx://root@hostname:3357/test',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse a full URL, no path',
            in: 'mysqlx://root:pass@hostname:3357',
            exp: {
                dbUser: 'root',
                dbPassword: 'pass',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse a empty password, no path',
            in: 'mysqlx://root:@hostname:3357',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse a no password, no path',
            in: 'mysqlx://root@hostname:3357',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse a full URL without port, no path',
            in: 'mysqlx://root:pass@hostname',
            exp: {
                dbUser: 'root',
                dbPassword: 'pass',
                host: 'hostname',
                port: undefined
            }
        },
        {
            should: 'parse a empty password, no path',
            in: 'mysqlx://root:@hostname',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: undefined
            }
        },
        {
            should: 'parse no password, no path',
            in: 'mysqlx://root@hostname:3357',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse IPv6 loopback host, no password',
            in: 'mysqlx://root@[::]:33060',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: '::',
                port: '33060'
            }
        },
        {
            should: 'parse an arbitrary IPv6 host',
            in: 'mysqlx://root:s3ce3t!@[a1:a2:a3:a4:a5:a6:a7:a8]:3306',
            exp: {
                dbUser: 'root',
                dbPassword: 's3ce3t!',
                host: 'a1:a2:a3:a4:a5:a6:a7:a8',
                port: '3306'
            }
        },
        {
            should: 'parse an URI in the old format',
            in: 'root:password@hostname:3357',
            exp: {
                dbUser: 'root',
                dbPassword: 'password',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse an URI in the old format, no password',
            in: 'root@hostname:3357',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse an URI in the old format, empty password',
            in: 'root:@hostname:3357',
            exp: {
                dbUser: 'root',
                dbPassword: '',
                host: 'hostname',
                port: '3357'
            }
        },
        {
            should: 'parse an URI in the old format, no port',
            in: 'root:password@hostname',
            exp: {
                dbUser: 'root',
                dbPassword: 'password',
                host: 'hostname',
                port: undefined
            }
        },
        {
            should: 'parse an URI in the old format, empty port',
            in: 'root:password@hostname',
            exp: {
                dbUser: 'root',
                dbPassword: 'password',
                host: 'hostname',
                port: undefined
            }
        },
        {
            should: 'parse an IPv6 host URI in the old format',
            in: 'root:password@[a1:a2:a3:a4:a5:a6:a7:a8]:3357',
            exp: {
                dbUser: 'root',
                dbPassword: 'password',
                host: 'a1:a2:a3:a4:a5:a6:a7:a8',
                port: '3357'
            }
        }
    ].forEach(expression => {
        it('should ' + expression.should + ' (' + expression.in + ')', () => {
            expect(parseUri(expression.in)).to.deep.equal(expression.exp);
        });
    });

    it('should throw an error for an invalid old-format URI', () => {
        [
            'root',
            'root:password',
            'root:password@',
            'root:password@:3357'
        ].forEach(invalid => {
            expect(() => parseUri(invalid)).to.throw(Error, 'Invalid URI');
        });
    });
});
