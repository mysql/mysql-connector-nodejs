"use strict";

var chai = require("chai"),
    spies = require('chai-spies');
chai.should();
chai.use(spies);

var assert = require("assert");
var mysqlx = require("../../");
var Protocol = require("../../lib/Protocol");
var Datatype = require("../../lib/Protocol/Datatype");
var Messages = require('../../lib/Protocol/Messages'),
    protobuf = new (require('../../lib/Protocol/protobuf.js'))(Messages);

var nullStream = {
    on: function () {},
    write: function () {}
};

var NullStreamFactory = {
    createSocket: function () {
        return new Promise(function (resolve) {
            resolve(nullStream);
        });
    }
};

function produceResultSet(protocol) {
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
        name: "column",
        original_name: "original_column",
        table: "table",
        original_table: "original_table",
        schema: "schema"
    }, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, { field: ["\x01"] }, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, { field: ["\x01"] }, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, protocol.serverMessages));
}

describe('DevAPI', function () {
    describe('nodeSession', function () {
        describe('executeSQL', function () {
            let session;
            beforeEach('get Session', function (done) {
                return mysqlx.getNodeSession({
                    authMethod: "NULL",
                    socketFactory: NullStreamFactory
                }).then(function (s) {
                    session = s;
                    done();
                }).catch(function (err) {
                    done(err);
                });
            });
            it('should call the row callback', function () {
                const rowcb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute(rowcb);
                produceResultSet(session._protocol);
                rowcb.should.be.called.twice;
                promise.should.eventually.be.fullfilled;
            });
            it('should call the row and meta callback', function () {
                const rowcb = chai.spy(),
                    metacb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute(rowcb, metacb);
                produceResultSet(session._protocol);
                rowcb.should.be.called.twice;
                metacb.should.be.called.once;
                promise.should.eventually.be.fullfilled;
            });
            it('should call the row and meta callback from object', function () {
                const rowcb = chai.spy(),
                    metacb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute({row: rowcb, meta: metacb});
                produceResultSet(session._protocol);
                rowcb.should.be.called.twice;
                metacb.should.be.called.once;
                promise.should.eventually.be.fullfilled;
            });
        });
    });
});
