/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
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
const DocumentPathItem = require('../../../lib/Protocol/Stubs/mysqlx_expr_pb').DocumentPathItem;
const Parser = require('../../../lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('sortExpressions', () => {
        const type = Parser.Type.SORT_EXPR;

        it('parses ascending order by default', () => {
            const crud = Parser.parse('foo', { type });
            expect(crud.output.getExpr().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getExpr().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('foo');
            expect(crud.output.getDirection()).to.equal(1);
        });

        it('parses lower-case ascending order', () => {
            const crud = Parser.parse('bar asc', { type });
            expect(crud.output.getExpr().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getExpr().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('bar');
            expect(crud.output.getDirection()).to.equal(1);
        });

        it('parses upper-case ascending order', () => {
            const crud = Parser.parse('baz ASC', { type });
            expect(crud.output.getExpr().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getExpr().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('baz');
            expect(crud.output.getDirection()).to.equal(1);
        });

        it('parses lower-case descending order', () => {
            const crud = Parser.parse('qux desc', { type });
            expect(crud.output.getExpr().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getExpr().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('qux');
            expect(crud.output.getDirection()).to.equal(2);
        });

        it('parses upper-case descending order', () => {
            const crud = Parser.parse('quux DESC', { type });
            expect(crud.output.getExpr().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getExpr().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('quux');
            expect(crud.output.getDirection()).to.equal(2);
        });
    });
});
