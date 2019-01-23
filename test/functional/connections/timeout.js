'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const mysqlx = require('index');
const net = require('net');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional connect timeout', () => {
    let fakeServer1, port1;

    beforeEach('start fake server', () => {
        port1 = process.env.NODE_TEST_MYSQL_UNUSED_PORT || 33081;

        return new Promise((resolve, reject) => {
            fakeServer1 = net.createServer();
            fakeServer1.on('connection', socket => socket.pause());
            fakeServer1.on('error', reject);
            fakeServer1.listen(port1, resolve);
        });
    });

    afterEach('close fake server', (done) => {
        fakeServer1.close(done);
        fakeServer1.emit('close');
    });

    context('configuration object', () => {
        it('should fail if the connection timeout is not valid', () => {
            const validConfig = Object.assign({}, config, { connectTimeout: -1, port: port1, ssl: false, socket: undefined });
            const error = 'The connection timeout value must be a positive integer (including 0).';

            return expect(mysqlx.getSession(validConfig)).to.be.rejectedWith(error);
        });

        it('should fail if the connection timeout is exceeded', () => {
            const validConfig = Object.assign({}, config, { connectTimeout: 100, port: port1, ssl: false, socket: undefined });
            const error = `Connection attempt to the server was aborted. Timeout of ${validConfig.connectTimeout} ms was exceeded.`;

            return expect(mysqlx.getSession(validConfig)).to.be.rejectedWith(error);
        });
    });

    context('connection string', () => {
        it('should fail if the connection timeout is not valid', () => {
            const validConfig = Object.assign({}, config, { connectTimeout: -1 });
            const uri = `mysqlx://${validConfig.user}:${validConfig.password}@${validConfig.host}?connect-timeout=${validConfig.connectTimeout}`;
            const error = 'The connection timeout value must be a positive integer (including 0).';

            return expect(mysqlx.getSession(uri)).to.be.rejectedWith(error);
        });

        context('single-host setting', () => {
            it('should fail if the connection timeout is exceeded', () => {
                const validConfig = Object.assign({}, config, { connectTimeout: 100, port: port1 });
                const uri = `mysqlx://${validConfig.user}:${validConfig.password}@${validConfig.host}:${validConfig.port}?ssl-mode=DISABLED&connect-timeout=${validConfig.connectTimeout}`;
                const error = `Connection attempt to the server was aborted. Timeout of ${validConfig.connectTimeout} ms was exceeded.`;

                return expect(mysqlx.getSession(uri)).to.be.rejectedWith(error);
            });
        });

        context('multi-host setting', () => {
            let fakeServer2, port2;

            beforeEach('create additional fake server', () => {
                port2 = process.env.NODE_TEST_MYSQL_UNUSED_EXTRA_PORT || 33082;

                return new Promise((resolve, reject) => {
                    fakeServer2 = net.createServer();
                    fakeServer2.on('connection', socket => socket.pause());
                    fakeServer2.on('error', reject);
                    fakeServer2.listen(port2, resolve);
                });
            });

            afterEach('close fake server', (done) => {
                fakeServer2.close(done);
                fakeServer2.emit('close');
            });

            it('should fail if the connection timeout is exceeded', () => {
                const validConfig = Object.assign({}, config, { connectTimeout: 100 });
                const uri = `mysqlx://${validConfig.user}:${validConfig.password}@[${validConfig.host}:${port1},${validConfig.host}:${port2}]?ssl-mode=DISABLED&connect-timeout=${validConfig.connectTimeout}`;
                const error = `All server connection attempts were aborted. Timeout of ${validConfig.connectTimeout} ms was exceeded for each selected server.`;

                return expect(mysqlx.getSession(uri)).to.be.rejectedWith(error);
            });
        });
    });
});
