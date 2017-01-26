'use strict';

/* eslint-env node, mocha */
/* global Messages */

const Client = require('lib/Protocol/Client');
const WorkQueue = require('lib/WorkQueue');
const SqlResultHandler = require('lib/Protocol/ResponseHandler').SqlResultHandler;
const expect = require('chai').expect;
const isEqual = require('lodash.isequal');
const proxyquire = require('proxyquire');
const td = require('testdouble');

describe('Client', () => {
    let on, sendMessage;

    beforeEach('create fakes', () => {
        on = td.function();

        sendMessage = SqlResultHandler.prototype.sendMessage;
        SqlResultHandler.prototype.sendMessage = td.function();
    });

    afterEach('reset fakes', () => {
        SqlResultHandler.prototype.sendMessage = sendMessage;
        td.reset();
    });

    context('constructor', () => {
        it('should save the provided stream as an instance variable', () => {
            const stream = { on, foo: 'bar' };
            const client = new Client(stream);

            expect(client._stream).to.equal(stream);
        });

        it('should create a `WorkQueue` instance', () => {
            const client = new Client({ on });

            expect(client._workQueue).to.be.an.instanceof(WorkQueue);
        });

        it('should disable the `danglingFragment` option by default', () => {
            const client = new Client({ on });

            expect(client._danglingFragment).to.be.false;
        });

        it('should register a `data` event listener for the provided stream', () => {
            const stream = { on };
            const handleNetworkFragment = td.function();

            td.when(on('data')).thenCallback('foo');

            Client.call({ handleNetworkFragment }, stream);

            td.verify(handleNetworkFragment('foo'), { times: 1 });
        });

        it('should register a `close` event listener for the provided stream', () => {
            const stream = { on };
            const handleServerClose = td.function();

            td.when(on('close')).thenCallback();

            Client.call({ handleServerClose }, stream);

            td.verify(handleServerClose(), { times: 1 });
        });
    });

    context('enableSSL()', () => {
        let FakeClient, connect, parseX509Bundle, readFile;

        beforeEach('create fakes', () => {
            connect = td.function();
            readFile = td.function();
            parseX509Bundle = td.function();

            FakeClient = proxyquire('lib/Protocol/Client', {
                './Util/parseX509Bundle': parseX509Bundle,
                '../Adapters/fs': { readFile },
                tls: { connect }
            });
        });

        it('should enable TLS in the connection socket', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(client.capabilitiesSet({ tls: true })).thenResolve();
            td.when(connect({ rejectUnauthorized: false, socket: stream }, td.callback())).thenReturn(stream);

            return expect(client.enableSSL({})).to.eventually.be.true;
        });

        it('should enable server certificate authority validation if requested', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(readFile('foobar', 'ascii')).thenResolve('--base64Giberish--');
            td.when(parseX509Bundle('--base64Giberish--')).thenReturn(['foo']);
            td.when(client.capabilitiesSet({ tls: true })).thenResolve();
            td.when(connect({ ca: ['foo'], rejectUnauthorized: true, socket: stream }, td.callback())).thenReturn(stream);

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
            td.when(connect({ ca: ['bar'], crl: 'foo', rejectUnauthorized: true, socket: stream }, td.callback())).thenReturn(stream);

            return expect(client.enableSSL({ ca: 'foobar', crl: 'bazqux' })).to.eventually.be.true;
        });

        // TODO(Rui): evaluate this approach. Should this not fail if no CA is provided?
        it('should not enable server certificate revocation validation if no CA certificate is provided', () => {
            const stream = { on };
            const client = new FakeClient(stream);

            client.capabilitiesSet = td.function();

            td.when(client.capabilitiesSet({ tls: true })).thenResolve();

            const expected = {
                socket: stream,
                rejectUnauthorized: false
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

    // FIXME(ruiquelhas): test the promise interface.
    context('crudFind()', () => {
        it('should encode grouping expressions correctly', () => {
            const client = new Client({ on });
            const expected = [{
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
            const match = td.matchers.argThat(data => isEqual(data.grouping, expected));

            client.encodeMessage = td.function();
            client.crudFind(null, null, null, null, null, null, ['foo', 'bar']);

            td.verify(client.encodeMessage(Messages.ClientMessages.CRUD_FIND, match), { times: 1 });
        });

        it('should send encoded message to the server', () => {
            const handler = new SqlResultHandler();
            const client = new Client({ on });

            client.encodeMessage = td.function();

            td.when(client.encodeMessage(td.matchers.anything(), td.matchers.anything())).thenReturn('foobar');

            client.crudFind();

            td.verify(handler.sendMessage(client._workQueue, client._stream, 'foobar'), { times: 1 });
        });
    });

    context('crudInsert()', () => {
        it('should encode field names correctly', () => {
            const client = new Client({ on });
            const expected = ['foo', 'bar'];
            const handler = new SqlResultHandler();
            const match = td.matchers.argThat(data => isEqual(data.projection, expected));

            client.encodeMessage = td.function();

            td.when(handler.sendMessage(), { ignoreExtraArgs: true }).thenResolve();

            return client.crudInsert(null, null, null, [['baz', 'qux']], expected)
                .then(() => td.verify(client.encodeMessage(Messages.ClientMessages.CRUD_INSERT, match), { times: 1 }));
        });

        it('should encode row values correctly', () => {
            const client = new Client({ on });
            const expected = [{
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
            const handler = new SqlResultHandler();
            const match = td.matchers.argThat(data => isEqual(data.row, expected));

            td.when(handler.sendMessage(), { ignoreExtraArgs: true }).thenResolve();

            client.encodeMessage = td.function();

            return client.crudInsert(null, null, null, [['foo', 'bar']])
                .then(() => td.verify(client.encodeMessage(Messages.ClientMessages.CRUD_INSERT, match), { times: 1 }));
        });

        it('should send encoded message to the server', () => {
            const client = new Client({ on });
            const expected = { foo: 'bar' };
            const handler = new SqlResultHandler();

            client.encodeMessage = td.function();

            td.when(client.encodeMessage(), { ignoreExtraArgs: true }).thenReturn('foobar');
            td.when(handler.sendMessage(client._workQueue, client._stream, 'foobar')).thenResolve(expected);

            return client.crudInsert(null, null, null, [[]]).should.become(expected);
        });

        it('should throw error if no documents are provided', () => {
            const client = new Client({ on });
            const handler = new SqlResultHandler();

            client.encodeMessage = td.function();

            return client.crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, {})
                .catch(err => {
                    expect(err).to.be.an.instanceof(Error);
                    expect(err.message).to.equal('No document provided for Crud::Insert');

                    td.verify(client.encodeMessage(), { ignoreExtraArgs: true, times: 0 });
                    td.verify(handler.sendMessage(), { ignoreExtraArgs: true, times: 0 });
                });
        });

        // TODO(rui.quelhas): add the same test for `crudFind`
        it('should throw error if the message cannot be sent', () => {
            const client = new Client({ on });
            const error = new Error('foo');
            const handler = new SqlResultHandler();

            client.encodeMessage = td.function();

            td.when(client.encodeMessage(), { ignoreExtraArgs: true }).thenReturn();
            td.when(handler.sendMessage(), { ignoreExtraArgs: true }).thenReject(error);

            return client.crudInsert(null, null, null, [['foo', 'bar']]).should.be.rejectedWith(error);
        });
    });
});
