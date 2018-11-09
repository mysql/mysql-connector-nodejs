'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

describe('finding documents in collections', () => {
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

    context('without criteria', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        context('with a callback', () => {
            it('includes all documents in the collection', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
                let actual = [];

                return collection.find()
                    .execute(doc => {
                        actual.push(doc);
                    })
                    .then(() => {
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);
                    });
            });

            it('does not fail when trying to use a pull-based cursor', () => {
                const noop = () => {};

                return collection.find()
                    .execute(noop)
                    .then(result => {
                        // eslint-disable-next-line no-unused-expressions
                        expect(result.fetchOne()).to.not.exist;
                        expect(result.fetchAll()).to.deep.equal([]);
                    });
            });
        });

        context('without a callback', () => {
            it('returns the first document in the resultset', () => {
                const expected = { _id: '1', name: 'foo' };

                return collection.find()
                    .sort('_id')
                    .execute()
                    .then(result => {
                        let actual = result.fetchOne();
                        expect(actual).to.deep.equal(expected);

                        actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(1);
                    });
            });

            it('returns all documents in the collection', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];

                return collection.find()
                    .execute()
                    .then(result => {
                        let actual = result.fetchAll();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.fetchAll();
                        return expect(actual).to.be.empty;
                    });
            });

            it('returns the resultset as an array', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];

                return collection.find()
                    .execute()
                    .then(result => {
                        let actual = result.toArray();
                        expect(actual).to.have.lengthOf(expected.length);
                        expect(actual).to.deep.include.all.members(expected);

                        actual = result.toArray();
                        expect(actual).to.have.lengthOf(expected.length);
                    });
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

        it('returns documents that match a criteria specified with named parameter pairs', () => {
            const expected = [{ _id: 'foo', foo: 'bar', size: 42 }];
            let actual = [];

            return collection
                .find('size = :size')
                .bind('size', 42)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns documents that match a criteria specified with a named parameter mapping', () => {
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

        it('includes only columns provided as an expression array', () => {
            const expected = [{ name: 'foo', size: 42 }, { name: 'bar', size: 23 }];
            let actual = [];

            return collection
                .find()
                .fields(['name', 'size'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('includes only columns provided as expression arguments', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }];
            let actual = [];

            return collection
                .find()
                .fields('_id', 'name')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('performs computed projections', () => {
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

        it('returns a given number of documents', () => {
            const expected = [{ _id: 1, name: 'foo' }, { _id: 2, name: 'bar' }, { _id: 3, name: 'baz' }];
            let actual = [];

            return collection
                .find()
                .limit(3)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('returns the documents after a given offset', () => {
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
                .add({ _id: 2, name: 'bar' })
                .execute();
        });

        context('when a document with a given id exists', () => {
            it('returns the document if _id is a String', () => {
                const expected = { _id: '1', name: 'foo' };

                return collection.getOne('1')
                    .then(doc => expect(doc).to.deep.equal(expected));
            });

            it('returns the document if _id is not a String', () => {
                const expected = { _id: 2, name: 'bar' };

                return collection.getOne(2)
                    .then(doc => expect(doc).to.deep.equal(expected));
            });
        });

        context('when a document with a given id does not exist', () => {
            it('returns null if the given id is a non-empty String', () => {
                return collection.getOne('3')
                    .then(doc => expect(doc).to.be.null);
            });

            it('returns null if a document id is an empty String', () => {
                return collection.getOne('')
                    .then(doc => expect(doc).to.be.null);
            });

            it('returns null if a document id is null', () => {
                return collection.getOne(null)
                    .then(doc => expect(doc).to.be.null);
            });

            it('returns null if a document id is not defined', () => {
                return collection.getOne()
                    .then(doc => expect(doc).to.be.null);
            });
        });
    });

    context('predicate expressions', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', list: [1, 4] })
                .add({ _id: '2', name: 'bar', list: [4, 7] })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        context('where the property value', () => {
            it('is part of a set of values being provided', () => {
                const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
                const actual = [];

                return collection.find("_id in ('1', '3')")
                    .fields('_id', 'name')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('is not part of a set of values being provided', () => {
                const expected = [{ _id: '2', name: 'bar' }];
                const actual = [];

                return collection.find("_id not in ('1', '3')")
                    .fields('_id', 'name')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('where a list of values being provided', () => {
            it('overlaps a list of values of a given document property', () => {
                const expected = [{ _id: '1' }];
                const actual = [];

                return collection.find('[1, 2, 3] OVERLAPS list')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('does not overlap a list of values of a given document property', () => {
                const expected = [{ _id: '1' }];
                const actual = [];

                return collection.find('[6, 7] NOT OVERLAPS list')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('where a list of values of a given document property', () => {
            it('overlaps a list of values being provided', () => {
                const expected = [{ _id: '1' }, { _id: '2' }];
                const actual = [];

                return collection.find('list OVERLAPS [4]')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('does not overlap a list of values being provided', () => {
                const expected = [{ _id: '1' }, { _id: '2' }];
                const actual = [];

                return collection.find('list NOT OVERLAPS [8, 9]')
                    .fields('_id')
                    .execute(doc => actual.push(doc))
                    .then(() => expect(actual).to.deep.equal(expected));
            });
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

        it('sorts the results according the order clauses provided as an expression array', () => {
            const expected = [{ _id: '3', name: 'baz', age: 23 }, { _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar', age: 42 }];
            const actual = [];

            return collection.find()
                .sort(['age ASC', 'name ASC'])
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('sorts the results according the order clauses provided as expression arguments', () => {
            const expected = [{ _id: '2', name: 'bar', age: 42 }, { _id: '3', name: 'baz', age: 23 }, { _id: '1', name: 'foo', age: 23 }];
            const actual = [];

            return collection.find()
                .sort('age DESC', 'name ASC')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#29766014', () => {
        const now = new Date();

        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', updatedAt: now })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('does not fail when a placeholder is assigned a JavaScript Date instance', () => {
            const expected = [{ _id: '1', name: 'foo', updatedAt: now.toJSON() }];
            const actual = [];

            return collection.find('updatedAt = :date')
                .bind('date', now)
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#29807792', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ name: 'foo', age: 42 })
                .add({ name: 'bar', age: 23 })
                .execute();
        });

        it('correctly encodes cast types', () => {
            const expected = [{ name: 'foo' }];
            const actual = [];

            return collection.find("CAST('42' AS UNSIGNED INTEGER) = age")
                .fields('name')
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
