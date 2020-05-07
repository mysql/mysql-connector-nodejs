'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../');
const os = require('os');

describe('connecting to the MySQL server using a UNIX socket', () => {
    const baseConfig = { host: undefined, port: undefined, schema: undefined };

    context('when the socket path points to an existing local socket', () => {
        it('succeeds using a configuration object', function () {
            const socketConfig = Object.assign({}, config, baseConfig);

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const expected = { host: undefined, port: undefined, socket: socketConfig.socket, ssl: false };

            return mysqlx.getSession(socketConfig)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);
                    return session.close();
                });
        });

        it('succeeds using the custom notation for the socket path in the URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig);

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})`;
            const expected = { host: undefined, port: undefined, socket: socketConfig.socket, ssl: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);
                    return session.close();
                });
        });

        it('succeeds using the percent encoded notation for the socket path in the URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig);

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@${encodeURIComponent(socketConfig.socket)}`;
            const expected = { host: undefined, port: undefined, socket: socketConfig.socket, ssl: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);
                    return session.close();
                });
        });

        it('ignores tls options provided with a configuration file', function () {
            const socketConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } });

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const expected = { host: undefined, port: undefined, schema: undefined, socket: socketConfig.socket, ssl: false };

            return mysqlx.getSession(socketConfig)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);

                    return session.close();
                });
        });

        it('ignores tls options provided using custom notation in a URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } });

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=REQUIRED&ssl-ca=(${socketConfig.tls.ca})?ssl-crl=(${socketConfig.tls.ca})`;
            const expected = { host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);

                    return session.close();
                });
        });

        it('ignores tls options provided using percent encoded notation in a URI', function () {
            const socketConfig = Object.assign({}, config, baseConfig, { tls: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } });

            if (!socketConfig.socket || os.platform() === 'win32') {
                return this.skip();
            }

            const uri = `mysqlx://${socketConfig.user}:${socketConfig.password}@(${socketConfig.socket})?ssl-mode=REQUIRED&ssl-ca=${encodeURIComponent(socketConfig.tls.ca)}?ssl-crl=${encodeURIComponent(socketConfig.tls.ca)}`;
            const expected = { host: undefined, port: undefined, schema: undefined, socket: config.socket, ssl: false };

            return mysqlx.getSession(uri)
                .then(session => {
                    expect(session.inspect()).to.deep.include(expected);

                    return session.close();
                });
        });
    });
});
