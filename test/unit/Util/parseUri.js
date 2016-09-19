"use strict";

const parseUri = require('../../../lib/Util/parseUri');
require('chai').should();


describe('MySQLx URL parsing', function () {
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
        }
    ].forEach(function (expression) {
        it('should ' + expression.should + ' (' + expression.in + ')', function () {
            parseUri(expression.in).should.deep.equal(expression.exp);
        });
    });
});
