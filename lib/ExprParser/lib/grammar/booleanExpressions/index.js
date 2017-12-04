/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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

const parsers = {
    addSubExpr: require('./addSubExpr'),
    andExpr: require('./andExpr'),
    argsList: require('./argsList'),
    atomicExpr: require('./atomicExpr'),
    bitExpr: require('./bitExpr'),
    castOp: require('./castOp'),
    castType: require('./castType'),
    compExpr: require('./compExpr'),
    expr: require('./expr'),
    functionCall: require('./functionCall'),
    groupedExpr: require('./groupedExpr'),
    ident: require('./ident'),
    ilriExpr: require('./ilriExpr'),
    interval: require('./interval'),
    intervalExpr: require('./intervalExpr'),
    jsonArray: require('./jsonArray'),
    jsonDoc: require('./jsonDoc'),
    jsonKeyValue: require('./jsonKeyValue'),
    lengthSpec: require('./lengthSpec'),
    literal: require('./literal'),
    orExpr: require('./orExpr'),
    placeholder: require('./placeholder'),
    mulDivExpr: require('./mulDivExpr'),
    schemaQualifiedIdent: require('./schemaQualifiedIdent'),
    shiftExpr: require('./shiftExpr'),
    unaryOp: require('./unaryOp')
};

const booleanExpressions = options => Object.keys(parsers).reduce((result, current) => {
    return Object.assign({}, result, { [current]: parsers[current].parser(options) });
}, {});

booleanExpressions.Type = Object.keys(parsers).reduce((result, current) => {
    return Object.assign({}, result, { [parsers[current].name]: current });
}, {});

module.exports = booleanExpressions;
