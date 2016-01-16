"use strict";

/*global
 describe, beforeEach, afterEach, it
 */
var chai = require('chai'),
    should = chai.should(),
    spies = require('chai-spies');
var Protocol = require('../../lib/Protocol'),
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

function produceResultSet(protocol, rowcount) {
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
        name: "_doc",
        original_name: "_doc",
        table: "table",
        original_table: "original_table",
        schema: "schema"
    }, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_COLUMN_META_DATA, {
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
        name: "_doc",
        original_name: "_doc",
        table: "table",
        original_table: "original_table",
        schema: "schema"
    }, protocol.serverMessages));

    let fields = ["\x01", "\x02"];
    for (let i = 0; i < rowcount; ++i) {
        protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_ROW, {field: fields}, protocol.serverMessages));
    }
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.RESULTSET_FETCH_DONE, {}, protocol.serverMessages));
    protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, protocol.serverMessages));
}

describe('DevAPI Collection Find', function () {
    let session, collection, spy, origFind;

    beforeEach('get Session', function (done) {
        return mysqlx.getSession({
            authMethod: "NULL",
            socketFactory: NullStreamFactory
        }).then(function (s) {
            session = s;
            collection = session.getSchema("schema").getCollection("collection");
            done();
        }).catch(function (err) {
            done(err);
        });
    });

    beforeEach('create spy', function () {
        spy = chai.spy(Protocol.prototype.crudFind);
        origFind = Protocol.prototype.crudFind;
        Protocol.prototype.crudFind = spy;
    });

    afterEach('reset spy', function () {
        if (origFind) {
            Protocol.prototype.crudFind = origFind;
        }
    });

    it('should pass the expression through', function () {
        collection.find("1 == 1").execute();
        spy.should.be.called.once.with(session, "schema", "collection", Protocol.dataModel.DOCUMENT, [], "1 == 1", undefined, undefined, undefined);
    });
    it('should allow to set a limit', function () {
        collection.find().limit(10, 0).execute();
        spy.should.be.called.once.with(session, "schema", "collection", Protocol.dataModel.DOCUMENT, [], undefined, {count: 10, offset: .0}, undefined, undefined);
    });
    for (let i = 0; i < 3; ++i) {
        it('should return only the first column (' + i + ' rows)', function () {
            const rowcb = chai.spy(),
                promise = collection.find().execute(rowcb);
            produceResultSet(session._protocol, i);
            rowcb.should.be.called.exactly(i);
            return promise.should.be.fullfilled;
        });
    }
});
