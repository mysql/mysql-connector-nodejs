'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const mysqlx = require('index');
const Expr = require('lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').Expr;

describe('mysqlx', () => {
    context('expr()', () => {
        it('should parse a string into a document-mode expression by default', () => {
            const expression = mysqlx.expr('foo');
            const typed = new Expr(expression.toArray());

            // string describes an identifier document path
            expect(typed.getType()).to.equal(1);
            const documentPath = typed.getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType(1)).to.equal(1);
            expect(documentPath[0].getValue()).to.equal('foo');
        });

        it('should parse a string into a table-mode expression if explicitely requested', () => {
            const expression = mysqlx.expr('foo', { mode: mysqlx.Mode.TABLE });
            const typed = new Expr(expression.toArray());

            // string describes an identifier name
            expect(typed.getType()).to.equal(1);
            expect(typed.getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
            expect(typed.getIdentifier().getName()).to.equal('foo');
        });
    });
});
