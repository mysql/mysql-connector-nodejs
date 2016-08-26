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

const Table = require('./Table');

/**
 * View Creation helper object
 *
 * Usually you shouldn't create this yourself but via {@link Schema#dropView}
 *
 * @param {Schema} schema
 * @param {string} name Name of the view
 * @constructor
 */
function ViewDrop(schema, name)  {
    this._schema = schema;
    this._name = name;
    this._ifExists = false;
}

module.exports = ViewDrop;

/**
 * Sets IF EXISTS flag for drop
 * @returns {ViewDrop}
 */
ViewDrop.prototype.ifExists = function() {
    this._ifExists = true;
    return this;
};

/**
 * Execute the drop operation
 * 
 * This returns a Promise which will resolve to true or fail with an error
 * 
 * @returns {Promise.<bool>}
 */
ViewDrop.prototype.execte = function() {
    let sql = "DROP VIEW ";
    if (this._ifExists) {
        sql += "IF EXISTS ";
    }
    sql += Table.escapeIdentifier(this._schema.getName()) + '.' + Table.escapeIdentifier(this._name);

    return this._schema._session._client.sqlStmtExecute(sql).then(function () {
        return true;
    });
};