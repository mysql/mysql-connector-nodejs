'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/fixtures');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration document collection add', () => {
    let session, schema, collection;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test');
    });

    beforeEach('update context', () => {
        collection = schema.getCollection('test');
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('with a single call', () => {
        it('should add documents provided as an array', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            let actual = [];

            return collection
                .add(documents)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });

        it('should add documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            let actual = [];

            return collection
                .add(documents[0], documents[1])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });
    });

    context('with multiple calls', () => {
        it('should add documents provided as an array', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'qux' }];
            let actual = [];

            return collection
                .add(documents[0])
                .add([documents[1], documents[2]])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });

        it('should add documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'qux' }];
            let actual = [];

            return collection
                .add(documents[0])
                .add(documents[1], documents[2])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });
    });

    context('with an empty array', () => {
        it('should not throw an error if the collection exists', () => {
            return expect(collection.add([]).execute()).to.not.be.rejected;
        });

        it('should not throw an error if the collection does not exist', () => {
            const promise = schema
                .dropCollection('test')
                .then(() => {
                    return collection.add([]).execute();
                });

            return expect(promise).to.not.be.rejected;
        });
    });

    context('uuid generation', () => {
        it('should generate a V1 UUID as the document id by default', () => {
            let actual = [];

            return collection
                .add({ foo: 'bar' })
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id).to.match(/^[A-F0-9]{32}$/));
        });

        it('should not generate a v1 UUID if the document already provides an id', () => {
            const documents = [{ _id: 'foo', name: 'bar' }];
            let actual = [];

            return collection
                .add(documents[0])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(documents));
        });

        it('should generate the random node identifier once per session', () => {
            let actual = [];

            return collection
                .add([{ name: 'foo' }, { name: 'bar' }])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id.substring(0, 12)).to.equal(actual[1]._id.substring(0, 12)));
        });
    });
});
