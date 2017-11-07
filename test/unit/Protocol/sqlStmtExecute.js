'use strict';

/* eslint-env node, mocha */
/* global nullStream */

const Client = require('lib/Protocol/Client');
const Encoding = require('lib/Protocol/Encoding');
const Messages = require('lib/Protocol/Messages');
const Server = require('lib/Protocol/Server');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

function produceResultSet (protocol, resultsetCount, columnCount, rowCount, warnings) {
    const result = new Server.ResultSet(data => protocol.handleNetworkFragment(data));
    for (let rset = 0; rset < resultsetCount; ++rset) {
        result.beginResult(columnCount);
        for (let r = 0; r < rowCount; ++r) {
            result.row(columnCount);
        }
        result.finalizeSingle();
    }
    if (warnings && warnings.length) {
        warnings.forEach(function (warning) {
            result.warning(warning);
        });
    }
    result.finalize();
}

describe('Client', () => {
    // TODO(Rui): rewrite tests when refactoring the `Client` module
    context.skip('sqlStatementExecute', () => {
        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should throw if row callback is no function', () => {
            const protocol = new Client(nullStream);

            return expect(() => protocol.sqlStmtExecute('invalid SQL', [], 'this is not a function'))
                .to.throw(/.*has to be a function.*/);
        });

        it('should throw if meta callback is no function', () => {
            const protocol = new Client(nullStream);

            return expect(() => protocol.sqlStmtExecute('invalid SQL', [], () => {}, 'this is not a function'))
                .to.throw(/.*has to be a function.*/);
        });

        it('should reject the promise on error', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.sqlStmtExecute('invalid SQL', []);

            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1064,
                sql_state: '42000',
                msg: 'You have an error in your SQL syntax'
            }, Encoding.serverMessages));

            return expect(promise).to.be.rejected;
        });

        it('should reject the promise on invalid message', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.sqlStmtExecute('SELECT 1', []);

            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));

            return expect(promise).to.be.rejected;
        });

        it('should reject the promise on invalid message', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.sqlStmtExecute('SELECT 1', []);

            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));

            return expect(promise).to.be.rejected;
        });

        it('should reject the promise on invalid message and allow further requests', () => {
            const protocol = new Client(nullStream);
            const promise1 = protocol.sqlStmtExecute('SELECT 1', []);
            const promise2 = protocol.sqlStmtExecute('SELECT 1', []);

            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));

            produceResultSet(protocol, 1, 1, 1);

            return expect(Promise.all([expect(promise1).to.be.rejected, expect(promise2).to.be.fulfilled])).to.be.fulfilled;
        });

        it('should reject the promise on hard stream close', () => {
            let closeStream = {
                closefunc: undefined,
                on: function (what, cb) {
                    if (what === 'close') {
                        this.closefunc = cb;
                    }
                },
                write: () => {}
            };

            const protocol = new Client(closeStream);
            const promise = protocol.sqlStmtExecute('SELECT 1', []);

            closeStream.closefunc();

            return expect(promise).to.be.rejected;
        });

        it('should report on meta data', () => {
            const protocol = new Client(nullStream);
            const metacb = td.function();
            const promise = protocol.sqlStmtExecute('SELECT * FROM t', [], () => {}, metacb);

            td.when(metacb()).thenReturn();

            produceResultSet(protocol, 1, 1, 1);

            expect(td.explain(metacb).callCount).to.equal(1);

            return expect(promise).to.be.fulfilled;
        });

        it('should report multiple meta data in one call', () => {
            const protocol = new Client(nullStream);
            const metacb = td.function();
            const promise = protocol.sqlStmtExecute('SELECT * FROM t', [], () => {}, metacb);
            const field = {
                type: 1,
                name: 'column',
                original_name: 'original_column',
                table: 'table',
                original_table: 'original_table',
                schema: 'schema'
            };

            td.when(metacb([field, field])).thenReturn();

            produceResultSet(protocol, 1, 2, 1);

            expect(td.explain(metacb).callCount).to.equal(1);

            return expect(promise).to.be.fulfilled;
        });

        it('should call metacb for each resultset', () => {
            const protocol = new Client(nullStream);
            const metacb = td.function();
            const promise = protocol.sqlStmtExecute('SELECT * FROM t', [], () => {}, metacb);
            const field = {
                type: 1,
                name: 'column',
                original_name: 'original_column',
                table: 'table',
                original_table: 'original_table',
                schema: 'schema'
            };

            td.when(metacb([field, field])).thenReturn();

            produceResultSet(protocol, 2, 2, 1, false, 2);

            expect(td.explain(metacb).callCount).to.equal(2);

            return promise.should.be.fulfilled;
        });

        it('should handle warning', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.sqlStmtExecute("SELECT CAST('a' AS UNSIGNED)", []);
            const warning = {
                level: 2,
                code: 1292,
                msg: "Truncated incorrect INTEGER value: 'a'"
            };

            produceResultSet(protocol, 1, 1, 1, [warning]);

            return expect(promise).to.eventually.deep.equal({ warnings: [ warning ] });
        });

        it(`should call row callback for each row data`, () => {
            const protocol = new Client(nullStream);
            const rowcb = td.function();
            const promise = protocol.sqlStmtExecute('SELECT * FROM t', [], rowcb);

            td.when(rowcb()).thenReturn();

            produceResultSet(protocol, 1, 1, 3);

            expect(td.explain(rowcb).callCount).to.equal(3);

            return expect(promise).to.be.fulfilled;
        });

        it('should accept arguments', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.sqlStmtExecute('SELECT * FROM t', ['a', 23]);

            produceResultSet(protocol, 1, 1, 1);

            return expect(promise).to.be.fulfilled;
        });

        it('should decode JSON data', () => {
            const protocol = new Client(nullStream);
            const rowcb = td.function();
            const promise = protocol.sqlStmtExecute('...', [], rowcb);

            const result = new Server.ResultSet(data => protocol.handleNetworkFragment(data));

            td.when(rowcb([{ foo: 'bar' }])).thenReturn();

            result.beginResult([{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                content_type: 2,
                name: 'column',
                original_name: 'original_column',
                table: 'table',
                original_table: 'original_table',
                schema: 'schema'
            }]);
            result.row(['{ "foo":"bar" }' + '\x00']);
            result.finalize();

            expect(td.explain(rowcb).callCount).to.equal(1);

            return expect(promise).to.be.fulfilled;
        });

        it('should return NULL values', () => {
            const protocol = new Client(nullStream);
            const rowcb = td.function();
            const promise = protocol.sqlStmtExecute('...', [], rowcb);
            const result = new Server.ResultSet(data => protocol.handleNetworkFragment(data));

            td.when(rowcb([null])).thenReturn();

            result.beginResult([{
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
                content_type: 2,
                name: 'column',
                original_name: 'original_column',
                table: 'table',
                original_table: 'original_table',
                schema: 'schema'
            }]);
            result.row(['']);
            result.finalize();

            expect(td.explain(rowcb).callCount).to.equal(1);

            return expect(promise).to.be.fulfilled;
        });

        // for those we hae to inspect the sent message:
        it('should verify bound parameters');
        it('should handle queries wihout result set');
        it('should handle multiple result sets');
        it('should verify default namespace (sql)');
        it('should allow custom namespace');
    });
});
