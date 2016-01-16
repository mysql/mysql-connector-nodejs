"use strict";

/*global
 describe, context, beforeEach, afterEach, it
 */
var chai = require('chai'),
    should = chai.should(),
    spies = require('chai-spies');
var Client = require('../../lib/Protocol/Client'),
    Messages = require('../../lib/Protocol/Messages');
var mysqlx = require('../../');
var NullAuth = require('../../lib/Authentication/NullAuth');

chai.use(spies);

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

describe('DevAPI', function () {
    context('Table', function () {
        let session, table;
        beforeEach('get Session', function (done) {
            return mysqlx.getSession({
                authMethod: "NULL",
                socketFactory: NullStreamFactory
            }).then(function (s) {
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
            protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
                type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
                name: "_doc",
                table: "table",
                schema: "schema"
            }, protocol.serverMessages));
            if (row) {
                protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, {field: ["\x01"]}, protocol.serverMessages));
            }
            protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, protocol.serverMessages));
            protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, protocol.serverMessages));
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
    });
});