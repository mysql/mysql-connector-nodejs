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

const ColumnIdentifier = require('../../stubs/mysqlx_expr_pb').ColumnIdentifier;
const DocumentPathItem = require('../../stubs/mysqlx_expr_pb').DocumentPathItem;
const Pa = require('parsimmon');

const scopedDocumentField = options => r => {
    return Pa
        .seq(
            Pa
                .string('$')
                .map(data => {
                    options.scoped = true;
                    return data;
                }),
            r.documentPath
                .atMost(1)
                .map(data => data[0])
        )
        .map(data => data[1]);
};

const parser = options => r => Pa
    .alt(
        Pa
            .seq(
                r.fieldId.map(data => {
                    const pathItem = new DocumentPathItem();

                    pathItem.setType(DocumentPathItem.Type.MEMBER);
                    pathItem.setValue(data);

                    return pathItem;
                }),
                r.documentPath.atMost(1).map(data => data[0])
            )
            .map(data => [data[0]].concat(data[1])),
        scopedDocumentField(options)(r)
    )
    .map(data => {
        const columnId = new ColumnIdentifier();

        data.forEach(pathItem => {
            columnId.addDocumentPath(pathItem);
        });

        return columnId;
    });

module.exports = { name: 'DOCUMENT_FIELD', parser };
