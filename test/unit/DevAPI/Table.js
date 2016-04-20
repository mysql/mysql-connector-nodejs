"use strict";

/*global
 describe, context, beforeEach, afterEach, it, chai, Encoding, mysqlxtest, Messages
 */
chai.should();

describe('DevAPI', function () {
    context('Table', function () {
        let session, table;
        beforeEach('get Session', function (done) {
            return mysqlxtest.getNullSession().then(function (s) {
                session = s;
                table = session.getSchema("schema").getTable("table");
                done();
            }).catch(function (err) {
                done(err);
            });
        });


        it('Should know its name', function () {
            table.getName().should.equal("table");
        });

        it('Should provide access to the schema', function () {
            table.getSchema().getName().should.equal("schema");
        });
        it('Should provide access to the session', function () {
            table.getSession().should.deep.equal(session);
        });

        function createResponse(protocol, row) {
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
                name: "_doc",
                table: "table",
                schema: "schema"
            }, Encoding.serverMessages));
            if (row) {
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, {field: ["\x01"]}, Encoding.serverMessages));
            }
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, Encoding.serverMessages));
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
        }

        it('should return true if exists in database', function () {
            const promise = table.existsInDatabase();
            createResponse(session._client, true);
            return promise.should.eventually.equal(true);
        });
        it('should return false if it doesn\'t exists in database', function () {
            const promise = table.existsInDatabase();
            createResponse(session._client, false);
            return promise.should.eventually.equal(false);
        });

        it('should return true if table is a view', function () {
            const promise = table.isView();
            createResponse(session._client, true);
            return promise.should.eventually.equal(true);
        });
        it('should return false if table is no view', function () {
            const promise = table.isView();
            createResponse(session._client, false);
            return promise.should.eventually.equal(false);
        });

        it('should return true for good drop', function () {
            const promise = table.drop();
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            return promise.should.eventually.equal(true);
        });
        it('should fail for bad drop', function () {
            const promise = table.drop();
            session._client.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, { code: 1, sql_state: 'HY000', msg: 'Invalid'}, Encoding.serverMessages));
            return promise.should.be.rejected;
        });
        it('should hide internals from inspect output', function () {
            table.inspect().should.deep.equal({ schema: "schema", table: "table" });
        });
    });
});