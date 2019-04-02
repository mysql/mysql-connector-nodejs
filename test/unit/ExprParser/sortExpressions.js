'use strict';

/* eslint-env node, mocha */

const Expr = require('../../../lib/ExprParser/lib/stubs/mysqlx_expr_pb').Expr;
const DocumentPathItem = require('../../../lib/ExprParser/lib/stubs/mysqlx_expr_pb').DocumentPathItem;
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
