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

const Datatypes = require('../../../Stubs/mysqlx_datatypes_pb');
const scalar = require('./Scalar');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Datatypes.Array
 * @param {proto.Mysqlx.Datatypes.Array} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Datatypes.Array}
 */
function pArray (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Returns a list of the underlying native JavaScript type literals.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Any#toObject
         * @returns {Object}
         */
        toArray () {
            return proto.getValueList().map(v => any(v).toLiteral());
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Array#toJSON
         * @returns {Object}
         */
        toJSON () {
            return { value: proto.getValueList().map(v => any(v).toJSON()) };
        }
    });
}

/**
 * Creates a wrapper of a Mysqlx.Datatypes.Array instance for a given value.
 * @returns {module:adapters.Mysqlx.Datatypes.Array}
 */
pArray.create = function (values) {
    const proto = new Datatypes.Array();
    proto.setValueList(values.map(value => any.create(value).valueOf()));

    return pArray(proto);
};

/**
 * @private
 * @alias module:adapters.Mysqlx.Datatypes.Object
 * @param {proto.Mysqlx.Datatypes.Object} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Datatypes.Object}
 */
function pObject (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Object#toJSON
         * @returns {Object}
         */
        toJSON () {
            return { fld: proto.getFldList().map(v => ({ key: v.getKey(), value: any(v.getValue()).toJSON() })) };
        },

        /**
         * Returns a key-value mapping of the encoded fields.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Any#toObject
         * @returns {Object}
         */
        toObject () {
            return proto.getFldList()
                .reduce((objs, fld) => Object.assign({}, objs, { [fld.getKey()]: any(fld.getValue()).toLiteral() }), {});
        }
    });
};

/**
 * Creates a wrapper of a Mysqlx.Datatypes.Object instance for a given value.
 * @returns {module:adapters.Mysqlx.Datatypes.Object}
 */
pObject.create = function (values) {
    const proto = new Datatypes.Object();
    proto.setFldList(Object.keys(values).map(key => {
        const field = new Datatypes.Object.ObjectField();
        field.setKey(key);
        field.setValue(any.create(values[key]).valueOf());

        return field;
    }));

    return pObject(proto);
};

/**
 * @private
 * @alias module:adapters.Mysqlx.Datatypes.Any
 * @param {proto.Mysqlx.Datatypes.Any} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Datatypes.Any}
 */
function any (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the type name.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Any#getType
         * @returns {string} The type name.
         */
        getType () {
            return Object.keys(Datatypes.Any.Type).filter(k => Datatypes.Any.Type[k] === proto.getType())[0];
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Any#toJSON
         * @returns {Object}
         */
        toJSON () {
            switch (proto.getType()) {
            case Datatypes.Any.Type.SCALAR:
                return { type: this.getType(), scalar: scalar(proto.getScalar()).toJSON() };
            case Datatypes.Any.Type.OBJECT:
                return { type: this.getType(), obj: pObject(proto.getObj()).toJSON() };
            case Datatypes.Any.Type.ARRAY:
                return { type: this.getType(), array: pArray(proto.getArray()).toJSON() };
            }
        },

        /**
         * Return the corresponding native JavaScript type literal for the underlying value.
         * @function
         * @name module:adapters.Mysqlx.Datatypes.Any#toLiteral
         * @returns {*}
         */
        toLiteral () {
            switch (proto.getType()) {
            case Datatypes.Any.Type.SCALAR:
                return scalar(proto.getScalar()).toLiteral();
            case Datatypes.Any.Type.OBJECT:
                return pObject(proto.getObj()).toObject();
            case Datatypes.Any.Type.ARRAY:
                return pArray(proto.getArray()).toArray();
            }
        }
    });
}

/**
 * Creates a wrapper for Mysqlx.Datatypes.Any protobuf message for a
 * given JavaScript literal value.
 * @private
 * @param {*} value
 * @returns {module:adapters.Mysqlx.Datatypes.Any}
 */
any.create = function (value) {
    const scalarType = scalar.create({ value }).valueOf();

    if (typeof scalarType !== 'undefined') {
        const proto = new Datatypes.Any();
        proto.setType(Datatypes.Any.Type.SCALAR);
        proto.setScalar(scalarType);

        return any(proto);
    }

    if (Array.isArray(value)) {
        const proto = new Datatypes.Any();
        proto.setType(Datatypes.Any.Type.ARRAY);
        proto.setArray(pArray.create(value).valueOf());

        return any(proto);
    }

    const proto = new Datatypes.Any();
    proto.setType(Datatypes.Any.Type.OBJECT);
    proto.setObj(pObject.create(value).valueOf());

    return any(proto);
};

module.exports = any;
