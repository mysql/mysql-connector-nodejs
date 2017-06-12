'use strict';

/* eslint-env node, mocha */

const Column = require('lib/DevAPI/Column');
const expect = require('chai').expect;
const fixtures = require('test/fixtures');

// TODO(rui.quelhas): extract tests into proper self-contained suites.
describe('@integration relational miscellaneous tests', () => {
    let session, schema;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('raw SQL query', () => {
        it('should handle the results with a callback provided as an argument', () => {
            const expected = [1];
            let actual;

            return session
                .executeSql('SELECT 1')
                .execute(row => { actual = row; })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should handle the column metadata with a callback provided as an argument', () => {
            const expected = {
                meta: [new Column({
                    type: 1,
                    name: '1',
                    original_name: '',
                    table: '',
                    original_table: '',
                    schema: '',
                    catalog: 'def',
                    collation: '0',
                    fractional_digits: 0,
                    length: 1,
                    flags: 16
                })],
                row: [1]
            };
            let actual = {};

            return session
                .executeSql('SELECT 1')
                .execute(row => { actual.row = row; }, meta => { actual.meta = meta; })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should handle the results using both callbacks provided in an object', () => {
            const expected = {
                meta: [new Column({
                    type: 1,
                    name: '1',
                    original_name: '',
                    table: '',
                    original_table: '',
                    schema: '',
                    catalog: 'def',
                    collation: '0',
                    fractional_digits: 0,
                    length: 1,
                    flags: 16
                })],
                row: [1]
            };
            let actual = {};

            return session
                .executeSql('SELECT 1')
                .execute({
                    row (row) {
                        actual.row = row;
                    },
                    meta (meta) {
                        actual.meta = meta;
                    }
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
