'use strict';

/* eslint-env node, mocha */
/* global Messages */

const Client = require('lib/Protocol/Client');
const WorkQueue = require('lib/WorkQueue');
const expect = require('chai').expect;
const isEqual = require('lodash.isequal');
const SqlResultHandler = require('lib/Protocol/ResponseHandler').SqlResultHandler;
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
