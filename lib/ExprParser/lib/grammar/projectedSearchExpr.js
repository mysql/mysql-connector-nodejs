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

const Crud = require('../stubs/mysqlx_crud_pb');
const Pa = require('parsimmon');

const parser = options => r => Pa
    .seq(
        r.expr
            .map(data => data),
        Pa
            .seq(Pa.whitespace, r.AS, Pa.whitespace, r.ident)
            .map(data => data[3])
            .atMost(1)
            .map(data => data[0])
    )
    .map(data => {
        const projection = new Crud.Projection();
        projection.setSource(data[0].output);

        if (data[1]) {
            projection.setAlias(data[1]);
        } else {
            projection.setAlias(data[0].input);
        }

        return { input: options.input, output: projection };
    });

module.exports = { name: 'PROJECTED_SEARCH_EXPR', parser };
