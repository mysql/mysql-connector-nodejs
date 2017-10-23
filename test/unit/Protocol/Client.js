'use strict';

/* eslint-env node, mocha */
/* global Messages */

const Client = require('lib/Protocol/Client');
const WorkQueue = require('lib/WorkQueue');
const SqlResultHandler = require('lib/Protocol/ResponseHandler').SqlResultHandler;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const isEqual = require('lodash.isequal');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Client', () => {
    let on, sendMessage, fakeSendMessage;

    beforeEach('create fakes', () => {
        on = td.function();
        fakeSendMessage = td.function();

        sendMessage = SqlResultHandler.prototype.sendMessage;
        SqlResultHandler.prototype.sendMessage = fakeSendMessage;
    });

    afterEach('reset fakes', () => {
        SqlResultHandler.prototype.sendMessage = sendMessage;
        td.reset();
    });

    context('constructor', () => {
        it('should save the provided stream as an instance variable', () => {
            const stream = { on, foo: 'bar' };
            const client = new Client(stream);

            return expect(client._stream).to.equal(stream);
        });

        it('should create a `WorkQueue` instance', () => {
            const client = new Client({ on });

            return expect(client._workQueue).to.be.an.instanceof(WorkQueue);
        });

        it('should disable the `danglingFragment` option by default', () => {
            const client = new Client({ on });

            return expect(client._danglingFragment).to.be.false;
        });

        it('should register a `data` event listener for the provided stream', () => {
            const stream = { on };
            const handleNetworkFragment = td.function();

            td.when(on('data')).thenCallback('foo');
            td.when(handleNetworkFragment('foo')).thenReturn();

            Client.call({ handleNetworkFragment }, stream);

            return expect(td.explain(handleNetworkFragment).callCount).to.equal(1);
        });

        it('should register a `close` event listener for the provided stream', () => {
            const stream = { on };
            const handleServerClose = td.function();

            td.when(on('close')).thenCallback();
            td.when(handleServerClose('foo')).thenReturn();

            Client.call({ handleServerClose }, stream);

            return expect(td.explain(handleServerClose).callCount).to.equal(1);
        });
    });

    context('enableSSL()', () => {
        let FakeClient, connect, getServerCipherSuite, parseX509Bundle, readFile;

        beforeEach('create fakes', () => {
            connect = td.function();
            readFile = td.function();
            getServerCipherSuite = td.function();
            parseX509Bundle = td.function();

            FakeClient = proxyquire('lib/Protocol/Client', {
                './Util/parseX509Bundle': parseX509Bundle,
                './Util/getServerCipherSuite': getServerCipherSuite,
                '../Adapters/fs': { readFile },
                tls: { connect }
            });
        });

        it('should enable TLS in the connection socket', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(client.capabilitiesSet({ tls: true })).thenResolve();
            td.when(connect(td.matchers.contains({ rejectUnauthorized: false, socket: stream }), td.callback())).thenReturn(stream);

            return expect(client.enableSSL({})).to.eventually.be.true;
        });

        it('should use the server cipher suite by default', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(getServerCipherSuite()).thenReturn('foo:bar:!baz');
            td.when(client.capabilitiesSet({ tls: true })).thenResolve();
            td.when(connect({ ciphers: 'foo:bar:!baz', rejectUnauthorized: false, socket: stream }, td.callback())).thenReturn(stream);

            return expect(client.enableSSL({})).to.eventually.be.true;
        });

        // TODO(Rui): this will change for a future milestone.
        it('should use the server cipher suite even if a custom one is provided', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(getServerCipherSuite()).thenReturn('foo:bar:!baz');
            td.when(client.capabilitiesSet({ tls: true })).thenResolve();
            td.when(connect({ ciphers: 'foo:bar:!baz', rejectUnauthorized: false, socket: stream }, td.callback())).thenReturn(stream);

            return expect(client.enableSSL({ ciphers: 'qux:!quux' })).to.eventually.be.true;
        });

        it('should enable server certificate authority validation if requested', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(readFile('foobar', 'ascii')).thenResolve('--base64Giberish--');
            td.when(parseX509Bundle('--base64Giberish--')).thenReturn(['foo']);
            td.when(client.capabilitiesSet({ tls: true })).thenResolve();
            td.when(connect(td.matchers.contains({ ca: ['foo'], rejectUnauthorized: true, socket: stream }), td.callback())).thenReturn(stream);

            return expect(client.enableSSL({ ca: 'foobar' })).to.eventually.be.true;
        });

        it('should enable server certificate revocation validation if requested', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(readFile('foobar', 'ascii')).thenResolve('--base64Giberish--');
            td.when(readFile('bazqux', 'ascii')).thenResolve('foo');
            td.when(parseX509Bundle('--base64Giberish--')).thenReturn(['bar']);
            td.when(client.capabilitiesSet({ tls: true })).thenResolve();
            td.when(connect(td.matchers.contains({ ca: ['bar'], crl: 'foo', rejectUnauthorized: true, socket: stream }), td.callback())).thenReturn(stream);

            return expect(client.enableSSL({ ca: 'foobar', crl: 'bazqux' })).to.eventually.be.true;
        });

        // TODO(Rui): evaluate this approach. Should this not fail if no CA is provided?
        it('should not enable server certificate revocation validation if no CA certificate is provided', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(getServerCipherSuite()).thenReturn('foo:bar:!baz');
            td.when(client.capabilitiesSet({ tls: true })).thenResolve();

            const expected = {
                ciphers: 'foo:bar:!baz',
                rejectUnauthorized: false,
                socket: stream
            };

            // The custom matcher makes sure the options do not contain `crl: undefined`.
            td.when(connect(td.matchers.argThat(options => isEqual(options, expected)), td.callback())).thenReturn(stream);

            return expect(client.enableSSL({ crl: 'foobar' })).to.eventually.be.true;
        });

        it('should fail for empty CA path', () => {
            const client = new Client({ on });

            return expect(client.enableSSL({ ca: '' })).to.be.eventually.rejectedWith('CA value must not be empty string');
        });

        it('should fail for empty CRL path', () => {
            const client = new Client({ on });

            return expect(client.enableSSL({ crl: '' })).to.be.eventually.rejectedWith('CRL value must not be empty string');
        });

        it('should fail with a specific error if the server\'s X plugin version does not support SSL', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            const error = new Error();
            error.info = { code: 5001 };

            client.capabilitiesSet = td.function();

            td.when(client.capabilitiesSet({ tls: true })).thenReject(error);

            return expect(client.enableSSL({})).to.eventually.be.rejectedWith('The server\'s X plugin version does not support SSL');
        });

        it('should fail with any other error thrown when setting capabilities', () => {
            const stream = { on };
            const client = new FakeClient(stream);
            const error = new Error('foobar');

            client.capabilitiesSet = td.function();

            td.when(client.capabilitiesSet({ tls: true })).thenReject(error);

            return expect(client.enableSSL({})).to.eventually.be.rejectedWith(error);
        });
    });

    // TODO(Rui): add tests when the remaining Client interface is refactored.
    context('CRUD message encoding', () => {
        context('crudInsert', () => {
            it('should send an encoded message to the server');
            it('should fail if the message cannot be encoded');
            it('should fail if an unexpected error occurs');
        });

        context('crudFind()', () => {
            it('should send an encoded message to the server');
            it('should fail if the message cannot be encoded');
            it('should fail if an unexpected error occurs');
        });

        context('crudDelete', () => {
            it('should send an encoded message to the server');
            it('should fail if the message cannot be encoded');
            it('should fail if an unexpected error occurs');
        });

        context('crudUpdate', () => {
            it('should send an encoded message to the server');
            it('should fail if the message cannot be encoded');
            it('should fail if an unexpected error occurs');
        });
    });
});
