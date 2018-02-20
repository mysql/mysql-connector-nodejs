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

const DocumentPathItem = require('../../stubs/mysqlx_expr_pb').DocumentPathItem;
const Pa = require('parsimmon');

const parser = options => r => Pa
    .alt(
        Pa
            .string('[*]')
            .map(data => {
                const dpi = new DocumentPathItem();

                dpi.setType(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

                return dpi;
            }),
        Pa
            .seq(Pa.string('['), r.INT.map(v => parseInt(v, 10)), Pa.string(']'))
            .map(data => {
                const dpi = new DocumentPathItem();

                dpi.setType(DocumentPathItem.Type.ARRAY_INDEX);
                dpi.setIndex(data[1]);

                return dpi;
            }),
        Pa
            .string('.*')
            .map(data => {
                const dpi = new DocumentPathItem();

                dpi.setType(DocumentPathItem.MEMBER_ASTERISK);

                return dpi;
            }),
        Pa
            .seq(Pa.string('.'), r.documentPathMember)
            .map(data => {
                const pathItem = new DocumentPathItem();

                pathItem.setType(DocumentPathItem.Type.MEMBER);
                pathItem.setValue(data[1]);

                return pathItem;
            })
    );

module.exports = { name: 'DOCUMENT_PATH_LAST_ITEM', parser };
