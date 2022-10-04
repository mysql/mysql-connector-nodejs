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

const ExecuteStub = require('../../../Stubs/mysqlx_prepare_pb').Execute;
const any = require('../Datatypes/Any');
const list = require('../../Traits/List');
const serializable = require('../../Traits/Serializable');
const wraps = require('../../Traits/Wraps');

/**
 * @private
 * @alias module:adapters.Mysqlx.Prepare.Execute
 * @param {proto.Mysqlx.Prepare.Execute} proto - protobuf stub
 * @returns {module:adapters.Mysqlx.Prepare.Execute}
 */
function Execute (proto) {
    return Object.assign({}, serializable(proto), wraps(proto), {
        /**
         * Serialize to JSON using a protobuf-like convention.
         * @function
         * @name module:adapters.Mysqlx.Prepare.Execute#toJSON
         * @returns {Object} The JSON representation
         */
        toJSON () {
            return {
                stmt_id: proto.getStmtId(),
                args: list(proto.getArgsList().map(arg => any(arg))).toJSON()
            };
        }
    });
}

/**
 * Create a wrapper for a Mysqlx.Prepare.Execute protobuf message, given the
 * statement instance.
 * @param {Preparing} statement
 * @returns {module:adapters.Mysqlx.Prepare.Execute}
 */
Execute.create = function (statement) {
    const proto = new ExecuteStub();
    // Placeholder values need to be Mysqlx.Datatypes.Scalar protobuf
    // messages. Instead of doing explicit type validation, we simply
    // ignore values that cannot be encoded and rely on the server
    // error message.
    const args = statement.getPlaceholderValues_().map(v => any.create(v).valueOf())
        .filter(x => typeof x !== 'undefined');

    // Every statement type that can be prepared (CollectionFind,
    // CollectionRemove, CollectionModify, TableSelect, TableUpdate and
    // TableDelete) allow to limit the row count.
    const count = statement.getCount_();

    if (typeof count !== 'undefined') {
        args.push(any.create(count).valueOf());

        // From a prepared statement standpoint, an offset only makes sense
        // with the corresponding count. This is because the X Plugin is
        // preparing an SQL statement using "LIMIT [offset], row_count".
        // However, limit offsets are only supported on CollectionFind and
        // TableSelect statements. For every other statement, we will not
        // be able to call a method to retrieve the value.
        // This should change as soon as this method receives a plain
        // JavaScript object that includes all the statement details instead
        // of relying on a contract like this.
        if (typeof statement.getOffset_ === 'function') {
            const offset = statement.getOffset_();
            // We only include the value if it is not undefined.
            if (typeof offset !== 'undefined') {
                args.push(any.create(offset).valueOf());
            }
        }
    }

    proto.setStmtId(statement.getStatementId());
    proto.setArgsList(args);

    return Execute(proto);
};

module.exports = Execute;
