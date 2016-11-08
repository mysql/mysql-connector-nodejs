"use strict";

/*global
 describe, context, beforeEach, afterEach, it, chai
 */
chai.should();
const expect = require('chai').expect,
    mysqlx = require('../../'),
    properties = require('./properties');

describe('tests with session', function () {
    let sessionPromise, schema;

    beforeEach('get session', function () {
        sessionPromise = mysqlx.getNodeSession(properties).then(s => {
            return s.createSchema(properties.schema).then((sch) => {
                schema = sch;
                return s;
            });
        });
        return sessionPromise;
    });
    
    afterEach('close session', function () {
        return sessionPromise.then((session) => {
            return Promise.all([
                session.dropSchema(properties.schema),
                session.close()
            ]);
        });
    });
    
    it('should list created collection', function () {
        const collectionName = "testcollection",
            expected = { "testcollection": schema.getCollection(collectionName) };

        return Promise.all([
            schema.createCollection(collectionName),
            schema.getCollections().should.eventually.deep.equal(expected),
            schema.dropCollection(collectionName),
            schema.getCollections().should.eventually.deep.equal({})
        ]).should.be.fullfilled;
    });
    
    it('should retrieve an object stored into the database', function (done) {
        const collectionName = "testcollection",
            collection = schema.getCollection(collectionName),
            document = {
                _id: "efefevvr",
                here: {
                    we: "do",
                    have: 1,
                    great: "object"
                }
            },
            rowcb = chai.spy();


        expect(Promise.all([
            schema.createCollection(collectionName),
            collection.add(document).execute(),
            collection.find().execute(rowcb),
            schema.dropCollection(collectionName)
        ]).then(() => {
            rowcb.should.be.called.once.with(document);
            return true;
        })).to.notify(done);
    });
    
    it('should retrieve an modified object stored into the database', function (done) {
        const collectionName = "testcollection",
            collection = schema.getCollection(collectionName),
            initialDocument = {
                _id: "efefevvr",
                here: {
                    we: "do",
                    have: 1,
                    great: "object"
                }
            },
            resultDocument = {
                _id: "efefevvr",
                here: "all is gone"
            },
            rowcb = chai.spy();


        expect(Promise.all([
            schema.createCollection(collectionName),
            collection.add(initialDocument).execute(),
            collection.modify("$._id == '"+initialDocument._id+"'").set("$.here", "all is gone").execute(),
            collection.find().execute(rowcb),
            schema.dropCollection(collectionName)
        ]).then(() => {
            rowcb.should.be.called.once.with(resultDocument);
            return true;
        })).to.notify(done);
    });
    
    it('should not retrieve an deleted object', function (done) {
        const collectionName = "testcollection",
            collection = schema.getCollection(collectionName),
            document = {
                _id: "efefevvr",
                here: {
                    we: "do",
                    have: 1,
                    great: "object"
                }
            },
            rowcb = chai.spy();


        expect(Promise.all([
            schema.createCollection(collectionName),
            collection.add(document).execute(),
            collection.find().execute(rowcb),
            collection.remove("$._id == '"+document._id+"'").execute(),
            collection.find().execute(rowcb),
            schema.dropCollection(collectionName)
        ]).then(() => {
            rowcb.should.be.called.once.with(document);
            return true;
        })).to.notify(done);
    });
    
    it('should respect limit when deleting objects', function (done) {
        const collectionName = "testcollection",
            collection = schema.getCollection(collectionName),
            document1 = {
                _id: "document1",
            },
            document2 = {
                _id: "document2",
            },
            rowcb = chai.spy();


        expect(Promise.all([
            schema.createCollection(collectionName),
            collection.add([document1, document2]).execute(),
            collection.remove().limit(1).execute(),
            collection.find().execute(rowcb),
            schema.dropCollection(collectionName)
        ]).then(() => {
            rowcb.should.be.called.once.with(document2);
            return true;
        })).to.notify(done);
    });
});

