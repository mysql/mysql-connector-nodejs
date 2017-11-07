'use strict';

/* eslint-env node, mocha */

const Column = require('lib/DevAPI/Column');
const expect = require('chai').expect;
const fixtures = require('test/fixtures');

// TODO(Rui): extract tests into proper self-contained suites.
describe('@integration relational miscellaneous tests', () => {
    let session, schema;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(Rui): use ES6 destructuring assignment for node >=6.0.0
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
            const actual = {};

            return session
                .executeSql('SELECT 1')
                .execute(row => { actual.row = row; }, meta => { actual.meta = meta; })
                .then(() => {
                    expect(actual).to.have.all.keys('meta', 'row');
                    expect(actual.meta).to.have.lengthOf(1);
                    expect(actual.meta[0]).to.be.an.instanceOf(Column);
                    expect(actual.meta[0].getType()).to.equal(1);
                    expect(actual.meta[0].getColumnLabel()).to.equal('1');
                    expect(actual.meta[0].getColumnName()).to.equal('');
                    expect(actual.meta[0].getTableLabel()).to.equal('');
                    expect(actual.meta[0].getTableName()).to.equal('');
                    expect(actual.meta[0].getSchemaName()).to.equal('');
                    expect(actual.meta[0].getLength()).to.equal(1);
                });
        });

        it('should handle the results using both callbacks provided in an object', () => {
            const actual = {};

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
                .then(() => {
                    expect(actual).to.have.all.keys('meta', 'row');
                    expect(actual.meta).to.have.lengthOf(1);
                    expect(actual.meta[0]).to.be.an.instanceOf(Column);
                    expect(actual.meta[0].getType()).to.equal(1);
                    expect(actual.meta[0].getColumnLabel()).to.equal('1');
                    expect(actual.meta[0].getColumnName()).to.equal('');
                    expect(actual.meta[0].getTableLabel()).to.equal('');
                    expect(actual.meta[0].getTableName()).to.equal('');
                    expect(actual.meta[0].getSchemaName()).to.equal('');
                    expect(actual.meta[0].getLength()).to.equal(1);
                });
        });
    });
});
