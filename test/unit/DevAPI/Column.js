'use strict';

/* eslint-env node, mocha */

const column = require('../../../lib/DevAPI/Column');
const expect = require('chai').expect;
const td = require('testdouble');

describe('Column', () => {
    after('reset fakes', () => {
        td.reset();
    });

    context('getCharacterSetName()', () => {
        it('returns the charset name', () => {
            const getCharset = td.function();
            td.when(getCharset()).thenReturn('foo');

            expect(column({ getCharset }).getCharacterSetName()).to.equal('foo');
        });
    });

    context('getCollationName()', () => {
        it('returns the collation name', () => {
            const getCollation = td.function();
            td.when(getCollation()).thenReturn('foo');

            expect(column({ getCollation }).getCollationName()).to.equal('foo');
        });
    });

    context('getColumnLabel()', () => {
        it('returns the column projected id or alias', () => {
            const getAlias = td.function();
            td.when(getAlias()).thenReturn('foo');

            expect(column({ getAlias }).getColumnLabel()).to.equal('foo');
        });
    });

    context('getColumnName()', () => {
        it('returns the column name', () => {
            const getName = td.function();
            td.when(getName()).thenReturn('foo');

            expect(column({ getName }).getColumnName()).to.equal('foo');
        });
    });

    context('getFractionalDigits()', () => {
        it('returns the number of fractional digits supported by the column type', () => {
            const getFractionalDigits = td.function();
            td.when(getFractionalDigits()).thenReturn('foo');

            expect(column({ getFractionalDigits }).getFractionalDigits()).to.equal('foo');
        });
    });

    context('getLength()', () => {
        it('returns the size of the column data type', () => {
            const getLength = td.function();
            td.when(getLength()).thenReturn('foo');

            expect(column({ getLength }).getLength()).to.equal('foo');
        });
    });

    context('getSchemaName()', () => {
        it('returns the name of the schema where the associated table belongs to', () => {
            const getSchema = td.function();
            td.when(getSchema()).thenReturn('foo');

            expect(column({ getSchema }).getSchemaName()).to.equal('foo');
        });
    });

    context('getTableLabel()', () => {
        it('returns the projected table id or alias', () => {
            const getTableAlias = td.function();
            td.when(getTableAlias()).thenReturn('foo');

            expect(column({ getTableAlias }).getTableLabel()).to.equal('foo');
        });
    });

    context('getTableName()', () => {
        it('returns the original table name', () => {
            const getTableName = td.function();
            td.when(getTableName()).thenReturn('foo');

            expect(column({ getTableName }).getTableName()).to.equal('foo');
        });
    });

    context('getType()', () => {
        it('returns the X DevAPI column type string', () => {
            const getTypeString = td.function();
            td.when(getTypeString()).thenReturn('foo');

            expect(column({ getTypeString }).getType()).to.equal('foo');
        });
    });

    context('isNumberSigned()', () => {
        it('checks if the column data type is signed a number', () => {
            const isSigned = td.function();
            td.when(isSigned()).thenReturn('foo');

            expect(column({ isSigned }).isNumberSigned()).to.equal('foo');
        });
    });

    context('isPadded()', () => {
        it('checks if the column data type enforces padding of its value', () => {
            const isFlagged = td.function();
            td.when(isFlagged()).thenReturn('foo');

            expect(column({ isFlagged }).isPadded()).to.equal('foo');
        });
    });
});
