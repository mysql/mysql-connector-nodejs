/*
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
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
