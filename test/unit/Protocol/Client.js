'use strict';

/* eslint-env node, mocha */

const Client = require('../../../lib/Protocol/Client');
const ClientMessages = require('../../../lib/Protocol/Protobuf/Stubs/mysqlx_pb').ClientMessages;
const EventEmitter = require('events');
const Expect = require('../../../lib/Protocol/Protobuf/Adapters/Expect');
const OkHandler = require('../../../lib/Protocol/ResponseHandlers/OkHandler');
const PassThrough = require('stream').PassThrough;
const Scope = require('../../../lib/Protocol/Protobuf/Stubs/mysqlx_notice_pb').Frame.Scope;
const ServerMessages = require('../../../lib/Protocol/Protobuf/Stubs/mysqlx_pb').ServerMessages;
const WorkQueue = require('../../../lib/WorkQueue');
const expect = require('chai').expect;
const td = require('testdouble');

describe('Client', () => {
    let on;

    beforeEach('create fakes', () => {
        on = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('constructor', () => {
        it('saves the provided stream as an instance variable', () => {
            const stream = { on, foo: 'bar' };
            const client = new Client(stream);

            return expect(client._stream).to.equal(stream);
        });

        it('creates a `WorkQueue` instance', () => {
            const client = new Client({ on });

            return expect(client._workQueue).to.be.an.instanceof(WorkQueue);
        });

        it('sets `danglingFragment` to `null`', () => {
            const client = new Client({ on });

            return expect(client._danglingFragment).to.be.null;
        });

        it('registers a `data` event listener for the provided stream', () => {
            const stream = { on };
            const handleNetworkFragment = td.function();

            td.when(on('data')).thenCallback('foo');
            td.when(handleNetworkFragment('foo')).thenReturn();

            Client.call({ handleNetworkFragment }, stream);

            return expect(td.explain(handleNetworkFragment).callCount).to.equal(1);
        });

        it('registers a `close` event listener for the provided stream', () => {
            const stream = { on };
            const handleServerClose = td.function();

            td.when(on('close')).thenCallback();
            td.when(handleServerClose('foo')).thenReturn();

            Client.call({ handleServerClose }, stream);

            return expect(td.explain(handleServerClose).callCount).to.equal(1);
        });
    });

    context('enableTLS', () => {
        let FakeClient, capabilitiesSet, handleNetworkFragment, handleServerClose, socket, tls;

        beforeEach('create fakes', () => {
            socket = new PassThrough();

            tls = td.replace('../../../lib/Protocol/Security/tls');

            FakeClient = require('../../../lib/Protocol/Client');
            capabilitiesSet = td.replace(FakeClient.prototype, 'capabilitiesSet');
            handleNetworkFragment = td.replace(FakeClient.prototype, 'handleNetworkFragment');
            handleServerClose = td.replace(FakeClient.prototype, 'handleServerClose');
        });

        it('fails if the server does not support TLS', () => {
            const client = new FakeClient(socket);
            const error = new Error();
            error.info = { code: 5001 };

            td.when(capabilitiesSet({ tls: true })).thenReject(error);

            return client.enableTLS()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('The X Plugin version installed in the server does not support TLS. Check https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.'));
        });

        it('fails if there is an unexpected error while setting the capabilities in the server', () => {
            const client = new FakeClient(socket);
            const error = new Error('foobar');

            td.when(capabilitiesSet({ tls: true })).thenReject(error);

            return client.enableTLS()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if there is an error while creating the security context', () => {
            const config = { foo: 'bar' };
            const baseContext = Object.assign({}, config, { socket });
            const client = new FakeClient(socket);
            const error = new Error('foobar');

            td.when(capabilitiesSet({ tls: true })).thenResolve();
            td.when(tls.createCustomSecurityContext(baseContext)).thenReject(error);

            return client.enableTLS(config)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if there is an error while creating the secure channel', () => {
            const config = { foo: 'bar' };
            const baseContext = Object.assign({}, config, { socket });
            const secureContext = { baz: 'qux' };
            const client = new FakeClient(socket);
            const error = new Error('foobar');

            td.when(capabilitiesSet({ tls: true })).thenResolve();
            td.when(tls.createCustomSecurityContext(baseContext)).thenResolve(secureContext);
            td.when(tls.createSecureChannel(secureContext)).thenReject(error);

            return client.enableTLS(config)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('adds an event listener for incoming data in the secure socket', () => {
            const config = { foo: 'bar' };
            const baseContext = Object.assign({}, config, { socket });
            const secureContext = { baz: 'qux' };
            const client = new FakeClient(socket);
            const secureSocket = new PassThrough();

            td.when(capabilitiesSet({ tls: true })).thenResolve();
            td.when(tls.createCustomSecurityContext(baseContext)).thenResolve(secureContext);
            td.when(tls.createSecureChannel(secureContext)).thenResolve(secureSocket);

            return client.enableTLS(config)
                .then(() => {
                    secureSocket.emit('data', 'quux');
                    expect(td.explain(handleNetworkFragment).callCount).to.equal(1);
                    expect(td.explain(handleNetworkFragment).calls[0].args[0]).to.equal('quux');
                });
        });

        it('adds an event listener for errors in the secure socket', () => {
            const session = { _isOpen: true, _isValid: true };
            const config = { foo: 'bar' };
            const baseContext = Object.assign({}, config, { socket });
            const secureContext = { baz: 'qux' };
            const client = new FakeClient(socket, session);
            const secureSocket = new PassThrough();

            td.when(capabilitiesSet({ tls: true })).thenResolve();
            td.when(tls.createCustomSecurityContext(baseContext)).thenResolve(secureContext);
            td.when(tls.createSecureChannel(secureContext)).thenResolve(secureSocket);

            return client.enableTLS(config)
                .then(() => {
                    secureSocket.emit('error');
                    // eslint-disable-next-line no-unused-expressions
                    expect(session._isOpen).to.be.false;
                    return expect(session._isValid).to.be.false;
                });
        });

        it('adds an event listener for cleanup when the socket finishes receiving data', () => {
            const session = { _isOpen: true, _isValid: true };
            const config = { foo: 'bar' };
            const baseContext = Object.assign({}, config, { socket });
            const secureContext = { baz: 'qux' };
            const client = new FakeClient(socket, session);
            const secureSocket = new PassThrough();

            td.when(capabilitiesSet({ tls: true })).thenResolve();
            td.when(tls.createCustomSecurityContext(baseContext)).thenResolve(secureContext);
            td.when(tls.createSecureChannel(secureContext)).thenResolve(secureSocket);

            return client.enableTLS(config)
                .then(() => {
                    secureSocket.emit('end');
                    // eslint-disable-next-line no-unused-expressions
                    expect(session._isOpen).to.be.false;
                    return expect(session._isValid).to.be.false;
                });
        });

        it('adds an event listener for cleanup when the socket is closed', () => {
            const session = { _isOpen: true, _isValid: true };
            const config = { foo: 'bar' };
            const baseContext = Object.assign({}, config, { socket });
            const secureContext = { baz: 'qux' };
            const client = new FakeClient(socket, session);
            const secureSocket = new PassThrough();

            td.when(capabilitiesSet({ tls: true })).thenResolve();
            td.when(tls.createCustomSecurityContext(baseContext)).thenResolve(secureContext);
            td.when(tls.createSecureChannel(secureContext)).thenResolve(secureSocket);

            return client.enableTLS(config)
                .then(() => {
                    secureSocket.emit('close');
                    expect(td.explain(handleServerClose).callCount).to.equal(1);
                });
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

        it('handles messages fully-contained in a fragment', () => {
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

        it('handles message headers split between fragments', () => {
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

        it('handles message headers and payloads split between fragments', () => {
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

        it('handles message payloads split between fragments', () => {
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

        it('handles smaller fragments', () => {
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

        it('handles messages split between more than two fragments', () => {
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

        it('handles fragments containing a lot of messages', () => {
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
            it('sends an encoded message to the server');
            it('fails if the message cannot be encoded');
            it('fails if an unexpected error occurs');
        });

        context('crudFind()', () => {
            it('sends an encoded message to the server');
            it('fails if the message cannot be encoded');
            it('fails if an unexpected error occurs');
        });

        context('crudDelete', () => {
            it('sends an encoded message to the server');
            it('fails if the message cannot be encoded');
            it('fails if an unexpected error occurs');
        });

        context('crudUpdate', () => {
            it('sends an encoded message to the server');
            it('fails if the message cannot be encoded');
            it('fails if an unexpected error occurs');
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

                FakeClient = require('../../../lib/Protocol/Client');
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

                        return client.sessionReset()
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

                        return client.sessionReset()
                            .then(actual => {
                                expect(actual).to.equal('qux');
                                expect(client._requiresAuthenticationAfterReset).to.equal('YES');
                            });
                    });
                });

                it('fails if there is an unexpected error while opening the expectation block', () => {
                    const client = new FakeClient(network);
                    const error = new Error();
                    error.info = { code: -1 };

                    td.when(expectOpen(), { ignoreExtraArgs: true }).thenReject(error);

                    return client.sessionReset()
                        .then(() => expect.fail())
                        .catch(err => expect(err).to.deep.equal(error));
                });

                it('fails if there is an unexpected error while encoding the Mysqlx.Session.Reset message ', () => {
                    const client = new FakeClient(network);
                    const error = new Error();
                    error.info = { code: -1 };

                    td.when(expectOpen(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(encodeReset(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(encodeMessage(), { ignoreExtraArgs: true }).thenThrow(error);

                    return client.sessionReset()
                        .then(() => expect.fail())
                        .catch(err => expect(err).to.deep.equal(error));
                });

                it('fails if there is an unexpected error while resetting the connection ', () => {
                    const client = new FakeClient(network);
                    const error = new Error();
                    error.info = { code: -1 };

                    td.when(expectOpen(), { ignoreExtraArgs: true }).thenResolve();
                    td.when(encodeReset(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(encodeMessage(), { ignoreExtraArgs: true }).thenReturn();
                    td.when(FakeOkHandler.prototype.sendMessage(), { ignoreExtraArgs: true }).thenReject(error);

                    return client.sessionReset()
                        .then(() => expect.fail())
                        .catch(err => expect(err).to.deep.equal(error));
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

                    return client.sessionReset()
                        .then(() => expect.fail())
                        .catch(err => expect(err).to.deep.equal(error));
                });
            });

            context('in subsequent calls', () => {
                it('resets the session and keeps it open with new servers in subsequent calls', () => {
                    const client = new FakeClient(network);

                    // does not require re-authentication
                    td.replace(client, '_requiresAuthenticationAfterReset', 'NO');

                    td.when(encodeReset({ keepOpen: true })).thenReturn('bar');
                    td.when(encodeMessage(ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                    td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve('qux');

                    return client.sessionReset()
                        .then(actual => expect(actual).to.equal('qux'));
                });

                it('resets the session and re-authenticates with older servers in subsequent calls', () => {
                    const client = new FakeClient(network);

                    td.replace(client, '_authenticator', 'foo');
                    // requires re-authentication
                    td.replace(client, '_requiresAuthenticationAfterReset', 'YES');

                    td.when(encodeReset({ keepOpen: false })).thenReturn('bar');
                    td.when(encodeMessage(ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                    td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve();
                    td.when(authenticate('foo')).thenResolve('qux');

                    return client.sessionReset()
                        .then(actual => expect(actual).to.equal('qux'));
                });
            });
        });

        // needs to be called with session.close()
        context('sessionClose()', () => {
            let encodeClose;

            beforeEach('create fakes', () => {
                encodeClose = td.function();

                td.replace('../../../lib/Protocol/Protobuf/Adapters/Session', { encodeClose });

                FakeClient = require('../../../lib/Protocol/Client');
                encodeMessage = td.replace(FakeClient.prototype, 'encodeMessage');
            });

            it('sends a Mysqlx.Session.Close message to the server', () => {
                const client = new FakeClient(network);

                td.when(encodeClose()).thenReturn('foo');
                td.when(encodeMessage(ClientMessages.Type.SESS_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenResolve('baz');

                return client.sessionClose()
                    .then(actual => expect(actual).to.equal('baz'));
            });

            it('fails if there is an error while encoding the message', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenThrow(error);

                return client.sessionClose()
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });

            it('fails if there is an error while sending the message to the server', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenReturn('foo');
                td.when(encodeMessage(ClientMessages.Type.SESS_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(), { ignoreExtraArgs: true }).thenReject(error);

                return client.sessionClose()
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });
        });

        // needs to be called with client.close()
        context('connectionClose()', () => {
            let encodeClose;

            beforeEach('create fakes', () => {
                encodeClose = td.function();

                td.replace('../../../lib/Protocol/Protobuf/Adapters/Connection', { encodeClose });

                FakeClient = require('../../../lib/Protocol/Client');
                encodeMessage = td.replace(FakeClient.prototype, 'encodeMessage');
            });

            it('sends a Mysqlx.Connection.Close message to the server', () => {
                const client = new FakeClient(network);

                td.when(encodeClose()).thenReturn('foo');
                td.when(encodeMessage(ClientMessages.Type.CON_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenResolve('baz');

                return client.connectionClose()
                    .then(actual => expect(actual).to.equal('baz'));
            });

            it('fails if there is an error while encoding the message', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenThrow(error);

                return client.connectionClose()
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });

            it('fails if there is an error while sending the message to the server', () => {
                const error = new Error('foo');
                const client = new FakeClient(network);

                td.when(encodeClose()).thenReturn('foo');
                td.when(encodeMessage(ClientMessages.Type.CON_CLOSE, 'foo')).thenReturn('bar');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenReject(error);

                return client.connectionClose()
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });
        });
    });

    // TODO(Rui): this will be part of a different component.
    context('handling notices', () => {
        it('does not process global notices', () => {
            const decodeFrame = td.function();
            const process = td.function();

            td.replace('../../../lib/Protocol/Protobuf/Adapters/Notice', { decodeFrame });
            const Client = require('../../../lib/Protocol/Client');

            const socket = new PassThrough();
            const client = new Client(socket);
            const decodeMessage = td.replace(client, 'decodeMessage');

            const message = { id: ServerMessages.Type.NOTICE, payload: 'bar' };
            const notice = { scope: Scope.GLOBAL };

            td.replace(client, '_workQueue', { process });
            td.when(decodeFrame(message.payload)).thenReturn(notice);
            td.when(decodeMessage('foo')).thenReturn(message);

            client.handleServerMessage('foo');

            expect(td.explain(process).callCount).to.equal(0);
        });

        context('empty notices', () => {
            let fakeProcess;

            beforeEach('create fakes', () => {
                fakeProcess = td.replace(WorkQueue.prototype, 'process');
            });

            it('ignores empty notices', () => {
                const network = new EventEmitter();
                // eslint-disable-next-line no-unused-vars
                const client = new Client(network);

                // eslint-disable-next-line node/no-deprecated-api
                const fragment = new Buffer('010000000b', 'hex');

                network.emit('data', fragment);

                expect(td.explain(fakeProcess).callCount).to.equal(0);
            });
        });
    });

    context('classic protocol', () => {
        it('fails with an unsupported protocol error', () => {
            const network = new EventEmitter();
            // eslint-disable-next-line no-unused-vars
            const client = new Client(network);

            // eslint-disable-next-line node/no-deprecated-api
            const classicServerGreeting = new Buffer('010000000a', 'hex');

            expect(() => network.emit('data', classicServerGreeting)).to.throw(/^The server connection is not using the X Protocol/);
        });
    });
});
