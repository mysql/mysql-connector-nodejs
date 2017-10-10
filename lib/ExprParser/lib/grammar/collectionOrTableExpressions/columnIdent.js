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

const Expr = require('../../stubs/mysqlx_expr_pb').Expr;
const ColumnIdentifier = require('../../stubs/mysqlx_expr_pb').ColumnIdentifier;
const Pa = require('parsimmon');

const parser = options => r => Pa
    .seq(
        Pa
            .seq(
                r.ident,
                Pa.string('.'),
                Pa
                    .seq(r.ident, Pa.string('.'))
                    .map(data => data[0])
                    .atMost(1)
                    .map(data => data[0])
            )
            .map(data => [data[0], data[2]])
            .atMost(1)
            .map(data => data[0]),
        r.ident,
        Pa
            .seq(
                Pa.alt(Pa.string('->>'), Pa.string('->')),
                Pa.string("'"),
                Pa.string('$'),
                r.documentPath,
                Pa.string("'")
            )
            .map(data => data[3])
            .atMost(1)
            .map(data => data[0])
    )
    .map(data => {
        const columnId = new ColumnIdentifier();
        columnId.setName(data[1]);

        const meta = data[0] || [];

        if (typeof meta[1] !== 'undefined') {
            columnId.setSchemaName(meta[0]);
            columnId.setTableName(meta[1]);
        } else {
            columnId.setTableName(meta[0]);
        }

        const paths = data[2] || [];

        paths.forEach(path => {
            columnId.addDocumentPath(path);
        });

        const expr = new Expr();
        expr.setType(Expr.Type.IDENT);
        expr.setIdentifier(columnId);

        return expr;
    });

module.exports = { name: 'COLUMN_IDENT', parser };
