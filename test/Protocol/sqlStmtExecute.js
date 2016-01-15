"use strict";

var chai = require("chai"),
    spies = require('chai-spies');
chai.should();
chai.use(spies);

var assert = require("assert");
var Protocol = require("../../lib/Protocol");
var Datatype = require("../../lib/Protocol/Datatype");
var Messages = require('../../lib/Protocol/Messages'),
    protobuf = new (require('../../lib/Protocol/protobuf.js'))(Messages);

var nullStream = {
    on: function () {},
    write: function () {}
};

function produceResultSet(protocol, columnCount, rowCount, warnings) {
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
    for (let r = 0; r < rowCount; ++r) {
        let fields = [];
        for (let c = 0; c < columnCount; ++c) {
            fields.push("\x01");
        }
        protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, { field: fields }, protocol.serverMessages));
    }
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, protocol.serverMessages));
    if (warnings && warnings.length) {
        warnings.forEach(warning => {
            protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.NOTICE, {
                type: 1,
                scope: 2,
                payload: protobuf.encode('Mysqlx.Notice.Warning', warning)
            }, protocol.serverMessages))
        });
    }
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, protocol.serverMessages));
}

describe('Protocol', function () {
    describe('sqlStatementExecute', function () {
        it('should throw if row callback is no function', function () {
            const protocol = new Protocol(nullStream);
            (() => {
                protocol.sqlStmtExecute("invalid SQL", [], "this is not a function");
            }).should.throw(/.*has to be a function.*/);
        });
        it('should throw if meta callback is no function', function () {
            const protocol = new Protocol(nullStream);
            (() => {
                protocol.sqlStmtExecute("invalid SQL", [], ()=>{}, "this is not a function");
            }).should.throw(/.*has to be a function.*/);
        });
        it('should fail the promise on error', function () {
            const protocol = new Protocol(nullStream),
                  promise = protocol.sqlStmtExecute("invalid SQL", [], () => {});

            protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1064,
                sql_state: "42000",
                msg: 'You have an error in your SQL syntax'
            }, protocol.serverMessages));
            return promise.should.be.rejected;
        });
        it('should report on meta data', function () {
            const protocol = new Protocol(nullStream),
                  metacb = chai.spy(),
                  promise = protocol.sqlStmtExecute("SELECT * FROM t", [], () => {}, metacb);

            produceResultSet(protocol, 1, 1);
            metacb.should.have.been.called.once;
            return promise.should.be.fulfilled;
        });
        it('should handle warning', function () {
            const protocol = new Protocol(nullStream),
                promise = protocol.sqlStmtExecute("SELECT CAST('a' AS UNSIGNED)", [], () => {}),
                warning = {
                    level: 2,
                    code: 1292,
                    msg: 'Truncated incorrect INTEGER value: \'a\''
                };

            produceResultSet(protocol, 1, 1, [warning]);
            return promise.should.eventually.deep.equal({warnings: [ warning ]});
        });
        for (let count = 0; count < 3; ++count) {
            it('should call row callback for each row data ('+count+' rows)', function () {
                const protocol = new Protocol(nullStream),
                      rowcb = chai.spy(),
                      promise = protocol.sqlStmtExecute("SELECT * FROM t", [], rowcb);

                produceResultSet(protocol, 1, count);
                rowcb.should.have.been.called.exactly(count);
                return promise.should.be.fulfilled;
            });
        }
    });
});
