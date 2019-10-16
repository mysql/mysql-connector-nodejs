'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('removing documents from a collection', () => {
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

    context('with truthy condition', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes all documents from a collection', () => {
            let actual = [];

            return collection
                .remove('true')
                .execute()
                .then(() => collection.find().execute(doc => {
                    if (!doc) {
                        return;
                    }

                    actual.push(doc);
                }))
                .then(() => expect(actual).to.be.empty);
        });
    });

    context('with filtering condition', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes the documents from a collection that match the criteria', () => {
            const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('name = "foo"')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes the documents from a collection that match a multi-stage bindable criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('name = :name && _id = :id')
                .bind('id', '2')
                .bind('name', 'bar')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes the documents from a collection that match an object bindable criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('name = :name && _id = :id')
                .bind({ id: '2', name: 'bar' })
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes a given number of documents', () => {
            const expected = [{ _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('true')
                .limit(2)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('single document removal', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes an existing document with the given id', () => {
            const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .removeOne('1')
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('does nothing if no document exists with the given id', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .removeOne('4')
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(0);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes all documents that match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '2', name: 'bar' }];
            let actual = [];

            return collection
                .remove("_id in ('1', '3')")
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove("_id not in ('1', '3')")
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('removal order', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', age: 23 })
                .add({ _id: '2', name: 'bar', age: 42 })
                .add({ _id: '3', name: 'baz', age: 23 })
                .execute();
        });

        it('removes documents with a given order provided as an expression array', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar', age: 42 }];
            const actual = [];

            return collection
                .remove('true')
                .limit(1)
                .sort(['age ASC', 'name ASC'])
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes documents with a given order provided as multiple expressions', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }];
            const actual = [];

            return collection
                .remove('true')
                .limit(2)
                .sort('age DESC', 'name ASC')
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30401962 affected items', () => {
        beforeEach('add fixtures', () => {
            return collection.add({ name: 'foo' }, { name: 'bar' }, { name: 'baz' })
                .execute();
        });

        context('without limit', () => {
            it('returns the number of documents that have been removed from the collection', () => {
                return collection.remove('true')
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
            });
        });

        context('with limit', () => {
            it('returns the number of documents that have been removed from the collection', () => {
                const limit = 2;

                return collection.remove('true')
                    .limit(limit)
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(limit));
            });
        });
    });
});
