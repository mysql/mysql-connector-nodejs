'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

context('Protobuf Mysqlx.Resultset Adapter', () => {
    let createTypedArrayFromBuffer, deserializeBinary, getType, toObject;

    beforeEach('create fakes', () => {
        createTypedArrayFromBuffer = td.function();
        deserializeBinary = td.function();
        getType = td.function();
        toObject = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('decodeColumnMetadata()', () => {
        let Resultset;

        beforeEach('create fakes', () => {
            td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb', { ColumnMetaData: { deserializeBinary } });
            td.replace('../../../../lib/Protocol/Util', { createTypedArrayFromBuffer });

            Resultset = require('../../../../lib/Protocol/Protobuf/Adapters/Resultset');
        });

        it('creates and returns an instance of the ColumnMetadata type', () => {
            const proto = { toObject, getType };

            td.when(getType()).thenReturn('foo');
            td.when(createTypedArrayFromBuffer('bar')).thenReturn('baz');
            td.when(deserializeBinary('baz')).thenReturn(proto);

            expect(Resultset.decodeColumnMetaData('bar').getTypeId()).to.equal('foo');
        });
    });

    context('decodeRow()', () => {
        let Resultset;

        beforeEach('create fakes', () => {
            td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb', { Row: { deserializeBinary } });
            td.replace('../../../../lib/Protocol/Util', { createTypedArrayFromBuffer });

            Resultset = require('../../../../lib/Protocol/Protobuf/Adapters/Resultset');
        });

        it('creates and returns an instance of the Row type without column metadata', () => {
            const proto = { toObject };

            td.when(createTypedArrayFromBuffer('foo')).thenReturn('bar');
            td.when(deserializeBinary('bar')).thenReturn(proto);

            return expect(Resultset.decodeRow('foo').getColumnMetadata()).to.be.an('array').and.be.empty;
        });

        it('creates and returns an instance of the Row type with column metadata', () => {
            const proto = { toObject };
            const metadata = ['foo', 'bar'];

            td.when(createTypedArrayFromBuffer('baz')).thenReturn('qux');
            td.when(deserializeBinary('qux')).thenReturn(proto);

            return expect(Resultset.decodeRow('baz', { metadata }).getColumnMetadata()).to.deep.equal(metadata);
        });
    });
});
