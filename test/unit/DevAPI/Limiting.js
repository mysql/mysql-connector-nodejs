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

const expect = require('chai').expect;
const limiting = require('../../../lib/DevAPI/Limiting');
const td = require('testdouble');

describe('Limiting', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('limit()', () => {
        it('does not have default thresholds', () => {
            return expect(limiting().getCount()).to.not.exist;
        });

        it('sets limit `row_count` if one argument is provided', () => {
            return expect(limiting().limit(10).getCount()).to.equal(10);
        });

        it('forces an associated statement to be re-prepared the first time its called', () => {
            const forceReprepare = td.function();
            const query = limiting({ preparable: { forceReprepare } }).limit(1);

            expect(td.explain(forceReprepare).callCount).to.equal(1);

            query.limit(2);

            return expect(td.explain(forceReprepare).callCount).to.equal(1);
        });

        it('throws an error if the limit count is not valid', () => {
            expect(() => limiting().limit(-10)).to.throw('The count value must be a non-negative integer.');
        });

        context('when there is support for an offset', () => {
            it('forces a default value for the offset to streamline prepared statement support', () => {
                const query = limiting();
                query.offset = td.function();

                query.limit(2);

                expect(td.explain(query.offset).callCount).to.equal(1);
                return expect(td.explain(query.offset).calls[0].args[0]).to.equal(0);
            });

            // deprecated
            it('sets any provided value for the offset', () => {
                const query = limiting();
                query.offset = td.function();

                query.limit(2, 3);

                expect(td.explain(query.offset).callCount).to.equal(1);
                return expect(td.explain(query.offset).calls[0].args[0]).to.equal(3);
            });
        });
    });
});
