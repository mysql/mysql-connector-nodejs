'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional collection add', () => {
    let schema, session, collection;

    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(config)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('with a single call', () => {
        it('should add documents provided as an array', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];
            let actual = [];

            return collection
                .add(documents)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
                });
        });

        it('should add documents provided as multiple arguments', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }];
            let actual = [];

            return collection
                .add(documents[0], documents[1])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
                });
        });
    });

    context('with multiple calls', () => {
        it('should add documents provided as an array', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }, { name: 'baz', age: 50 }];
            let actual = [];

            return collection
                .add(documents[0])
                .add([documents[1], documents[2]])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
                });
        });

        it('should add documents provided as multiple arguments', () => {
            const documents = [{ name: 'foo', age: 23 }, { name: 'bar', age: 42 }, { name: 'baz', age: 50 }];
            let actual = [];

            return collection
                .add(documents[0])
                .add(documents[1], documents[2])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'age', 'name'));
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
        it('should generate a UUID as the document id by default', () => {
            const actual = [];

            return collection
                .add({ name: 'foo' })
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id).to.match(/^[a-f0-9]{28,32}$/));
        });

        it('should not generate a UUID if the document already provides an id', () => {
            const documents = [{ _id: '1', name: 'foo' }];
            const actual = [];

            return collection
                .add(documents[0])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(documents));
        });

        it('should generate the random node identifier once per session', () => {
            const actual = [];

            return collection
                .add([{ name: 'foo' }, { name: 'bar' }])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id.substring(0, 12)).to.equal(actual[1]._id.substring(0, 12)));
        });

        it('should generate sequential UUIDs if some documents already provide an id', () => {
            const documents = [{ name: 'foo' }, { _id: '1', name: 'bar' }, { name: 'baz' }];
            const actual = [];

            return collection
                .add(documents[0])
                .execute()
                .then(() => collection.add(documents[1]).execute())
                .then(() => collection.add(documents[2]).execute())
                .then(() => {
                    return collection
                        .find('name = "foo" OR name = "baz"')
                        .sort('name DESC')
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => {
                    expect(actual).to.have.lengthOf(2);

                    /* eslint-disable node/no-deprecated-api */
                    const firstId = new Buffer(actual[0]._id, 'hex');
                    const lastId = new Buffer(actual[1]._id, 'hex');
                    /* eslint-enable node/no-deprecated-api */

                    expect(firstId.readUInt8(firstId.length - 1)).to.equal(lastId.readUInt8(lastId.length - 1) - 1);
                });
        });

        it('should return the list of server generated ids on the result', () => {
            const documents = [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }];
            const actual = [];

            let ids = [];

            return collection
                .add(documents)
                .execute()
                .then(result => {
                    ids = result.getGeneratedIds();
                })
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => {
                    expect(actual.map(doc => doc._id)).to.deep.equal(ids);
                });
        });
    });
});
