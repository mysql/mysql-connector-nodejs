/*
 * Copyright (c) 2016, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const OkHandler = require('../../../lib/Protocol/InboundHandlers/OkHandler');
const MysqlxStub = require('../../../lib/Protocol/Stubs/mysqlx_pb');
const PassThrough = require('stream').PassThrough;
const Scope = require('../../../lib/Protocol/Stubs/mysqlx_notice_pb').Frame.Scope;
const WorkQueue = require('../../../lib/WorkQueue');
const condition = require('../../../lib/Protocol/Wrappers/Messages/Expect/Condition');
const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let Client = require('../../../lib/Protocol/Client');

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
    });

    context('decodeMessage()', () => {
        it('returns an object containing the message id and data payload', () => {
            const client = new Client();
            const message = Buffer.from('MySQL X Protocol FTW');
            const decodeMessageHeader = td.replace(client, 'decodeMessageHeader');

            td.when(decodeMessageHeader(message)).thenReturn({ messageId: 3, packetLength: message.length });

            expect(client.decodeMessage(message)).to.deep.equal({ id: 3, payload: message.slice(5) });
        });

        it('throws an error if the server is using the MySQL classic protocol', () => {
            const client = new Client();
            const classicServerGreeting = Buffer.from('010000000a', 'hex');

            expect(() => client.decodeMessage(classicServerGreeting)).to.throw(errors.MESSAGES.ER_CLIENT_NO_X_PROTOCOL);
        });

        it('throws an error if the server sends an incomplete protocol message', () => {
            const client = new Client();
            const message = Buffer.alloc(10);
            const decodeMessageHeader = td.replace(client, 'decodeMessageHeader');

            td.when(decodeMessageHeader(message)).thenReturn({ packetLength: 11 });

            expect(() => client.decodeMessage(message)).to.throw(errors.MESSAGES.ER_DEVAPI_INCOMPLETE_PROTOCOL_MESSAGE);
        });
    });

    context('decodeMessageHeader()', () => {
        it('returns an object with the message id and length', () => {
            const client = new Client();
            const messageId = 5;
            const packetLength = 10;
            const message = Buffer.allocUnsafe(5);
            // The length of the packet is encoded in the the first byte but
            // does not include the length of the header itself (4 bytes).
            message.writeUInt32LE(packetLength - 4);
            // The id is encoded in the byte immediatelly after the header.
            message[4] = messageId;

            expect(client.decodeMessageHeader(message)).to.deep.equal({ messageId, packetLength });
        });

        it('throw an error if the header is not a valid X Protocol header', () => {
            const client = new Client();
            const emptyMessage = Buffer.alloc(0);

            expect(() => client.decodeMessageHeader(emptyMessage)).to.throw(errors.MESSAGES.ER_X_CLIENT_UNKNOWN_PROTOCOL_HEADER);
        });
    });

    context('encodeMessage()', () => {
        it('returns a Node.js Buffer representation of an X Protocol message', () => {
            const client = new Client();
            const messageType = 5;
            const payload = Buffer.from('MySQL X Protocol FTW!');

            const message = client.encodeMessage(messageType, payload);

            expect(message).to.be.an.instanceOf(Buffer);
            expect(message).to.have.lengthOf(payload.length + 5); // includes 4 bytes for the header and 1 byte for the message id
            expect(message.readUInt32LE(0) - 1).to.equal(payload.length); // excludes 1 byte of the message id
            expect(message[4]).to.equal(messageType);
        });
    });

    context('handleNetworkFragment()', () => {
        let decodeMessage, process, message1, message2, rawMessage1, rawMessage2;

        beforeEach('create fakes', () => {
            decodeMessage = td.replace(Client.prototype, 'decodeMessage');
            process = td.replace(WorkQueue.prototype, 'process');

            rawMessage1 = Buffer.allocUnsafe(8);
            rawMessage1.writeUInt32LE(4);
            rawMessage1.writeUInt8(1, 4);
            rawMessage1.fill('foo', 5);

            rawMessage2 = Buffer.allocUnsafe(8);
            rawMessage2.writeUInt32LE(4);
            rawMessage2.writeUInt8(2, 4);
            rawMessage2.fill('bar', 5);

            message1 = { id: 1, payload: Buffer.from('foo') };
            message2 = { id: 2, payload: Buffer.from('bar') };

            td.when(process(), { ignoreExtraArgs: true }).thenReturn();
            td.when(decodeMessage(rawMessage2), { ignoreExtraArgs: true }).thenReturn(message2);
            td.when(decodeMessage(rawMessage1), { ignoreExtraArgs: true }).thenReturn(message1);
        });

        it('handles messages fully-contained in a fragment', () => {
            const client = new Client();
            // fragment containing two messages
            const fragment = Buffer.concat([rawMessage1, rawMessage2], rawMessage1.length + rawMessage2.length);

            client.handleNetworkFragment(fragment);

            expect(td.explain(process).callCount).to.equal(2);
            expect(td.explain(process).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(process).calls[1].args).to.deep.equal([message2]);
        });

        it('handles message headers split between fragments', () => {
            const client = new Client();
            const partialHeader = rawMessage2.slice(0, 2);
            // fragment containing the first message and a partial header of the second message
            const fragment1 = Buffer.concat([rawMessage1, partialHeader], rawMessage1.length + partialHeader.length);
            // fragment containing the remaining content
            const fragment2 = rawMessage2.slice(2);

            client.handleNetworkFragment(fragment1);
            client.handleNetworkFragment(fragment2);

            expect(td.explain(process).callCount).to.equal(2);
            expect(td.explain(process).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(process).calls[1].args).to.deep.equal([message2]);
        });

        it('handles message headers and payloads split between fragments', () => {
            const client = new Client();
            const header = rawMessage2.slice(0, 4);
            // fragment containing the first message and the entire header of the second message
            const fragment1 = Buffer.concat([rawMessage1, header], rawMessage1.length + header.length);
            // fragment containing the payload of the second message
            const fragment2 = rawMessage2.slice(4);

            client.handleNetworkFragment(fragment1);
            client.handleNetworkFragment(fragment2);

            expect(td.explain(process).callCount).to.equal(2);
            expect(td.explain(process).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(process).calls[1].args).to.deep.equal([message2]);
        });

        it('handles message payloads split between fragments', () => {
            const client = new Client();
            const partialMessage = rawMessage2.slice(0, 6);
            // fragment containing the first message and a partial payload of the second message
            const fragment1 = Buffer.concat([rawMessage1, partialMessage], rawMessage1.length + partialMessage.length);
            // fragment containing the remaining content
            const fragment2 = rawMessage2.slice(6);

            client.handleNetworkFragment(fragment1);
            client.handleNetworkFragment(fragment2);

            expect(td.explain(process).callCount).to.equal(2);
            expect(td.explain(process).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(process).calls[1].args).to.deep.equal([message2]);
        });

        it('handles smaller fragments', () => {
            const client = new Client();
            const partialMessage = rawMessage1.slice(2);
            // fragment containing just a partial header of the first message
            const fragment1 = rawMessage1.slice(0, 2);
            // fragment the remaining content
            const fragment2 = Buffer.concat([partialMessage, rawMessage2], partialMessage.length + rawMessage2.length);

            client.handleNetworkFragment(fragment1);
            client.handleNetworkFragment(fragment2);

            expect(td.explain(process).callCount).to.equal(2);
            expect(td.explain(process).calls[0].args).to.deep.equal([message1]);
            expect(td.explain(process).calls[1].args).to.deep.equal([message2]);
        });

        it('handles messages split between more than two fragments', () => {
            const client = new Client();
            // more than two fragments containing the same mesage
            const fragment1 = rawMessage1.slice(0, 4);
            const fragment2 = rawMessage1.slice(4, 6);
            const fragment3 = rawMessage1.slice(6, 8);

            client.handleNetworkFragment(fragment1);
            client.handleNetworkFragment(fragment2);
            client.handleNetworkFragment(fragment3);

            expect(td.explain(process).callCount).to.equal(1);
            expect(td.explain(process).calls[0].args).to.deep.equal([message1]);
        });

        it('handles fragments containing a lot of messages', () => {
            const client = new Client();

            let fragment = Buffer.alloc(0);

            // The stack size on Node.js v4 seems to exceed for around 6035 messages of 8 bytes.
            // Let's keep a bit of a margin while making sure the test is fast enough.
            for (let i = 0; i < 7000; ++i) {
                fragment = Buffer.concat([fragment, rawMessage1], fragment.length + rawMessage1.length);
            }

            client.handleNetworkFragment(fragment);

            expect(td.explain(process).callCount).to.equal(7000);
            td.explain(process).calls.forEach(call => expect(call.args).to.deep.equal([message1]));
        });
    });

    context('handleServerMessage()', () => {
        let process;

        beforeEach('create fakes', () => {
            process = td.replace(WorkQueue.prototype, 'process');
        });

        it('does not process global notices', () => {
            const decodeFrame = td.function();

            td.replace('../../../lib/Protocol/OutboundHandlers/Notice', { decodeFrame });
            const Client = require('../../../lib/Protocol/Client');

            const socket = new PassThrough();
            const client = new Client(socket);
            const decodeMessage = td.replace(client, 'decodeMessage');

            const message = { id: MysqlxStub.ServerMessages.Type.NOTICE, payload: 'bar' };
            const notice = { scope: Scope.GLOBAL };

            td.when(decodeFrame(message.payload)).thenReturn(notice);
            td.when(decodeMessage('foo')).thenReturn(message);

            client.handleServerMessage('foo');

            expect(td.explain(process).callCount).to.equal(0);
        });

        it('does not process empty notices', () => {
            const client = new Client();
            const emptyNotice = Buffer.from('010000000b', 'hex');

            client.handleServerMessage(emptyNotice);

            expect(td.explain(process).callCount).to.equal(0);
        });
    });

    context('sessionClose()', () => {
        let FakeOkHandler, encodeClose, encodeMessage;

        beforeEach('create fakes', () => {
            FakeOkHandler = td.constructor(OkHandler);
            encodeClose = td.function();

            td.replace('../../../lib/Protocol/InboundHandlers/OkHandler', FakeOkHandler);
            td.replace('../../../lib/Protocol/OutboundHandlers/Session', { encodeClose });

            Client = require('../../../lib/Protocol/Client');
            encodeMessage = td.replace(Client.prototype, 'encodeMessage');
        });

        it('sends a Mysqlx.Session.Close message to the server', () => {
            const client = new Client();

            td.when(encodeClose()).thenReturn('foo');
            td.when(encodeMessage(MysqlxStub.ClientMessages.Type.SESS_CLOSE, 'foo')).thenReturn('bar');
            td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenResolve('baz');

            return client.sessionClose()
                .then(actual => expect(actual).to.equal('baz'));
        });

        it('fails if there is an error while encoding the message', () => {
            const error = new Error('foo');
            const client = new Client();

            td.when(encodeClose()).thenThrow(error);

            return client.sessionClose()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if there is an error while sending the message to the server', () => {
            const error = new Error('foo');
            const client = new Client();

            td.when(encodeClose()).thenReturn('foo');
            td.when(encodeMessage(MysqlxStub.ClientMessages.Type.SESS_CLOSE, 'foo')).thenReturn('bar');
            td.when(FakeOkHandler.prototype.sendMessage(), { ignoreExtraArgs: true }).thenReject(error);

            return client.sessionClose()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    // needs to be called with client.close()
    context('connectionClose()', () => {
        let FakeOkHandler, encodeMessage, encodeClose;

        beforeEach('create fakes', () => {
            FakeOkHandler = td.constructor(OkHandler);
            encodeClose = td.function();

            td.replace('../../../lib/Protocol/InboundHandlers/OkHandler', FakeOkHandler);
            td.replace('../../../lib/Protocol/OutboundHandlers/Connection', { encodeClose });

            Client = require('../../../lib/Protocol/Client');
            encodeMessage = td.replace(Client.prototype, 'encodeMessage');
        });

        it('sends a Mysqlx.Connection.Close message to the server', () => {
            const client = new Client();

            td.when(encodeClose()).thenReturn('foo');
            td.when(encodeMessage(MysqlxStub.ClientMessages.Type.CON_CLOSE, 'foo')).thenReturn('bar');
            td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenResolve('baz');

            return client.connectionClose()
                .then(actual => expect(actual).to.equal('baz'));
        });

        it('fails if there is an error while encoding the message', () => {
            const error = new Error('foo');
            const client = new Client();

            td.when(encodeClose()).thenThrow(error);

            return client.connectionClose()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if there is an error while sending the message to the server', () => {
            const error = new Error('foo');
            const client = new Client();

            td.when(encodeClose()).thenReturn('foo');
            td.when(encodeMessage(MysqlxStub.ClientMessages.Type.CON_CLOSE, 'foo')).thenReturn('bar');
            td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), td.matchers.anything(), 'bar')).thenReject(error);

            return client.connectionClose()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('sessionReset()', () => {
        let FakeOkHandler, authenticate, encodeMessage, encodeReset, network;

        beforeEach('create fakes', () => {
            FakeOkHandler = td.constructor(OkHandler);
            encodeReset = td.function();
            network = new PassThrough();

            td.replace('../../../lib/Protocol/OutboundHandlers/Session', { encodeReset });
            td.replace('../../../lib/Protocol/InboundHandlers/OkHandler', FakeOkHandler);

            Client = require('../../../lib/Protocol/Client');
            authenticate = td.replace(Client.prototype, 'authenticate');
            encodeMessage = td.replace(Client.prototype, 'encodeMessage');
        });

        afterEach('reset fakes', () => {
            return new Promise(resolve => network.end(resolve));
        });

        context('in the first call', () => {
            let expectOpen, expectClose;

            beforeEach('create fakes', () => {
                expectOpen = td.replace(Client.prototype, 'expectOpen');
                expectClose = td.replace(Client.prototype, 'expectClose');
            });

            context('with new servers', () => {
                it('sets the expectations, resets the session keeping it open and updates the local state', () => {
                    const client = new Client(network);
                    const expectations = [{
                        condition: condition.ACTION.EXPECT_OP_SET,
                        key: condition.TYPE.EXPECT_FIELD_EXIST,
                        value: '6.1'
                    }];

                    td.when(expectOpen(expectations)).thenResolve();
                    td.when(encodeReset({ keepOpen: true })).thenReturn('bar');
                    td.when(encodeMessage(MysqlxStub.ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                    td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve();
                    td.when(expectClose()).thenResolve();

                    return client.sessionReset()
                        .then(() => expect(client._requiresAuthenticationAfterReset).to.equal('NO'));
                });
            });

            context('with old servers', () => {
                it('tries to set the server expectations, updates the local state, resets the session and re-authenticates', () => {
                    const client = new Client(network);
                    const expectations = [{
                        condition: condition.ACTION.EXPECT_OP_SET,
                        key: condition.TYPE.EXPECT_FIELD_EXIST,
                        value: '6.1'
                    }];
                    const error = new Error();
                    // Error 5168 means the X Plugin does not support prepared statements (fails with the "6.1" expectation)
                    error.info = { code: 5168 };

                    td.replace(client, '_authenticator', 'foo');

                    td.when(expectOpen(expectations)).thenReject(error);
                    td.when(encodeReset({ keepOpen: false })).thenReturn('bar');
                    td.when(encodeMessage(MysqlxStub.ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
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
                const client = new Client(network);
                const error = new Error();
                error.info = { code: -1 };

                td.when(expectOpen(), { ignoreExtraArgs: true }).thenReject(error);

                return client.sessionReset()
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });

            it('fails if there is an unexpected error while encoding the Mysqlx.Session.Reset message ', () => {
                const client = new Client(network);
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
                const client = new Client(network);
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
                const client = new Client(network);
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
                const client = new Client(network);

                // does not require re-authentication
                td.replace(client, '_requiresAuthenticationAfterReset', 'NO');

                td.when(encodeReset({ keepOpen: true })).thenReturn('bar');
                td.when(encodeMessage(MysqlxStub.ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve('qux');

                return client.sessionReset()
                    .then(actual => expect(actual).to.equal('qux'));
            });

            it('resets the session and re-authenticates with older servers in subsequent calls', () => {
                const client = new Client(network);

                td.replace(client, '_authenticator', 'foo');
                // requires re-authentication
                td.replace(client, '_requiresAuthenticationAfterReset', 'YES');

                td.when(encodeReset({ keepOpen: false })).thenReturn('bar');
                td.when(encodeMessage(MysqlxStub.ClientMessages.Type.SESS_RESET, 'bar')).thenReturn('baz');
                td.when(FakeOkHandler.prototype.sendMessage(td.matchers.anything(), network, 'baz')).thenResolve();
                td.when(authenticate('foo')).thenResolve('qux');

                return client.sessionReset()
                    .then(actual => expect(actual).to.equal('qux'));
            });
        });
    });
});
