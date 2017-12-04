/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

function registerMessages(prefix, messages) {
    for (var name in messages.messages) {
        module.exports.messages[prefix + name] = messages.messages[name];
        if (messages.messages[name].messages) {
            registerMessages(prefix + name + '.', messages.messages[name]);
        }
    }
}

(function () {
    module.exports = {messages: {}, enums: {}};

    [
        require('./mysqlx.json'),
        require('./mysqlx_crud.json'),
        require('./mysqlx_connection.json'),
        require('./mysqlx_expr.json'),
        require('./mysqlx_session.json'),
        require('./mysqlx_datatypes.json'),
        require('./mysqlx_notice.json'),
        require('./mysqlx_resultset.json'),
        require('./mysqlx_sql.json')
    ].forEach(function (messages) {
            var mypackage = "";
            if (messages.package) {
                mypackage = messages.package + '.';
            }
            registerMessages(mypackage, messages);
            if (messages.enums) {
                for (var name in messages.enums) {
                    module.exports.enums[name] = messages.enums[name];
                }
            }
        });

    module.exports.ClientMessages = module.exports.messages["Mysqlx.ClientMessages"].enums.Type;
    module.exports.ServerMessages = module.exports.messages["Mysqlx.ServerMessages"].enums.Type;
}());
