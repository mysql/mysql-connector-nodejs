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

const ScalarStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let scalar = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');

describe('Mysqlx.Datatypes.Scalar wrapper', () => {
    context('class methods', () => {
        context('canEncode()', () => {
            it('returns true if the value is an instance of Mysqlx.Datatypes.Scalar', () => {
                return expect(scalar.canEncode(new ScalarStub())).to.be.true;
            });

            it('returns true if the value is a number', () => {
                /* eslint-disable no-unused-expressions */
                expect(scalar.canEncode(1)).to.be.true;
                expect(scalar.canEncode(0)).to.be.true;
                expect(scalar.canEncode(-1)).to.be.true;
                /* eslint-enabled no-unused-expressions */
            });

            it('returns true if the value is null', () => {
                return expect(scalar.canEncode(null)).to.be.true;
            });

            it('returns true if the value is a Buffer instance', () => {
                return expect(scalar.canEncode(Buffer.from('foo'))).to.be.true;
            });

            it('returns true if the value is a boolean', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(scalar.canEncode(false)).to.be.true;
                return expect(scalar.canEncode(true)).to.be.true;
            });

            it('returns true if the value is a Date instance', () => {
                return expect(scalar.canEncode(new Date())).to.be.true;
            });

            it('returns true if the value is a string', () => {
                return expect(scalar.canEncode('foo')).to.be.true;
            });

            it('returns false if the value cannot be encoded', () => {
                /* eslint-disable no-unused-expressions */
                expect(scalar.canEncode(['foo'])).to.be.false;
                expect(scalar.canEncode([{ name: 'foo' }])).to.be.false;
                expect(scalar.canEncode(() => {})).to.be.false;
                /* eslint-disable no-unused-expressions */
            });
        });

        context('create()', () => {
            it('creates an empty wrapper for undefined values', () => {
                return expect(scalar.create().valueOf()).to.not.exist;
            });

            it('creates a wrapper of a Mysqlx.Datatypes.Scalar', () => {
                const proto = new ScalarStub();

                return expect(scalar.create(proto).valueOf()).to.deep.equal(proto);
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_NULL for `null` values', () => {
                expect(scalar.create(null).valueOf().getType()).to.equal(ScalarStub.Type.V_NULL);
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_UINT for positive numbers', () => {
                const proto = scalar.create(3).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_UINT);
                expect(proto.getVUnsignedInt()).to.equal(3);
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_SINT for negative numbers', () => {
                const proto = scalar.create(-3).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_SINT);
                expect(proto.getVSignedInt()).to.equal(-3);
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_DOUBLE for floating point numbers', () => {
                let proto = scalar.create(3.14).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(3.14);

                proto = scalar.create(-3.14).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(-3.14);

                proto = scalar.create(1.0001).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(1.0001);

                proto = scalar.create(Math.PI).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(Math.PI);

                proto = scalar.create(-Math.PI).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(-Math.PI);

                proto = scalar.create(1.00001).valueOf();
                expect(proto.getType()).to.equal(ScalarStub.Type.V_DOUBLE);
                expect(proto.getVDouble()).to.equal(1.00001);
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_OCTETS for Buffer instances', () => {
                const bin = Buffer.from('foo');
                const proto = scalar.create(bin).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_OCTETS);
                expect(Buffer.from(proto.getVOctets().getValue()).toString()).to.equal('foo');
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_BOOL for booleans', () => {
                let proto = scalar.create(false).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_BOOL);
                expect(proto.getVBool()).to.equal(false);

                proto = scalar.create(true).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_BOOL);
                expect(proto.getVBool()).to.equal(true);
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_STRING for Date instances', () => {
                const now = new Date();
                const dateString = now.toJSON();
                const proto = scalar.create(now).valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_STRING);
                // MySQL does not support the Zulu Time indicator used in the
                // ISO 8601 convention for Date instances.
                // 'Z' should be replaced by '+00:00' which has similar
                // meaning.
                const supportedDateString = dateString.substring(0, dateString.length - 1).concat('+00:00');
                expect(Buffer.from(proto.getVString().getValue()).toString()).to.equal(supportedDateString);
            });

            it('creates a wrapper of Mysqlx.Datatypes.Scalar.Type.V_STRING for strings', () => {
                const proto = scalar.create('foo').valueOf();

                expect(proto.getType()).to.equal(ScalarStub.Type.V_STRING);
                expect(Buffer.from(proto.getVString().getValue()).toString()).to.equal('foo');
            });
        });
    });

    context('instance methods', () => {
        let octets, str, wraps;

        beforeEach('create fakes', () => {
            octets = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Octets');
            str = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/String');
            wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
            scalar = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('getType()', () => {
            it('returns the textual representation of the type enum', () => {
                expect(scalar(new ScalarStub([ScalarStub.Type.V_SINT])).getType()).to.equal('V_SINT');
                expect(scalar(new ScalarStub([ScalarStub.Type.V_UINT])).getType()).to.equal('V_UINT');
                expect(scalar(new ScalarStub([ScalarStub.Type.V_NULL])).getType()).to.equal('V_NULL');
                expect(scalar(new ScalarStub([ScalarStub.Type.V_OCTETS])).getType()).to.equal('V_OCTETS');
                expect(scalar(new ScalarStub([ScalarStub.Type.V_DOUBLE])).getType()).to.equal('V_DOUBLE');
                expect(scalar(new ScalarStub([ScalarStub.Type.V_FLOAT])).getType()).to.equal('V_FLOAT');
                expect(scalar(new ScalarStub([ScalarStub.Type.V_BOOL])).getType()).to.equal('V_BOOL');
                expect(scalar(new ScalarStub([ScalarStub.Type.V_STRING])).getType()).to.equal('V_STRING');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_SINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_SINT]);
                proto.setVSignedInt(-3);

                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_SINT', v_signed_int: -3 });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_UINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_UINT]);
                proto.setVUnsignedInt(3);

                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_UINT', v_unsigned_int: 3 });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_NULL stub instance', () => {
                expect(scalar(new ScalarStub([ScalarStub.Type.V_NULL])).toJSON()).to.deep.equal({ type: 'V_NULL' });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_OCTETS stub instance', () => {
                const toJSON = td.function();
                const bin = new ScalarStub.Octets();
                bin.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_OCTETS]);
                proto.setVOctets(bin);

                td.when(toJSON()).thenReturn('bar');
                td.when(octets(bin)).thenReturn({ toJSON });

                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_OCTETS', v_octets: 'bar' });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_DOUBLE stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_DOUBLE]);
                proto.setVDouble(3);

                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_DOUBLE', v_double: 3 });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_FLOAT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_FLOAT]);
                proto.setVFloat(3);

                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_FLOAT', v_float: 3 });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_BOOL stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_BOOL]);

                proto.setVBool(false);
                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_BOOL', v_bool: false });

                proto.setVBool(true);
                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_BOOL', v_bool: true });
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.V_STRING stub instance', () => {
                const toJSON = td.function();
                const protoString = new ScalarStub.String();
                protoString.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_STRING]);
                proto.setVString(protoString);

                td.when(toJSON()).thenReturn('bar');
                td.when(str(protoString)).thenReturn({ toJSON });

                expect(scalar(proto).toJSON()).to.deep.equal({ type: 'V_STRING', v_string: 'bar' });
            });
        });

        context('toLiteral()', () => {
            it('returns a JavaScript number for a Mysqlx.Datatypes.Scalar.V_SINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_SINT]);
                proto.setVSignedInt(-3);

                expect(scalar(proto).toLiteral()).to.equal(-3);
            });

            it('returns a JavaScript number for a Mysqlx.Datatypes.Scalar.V_UINT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_UINT]);
                proto.setVUnsignedInt(3);

                expect(scalar(proto).toLiteral()).to.equal(3);
            });

            it('returns null for a Mysqlx.Datatypes.Scalar.V_NULL stub instance', () => {
                return expect(scalar(new ScalarStub([ScalarStub.Type.V_NULL])).toLiteral()).to.be.null;
            });

            it('returns the output of Octets wrapper toBuffer() method for a Mysqlx.Datatypes.Scalar.V_OCTETS stub instance', () => {
                const toBuffer = td.function();
                const bin = new ScalarStub.Octets();
                bin.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_OCTETS]);
                proto.setVOctets(bin);

                td.when(toBuffer()).thenReturn('bar');
                td.when(octets(bin)).thenReturn({ toBuffer });

                expect(scalar(proto).toLiteral()).to.equal('bar');
            });

            it('returns a JavaScript number for a Mysqlx.Datatypes.Scalar.V_DOUBLE stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_DOUBLE]);
                proto.setVDouble(3);

                expect(scalar(proto).toLiteral()).to.equal(3);
            });

            it('returns a JavaScript number for a Mysqlx.Datatypes.Scalar.V_FLOAT stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_FLOAT]);
                proto.setVFloat(3);

                expect(scalar(proto).toLiteral()).to.equal(3);
            });

            it('returns a JavaScript boolean for a Mysqlx.Datatypes.Scalar.V_BOOL stub instance', () => {
                const proto = new ScalarStub([ScalarStub.Type.V_BOOL]);
                proto.setVBool(false);
                // eslint-disable-next-line no-unused-expressions
                expect(scalar(proto).toLiteral()).to.be.false;

                proto.setVBool(true);
                return expect(scalar(proto).toLiteral()).to.be.true;
            });

            it('returns the output of String wrapper toString() method for a Mysqlx.Datatypes.Scalar.V_STRING stub instance', () => {
                const toString = td.function();
                const protoString = new ScalarStub.String();
                protoString.setValue('foo');

                const proto = new ScalarStub([ScalarStub.Type.V_STRING]);
                proto.setVString(protoString);

                td.when(toString()).thenReturn('bar');
                td.when(str(protoString)).thenReturn({ toString });

                expect(scalar(proto).toLiteral()).to.equal('bar');
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ScalarStub();
                const valueOf = td.function();

                td.when(valueOf()).thenReturn('foo');
                td.when(wraps(proto)).thenReturn({ valueOf });

                expect(scalar(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
