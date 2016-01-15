"use strict";

var chai = require("chai"),
    spies = require('chai-spies');
chai.should();
chai.use(spies);

var assert = require("assert");
var Protocol = require("../../lib/Protocol");
var Datatype = require("../../lib/Protocol/Datatype");
var Messages = require('../../lib/Protocol/Messages');

var nullStream = {
    on: function () {},
    write: function () {}
};

function produceResultSet(protocol, columnCount) {
    for (let i = 0; i < columnCount; ++i) {
        protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
            type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
            name: "column" + i,
            original_name: "original_column" + i,
            table: "table",
            original_table: "original_table",
            schema: "schema"
        }, protocol.serverMessages));
    }
    //protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, {}, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, protocol.serverMessages));
}

describe('Protocol', function () {
    describe('sqlStagementExecute', function () {
        it('should report on meta data', function () {
            var protocol = new Protocol(nullStream);

            var metacb = chai.spy();

            var promise = protocol.sqlStmtExecute("SELECT * FROM t", [], row => {}, metacb);
            produceResultSet(protocol, 1);
            metacb.should.have.been.called.once;
            return promise.should.be.fulfilled;
        });
    });
});
