'use strict';

/* eslint-env node, mocha */

const Resultset = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb');
const expect = require('chai').expect;
const td = require('testdouble');
const tools = require('../../../../lib/Protocol/Util');

describe('ColumnMetadata', () => {
    let columnMetadata, find;

    beforeEach('create fakes', () => {
        find = td.function();

        td.replace('../../../../lib/Protocol/Collations', { find });
        columnMetadata = require('../../../../lib/Protocol/Types/ColumnMetadata');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getAlias()', () => {
        it('returns the protobuf message name field', () => {
            const proto = new Resultset.ColumnMetaData();
            // eslint-disable-next-line node/no-deprecated-api
            proto.setName(tools.createTypedArrayFromBuffer(new Buffer('foo')));

            expect(columnMetadata(proto).getAlias()).to.equal('foo');
        });
    });

    context('getCharset()', () => {
        it('returns nothing if the collation is undefined', () => {
            return expect(columnMetadata(new Resultset.ColumnMetaData()).getCharset()).to.not.exist;
        });

        it('returns the character set name of the respective collation id', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setCollation('foo');

            td.when(find('foo')).thenReturn({ charset: 'bar' });

            expect(columnMetadata(proto).getCharset()).to.equal('bar');
        });
    });

    context('getCollation()', () => {
        it('returns nothing if the collation is undefined', () => {
            return expect(columnMetadata(new Resultset.ColumnMetaData()).getCollation()).to.not.exist;
        });

        it('returns the collation name of the respective collation id', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setCollation('foo');

            td.when(find('foo')).thenReturn({ name: 'bar' });

            expect(columnMetadata(proto).getCollation()).to.equal('bar');
        });
    });

    context('getFractionalDigits()', () => {
        it('returns the value of the fractionalDigits protobuf message field', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setFractionalDigits(3);

            expect(columnMetadata(proto).getFractionalDigits()).to.equal(3);
        });
    });

    context('getLength()', () => {
        it('returns the value of the length protobuf message field', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setLength(3);

            expect(columnMetadata(proto).getLength()).to.equal(3);
        });
    });

    context('getName()', () => {
        it('returns the value of the originalName protobuf message field converted to a utf8 string', () => {
            const proto = new Resultset.ColumnMetaData();
            // eslint-disable-next-line node/no-deprecated-api
            proto.setOriginalName(tools.createTypedArrayFromBuffer(new Buffer('foo')));

            expect(columnMetadata(proto).getName()).to.equal('foo');
        });
    });

    context('getSchema()', () => {
        it('returns the value of the schema protobuf message field encoded as an utf8 string', () => {
            const proto = new Resultset.ColumnMetaData();
            // eslint-disable-next-line node/no-deprecated-api
            proto.setSchema(tools.createTypedArrayFromBuffer(new Buffer('foo')));

            expect(columnMetadata(proto).getSchema()).to.equal('foo');
        });
    });

    context('getTableAlias()', () => {
        it('the value of the table protobuf message field encoded as an utf8 string', () => {
            const proto = new Resultset.ColumnMetaData();
            // eslint-disable-next-line node/no-deprecated-api
            proto.setTable(tools.createTypedArrayFromBuffer(new Buffer('foo')));

            expect(columnMetadata(proto).getTableAlias()).to.equal('foo');
        });
    });

    context('getTableName()', () => {
        it('returns the value of the originalTable protobuf message field encoded as an utf8 string', () => {
            const proto = new Resultset.ColumnMetaData();
            // eslint-disable-next-line node/no-deprecated-api
            proto.setOriginalTable(tools.createTypedArrayFromBuffer(new Buffer('foo')));

            expect(columnMetadata(proto).getTableName()).to.equal('foo');
        });
    });

    context('getTypeId()', () => {
        it('returns the value of the type protobuf message field', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setType(Resultset.ColumnMetaData.FieldType.UINT);

            expect(columnMetadata(proto).getTypeId()).to.equal(Resultset.ColumnMetaData.FieldType.UINT);
        });
    });

    context('getTypeString()', () => {
        it('decodes bitwise types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setType(Resultset.ColumnMetaData.FieldType.BIT);

            expect(columnMetadata(proto).getTypeString()).to.equal('BIT');
        });

        it('decodes signed integer types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setType(Resultset.ColumnMetaData.FieldType.SINT);

            proto.setLength(4);
            expect(columnMetadata(proto).getTypeString()).to.equal('TINYINT');

            proto.setLength(6);
            expect(columnMetadata(proto).getTypeString()).to.equal('SMALLINT');

            proto.setLength(9);
            expect(columnMetadata(proto).getTypeString()).to.equal('MEDIUMINT');

            proto.setLength(11);
            expect(columnMetadata(proto).getTypeString()).to.equal('INT');

            proto.setLength(20);
            expect(columnMetadata(proto).getTypeString()).to.equal('BIGINT');
        });

        it('decodes unsigned integer types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setType(Resultset.ColumnMetaData.FieldType.UINT);

            proto.setLength(3);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED TINYINT');

            proto.setLength(5);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED SMALLINT');

            proto.setLength(8);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED MEDIUMINT');

            proto.setLength(10);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED INT');

            proto.setLength(20);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED BIGINT');
        });

        it('decodes floating point types', () => {
            const proto = new Resultset.ColumnMetaData();

            proto.setType(Resultset.ColumnMetaData.FieldType.FLOAT);
            expect(columnMetadata(proto).getTypeString()).to.equal('FLOAT');

            proto.setType(Resultset.ColumnMetaData.FieldType.DECIMAL);
            expect(columnMetadata(proto).getTypeString()).to.equal('DECIMAL');

            proto.setType(Resultset.ColumnMetaData.FieldType.DOUBLE);
            expect(columnMetadata(proto).getTypeString()).to.equal('DOUBLE');

            // check unsigned values
            proto.setFlags(1);

            proto.setType(Resultset.ColumnMetaData.FieldType.FLOAT);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED FLOAT');

            proto.setType(Resultset.ColumnMetaData.FieldType.DECIMAL);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED DECIMAL');

            proto.setType(Resultset.ColumnMetaData.FieldType.DOUBLE);
            expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED DOUBLE');
        });

        it('decodes JSON types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setContentType(Resultset.ContentType_BYTES.JSON);
            proto.setType(Resultset.ColumnMetaData.FieldType.BYTES);

            td.when(find(), { ignoreExtraArgs: true }).thenReturn({});

            expect(columnMetadata(proto).getTypeString()).to.equal('JSON');
        });

        it('decodes binary string types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setCollation(1);
            proto.setType(Resultset.ColumnMetaData.FieldType.BYTES);

            td.when(find(1)).thenReturn({ charset: 'utf8mb4' });

            expect(columnMetadata(proto).getTypeString()).to.equal('STRING');
        });

        it('decodes raw binary types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setCollation(1);
            proto.setType(Resultset.ColumnMetaData.FieldType.BYTES);

            td.when(find(1)).thenReturn({ charset: 'binary' });

            expect(columnMetadata(proto).getTypeString()).to.equal('BYTES');
        });

        it('decodes temporal types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setType(Resultset.ColumnMetaData.FieldType.TIME);

            expect(columnMetadata(proto).getTypeString()).to.equal('TIME');
        });

        it('decodes date and time types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setType(Resultset.ColumnMetaData.FieldType.DATETIME); // is the same for all types
            proto.setContentType(Resultset.ContentType_DATETIME.DATETIME); // DATETIME or TIMESTAMP

            expect(columnMetadata(proto).getTypeString()).to.equal('DATETIME');

            proto.setFlags(1); // TIMESTAMP
            expect(columnMetadata(proto).getTypeString()).to.equal('TIMESTAMP');

            proto.clearFlags();
            proto.setContentType(Resultset.ContentType_DATETIME.DATE); // DATE
            expect(columnMetadata(proto).getTypeString()).to.equal('DATE');
        });

        it('decodes set and enum types', () => {
            const proto = new Resultset.ColumnMetaData();

            proto.setType(Resultset.ColumnMetaData.FieldType.SET);
            expect(columnMetadata(proto).getTypeString()).to.equal('SET');

            proto.setType(Resultset.ColumnMetaData.FieldType.ENUM);
            expect(columnMetadata(proto).getTypeString()).to.equal('ENUM');
        });

        it('decodes GEOMETRY types', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setContentType(Resultset.ContentType_BYTES.GEOMETRY);
            proto.setType(Resultset.ColumnMetaData.FieldType.BYTES);

            td.when(find(), { ignoreExtraArgs: true }).thenReturn({});

            expect(columnMetadata(proto).getTypeString()).to.equal('GEOMETRY');
        });
    });

    context('isBinary()', () => {
        it('returns true if the column has a binary charset', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setCollation(1);

            td.when(find(1)).thenReturn({ charset: 'binary' });

            return expect(columnMetadata(proto).isBinary()).to.be.true;
        });

        it('returns true if the column has a GEOMETRY content type', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setContentType(Resultset.ContentType_BYTES.GEOMETRY);

            return expect(columnMetadata(proto).isBinary()).to.be.true;
        });

        it('returns false if the column does not have a binary charset', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setCollation(1);

            td.when(find(1)).thenReturn({ charset: 'utf8mb4' });

            return expect(columnMetadata(proto).isBinary()).to.be.false;
        });

        it('returns false if the column does have a GEOMETRY content type', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setContentType(Resultset.ContentType_BYTES.JSON);

            return expect(columnMetadata(proto).isBinary()).to.be.false;
        });
    });

    context('isJSON()', () => {
        it('returns true if the column has a JSON content type', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setContentType(Resultset.ContentType_BYTES.JSON);

            return expect(columnMetadata(proto).isJSON()).to.be.true;
        });

        it('returns false if the column does not have a JSON content type', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setContentType(Resultset.ContentType_BYTES.XML);

            return expect(columnMetadata(proto).isJSON()).to.be.false;
        });
    });

    context('isFlagged()', () => {
        it('checks if the value of the flags protobuf message field indicates padding', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setFlags(1);
            // eslint-disable-next-line no-unused-expressions
            expect(columnMetadata(proto).isFlagged()).to.be.true;

            proto.clearFlags();
            return expect(columnMetadata(proto).isFlagged()).to.be.false;
        });
    });

    context('isSigned()', () => {
        it('checks if the value of the type protobuf message field matches the value used for signed integers', () => {
            const proto = new Resultset.ColumnMetaData();
            proto.setType(Resultset.ColumnMetaData.FieldType.SINT);
            // eslint-disable-next-line no-unused-expressions
            expect(columnMetadata(proto).isSigned()).to.be.true;

            proto.setType(Resultset.ColumnMetaData.FieldType.UINT);
            return expect(columnMetadata(proto).isSigned()).to.be.false;
        });
    });
});
