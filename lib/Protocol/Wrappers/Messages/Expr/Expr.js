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

const ExprStub = require('../../../Stubs/mysqlx_expr_pb');
const columnIdentifier = require('./ColumnIdentifier');
const optionalString = require('../../Traits/OptionalString');
const scalar = require('../Datatypes/Scalar');
const wraps = require('../../Traits/Wraps');

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
 * Create a wrapper of a Mysqlx.Expr.Array protobuf message given a list of
 * X DevAPI expressions or literal values.
 * @private
 * @param {boolean} [isLiteral] - Indicates whether the list itself is an
 * X DevAPI jsonArray or a JavaScript array.
 * @param {string[]} [placeholders] - List of placeholder names where
 * new placeholders specified by the expression will be recorded.
 * @param {Array<*>} values - List of X DevAPI expressions or literal values.
 * @returns {module:adapters.Mysqlx.Expr.Array}
 */
pArray.create = function ({ isLiteral, placeholders, values }) {
    const proto = new ExprStub.Array();
    proto.setValueList(values.map(value => Expr.create({ isLiteral, placeholders, value }).valueOf()));

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
 * Create a wrapper for a Mysqlx.Expr.Identifier protobuf message given
 * a name and, optionally, the name of the schema to which the identifier is
 * bound to.
 * @param {string} name - Name of the identifier.
 * @param {string} [schema] - Name of the schema to which the indentifier is
 * bound to.
 * @returns {module:adapters.Mysqlx.Expr.Identifier}
 */
pIdentifier.create = function ({ name, schema }) {
    const proto = new ExprStub.Identifier();
    proto.setName(name);
    proto.setSchemaName(schema);

    return pIdentifier(proto);
};

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
 * Create a wrapper for a Mysqlx.Expr.FunctionCall protobuf message given
 * the function identifier, its parameters, and the list of placeholder names,
 * in which any placeholder specified by the function will be recorded.
 * @param {Object} name - Function identifier including the name and
 * optionally the schema.
 * @param {ExpressionTree[]} params - List of the X DevAPI expression of each
 * function parameter.
 * @param {string[]} [placeholders] - List of placeholder names where
 * new placeholders specified by the expression will be recorded.
 * @returns {proto:Mysqlx.Expr.FunctionCall}
 */
pFunctionCall.create = ({ name, params, placeholders }) => {
    const proto = new ExprStub.FunctionCall();
    proto.setName(pIdentifier.create(name).valueOf());
    proto.setParamList(params.map(value => Expr.create({ placeholders, value }).valueOf()));

    return pFunctionCall(proto);
};

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
 * Creates a wrapper for a Mysqlx.Expr.Object protobuf message given a list
 * of objects, each containing a field name and value.
 * @private
 * @param {Object} fields - X DevAPI expression or JavaScript literal.
 * @param {boolean} [isLiteral] - Indicates whether the object itself is an
 * X DevAPI jsonDoc or a JavaScript object.
 * @param {string[]} [placeholders] - List of placeholder names where
 * new placeholders specified by the expression will be recorded.
 * @returns {module:adapters.Mysqlx.Expr.Object}
 */
pObject.create = function ({ fields, isLiteral, placeholders }) {
    const proto = new ExprStub.Object();
    const fieldList = Object.keys(fields)
        .map(key => pObjectField.create({ isLiteral, key, placeholders, value: fields[key] }).valueOf())
        // Field types which are unknown or cannot be encoded in the protobuf
        // message that specifices the JSON document, result in an empty
        // pObjectField instance, which means "valueOf()" will return
        // "undefined". In those cases, the value should be ignored.
        .filter(x => x);

    proto.setFldList(fieldList);

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
 * Create a wrapper for a Mysqlx.Expr.Object.ObjectField protobuf message
 * given a field name and either a parsed X DevAPI expression instance or
 * a literal JavaScript value.
 * @private
 * @param {string} key - Name of the object field.
 * @param {boolean} [isLiteral] - Indicates whether the field value is a
 * X DevAPI expression or a JavaScript literal value.
 * @param {string[]} [placeholders] - List of placeholder names where
 * new placeholders specified by the expression will be recorded.
 * @param {*} value - X DevAPI expression instance or a JavaScript literal
 * value.
 * @returns {module:adapters.Mysqlx.Expr.Object.ObjectField}
 */
pObjectField.create = function ({ isLiteral, key, placeholders, value }) {
    const fieldValue = Expr.create({ isLiteral, placeholders, value }).valueOf();

    if (typeof fieldValue === 'undefined') {
        return pObjectField();
    }

    const proto = new ExprStub.Object.ObjectField();
    proto.setKey(key);
    proto.setValue(fieldValue);

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
 * Create a wrapper for a Mysqlx.Expr.Operator protobuf message given the
 * operator name and the list of operands.
 * @param {string} name - Name of the operator.
 * @param {ExpressionTree[]} params - List containing the parsed X DevAPI expression
 * instance for each operand.
 * @returns {module:adapters.Mysqlx.Expr.Operator}
 */
pOperator.create = ({ isLiteral, name, params, placeholders }) => {
    const proto = new ExprStub.Operator();
    proto.setName(name);
    proto.setParamList(params.map(value => Expr.create({ isLiteral, value, placeholders }).valueOf()));

    return pOperator(proto);
};

/**
 * @private
 * @alias module:adapters.Mysqlx.Expr.Expr
 * @param {proto.Mysqlx.Expr.Expr} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Expr.Expr}
 */
function Expr (proto) {
    return Object.assign({}, wraps(proto), {
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
 * Create a wrapper for a Mysqlx.Expr.Expr protobuf message given a parsed
 * version of an X DevAPI expression instance.
 * @private
 * @param {string} type - Expression type, as defined by the X DevAPI user
 * guide.
 * @param {Object} value - Object containing the expression components
 * extracted by the parser.
 * @param {string[]} [placeholders] - List of placeholder names to record
 * additional placeholders specified by the expression
 * @see https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html
 * @returns {module:adapters.Mysqlx.Expr.Expr}
 */
const createFromExpression = ({ type, value, placeholders = [] }) => {
    const proto = new ExprStub.Expr();

    switch (type) {
    case 'columnIdent':
    case 'documentField':
        proto.setType(ExprStub.Expr.Type.IDENT);
        proto.setIdentifier(columnIdentifier.create(value).valueOf());
        break;
    case 'literal':
        proto.setType(ExprStub.Expr.Type.LITERAL);
        proto.setLiteral(scalar.create({ value }).valueOf());
        break;
    case 'castType':
    case 'intervalUnit':
        // The cast and interval unit types are special cases because, from the
        // MySQL server standpoint, they are not a meaningless literal, but
        // keywords instead, and they need to be encoded as opaque values.
        proto.setType(ExprStub.Expr.Type.LITERAL);
        proto.setLiteral(scalar.create({ value, opaque: true }).valueOf());
        break;
    case 'functionCall':
        proto.setType(ExprStub.Expr.Type.FUNC_CALL);
        proto.setFunctionCall(pFunctionCall.create({ ...value, placeholders }).valueOf());
        break;
    case 'castOp':
    case 'unaryOp':
    case 'intervalExpr':
    case 'mulDivExpr':
    case 'addSubExpr':
    case 'shiftExpr':
    case 'bitExpr':
    case 'compExpr':
    case 'ilriExpr':
    case 'andExpr':
    case 'orExpr':
        proto.setType(ExprStub.Expr.Type.OPERATOR);
        proto.setOperator(pOperator.create({ ...value, placeholders }).valueOf());
        break;
    case 'placeholder':
        proto.setType(ExprStub.Expr.Type.PLACEHOLDER);
        proto.setPosition(placeholders.indexOf(value));
        break;
    case 'jsonDoc':
        proto.setType(ExprStub.Expr.Type.OBJECT);
        proto.setObject(pObject.create({ fields: value, placeholders }).valueOf());
        break;
    case 'jsonArray':
        proto.setType(ExprStub.Expr.Type.ARRAY);
        proto.setArray(pArray.create({ values: value, placeholders }).valueOf());
        break;
    default:
        return Expr();
    }

    return Expr(proto);
};

/**
 * Create a wrapper for a Mysqlx.Expr.Expr protobuf message given a JavaScript
 * literal value. If the value is a placeholder name, the position determines
 * at what index can the placeholder value be found in the placeholder list
 * carried by the statement.
 * @private
 * @param {*} value - Any JavaScript literal value.
 * @param {number} [position] - Placeholder value index, in case the value is
 * a placeholder name
 * @returns {module:adapters.Mysqlx.Expr.Expr}
 */
const createFromLiteral = ({ value, position }) => {
    // If a position is provided, it means we are dealing with a placeholder.
    if (Number.isInteger(position)) {
        const proto = new ExprStub.Expr([ExprStub.Expr.Type.PLACEHOLDER]);
        proto.setPosition(position);

        return Expr(proto);
    }

    // Most values, other then Arrays and plain Objects are supposed to be
    // encoded as Mysqlx.Datatypes.Scalar.
    const literal = scalar.create({ value }).valueOf();

    // If the value cannot be encoded as a Mysqlx.Datatypes.Scalar, the
    // computed value will be undefined.
    if (typeof literal !== 'undefined') {
        const proto = new ExprStub.Expr([ExprStub.Expr.Type.LITERAL]);
        proto.setLiteral(literal);

        return Expr(proto);
    }

    // Arrays are supposed to be encoded as a Mysqlx.Expr.Array.
    if (Array.isArray(value)) {
        const proto = new ExprStub.Expr([ExprStub.Expr.Type.ARRAY]);
        proto.setArray(pArray.create({ values: value, isLiteral: true }).valueOf());

        return Expr(proto);
    }

    // In case the value is of an unknown type or cannot be encoded in the
    // corresponding protobuf message (e.g. a Function), it should be ignored.
    if (typeof value !== 'object') {
        return Expr();
    }

    // Everything else is an object and can be encoded as a Mysqlx.Expr.Object.
    const proto = new ExprStub.Expr([ExprStub.Expr.Type.OBJECT]);
    proto.setObject(pObject.create({ fields: value, isLiteral: true }).valueOf());

    return Expr(proto);
};

/**
 * Create a wrapper for a Mysqlx.Expr.Expr protobuf message given either a
 * parsed X DevAPI expression instance or a JavaScript literal value.
 * @private
 * @param {boolean} [isLiteral] - Indicates whether the value is an X DevAPI
 * expression or a literal value.
 * @param {string[]} [placeholders] - List of statement placeholder names, used
 * to record any other placeholder specified by the expression.
 * @param {number} [position] - Index in the list of placeholders used when
 * the expression is a placeholder itself.
 * @param {*} value - Parsed X DevAPI expression instance or a JavaScript
 * literal value.
 * @returns {module:adapters.Mysqlx.Expr.Expr}
 */
Expr.create = ({ isLiteral, placeholders, position, value }) => {
    if (!isLiteral) {
        return createFromExpression({ placeholders, ...value });
    }

    return createFromLiteral({ position, value });
};

module.exports = Expr;
