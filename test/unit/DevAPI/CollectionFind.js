"use strict";

/*global
 describe, beforeEach, afterEach, it, Server, Messages, Client, chai, mysqlxtest
 */

function produceResultSet(protocol, rowCount) {
    const result = new Server.ResultSet(data => protocol.handleNetworkFragment(data));
    result.beginResult([{
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.BYTES,
        name: "_doc",
        original_name: "_doc",
        table: "table",
        original_table: "original_table",
        schema: "schema",
        content_type: 2 /* JSON */
    }, {
        type: Messages.messages['Mysqlx.Resultset.ColumnMetaData'].enums.FieldType.SINT,
        name: "_doc",
        original_name: "_doc",
        table: "table",
        original_table: "original_table",
        schema: "schema"
    }]);

    const fields = ["{\"foo\":\"bar\"}\0", "\x02"];
    for (let r = 0; r < rowCount; ++r) {
        result.row(fields);
    }
    result.finalize();
}

describe('DevAPI Collection Find', function () {
    let session, collection, spy, origFind;

    beforeEach('get Session', function (done) {
        return mysqlxtest.getNullSession().then(function (s) {
            session = s;
            collection = session.getSchema("schema").getCollection("collection");
            done();
        }).catch(function (err) {
            done(err);
        });
    });

    beforeEach('create spy', function () {
        spy = chai.spy(Client.prototype.crudFind);
        origFind = Client.prototype.crudFind;
        Client.prototype.crudFind = spy;
    });

    afterEach('reset spy', function () {
        if (origFind) {
            Client.prototype.crudFind = origFind;
        }
    });

    it('should pass the expression through', function () {
        collection.find("1 == 1").execute();
        spy.should.be.called.once.with(session, "schema", "collection", Client.dataModel.DOCUMENT, [], "1 == 1", undefined, undefined, undefined);
    });
    it('should allow to set a limit', function () {
        collection.find().limit(10, 0).execute();
        spy.should.be.called.once.with(session, "schema", "collection", Client.dataModel.DOCUMENT, [], undefined, {count: 10, offset: 0.0}, undefined, undefined);
    });
    it('should allow to set an offset', function () {
        collection.find().limit(10, 10).execute();
        spy.should.be.called.once.with(session, "schema", "collection", Client.dataModel.DOCUMENT, [], undefined, {count: 10, offset: 10}, undefined, undefined);
    });
    it('should not allow to set a negative limit', function () {
        (function () {
            collection.find().limit(-10).execute();
        }).should.throw(/Limit can't be negative/);
    });
    it('should not allow to set an negative offset', function () {
        (function () {
            collection.find().limit(10, -10).execute();
        }).should.throw(/Offset can't be negative/);
    });
    it('should resolve with zero rows', function () {
        const rowcb = chai.spy(),
            promise = collection.find().execute(rowcb);
        produceResultSet(session._client, 0);
        rowcb.should.not.be.called;
        return promise.should.be.fullfilled;
    });
    it('should return only the first column', function () {
        const rowcb = chai.spy(),
            promise = collection.find().execute(rowcb);
        produceResultSet(session._client, 1);
        rowcb.should.be.called.once.with({foo: 'bar'});
        return promise.should.be.fullfilled;
    });
    it('should return multiple rows', function () {
        const rowcb = chai.spy(),
            promise = collection.find().execute(rowcb);
        produceResultSet(session._client, 10);
        rowcb.should.be.called.exactly(10).with({foo: 'bar'});
        return promise.should.be.fullfilled;
    });
    it('should send the data over the wire ;-)');
});
