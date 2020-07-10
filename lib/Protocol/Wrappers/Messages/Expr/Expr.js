/*
 * Copyright (c) 2020, Oracle and/or its affiliates.
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

const ExprStub = require('../../../Stubs/mysqlx_expr_pb');
const columnIdentifier = require('./ColumnIdentifier');
const optionalString = require('../../Traits/OptionalString');
const parser = require('../../../../ExprParser');
const scalar = require('../Datatypes/Scalar');
const wraps = require('../../Traits/Wraps');

/**
 * Parse an X DevAPI expression.
 * @private
 * @param {string} value - the expression string
 * @param {Object} [options] - parsing options
 */
function parseExpression (value, options) {
    options = Object.assign({}, { toPrepare: false }, options);

    const parsedExpression = parser.parse(value, options);
    const expr = Expr(parsedExpression.output);

    // placeholder values should be assigned only if the statement
    // is not being prepared
    if (!options.toPrepare) {
        expr.setPlaceholders(parsedExpression.placeholders);
    }

    return expr;
};

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.Array
 * @param {proto.Mysqlx.Expr.Array} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.Array}
 */
function pArray (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.Array#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                value: proto.getValueList().map(val => Expr(val).toJSON())
            };
        }
    });
}

/**
 * Checks if a value can be encoded as a Mysqlx.Expr.Array.
 * @private
 * @returns {boolean}
 */
pArray.canEncode = function (value) {
    return Array.isArray(value);
};

/**
 * Creates a wrapper of a generic Mysqlx.Expr.Array instance given a list of values.
 * @private
 * @returns {module:adapters.Mysqlx.Expr.Array}
 */
pArray.create = function (values) {
    const proto = new ExprStub.Array();
    proto.setValueList(values.map(v => Expr.create(v).valueOf()));

    return pArray(proto);
};

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.Identifier
 * @param {proto.Mysqlx.Expr.Identifier} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.Identifier}
 */
function pIdentifier (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.Identifier#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                name: proto.getName(),
                schema_name: optionalString(proto.getSchemaName()).toJSON()
            };
        }
    });
}

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.FunctionCall
 * @param {proto.Mysqlx.Expr.FunctionCall} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.FunctionCall}
 */
function pFunctionCall (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.FunctionCall#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                name: pIdentifier(proto.getName()).toJSON(),
                param: proto.getParamList().map(p => Expr(p).toJSON())
            };
        }
    });
}

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.Object
 * @param {proto.Mysqlx.Expr.Object} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.Object}
 */
function pObject (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.Object#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                fld: proto.getFldList().map(field => pObjectField(field).toJSON())
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Expr.Object instance give the field mapping.
 * @private
 * @returns {module:adapters.Mysqlx.Expr.Object}
 */
pObject.create = function (fields) {
    const proto = new ExprStub.Object();
    proto.setFldList(Object.keys(fields).map(k => pObjectField.create(k, fields[k]).valueOf()));

    return pObject(proto);
};

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.Object.ObjectField
 * @param {proto.Mysqlx.Expr.Object.ObjectField} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.Object.ObjectField}
 */
function pObjectField (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.Object.ObjectField#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                key: proto.getKey(),
                value: Expr(proto.getValue()).toJSON()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Expr.Object.ObjectField instance given a key and value.
 * @private
 * @returns {module:adapters.Mysqlx.Expr.Object.ObjectField}
 */
pObjectField.create = function (key, value) {
    const proto = new ExprStub.Object.ObjectField();
    proto.setKey(key);
    proto.setValue(Expr.create(value).valueOf());

    return pObjectField(proto);
};

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.Operator
 * @param {proto.Mysqlx.Expr.Operator} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.Operator}
 */
function pOperator (proto) {
    return Object.assign({}, wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.Operator#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                name: proto.getName(),
                param: proto.getParamList().map(p => Expr(p).toJSON())
            };
        }
    });
}

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.Expr
 * @param {proto.Mysqlx.Expr.Expr} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.Expr}
 */
function Expr (proto) {
    const state = { placeholders: [] };

    return Object.assign({}, wraps(proto), {
        /**
         * Retrieve the ordered list of arguments to assign to the existing placeholders.
         * @function
         * @name module:adapters.Mysqlx.Expr.Expr#getPlaceholderArgs
         * @returns {Array<proto.Mysqlx.Datatypes.Scalar>} The list of protobuf instances.
         */
        getPlaceholderArgs (bindings) {
            return state.placeholders.map(p => scalar.create(bindings[p]).valueOf());
        },

        /**
         * Retrieve the expression type name.
         * @function
         * @name module:adapters.Mysqlx.Expr.Expr#getType
         * @returns {string}
         */
        getType () {
            return Object.keys(ExprStub.Expr.Type)
                .filter(k => ExprStub.Expr.Type[k] === proto.getType())[0];
        },

        /**
         * Set the ordered list of placeholder names used in the expression.
         * @function
         * @name module:adapters.Mysqlx.Expr.Expr#setPlaceholders
         * @returns {module:adapters.Mysqlx.Expr.Expr} The expression wrapper instance
         */
        setPlaceholders (placeholders) {
            state.placeholders = placeholders;

            return this;
        },

        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Expr.Expr#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            // since stub instances get assigned a default type, the exit
            // criteria should be the case where "proto" is not defined
            if (typeof proto === 'undefined') {
                // we want the field to be ignored in the parent object
                return;
            }

            const type = this.getType();

            switch (proto.getType()) {
            case ExprStub.Expr.Type.IDENT:
                return { type, identifier: columnIdentifier(proto.getIdentifier()).toJSON() };
            case ExprStub.Expr.Type.LITERAL:
                return { type, literal: scalar(proto.getLiteral()).toJSON() };
            case ExprStub.Expr.Type.VARIABLE:
                return { type, variable: optionalString(proto.getVariable()).toJSON() };
            case ExprStub.Expr.Type.FUNC_CALL:
                return { type, function_call: pFunctionCall(proto.getFunctionCall()).toJSON() };
            case ExprStub.Expr.Type.OPERATOR:
                return { type, operator: pOperator(proto.getOperator()).toJSON() };
            case ExprStub.Expr.Type.PLACEHOLDER:
                return { type, position: proto.getPosition() };
            case ExprStub.Expr.Type.OBJECT:
                return { type, object: pObject(proto.getObject()).toJSON() };
            case ExprStub.Expr.Type.ARRAY:
                return { type, array: pArray(proto.getArray()).toJSON() };
            }
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Expr.Expr instance for a given value or expression.
 * @returns {module:adapters.Mysqlx.Expr.Expr}
 */
Expr.create = function (value, options) {
    options = Object.assign({}, { toParse: false, isPlaceholder: false }, options);

    // if the value is a raw string expression, we should parse it
    if (typeof value === 'string' && options.toParse) {
        return parseExpression(value, options);
    }

    // if it is not provided, there's nothing to do
    // we can't create a wrapper with an empty stub instance because it gets
    // assigned a default type and it would mess with the "toJSON()" logic
    if (typeof value === 'undefined') {
        return Expr();
    }

    // if the value it's already an expression protobuf message, we can simply wrap it
    if (value instanceof ExprStub.Expr) {
        return Expr(value);
    }

    // otherwise we need to create one
    const proto = new ExprStub.Expr();

    // if the value is a number, we first need to check if it represents a
    // placeholder position
    if (options.isPlaceholder) {
        proto.setType(ExprStub.Expr.Type.PLACEHOLDER);
        proto.setPosition(value);
    } else if (scalar.canEncode(value)) {
        // if the value is an object, we first need to check if it can be
        // encoded as a Scalar (e.g. Buffer and Date)
        proto.setType(ExprStub.Expr.Type.LITERAL);
        proto.setLiteral(scalar.create(value).valueOf());
    } else if (pArray.canEncode(value)) {
        proto.setType(ExprStub.Expr.Type.ARRAY);
        proto.setArray(pArray.create(value).valueOf());
    } else {
        // ultimately, in JavaScript everything else is an object
        proto.setType(ExprStub.Expr.Type.OBJECT);
        proto.setObject(pObject.create(value).valueOf());
    }

    return Expr(proto);
};

module.exports = Expr;
