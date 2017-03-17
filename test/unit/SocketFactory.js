'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('SocketFactory', () => {
    let SocketFactory, createConnection, on;

    beforeEach(() => {
        createConnection = td.function();
        on = td.function();

        SocketFactory = proxyquire('lib/SocketFactory', {
            net: { createConnection }
        });
    });

    afterEach(() => {
        td.reset();
    });

    context('createSocket', () => {
        it('should create a socket using a path for a local file descriptor', () => {
            const factory = new SocketFactory();
            const socket = { on };

            td.when(on('connect')).thenCallback();
            td.when(createConnection({ path: '/path/to/socket' })).thenReturn(socket);

            return expect(factory.createSocket({ socket: '/path/to/socket' })).to.be.fulfilled.then(result => {
                expect(result).to.deep.equal(socket);
            });
        });

        it('should create a socket for a local or remote address', () => {
            const factory = new SocketFactory();
            const socket = { on };

            td.when(on('connect')).thenCallback();
            td.when(createConnection({ host: 'foo', port: 'bar' })).thenReturn(socket);

            return expect(factory.createSocket({ host: 'foo', port: 'bar' })).to.be.fulfilled.then(result => {
                expect(result).to.deep.equal(socket);
            });
        });

        it('should handle socket errors', () => {
            const factory = new SocketFactory();
            const socket = { on };
            const error = new Error('foobar');

            td.when(on('error')).thenCallback(error);
            td.when(createConnection(), { ignoreExtraArgs: true }).thenReturn(socket);

            return expect(factory.createSocket({ socket: '/path/to/socket' })).to.be.rejectedWith(error);
        });
    });
});
