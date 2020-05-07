'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const crypto = require('crypto');
const expect = require('chai').expect;
const mysqlx = require('../../../../');

describe('connecting with a list of MySQL servers', () => {
    const baseConfig = { host: undefined, port: undefined, schema: undefined, socket: undefined };

    context('with pseudorandom-based selection', () => {
        it('succeeds to connect to the first available server', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, port: config.port }, { host: config.host, port: config.port }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `${e.host}:${e.port}`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect().host).to.deep.equal(config.host);
                    return session.close();
                });
        });

        it('fails if there is no server available', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: `${config.host}-${crypto.randomBytes(4).toString('hex')}` }, { host: `${config.host}-${crypto.randomBytes(4).toString('hex')}` }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => e.host).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('Unable to connect to any of the target hosts.');
                });
        });
    });

    context('with priority-based selection', () => {
        it('succeeds to connect to the first available server', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, port: config.port, priority: 99 }, { host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, port: config.port, priority: 98 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}:${e.port}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect().host).to.deep.equal(config.host);
                    return session.close();
                });
        });

        it('fails if there is no server available', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, priority: 99 }, { host: `${config.host}-${crypto.randomBytes(4).toString('hex')}`, priority: 98 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('Unable to connect to any of the target hosts.');
                });
        });

        it('fails if some hosts have priority and others do not', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, priority: 99 }, { host: config.host }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => !e.priority ? `(address=${e.host})` : `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('You must either assign no priority to any of the routers or give a priority for every router');
                    expect(err.errno).to.equal(4000);
                });
        });

        it('fails to connect to the server if any address priority is out of bounds', () => {
            const failoverConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: config.host, priority: 100 }, { host: config.host, priority: 101 }] });
            const uri = `mysqlx://${failoverConfig.user}:${failoverConfig.password}@[${failoverConfig.endpoints.map(e => `(address=${e.host}, priority=${e.priority})`).join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal('The priorities must be between 0 and 100');
                    expect(err.errno).to.equal(4007);
                });
        });
    });
});
