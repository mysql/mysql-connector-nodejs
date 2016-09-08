/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

const XSession = require('./lib/DevAPI/XSession'),
    NodeSession = require('./lib/DevAPI/NodeSession'),
    Expressions = require('./lib/Expressions'),
    Authentication = require('./lib/Authentication');

/**
 * MySQL X module
 *
 * @module mysqlx
 */

/**
 *
 * @param {Properties} properties
 * @returns {Promise.<XSession>}
 */
exports.getSession = function (properties) {
    const session = new XSession(properties);
    return session.connect();
};

/**
 *
 * @param {Properties} properties
 * @returns {Promise.<NodeSession>}
 */
exports.getNodeSession = function (properties) {
    const session = new NodeSession(properties);
    return session.connect();
};

/**
 * Parse an expression into parse tree
 * @param {String} exp Expression
 * @eturn {Expression}
 */
exports.expr = function (exp) {
    return Expressions.parse(exp);
};

/**
 * Get available auth methods.
 *
 * In most cases this will return <pre>[ 'PLAIN', 'MYSQL41' ]</pre>
 * @return {Array.<String>}
 */
exports.getAuthMethods = function () {
    return Authentication.getNames();
};

/**
 * Get the version number
 *
 * This is  shortcut for reading package.json/version
 *
 * @return {String}
 */
exports.getVersion = function() {
    return require("./package").version;
};

exports.mysqlx = exports;
