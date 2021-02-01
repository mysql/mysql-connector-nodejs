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
const config = require('../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../');
const pkg = require('../../../package.json');

describe('client API entrypoint', () => {
    const baseConfig = { schema: undefined };

    context('expr()', () => {
        it('parses a string into a document-mode expression by default', () => {
            const expression = mysqlx.expr('foo');
            const typed = new Expr(expression.toArray());

            // string describes an identifier document path
            expect(typed.getType()).to.equal(1);
            const documentPath = typed.getIdentifier().getDocumentPathList();
            expect(documentPath[0].getType(1)).to.equal(1);
            expect(documentPath[0].getValue()).to.equal('foo');
        });

        it('parses a string into a table-mode expression if explicitely requested', () => {
            const expression = mysqlx.expr('foo', { mode: mysqlx.Mode.TABLE });
            const typed = new Expr(expression.toArray());

            // string describes an identifier name
            expect(typed.getType()).to.equal(1);
            expect(typed.getIdentifier().getDocumentPathList()).to.have.lengthOf(0);
            expect(typed.getIdentifier().getName()).to.equal('foo');
        });
    });

    context('getSession()', () => {
        context('when the connection definition is not valid', () => {
            it('fails using something other then an object or string', () => {
                return mysqlx.getSession(false)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('fails using a null configuration object', () => {
                return mysqlx.getSession(null)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('fails using an empty string', () => {
                return mysqlx.getSession('')
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });

            it('fails using an invalid URI or JSON string', () => {
                return mysqlx.getSession('foo')
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.not.equal('expect.fail()'));
            });
        });

        context('when the port is out of bounds', () => {
            it('fails using a configuration object', () => {
                const failureConfig = Object.assign({}, config, baseConfig, { port: -1 });

                return mysqlx.getSession(failureConfig)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Port must be between 0 and 65536'));
            });

            it('fails using a URI', () => {
                const failureConfig = Object.assign({}, config, baseConfig, { port: 65537 });
                const uri = `${failureConfig.user}:${failureConfig.password}@${failureConfig.host}:${failureConfig.port}`;

                return mysqlx.getSession(uri)
                    .then(() => expect.fail())
                    .catch(err => expect(err.message).to.equal('Port must be between 0 and 65536'));
            });
        });
    });

    context('getVersion()', () => {
        it('returns the client version', () => {
            expect(mysqlx.getVersion()).to.equal(pkg.version);
        });
    });
});
