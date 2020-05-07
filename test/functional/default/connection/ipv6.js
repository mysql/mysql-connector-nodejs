'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../..');

describe('connecting to the MySQL server using IPv6', () => {
    let host;

    const baseConfig = { schema: undefined, socket: undefined };

    beforeEach('resolve IPv6 address', () => {
        return fixtures.getIPv6Address(config.host)
            .then(address => {
                host = address;
            });
    });

    it('succeeds using a configuration object when the host has IPV6 support', function () {
        const ipv6Config = Object.assign({}, config, baseConfig, { host });

        if (!ipv6Config.host) {
            return this.skip();
        }

        return mysqlx.getSession(ipv6Config)
            .then(session => {
                expect(session.inspect().host).to.equal(host);
                return session.close();
            });
    });

    it('succeeds using a URI when the host has IPV6 support', function () {
        const ipv6Config = Object.assign({}, config, baseConfig, { host });

        if (!ipv6Config.host) {
            return this.skip();
        }

        return mysqlx.getSession(`mysqlx://${ipv6Config.user}:${ipv6Config.password}@[${ipv6Config.host}]:${ipv6Config.port}`)
            .then(session => {
                expect(session.inspect().host).to.equal(host);
                return session.close();
            });
    });
});
