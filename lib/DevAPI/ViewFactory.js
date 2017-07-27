/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

const table = require('./Table');

/**
 * View Creation helper object
 *
 * Usually you shouldn't create this yourself but via {@link Schema#createView}
 *
 * @param {Schema} schema
 * @param {string} name Name of the view
 * @constructor
 */
function ViewFactory(schema, name, replace)  {
    this._schema = schema;
    this._name = name;
    this._replace = !!replace;
    this._columns = null;
    this._algorithm = this.algorithms.UNDEFINED;
    this._security = this.securities.DEFINER;
    this._definer = null;
    this._definedAs = null;
    this._check = this.checkOptions.CASCADED;
}

module.exports = ViewFactory;

/**
 * Available processing algorithms
 *
 * @type {{MERGE: string, TMPTABLE: string, UNDEFINED: string}}
 */
ViewFactory.prototype.algorithms = {
    MERGE: "MERGE",
    TMPTABLE: "TMPTABLE",
    UNDEFINED: "UNDEFINED"
};

/**
 * Available security modes
 *
 * @type {{DEFINER: string, INVOKER: string}}
 */
ViewFactory.prototype.securities = {
    DEFINER: "DEFINER",
    INVOKER: "INVOKER"
};

/**
 * Available check options
 *
 * @type {{CASCADED: string, LOCAL: string}}
 */
ViewFactory.prototype.checkOptions = {
    CASCADED: "CASCADED",
    LOCAL: "LOCAL"
};

/**
 * Set column names for view
 *
 * @param {Array.<String>} columns
 * @returns {ViewFactory}
 */
ViewFactory.prototype.columns = function (columns) {
    if (!Array.isArray(columns)) {
        columns = Array.prototype.slice.call(arguments);
    }
    this._columns = columns;
    return this;
};

/**
 * Set an algorithm
 *
 * This should be one of {@link ViewFactory#algorithms}
 *
 * @param {string} algorithm
 * @returns {ViewFactory}
 */
ViewFactory.prototype.algorithm = function(algorithm) {
    this._algorithm = algorithm;
    return this;
};

/**
 * Set a SQL security mode
 *
 * This should be one of {@link ViewFactory#securities}
 *
 * @param sec
 * @returns {ViewFactory}
 */
ViewFactory.prototype.security = function(sec) {
    this._security = sec;
    return this;
};

/**
 * Set the definer
 *
 * The value should be a MySQL user
 *
 * @param {String} definer
 * @returns {ViewFactory}
 */
ViewFactory.prototype.definer = function(definer) {
    this._definer = definer;
    return this;
};

/**
 * An Table Select operation describing the view
 *
 * @param {TableSelect} tableSelect
 * @returns {ViewFactory}
 */
ViewFactory.prototype.definedAs = function(tableSelect) {
    if (!tableSelect.getViewDefinition) {
        throw new Error("Provided argument for definedAs while creating view " + this._name + " is no valid Select operation");
    }
    this._definedAs = tableSelect.getViewDefinition();
    return this;
};

/**
 * Sets the check option
 *
 * This should be one of {@link ViewFactory#checkOptions}
 *
 * @param {String} checkOption
 * @returns {ViewFactory}
 */
ViewFactory.prototype.withCheckOption = function(checkOption) {
    this._check = checkOption;
    return this;
};

ViewFactory.prototype.getSqlString = function() {
    if (!this._definedAs) {
        throw new Error("No View definition provided; missing call to definedAs() before execute()?");
    }
    
    let sql = "CREATE ";
    if (this._replace) {
        sql += "OR REPLACE ";
    }
    sql += " ALGORITHM = " + this._algorithm;
    if (this._definer) {
        sql += " DEFINER = " + this._definer;
    }
    sql += " SQL SECURITY " + this._security + " VIEW " + table.escapeIdentifier(this._schema.getName()) + '.' + table.escapeIdentifier(this._name);

    if (this._columns) {
        sql += '(' + this._columns.map(col => table.escapeIdentifier(col)).join(", ") + ')';
    }
    sql += " AS " + this._definedAs + " WITH " + this._check + " CHECK OPTION";

    return sql;
};

/**
 * Execute the create operation
 *
 * This returns a Promise which will resolve to true or fail with an error
 *
 * @returns {Promise.<bool>}
 */
ViewFactory.prototype.execute = function() {
    const sql = this.getSqlString();

    return this._schema.getSession()._client.sqlStmtExecute(sql).then(function () {
        return true;
    });  
};
