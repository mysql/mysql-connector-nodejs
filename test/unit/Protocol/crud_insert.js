"use strict";

/*global
 describe, context, beforeEach, afterEach, it, chai, Client, Encoding, Messages, nullStream
 */

chai.should();

var assert = require("assert");
var DataType = require('../../../lib/Protocol/Datatype');

describe('Client', function () {
    describe('crudInsert', function () {
        it('should not allow to send no documents', function () {
            var protocol = new Client(nullStream);
            assert.throws(
                function () {
                    protocol.crudInsert("schema", "collection", Client.dataModel.DOCUMENT, {});
                },
                /No document provided/
            );
        });
        it('should send one document in one message', function () {
            var sentData = null;

            var mockedStream = {
                on: function () {
                },
                write: function (data) {
                    sentData = data;
                }
            };

            var protocol = new Client(mockedStream);
            assert.strictEqual(sentData, null, "There was data sent too early");
            protocol.crudInsert("schema", "collection", Client.dataModel.DOCUMENT, [[{ _id: 123 }]]);
            assert.notEqual(sentData, null, "There wasn't any data sent");
            var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
            data.messageId.should.equal(Messages.ClientMessages.CRUD_INSERT);
            data.decoded.collection.schema.should.equal("schema");
            data.decoded.collection.name.should.equal("collection");
            data.decoded.row.length.should.equal(1);
            data.decoded.row[0].field.length.should.equal(1);
            JSON.parse(DataType.decodeScalar(data.decoded.row[0].field[0].literal)).should.deep.equal({ _id: 123 });
        });
        it('should send multiple documents in one message', function () {
            var sentData = null;

            var mockedStream = {
                on: function () {
                },
                write: function (data) {
                    sentData = data;
                }
            };

            var protocol = new Client(mockedStream);
            protocol.crudInsert("schema", "collection", Client.dataModel.DOCUMENT, [[{ _id: 123 }], [{ _id: 456 }]]);
            assert.notEqual(sentData, null, "There wasn't any data sent");
            var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
            data.messageId.should.equal(Messages.ClientMessages.CRUD_INSERT);
            data.decoded.collection.schema.should.equal("schema");
            data.decoded.collection.name.should.equal("collection");
            data.decoded.row.length.should.equal(2);
            data.decoded.row[0].field.length.should.equal(1);
            data.decoded.row[1].field.length.should.equal(1);
            JSON.parse(DataType.decodeScalar(data.decoded.row[0].field[0].literal)).should.deep.equal({ _id: 123 });
            JSON.parse(DataType.decodeScalar(data.decoded.row[1].field[0].literal)).should.deep.equal({ _id: 456 });
        });
        it('should resolve Promise after inserting multiple documents', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.crudInsert("schema", "collection", Client.dataModel.DOCUMENT, [[{ _id: 123 }], [{ _id: 456 }]]);
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            return promise.should.eventually.deep.equal({});
        });
        it('should report affected rows (once we handle int64 properly)');

        it('should throw an error when receiving multiple messages', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.crudInsert("schema", "collection", Client.dataModel.DOCUMENT, [[{ _id: 123 }], [{ _id: 456 }]]);
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            assert.throws(
                function () {
                    protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
                },
                /Queue is empty/
            );
            return promise.should.eventually.deep.equal({});
        });
        it('should throw an error when receiving multiple messages', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.crudInsert("schema", "collection", Client.dataModel.DOCUMENT, [[{ _id: 123 }], [{ _id: 456 }]]);
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            assert.throws(
                function () {
                    protocol.handleNetworkFragment(protocol.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, protocol.serverMessages));
                },
                /Queue is empty/
            );
            return promise.should.eventually.deep.equal({});
        });
        it('should fail if error is received', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.crudInsert("schema", "collection", Client.dataModel.DOCUMENT, [[{ _id: 123 }], [{ _id: 456 }]]);
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1,
                sql_state: "0000",
                msg: "Unknown error"
            }, Encoding.serverMessages));
            return promise.should.be.rejected;
        });
    });
});
