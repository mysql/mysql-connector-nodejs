'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const ColumnIdentifier = require('lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').ColumnIdentifier;
const Crud = require('lib/Protocol/Protobuf/Adapters/Crud');
const DocumentPathItem = require('lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').DocumentPathItem;
const Expr = require('lib/Protocol/Protobuf/Stubs/mysqlx_expr_pb').Expr;
const Scalar = require('lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Scalar;
const Parser = require('lib/ExprParser');
const expect = require('chai').expect;

describe('Protobuf', () => {
    context('Crud', () => {
        context('encodeProjection()', () => {
            it('should encode a Mysqlx.Expr.Expr', () => {
                const docPathItem = new DocumentPathItem();
                docPathItem.setType(DocumentPathItem.Type.MEMBER);
                docPathItem.setValue('foo');

                const id = new ColumnIdentifier();
                id.addDocumentPath(docPathItem);

                const expr = new Expr();
                expr.setType(Expr.Type.IDENT);
                expr.setIdentifier(id);

                const encoded = Crud.encodeProjection(expr);
                expect(encoded.getSource()).to.deep.equal(expr);
            });
        });

        context('encodeTypedRow()', () => {
            it('should encode a typed row given a single object', () => {
                const encoded = Crud.encodeTypedRow({ name: 'foo' });
                const row = encoded.getFieldList()[0];

                expect(row.getType()).to.equal(Expr.Type.OBJECT);

                const fields = row.getObject().getFldList();
                expect(fields).to.have.lengthOf(1);
                expect(fields[0].getKey()).to.equal('name');
                expect(fields[0].getValue().getType()).to.equal(Expr.Type.LITERAL);
                expect(fields[0].getValue().getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(fields[0].getValue().getLiteral().getVString().getValue()).toString()).to.equal('foo');
                /* eslint-enable node/no-deprecated-api */
            });

            it('should encode an array of expressions', () => {
                const expr1 = Parser.parse('foo', { mode: Parser.Mode.TABLE }).output;
                const expr2 = Parser.parse('bar', { mode: Parser.Mode.TABLE }).output;
                const encoded = Crud.encodeTypedRow([expr1, expr2]);
                const fields = encoded.getFieldList();

                expect(fields[0].toObject()).to.deep.equal(expr1.toObject());
                expect(fields[1].toObject()).to.deep.equal(expr2.toObject());
            });

            it('should encode an array of any kind of language type', () => {
                const encoded = Crud.encodeTypedRow(['foo', 23, 1.1, true]);
                const fields = encoded.getFieldList();

                expect(fields).to.have.lengthOf(4);
                fields.forEach(field => expect(field.getType()).to.equal(Expr.Type.LITERAL));
                expect(fields[0].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(fields[0].getLiteral().getVString().getValue()).toString()).to.equal('foo');
                /* eslint-enable node/no-deprecated-api */
                expect(fields[1].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(fields[1].getLiteral().getVUnsignedInt()).to.equal(23);
                expect(fields[2].getLiteral().getType()).to.equal(Scalar.Type.V_FLOAT);
                expect(fields[2].getLiteral().getVFloat()).to.equal(1.1);
                expect(fields[3].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(fields[3].getLiteral().getVBool()).to.equal(true);
            });
        });
    });
});
