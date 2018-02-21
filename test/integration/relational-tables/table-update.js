'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');
const properties = require('test/properties');

describe('@integration relational table update', () => {
    let session, schema, table;

    beforeEach('set context', () => {
        return fixtures.createDatabase().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    beforeEach('create table', () => {
        return session.sql(`CREATE TABLE ${properties.schema}.test (
            name VARCHAR(255),
            age INT)`).execute();
    });

    beforeEach('update context', () => {
        table = schema.getTable('test');
    });

    beforeEach('add fixtures', () => {
        return schema
            .getTable('test')
            .insert(['name', 'age'])
            .values(['foo', 42])
            .values(['bar', 23])
            .values(['baz', 42])
            .execute();
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('with truthy condition', () => {
        it('should update all rows in a table without using `where()`', () => {
            const expected = [['bar', 50], ['baz', 50], ['foo', 50]];
            let actual = [];

            return table
                .update('true')
                .set('age', 50)
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('name ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should update all rows in a table using `where()`', () => {
            const expected = [['foo', 23], ['foo', 42], ['foo', 42]];
            let actual = [];

            return table
                .update()
                .set('name', 'foo')
                .where('true')
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('age ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with filtering condition', () => {
        it('should update the rows in a table that match the criteria defined without `where()`', () => {
            const expected = [['bar', 23], ['baz', 42], ['foo', 50]];
            let actual = [];

            return table
                .update()
                .where('name = "foo"')
                .set('age', 50)
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('age ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should update the rows in a table that match the criteria defined with `where()`', () => {
            const expected = [['bar', 23], ['foo', 42], ['foo', 42]];
            let actual = [];

            return table
                .update()
                .where('age = 42')
                .set('name', 'foo')
                .execute()
                .then(() => table.select().orderBy('age ASC').execute(row => actual.push(row)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        it('should update a given number of rows', () => {
            const expected = [['bar', 23], ['baz', 42], ['qux', 42]];
            let actual = [];

            return table
                .update('true')
                .set('name', 'qux')
                .limit(1)
                .orderBy('name DESC')
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('name ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        it('should update all documents that match a criteria specified by a grouped expression', () => {
            const expected = [['foo', 50], ['bar', 50], ['baz', 42]];
            let actual = [];

            return table
                .update()
                .where("name in ('foo', 'bar')")
                .set('age', 50)
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('age DESC', 'name DESC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should update all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [['baz', 42], ['foo', 42], ['qux', 23]];
            let actual = [];

            return table
                .update()
                .where('age not in (42, 50)')
                .set('name', 'qux')
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('name ASC')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
