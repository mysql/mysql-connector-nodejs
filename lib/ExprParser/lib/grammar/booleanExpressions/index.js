/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
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
