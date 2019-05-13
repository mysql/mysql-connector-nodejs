'use strict';

/* eslint-env node, mocha */

const Expr = require('../../../../lib/ExprParser/lib/stubs/mysqlx_expr_pb').Expr;
const DocumentPathItem = require('../../../../lib/ExprParser/lib/stubs/mysqlx_expr_pb').DocumentPathItem;
const Parser = require('../../../../lib/ExprParser');
const Scalar = require('../../../../lib/ExprParser/lib/stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('valid Document Expressions', () => {
        context('boolean expressions', () => {
            it('parses valid "IN" syntax', () => {
                let input = '(1 in (1,2,3)) = TRUE';
                let expr = Parser.parse(input);

                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);

                let equalityOperator = expr.output.getOperator();
                expect(equalityOperator.getName()).to.equal('==');
                expect(equalityOperator.getParamList()).to.have.lengthOf(2);

                let inOperator = equalityOperator.getParamList()[0];
                expect(inOperator.getType()).to.equal(Expr.Type.OPERATOR);
                expect(inOperator.getOperator().getName()).to.equal('in');

                let params = inOperator.getOperator().getParamList();
                expect(params).to.have.lengthOf(4);

                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[2].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(params[3].getLiteral().getVUnsignedInt()).to.equal(3);

                expect(equalityOperator.getParamList()[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(equalityOperator.getParamList()[1].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(equalityOperator.getParamList()[1].getLiteral().getVBool()).to.equal(true);

                input = 'field in (1,2,3)';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(4);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(1);
                expect(params[0].getIdentifier().getDocumentPathList()[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(params[0].getIdentifier().getDocumentPathList()[0].getValue()).to.equal('field');

                params.slice(1, params.length).forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[2].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(params[3].getLiteral().getVUnsignedInt()).to.equal(3);

                input = "field in ('one', 'two', 'three')";
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(4);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(1);
                expect(params[0].getIdentifier().getDocumentPathList()[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(params[0].getIdentifier().getDocumentPathList()[0].getValue()).to.equal('field');

                params.slice(1, params.length).forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                });

                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(params[1].getLiteral().getVString().getValue()).toString()).to.equal('one');
                expect(new Buffer(params[2].getLiteral().getVString().getValue()).toString()).to.equal('two');
                expect(new Buffer(params[3].getLiteral().getVString().getValue()).toString()).to.equal('three');
                /* eslint-enable node/no-deprecated-api */
            });

            it('parses valid "NOT IN" syntax', () => {
                const input = '(1 not in (1,2,3)) = FALSE';
                const expr = Parser.parse(input);

                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);

                const equalityOperator = expr.output.getOperator();
                expect(equalityOperator.getName()).to.equal('==');
                expect(equalityOperator.getParamList()).to.have.lengthOf(2);

                const inOperator = equalityOperator.getParamList()[0];
                expect(inOperator.getType()).to.equal(Expr.Type.OPERATOR);
                expect(inOperator.getOperator().getName()).to.equal('not_in');

                const inParams = inOperator.getOperator().getParamList();
                expect(inParams).to.have.lengthOf(4);

                inParams.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(inParams[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(inParams[1].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(inParams[2].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(inParams[3].getLiteral().getVUnsignedInt()).to.equal(3);

                expect(equalityOperator.getParamList()[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(equalityOperator.getParamList()[1].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(equalityOperator.getParamList()[1].getLiteral().getVBool()).to.equal(false);
            });

            it('parses valid JSON syntax', () => {
                const input = '{"foo" : "bar", "baz": [1,2,[3],{}, TRUE, true, false, False, null, NULL, Null]}';
                const expr = Parser.parse(input);

                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OBJECT);

                const fields = expr.output.getObject().getFldList();
                expect(fields).to.have.lengthOf(2);
                expect(fields[0].getKey()).to.equal('foo');
                expect(fields[1].getKey()).to.equal('baz');

                const fstValue = fields[0].getValue();
                expect(fstValue.getType()).to.equal(Expr.Type.LITERAL);
                expect(fstValue.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(fstValue.getLiteral().getVString().getValue()).toString()).to.equal('bar');
                /* eslint-enable node/no-deprecated-api */

                const sndValue = fields[1].getValue();
                expect(sndValue.getType()).to.equal(Expr.Type.ARRAY);

                const valueArray = sndValue.getArray().getValueList();
                expect(valueArray).to.have.lengthOf(11);

                valueArray.slice(0, 2).forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(valueArray[2].getType()).to.equal(Expr.Type.ARRAY);
                expect(valueArray[3].getType()).to.equal(Expr.Type.OBJECT);

                valueArray.slice(4, 8).forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                });

                valueArray.slice(8, valueArray.length).forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_NULL);
                });
            });

            it('parses valid double-quoted literals', () => {
                let input = `"foo'bar"`;
                let expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                let literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal("foo'bar");
                /* eslint-enable node/no-deprecated-api */

                input = `"foo''bar"`;
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal("foo''bar");
                /* eslint-enable node/no-deprecated-api */

                input = '""""';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('"');
                /* eslint-enable node/no-deprecated-api */

                input = '""';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('');
                /* eslint-enable node/no-deprecated-api */

                input = '"foo\u005C"bar"';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('foo"bar');
                /* eslint-enable node/no-deprecated-api */

                input = '"foo""bar"';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('foo"bar');
                /* eslint-enable node/no-deprecated-api */

                input = '"\u005C\u005C&quot"';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('\u005C&quot');
                /* eslint-enable node/no-deprecated-api */
            });

            it('parses valid single-quoted literals', () => {
                let input = `'foo"bar'`;
                let expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                let literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('foo"bar');
                /* eslint-enable node/no-deprecated-api */

                input = `'foo""bar'`;
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('foo""bar');
                /* eslint-enable node/no-deprecated-api */

                input = "''''";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal("'");
                /* eslint-enable node/no-deprecated-api */

                input = "''";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('');
                /* eslint-enable node/no-deprecated-api */

                input = "'foo\u005C'bar'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal("foo'bar");
                /* eslint-enable node/no-deprecated-api */

                input = "'foo''bar'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal("foo'bar");
                /* eslint-enable node/no-deprecated-api */

                input = "'\u005C\u005C&quot'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.LITERAL);

                literal = expr.output.getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('\u005C&quot');
                /* eslint-enable node/no-deprecated-api */
            });

            // Following test-cases were not included in original EBNF, but are valid

            it('parses valid unary operations', () => {
                let input = 'NOT TRUE';
                let expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(1);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);

                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(params[0].getLiteral().getVBool()).to.equal(true);

                input = 'not foo';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(1);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);

                let docPath = params[0].getIdentifier().getDocumentPathList();
                expect(docPath[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(docPath[0].getValue()).to.equal('foo');
            });

            it('parses valid unary operations', () => {
                let input = 'NOT TRUE';
                let expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(1);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);

                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(params[0].getLiteral().getVBool()).to.equal(true);

                input = 'not foo';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(1);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);

                let docPath = params[0].getIdentifier().getDocumentPathList();
                expect(docPath[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(docPath[0].getValue()).to.equal('foo');
            });

            it('parses valid binary operations', () => {
                let input = `1 <> 2`;
                let expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('!=');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(2);

                input = `4 % 2`;
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('%');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(4);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(2);

                input = 'foo is true';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('is');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);

                expect(params[0].getType()).to.equal(Expr.Type.IDENT);

                let docPath = params[0].getIdentifier().getDocumentPathList();
                expect(docPath).to.have.lengthOf(1);
                expect(docPath[0].getValue()).to.equal('foo');

                expect(params[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                expect(params[1].getLiteral().getVBool()).to.equal(true);

                input = 'true is not false';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('is_not');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                });

                expect(params[0].getLiteral().getVBool()).to.equal(true);
                expect(params[1].getLiteral().getVBool()).to.equal(false);

                input = 'null IS NULL';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('is');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_NULL);
                });

                input = "'foobar' like '%foo%'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('like');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                });

                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar');
                expect(new Buffer(params[1].getLiteral().getVString().getValue()).toString()).to.equal('%foo%');
                /* eslint-enable node/no-deprecated-api */

                input = "'foobar' NOT LIKE '%quux%'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not_like');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                });

                input = "'foobar_' LIKE 'foobar|_' ESCAPE '|'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('like');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(3);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                });

                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar_');
                expect(new Buffer(params[1].getLiteral().getVString().getValue()).toString()).to.equal('foobar|_');
                expect(new Buffer(params[2].getLiteral().getVString().getValue()).toString()).to.equal('|');
                /* eslint-enable node/no-deprecated-api */

                input = '4 BETWEEN 2 AND 6';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('between');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(3);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(4);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(params[2].getLiteral().getVUnsignedInt()).to.equal(6);

                input = '1 not between 9 AND 10';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('between_not');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(3);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(9);
                expect(params[2].getLiteral().getVUnsignedInt()).to.equal(10);

                input = "'foobar!' REGEXP '.*'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('regexp');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                });

                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar!');
                expect(new Buffer(params[1].getLiteral().getVString().getValue()).toString()).to.equal('.*');
                /* eslint-enable node/no-deprecated-api */

                input = "'foobar' not regexp '^q.*'";
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not_regexp');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                });

                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(params[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar');
                expect(new Buffer(params[1].getLiteral().getVString().getValue()).toString()).to.equal('^q.*');
                /* eslint-enable node/no-deprecated-api */

                input = 'not = foo';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('==');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => expect(param.getType()).to.equal(Expr.Type.IDENT));

                docPath = params[0].getIdentifier().getDocumentPathList();
                expect(docPath[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(docPath[0].getValue()).to.equal('not');

                docPath = params[1].getIdentifier().getDocumentPathList();
                expect(docPath[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(docPath[0].getValue()).to.equal('foo');
            });

            it('parses empty JSON expressions', () => {
                let input = '[]';
                let expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.ARRAY);
                expect(expr.output.getArray().getValueList()).to.have.lengthOf(0);

                input = '{}';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OBJECT);
                expect(expr.output.getObject().getFldList()).to.have.lengthOf(0);
            });

            it('parses placeholders', () => {
                const input = ':foo AND :bar';
                const expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('&&');

                const params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach((param, index) => {
                    expect(param.getType()).to.equal(Expr.Type.PLACEHOLDER);
                    expect(param.getPosition()).to.equal(index);
                });
            });
        });

        context('document-only expressions', () => {
            it('parses valid "cont_in" syntax', () => {
                let input = '1 in [1,2,3]';
                let expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                let options = params[1].getArray().getValueList();
                expect(options).to.have.lengthOf(3);
                options.forEach((option, index) => {
                    expect(option.getType()).to.equal(Expr.Type.LITERAL);
                    expect(option.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                    expect(option.getLiteral().getVUnsignedInt()).to.equal(index + 1);
                });

                input = '[1] in [[1],[2],[3]]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.ARRAY);

                let selector = params[0].getArray().getValueList();
                expect(selector).to.have.lengthOf(1);
                expect(selector[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(selector[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(selector[0].getLiteral().getVUnsignedInt()).to.equal(1);

                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);
                options = params[1].getArray().getValueList();
                expect(options).to.have.lengthOf(3);
                options.forEach((option, index) => {
                    expect(option.getType()).to.equal(Expr.Type.ARRAY);
                    expect(option.getArray().getValueList()).to.have.length(1);
                    expect(option.getArray().getValueList()[0].getType()).to.equal(Expr.Type.LITERAL);
                    expect(option.getArray().getValueList()[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                    expect(option.getArray().getValueList()[0].getLiteral().getVUnsignedInt()).to.equal(index + 1);
                });

                input = "'DocumentStore' in categories";
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);

                let literal = params[0].getLiteral();
                expect(literal.getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(literal.getVString().getValue()).toString()).to.equal('DocumentStore');
                /* eslint-enable node/no-deprecated-api */

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);

                let pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('categories');

                input = 'author NOT IN reviewers';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not_cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => expect(param.getType()).to.equal(Expr.Type.IDENT));

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('author');

                pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('reviewers');

                input = 'user in [45, 46]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('user');

                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                let values = params[1].getArray().getValueList();
                expect(values).to.have.lengthOf(2);
                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(45);
                expect(values[1].getLiteral().getVUnsignedInt()).to.equal(46);

                input = '1 in field.array';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);

                pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                pathItems.forEach(pathItem => expect(pathItem.getType()).to.equal(DocumentPathItem.Type.MEMBER));
                expect(pathItems[0].getValue()).to.equal('field');
                expect(pathItems[1].getValue()).to.equal('array');

                input = 'field in [1,2,3]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('field');

                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                let args = params[1].getArray().getValueList();
                expect(args).to.have.lengthOf(3);
                args.forEach(arg => {
                    expect(arg.getType()).to.equal(Expr.Type.LITERAL);
                    expect(arg.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });
                expect(args[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(args[1].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(args[2].getLiteral().getVUnsignedInt()).to.equal(3);

                input = '{"a":1} in $';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.OBJECT);

                let fields = params[0].getObject().getFldList();
                expect(fields).to.have.lengthOf(1);
                expect(fields[0].getKey()).to.equal('a');
                expect(fields[0].getValue().getType()).to.equal(Expr.Type.LITERAL);
                expect(fields[0].getValue().getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(fields[0].getValue().getLiteral().getVUnsignedInt()).to.equal(1);

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);

                input = '$.field1 in $.field2';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => expect(param.getType()).to.equal(Expr.Type.IDENT));

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('field1');

                pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('field2');

                input = '(1>5) in [true, false]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.OPERATOR);
                expect(params[0].getOperator().getName()).to.equal('>');

                args = params[0].getOperator().getParamList();
                expect(args).to.have.lengthOf(2);
                args.forEach(arg => {
                    expect(arg.getType()).to.equal(Expr.Type.LITERAL);
                    expect(arg.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });
                expect(args[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(args[1].getLiteral().getVUnsignedInt()).to.equal(5);

                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);
                args = params[1].getArray().getValueList();
                expect(args).to.have.lengthOf(2);
                args.forEach(arg => {
                    expect(arg.getType()).to.equal(Expr.Type.LITERAL);
                    expect(arg.getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                });
                expect(args[0].getLiteral().getVBool()).to.equal(true);
                expect(args[1].getLiteral().getVBool()).to.equal(false);
            });

            it('parses valid function syntax', () => {
                let input = "substr('foobar', 1, 3) = 'foo'";
                let expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('==');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.FUNC_CALL);

                let functionCall = params[0].getFunctionCall();
                expect(functionCall.getName().getName()).to.equal('substr');

                let args = functionCall.getParamList();
                expect(args).to.have.lengthOf(3);
                args.forEach(param => expect(param.getType()).to.equal(Expr.Type.LITERAL));
                expect(args[0].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(args[0].getLiteral().getVString().getValue()).toString()).to.equal('foobar');
                /* eslint-enable node/no-deprecated-api */
                expect(args[1].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(args[1].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(args[2].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(args[2].getLiteral().getVUnsignedInt()).to.equal(3);

                expect(params[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(params[1].getLiteral().getVString().getValue()).toString()).to.equal('foo');
                /* eslint-enable node/no-deprecated-api */

                input = "jcast(concat('[', 1, ',', 2, ']')) = [1,2]";
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('==');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.FUNC_CALL);

                functionCall = params[0].getFunctionCall();
                expect(functionCall.getName().getName()).to.equal('jcast');

                args = functionCall.getParamList();
                expect(args).to.have.lengthOf(1);
                expect(args[0].getType()).to.equal(Expr.Type.FUNC_CALL);

                functionCall = args[0].getFunctionCall();
                expect(functionCall.getName().getName()).to.equal('concat');

                args = functionCall.getParamList();
                expect(args).to.have.lengthOf(5);
                args.forEach(arg => expect(arg.getType()).to.equal(Expr.Type.LITERAL));
                expect(args[0].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(args[0].getLiteral().getVString().getValue()).toString()).to.equal('[');
                /* eslint-enable node/no-deprecated-api */
                expect(args[1].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(args[1].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(args[2].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(args[2].getLiteral().getVString().getValue()).toString()).to.equal(',');
                /* eslint-enable node/no-deprecated-api */
                expect(args[3].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(args[3].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(args[4].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                /* eslint-disable node/no-deprecated-api */
                expect(new Buffer(args[4].getLiteral().getVString().getValue()).toString()).to.equal(']');
                /* eslint-enable node/no-deprecated-api */
            });

            it('parses expressions containing valid document paths', () => {
                let input = 'foo = bar.baz';
                let expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('==');

                let params = expr.output.getOperator().getParamList();
                expect(expr.output.getOperator().getParamList()).to.have.lengthOf(2);
                params.forEach(param => expect(param.getType()).to.equal(Expr.Type.IDENT));

                let pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');

                pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('bar');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('baz');

                input = 'foo**.bar';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = 'foo[*].bar';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = '$ = {"a":1}';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('==');

                params = expr.output.getOperator().getParamList();
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
                expect(params[1].getType()).to.equal(Expr.Type.OBJECT);

                let fields = params[1].getObject().getFldList();
                expect(fields).to.have.lengthOf(1);
                expect(fields[0].getKey()).to.equal('a');
                expect(fields[0].getValue().getType()).to.equal(Expr.Type.LITERAL);
                expect(fields[0].getValue().getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(fields[0].getValue().getLiteral().getVUnsignedInt()).to.equal(1);

                input = '_**._';
                expr = Parser.parse(input);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('_');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('_');

                input = '_**[*]._';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(4);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('_');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(pathItems[3].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[3].getValue()).to.equal('_');

                input = '_**[*]._**._';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(6);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('_');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(pathItems[3].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[3].getValue()).to.equal('_');
                expect(pathItems[4].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[5].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[3].getValue()).to.equal('_');

                input = '$.foo.bar[*]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('bar');
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

                input = '$." ".bar';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal(' ');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('bar');

                input = '$.a[0].b[0]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(4);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[1].getIndex()).to.equal(0);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('b');
                expect(pathItems[3].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[3].getIndex()).to.equal(0);

                input = '$.a[0][0]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[1].getIndex()).to.equal(0);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[2].getIndex()).to.equal(0);

                input = '$.a[*][*]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

                input = '$.a[*].z';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('z');

                input = '$."foo bar"."baz**" = $';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('==');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo bar');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('baz**');

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(0);

                input = '$.foo**.bar';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = '$."foo bar"**.baz';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo bar');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('baz');

                input = '$."foo"**."bar"';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = '$."foo."**."bar"';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo.');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = '$."foo."**.".bar"';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo.');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('.bar');

                input = '$.""';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('');

                input = '$**.bar';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('bar');

                input = '$**[0]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[1].getIndex()).to.equal(0);

                input = '$.a**[0]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[2].getIndex()).to.equal(0);

                input = '$.a**[*]';
                expr = Parser.parse(input);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
            });

            it('parses valid "overlaps" syntax', () => {
                let input = '[1, 2, 3] OVERLAPS $.foo';
                let expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('overlaps');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.ARRAY);
                expect(params[1].getType()).to.equal(Expr.Type.IDENT);

                let values = params[0].getArray().getValueList();
                expect(values).to.have.lengthOf(3);

                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(values[1].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(values[2].getLiteral().getVUnsignedInt()).to.equal(3);

                let pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');

                input = 'foo OVERLAPS [4]';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('overlaps');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');

                values = params[1].getArray().getValueList();
                expect(values).to.have.lengthOf(1);
                expect(values[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(values[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(4);

                input = '[6, 7] NOT OVERLAPS foo';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not_overlaps');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.ARRAY);
                expect(params[1].getType()).to.equal(Expr.Type.IDENT);

                values = params[0].getArray().getValueList();
                expect(values).to.have.lengthOf(2);

                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(6);
                expect(values[1].getLiteral().getVUnsignedInt()).to.equal(7);

                pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');

                input = '$.foo NOT OVERLAPS [8, 9]';
                expr = Parser.parse(input);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not_overlaps');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');

                values = params[1].getArray().getValueList();
                expect(values).to.have.lengthOf(2);

                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(8);
                return expect(values[1].getLiteral().getVUnsignedInt()).to.equal(9);
            });
        });
    });
});
