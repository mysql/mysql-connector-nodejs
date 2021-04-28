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

const Expr = require('../../../../lib/Protocol/Stubs/mysqlx_expr_pb').Expr;
const DocumentPathItem = require('../../../../lib/Protocol/Stubs/mysqlx_expr_pb').DocumentPathItem;
const Parser = require('../../../../lib/ExprParser');
const Scalar = require('../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar;
const expect = require('chai').expect;

describe('ExprParser', () => {
    context('valid Relational Expressions', () => {
        const options = { mode: Parser.Mode.TABLE };

        context('boolean expressions', () => {
            it('parses valid binary operations', () => {
                let input = '1 <> 2';
                let expr = Parser.parse(input, options);
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

                input = '4 % 2';
                expr = Parser.parse(input, options);
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

                input = '-2 > -3';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('>');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_SINT);
                });

                expect(params[0].getLiteral().getVSignedInt()).to.equal(-2);
                expect(params[1].getLiteral().getVSignedInt()).to.equal(-3);

                input = 'true OR false';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('||');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_BOOL);
                });

                expect(params[0].getLiteral().getVBool()).to.equal(true);
                expect(params[1].getLiteral().getVBool()).to.equal(false);

                input = '1 & 0';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('&');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(0);

                input = '1000 >> 1010';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('>>');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(1000);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1010);

                input = 'not = foo';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('==');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => expect(param.getType()).to.equal(Expr.Type.IDENT));

                expect(params[0].getIdentifier().getName()).to.equal('not');
                expect(params[1].getIdentifier().getName()).to.equal('foo');

                input = '8 DIV 4';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('div');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                params.forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });

                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(8);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(4);
            });

            it('parses valid JSON syntax', () => {
                const input = '{"foo" : "bar", "baz": [1,2,[3],{}, TRUE, true, false, False, null, NULL, Null]}';
                const expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.OBJECT);

                const fields = expr.output.getObject().getFldList();
                expect(fields).to.have.lengthOf(2);
                expect(fields[0].getKey()).to.equal('foo');
                expect(fields[1].getKey()).to.equal('baz');

                const fstValue = fields[0].getValue();
                expect(fstValue.getType()).to.equal(Expr.Type.LITERAL);
                expect(fstValue.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                expect(Buffer.from(fstValue.getLiteral().getVString().getValue()).toString()).to.equal('bar');

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

            it('parses empty JSON expressions', () => {
                let input = '[]';
                let expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.ARRAY);
                expect(expr.output.getArray().getValueList()).to.have.lengthOf(0);

                input = '{}';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OBJECT);
                expect(expr.output.getObject().getFldList()).to.have.lengthOf(0);
            });
        });

        context('escaped identifiers', () => {
            it('parses escaped column paths', () => {
                let input = '`foo.bar`';
                let expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('foo.bar');

                input = '`foo``bar`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('foo`bar');

                input = 'foo.`bar`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo');
                expect(expr.output.getIdentifier().getName()).to.equal('bar');

                input = 'foo.`bar.baz`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo');
                expect(expr.output.getIdentifier().getName()).to.equal('bar.baz');

                input = 'foo.`bar``baz`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo');
                expect(expr.output.getIdentifier().getName()).to.equal('bar`baz');

                input = 'foo.`bar`.`baz`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo');
                expect(expr.output.getIdentifier().getTableName()).to.equal('bar');
                expect(expr.output.getIdentifier().getName()).to.equal('baz');

                input = '`foo`.`bar`.`baz`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo');
                expect(expr.output.getIdentifier().getTableName()).to.equal('bar');
                expect(expr.output.getIdentifier().getName()).to.equal('baz');

                input = '`foo.bar`.`baz`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo.bar');
                expect(expr.output.getIdentifier().getName()).to.equal('baz');

                input = '`foo``bar`.`baz`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo`bar');
                expect(expr.output.getIdentifier().getName()).to.equal('baz');

                input = '`foo.bar`.`baz`.`qux`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo.bar');
                expect(expr.output.getIdentifier().getTableName()).to.equal('baz');
                expect(expr.output.getIdentifier().getName()).to.equal('qux');

                input = '`foo``bar`.`baz`.`qux`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo`bar');
                expect(expr.output.getIdentifier().getTableName()).to.equal('baz');
                expect(expr.output.getIdentifier().getName()).to.equal('qux');

                input = '`foo`.`bar.baz`.`qux`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo');
                expect(expr.output.getIdentifier().getTableName()).to.equal('bar.baz');
                expect(expr.output.getIdentifier().getName()).to.equal('qux');

                input = '`foo`.`bar``baz`.`qux`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo');
                expect(expr.output.getIdentifier().getTableName()).to.equal('bar`baz');
                expect(expr.output.getIdentifier().getName()).to.equal('qux');

                input = '`foo`.`bar`.`baz.qux`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo');
                expect(expr.output.getIdentifier().getTableName()).to.equal('bar');
                expect(expr.output.getIdentifier().getName()).to.equal('baz.qux');

                input = '`foo`.`bar`.`baz``qux`';
                expr = Parser.parse(input, options);
                expect(expr.input).to.equal(input);

                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo');
                expect(expr.output.getIdentifier().getTableName()).to.equal('bar');
                expect(expr.output.getIdentifier().getName()).to.equal('baz`qux');
            });
        });

        context('relational-only expressions', () => {
            it('parses expressions containing valid column names', () => {
                let input = "doc->'$.foo.bar[*]'";
                let expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                let pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('bar');
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

                input = "doc->>'$.foo'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');

                input = 'doc->\'$." ".bar\'';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal(' ');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('bar');

                input = "doc->'$.a[0].b[0]'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

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

                input = "doc->'$.a[0][0]'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[1].getIndex()).to.equal(0);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[2].getIndex()).to.equal(0);

                input = "`x`->'$.a[*][*]'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('x');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

                input = "`''`->'$.a[*].z'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal("''");

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('z');

                input = 'doc->\'$."foo bar"."baz**"\'';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo bar');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('baz**');

                input = "doc->'$.foo**.bar'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = 'doc->\'$."foo bar"**.baz\'';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo bar');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('baz');

                input = 'doc->\'$."foo"**."bar"\'';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = 'doc->\'$."foo."**."bar"\'';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo.');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = 'doc->\'$."foo."**.".bar"\'';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('foo.');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('.bar');

                input = 'doc->\'$.""\'';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('');

                input = "doc->'$**.bar'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('bar');

                input = "doc->'$**[0]'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[1].getIndex()).to.equal(0);

                input = "doc->'$**.bar'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[1].getValue()).to.equal('bar');

                input = "foo.doc->'$.a**.bar'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo');
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = "foo.bar.doc->'$.a**[0]'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getSchemaName()).to.equal('foo');
                expect(expr.output.getIdentifier().getTableName()).to.equal('bar');
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX);
                expect(pathItems[2].getIndex()).to.equal(0);

                input = "`foo`.doc->'$.a**[*]'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo');
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

                input = "`foo.bar`.doc->'$.a**.bar'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('foo.bar');
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('bar');

                input = "`->`.doc->'$.a**.foo'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.IDENT);
                expect(expr.output.getIdentifier().getTableName()).to.equal('->');
                expect(expr.output.getIdentifier().getName()).to.equal('doc');

                pathItems = expr.output.getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(3);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('a');
                expect(pathItems[1].getType()).to.equal(DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(pathItems[2].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[2].getValue()).to.equal('foo');
            });
        });

        context('"IN" syntax', () => {
            it('parses valid "in" operations', () => {
                let input = 'column in (1,2,3)';
                let expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('in');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(4);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getName()).to.equal('column');

                params.slice(1, params.length).forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(params[2].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(params[3].getLiteral().getVUnsignedInt()).to.equal(3);

                input = "column in ('one', 'two', 'three')";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(4);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getName()).to.equal('column');

                params.slice(1, params.length).forEach(param => {
                    expect(param.getType()).to.equal(Expr.Type.LITERAL);
                    expect(param.getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                });
                expect(Buffer.from(params[1].getLiteral().getVString().getValue()).toString()).to.equal('one');
                expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('two');
                expect(Buffer.from(params[3].getLiteral().getVString().getValue()).toString()).to.equal('three');
            });

            it('parses valid "cont_in" operations', () => {
                let input = "cast(column as json) in doc->'$.field.array'";
                let expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.OPERATOR);
                expect(params[0].getOperator().getName()).to.equal('cast');

                let args = params[0].getOperator().getParamList();
                expect(args).to.have.lengthOf(2);
                expect(args[0].getType()).to.equal(Expr.Type.IDENT);
                expect(args[0].getIdentifier().getName()).to.equal('column');
                expect(args[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
                expect(args[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(args[1].getLiteral().getType()).to.equal(Scalar.Type.V_OCTETS);
                expect(Buffer.from(args[1].getLiteral().getVOctets().getValue()).toString()).to.equal('JSON');
                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getName()).to.equal('doc');

                let pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(2);
                pathItems.forEach(pathItem => expect(pathItem.getType()).to.equal(DocumentPathItem.Type.MEMBER));
                expect(pathItems[0].getValue()).to.equal('field');
                expect(pathItems[1].getValue()).to.equal('array');

                input = "column->'$.field' in [1,2,3]";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getName()).to.equal('column');

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('field');

                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                let values = params[1].getArray().getValueList();
                expect(values).to.have.lengthOf(3);
                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });
                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(1);
                expect(values[1].getLiteral().getVUnsignedInt()).to.equal(2);
                expect(values[2].getLiteral().getVUnsignedInt()).to.equal(3);

                input = '{"a":1} in doc->\'$\'';
                expr = Parser.parse(input, options);

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
                expect(params[1].getIdentifier().getName()).to.equal('doc');
                expect(params[1].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);

                input = "tab1.doc->'$.field1' in tab2.doc->'$.field2'";
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getTableName()).to.equal('tab1');
                expect(params[0].getIdentifier().getName()).to.equal('doc');

                pathItems = params[0].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('field1');

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getTableName()).to.equal('tab2');
                expect(params[1].getIdentifier().getName()).to.equal('doc');

                pathItems = params[1].getIdentifier().getDocumentPathList();
                expect(pathItems).to.have.lengthOf(1);
                expect(pathItems[0].getType()).to.equal(DocumentPathItem.Type.MEMBER);
                expect(pathItems[0].getValue()).to.equal('field2');

                input = '42 IN field';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(42);
                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getName()).to.equal('field');

                input = '[44,45] IN field';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.ARRAY);

                values = params[0].getArray().getValueList();
                expect(values).to.have.lengthOf(2);
                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });
                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(44);
                expect(values[1].getLiteral().getVUnsignedInt()).to.equal(45);

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getName()).to.equal('field');

                input = '{"a":1,"b":2} IN field';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.OBJECT);

                fields = params[0].getObject().getFldList();
                expect(fields).to.have.lengthOf(2);
                expect(fields[0].getKey()).to.equal('a');
                expect(fields[0].getValue().getType()).to.equal(Expr.Type.LITERAL);
                expect(fields[0].getValue().getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(fields[0].getValue().getLiteral().getVUnsignedInt()).to.equal(1);
                expect(fields[1].getKey()).to.equal('b');
                expect(fields[1].getValue().getType()).to.equal(Expr.Type.LITERAL);
                expect(fields[1].getValue().getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(fields[1].getValue().getLiteral().getVUnsignedInt()).to.equal(2);

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getName()).to.equal('field');

                input = '46 NOT IN field.subfield';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('not_cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(46);
                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getTableName()).to.equal('field');
                expect(params[1].getIdentifier().getName()).to.equal('subfield');
                expect(params[1].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);

                input = '42 IN [42,43]';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(42);
                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                values = params[1].getArray().getValueList();
                expect(values).to.have.lengthOf(2);
                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });
                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(42);
                expect(values[1].getLiteral().getVUnsignedInt()).to.equal(43);

                input = 'some_field IN another_field';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getName()).to.equal('some_field');
                expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getName()).to.equal('another_field');
                expect(params[1].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);

                input = 'field IN [44, 45, 46]';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getName()).to.equal('field');
                expect(params[0].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
                expect(params[1].getType()).to.equal(Expr.Type.ARRAY);

                values = params[1].getArray().getValueList();
                values.forEach(value => {
                    expect(value.getType()).to.equal(Expr.Type.LITERAL);
                    expect(value.getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                });
                expect(values[0].getLiteral().getVUnsignedInt()).to.equal(44);
                expect(values[1].getLiteral().getVUnsignedInt()).to.equal(45);
                expect(values[2].getLiteral().getVUnsignedInt()).to.equal(46);

                input = 'jcast(function(42)) in array';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cont_in');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.FUNC_CALL);
                expect(params[0].getFunctionCall().getName().getName()).to.equal('jcast');

                args = params[0].getFunctionCall().getParamList();
                expect(args).to.have.lengthOf(1);
                expect(args[0].getType()).to.equal(Expr.Type.FUNC_CALL);
                expect(args[0].getFunctionCall().getName().getName()).to.equal('function');

                args = args[0].getFunctionCall().getParamList();
                expect(args).to.have.lengthOf(1);
                expect(args[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(args[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(args[0].getLiteral().getVUnsignedInt()).to.equal(42);

                expect(params[1].getType()).to.equal(Expr.Type.IDENT);
                expect(params[1].getIdentifier().getName()).to.equal('array');
                expect(params[1].getIdentifier().getDocumentPathList()).to.have.lengthOf(0);

                input = 'cast(10.2 as SIGNED INTEGER)';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cast');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_DOUBLE);
                expect(params[0].getLiteral().getVDouble()).to.equal(10.2);
                expect(params[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_OCTETS);
                expect(Buffer.from(params[1].getLiteral().getVOctets().getValue()).toString()).to.equal('SIGNED INTEGER');

                input = 'cast(12.3123123123 as UNSIGNED)';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cast');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_DOUBLE);
                expect(params[0].getLiteral().getVDouble()).to.equal(12.3123123123);
                expect(params[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_OCTETS);
                expect(Buffer.from(params[1].getLiteral().getVOctets().getValue()).toString()).to.equal('UNSIGNED');

                input = 'cast(column as CHAR(10))';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cast');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.IDENT);
                expect(params[0].getIdentifier().getName()).to.equal('column');
                expect(params[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_OCTETS);
                expect(Buffer.from(params[1].getLiteral().getVOctets().getValue()).toString()).to.equal('CHAR(10)');

                input = 'cast(10 as BINARY(8))';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cast');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(10);
                expect(params[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_OCTETS);
                expect(Buffer.from(params[1].getLiteral().getVOctets().getValue()).toString()).to.equal('BINARY(8)');

                input = 'cast(123456789 as DECIMAL(2, 4))';
                expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('cast');

                params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(2);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[0].getLiteral().getVUnsignedInt()).to.equal(123456789);
                expect(params[1].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_OCTETS);
                expect(Buffer.from(params[1].getLiteral().getVOctets().getValue()).toString()).to.equal('DECIMAL(2, 4)');
            });
        });

        context('interval expressions', () => {
            it('parses multi-parameter interval expressions', () => {
                // date_add(date_add(date_add('2000-12-31 23:59:59', INTERVAL 30 SECOND), INTERVAL 4 HOUR), INTERVAL 8 DAY)
                const input = "'2000-12-31 23:59:59' + INTERVAL 30 SECOND + INTERVAL 4 HOUR + INTERVAL 8 DAY";
                const expr = Parser.parse(input, options);

                expect(expr.input).to.equal(input);
                expect(expr.output.getType()).to.equal(Expr.Type.OPERATOR);
                expect(expr.output.getOperator().getName()).to.equal('date_add');

                let params = expr.output.getOperator().getParamList();
                expect(params).to.have.lengthOf(3);
                expect(params[0].getType()).to.equal(Expr.Type.OPERATOR);
                expect(params[0].getOperator().getName()).to.equal('date_add');

                params.slice(1, params.length).forEach(param => expect(param.getType()).to.equal(Expr.Type.LITERAL));
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(8);
                expect(params[2].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('DAY');

                params = params[0].getOperator().getParamList();
                expect(params).to.have.lengthOf(3);
                expect(params[0].getType()).to.equal(Expr.Type.OPERATOR);
                expect(params[0].getOperator().getName()).to.equal('date_add');

                params.slice(1, params.length).forEach(param => expect(param.getType()).to.equal(Expr.Type.LITERAL));
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(4);
                expect(params[2].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('HOUR');

                params = params[0].getOperator().getParamList();
                expect(params).to.have.lengthOf(3);
                expect(params[0].getType()).to.equal(Expr.Type.LITERAL);
                expect(params[0].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                expect(Buffer.from(params[0].getLiteral().getVString().getValue()).toString()).to.equal('2000-12-31 23:59:59');

                params.slice(1, params.length).forEach(param => expect(param.getType()).to.equal(Expr.Type.LITERAL));
                expect(params[1].getLiteral().getType()).to.equal(Scalar.Type.V_UINT);
                expect(params[1].getLiteral().getVUnsignedInt()).to.equal(30);
                expect(params[2].getLiteral().getType()).to.equal(Scalar.Type.V_STRING);
                expect(Buffer.from(params[2].getLiteral().getVString().getValue()).toString()).to.equal('SECOND');
            });
        });
    });
});
