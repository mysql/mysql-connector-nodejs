'use strict';

/* eslint-env node, mocha */

const Any = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Any;
const ArrayStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Array;
const ContentType = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb').ContentType_BYTES;
const Datatypes = require('../../../../lib/Protocol/Protobuf/Adapters/Datatypes');
const ObjectStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Object;
const Scalar = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;

describe('Protobuf', () => {
    context('Datatypes', () => {
        context('createScalar()', () => {
            it('returns a Mysqlx.Datatypes.Scalar.Type.V_NULL for `null`', () => {
                expect(Datatypes.createScalar(null).getType()).to.equal(Scalar.Type.V_NULL);
            });

            it('returns a Mysqlx.Datatypes.Scalar.Type.V_NULL for `undefined`', () => {
                expect(Datatypes.createScalar().getType()).to.equal(Scalar.Type.V_NULL);
            });

            it('returns a Mysqlx.Datatypes.Scalar.Type.V_STRING for Date', () => {
                const now = new Date();
                const scalar = Datatypes.createScalar(now);

                expect(scalar.getType()).to.equal(Scalar.Type.V_STRING);
                // eslint-disable-next-line node/no-deprecated-api
                expect(new Buffer(scalar.getVString().getValue()).toString()).to.equal(now.toJSON());
            });

            it('returns a Mysqlx.Datatypes.Scalar.Type.V_OCTETS for Buffer', () => {
                // eslint-disable-next-line node/no-deprecated-api
                const bin = new Buffer('foo');
                const scalar = Datatypes.createScalar(bin);

                expect(scalar.getType()).to.equal(Scalar.Type.V_OCTETS);
                // eslint-disable-next-line node/no-deprecated-api
                expect(new Buffer(scalar.getVOctets().getValue()).toString()).to.equal('foo');
            });
        });

        context('createAny()', () => {
            it('returns a Mysqlx.Datatypes.Any object for valid literals', () => {
                let any = Datatypes.createAny('foo');

                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(any.getScalar().getVString().getValue()).toString()).to.equal('foo');
                /* eslint-enable node/no-deprecated-api */

                any = Datatypes.createAny(1);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_UINT);
                expect(any.getScalar().getVUnsignedInt()).to.equal(1);

                any = Datatypes.createAny(1.2);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_FLOAT);
                expect(any.getScalar().getVFloat()).to.equal(1.2);

                any = Datatypes.createAny(1.2345678910);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_DOUBLE);
                expect(any.getScalar().getVDouble()).to.equal(1.2345678910);

                any = Datatypes.createAny(true);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(any.getScalar().getVBool()).to.equal(true);

                any = Datatypes.createAny(false);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(any.getScalar().getVBool()).to.equal(false);

                any = Datatypes.createAny(null);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_NULL);

                any = Datatypes.createAny(undefined);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_NULL);

                const literal = new Scalar();
                literal.setType(Scalar.Type.V_BOOL);
                literal.setVBool(true);

                any = Datatypes.createAny(literal);

                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(any.getScalar().getVBool()).to.equal(true);
            });

            it('returns a Mysqlx.Datatypes.Any object for arrays', () => {
                let any = Datatypes.createAny([]);

                expect(any.getType()).to.equal(Any.Type.ARRAY);
                expect(any.getArray().getValueList()).to.have.lengthOf(0);

                any = Datatypes.createAny(['foo', 1, 1.2, 1.2345678910, true, false, null]);
                expect(any.getType()).to.equal(Any.Type.ARRAY);
                expect(any.getArray().getValueList()).to.have.lengthOf(7);
            });

            it('returns a Mysqlx.Datatypes.Any object for objects', () => {
                let any = Datatypes.createAny({});

                expect(any.getType()).to.equal(Any.Type.OBJECT);
                expect(any.getObj().getFldList()).to.have.lengthOf(0);

                any = Datatypes.createAny({ name: 'bar', age: 23, active: true });

                expect(any.getType()).to.equal(Any.Type.OBJECT);
                expect(any.getObj().getFldList()).to.have.lengthOf(3);
            });

            it('throws an error if the input is not a valid array', () => {
                const exception = 'Invalid datatype for Mysqlx.Datatypes.Array';

                expect(() => Datatypes.createArray()).to.throw(exception);
                expect(() => Datatypes.createArray(() => {})).to.throw(exception);
            });
        });

        context('createArray()', () => {
            it('returns a Mysqlx.Datatypes.Array object for arrays', () => {
                const array = Datatypes.createArray([1, { foo: ['bar'] }]);
                let values = array.getValueList();

                expect(values).to.have.lengthOf(2);
                expect(values[0].getType()).to.equal(Any.Type.SCALAR);
                expect(values[0].getScalar().getType()).to.equal(Scalar.Type.V_UINT);
                expect(values[0].getScalar().getVUnsignedInt()).to.equal(1);
                expect(values[1].getType()).to.equal(Any.Type.OBJECT);

                let fields = values[1].getObj().getFldList();
                expect(fields).to.have.lengthOf(1);
                expect(fields[0].getKey()).to.equal('foo');
                expect(fields[0].getValue().getType()).to.equal(Any.Type.ARRAY);

                values = fields[0].getValue().getArray().getValueList();
                expect(values).to.have.lengthOf(1);
                expect(values[0].getType()).to.equal(Any.Type.SCALAR);
                expect(values[0].getScalar().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(values[0].getScalar().getVString().getValue()).toString()).to.equal('bar');
                /* eslint-enable node/no-deprecated-api */
            });

            it('throws an error if the input is not a valid array', () => {
                const exception = 'Invalid datatype for Mysqlx.Datatypes.Array.';

                expect(() => Datatypes.createArray()).to.throw(exception);
                expect(() => Datatypes.createArray(null)).to.throw(exception);
                expect(() => Datatypes.createArray(1)).to.throw(exception);
                expect(() => Datatypes.createArray(1.2)).to.throw(exception);
                expect(() => Datatypes.createArray(true)).to.throw(exception);
                expect(() => Datatypes.createArray(false)).to.throw(exception);
                expect(() => Datatypes.createArray({})).to.throw(exception);
                expect(() => Datatypes.createArray({ foo: 'bar' })).to.throw(exception);
                expect(() => Datatypes.createArray(() => {})).to.throw(exception);
            });
        });

        context('createObject()', () => {
            it('returns a Mysqlx.Datatypes.Object object for objects', () => {
                const obj = Datatypes.createObject({
                    root: 'foo',
                    nested: [{
                        root: 'bar'
                    }]
                });

                let fields = obj.getFldList();

                expect(fields).to.have.length(2);
                expect(fields[0].getKey()).to.equal('root');
                expect(fields[0].getValue().getType()).to.equal(Any.Type.SCALAR);
                expect(fields[0].getValue().getScalar().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(fields[0].getValue().getScalar().getVString().getValue()).toString()).to.equal('foo');
                /* eslint-enable node/no-deprecated-api */
                expect(fields[1].getKey()).to.equal('nested');
                expect(fields[1].getValue().getType()).to.equal(Any.Type.ARRAY);

                let values = fields[1].getValue().getArray().getValueList();
                expect(values).to.have.lengthOf(1);
                expect(values[0].getType()).to.equal(Any.Type.OBJECT);

                fields = values[0].getObj().getFldList();
                expect(fields).to.have.lengthOf(1);
                expect(fields[0].getKey()).to.equal('root');
                expect(fields[0].getValue().getType()).to.equal(Any.Type.SCALAR);
                expect(fields[0].getValue().getScalar().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(fields[0].getValue().getScalar().getVString().getValue()).toString()).to.equal('bar');
                /* eslint-enable node/no-deprecated-api */
            });

            it('throws an error if the input is not a valid array', () => {
                const exception = 'Invalid datatype for Mysqlx.Datatypes.Object.';

                expect(() => Datatypes.createObject()).to.throw(exception);
                expect(() => Datatypes.createObject(null)).to.throw(exception);
                expect(() => Datatypes.createObject(1)).to.throw(exception);
                expect(() => Datatypes.createObject(1.2)).to.throw(exception);
                expect(() => Datatypes.createObject(true)).to.throw(exception);
                expect(() => Datatypes.createObject(false)).to.throw(exception);
                expect(() => Datatypes.createObject([])).to.throw(exception);
                expect(() => Datatypes.createObject(['foo'])).to.throw(exception);
                expect(() => Datatypes.createObject(() => {})).to.throw(exception);
            });
        });

        context('extractAny()', () => {
            it('fails with an unknown datatype', () => {
                const wrap = new Any();
                wrap.setType(0);

                expect(() => Datatypes.extractAny(wrap)).to.throw('Invalid datatype for Mysqlx.Datatypes.Any.');
            });

            it('extracts a JavaScript primitive type from a Mysqlx.Datatypes.Any', () => {
                const expected = 'foo';

                const foo = new Scalar.String();
                foo.setValue('foo');

                const fooWrap = new Scalar();
                fooWrap.setType(Scalar.Type.V_STRING);
                fooWrap.setVString(foo);

                const wrap = new Any();
                wrap.setType(Any.Type.SCALAR);
                wrap.setScalar(fooWrap);

                expect(Datatypes.extractAny(wrap)).to.equal(expected);
            });

            it('extracts a JavaScript Array from a Mysqlx.Datatypes.Any', () => {
                const expected = ['foo'];

                const foo = new Scalar.String();
                foo.setValue('foo');

                const fooWrap = new Scalar();
                fooWrap.setType(Scalar.Type.V_STRING);
                fooWrap.setVString(foo);

                const value = new Any();
                value.setType(Any.Type.SCALAR);
                value.setScalar(fooWrap);

                const array = new ArrayStub();
                array.addValue(value);

                const wrap = new Any();
                wrap.setType(Any.Type.ARRAY);
                wrap.setArray(array);

                expect(Datatypes.extractAny(wrap)).to.deep.equal(expected);
            });

            it('extracts a JavaScript Object from a Mysqlx.Datatypes.Any', () => {
                const expected = { foo: 'bar' };

                const bar = new Scalar.String();
                bar.setValue('bar');

                const barWrap = new Scalar();
                barWrap.setType(Scalar.Type.V_STRING);
                barWrap.setVString(bar);

                const value = new Any();
                value.setType(Any.Type.SCALAR);
                value.setScalar(barWrap);

                const field = new ObjectStub.ObjectField();
                field.setKey('foo');
                field.setValue(value);

                const obj = new ObjectStub();
                obj.addFld(field);

                const wrap = new Any();
                wrap.setType(Any.Type.OBJECT);
                wrap.setObj(obj);

                expect(Datatypes.extractAny(wrap)).to.deep.equal(expected);
            });
        });

        context('extractScalar()', () => {
            it('returns a Node.js buffer for binary data', () => {
                const octets = new Scalar.Octets();
                octets.setContentType(ContentType.GEOMETRY);
                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer('foo');
                /* eslint-enable node/no-deprecated-api */
                octets.setValue(new Uint8Array(data));

                const scalar = new Scalar();
                scalar.setType(Scalar.Type.V_OCTETS);
                scalar.setVOctets(octets);

                expect(Datatypes.extractScalar(scalar)).to.deep.equal(data);
            });

            it('returns a JavaScript string for textual data', () => {
                const octets = new Scalar.Octets();
                octets.setContentType(ContentType.JSON);
                /* eslint-disable node/no-deprecated-api */
                octets.setValue(new Uint8Array(new Buffer('foo')));
                /* eslint-enable node/no-deprecated-api */

                const scalar = new Scalar();
                scalar.setType(Scalar.Type.V_OCTETS);
                scalar.setVOctets(octets);

                expect(Datatypes.extractScalar(scalar)).to.equal('foo');
            });
        });
    });
});
