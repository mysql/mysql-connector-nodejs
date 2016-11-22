"use strict";

/*global
  describe, beforeEach, afterEach, it
 */
var should = chai.should();

describe('DevAPI Collection Add', function () {
    var collection, spy, origInsert;

    beforeEach('get Session', function () {
        return mysqlxtest.getNullSession().then(function (session) {
            collection = session.getSchema("schema").getCollection("collection");
        });
    });

    beforeEach('create spy', function () {
        spy = chai.spy(Client.prototype.crudInsert);
        origInsert = Client.prototype.crudInsert;
        Client.prototype.crudInsert = spy;
    });

    afterEach('reset spy', function () {
        if (origInsert) {
            Client.prototype.crudInsert = origInsert;
        }
    });


    it('should request protocol to add one item', function () {
        const doc = { _id: 12 };

        collection.add(doc).execute();
        spy.should.be.called.once.with("schema", "collection", [[JSON.stringify(doc)]]);
    });

    it('should request protocol to add one item', function () {
        const doc = { _id: 12 };

        collection.add(doc).execute();
        spy.should.be.called.once.with("schema", "collection", [[JSON.stringify(doc)]]);
    });

    it('should request protocol to add an array of items', function () {
        const docs = [{ _id: 12 }, { _id: 34 }];

        collection.add(docs).execute();
        spy.should.be.called.once.with("schema", "collection", [
            [JSON.stringify(docs[0])],
            [JSON.stringify(docs[1])]
        ]);
    });
    it('should request protocol to add items passed via varargs', function () {
        const docs = [{ _id: 12 }, { _id: 34 }];

        collection.add(docs[0], docs[1]).execute();
        spy.should.be.called.once.with("schema", "collection", [
            [JSON.stringify(docs[0])],
            [JSON.stringify(docs[1])]
        ]);
    });
    it('should create an _id field if none was provided', function () {
        var doc = { foo: 12 };

        collection.add(doc).execute();

        spy.should.be.called.once();
        should.exist(doc._id);
    });
    it('should use a provided generator to create _id field if needed', function () {
        return mysqlx.getSession({
            authMethod: "NULL",
            socketFactory: NullStreamFactory,
            idGenerator: function () { return "GENERATED"; }
        }).then(function (session) {
            collection = session.getSchema("schema").getCollection("collection");
            var doc = { foo: 12 };

            collection.add(doc).execute();

            spy.should.be.called.once();
            doc._id.should.equal("GENERATED");
        });
    });
    it('should return affected rows', function () {
        const promise = collection.add({_id: 3232}).execute().then(
            result => result.getAffectedRowsCount()
        );

        const result = new Server.ResultSet(data => collection.getSession()._client.handleNetworkFragment(data));
        result.sessionState(Messages.messages['Mysqlx.Notice.SessionStateChanged'].enums.Parameter.ROWS_AFFECTED, 1);
        result.finalize();

        return promise.should.eventually.deep.equal(1);
    });
    it('should return document\'s id', function () {
        const promise = collection.add({_id: 3232}).execute().then(
            result => result.getDocumentId()
        );

        const result = new Server.ResultSet(data => collection.getSession()._client.handleNetworkFragment(data));
        result.sessionState(Messages.messages['Mysqlx.Notice.SessionStateChanged'].enums.Parameter.ROWS_AFFECTED, 1);
        result.finalize();

        return promise.should.eventually.deep.equal(3232);
    });
    it('should return document\'s id (array form)', function () {
        const promise = collection.add({_id: 3232}).execute().then(
            result => result.getDocumentIds()
        );

        const result = new Server.ResultSet(data => collection.getSession()._client.handleNetworkFragment(data));
        result.sessionState(Messages.messages['Mysqlx.Notice.SessionStateChanged'].enums.Parameter.ROWS_AFFECTED, 1);
        result.finalize();

        return promise.should.eventually.deep.equal([3232]);
    });
    it('should return multiple document\'s ids', function () {
        const promise = collection.add({_id: 3232}).add({_id: 4321}).execute().then(
            result => result.getDocumentIds()
        );

        const result = new Server.ResultSet(data => collection.getSession()._client.handleNetworkFragment(data));
        result.sessionState(Messages.messages['Mysqlx.Notice.SessionStateChanged'].enums.Parameter.ROWS_AFFECTED, 1);
        result.finalize();

        return promise.should.eventually.deep.equal([3232, 4321]);
    });
    it('should return multiple generated document\'s ids', function () {
        const promise = collection.add({noid: 3232}).add({noid: 4321}).execute().then(
            result => result.getDocumentIds().length
        );

        const result = new Server.ResultSet(data => collection.getSession()._client.handleNetworkFragment(data));
        result.sessionState(Messages.messages['Mysqlx.Notice.SessionStateChanged'].enums.Parameter.ROWS_AFFECTED, 1);
        result.finalize();

        return promise.should.eventually.deep.equal(2);
    });
});