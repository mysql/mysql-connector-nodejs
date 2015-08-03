var chai = require('chai'),
    should = chai.should(),
    spies = require('chai-spies');
var Protocol = require('../../lib/Protocol');
var Session = require('../../lib/DevAPI/Session');
var Schema = require('../../lib/DevAPI/Schema');

chai.use(spies);

var nullStream = {
    on: function () {},
    write: function () {}
};

describe('DevAPI Collection Add', function () {
    it('should request protocol to add one item', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        var session = new Session({});
        session._protocol = new Protocol(nullStream); /* TODO - this is hack */
        session.getSchema("schema").getCollection("collection").add({ _id: 12 }).execute();

        spy.should.be.called.once.with("schema", "collection", [{ _id: 12}]);
    });
    it('should request protocol to add an array of items', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        var session = new Session({});
        session._protocol = new Protocol(nullStream); /* TODO - this is hack */
        session.getSchema("schema").getCollection("collection").add([{ _id: 12 }, { _id: 34 }]).execute();

        spy.should.be.called.once.with("schema", "collection", [{ _id: 12}, { _id: 34 }]);
    });
    it('should request protocol to add items passed via varargs', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        var session = new Session({});
        session._protocol = new Protocol(nullStream); /* TODO - this is hack */
        session.getSchema("schema").getCollection("collection").add({ _id: 12 }, { _id: 34 }).execute();

        spy.should.be.called.once.with("schema", "collection", [{ _id: 12}, { _id: 34 }]);
    });
    it('should create an _id field if none was provided', function () {
        var spy = chai.spy(Protocol.prototype.crudInsert);
        Protocol.prototype.crudInsert = spy;

        var doc = { foo: 12 };

        var session = new Session({});
        session._protocol = new Protocol(nullStream); /* TODO - this is hack */
        session.getSchema("schema").getCollection("collection").add(doc).execute();

        spy.should.be.called.once();
        should.exist(doc._id);
    });
});
