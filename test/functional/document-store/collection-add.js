'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('adding documents to a collection', () => {
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
        it('saves documents provided as an array', () => {
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

        it('saves documents provided as multiple arguments', () => {
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
        it('saves documents provided as an array', () => {
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

        it('saves documents provided as multiple arguments', () => {
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
        it('does not throw an error if the collection exists', () => {
            return collection.add([]).execute();
        });

        it('does not throw an error if the collection does not exist', () => {
            return schema.dropCollection('test')
                .then(() => collection.add([]).execute());
        });
    });

    context('uuid generation', () => {
        it('generates a UUID as the document id by default', () => {
            const actual = [];

            return collection
                .add({ name: 'foo' })
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id).to.match(/^[a-f0-9]{28,32}$/));
        });

        it('does not generate a UUID if the document already provides an id', () => {
            const documents = [{ _id: '1', name: 'foo' }];
            const actual = [];

            return collection
                .add(documents[0])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(documents));
        });

        it('generates the random node identifier once per session', () => {
            const actual = [];

            return collection
                .add([{ name: 'foo' }, { name: 'bar' }])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual[0]._id.substring(0, 12)).to.equal(actual[1]._id.substring(0, 12)));
        });

        it('generates sequential UUIDs if some documents already provide an id', () => {
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

        it('returns the list of server generated ids on the result', () => {
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

    context('BUG#29179767 JavaScript Date converted to empty object', () => {
        it('saves a JavaScript Date as a valid JSON value', () => {
            const now = new Date();
            const expected = [{ createdAt: now.toJSON() }];
            const actual = [];

            return collection.add({ name: 'foo', createdAt: now })
                .execute()
                .then(() => {
                    return collection.find('name = :name')
                        .fields('createdAt')
                        .bind('name', 'foo')
                        .execute(doc => actual.push(doc));
                })
                .then(() => {
                    expect(actual).to.deep.equal(expected);
                });
        });
    });
});
