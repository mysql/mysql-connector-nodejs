'use strict';

/* eslint-env node, mocha */

const Expr = require('../../../lib/ExprParser/lib/stubs/mysqlx_expr_pb').Expr;
const DocumentPathItem = require('../../../lib/ExprParser/lib/stubs/mysqlx_expr_pb').DocumentPathItem;
const Parser = require('../../../lib/ExprParser');
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('projectedSearchExpressions', () => {
        const type = Parser.Type.PROJECTED_SEARCH_EXPR;

        it('parses source without alias', () => {
            const crud = Parser.parse('foo', { type });
            expect(crud.output.getSource().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getSource().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('foo');

            expect(crud.output.getAlias()).to.equal('foo');
        });

        it('parses lower-case alias', () => {
            const crud = Parser.parse('bar as baz', { type });
            expect(crud.output.getSource().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getSource().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('bar');

            expect(crud.output.getAlias()).to.equal('baz');
        });

        it('parses upper-case alias', () => {
            const crud = Parser.parse('baz AS qux', { type });
            expect(crud.output.getSource().getType()).to.equal(Expr.Type.IDENT);

            const pathItems = crud.output.getSource().getIdentifier().getDocumentPathList();
            expect(pathItems).to.have.lengthOf(1);
            expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
            expect(pathItems[0].getValue()).to.equal('baz');

            expect(crud.output.getAlias()).to.equal('qux');
        });
    });
});
