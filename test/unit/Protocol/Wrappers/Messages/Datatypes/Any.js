'use strict';

/* eslint-env node, mocha */

const DatatypesStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb');
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');

describe('Mysqlx.Datatypes.Scalar.Any wrapper', () => {
    let scalar;

    beforeEach('create fakes', () => {
        scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        let valueOf;

        beforeEach('create fakes', () => {
            valueOf = td.function();
        });

        context('create()', () => {
            it('creates and wraps a Mysqlx.Datatypes.Scalar for the corresponding JavaScript values', () => {
                const scalarProto = new DatatypesStub.Scalar();

                td.when(valueOf()).thenReturn(scalarProto);
                td.when(scalar.create('foo')).thenReturn({ valueOf });
                td.when(scalar.canEncode('foo')).thenReturn(true);

                const proto = any.create('foo').valueOf();
                expect(proto.getType()).to.equal(DatatypesStub.Any.Type.SCALAR);
                expect(proto.getScalar()).to.equal(scalarProto);
            });

            it('creates and wraps a Mysqlx.Datatypes.Object for plain JavaScript objects', () => {
                const scalarProto = new DatatypesStub.Scalar();

                td.when(valueOf()).thenReturn(scalarProto);
                td.when(scalar.create('foo')).thenReturn({ valueOf });
                td.when(scalar.canEncode('foo')).thenReturn(true);

                const proto = any.create({ name: 'foo' }).valueOf();
                expect(proto.getType()).to.equal(DatatypesStub.Any.Type.OBJECT);
                expect(proto.getObj().getFldList()).to.have.lengthOf(1);
                expect(proto.getObj().getFldList()[0].getKey()).to.equal('name');
                expect(proto.getObj().getFldList()[0].getValue().getType()).to.equal(DatatypesStub.Any.Type.SCALAR);
                expect(proto.getObj().getFldList()[0].getValue().getScalar()).to.equal(scalarProto);
            });

            it('creates and wraps a Mysqlx.Datatypes.Array for JavaScript arrays', () => {
                const scalarProto = new DatatypesStub.Scalar();

                td.when(valueOf()).thenReturn(scalarProto);
                td.when(scalar.create('foo')).thenReturn({ valueOf });
                td.when(scalar.canEncode('foo')).thenReturn(true);

                const proto = any.create(['foo']).valueOf();
                expect(proto.getType()).to.equal(DatatypesStub.Any.Type.ARRAY);
                expect(proto.getArray().getValueList()).to.have.lengthOf(1);
                expect(proto.getArray().getValueList()[0].getType()).to.equal(DatatypesStub.Any.Type.SCALAR);
                expect(proto.getArray().getValueList()[0].getScalar()).to.equal(scalarProto);
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the textual representation of the type enum', () => {
                expect(any(new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR])).getType()).to.equal('SCALAR');
                expect(any(new DatatypesStub.Any([DatatypesStub.Any.Type.OBJECT])).getType()).to.equal('OBJECT');
                expect(any(new DatatypesStub.Any([DatatypesStub.Any.Type.ARRAY])).getType()).to.equal('ARRAY');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Datatypes.Any.Scalar for a corresponding value', () => {
                const toJSON = td.function();
                const scalarProto = new DatatypesStub.Scalar();

                let proto = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                proto.setScalar(scalarProto);

                td.when(toJSON()).thenReturn('foo');
                td.when(scalar(scalarProto)).thenReturn({ toJSON });

                expect(any(proto).toJSON()).to.deep.equal({ type: 'SCALAR', scalar: 'foo' });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Any stub instance for an object', () => {
                const toJSON = td.function();

                const scalarProto = new DatatypesStub.Scalar();

                const value = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                value.setScalar(scalarProto);

                const objectFieldProto = new DatatypesStub.Object.ObjectField();
                objectFieldProto.setKey('name');
                objectFieldProto.setValue(value);

                const objectProto = new DatatypesStub.Object();
                objectProto.setFldList([objectFieldProto]);

                const proto = new DatatypesStub.Any([DatatypesStub.Any.Type.OBJECT]);
                proto.setObj(objectProto);

                td.when(toJSON()).thenReturn('foo');
                td.when(scalar(scalarProto)).thenReturn({ toJSON });

                expect(any(proto).toJSON()).to.deep.equal({ type: 'OBJECT', obj: { fld: [{ key: 'name', value: { type: 'SCALAR', scalar: 'foo' } }] } });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Any stub instance for an array', () => {
                const toJSON = td.function();

                const scalarProto = new DatatypesStub.Scalar();

                const value = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                value.setScalar(scalarProto);

                const arrayProto = new DatatypesStub.Array();
                arrayProto.setValueList([value]);

                const proto = new DatatypesStub.Any([DatatypesStub.Any.Type.ARRAY]);
                proto.setArray(arrayProto);

                td.when(toJSON()).thenReturn('foo');
                td.when(scalar(scalarProto)).thenReturn({ toJSON });

                expect(any(proto).toJSON()).to.deep.equal({ type: 'ARRAY', array: { value: [{ type: 'SCALAR', scalar: 'foo' }] } });
            });
        });

        context('toLiteral()', () => {
            it('returns the output of the Scalar wrapper toLiteral method for the corresponding JavaScript values', () => {
                const toLiteral = td.function();
                const scalarProto = new DatatypesStub.Scalar();

                let proto = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                proto.setScalar(scalarProto);

                td.when(toLiteral()).thenReturn('foo');
                td.when(scalar(scalarProto)).thenReturn({ toLiteral });

                expect(any(proto).toLiteral()).to.equal('foo');
            });

            it('returns a plain JavaScript object for a Mysqlx.Datatypes.Scalar.Object stub instance', () => {
                const toLiteral = td.function();

                const scalarProto = new DatatypesStub.Scalar();

                const value = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                value.setScalar(scalarProto);

                const objectFieldProto = new DatatypesStub.Object.ObjectField();
                objectFieldProto.setKey('name');
                objectFieldProto.setValue(value);

                const objectProto = new DatatypesStub.Object();
                objectProto.setFldList([objectFieldProto]);

                const proto = new DatatypesStub.Any([DatatypesStub.Any.Type.OBJECT]);
                proto.setObj(objectProto);

                td.when(toLiteral()).thenReturn('foo');
                td.when(scalar(scalarProto)).thenReturn({ toLiteral });

                expect(any(proto).toLiteral()).to.deep.equal({ name: 'foo' });
            });

            it('returns a JavaScript array for a Mysqlx.Datatypes.Scalar.Array stub instance', () => {
                const toLiteral = td.function();

                const scalarProto = new DatatypesStub.Scalar();

                const value = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                value.setScalar(scalarProto);

                const arrayProto = new DatatypesStub.Array();
                arrayProto.setValueList([value]);

                const proto = new DatatypesStub.Any([DatatypesStub.Any.Type.ARRAY]);
                proto.setArray(arrayProto);

                td.when(toLiteral()).thenReturn('foo');
                td.when(scalar(scalarProto)).thenReturn({ toLiteral });

                expect(any(proto).toLiteral()).to.deep.equal(['foo']);
            });
        });

        context('valueOf()', () => {
            let wraps;

            beforeEach('create fakes', () => {
                wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new DatatypesStub.Any();
                const valueOf = td.function();

                td.when(valueOf()).thenReturn('foo');
                td.when(wraps(proto)).thenReturn({ valueOf });

                expect(any(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
