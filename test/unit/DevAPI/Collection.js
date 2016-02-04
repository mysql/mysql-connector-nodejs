"use strict";

/*global
 describe, context, beforeEach, afterEach, it
 */
chai.should();

describe('DevAPI', function () {
    context('Collection', function () {
        let session, collection;
        beforeEach('get Session', function (done) {
            return mysqlxtest.getNullSession().then(function (s) {
                session = s;
                collection = session.getSchema("schema").getCollection("collection");
                done();
            }).catch(function (err) {
                done(err);
            });
        });


        it('Should know its name', function () {
            collection.getName().should.equal("collection");
        });

        it('Should provide access to the schema', function () {
            collection.getSchema().getName().should.equal("schema");
        });
        it('Should provide access to the session', function () {
            collection.getSession().should.deep.equal(session);
        });

        function createResponse(protocol, row) {
            protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
                name: "_doc",
                table: "table",
                schema: "schema"
            }, Encoding.serverMessages));
            if (row) {
                protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, {field: ["\x01"]}, Encoding.serverMessages));
            }
            protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, Encoding.serverMessages));
            protocol.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
        }

        it('should return true if exists in database', function () {
            const promise = collection.existsInDatabase();
            createResponse(session._client, true);
            return promise.should.eventually.equal(true);
        });
        it('should return false if it doesn\'t exists in database', function () {
            const promise = collection.existsInDatabase();
            createResponse(session._client, false);
            return promise.should.eventually.equal(false);
        });

        it('should return true for good drop', function () {
            const promise = collection.drop();
            session._client.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages));
            return promise.should.eventually.equal(true);
        });
        it('should fail for bad drop', function () {
            const promise = collection.drop();
            session._client.handleServerMessage(Encoding.encodeMessage(Messages.ServerMessages.ERROR, { code: 1, sql_state: 'HY000', msg: 'Invalid'}, Encoding.serverMessages));
            return promise.should.be.rejected;
        });
    });
});
