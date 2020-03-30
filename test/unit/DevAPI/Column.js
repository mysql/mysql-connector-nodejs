'use strict';

/* eslint-env node, mocha */

const Resultset = require('../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb');
const expect = require('chai').expect;
const td = require('testdouble');

describe('Column', () => {
    let column, find;

    beforeEach('create fakes', () => {
        find = td.function();

        td.replace('../../../lib/Protocol/Collations', { find });
        column = require('../../../lib/DevAPI/Column');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getCharacterSetName()', () => {
        it('returns nothing if the collation is undefined', () => {
            return expect(column().getCharacterSetName()).to.not.exist;
        });

        it('returns the character set name of the respective collation id', () => {
            td.when(find('foo')).thenReturn({ charset: 'bar' });

            expect(column({ collation: 'foo' }).getCharacterSetName()).to.equal('bar');
        });
    });

    context('getCollationName()', () => {
        it('returns nothing if the collation is undefined', () => {
            return expect(column().getCollationName()).to.not.exist;
        });

        it('returns the collation name of the respective collation id', () => {
            td.when(find('foo')).thenReturn({ name: 'bar' });

            expect(column({ collation: 'foo' }).getCollationName()).to.equal('bar');
        });
    });

    context('getColumnLabel()', () => {
        it('returns the projected column name or alias', () => {
            expect(column({ name: 'foo' }).getColumnLabel()).to.equal('foo');
        });
    });

    context('getColumnName()', () => {
        it('returns the original column name', () => {
            expect(column({ originalName: 'foo' }).getColumnName()).to.equal('foo');
        });
    });

    context('getFractionalDigits()', () => {
        it('returns the number of fractional digits supported by the column type', () => {
            expect(column({ fractionalDigits: 3 }).getFractionalDigits()).to.equal(3);
        });
    });

    context('getLength()', () => {
        it('returns the size of the column data type', () => {
            expect(column({ length: 3 }).getLength()).to.equal(3);
        });
    });

    context('getSchemaName()', () => {
        it('returns the name of the schema where the associated table belongs to', () => {
            expect(column({ schema: 'foo' }).getSchemaName()).to.equal('foo');
        });
    });

    context('getTableLabel()', () => {
        it('returns the projected table name or alias', () => {
            expect(column({ table: 'foo' }).getTableLabel()).to.equal('foo');
        });
    });

    context('getTableName()', () => {
        it('returns the projected table name or alias', () => {
            expect(column({ originalTable: 'foo' }).getTableName()).to.equal('foo');
        });
    });

    context('getType()', () => {
        it('decodes bitwise types', () => {
            expect(column({ type: Resultset.ColumnMetaData.FieldType.BIT }).getType()).to.equal('BIT');
        });

        it('decodes signed integer types', () => {
            expect(column({ length: 4, type: Resultset.ColumnMetaData.FieldType.SINT }).getType()).to.equal('TINYINT');
            expect(column({ length: 6, type: Resultset.ColumnMetaData.FieldType.SINT }).getType()).to.equal('SMALLINT');
            expect(column({ length: 9, type: Resultset.ColumnMetaData.FieldType.SINT }).getType()).to.equal('MEDIUMINT');
            expect(column({ length: 11, type: Resultset.ColumnMetaData.FieldType.SINT }).getType()).to.equal('INT');
            expect(column({ length: 20, type: Resultset.ColumnMetaData.FieldType.SINT }).getType()).to.equal('BIGINT');
        });

        it('decodes unsigned integer types', () => {
            expect(column({ length: 3, type: Resultset.ColumnMetaData.FieldType.UINT }).getType()).to.equal('UNSIGNED TINYINT');
            expect(column({ length: 5, type: Resultset.ColumnMetaData.FieldType.UINT }).getType()).to.equal('UNSIGNED SMALLINT');
            expect(column({ length: 8, type: Resultset.ColumnMetaData.FieldType.UINT }).getType()).to.equal('UNSIGNED MEDIUMINT');
            expect(column({ length: 10, type: Resultset.ColumnMetaData.FieldType.UINT }).getType()).to.equal('UNSIGNED INT');
            expect(column({ length: 20, type: Resultset.ColumnMetaData.FieldType.UINT }).getType()).to.equal('UNSIGNED BIGINT');
        });

        it('decodes floating point types', () => {
            expect(column({ type: Resultset.ColumnMetaData.FieldType.FLOAT }).getType()).to.equal('FLOAT');
            expect(column({ flags: 1, type: Resultset.ColumnMetaData.FieldType.FLOAT }).getType()).to.equal('UNSIGNED FLOAT');
            expect(column({ type: Resultset.ColumnMetaData.FieldType.DECIMAL }).getType()).to.equal('DECIMAL');
            expect(column({ flags: 1, type: Resultset.ColumnMetaData.FieldType.DECIMAL }).getType()).to.equal('UNSIGNED DECIMAL');
            expect(column({ type: Resultset.ColumnMetaData.FieldType.DOUBLE }).getType()).to.equal('DOUBLE');
            expect(column({ flags: 1, type: Resultset.ColumnMetaData.FieldType.DOUBLE }).getType()).to.equal('UNSIGNED DOUBLE');
        });

        it('decodes JSON types', () => {
            td.when(find(), { ignoreExtraArgs: true }).thenReturn({});

            expect(column({ contentType: Resultset.ContentType_BYTES.JSON, type: Resultset.ColumnMetaData.FieldType.BYTES }).getType()).to.equal('JSON');
        });

        it('decodes binary string types', () => {
            td.when(find(1)).thenReturn({ charset: 'utf8mb4' });

            expect(column({ collation: 1, type: Resultset.ColumnMetaData.FieldType.BYTES }).getType()).to.equal('STRING');
        });

        it('decodes raw binary types', () => {
            td.when(find(1)).thenReturn({ charset: 'binary' });

            expect(column({ collation: 1, type: Resultset.ColumnMetaData.FieldType.BYTES }).getType()).to.equal('BYTES');
        });

        it('decodes temporal types', () => {
            expect(column({ type: Resultset.ColumnMetaData.FieldType.TIME }).getType()).to.equal('TIME');
        });

        it('decodes date and time types', () => {
            expect(column({ contentType: Resultset.ContentType_DATETIME.DATE, type: Resultset.ColumnMetaData.FieldType.DATETIME }).getType()).to.equal('DATE');
            expect(column({ contentType: Resultset.ContentType_DATETIME.DATETIME, type: Resultset.ColumnMetaData.FieldType.DATETIME }).getType()).to.equal('DATETIME');
            expect(column({ contentType: Resultset.ContentType_DATETIME.DATETIME, type: Resultset.ColumnMetaData.FieldType.DATETIME, flags: 1 }).getType()).to.equal('TIMESTAMP');
        });

        it('decodes set and enum types', () => {
            expect(column({ type: Resultset.ColumnMetaData.FieldType.SET }).getType()).to.equal('SET');
            expect(column({ type: Resultset.ColumnMetaData.FieldType.ENUM }).getType()).to.equal('ENUM');
        });

        it('decodes GEOMETRY types', () => {
            td.when(find(), { ignoreExtraArgs: true }).thenReturn({});

            expect(column({ contentType: Resultset.ContentType_BYTES.GEOMETRY, type: Resultset.ColumnMetaData.FieldType.BYTES }).getType()).to.equal('GEOMETRY');
        });
    });

    context('isNumberSigned()', () => {
        let types;

        beforeEach('create fakes', () => {
            find = td.function();
            types = { SINT: 1 };

            td.replace('../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb', { ColumnMetaData: { FieldType: types } });
            column = require('../../../lib/DevAPI/Column');
        });

        it('checks if the column data type is signed a number', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(column({ type: 1 }).isNumberSigned()).to.be.true;
            return expect(column({ type: 0 }).isNumberSigned()).to.be.false;
        });
    });

    context('isPadded()', () => {
        it('checks if the column data type enforces padding of its value', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(column({ flags: 1 }).isPadded()).to.be.true;
            return expect(column({ flags: 0 }).isPadded()).to.be.false;
        });
    });
});
