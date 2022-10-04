/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const skipping = require('../../../lib/DevAPI/Skipping');
const td = require('testdouble');

describe('Skipping', () => {
    context('offset()', () => {
        it('sets the offset value', () => {
            expect(skipping().offset(10).getOffset_()).to.equal(10);
        });

        it('forces an associated statement to be re-prepared the first time its called', () => {
            const forceReprepare = td.function();
            const query = skipping({ preparable: { forceReprepare } }).offset(1);

            expect(td.explain(forceReprepare).callCount).to.equal(1);

            query.offset(2);

            expect(td.explain(forceReprepare).callCount).to.equal(1);
        });

        it('throws an error if the value is not valid', () => {
            return expect(() => skipping().offset(-10)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_OFFSET_INPUT);
        });
    });

    context('limit()', () => {
        it('sets a default `offset` value if one argument is provided', () => {
            expect(skipping().limit(10).getOffset_()).to.equal(0);
        });

        // deprecated
        it('sets limit `row_count` and `offset` properties', () => {
            const query = skipping().limit(10, 10);

            expect(query.getCount_()).to.equal(10);
            expect(query.getOffset_()).to.equal(10);
        });

        it('re-uses a previous offset when setting a new limit', () => {
            const query = skipping({ count: 1, offset: 1 }).limit(2);

            expect(query.getCount_()).to.equal(2);
            expect(query.getOffset_()).to.equal(1);
        });

        it('throws an error if the limit offset is not valid', () => {
            return expect(() => skipping().limit(10, -10)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_OFFSET_INPUT);
        });
    });
});
