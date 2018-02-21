'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');
const properties = require('test/properties');

describe('@integration relational table insert', () => {
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

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('with an array of columns', () => {
        it('should insert values provided as an array', () => {
            const expected = [['foo', 23], ['bar', 42]];
            let actual = [];

            return table
                .insert(['name', 'age'])
                .values(expected[0])
                .values(expected[1])
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('age')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should insert values provided as multiple arguments', () => {
            const expected = [['foo', 23], ['bar', 42]];
            let actual = [];

            return table
                .insert(['name', 'age'])
                .values(expected[0][0], expected[0][1])
                .values(expected[1][0], expected[1][1])
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('age')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with multiple column arguments', () => {
        it('should insert values provided as an array', () => {
            const expected = [['foo', 23], ['bar', 42]];
            let actual = [];

            return table
                .insert('name', 'age')
                .values(expected[0])
                .values(expected[1])
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('age')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should insert values provided as multiple arguments', () => {
            const expected = [['foo', 23], ['bar', 42]];
            let actual = [];

            return table
                .insert('name', 'age')
                .values(expected[0][0], expected[0][1])
                .values(expected[1][0], expected[1][1])
                .execute()
                .then(() => {
                    return table
                        .select()
                        .orderBy('age')
                        .execute(row => actual.push(row));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    // TODO(Rui): remove support for this functionality since its not described by the EBNF.
    it('should insert values provided as a mapping object to each column', () => {
        const expected = [['foo', 23]];
        let actual = [];

        return table
            .insert({ name: 'foo', age: 23 })
            .execute()
            .then(() => table.select().execute(row => actual.push(row)))
            .then(() => expect(actual).to.deep.equal(expected));
    });
});
