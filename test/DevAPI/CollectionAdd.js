"use strict";

/*global
  describe, beforeEach, afterEach, it
 */
var chai = require('chai'),
    should = chai.should(),
    spies = require('chai-spies');
var Protocol = require('../../lib/Protocol');
var mysqlx = require('../../');
var NullAuth = require('../../lib/Authentication/NullAuth');

chai.use(spies);

describe('DevAPI Collection Add', function () {
    var collection, spy, origInsert;

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

    beforeEach('get Session', function (done) {
        return mysqlx.getSession({
            authMethod: "NULL",
            socketFactory: NullStreamFactory
        }).then(function (session) {
            collection = session.getSchema("schema").getCollection("collection");
            done();
        }).catch(function (err) {
            done(err);
        });
    });

    beforeEach('create spy', function () {
        spy = chai.spy(Protocol.prototype.crudInsert);
        origInsert = Protocol.prototype.crudInsert;
        Protocol.prototype.crudInsert = spy;
    });

    afterEach('reset spy', function () {
        if (origInsert) {
            Protocol.prototype.crudInsert = origInsert;
        }
    });


    it('should request protocol to add one item', function () {
        collection.add({_id: 12}).execute();
        spy.should.be.called.once.with("schema", "collection", [[{_id: 12}]]);
    });

    it('should request protocol to add one item', function () {
        collection.add({_id: 12}).execute();
        spy.should.be.called.once.with("schema", "collection", [[{_id: 12}]]);
    });
    it('should request protocol to add an array of items', function () {
        collection.add([{_id: 12}, {_id: 34}]).execute();
        spy.should.be.called.once.with("schema", "collection", [[{_id: 12}], [{_id: 34}]]);
    });
    it('should request protocol to add items passed via varargs', function () {
        collection.add({_id: 12}, {_id: 34}).execute();
        spy.should.be.called.once.with("schema", "collection", [[{_id: 12}], [{_id: 34}]]);
    });
    it('should create an _id field if none was provided', function () {
        var doc = { foo: 12 };

        collection.add(doc).execute();

        spy.should.be.called.once();
        should.exist(doc._id);
    });
});