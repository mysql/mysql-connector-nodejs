'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');
const mysqlx = require('index');

describe('@integration document collection find', () => {
    let session, schema, collection;

    beforeEach('set context', () => {
        return fixtures.createDatabase().then(suite => {
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

    context('without query', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('should return all documents in the database', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
            let actual = [];

            return collection
                .find()
                .execute(doc => {
                    actual.push(doc);
                })
                .then(() => {
                    expect(actual).to.have.lengthOf(expected.length);
                    expect(actual).to.deep.include.all.members(expected);
                });
        });
    });

    context('with binding query', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: 'foo', foo: 'bar', size: 42 })
                .add({ _id: 'bar', bar: 'baz', size: 23 })
                .execute();
        });

        it('should return documents that match a criteria specified with named parameter pairs', () => {
            const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];
            let actual = [];

            return collection
                .find('size = :size')
                .bind('size', 42)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should return documents that match a criteria specified with a named parameter mapping', () => {
            const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];
            let actual = [];

            return collection
                .find('size = :size')
                .bind({ size: 42 })
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with projection', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', size: 42 })
                .add({ _id: '2', name: 'bar', size: 23 })
                .execute();
        });

        it('should include only columns provided as an expression array', () => {
            const expected = [{ name: 'foo', size: 42 }, { name: 'bar', size: 23 }];
            let actual = [];

            return collection
                .find()
                .fields(['name', 'size'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should include only columns provided as expression arguments', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
            let actual = [];

            return collection
                .find()
                .fields('_id', 'name')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should perform computed projections', () => {
            const expected = [{ name: 'bar', newSize: 24 }, { name: 'foo', newSize: 43 }];
            let actual = [];

            return collection
                .find()
                .fields(mysqlx.expr('{ "name": name, "newSize": size + 1 }'))
                .sort('size ASC')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: 1, name: 'foo' })
                .add({ _id: 2, name: 'bar' })
                .add({ _id: 3, name: 'baz' })
                .add({ _id: 4, name: 'qux' })
                .add({ _id: 5, name: 'quux' })
                .execute();
        });

        it('should return a given number of documents', () => {
            const expected = [{ _id: 1, name: 'foo' }, { _id: 2, name: 'bar' }, { _id: 3, name: 'baz' }];
            let actual = [];

            return collection
                .find()
                .limit(3)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should return the documents after a given offset', () => {
            const expected = [{ _id: 3, name: 'baz' }, { _id: 4, name: 'qux' }];
            let actual = [];

            return collection
                .find()
                .limit(2)
                .offset(2)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('single document retrieval', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('should return an existing document with the given id', () => {
            const expected = { _id: '1', name: 'foo' };

            return collection
                .getOne('1')
                .then(doc => expect(doc).to.deep.equal(expected));
        });

        it('should return null if a document with the given id does not exist', () => {
            return collection
                .getOne('3')
                .then(doc => expect(doc).to.be.null);
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

        it('should return all documents that match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .find("_id in ('1', '3')")
                .execute(doc => doc && actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should return all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '2', name: 'bar' }];
            let actual = [];

            return collection
                .find("_id not in ('1', '3')")
                .execute(doc => doc && actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('sorting results', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', age: 23 })
                .add({ _id: '2', name: 'bar', age: 42 })
                .add({ _id: '3', name: 'baz', age: 23 })
                .execute();
        });

        it('should sort the results according the order clauses provided as an expression array', () => {
            const expected = [{ _id: '3', name: 'baz', age: 23 }, { _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar', age: 42 }];
            const actual = [];

            return collection
                .find()
                .sort(['age ASC', 'name ASC'])
                .execute(doc => doc && actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should sort the results according the order clauses provided as expression arguments', () => {
            const expected = [{ _id: '2', name: 'bar', age: 42 }, { _id: '3', name: 'baz', age: 23 }, { _id: '1', name: 'foo', age: 23 }];
            const actual = [];

            return collection
                .find()
                .sort('age DESC', 'name ASC')
                .execute(doc => doc && actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
