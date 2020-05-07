'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../');
const net = require('net');
const os = require('os');
const path = require('path');

describe('connecting to unavailable servers with a timeout', () => {
    context('when the timeout value is not valid', () => {
        const baseConfig = { schema: undefined, socket: undefined };

        it('fails using a configuration object', () => {
            const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: -1 });
            const error = 'The connection timeout value must be a positive integer (including 0).';

            return mysqlx.getSession(timeoutConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });

        it('fails using a URI', () => {
            const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: -1 });
            const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@(${timeoutConfig.socket})?connect-timeout=${timeoutConfig.connectTimeout}`;
            const error = 'The connection timeout value must be a positive integer (including 0).';

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });
    });

    context('when the timeout is not exceeded', () => {
        const baseConfig = { schema: undefined, socket: undefined };

        it('disables the timeout for subsequent activity', () => {
            const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100 });

            return mysqlx.getSession(timeoutConfig)
                .then(session => {
                    return new Promise(resolve => setTimeout(() => resolve(session), timeoutConfig.connectTimeout * 2))
                        .then(() => session.sql('SELECT 1'))
                        .then(() => session.close());
                });
        });
    });

    context('when the timeout value is exceeded', () => {
        // The dummy TCP server is created in the host where the tests are running.
        const baseConfig = { host: 'localhost', schema: undefined, socket: undefined };

        context('with a single target host', () => {
            let server;

            beforeEach('create fake server', () => {
                server = net.createServer();

                server.on('connection', socket => {
                    server.on('close', () => socket.destroy());
                    socket.pause();
                });
            });

            afterEach('close fake server', done => {
                server.emit('close');
                server.close(done);
            });

            context('using a UNIX socket', () => {
                const socket = path.join(os.tmpdir(), 'dummy.sock');

                beforeEach('start fake server', function (done) {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    server.listen(socket, done).on('error', done);
                });

                it('fails using a configuration object', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, socket });
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });

                it('fails using a URI', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, socket });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@(${timeoutConfig.socket})?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });
            });

            context('using TCP', () => {
                let port;

                beforeEach('start fake server', done => {
                    server.listen(0, () => {
                        port = server.address().port;
                        return done();
                    });
                });

                it('fails using a configuration object', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, port });
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });

                it('fails using a URI', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, port });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@${timeoutConfig.host}:${timeoutConfig.port}?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `Connection attempt to the server was aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded.`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });
            });
        });

        context('with multiple target hosts', () => {
            let primary, secondary;

            beforeEach('create fake servers', () => {
                primary = net.createServer();
                secondary = net.createServer();

                [primary, secondary].forEach(server => {
                    server.on('connection', socket => {
                        primary.on('close', () => socket.destroy());
                        socket.pause();
                    });
                });
            });

            afterEach('close fake servers', done => {
                [primary, secondary].forEach(server => {
                    server.emit('close');
                });

                secondary.close(err => {
                    if (err) {
                        return done(err);
                    }

                    return primary.close(done);
                });
            });

            context('using a UNIX socket', () => {
                const primarysocket = path.join(os.tmpdir(), 'dummy-primary.sock');
                const secondarySocket = path.join(os.tmpdir(), 'dummy-secondary.sock');

                beforeEach('start fake server', function (done) {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    primary.listen(primarysocket, () => secondary.listen(secondarySocket, done));
                });

                it('fails using a configuration object', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, endpoints: [{ socket: primarysocket }, { socket: secondarySocket }] });
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });

                it('fails using a URI', function () {
                    if (os.platform() === 'win32') {
                        return this.skip();
                    }

                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, endpoints: [{ socket: primarysocket }, { socket: secondarySocket }] });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@[${timeoutConfig.endpoints.map(e => encodeURIComponent(e.socket)).join(',')}]?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });
            });

            context('using TCP', () => {
                let primaryPort, secondaryPort;

                beforeEach('start fake server', done => {
                    primary.listen(0, () => {
                        primaryPort = primary.address().port;
                        secondary.listen(0, () => {
                            secondaryPort = secondary.address().port;
                            return done();
                        });
                    });
                });

                it('fails using a configuration object', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, endpoints: [{ port: primaryPort }, { port: secondaryPort }] });
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;

                    return mysqlx.getSession(timeoutConfig)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });

                it('fails using a URI', () => {
                    const timeoutConfig = Object.assign({}, config, baseConfig, { connectTimeout: 100, endpoints: [{ host: baseConfig.host, port: primaryPort }, { host: baseConfig.host, port: secondaryPort }] });
                    const uri = `mysqlx://${timeoutConfig.user}:${timeoutConfig.password}@[${timeoutConfig.endpoints.map(e => `${e.host}:${e.port}`).join(',')}]?connect-timeout=${timeoutConfig.connectTimeout}`;
                    const error = `All server connection attempts were aborted. Timeout of ${timeoutConfig.connectTimeout} ms was exceeded for each selected server.`;

                    return mysqlx.getSession(uri)
                        .then(() => expect.fail())
                        .catch(err => expect(err.message).to.equal(error));
                });
            });
        });
    });
});
