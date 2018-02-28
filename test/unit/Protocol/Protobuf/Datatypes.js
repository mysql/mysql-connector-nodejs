'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Any = require('lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Any;
const ContentType = require('lib/Protocol/Protobuf/Stubs/mysqlx_resultset_pb').ContentType_BYTES;
const Datatypes = require('lib/Protocol/Protobuf/Adapters/Datatypes');
const Scalar = require('lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;

describe('Protobuf', () => {
    context('Datatypes', () => {
        context('decodeScalar()', () => {
            it('should return a Node.js buffer for binary data', () => {
                const octets = new Scalar.Octets();
                octets.setContentType(ContentType.GEOMETRY);
                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer('foo');
                /* eslint-enable node/no-deprecated-api */
                octets.setValue(new Uint8Array(data));

                const scalar = new Scalar();
                scalar.setType(Scalar.Type.V_OCTETS);
                scalar.setVOctets(octets);

                expect(Datatypes.decodeScalar(scalar)).to.deep.equal(data);
            });

            it('should return a JavaScript string for textual data', () => {
                const octets = new Scalar.Octets();
                octets.setContentType(ContentType.JSON);
                /* eslint-disable node/no-deprecated-api */
                octets.setValue(new Uint8Array(new Buffer('foo')));
                /* eslint-enable node/no-deprecated-api */

                const scalar = new Scalar();
                scalar.setType(Scalar.Type.V_OCTETS);
                scalar.setVOctets(octets);

                expect(Datatypes.decodeScalar(scalar)).to.equal('foo');
            });
        });

        context('encodeAny()', () => {
            it('should return a Mysqlx.Datatypes.Any object for valid literals', () => {
                let any = Datatypes.encodeAny('foo');

                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(any.getScalar().getVString().getValue()).toString()).to.equal('foo');
                /* eslint-enable node/no-deprecated-api */

                any = Datatypes.encodeAny(1);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_UINT);
                expect(any.getScalar().getVUnsignedInt()).to.equal(1);

                any = Datatypes.encodeAny(1.2);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_FLOAT);
                expect(any.getScalar().getVFloat()).to.equal(1.2);

                any = Datatypes.encodeAny(1.2345678910);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_DOUBLE);
                expect(any.getScalar().getVDouble()).to.equal(1.2345678910);

                any = Datatypes.encodeAny(true);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(any.getScalar().getVBool()).to.equal(true);

                any = Datatypes.encodeAny(false);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(any.getScalar().getVBool()).to.equal(false);

                any = Datatypes.encodeAny(null);
                expect(any.getType()).to.equal(Any.Type.SCALAR);
                expect(any.getScalar().getType()).to.equal(Scalar.Type.V_NULL);
            });

            it('should return a Mysqlx.Datatypes.Any object for arrays', () => {
                let any = Datatypes.encodeAny([]);

                expect(any.getType()).to.equal(Any.Type.ARRAY);
                expect(any.getArray().getValueList()).to.have.lengthOf(0);

                any = Datatypes.encodeAny(['foo', 1, 1.2, 1.2345678910, true, false, null]);
                expect(any.getType()).to.equal(Any.Type.ARRAY);
                expect(any.getArray().getValueList()).to.have.lengthOf(7);
            });

            it('should return a Mysqlx.Datatypes.Any object for objects', () => {
                let any = Datatypes.encodeAny({});

                expect(any.getType()).to.equal(Any.Type.OBJECT);
                expect(any.getObj().getFldList()).to.have.lengthOf(0);

                any = Datatypes.encodeAny({ name: 'bar', age: 23, active: true });

                expect(any.getType()).to.equal(Any.Type.OBJECT);
                expect(any.getObj().getFldList()).to.have.lengthOf(3);
            });

            it('should throw an error if the input is not a valid array', () => {
                const exception = 'Invalid datatype for Mysqlx.Datatypes.Array';

                expect(() => Datatypes.encodeArray()).to.throw(exception);
                expect(() => Datatypes.encodeArray(() => {})).to.throw(exception);
            });
        });

        context('encodeArray()', () => {
            it('should return a Mysqlx.Datatypes.Array object for arrays', () => {
                const array = Datatypes.encodeArray([1, { foo: ['bar'] }]);
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

            it('should throw an error if the input is not a valid array', () => {
                const exception = 'Invalid datatype for Mysqlx.Datatypes.Array.';

                expect(() => Datatypes.encodeArray()).to.throw(exception);
                expect(() => Datatypes.encodeArray(null)).to.throw(exception);
                expect(() => Datatypes.encodeArray(1)).to.throw(exception);
                expect(() => Datatypes.encodeArray(1.2)).to.throw(exception);
                expect(() => Datatypes.encodeArray(true)).to.throw(exception);
                expect(() => Datatypes.encodeArray(false)).to.throw(exception);
                expect(() => Datatypes.encodeArray({})).to.throw(exception);
                expect(() => Datatypes.encodeArray({ foo: 'bar' })).to.throw(exception);
                expect(() => Datatypes.encodeArray(() => {})).to.throw(exception);
            });
        });

        context('encodeObject()', () => {
            it('should return a Mysqlx.Datatypes.Object object for objects', () => {
                const obj = Datatypes.encodeObject({
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

            it('should throw an error if the input is not a valid array', () => {
                const exception = 'Invalid datatype for Mysqlx.Datatypes.Object.';

                expect(() => Datatypes.encodeObject()).to.throw(exception);
                expect(() => Datatypes.encodeObject(null)).to.throw(exception);
                expect(() => Datatypes.encodeObject(1)).to.throw(exception);
                expect(() => Datatypes.encodeObject(1.2)).to.throw(exception);
                expect(() => Datatypes.encodeObject(true)).to.throw(exception);
                expect(() => Datatypes.encodeObject(false)).to.throw(exception);
                expect(() => Datatypes.encodeObject([])).to.throw(exception);
                expect(() => Datatypes.encodeObject(['foo'])).to.throw(exception);
                expect(() => Datatypes.encodeObject(() => {})).to.throw(exception);
            });
        });
    });
});
