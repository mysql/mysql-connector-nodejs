/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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

const ExprStub = require('../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
const expect = require('chai').expect;
const mysqlx = require('../../../../');

describe('X DevAPI expression encoder for identifiers', () => {
    it('returns a valid protobuf message for single identifiers', () => {
        const proto = mysqlx.expr('foo');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        const documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(1);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        return expect(documentPath[0].getValue()).to.equal('foo');
    });

    it('returns a valid protobuf message for document paths', () => {
        let proto = mysqlx.expr('foo.bar');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        let documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');

        proto = mysqlx.expr('foo.*');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER_ASTERISK);

        proto = mysqlx.expr('foo**.bar');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr('foo.bar[3]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[2].getIndex()).to.equal(3);

        proto = mysqlx.expr('foo.bar[*]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

        proto = mysqlx.expr('_**._');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('_');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('_');

        proto = mysqlx.expr('_**[*]._');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(4);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('_');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
        expect(documentPath[3].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[3].getValue()).to.equal('_');

        proto = mysqlx.expr('_**[*]._**._');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(6);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('_');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
        expect(documentPath[3].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[3].getValue()).to.equal('_');
        expect(documentPath[4].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[5].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[3].getValue()).to.equal('_');

        proto = mysqlx.expr('$.foo.bar[*]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

        proto = mysqlx.expr('$." ".bar');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal(' ');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');

        proto = mysqlx.expr('$.a[0].b[0]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(4);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[1].getIndex()).to.equal(0);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('b');
        expect(documentPath[3].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[3].getIndex()).to.equal(0);

        proto = mysqlx.expr('$.a[0][0]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[1].getIndex()).to.equal(0);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[2].getIndex()).to.equal(0);

        proto = mysqlx.expr('$.a[*][*]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

        proto = mysqlx.expr('$.a[*].z');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('z');

        proto = mysqlx.expr('$.foo**.bar');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr('$."foo bar"**.baz');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo bar');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('baz');

        proto = mysqlx.expr('$."foo"**."bar"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr('$."foo."**."bar"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo.');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr('$."foo."**.".bar"');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo.');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('.bar');

        proto = mysqlx.expr('$.""');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(1);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('');

        proto = mysqlx.expr('$**.bar');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');

        proto = mysqlx.expr('$**[0]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[1].getIndex()).to.equal(0);

        proto = mysqlx.expr('$.a**[0]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[2].getIndex()).to.equal(0);

        proto = mysqlx.expr('$.a**[*]');
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
    });

    it('returns a valid protobuf message for composed column identifiers', () => {
        const options = { mode: mysqlx.Mode.TABLE };

        let proto = mysqlx.expr('foo', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        let identifier = proto.getIdentifier();
        expect(identifier.getName()).to.equal('foo');
        // eslint-disable-next-line no-unused-expressions
        expect(identifier.getDocumentPathList()).to.be.an('array').and.be.empty;

        proto = mysqlx.expr('foo.bar', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        identifier = proto.getIdentifier();
        expect(identifier.getTableName()).to.equal('foo');
        expect(identifier.getName()).to.equal('bar');
        // eslint-disable-next-line no-unused-expressions
        expect(identifier.getDocumentPathList()).to.be.an('array').and.be.empty;

        proto = mysqlx.expr('foo.bar.baz', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        identifier = proto.getIdentifier();
        expect(identifier.getSchemaName()).to.equal('foo');
        expect(identifier.getTableName()).to.equal('bar');
        expect(identifier.getName()).to.equal('baz');
        // eslint-disable-next-line no-unused-expressions
        expect(identifier.getDocumentPathList()).to.be.an('array').and.be.empty;

        proto = mysqlx.expr("foo.bar.baz->'$.qux'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);

        identifier = proto.getIdentifier();
        expect(identifier.getSchemaName()).to.equal('foo');
        expect(identifier.getTableName()).to.equal('bar');
        expect(identifier.getName()).to.equal('baz');

        let documentPath = identifier.getDocumentPathList();
        expect(documentPath).to.have.lengthOf(1);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('qux');

        proto = mysqlx.expr('`foo.bar`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('foo.bar');

        proto = mysqlx.expr('`foo``bar`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('foo`bar');

        proto = mysqlx.expr('foo.`bar`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo');
        expect(proto.getIdentifier().getName()).to.equal('bar');

        proto = mysqlx.expr('foo.`bar.baz`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo');
        expect(proto.getIdentifier().getName()).to.equal('bar.baz');

        proto = mysqlx.expr('foo.`bar``baz`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo');
        expect(proto.getIdentifier().getName()).to.equal('bar`baz');

        proto = mysqlx.expr('foo.`bar`.`baz`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo');
        expect(proto.getIdentifier().getTableName()).to.equal('bar');
        expect(proto.getIdentifier().getName()).to.equal('baz');

        proto = mysqlx.expr('`foo`.`bar`.`baz`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo');
        expect(proto.getIdentifier().getTableName()).to.equal('bar');
        expect(proto.getIdentifier().getName()).to.equal('baz');

        proto = mysqlx.expr('`foo.bar`.`baz`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo.bar');
        expect(proto.getIdentifier().getName()).to.equal('baz');

        proto = mysqlx.expr('`foo``bar`.`baz`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo`bar');
        expect(proto.getIdentifier().getName()).to.equal('baz');

        proto = mysqlx.expr('`foo.bar`.`baz`.`qux`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo.bar');
        expect(proto.getIdentifier().getTableName()).to.equal('baz');
        expect(proto.getIdentifier().getName()).to.equal('qux');

        proto = mysqlx.expr('`foo``bar`.`baz`.`qux`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo`bar');
        expect(proto.getIdentifier().getTableName()).to.equal('baz');
        expect(proto.getIdentifier().getName()).to.equal('qux');

        proto = mysqlx.expr('`foo`.`bar.baz`.`qux`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo');
        expect(proto.getIdentifier().getTableName()).to.equal('bar.baz');
        expect(proto.getIdentifier().getName()).to.equal('qux');

        proto = mysqlx.expr('`foo`.`bar``baz`.`qux`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo');
        expect(proto.getIdentifier().getTableName()).to.equal('bar`baz');
        expect(proto.getIdentifier().getName()).to.equal('qux');

        proto = mysqlx.expr('`foo`.`bar`.`baz.qux`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo');
        expect(proto.getIdentifier().getTableName()).to.equal('bar');
        expect(proto.getIdentifier().getName()).to.equal('baz.qux');

        proto = mysqlx.expr('`foo`.`bar`.`baz``qux`', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo');
        expect(proto.getIdentifier().getTableName()).to.equal('bar');
        expect(proto.getIdentifier().getName()).to.equal('baz`qux');

        proto = mysqlx.expr("doc->'$.foo.bar[*]'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

        proto = mysqlx.expr('doc->\'$." ".bar\'', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal(' ');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');

        proto = mysqlx.expr("doc->'$.a[0].b[0]'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(4);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[1].getIndex()).to.equal(0);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('b');
        expect(documentPath[3].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[3].getIndex()).to.equal(0);

        proto = mysqlx.expr("doc->'$.a[0][0]'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[1].getIndex()).to.equal(0);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[2].getIndex()).to.equal(0);

        proto = mysqlx.expr("`x`->'$.a[*][*]'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('x');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

        proto = mysqlx.expr("`''`->'$.a[*].z'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal("''");

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('z');

        proto = mysqlx.expr('doc->\'$."foo bar"."baz**"\'', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo bar');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('baz**');

        proto = mysqlx.expr("doc->'$.foo**.bar'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr('doc->\'$."foo bar"**.baz\'', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo bar');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('baz');

        proto = mysqlx.expr('doc->\'$."foo"**."bar"\'', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr('doc->\'$."foo."**."bar"\'', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo.');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr('doc->\'$."foo."**.".bar"\'', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('foo.');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('.bar');

        proto = mysqlx.expr('doc->\'$.""\'', options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(1);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('');

        proto = mysqlx.expr("doc->'$**.bar'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');

        proto = mysqlx.expr("doc->'$**[0]'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[1].getIndex()).to.equal(0);

        proto = mysqlx.expr("doc->'$**.bar'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(2);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[1].getValue()).to.equal('bar');

        proto = mysqlx.expr("foo.doc->'$.a**.bar'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo');
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr("foo.bar.doc->'$.a**[0]'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getSchemaName()).to.equal('foo');
        expect(proto.getIdentifier().getTableName()).to.equal('bar');
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
        expect(documentPath[2].getIndex()).to.equal(0);

        proto = mysqlx.expr("`foo`.doc->'$.a**[*]'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo');
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);

        proto = mysqlx.expr("`foo.bar`.doc->'$.a**.bar'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('foo.bar');
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[2].getValue()).to.equal('bar');

        proto = mysqlx.expr("`->`.doc->'$.a**.foo'", options);
        expect(proto.getType()).to.equal(ExprStub.Expr.Type.IDENT);
        expect(proto.getIdentifier().getTableName()).to.equal('->');
        expect(proto.getIdentifier().getName()).to.equal('doc');

        documentPath = proto.getIdentifier().getDocumentPathList();
        expect(documentPath).to.have.lengthOf(3);
        expect(documentPath[0].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        expect(documentPath[0].getValue()).to.equal('a');
        expect(documentPath[1].getType()).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
        expect(documentPath[2].getType()).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
        return expect(documentPath[2].getValue()).to.equal('foo');
    });
});
