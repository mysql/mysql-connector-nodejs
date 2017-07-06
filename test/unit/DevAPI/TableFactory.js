'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const ColumnDefinition = require('lib/DevAPI/ColumnDefinition');
const Schema = require('lib/DevAPI/Schema');
const TableFactory = require('lib/DevAPI/TableFactory');
const expect = require('chai').expect;
const tableSelect = require('lib/DevAPI/TableSelect');

describe('TableFactory', () => {
    context('as()', () => {
        it('should use expression defined by the input string', () => {
            const expression = 'foo';
            const factory = (new TableFactory()).as(expression);

            expect(factory._as).to.equal(expression);
        });

        it('should use the view definition when the argument is a TableSelect operation', () => {
            const schema = new Schema(null, 'foo');
            const operation = tableSelect(null, schema, 'bar', ['baz', 'qux']);
            const factory = (new TableFactory()).as(operation);

            expect(factory._as).to.equal(operation.getViewDefinition());
        });

        it('should throw error if fields were manually set before', () => {
            const factory = new TableFactory();
            const column = new ColumnDefinition();

            expect(() => factory.addColumn(column).as('bar')).to.throw("Can't use as after manually setting fields");
        });
    });
});
