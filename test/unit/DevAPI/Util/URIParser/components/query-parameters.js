'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseUri = require('../../../../../../lib/DevAPI/Util/URIParser');

describe('parsing query parameters', () => {
    context('checking the existence and value of ssl-mode', () => {
        it('uses "true" by default if the option is not provided', () => {
            let connectionString = 'user@hostname';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061?foo=bar`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/?foo=bar`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;
        });

        it('uses "true" by default if the option is unknown', () => {
            let connectionString = 'user@hostname?ssl-mode=foo';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061?ssl-mode=foo`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/?ssl-mode=foo`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061?foo=bar&ssl-mode=foo`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/?foo=bar&ssl-mode=foo`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            return expect(parseUri(connectionString).tls.enabled).to.be.true;
        });

        it('uses "true" if the option value is "REQUIRED"', () => {
            let connectionString = 'user@hostname?ssl-mode=REQUIRED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061?ssl-mode=REQUIRED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/?ssl-mode=REQUIRED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061?foo=bar&ssl-mode=REQUIRED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/?foo=bar&ssl-mode=REQUIRED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061?foo=bar&ssl-mode=REQUIRED&baz=qux`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/?foo=bar&ssl-mode=REQUIRED&baz=qux`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `user:password@hostname:33061/foo?bar=baz&ssl-mode=REQUIRED&qux=quux`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.true;
        });

        it('uses "false" if the option value is "DISABLED"', () => {
            let connectionString = 'user@hostname?ssl-mode=DISABLED';
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `user:password@hostname:33061?ssl-mode=DISABLED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `user:password@hostname:33061/?ssl-mode=DISABLED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `user:password@hostname:33061?foo=bar&ssl-mode=DISABLED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `user:password@hostname:33061/?foo=bar&ssl-mode=DISABLED`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `user:password@hostname:33061?foo=bar&ssl-mode=DISABLED&baz=qux`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `user:password@hostname:33061/?foo=bar&ssl-mode=DISABLED&baz=qux`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `user:password@hostname:33061/foo?bar=baz&ssl-mode=DISABLED&qux=quux`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            // eslint-disable-next-line no-unused-expressions
            expect(parseUri(connectionString).tls.enabled).to.be.false;

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).tls).to.be.an('object');
            return expect(parseUri(connectionString).tls.enabled).to.be.false;
        });
    });

    context('checking the name of the authentication mechanism', () => {
        it('uses the upper-case version of authentication mechanism name', () => {
            let connectionString = 'user@hostname?auth=foo';
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = 'user@hostname/schema?auth=foo';
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('FOO');

            connectionString = 'user@hostname?foo=bar&auth=baz';
            expect(parseUri(connectionString).auth).to.equal('BAZ');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('BAZ');

            connectionString = 'user@hostname/schema?foo=bar&auth=baz';
            expect(parseUri(connectionString).auth).to.equal('BAZ');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).auth).to.equal('BAZ');
        });
    });

    context('checking the value for the connection timeout', () => {
        it('uses any existing value for the connection timeout', () => {
            let connectionString = 'user@hostname?connect-timeout=30';
            expect(parseUri(connectionString).connectTimeout).to.equal('30');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('30');

            connectionString = 'user@hostname/schema?connect-timeout=30';
            expect(parseUri(connectionString).connectTimeout).to.equal('30');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('30');

            connectionString = 'user@hostname?foo=bar&connect-timeout=30';
            expect(parseUri(connectionString).connectTimeout).to.equal('30');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('30');

            connectionString = 'user@hostname/schema?foo=bar&connect-timeout=30';
            expect(parseUri(connectionString).connectTimeout).to.equal('30');

            connectionString = `mysqlx://${connectionString}`;
            expect(parseUri(connectionString).connectTimeout).to.equal('30');
        });
    });
});
