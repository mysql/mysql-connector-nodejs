'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const collectionFind = require('lib/DevAPI/CollectionFind');
const ViewFactory = require('lib/DevAPI/ViewFactory');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const tableSelect = require('lib/DevAPI/TableSelect');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('ViewFactory', () => {
    context('definedAs()', () => {
        it('should throw an error for collection queries', () => {
            const origin = new ViewFactory();
            const query = collectionFind();

            expect(() => (origin).definedAs(query)).to.throw();
        });
    });

    context('execute()', () => {
        let getName, sqlStmtExecute;

        beforeEach('create fakes', () => {
            getName = td.function();
            sqlStmtExecute = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should force immutable definitions', () => {
            const getSession = td.function();
            const schema = { getName, getSession };
            const query = tableSelect(null, schema, 'bar', ['qux', 'quux']);

            td.when(getName()).thenReturn('foo');
            td.when(getSession()).thenReturn({ _client: { sqlStmtExecute } });

            const origin = (new ViewFactory(schema, 'baz')).definedAs(query);
            const statement = 'SELECT qux, quux FROM foo.bar';
            const view = `CREATE  ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW \`foo\`.\`baz\` AS ${statement} WITH CASCADED CHECK OPTION`;

            td.when(sqlStmtExecute(view), { ignoreExtraArgs: true }).thenResolve();

            query.orderBy('qux desc');

            return expect(origin.execute()).to.eventually.be.true;
        });
    });
});
