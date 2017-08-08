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

    context('crudFind()', () => {
        it('should encode grouping expressions correctly', () => {
            const client = new Client({ on });
            const expected = { ok: true };
            const grouping = [{
                type: 1,
                identifier: {
                    name: 'foo'
                }
            }, {
                type: 1,
                identifier: {
                    name: 'bar'
                }
            }];
            const message = new Buffer('foobar');
            const encodeMessage = td.function();
            const matcher = td.matchers.argThat(data => isEqual(data.grouping, grouping));

            client.encodeMessage = encodeMessage;

            td.when(encodeMessage(Messages.ClientMessages.CRUD_FIND, matcher)).thenReturn(message);
            td.when(fakeSendMessage(client._workQueue, client._stream, message)).thenResolve(expected);

            return expect(client.crudFind(null, null, null, null, null, null, ['foo', 'bar'])).to.eventually.deep.equal(expected);
        });

        it('shoud encode a specific row locking mode', () => {
            const expected = { ok: true };
            const client = new Client({ on });
            const encodeMessage = td.function();
            const mode = 1;
            const message = new Buffer('foobar');

            client.encodeMessage = encodeMessage;

            td.when(encodeMessage(Messages.ClientMessages.CRUD_FIND, td.matchers.contains({ locking: mode }))).thenReturn(message);
            td.when(fakeSendMessage(client._workQueue, client._stream, message)).thenResolve(expected);

            return expect(client.crudFind(null, null, null, null, null, null, null, null, null, null, null, null, null, null, mode)).to.eventually.deep.equal(expected);
        });

        it('should not encode the default row locking mode', () => {
            const expected = { ok: true };
            const client = new Client({ on });
            const encodeMessage = td.function();
            const mode = 0;
            const message = new Buffer('foobar');

            client.encodeMessage = encodeMessage;

            const matcher = td.matchers.argThat(data => !data.locking);

            td.when(encodeMessage(Messages.ClientMessages.CRUD_FIND, matcher)).thenReturn(message);
            td.when(fakeSendMessage(client._workQueue, client._stream, message)).thenResolve(expected);

            return expect(client.crudFind(null, null, null, null, null, null, null, null, null, null, null, null, null, null, mode)).to.eventually.deep.equal(expected);
        });

        it('should fail if the message cannot be sent', () => {
            const error = new Error('foobar');
            const client = new Client({ on });
            const encodeMessage = td.function();
            const message = new Buffer('foobar');

            client.encodeMessage = encodeMessage;

            td.when(encodeMessage(Messages.ClientMessages.CRUD_FIND, td.matchers.anything())).thenReturn(message);
            td.when(fakeSendMessage(client._workQueue, client._stream, message)).thenReject(error);

            return expect(client.crudFind()).to.eventually.be.rejectedWith(error);
        });
    });

    context('crudInsert()', () => {
        it('should encode field names correctly', () => {
            const expected = { ok: true };
            const client = new Client({ on });
            const columns = ['foo', 'bar'];
            const message = new Buffer('foobar');
            const encodeMessage = td.function();
            const match = td.matchers.argThat(data => isEqual(data.projection, columns));

            client.encodeMessage = encodeMessage;

            td.when(encodeMessage(Messages.ClientMessages.CRUD_INSERT, match)).thenReturn(message);
            td.when(fakeSendMessage(client._workQueue, client._stream, message)).thenResolve(expected);

            return expect(client.crudInsert(null, null, null, { columns, rows: [['baz', 'qux']] })).to.eventually.deep.equal(expected);
        });

        it('should encode row values correctly', () => {
            const expected = { ok: true };
            const client = new Client({ on });
            const message = new Buffer('foobar');
            const encodeMessage = td.function();
            const rows = [{
                field: [{
                    type: 2,
                    literal: {
                        type: 8,
                        v_string: {
                            value: 'foo'
                        }
                    }
                }, {
                    type: 2,
                    literal: {
                        type: 8,
                        v_string: {
                            value: 'bar'
                        }
                    }
                }]
            }];
            const matcher = td.matchers.argThat(data => isEqual(data.row, rows));

            client.encodeMessage = encodeMessage;

            td.when(encodeMessage(Messages.ClientMessages.CRUD_INSERT, matcher)).thenReturn(message);
            td.when(fakeSendMessage(client._workQueue, client._stream, message)).thenResolve(expected);

            return expect(client.crudInsert(null, null, null, { rows: [['foo', 'bar']] })).to.eventually.deep.equal(expected);
        });

        it('should fail if the message cannot be sent', () => {
            const client = new Client({ on });
            const error = new Error('foo');
            const encodeMessage = td.function();

            client.encodeMessage = encodeMessage;

            td.when(encodeMessage(), { ignoreExtraArgs: true }).thenReturn();
            td.when(fakeSendMessage(), { ignoreExtraArgs: true }).thenReject(error);

            return expect(client.crudInsert(null, null, null, { rows: [['foo', 'bar']] })).to.eventually.be.rejectedWith(error);
        });
    });
});
