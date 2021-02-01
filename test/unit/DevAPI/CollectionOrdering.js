/*
 * Copyright (c) 2019, 2021, Oracle and/or its affiliates.
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

const collectionOrdering = require('../../../lib/DevAPI/CollectionOrdering');
const expect = require('chai').expect;
const td = require('testdouble');

describe('CollectionOrdering', () => {
    context('sort()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('forces an associated statement to be re-prepared', () => {
            const statement = collectionOrdering({ preparable: { forceRestart } });

            statement.sort();

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('accepts multiple values as arguments', () => {
            const statement = collectionOrdering({ preparable: { forceRestart } });
            statement.setOrderings = td.function();

            statement.sort('foo', 'bar');

            expect(td.explain(statement.setOrderings).callCount).to.equal(1);
            return expect(td.explain(statement.setOrderings).calls[0].args[0]).to.deep.equal(['foo', 'bar']);
        });

        it('accepts a single array of values as argument', () => {
            const statement = collectionOrdering({ preparable: { forceRestart } });
            statement.setOrderings = td.function();

            statement.sort(['foo', 'bar']);

            expect(td.explain(statement.setOrderings).callCount).to.equal(1);
            return expect(td.explain(statement.setOrderings).calls[0].args[0]).to.deep.equal(['foo', 'bar']);
        });
    });
});
