"use strict";

chai.should();

const assert = require("assert"),
    protobuf = new (require('../../lib/Protocol/protobuf.js'))(Messages);

function produceResultSet(protocol) {
    protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
        name: "column",
        original_name: "original_column",
        table: "table",
        original_table: "original_table",
        schema: "schema"
    }, Encoding.serverMessages));
    protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, { field: ["\x01"] }, Encoding.serverMessages));
    protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, { field: ["\x01"] }, Encoding.serverMessages));
    protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, Encoding.serverMessages));
    protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
}

describe('DevAPI', function () {
    describe('nodeSession', function () {
        describe('executeSQL', function () {
            let session;
            beforeEach('get Session', function (done) {
                return mysqlxtest.getNullNodeSession().then(function (s) {
                    session = s;
                    done();
                }).catch(function (err) {
                    done(err);
                });
            });
            it('should call the row callback', function () {
                const rowcb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute(rowcb);
                produceResultSet(session._client);
                rowcb.should.be.called.twice;
                promise.should.eventually.be.fullfilled;
            });
            it('should call the row and meta callback', function () {
                const rowcb = chai.spy(),
                    metacb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute(rowcb, metacb);
                produceResultSet(session._client);
                rowcb.should.be.called.twice;
                metacb.should.be.called.once;
                promise.should.eventually.be.fullfilled;
            });
            it('should call the row and meta callback from object', function () {
                const rowcb = chai.spy(),
                    metacb = chai.spy(),
                    promise = session.executeSql("SELECT 1").execute({row: rowcb, meta: metacb});
                produceResultSet(session._client);
                rowcb.should.be.called.twice;
                metacb.should.be.called.once;
                promise.should.eventually.be.fullfilled;
            });
        });
    });
});
