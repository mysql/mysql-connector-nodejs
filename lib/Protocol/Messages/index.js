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