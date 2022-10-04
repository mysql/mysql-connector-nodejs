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

const DatatypesStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb');
const expect = require('chai').expect;
const td = require('testdouble');

// subjects under test need to be reloaded with replacement test doubles
let Any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');

describe('Mysqlx.Datatypes.Any wrapper', () => {
    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let DatatypesStub, Scalar, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                DatatypesStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb');
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
            });

            it('creates a Mysqlx.Datatypes.Any wrapper with a Mysqlx.Datatypes.Scalar for values that can be encoded as so', () => {
                const proto = new DatatypesStub.Any();
                const protoValue = 'foo';
                const scalarProto = 'bar';
                const value = 'baz';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Scalar.create({ value })).thenReturn({ valueOf: () => scalarProto });

                expect(Any.create(value).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(DatatypesStub.Any.Type.SCALAR);
                expect(td.explain(proto.setScalar).callCount).to.equal(1);
                expect(td.explain(proto.setScalar).calls[0].args[0]).to.equal(scalarProto);
                expect(td.explain(proto.setArray).callCount).to.equal(0);
                expect(td.explain(proto.setObj).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Datatypes.Any wrapper with a Mysqlx.Datatypes.Object for plain JavaScript objects', () => {
                const objectProto = new DatatypesStub.Object();
                const objectProtoValue = 'foo';
                const proto = new DatatypesStub.Any();
                const protoValue = 'bar';
                const scalarProto = 'baz';
                const value = { name: 'qux' };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                // The value cannot be encoded as a scalar, so the proto
                // should be undefined.
                td.when(Scalar.create({ value })).thenReturn({ valueOf: () => undefined });
                // The Scalar.create() mock will also be used for the object
                // values.
                td.when(Scalar.create({ value: value.name })).thenReturn({ valueOf: () => scalarProto });
                td.when(Wraps(objectProto)).thenReturn({ valueOf: () => objectProtoValue });

                expect(Any.create(value).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(2);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(DatatypesStub.Any.Type.OBJECT);
                expect(td.explain(proto.setType).calls[1].args[0]).to.equal(DatatypesStub.Any.Type.SCALAR);
                expect(td.explain(proto.setScalar).callCount).to.equal(1);
                expect(td.explain(proto.setObj).callCount).to.equal(1);
                expect(td.explain(proto.setObj).calls[0].args[0]).to.deep.equal(objectProtoValue);
                expect(td.explain(proto.setArray).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Datatypes.Any wrapper with a Mysqlx.Datatypes.Array for JavaScript arrays', () => {
                const arrayProto = new DatatypesStub.Array();
                const arrayProtoValue = 'foo';
                const proto = new DatatypesStub.Any();
                const protoValue = 'bar';
                const scalarProto = 'baz';
                const value = ['qux'];

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                // The value cannot be encoded as a scalar, so the proto
                // should be undefined.
                td.when(Scalar.create({ value })).thenReturn({ valueOf: () => undefined });
                // The Scalar.create() mock will also be used for the array
                // elements.
                td.when(Scalar.create({ value: value[0] })).thenReturn({ valueOf: () => scalarProto });
                td.when(Wraps(arrayProto)).thenReturn({ valueOf: () => arrayProtoValue });

                expect(Any.create(value).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(2);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(DatatypesStub.Any.Type.ARRAY);
                expect(td.explain(proto.setType).calls[1].args[0]).to.equal(DatatypesStub.Any.Type.SCALAR);
                expect(td.explain(proto.setArray).callCount).to.equal(1);
                expect(td.explain(proto.setArray).calls[0].args[0]).to.deep.equal(arrayProtoValue);
                expect(td.explain(proto.setScalar).callCount).to.equal(1);
                expect(td.explain(proto.setObj).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the textual representation of the type enum', () => {
                expect(Any(new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR])).getType()).to.equal('SCALAR');
                expect(Any(new DatatypesStub.Any([DatatypesStub.Any.Type.OBJECT])).getType()).to.equal('OBJECT');
                expect(Any(new DatatypesStub.Any([DatatypesStub.Any.Type.ARRAY])).getType()).to.equal('ARRAY');
            });
        });

        context('toJSON()', () => {
            let Scalar;

            beforeEach('replace dependencies with test doubles', () => {
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                // reload module with the replacements
                Any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
            });

            it('returns a textual representation of a Mysqlx.Datatypes.Any.Scalar for a corresponding value', () => {
                const toJSON = td.function();
                const scalarProto = new DatatypesStub.Scalar();

                const proto = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                proto.setScalar(scalarProto);

                td.when(toJSON()).thenReturn('foo');
                td.when(Scalar(scalarProto)).thenReturn({ toJSON });

                expect(Any(proto).toJSON()).to.deep.equal({ type: 'SCALAR', scalar: 'foo' });
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
                td.when(Scalar(scalarProto)).thenReturn({ toJSON });

                expect(Any(proto).toJSON()).to.deep.equal({ type: 'OBJECT', obj: { fld: [{ key: 'name', value: { type: 'SCALAR', scalar: 'foo' } }] } });
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
                td.when(Scalar(scalarProto)).thenReturn({ toJSON });

                expect(Any(proto).toJSON()).to.deep.equal({ type: 'ARRAY', array: { value: [{ type: 'SCALAR', scalar: 'foo' }] } });
            });
        });

        context('toLiteral()', () => {
            let Scalar;

            beforeEach('replace dependencies with test doubles', () => {
                Scalar = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Scalar');
                // reload module with the replacements
                Any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
            });

            it('returns the output of the Scalar wrapper toLiteral method for the corresponding JavaScript values', () => {
                const toLiteral = td.function();
                const scalarProto = new DatatypesStub.Scalar();

                const proto = new DatatypesStub.Any([DatatypesStub.Any.Type.SCALAR]);
                proto.setScalar(scalarProto);

                td.when(toLiteral()).thenReturn('foo');
                td.when(Scalar(scalarProto)).thenReturn({ toLiteral });

                expect(Any(proto).toLiteral()).to.equal('foo');
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
                td.when(Scalar(scalarProto)).thenReturn({ toLiteral });

                expect(Any(proto).toLiteral()).to.deep.equal({ name: 'foo' });
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
                td.when(Scalar(scalarProto)).thenReturn({ toLiteral });

                expect(Any(proto).toLiteral()).to.deep.equal(['foo']);
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('create fakes', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Any = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new DatatypesStub.Any();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Any(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
