'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let columnMetadata = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/ColumnMetadata');

describe('Mysqlx.Resultset.ColumnMetaData wrapper', () => {
    let ResultsetStub, bytes, collations, wraps;

    beforeEach('create fakes', () => {
        ResultsetStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_resultset_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        collations = td.replace('../../../../../../lib/Protocol/Collations');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        columnMetadata = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/ColumnMetadata');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('deserialize()', () => {
            it('returns a Mysqlx.Resultset.ColumnMetaData wrap instance encoded with raw protocol data from the network', () => {
                td.when(bytes.deserialize('foo')).thenReturn({ valueOf: () => 'baz' });
                td.when(ResultsetStub.ColumnMetaData.deserializeBinary('baz')).thenReturn('qux');
                td.when(wraps('qux')).thenReturn({ valueOf: () => 'bar' });

                expect(columnMetadata.deserialize('foo').valueOf()).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('getAlias()', () => {
            it('returns the protobuf message name field', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getName()).thenReturn('p_foo');
                td.when(bytes('p_foo')).thenReturn({ toString: () => 'foo' });

                expect(columnMetadata(proto).getAlias()).to.equal('foo');
            });
        });

        context('getCharset()', () => {
            it('returns nothing if the collation is undefined', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.hasCollation()).thenReturn(false);

                return expect(columnMetadata(proto).getCharset()).to.not.exist;
            });

            it('returns the character set name of the respective collation id', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.hasCollation()).thenReturn(true);
                td.when(proto.getCollation()).thenReturn('foo');
                td.when(collations.find('foo')).thenReturn({ charset: 'bar' });

                expect(columnMetadata(proto).getCharset()).to.equal('bar');
            });
        });

        context('getCatalog()', () => {
            it('returns the value of the catalog property of the underlying protobuf instance', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getCatalog()).thenReturn('foo');
                td.when(bytes('foo')).thenReturn({ toString: () => 'bar' });

                expect(columnMetadata(proto).getCatalog()).to.equal('bar');
            });
        });

        context('getCollation()', () => {
            it('returns nothing if the collation is undefined', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.hasCollation()).thenReturn(false);

                return expect(columnMetadata(proto).getCollation()).to.not.exist;
            });

            it('returns the collation name of the respective collation id', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.hasCollation()).thenReturn(true);
                td.when(proto.getCollation()).thenReturn('foo');
                td.when(collations.find('foo')).thenReturn({ name: 'bar' });

                expect(columnMetadata(proto).getCollation()).to.equal('bar');
            });
        });

        context('getContentType()', () => {
            it('returns the name of the column Content-Type', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.GEOMETRY);
                expect(columnMetadata(proto).getContentType()).to.equal('GEOMETRY');

                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.JSON);
                expect(columnMetadata(proto).getContentType()).to.equal('JSON');

                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.XML);
                expect(columnMetadata(proto).getContentType()).to.equal('XML');
            });
        });

        context('getFractionalDigits()', () => {
            it('returns the value of the fractionalDigits protobuf message field', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getFractionalDigits()).thenReturn('foo');

                expect(columnMetadata(proto).getFractionalDigits()).to.equal('foo');
            });
        });

        context('getLength()', () => {
            it('returns the value of the length protobuf message field', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getLength()).thenReturn('foo');

                expect(columnMetadata(proto).getLength()).to.equal('foo');
            });
        });

        context('getName()', () => {
            it('returns the value of the originalName protobuf message field converted to a utf8 string', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getOriginalName()).thenReturn('p_foo');
                td.when(bytes('p_foo')).thenReturn({ toString: () => 'foo' });

                expect(columnMetadata(proto).getName()).to.equal('foo');
            });
        });

        context('getSchema()', () => {
            it('returns the value of the schema protobuf message field encoded as an utf8 string', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getSchema()).thenReturn('p_foo');
                td.when(bytes('p_foo')).thenReturn({ toString: () => 'foo' });

                expect(columnMetadata(proto).getSchema()).to.equal('foo');
            });
        });

        context('getTableAlias()', () => {
            it('the value of the table protobuf message field encoded as an utf8 string', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getTable()).thenReturn('p_foo');
                td.when(bytes('p_foo')).thenReturn({ toString: () => 'foo' });

                expect(columnMetadata(proto).getTableAlias()).to.equal('foo');
            });
        });

        context('getTableName()', () => {
            it('returns the value of the originalTable protobuf message field encoded as an utf8 string', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getOriginalTable()).thenReturn('p_foo');
                td.when(bytes('p_foo')).thenReturn({ toString: () => 'foo' });

                expect(columnMetadata(proto).getTableName()).to.equal('foo');
            });
        });

        context('getType()', () => {
            it('returns the type name of the underlying protobuf message', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.SINT);
                expect(columnMetadata(proto).getType()).to.equal('SINT');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.UINT);
                expect(columnMetadata(proto).getType()).to.equal('UINT');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DOUBLE);
                expect(columnMetadata(proto).getType()).to.equal('DOUBLE');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.FLOAT);
                expect(columnMetadata(proto).getType()).to.equal('FLOAT');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.BYTES);
                expect(columnMetadata(proto).getType()).to.equal('BYTES');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.TIME);
                expect(columnMetadata(proto).getType()).to.equal('TIME');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DATETIME);
                expect(columnMetadata(proto).getType()).to.equal('DATETIME');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.SET);
                expect(columnMetadata(proto).getType()).to.equal('SET');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.ENUM);
                expect(columnMetadata(proto).getType()).to.equal('ENUM');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.BIT);
                expect(columnMetadata(proto).getType()).to.equal('BIT');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DECIMAL);
                expect(columnMetadata(proto).getType()).to.equal('DECIMAL');
            });
        });

        context('getTypeId()', () => {
            it('returns the value of the type protobuf message field', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn('foo');

                expect(columnMetadata(proto).getTypeId()).to.equal('foo');
            });
        });

        context('getTypeString()', () => {
            it('returns the protocol type name for bitwise columns', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.BIT);
                expect(columnMetadata(proto).getTypeString()).to.equal('BIT');
            });

            it('returns the signed integer type based on the length of the column', () => {
                const proto = new ResultsetStub.ColumnMetaData();
                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.SINT);

                td.when(proto.getLength()).thenReturn(4);
                expect(columnMetadata(proto).getTypeString()).to.equal('TINYINT');

                td.when(proto.getLength()).thenReturn(6);
                expect(columnMetadata(proto).getTypeString()).to.equal('SMALLINT');

                td.when(proto.getLength()).thenReturn(9);
                expect(columnMetadata(proto).getTypeString()).to.equal('MEDIUMINT');

                td.when(proto.getLength()).thenReturn(11);
                expect(columnMetadata(proto).getTypeString()).to.equal('INT');

                td.when(proto.getLength()).thenReturn(20);
                expect(columnMetadata(proto).getTypeString()).to.equal('BIGINT');
            });

            it('returns the unsigned integer type based on the length of the column', () => {
                const proto = new ResultsetStub.ColumnMetaData();
                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.UINT);

                td.when(proto.getLength()).thenReturn(3);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED TINYINT');

                td.when(proto.getLength()).thenReturn(5);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED SMALLINT');

                td.when(proto.getLength()).thenReturn(8);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED MEDIUMINT');

                td.when(proto.getLength()).thenReturn(10);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED INT');

                td.when(proto.getLength()).thenReturn(20);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED BIGINT');
            });

            it('returns the correct floating point type based on the column type and flags', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.FLOAT);
                expect(columnMetadata(proto).getTypeString()).to.equal('FLOAT');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DECIMAL);
                expect(columnMetadata(proto).getTypeString()).to.equal('DECIMAL');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DOUBLE);
                expect(columnMetadata(proto).getTypeString()).to.equal('DOUBLE');

                // check unsigned values
                td.when(proto.getFlags()).thenReturn(1);

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.FLOAT);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED FLOAT');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DECIMAL);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED DECIMAL');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DOUBLE);
                expect(columnMetadata(proto).getTypeString()).to.equal('UNSIGNED DOUBLE');
            });

            it('returns JSON for binary data with the appropriate Content-Type', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.BYTES);
                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.JSON);
                td.when(collations.find(), { ignoreExtraArgs: true }).thenReturn({});

                expect(columnMetadata(proto).getTypeString()).to.equal('JSON');
            });

            it('returns STRING for binary content with the utf8mb4 charset', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.BYTES);
                td.when(proto.getCollation()).thenReturn('foo');
                td.when(collations.find('foo')).thenReturn({ charset: 'utf8mb4' });

                expect(columnMetadata(proto).getTypeString()).to.equal('STRING');
            });

            it('returns BYTES for binary content with the binary charset', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.BYTES);
                td.when(proto.getCollation()).thenReturn(1);
                td.when(collations.find(1)).thenReturn({ charset: 'binary' });

                expect(columnMetadata(proto).getTypeString()).to.equal('BYTES');
            });

            it('returns protocol type name for temporal columns', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.TIME);

                expect(columnMetadata(proto).getTypeString()).to.equal('TIME');
            });

            it('returns the correct date type based on the column flags and Content-Type', () => {
                const proto = new ResultsetStub.ColumnMetaData();
                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.DATETIME); // is the same for all types
                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_DATETIME.DATETIME); // DATETIME or TIMESTAMP

                expect(columnMetadata(proto).getTypeString()).to.equal('DATETIME');

                td.when(proto.getFlags()).thenReturn(1); // TIMESTAMP
                expect(columnMetadata(proto).getTypeString()).to.equal('TIMESTAMP');

                td.when(proto.getFlags()).thenReturn();
                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_DATETIME.DATE); // DATE
                expect(columnMetadata(proto).getTypeString()).to.equal('DATE');
            });

            it('returns the protocol type name for SET and ENUM columns', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.SET);
                expect(columnMetadata(proto).getTypeString()).to.equal('SET');

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.ENUM);
                expect(columnMetadata(proto).getTypeString()).to.equal('ENUM');
            });

            it('returns GEOMETRY for binary content with the appropriate Content-Type', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.BYTES);
                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.GEOMETRY);
                td.when(collations.find(), { ignoreExtraArgs: true }).thenReturn({});

                expect(columnMetadata(proto).getTypeString()).to.equal('GEOMETRY');
            });
        });

        context('isBinary()', () => {
            it('returns true if the column has a binary charset', () => {
                const proto = new ResultsetStub.ColumnMetaData();
                const wrap = columnMetadata(proto);
                const getCharset = td.replace(wrap, 'getCharset');

                td.when(getCharset()).thenReturn('binary');

                return expect(wrap.isBinary()).to.be.true;
            });

            it('returns true if the column has a GEOMETRY content type', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.GEOMETRY);

                return expect(columnMetadata(proto).isBinary()).to.be.true;
            });

            it('returns false if the column does not have a binary charset', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getCollation()).thenReturn('foo');
                td.when(collations.find('foo')).thenReturn({ charset: 'utf8mb4' });

                return expect(columnMetadata(proto).isBinary()).to.be.false;
            });

            it('returns false if the column does have a GEOMETRY content type', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.JSON);

                return expect(columnMetadata(proto).isBinary()).to.be.false;
            });
        });

        context('isFlagged()', () => {
            it('returns true if the flags field indicates type-specific behaviour', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getFlags()).thenReturn(1);
                // eslint-disable-next-line no-unused-expressions
                expect(columnMetadata(proto).isFlagged()).to.be.true;

                td.when(proto.getFlags()).thenReturn(3);
                return expect(columnMetadata(proto).isFlagged()).to.be.true;
            });

            it('returns false if the flags field does not indicate type-specific behaviour', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getFlags()).thenReturn();
                // eslint-disable-next-line no-unused-expressions
                expect(columnMetadata(proto).isFlagged()).to.be.false;

                td.when(proto.getFlags()).thenReturn(0);
                // eslint-disable-next-line no-unused-expressions
                expect(columnMetadata(proto).isFlagged()).to.be.false;

                td.when(proto.getFlags()).thenReturn(2);
                // eslint-disable-next-line no-unused-expressions
                expect(columnMetadata(proto).isFlagged()).to.be.false;

                td.when(proto.getFlags()).thenReturn(4);
                return expect(columnMetadata(proto).isFlagged()).to.be.false;
            });
        });

        context('isJSON()', () => {
            it('returns true if the column has a JSON content type', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.JSON);

                return expect(columnMetadata(proto).isJSON()).to.be.true;
            });

            it('returns false if the column does not have a JSON content type', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getContentType()).thenReturn(ResultsetStub.ContentType_BYTES.XML);

                return expect(columnMetadata(proto).isJSON()).to.be.false;
            });
        });

        context('isSigned()', () => {
            it('checks if the value of the type protobuf message field matches the value used for signed integers', () => {
                const proto = new ResultsetStub.ColumnMetaData();

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.SINT);
                // eslint-disable-next-line no-unused-expressions
                expect(columnMetadata(proto).isSigned()).to.be.true;

                td.when(proto.getType()).thenReturn(ResultsetStub.ColumnMetaData.FieldType.UINT);
                return expect(columnMetadata(proto).isSigned()).to.be.false;
            });
        });

        context('toJSON()', () => {
            it('returns a textual reprentation of a Mysqlx.Resultset.ColumnMetadata stub instance', () => {
                const proto = new ResultsetStub.ColumnMetaData();
                const wrap = columnMetadata(proto);
                const getType = td.replace(wrap, 'getType');
                const getAlias = td.replace(wrap, 'getAlias');
                const getName = td.replace(wrap, 'getName');
                const getTableAlias = td.replace(wrap, 'getTableAlias');
                const getTableName = td.replace(wrap, 'getTableName');
                const getSchema = td.replace(wrap, 'getSchema');
                const getCatalog = td.replace(wrap, 'getCatalog');
                const getContentType = td.replace(wrap, 'getContentType');

                td.when(getType()).thenReturn('foo');
                td.when(getAlias()).thenReturn('bar');
                td.when(getName()).thenReturn('baz');
                td.when(getTableAlias()).thenReturn('qux');
                td.when(getTableName()).thenReturn('quux');
                td.when(getSchema()).thenReturn('quuz');
                td.when(getCatalog()).thenReturn('corge');
                td.when(proto.getCollation()).thenReturn('grault');
                td.when(proto.getFractionalDigits()).thenReturn('garply');
                td.when(proto.getLength()).thenReturn('waldo');
                td.when(proto.getFlags()).thenReturn('fred');
                td.when(getContentType()).thenReturn('plugh');

                expect(wrap.toJSON()).to.deep.equal({ type: 'foo', name: 'bar', original_name: 'baz', table: 'qux', original_table: 'quux', schema: 'quuz', catalog: 'corge', collation: 'grault', fractional_digits: 'garply', length: 'waldo', flags: 'fred', content_type: 'plugh' });
            });
        });
    });
});
