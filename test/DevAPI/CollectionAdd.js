"use strict";

var chai = require('chai'),
    should = chai.should(),
    spies = require('chai-spies');
var Protocol = require('../../lib/Protocol');
var mysqlx = require('../../');
var NullAuth = require('../../lib/Authentication/NullAuth');

chai.use(spies);

var nullStream = {
    on: function () {},
    write: function () {}
};

var NullStreamFactory = {
    ceateSocket: function () {
        return nullStream;
    }
};

function getTestSession() {
    return mysqlx.getSession({
        auth_method: "NullAuth",
        socket_factory: NullStreamFactory
    });
}

describe('DevAPI Collection Add', function () {
    it('should request protocol to add one item', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        return getTestSession().then(function (session) {
            var session = new Session({});
            session.getSchema("schema").getCollection("collection").add({_id: 12}).execute();

            spy.should.be.called.once.with("schema", "collection", [{_id: 12}]);

            return true;
        }).should.be.fullfilled;
    });
    it('should request protocol to add an array of items', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        return getTestSession().then(function (session) {
            session.getSchema("schema").getCollection("collection").add([{_id: 12}, {_id: 34}]).execute();

            spy.should.be.called.once.with("schema", "collection", [{_id: 12}, {_id: 34}]);
        }).should.be.fullfilled;
    });
    it('should request protocol to add items passed via varargs', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        return getTestSession().then(function (session) {
            session.getSchema("schema").getCollection("collection").add({_id: 12}, {_id: 34}).execute();

            spy.should.be.called.once.with("schema", "collection", [{_id: 12}, {_id: 34}]);
        }).should.be.fullfilled;
    });
    it('should create an _id field if none was provided', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        var doc = { foo: 12 };

        return getTestSession().then(function (session) {
            session.getSchema("schema").getCollection("collection").add(doc).execute();

            spy.should.be.called.once();
            should.exist(doc._id);
        }).should.be.fullfilled;
    });
});
