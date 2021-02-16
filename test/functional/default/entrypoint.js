/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

/* eslint-env node, mocha */

const Expr = require('../../../lib/Protocol/Stubs/mysqlx_expr_pb').Expr;
const expect = require('chai').expect;
const mysqlx = require('../../../');
const pkg = require('../../../package.json');

describe('client API entrypoint', () => {
    context('parsing an X DevAPI expression', () => {
        it('returns a document-mode expression by default', () => {
            const expression = mysqlx.expr('foo');
            const typed = new Expr(expression.toArray());

            // string describes an identifier document path
            expect(typed.getType()).to.equal(1);
            const documentPath = typed.getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType(1)).to.equal(1);
            expect(documentPath[0].getValue()).to.equal('foo');
        });

        it('returns a table-mode expression if explicitely requested', () => {
            const expression = mysqlx.expr('foo', { mode: mysqlx.Mode.TABLE });
            const typed = new Expr(expression.toArray());

            // string describes an identifier name
            expect(typed.getType()).to.equal(1);
            expect(typed.getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
            expect(typed.getIdentifier().getName()).to.equal('foo');
        });
    });

    context('checking the client version', () => {
        it('returns the current npm package version', () => {
            expect(mysqlx.getVersion()).to.equal(pkg.version);
        });
    });
});
