/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const BinaryWriter = require('google-protobuf').BinaryWriter;
const ResultsetStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_resultset_pb');
const bytes = require('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
const columnMetadata = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/ColumnMetadata');
const expect = require('chai').expect;
const row = require('../../../../../../lib/Protocol/Wrappers/Messages/Resultset/Row');

describe('Mysqlx.Resultset.Row wrapper', () => {
    context('getColumnMetadata()', () => {
        it('returns the list of column metadata objects associated to the given row', () => {
            expect(row('foo', { metadata: ['bar', 'baz'] }).getColumnMetadata()).to.deep.equal(['bar', 'baz']);
        });
    });

    context('setColumnMetadata()', () => {
        it('updates the list of column metadata objects associated to the given row', () => {
            expect(row('foo').setColumnMetadata(['bar', 'baz']).getColumnMetadata()).to.deep.equal(['bar', 'baz']);
        });
    });

    context('toArray()', () => {
        it('returns float values as JavaScript numbers', () => {
            const columnProto = new ResultsetStub.ColumnMetaData();
            columnProto.setType(ResultsetStub.ColumnMetaData.FieldType.FLOAT);
            columnProto.setFractionalDigits(2);

            const writer = new BinaryWriter();
            writer.writeFloat(1, 1.2345);

            const rowProto = new ResultsetStub.Row();
            // remove length field
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([1.23]);
        });

        it('returns double values as JavaScript numbers', () => {
            const columnProto = new ResultsetStub.ColumnMetaData();
            columnProto.setType(ResultsetStub.ColumnMetaData.FieldType.DOUBLE);
            columnProto.setFractionalDigits(1);

            const writer = new BinaryWriter();
            writer.writeDouble(1, 1.2345678910111213);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([1.2]);
        });

        it('returns signed integer values as JavaScript numbers', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.SINT]);

            const writer = new BinaryWriter();
            writer.writeSint64(1, 1);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([1]);

            writer.reset();
            writer.writeSint64(1, -1);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([-1]);

            writer.reset();
            writer.writeSint64(1, Number.MAX_SAFE_INTEGER);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([Number.MAX_SAFE_INTEGER]);

            writer.reset();
            writer.writeSint64(1, Number.MIN_SAFE_INTEGER);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([Number.MIN_SAFE_INTEGER]);

            let overflow = '9007199254740992'; // Number.MAX_SAFE_INTEGER + 1

            writer.reset();
            writer.writeSint64String(1, overflow);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([overflow.toString()]);

            overflow = '-9007199254740992'; // Number.MIN_SAFE_INTEGER - 1

            writer.reset();
            writer.writeSint64String(1, overflow);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([overflow.toString()]);
        });

        it('returns unsigned integer values as JavaScript numbers', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.UINT]);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 1);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([1]);

            writer.reset();
            writer.writeUint64(1, 0);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([0]);

            const overflow = Number.MAX_SAFE_INTEGER + 1;

            writer.reset();
            writer.writeUint64(1, overflow);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([overflow.toString()]);

            columnProto.setLength(5);
            columnProto.setFlags(1);

            writer.reset();
            writer.writeUint64(1, 82);
            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['00082']);
        });

        it('returns bit sequence values as Node.js buffers', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.BIT]);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 23);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['23']);

            const overflow = Number.MAX_SAFE_INTEGER + 1;

            writer.reset();
            writer.writeUint64(1, overflow);

            rowProto.clearFieldList();
            rowProto.addField(writer.getResultBuffer().slice(1));

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([overflow.toString()]);
        });

        it('returns binary data values as Node.js buffers', () => {
            const binary = Buffer.from('foo\0');
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.BYTES]);
            columnProto.setCollation(63); // binary charset and collation

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(binary).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([binary.slice(0, -1)]);

            columnProto.setLength(5);
            columnProto.clearFlags(); // without right-padding

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(binary).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding but invalid length
            columnProto.setLength(2);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(binary).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding
            columnProto.setLength(5);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(binary).valueOf());

            // remove the additional `0x00` bytes
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()[0].slice(0, -2)).to.deep.equal(binary.slice(0, -1));
        });

        it('returns GEOMETRY data values as Node.js buffers', () => {
            const binary = Buffer.from('foo\0');
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.BYTES]);
            columnProto.setContentType(ResultsetStub.ContentType_BYTES.GEOMETRY);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(binary).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([binary.slice(0, -1)]);

            // without right-padding
            columnProto.setLength(5);
            columnProto.clearFlags();

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(binary).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding but invalid length
            columnProto.setLength(2);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(binary).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([binary.slice(0, -1)]);

            // with right-padding
            columnProto.setLength(5);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(binary).valueOf());

            // remove the additional `0x00` bytes
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()[0].slice(0, -2)).to.deep.equal(binary.slice(0, -1));
        });

        it('returns JSON data values as JavaScript objects', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.BYTES]);
            columnProto.setContentType(ResultsetStub.ContentType_BYTES.JSON);

            const obj = { foo: 'bar' };

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(Buffer.from(`${JSON.stringify(obj)}\0`)).valueOf());
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([obj]);
        });

        it('returns XML data values as JavaScript strings', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.BYTES]);
            columnProto.setContentType(ResultsetStub.ContentType_BYTES.XML);

            const xml = '<?xml version="1.0" encoding="UTF-8"?><text><para>foo</para></text>';

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(Buffer.from(`${xml}\0`)).valueOf());
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([xml]);
        });

        it('returns text values as JavaScript strings', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.BYTES]);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(Buffer.from('foo\0')).valueOf());
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['foo']);

            // without right-padding
            columnProto.setLength(5);
            columnProto.clearFlags();

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(Buffer.from('foo\0')).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['foo']);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(Buffer.from('\0')).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['']);

            // with right-padding but invalid length
            columnProto.setLength(2);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(Buffer.from('foo\0')).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['foo']);

            // with right-padding
            columnProto.setLength(5);
            columnProto.setFlags(1);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(Buffer.from('foo\0')).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['foo  ']);
        });

        it('returns NULL values', () => {
            const columnProto = new ResultsetStub.ColumnMetaData(); // any type

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(new Uint8Array());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([null]);
        });

        it('returns enum values as JavaScript strings', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.ENUM]);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(Buffer.from('foo\0')).valueOf());
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['foo']);
        });

        it('returns time values as JavaScript strings', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.TIME]);

            let time = Buffer.alloc(2);
            time.writeUInt8(22, 1);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(time).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['+22:00:00.000000']);

            time = Buffer.alloc(2, 1);
            time.writeUInt8(5, 1);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(time).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['-05:00:00.000000']);

            time = Buffer.alloc(3, 1);
            time.writeUInt8(14, 1);
            time.writeUInt8(47, 2);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(time).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['-14:47:00.000000']);

            time = Buffer.alloc(4);
            time.writeUInt8(8, 1);
            time.writeUInt8(8, 2);
            time.writeUInt8(8, 3);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(time).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['+08:08:08.000000']);

            time = Buffer.alloc(4, 1);
            time.writeUInt8(20, 1);
            time.writeUInt8(17, 2);
            time.writeUInt8(54, 3);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 999999);

            const useconds = Buffer.from(writer.getResultBuffer().slice(1));

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(Buffer.concat([time, useconds], time.length + useconds.length)).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal(['-20:17:54.999999']);
        });

        it('returns datetime values as JavaScript dates', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.DATETIME]);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 9999);

            let year = Buffer.from(writer.getResultBuffer().slice(1));
            let dayAndMonth = Buffer.allocUnsafe(2);
            dayAndMonth.writeUInt8(12);
            dayAndMonth.writeUInt8(25, 1);

            let datetime = Buffer.concat([year, dayAndMonth], year.length + dayAndMonth.length);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(datetime).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([new Date('9999-12-25')]);

            writer.reset();
            writer.writeUint64(1, 2018);

            year = Buffer.from(writer.getResultBuffer().slice(1));
            dayAndMonth = Buffer.allocUnsafe(2);
            dayAndMonth.writeUInt8(2);
            dayAndMonth.writeUInt8(19, 1);

            // works with additional time data as well

            const hourAndMinute = Buffer.allocUnsafe(2);
            hourAndMinute.writeUInt8(15);
            hourAndMinute.writeUInt8(9, 1);

            datetime = Buffer.concat([year, dayAndMonth, hourAndMinute], year.length + dayAndMonth.length + hourAndMinute.length);

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(datetime).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([new Date('2018-02-19T15:09:00.000Z')]);
        });

        it('returns timestamp values as JavaScript numbers', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.DATETIME]);
            columnProto.setFlags(1);

            const writer = new BinaryWriter();
            writer.writeUint64(1, 2018);

            const year = Buffer.from(writer.getResultBuffer().slice(1));
            const fromMonthToSeconds = Buffer.allocUnsafe(5);
            fromMonthToSeconds.writeUInt8(2);
            fromMonthToSeconds.writeUInt8(19, 1);
            fromMonthToSeconds.writeUInt8(15, 2);
            fromMonthToSeconds.writeUInt8(21, 3);
            fromMonthToSeconds.writeUInt8(26, 4);

            writer.reset();
            writer.writeUint64(1, 123000);

            const useconds = Buffer.from(writer.getResultBuffer().slice(1));
            const datetime = Buffer.concat([year, fromMonthToSeconds, useconds], year.length + fromMonthToSeconds.length + useconds.length);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(datetime).valueOf());
            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([(new Date('2018-02-19T15:21:26.123Z')).getTime()]);
        });

        it('returns decimal values as JavaScript numbers when there is no risk of precision loss', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.DECIMAL]);
            const decimal = Buffer.from('04123401d0', 'hex'); // d0 => sign ("-")

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(decimal).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([-12.3401]);
        });

        it('returns decimal values as JavaScript strings when there is a risk of precision loss', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.DECIMAL]);
            const overflow = Number.MAX_SAFE_INTEGER + 1; // length = 16
            const safeNumber = 9; // length = 1

            let scale = '10'; // overflow size in hexadecimal (parseInt(10, 16) = 16)
            let decimal = Buffer.from(`${scale}${safeNumber}${overflow}c0`, 'hex'); // c0 => sign ("+")

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(bytes.create(decimal).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([`${safeNumber}.${overflow}`]);

            scale = '01'; // safe number size in hexadecimal
            decimal = Buffer.from(`${scale}${overflow}${safeNumber}d0`, 'hex'); // d0 => sign ("-")

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(decimal).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([`-${overflow}.${safeNumber}`]);

            scale = '10'; // overflow size in hexadecimal (parseInt(10, 16) = 16)
            decimal = Buffer.from(`${scale}${overflow}${overflow}c0`, 'hex'); // c0 => sign ("+")

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(decimal).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([`${overflow}.${overflow}`]);
        });

        it('returns set values as JavaScript arrays', () => {
            const columnProto = new ResultsetStub.ColumnMetaData([ResultsetStub.ColumnMetaData.FieldType.SET]);

            const rowProto = new ResultsetStub.Row();
            rowProto.addField(new Uint8Array());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([null]);

            let setDefinition = Buffer.from('00', 'hex');

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(setDefinition).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([['']]);

            setDefinition = Buffer.from('01', 'hex');

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(setDefinition).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([[]]);

            setDefinition = Buffer.from('0100', 'hex');

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(setDefinition).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([['\0']]);

            // BUG#31654667
            const x = Buffer.from('x').toString('hex');
            const y = Buffer.from('y').toString('hex');

            setDefinition = Buffer.from(`01${x}01${y}`, 'hex');

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(setDefinition).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([['x', 'y']]);

            const foo = Buffer.from('foo').toString('hex');
            const bar = Buffer.from('bar').toString('hex');

            setDefinition = Buffer.from(`03${foo}03${bar}`, 'hex');

            rowProto.clearFieldList();
            rowProto.addField(bytes.create(setDefinition).valueOf());

            expect(row(rowProto, { metadata: [columnMetadata(columnProto)] }).toArray()).to.deep.equal([['foo', 'bar']]);
        });
    });
});
