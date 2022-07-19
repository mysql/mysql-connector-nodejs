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

const ExprStub = require('../../../Stubs/mysqlx_expr_pb');
const columnIdentifier = require('./ColumnIdentifier');
const optionalString = require('../../Traits/OptionalString');
const parser = require('../../../../ExprParser');
const scalar = require('../Datatypes/Scalar');
const wraps = require('../../Traits/Wraps');
const ProjectionStub = require('../../../Stubs/mysqlx_crud_pb').Projection;
const OrderStub = require('../../../Stubs/mysqlx_crud_pb').Order;

/**
 * Parse an X DevAPI expression.
 * @private
 * @param {string} value - the expression string
 * @param {Object} [options] - parsing options
 */
function parseExpression (value, options) {
    options = Object.assign({}, { toPrepare: false }, options);

    const parsedExpression = parser.parse(value, options);

    let proto;
    if (parsedExpression.type === 'expr') {
        proto = Expr.encode(parsedExpression.value);
    } else {
        // it is either a "sortExpr" or a "projectedSearchExpr"
        proto = Expr.encode(parsedExpression);
    }

    const expr = Expr(proto);

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
 * Encode a JSON array expression tree structure into the corresponding
 * protobuf message.
 * @param {Object[]} values - A list containing the tree structure for each array item.
 * @returns {proto:Mysqlx.Expr.Identifier}
 */
pArray.encode = (values) => {
    const proto = new ExprStub.Array();
    proto.setValueList(values.map(v => Expr.encode(v)));

    return proto;
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
 * Encode an identifier expression tree structure into the corresponding
 * protobuf message.
 * @param {string} name - The identifier name.
 * @param {string} [schema] - The name of the schema that defines the identifier scope.
 * @returns {proto:Mysqlx.Expr.Identifier}
 */
pIdentifier.encode = function ({ name, schema }) {
    const proto = new ExprStub.Identifier();
    proto.setName(name);
    proto.setSchemaName(schema);

    return proto;
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
 * Encode a function call expression tree structure into the corresponding
 * protobuf message.
 * @param {string} name - The function name.
 * @param {Object[]} params - A list of the tree structure of each function parameter.
 * @returns {proto:Mysqlx.Expr.FunctionCall}
 */
pFunctionCall.encode = ({ name, params }) => {
    const proto = new ExprStub.FunctionCall();
    proto.setName(pIdentifier.encode(name));
    proto.setParamList(params.map(p => Expr.encode(p)));

    return proto;
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
 * Encode an object expression tree structure into the corresponding
 * protobuf message.
 * @param {Object[]} [fields] - A list containing the tree structure for each field.
 * @returns {proto:Mysqlx.Expr.Object}
 */
pObject.encode = (fields) => {
    const proto = new ExprStub.Object();
    proto.setFldList(Object.keys(fields).map(key => pObjectField.encode({ key, value: fields[key] })));

    return proto;
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
 * Encode an object field expression tree structure into the corresponding
 * protobuf message.
 * @param {string} key - The key name.
 * @param {Object} value - The value expression tree.
 * @returns {proto:Mysqlx.Expr.Object.ObjectField}
 */
pObjectField.encode = ({ key, value }) => {
    const proto = new ExprStub.Object.ObjectField();
    proto.setKey(key);
    proto.setValue(Expr.encode(value));

    return proto;
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
 * Encode an operator expression tree structure into the corresponding
 * protobuf message.
 * @param {string} name - The name of the operator.
 * @param {Object[]} params - A list containing the tree structure for each operand
 * @returns {proto:Mysqlx.Expr.Operator}
 */
pOperator.encode = ({ name, params }) => {
    const proto = new ExprStub.Operator();
    proto.setName(name);
    proto.setParamList(params.map(p => Expr.encode(p)));

    return proto;
};

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
            return state.placeholders.map(p => scalar.create(bindings[p]).valueOf())
                // Placeholder values are of type Mysqlx.Datatypes.Scalar
                // which does not provide any matching representation for
                // JavaScript undefined. Given the X Plugin will yield an
                // error in the absence of a given placeholder value, we
                // should trust in that behaviour.
                .filter(p => typeof p !== 'undefined');
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

/**
 * Encode a parsed expression tree structure into the corresponding
 * protobuf message.
 * @param {string} type - An X DevAPI expression type, as defined by the user guide.
 * @param {Object} value - An object containing the expression components extracted by the parser.
 * @see https://dev.mysql.com/doc/x-devapi-userguide/en/mysql-x-expressions-ebnf-definitions.html
 * @returns {proto:Mysqlx.Expr.Expr}
 */
Expr.encode = function ({ type, value }) {
    let proto = new ExprStub.Expr();

    switch (type) {
    case 'columnIdent':
    case 'documentField':
        proto.setType(ExprStub.Expr.Type.IDENT);
        proto.setIdentifier(columnIdentifier.encode(value));
        break;
    case 'literal':
        proto.setType(ExprStub.Expr.Type.LITERAL);
        proto.setLiteral(scalar.encode(value));
        break;
    case 'castType':
        proto.setType(ExprStub.Expr.Type.LITERAL);
        proto.setLiteral(scalar.encode(value, { opaque: true }));
        break;
    case 'functionCall':
        proto.setType(ExprStub.Expr.Type.FUNC_CALL);
        proto.setFunctionCall(pFunctionCall.encode(value));
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
        proto.setOperator(pOperator.encode(value));
        break;
    case 'placeholder':
        proto.setType(ExprStub.Expr.Type.PLACEHOLDER);
        proto.setPosition(value.position);
        break;
    case 'jsonDoc':
        proto.setType(ExprStub.Expr.Type.OBJECT);
        proto.setObject(pObject.encode(value));
        break;
    case 'jsonArray':
        proto.setType(ExprStub.Expr.Type.ARRAY);
        proto.setArray(pArray.encode(value));
        break;
    case 'groupedExpr':
    case 'atomicExpr':
        proto = Expr.encode(value);
        break;
    case 'projectedSearchExpr':
        proto = new ProjectionStub();
        proto.setSource(Expr.encode(value.source));
        proto.setAlias(value.alias);
        break;
    case 'sortExpr':
        proto = new OrderStub();
        proto.setExpr(Expr.encode(value.expr));
        proto.setDirection(value.direction);
        break;
    }

    return proto;
};

module.exports = Expr;
