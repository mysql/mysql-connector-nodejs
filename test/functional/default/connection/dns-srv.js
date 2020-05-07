'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../');
const os = require('os');

context('connecting to the MySQL server using DNS SRV', () => {
    const baseConfig = { host: '_mysqlx._tcp.example.com', port: undefined, resolveSrv: true };

    context('using a configuration object', () => {
        it('fails if the host is not a DNS SRV interface', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { host: config.host, socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${config.host}`));
        });

        it('fails if a port is provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
        });

        it('fails if a UNIX socket path is provided', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints with explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060, priority: 99 }, { host: baseConfig.host, port: 33061, priority: 100 }] });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints without explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060 }, { host: baseConfig.host, port: 33061 }] });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });

        it('fails if an invalid option value is provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { resolveSrv: 'foo' });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('SRV resolution can only be toggled using a boolean value (true or false).'));
        });
    });

    context('using a URI', () => {
        it('fails if the host is not a DNS SRV interface', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { host: config.host, socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${config.host}`));
        });

        it('fails if a port is provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}:${srvConfig.port}`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
        });

        it('fails if a UNIX socket path is provided', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { host: undefined, port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@(${srvConfig.socket})`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints with explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig);
            const hosts = [`${srvConfig.host}:${srvConfig.port + 1}`, `${srvConfig.host}:${srvConfig.port}`];
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints without explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config);
            const hosts = [`(address=${srvConfig.host}:${srvConfig.port}, priority=99), (address=${srvConfig.host}:${srvConfig.port}, priority=100)`];
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });
    });
});
