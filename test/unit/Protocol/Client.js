'use strict';

/* eslint-env node, mocha */

const Client = require('lib/Protocol/Client');
const ClientMessages = require('lib/Protocol/Protobuf/Stubs/mysqlx_pb').ClientMessages;
const EventEmitter = require('events');
const Expect = require('lib/Protocol/Protobuf/Adapters/Expect');
const OkHandler = require('lib/Protocol/ResponseHandlers/OkHandler');
const PassThrough = require('stream').PassThrough;
const Scope = require('lib/Protocol/Protobuf/Stubs/mysqlx_notice_pb').Frame.Scope;
const ServerMessages = require('lib/Protocol/Protobuf/Stubs/mysqlx_pb').ServerMessages;
const SqlResultHandler = require('lib/Protocol/ResponseHandlers/SqlResultHandler');
const WorkQueue = require('lib/WorkQueue');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
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

        it('should set `danglingFragment` to `null`', () => {
            const client = new Client({ on });

            return expect(client._danglingFragment).to.be.null;
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

            const matcher = options => {
                return Object.keys(options).indexOf('crl') === -1 &&
                    options.ciphers === 'foo:bar:!baz' &&
                    options.rejectUnauthorized === false &&
                    options.socket === stream;
            };

            // The custom matcher makes sure the options do not contain `crl: undefined`.
            td.when(connect(td.matchers.argThat(matcher), td.callback())).thenReturn(stream);

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

    context('network fragmentation', () => {
        // stubs
        let clientProto, decodeMessage, decodeMessageHeader, fakeProcess, workQueueProto;
        // dummies
        let message1, message2, rawMessage1, rawMessage2;

        beforeEach('create fakes', () => {
            clientProto = Object.assign({}, Client.prototype);
            workQueueProto = Object.assign({}, WorkQueue.prototype);

            decodeMessage = td.function('decodeMessage');
            decodeMessageHeader = td.function('decodeMessageHeader');
            fakeProcess = td.function('process');

            Client.prototype.decodeMessage = decodeMessage;
            Client.prototype.decodeMessageHeader = decodeMessageHeader;

            WorkQueue.prototype.process = fakeProcess;

            /* eslint-disable node/no-deprecated-api */
            rawMessage1 = new Buffer(8);
            rawMessage1.writeUInt32LE(4);
            rawMessage1.writeUInt8(1, 4);
            rawMessage1.fill('foo', 5);

            rawMessage2 = new Buffer(8);
            rawMessage2.writeUInt32LE(4);
            rawMessage2.writeUInt8(2, 4);
            rawMessage2.fill('bar', 5);

            message1 = { id: 1, payload: new Buffer('foo') };
            message2 = { id: 2, payload: new Buffer('bar') };
            /* eslint-enable node/no-deprecated-api */

            td.when(fakeProcess(), { ignoreExtraArgs: true }).thenReturn();
            td.when(decodeMessage(rawMessage2), { ignoreExtraArgs: true }).thenReturn(message2);
            td.when(decodeMessage(rawMessage1), { ignoreExtraArgs: true }).thenReturn(message1);
        });

        afterEach('reset fakes', () => {
            Client.prototype = clientProto;
            WorkQueue.prototype = workQueueProto;
        });

        it('should handle messages fully-contained in a fragment', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */

            // fragment containing two messages
            const fragment = Buffer.concat([rawMessage1, rawMessage2], rawMessage1.length + rawMessage2.length);

            network.emit('data', fragment);

            expect(td.explain(fakeProcess).callCount).to.equal(2);
            expect(td.explain(fakeProcess).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(fakeProcess).calls[1].args).to.deep.equal([message2]);
        });

        it('should handle message headers split between fragments', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */
            const partialHeader = rawMessage2.slice(0, 2);

            // fragment containing the first message and a partial header of the second message
            const fragment1 = Buffer.concat([rawMessage1, partialHeader], rawMessage1.length + partialHeader.length);
            // fragment containing the remaining content
            const fragment2 = rawMessage2.slice(2);

            network.emit('data', fragment1);
            network.emit('data', fragment2);

            expect(td.explain(fakeProcess).callCount).to.equal(2);
            expect(td.explain(fakeProcess).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(fakeProcess).calls[1].args).to.deep.equal([message2]);
        });

        it('should handle message headers and payloads split between fragments', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */
            const header = rawMessage2.slice(0, 4);

            // fragment containing the first message and the entire header of the second message
            const fragment1 = Buffer.concat([rawMessage1, header], rawMessage1.length + header.length);
            // fragment containing the payload of the second message
            const fragment2 = rawMessage2.slice(4);

            network.emit('data', fragment1);
            network.emit('data', fragment2);

            expect(td.explain(fakeProcess).callCount).to.equal(2);
            expect(td.explain(fakeProcess).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(fakeProcess).calls[1].args).to.deep.equal([message2]);
        });

        it('should handle message payloads split between fragments', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */
            const partialMessage = rawMessage2.slice(0, 6);

            // fragment containing the first message and a partial payload of the second message
            const fragment1 = Buffer.concat([rawMessage1, partialMessage], rawMessage1.length + partialMessage.length);
            // fragment containing the remaining content
            const fragment2 = rawMessage2.slice(6);

            network.emit('data', fragment1);
            network.emit('data', fragment2);

            expect(td.explain(fakeProcess).callCount).to.equal(2);
            expect(td.explain(fakeProcess).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(fakeProcess).calls[1].args).to.deep.equal([message2]);
        });

        it('should handle smaller fragments', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */
            const partialMessage = rawMessage1.slice(2);

            // fragment containing just a partial header of the first message
            const fragment1 = rawMessage1.slice(0, 2);
            // fragment the remaining content
            const fragment2 = Buffer.concat([partialMessage, rawMessage2], partialMessage.length + rawMessage2.length);

            network.emit('data', fragment1);
            network.emit('data', fragment2);

            expect(td.explain(fakeProcess).callCount).to.equal(2);
            expect(td.explain(fakeProcess).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(fakeProcess).calls[1].args).to.deep.equal([message2]);
        });

        it('should handle messages split between more than two fragments', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */

            const fragment1 = rawMessage1.slice(0, 4);
            const fragment2 = rawMessage1.slice(4, 6);
            const fragment3 = rawMessage1.slice(6, 8);

            network.emit('data', fragment1);
            network.emit('data', fragment2);
            network.emit('data', fragment3);

            expect(td.explain(fakeProcess).callCount).to.equal(1);
            expect(td.explain(fakeProcess).calls[0].args).to.deep.equal([message1]);
        });

        it('should handle fragments containing a lot of messages', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */

            /* eslint-disable node/no-deprecated-api */
            let fragment = new Buffer(0);
            /* eslint-enable node/no-deprecated-api */

            // The stack size on Node.js v4 seems to exceed for around 6035 messages of 8 bytes.
            // Let's keep a bit of a margin while making sure the test is fast enough.
            for (let i = 0; i < 7000; ++i) {
                fragment = Buffer.concat([fragment, rawMessage1], fragment.length + rawMessage1.length);
            }

            network.emit('data', fragment);

            expect(td.explain(fakeProcess).callCount).to.equal(7000);
            td.explain(fakeProcess).calls.forEach(call => expect(call.args).to.deep.equal([message1]));
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

    context('cleanup', () => {
        let FakeClient, FakeOkHandler, encodeMessage, network;

        beforeEach('create fakes', () => {
            FakeOkHandler = td.constructor(OkHandler);
            network = new PassThrough();

            td.replace('../../../lib/Protocol/ResponseHandlers/OkHandler', FakeOkHandler);
        });

        afterEach('reset fakes', () => {
            return new Promise(resolve => network.end(resolve));
        });

        context('sessionReset()', () => {
            let authenticate, encodeReset;

            beforeEach('create fakes', () => {
                encodeReset = td.function();

                td.replace('../../../lib/Protocol/Protobuf/Adapters/Session', { encodeReset });

                FakeClient = require('lib/Protocol/Client');
                authenticate = td.replace(FakeClient.prototype, 'authenticate');
                encodeMessage = td.replace(FakeClient.prototype, 'encodeMessage');
            });

            context('in the first call', () => {
                let expectOpen, expectClose;

                beforeEach('create fakes', () => {
                    expectOpen = td.replace(FakeClient.prototype, 'expectOpen');
                    expectClose = td.replace(FakeClient.prototype, 'expectClose');
                });

                context('with new servers', () => {
                    it('sets the expectations, resets the session keeping it open and updates the local state', () => {
                        const client = new FakeClient(network);
                        const expectations = [{
                            condition: Expect.Open.Condition.ConditionOperation.EXPECT_OP_SET,
                            key: Expect.Open.Condition.Key.EXPECT_FIELD_EXIST,
                            value: '6.1'
                        }];

                        td.when(expectOpen(expectations)).thenResolve();
                        td.when(encodeReset({ keepOpen: true })).thenReturn('bar');
                        td.when(encodeMessage(ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                        td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve();
                        td.when(expectClose()).thenResolve();

                        return expect(client.sessionReset()).to.eventually.be.fulfilled
                            .then(() => expect(client._requiresAuthenticationAfterReset).to.equal('NO'));
                    });
                });

                context('with old servers', () => {
                    it('tries to set the server expectations, updates the local state, resets the session and re-authenticates', () => {
                        const client = new FakeClient(network);
                        const expectations = [{
                            condition: Expect.Open.Condition.ConditionOperation.EXPECT_OP_SET,
                            key: Expect.Open.Condition.Key.EXPECT_FIELD_EXIST,
                            value: '6.1'
                        }];
                        const error = new Error();
                        // Error 5168 means the X Plugin does not support prepared statements (fails with the "6.1" expectation)
                        error.info = { code: 5168 };

                        td.replace(client, '_authenticator', 'foo');

                        td.when(expectOpen(expectations)).thenReject(error);
                        td.when(encodeReset({ keepOpen: false })).thenReturn('bar');
                        td.when(encodeMessage(ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                        td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve();
                        td.when(authenticate('foo'), { ignoreExtraArgs: true }).thenResolve('qux');

                        return expect(client.sessionReset()).to.eventually.equal('qux')
                            .then(() => expect(client._requiresAuthenticationAfterReset).to.equal('YES'));
                    });
                });

                it('fails if there is an unexpected error while opening the expectation block', () => {
                    const client = new FakeClient(network);
                    const error = new Error();
                    error.info = { code: -1 };

                    td.when(expectOpen(), { ignoreExtraArgs: true }).thenReject(error);

                    return expect(client.sessionReset()).to.eventually.be.rejectedWith(error);
                });

                it('fails if there is an unexpected error while encoding the Mysqlx.Session.Reset message ', () => {
                    const client = new FakeClient(network);
                    const error = new Error();
                    error.info = { code: -1 };

                    td.when(expectOpen(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(encodeReset(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(encodeMessage(), { ignoreExtraArgs: true }).thenThrow(error);

                    return expect(client.sessionReset()).to.eventually.be.rejectedWith(error);
                });

                it('fails if there is an unexpected error while resetting the connection ', () => {
                    const client = new FakeClient(network);
                    const error = new Error();
                    error.info = { code: -1 };

                    td.when(expectOpen(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(encodeReset(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(encodeMessage(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(FakeOkHandler.prototype.sendMessage(), { ignoreExtraArgs: true }).thenReject(error);

                    return expect(client.sessionReset()).to.eventually.be.rejectedWith(error);
                });

                it('fails if there is an unexpected error while closing the expectation block', () => {
                    const client = new FakeClient(network);
                    const error = new Error();
                    error.info = { code: -1 };

                    td.when(expectOpen(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(encodeReset(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(encodeMessage(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(FakeOkHandler.prototype.sendMessage(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(expectClose()).thenReject(error);

                    return expect(client.sessionReset()).to.eventually.be.rejectedWith(error);
                });
            });

            context('in subsequent calls', () => {
                it('resets the session and keeps it open with new servers in subsequent calls', () => {
                    const client = new FakeClient(network);

                    // should not require re-authentication
                    td.replace(client, '_requiresAuthenticationAfterReset', 'NO');

                    td.when(encodeReset({ keepOpen: true })).thenReturn('bar');
                    td.when(encodeMessage(ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                    td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve('qux');

                    return expect(client.sessionReset()).to.eventually.equal('qux');
                });

                it('resets the session and re-authenticates with older servers in subsequent calls', () => {
                    const client = new FakeClient(network);

                    td.replace(client, '_authenticator', 'foo');
                    // should require re-authentication
                    td.replace(client, '_requiresAuthenticationAfterReset', 'YES');

                    td.when(encodeReset({ keepOpen: false })).thenReturn('bar');
                    td.when(encodeMessage(ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                    td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve();
                    td.when(authenticate('foo')).thenResolve('qux');

                    return expect(client.sessionReset()).to.eventually.equal('qux');
                });
            });
        });

        // needs to be called with session.close()
        context('sessionClose()', () => {
            let encodeClose;

            beforeEach('create fakes', () => {
                encodeClose = td.function();

                td.replace('../../../lib/Protocol/Protobuf/Adapters/Session', { encodeClose });

                FakeClient = require('lib/Protocol/Client');
                encodeMessage = td.replace(FakeClient.prototype, 'encodeMessage');
            });

            it('sends a Mysqlx.Session.Close message to the server', () => {
                const client = new FakeClient(network);

                td.when(encodeClose()).thenReturn('foo');
                td.when(encodeMessage(ClientMessages.Type.SESS_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenResolve('baz');

                return expect(client.sessionClose()).to.eventually.equal('baz');
            });

            it('fails if there is an error while encoding the message', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenThrow(error);

                return expect(client.sessionClose()).to.eventually.be.rejectedWith(error);
            });

            it('fails if there is an error while sending the message to the server', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenReturn('foo');
                td.when(encodeMessage(ClientMessages.Type.SESS_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(), { ignoreExtraArgs: true }).thenReject(error);

                return expect(client.sessionClose()).to.eventually.be.rejectedWith(error);
            });
        });

        // needs to be called with client.close()
        context('connectionClose()', () => {
            let encodeClose;

            beforeEach('create fakes', () => {
                encodeClose = td.function();

                td.replace('../../../lib/Protocol/Protobuf/Adapters/Connection', { encodeClose });

                FakeClient = require('lib/Protocol/Client');
                encodeMessage = td.replace(FakeClient.prototype, 'encodeMessage');
            });

            it('sends a Mysqlx.Connection.Close message to the server', () => {
                const client = new FakeClient(network);
                client.encodeMessage = td.function();

                td.when(encodeClose()).thenReturn('foo');
                td.when(client.encodeMessage(ClientMessages.Type.CON_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenResolve('baz');

                return expect(client.connectionClose()).to.eventually.equal('baz');
            });

            it('fails if there is an error while encoding the message', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenThrow(error);

                return expect(client.connectionClose()).to.eventually.be.rejectedWith(error);
            });

            it('fails if there is an error while sending the message to the server', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenReturn('foo');
                td.when(encodeMessage(ClientMessages.Type.CON_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenReject(error);

                return expect(client.connectionClose()).to.eventually.be.rejectedWith(error);
            });
        });
    });

    // TODO(Rui): this will be part of a different component.
    context('handling notices', () => {
        it('should not process global notices', () => {
            const decodeFrame = td.function();
            const process = td.function();

            td.replace('../../../lib/Protocol/Protobuf/Adapters/Notice', { decodeFrame });
            const Client = require('lib/Protocol/Client');

            const socket = new PassThrough();
            const client = new Client(socket);

            client.decodeMessage = td.function();
            client._workQueue = { process };

            const message = { id: ServerMessages.Type.NOTICE, payload: 'bar' };
            const notice = { scope: Scope.GLOBAL };

            td.when(decodeFrame(message.payload)).thenReturn(notice);
            td.when(client.decodeMessage('foo')).thenReturn(message);

            client.handleServerMessage('foo');

            expect(td.explain(process).callCount).to.equal(0);
        });

        context('empty notices', () => {
            // stubs
            let fakeProcess, workQueueProto;

            beforeEach('create fakes', () => {
                workQueueProto = Object.assign({}, WorkQueue.prototype);

                fakeProcess = td.function('process');

                WorkQueue.prototype.process = fakeProcess;
            });

            afterEach('reset fakes', () => {
                WorkQueue.prototype = workQueueProto;
            });

            it('should ignore empty notices', () => {
                const network = new EventEmitter();
                /* eslint-disable no-unused-vars */
                const client = new Client(network);
                /* eslint-enable no-unused-vars */

                /* eslint-disable node/no-deprecated-api */
                const fragment = new Buffer('010000000b', 'hex');
                /* eslint-enable node/no-deprecated-api */

                network.emit('data', fragment);

                expect(td.explain(fakeProcess).callCount).to.equal(0);
            });
        });
    });

    context('classic protocol', () => {
        it('should fail with an unsupported protocol error', () => {
            const network = new EventEmitter();
            /* eslint-disable no-unused-vars */
            const client = new Client(network);
            /* eslint-enable no-unused-vars */

            /* eslint-disable node/no-deprecated-api */
            const classicServerGreeting = new Buffer('010000000a', 'hex');
            /* eslint-enable node/no-deprecated-api */

            expect(() => network.emit('data', classicServerGreeting)).to.throw(/^The server connection is not using the X Protocol/);
        });
    });
});
