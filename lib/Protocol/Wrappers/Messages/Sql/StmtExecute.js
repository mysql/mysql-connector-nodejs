/*
 * Copyright (c) 2020, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

const StmtExecuteStub = require('../../../Stubs/mysqlx_sql_pb').StmtExecute;
const any = require('../Datatypes/Any');
const bytes = require('../../ScalarValues/bytes');
const list = require('../../Traits/List');
const serializable = require('../../Traits/Serializable');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Sql.StmtExecute
 * @param {proto.Mysqlx.Sql.StmtExecute} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Sql.StmtExecute}
 */
function StmtExecute (proto) {
    return Object.assign({}, serializable(proto), wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Sql.StmtExecute#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                namespace: proto.getNamespace(),
                stmt: bytes(proto.getStmt()).toString(),
                args: list(proto.getArgsList().map(arg => any(arg))).toJSON(),
                compact_metadata: proto.getCompactMetadata()
            };
        }
    });
}

/**
 * Creates a wrapper of a generic Mysqlx.Sql.StmtExecute instance for a given statement.
 * @returns {module:adapters.Mysqlx.Sql.StmtExecute}
 */
StmtExecute.create = function (query) {
    const proto = new StmtExecuteStub();
    proto.setNamespace(query.getNamespace());
    proto.setStmt(bytes.create(Buffer.from(query.getSQL())).valueOf());
    proto.setArgsList(query.getArgs().map(arg => any.create(arg).valueOf()));

    return StmtExecute(proto);
};

module.exports = StmtExecute;
