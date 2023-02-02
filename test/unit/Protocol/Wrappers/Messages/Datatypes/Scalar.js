/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
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

const ScalarStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let Scalar = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');

describe('Mysqlx.Datatypes.Scalar wrapper', () => {
    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('creates an empty wrapper for undefined values', () => {
                const scalar = Scalar.create();

                expect(scalar.valueOf).to.be.a('function');
                // eslint-disable-next-line no-unused-expressions
                expect(scalar.valueOf()).to.not.exist;
            });

            it('creates an empty wrapper for unknown types', () => {
                const scalar = Scalar.create(() => {});

                expect(scalar.valueOf).to.be.a('function');
                // eslint-disable-next-line no-unused-expressions
                expect(scalar.valueOf()).to.not.exist;
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar for the "null" value', () => {
                expect(Scalar.create({ value: null }).valueOf().getType()).to.equal(ScalarStub.Type.V_NULL);
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar wrapper for positive numbers', () => {
                const value = 3;
                const proto = Scalar.create({ value }).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_UINT);
                expect(proto.getVUnsignedInt()).to.equal(value.toString());
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar wrapper for negative numbers', () => {
                const value = -3;
                const proto = Scalar.create({ value }).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_SINT);
                expect(proto.getVSignedInt()).to.equal(value.toString());
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar for floating point numbers', () => {
                let value = 3.14;

                let proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(value);

                value = -3.14;

                proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(value);

                value = 1.0001;

                proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(value);

                value = -1.0001;

                proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(value);

                value = Math.PI;

                proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(value);

                value = -Math.PI;

                proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(value);
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar wrapper for opaque values', () => {
                const value = 'foo';
                const expected = Buffer.from(value);
                const proto = Scalar.create({ value, opaque: true }).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_OCTETS);
                expect(Buffer.from(proto.getVOctets().getValue())).to.deep.equal(expected);
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar for booleans', () => {
                let value = false;

                let proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_BOOL);
                expect(proto.getVBool()).to.equal(value);

                value = true;

                proto = Scalar.create({ value }).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_BOOL);
                expect(proto.getVBool()).to.equal(value);
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar wrapper for Date instances', () => {
                const value = new Date();
                const dateString = value.toJSON();
                const proto = Scalar.create({ value }).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_STRING);
                // MySQL does not support the Zulu Time indicator used in the
                // ISO 8601 convention for Date instances.
                // 'Z' should be replaced by '+00:00' which has similar
                // meaning.
                const supportedDateString = dateString.substring(0, dateString.length - 1).concat('+00:00');
                expect(Buffer.from(proto.getVString().getValue()).toString()).to.equal(supportedDateString);
            });

            it('creates an appropriately typed Mysqlx.Datatypes.Scalar wrapper for strings', () => {
                const value = 'foo';
                const proto = Scalar.create({ value }).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_STRING);
                expect(Buffer.from(proto.getVString().getValue()).toString()).to.equal(value);
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the textual representation of the type enum', () => {
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_SINT])).getType()).to.equal('V_SINT');
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_UINT])).getType()).to.equal('V_UINT');
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_NULL])).getType()).to.equal('V_NULL');
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_OCTETS])).getType()).to.equal('V_OCTETS');
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_DOUBLE])).getType()).to.equal('V_DOUBLE');
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_FLOAT])).getType()).to.equal('V_FLOAT');
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_BOOL])).getType()).to.equal('V_BOOL');
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_STRING])).getType()).to.equal('V_STRING');
            });
        });

        context('toJSON()', () => {
            let Octets, VString;

            beforeEach('replace dependencies with test doubles', () => {
                Octets = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Octets');
                VString = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/String');
                // reload module with the replacements
                Scalar = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_SINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_SINT]);
                proto.setVSignedInt(-3);

                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_SINT', v_signed_int: -3n });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_UINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_UINT]);
                proto.setVUnsignedInt(3);

                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_UINT', v_unsigned_int: 3n });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_NULL stub instance', () => {
                expect(Scalar(new ScalarStub([ScalarStub.Type.V_NULL])).toJSON()).to.deep.equal({ type: 'V_NULL' });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_OCTETS stub instance', () => {
                const toJSON = td.function();
                const bin = new ScalarStub.Octets();
                bin.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_OCTETS]);
                proto.setVOctets(bin);

                td.when(toJSON()).thenReturn('bar');
                td.when(Octets(bin)).thenReturn({ toJSON });

                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_OCTETS', v_octets: 'bar' });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_DOUBLE stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_DOUBLE]);
                proto.setVDouble(3);

                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_DOUBLE', v_double: 3 });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_FLOAT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_FLOAT]);
                proto.setVFloat(3);

                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_FLOAT', v_float: 3 });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_BOOL stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_BOOL]);

                proto.setVBool(false);
                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_BOOL', v_bool: false });

                proto.setVBool(true);
                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_BOOL', v_bool: true });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_STRING stub instance', () => {
                const toJSON = td.function();
                const protoString = new ScalarStub.String();
                protoString.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_STRING]);
                proto.setVString(protoString);

                td.when(toJSON()).thenReturn('bar');
                td.when(VString(protoString)).thenReturn({ toJSON });

                expect(Scalar(proto).toJSON()).to.deep.equal({ type: 'V_STRING', v_string: 'bar' });
            });
        });

        context('toLiteral()', () => {
            let Octets, VString;

            beforeEach('replace dependencies with test doubles', () => {
                Octets = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Octets');
                VString = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/String');
                // reload module with the replacements
                Scalar = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
            });

            it('returns a JavaScript BigInt for a Mysqlx.Datatypes.Scalar.V_SINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_SINT]);
                proto.setVSignedInt(-3);

                expect(Scalar(proto).toLiteral()).to.equal(-3n);
            });

            it('returns a JavaScript BigInt for a Mysqlx.Datatypes.Scalar.V_UINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_UINT]);
                proto.setVUnsignedInt(3);

                expect(Scalar(proto).toLiteral()).to.equal(3n);
            });

            it('returns null for a Mysqlx.Datatypes.Scalar.V_NULL stub instance', () => {
                return expect(Scalar(new ScalarStub([ScalarStub.Type.V_NULL])).toLiteral()).to.be.null;
            });

            it('returns the output of Octets wrapper toBuffer() method for a Mysqlx.Datatypes.Scalar.V_OCTETS stub instance', () => {
                const toBuffer = td.function();
                const bin = new ScalarStub.Octets();
                bin.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_OCTETS]);
                proto.setVOctets(bin);

                td.when(toBuffer()).thenReturn('bar');
                td.when(Octets(bin)).thenReturn({ toBuffer });

                expect(Scalar(proto).toLiteral()).to.equal('bar');
            });

            it('returns a JavaScript number for a Mysqlx.Datatypes.Scalar.V_DOUBLE stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_DOUBLE]);
                proto.setVDouble(3);

                expect(Scalar(proto).toLiteral()).to.equal(3);
            });

            it('returns a JavaScript number for a Mysqlx.Datatypes.Scalar.V_FLOAT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_FLOAT]);
                proto.setVFloat(3);

                expect(Scalar(proto).toLiteral()).to.equal(3);
            });

            it('returns a JavaScript boolean for a Mysqlx.Datatypes.Scalar.V_BOOL stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_BOOL]);
                proto.setVBool(false);
                // eslint-disable-next-line no-unused-expressions
                expect(Scalar(proto).toLiteral()).to.be.false;

                proto.setVBool(true);
                return expect(Scalar(proto).toLiteral()).to.be.true;
            });

            it('returns the output of String wrapper toString() method for a Mysqlx.Datatypes.Scalar.V_STRING stub instance', () => {
                const toString = td.function();
                const protoString = new ScalarStub.String();
                protoString.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_STRING]);
                proto.setVString(protoString);

                td.when(toString()).thenReturn('bar');
                td.when(VString(protoString)).thenReturn({ toString });

                expect(Scalar(proto).toLiteral()).to.equal('bar');
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Scalar = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new ScalarStub();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Scalar(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
