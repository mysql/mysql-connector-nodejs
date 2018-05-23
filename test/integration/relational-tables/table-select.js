'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');
const properties = require('test/properties');

describe('@integration relational table select', () => {
    let session, schema;

    beforeEach('set context', () => {
        return fixtures.createDatabase().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    beforeEach('create table', () => {
        return session.sql(`CREATE TABLE ${properties.schema}.test (
            id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            age INT)`).execute();
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('without projection', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['id', 'name', 'age'])
                .values([1, 'bar', 23])
                .values([2, 'foo', 42])
                .execute();
        });

        it('should include all columns without projection', () => {
            const expected = [[1, 'bar', 23], [2, 'foo', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select()
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.include.members(expected));
        });
    });

    context('with projection', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['id', 'name', 'age'])
                .values([1, 'bar', 23])
                .values([2, 'foo', 42])
                .execute();
        });

        it('should include only columns provided as an expression array', () => {
            const expected = [['bar', 23], ['foo', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select(['name', 'age'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.include.members(expected));
        });

        it('should include only columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select('name', 'age')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.include.members(expected));
        });
    });

    context('with order', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'foo', 23])
                .values([3, 'bar', 23])
                .execute();
        });

        it('should sort by columns provided as an expression array', () => {
            const expected = [['foo', 23], ['foo', 42], ['bar', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select('name', 'age')
                .orderBy(['name desc', 'age asc'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should sort by columns provided as expression arguments', () => {
            const expected = [['foo', 42], ['foo', 23], ['bar', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select('name', 'age')
                .orderBy('age desc', 'name desc')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with grouping', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 42])
                .values([4, 'foo', 23])
                .values([5, 'bar', 23])
                .values([6, 'bar', 42])
                .execute();
        });

        it('should group columns provided as an expression array', () => {
            const expected = [['bar', 42], ['bar', 23], ['foo', 42], ['foo', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select('name', 'age')
                .groupBy(['name', 'age'])
                // MySQL 8 does not ensure GROUP BY order
                .orderBy(['name ASC', 'age DESC'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should group columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 23], ['bar', 42], ['foo', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select('name', 'age')
                .groupBy('age', 'name')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy('age ASC', 'name ASC')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with grouping criteria', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'foo', 42])
                .values([4, 'foo', 23])
                .values([5, 'bar', 23])
                .values([6, 'bar', 42])
                .execute();
        });

        it('should group columns provided as an expression array', () => {
            const expected = [['bar', 42], ['foo', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select('name', 'age')
                .groupBy(['name', 'age'])
                .having('age > 23')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy(['name ASC', 'age DESC'])
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should group columns provided as expression arguments', () => {
            const expected = [['bar', 23], ['foo', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select('name', 'age')
                .groupBy('age', 'name')
                .having('age = 23')
                // MySQL 8 does not ensure GROUP BY order
                .orderBy('age ASC', 'name ASC')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'baz', 42])
                .values([4, 'qux', 23])
                .values([5, 'quux', 23])
                .execute();
        });

        it('should return a given number of row', () => {
            const expected = [[1, 'foo', 42], [2, 'bar', 23], [3, 'baz', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select()
                .limit(3)
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should return the rows after a given offset', () => {
            const expected = [[3, 'baz', 42], [4, 'qux', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select()
                .limit(2)
                .offset(2)
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        beforeEach('add fixtures', () => {
            return schema
                .getTable('test')
                .insert(['id', 'name', 'age'])
                .values([1, 'foo', 42])
                .values([2, 'bar', 23])
                .values([3, 'baz', 42])
                .execute();
        });

        it('should return all documents that match a criteria specified by a grouped expression', () => {
            const expected = [[1, 'foo', 42], [3, 'baz', 42]];
            let actual = [];

            return schema
                .getTable('test')
                .select()
                .where("name in ('foo', 'baz')")
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should return all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [[2, 'bar', 23]];
            let actual = [];

            return schema
                .getTable('test')
                .select()
                .where('age not in (50, 42)')
                .orderBy('id')
                .execute(row => actual.push(row))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
