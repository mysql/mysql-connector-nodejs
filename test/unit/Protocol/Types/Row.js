'use strict';

/* eslint-env node, mocha */

const BinaryWriter = require('google-protobuf').BinaryWriter;
const ColumnMetaDataStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb').ColumnMetaData;
const ContentType = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb').ContentType_BYTES;
const RowStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb').Row;
const columnMetadata = require('../../../../lib/Protocol/Types/ColumnMetadata');
const expect = require('chai').expect;
const row = require('../../../../lib/Protocol/Types/Row');
const tools = require('../../../../lib/Protocol/Util');

describe('Row', () => {
    context('getColumnMetadata()', () => {
        it('returns the list of column metadata objects associated to the given row', () => {
            expect(row('foo', { metadata: ['bar', 'baz'] }).getColumnMetadata()).to.deep.equal(['bar', 'baz']);
        });
    });

    context('decode()', () => {
        it('returns float values as JavaScript numbers', () => {
            const columnProto = new ColumnMetaDataStub();
            columnProto.setType(ColumnMetaDataStub.FieldType.FLOAT);
            columnProto.setFractionalDigits(2);

            const writer = new BinaryWriter();
            writer.writeFloat(1, 1.2345);

            const rowProto = new RowStub();
            // remove length field
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([1.23]);
        });

        it('returns double values as JavaScript numbers', () => {
            const columnProto = new ColumnMetaDataStub();
            columnProto.setType(ColumnMetaDataStub.FieldType.DOUBLE);
            columnProto.setFractionalDigits(1);

            const writer = new BinaryWriter();
            writer.writeDouble(1, 1.2345678910111213);

            const rowProto = new RowStub();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([1.2]);
        });

        it('returns signed integer values as JavaScript numbers', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.SINT]);

            const writer = new BinaryWriter();
            writer.writeSint64(1, 1);

            const rowProto = new RowStub();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([1]);

            writer.reset();
            writer.writeSint64(1, -1);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([-1]);

            writer.reset();
            writer.writeSint64(1, Number.MAX_SAFE_INTEGER);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([Number.MAX_SAFE_INTEGER]);

            writer.reset();
            writer.writeSint64(1, Number.MIN_SAFE_INTEGER);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([Number.MIN_SAFE_INTEGER]);

            let overflow = '9007199254740992'; // Number.MAX_SAFE_INTEGER + 1

            writer.reset();
            writer.writeSint64String(1, overflow);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([overflow.toString()]);

            overflow = '-9007199254740992'; // Number.MIN_SAFE_INTEGER - 1

            writer.reset();
            writer.writeSint64String(1, overflow);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([overflow.toString()]);
        });

        it('returns unsigned integer values as JavaScript numbers', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.UINT]);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 1);

            const rowProto = new RowStub();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([1]);

            writer.reset();
            writer.writeUint64(1, 0);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([0]);

            const overflow = Number.MAX_SAFE_INTEGER + 1;

            writer.reset();
            writer.writeUint64(1, overflow);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([overflow.toString()]);

            columnProto.setLength(5);
            columnProto.setFlags(1);

            writer.reset();
            writer.writeUint64(1, 82);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['00082']);
        });

        it('returns bit sequence values as Node.js buffers', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.BIT]);

            let writer = new BinaryWriter();
            writer.writeUint64(1, 23);

            const rowProto = new RowStub();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['23']);

            const overflow = Number.MAX_SAFE_INTEGER + 1;

            writer.reset();
            writer.writeUint64(1, overflow);

            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([overflow.toString()]);
        });

        it('returns binary data values as Node.js buffers', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const binary = new Buffer('foo\0');
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.BYTES]);
            columnProto.setCollation(63); // binary charset and collation

            const rowProto = new RowStub();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([binary.slice(0, -1)]);

            columnProto.setLength(5);
            columnProto.clearFlags(); // without right-padding

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding but invalid length
            columnProto.setLength(2);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding
            columnProto.setLength(5);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            // remove the additional `0x00` bytes
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()[0].slice(0, -2)).to.deep.equal(binary.slice(0, -1));
        });

        it('returns GEOMETRY data values as Node.js buffers', () => {
            // eslint-disable-next-line node/no-deprecated-api
            const binary = new Buffer('foo\0');
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.BYTES]);
            columnProto.setContentType(ContentType.GEOMETRY);

            const rowProto = new RowStub();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([binary.slice(0, -1)]);

            // without right-padding
            columnProto.setLength(5);
            columnProto.clearFlags();

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding but invalid length
            columnProto.setLength(2);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding
            columnProto.setLength(5);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(binary));

            // remove the additional `0x00` bytes
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()[0].slice(0, -2)).to.deep.equal(binary.slice(0, -1));
        });

        it('returns JSON data values as JavaScript objects', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.BYTES]);
            columnProto.setContentType(ContentType.JSON);

            const obj = { foo: 'bar' };

            const rowProto = new RowStub();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer(`${JSON.stringify(obj)}\0`)));
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([obj]);
        });

        it('returns XML data values as JavaScript strings', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.BYTES]);
            columnProto.setContentType(ContentType.XML);

            const xml = '<?xml version="1.0" encoding="UTF-8"?><text><para>foo</para></text>';

            const rowProto = new RowStub();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer(`${xml}\0`)));
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([xml]);
        });

        it('returns text values as JavaScript strings', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.BYTES]);

            const rowProto = new RowStub();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer('foo\0')));
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['foo']);

            // without right-padding
            columnProto.setLength(5);
            columnProto.clearFlags();

            rowProto.clearFieldList();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer('foo\0')));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['foo']);

            rowProto.clearFieldList();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer('\0')));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['']);

            // with right-padding but invalid length
            columnProto.setLength(2);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer('foo\0')));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['foo']);

            // with right-padding
            columnProto.setLength(5);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer('foo\0')));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['foo  ']);
        });

        it('returns NULL values', () => {
            const columnProto = new ColumnMetaDataStub(); // any type

            const rowProto = new RowStub();
            rowProto.addField(new Uint8Array());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([null]);
        });

        it('returns enum values as JavaScript strings', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.ENUM]);

            const rowProto = new RowStub();
            // eslint-disable-next-line node/no-deprecated-api
            rowProto.addField(tools.createTypedArrayFromBuffer(new Buffer('foo\0')));
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['foo']);
        });

        it('returns time values as JavaScript strings', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.TIME]);

            // eslint-disable-next-line node/no-deprecated-api
            let time = new Buffer(2);
            time.fill(0);
            time.writeUInt8(22, 1);

            const rowProto = new RowStub();
            rowProto.addField(tools.createTypedArrayFromBuffer(time));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['+22:00:00.000000']);

            // eslint-disable-next-line node/no-deprecated-api
            time = new Buffer(2);
            time.fill(1);
            time.writeUInt8(5, 1);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(time));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['-05:00:00.000000']);

            // eslint-disable-next-line node/no-deprecated-api
            time = new Buffer(3);
            time.fill(1);
            time.writeUInt8(14, 1);
            time.writeUInt8(47, 2);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(time));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['-14:47:00.000000']);

            // eslint-disable-next-line node/no-deprecated-api
            time = new Buffer(4);
            time.fill(0);
            time.writeUInt8(8, 1);
            time.writeUInt8(8, 2);
            time.writeUInt8(8, 3);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(time));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['+08:08:08.000000']);

            // eslint-disable-next-line node/no-deprecated-api
            time = new Buffer(4);
            time.fill(1);
            time.writeUInt8(20, 1);
            time.writeUInt8(17, 2);
            time.writeUInt8(54, 3);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 999999);
            // eslint-disable-next-line node/no-deprecated-api
            let useconds = new Buffer(writer.getResultBuffer().slice(1));

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(Buffer.concat([time, useconds], time.length + useconds.length)));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal(['-20:17:54.999999']);
        });

        it('returns datetime values as JavaScript dates', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.DATETIME]);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 9999);

            // eslint-disable-next-line node/no-deprecated-api
            let year = new Buffer(writer.getResultBuffer().slice(1));
            // eslint-disable-next-line node/no-deprecated-api
            let dayAndMonth = new Buffer(2);
            dayAndMonth.writeUInt8(12);
            dayAndMonth.writeUInt8(25, 1);

            let datetime = Buffer.concat([year, dayAndMonth], year.length + dayAndMonth.length);

            const rowProto = new RowStub();
            rowProto.addField(tools.createTypedArrayFromBuffer(datetime));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([new Date('9999-12-25')]);

            writer.reset();
            writer.writeUint64(1, 2018);

            // eslint-disable-next-line node/no-deprecated-api
            year = new Buffer(writer.getResultBuffer().slice(1));
            // eslint-disable-next-line node/no-deprecated-api
            dayAndMonth = new Buffer(2);
            dayAndMonth.writeUInt8(2);
            dayAndMonth.writeUInt8(19, 1);

            // works with additional time data as well

            // eslint-disable-next-line node/no-deprecated-api
            const hourAndMinute = new Buffer(2);
            hourAndMinute.writeUInt8(15);
            hourAndMinute.writeUInt8(9, 1);

            datetime = Buffer.concat([year, dayAndMonth, hourAndMinute], year.length + dayAndMonth.length + hourAndMinute.length);

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(datetime));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([new Date('2018-02-19T15:09:00.000Z')]);
        });

        it('returns timestamp values as JavaScript numbers', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.DATETIME]);
            columnProto.setFlags(1);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 2018);

            // eslint-disable-next-line node/no-deprecated-api
            const year = new Buffer(writer.getResultBuffer().slice(1));
            // eslint-disable-next-line node/no-deprecated-api
            const fromMonthToSeconds = new Buffer(5);
            fromMonthToSeconds.writeUInt8(2);
            fromMonthToSeconds.writeUInt8(19, 1);
            fromMonthToSeconds.writeUInt8(15, 2);
            fromMonthToSeconds.writeUInt8(21, 3);
            fromMonthToSeconds.writeUInt8(26, 4);

            writer.reset();
            writer.writeUint64(1, 123000);
            // eslint-disable-next-line node/no-deprecated-api
            const useconds = new Buffer(writer.getResultBuffer().slice(1));

            const datetime = Buffer.concat([year, fromMonthToSeconds, useconds], year.length + fromMonthToSeconds.length + useconds.length);

            const rowProto = new RowStub();
            rowProto.addField(tools.createTypedArrayFromBuffer(datetime));
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([(new Date('2018-02-19T15:21:26.123Z')).getTime()]);
        });

        it('returns decimal values as JavaScript numbers', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.DECIMAL]);

            // eslint-disable-next-line node/no-deprecated-api
            let decimal = new Buffer('04123401d0', 'hex');

            const rowProto = new RowStub();
            rowProto.addField(tools.createTypedArrayFromBuffer(decimal));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([-12.3401]);

            let overflow = Number.MAX_SAFE_INTEGER + 1;
            let scale = 10; // overflow size in hexadecimal
            // eslint-disable-next-line node/no-deprecated-api
            decimal = new Buffer(`${scale}${overflow}${overflow}c0`, 'hex');

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(decimal));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([`+${overflow}.${overflow}`]);
        });

        it('returns set values as JavaScript arrays', () => {
            const columnProto = new ColumnMetaDataStub([ColumnMetaDataStub.FieldType.SET]);

            const rowProto = new RowStub();
            rowProto.addField(new Uint8Array());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([null]);

            // eslint-disable-next-line node/no-deprecated-api
            let setDefinition = new Buffer('00', 'hex');

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(setDefinition));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([['']]);

            // eslint-disable-next-line node/no-deprecated-api
            setDefinition = new Buffer('01', 'hex');

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(setDefinition));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([[]]);

            // eslint-disable-next-line node/no-deprecated-api
            setDefinition = new Buffer('0100', 'hex');

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(setDefinition));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([['\0']]);

            // BUG#31654667
            // eslint-disable-next-line node/no-deprecated-api
            const x = (new Buffer('x')).toString('hex');
            // eslint-disable-next-line node/no-deprecated-api
            const y = (new Buffer('y')).toString('hex');
            // eslint-disable-next-line node/no-deprecated-api
            setDefinition = new Buffer(`01${x}01${y}`, 'hex');

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(setDefinition));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([['x', 'y']]);

            // eslint-disable-next-line node/no-deprecated-api
            const foo = (new Buffer('foo')).toString('hex');
            // eslint-disable-next-line node/no-deprecated-api
            const bar = (new Buffer('bar')).toString('hex');
            // eslint-disable-next-line node/no-deprecated-api
            setDefinition = new Buffer(`03${foo}03${bar}`, 'hex');

            rowProto.clearFieldList();
            rowProto.addField(tools.createTypedArrayFromBuffer(setDefinition));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).decode()).to.deep.equal([['foo', 'bar']]);
        });
    });

    context('setColumnMetadata()', () => {
        it('updates the list of column metadata objects associated to the given row', () => {
            expect(row('foo').setColumnMetadata(['bar', 'baz']).getColumnMetadata()).to.deep.equal(['bar', 'baz']);
        });
    });
});
