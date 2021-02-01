/*
 * Copyright (c) 2018, 2021, Oracle and/or its affiliates.
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
const grouping = require('../../../lib/DevAPI/Grouping');
const td = require('testdouble');

describe('Grouping', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('groupBy()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = grouping({ preparable: { forceRestart } });

            statement.groupBy('foo');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });
    });

    context('hasBaseGroupingCriteria()', () => {
        it('returns true if the expression criteria does not need to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(grouping({ criteria: true }).hasBaseGroupingCriteria()).to.be.true;
            expect(grouping({ criteria: '' }).hasBaseGroupingCriteria()).to.be.true;
            expect(grouping({ criteria: 'true' }).hasBaseGroupingCriteria()).to.be.true;
            /* eslint-enable no-unused-expressions */
            return expect(grouping({ criteria: 'TRUE' }).hasBaseGroupingCriteria()).to.be.true;
        });

        it('returns false if the expression criteria needs to be parsed', () => {
            /* eslint-disable no-unused-expressions */
            expect(grouping({ criteria: 'foo' }).hasBaseGroupingCriteria()).to.be.false;
            expect(grouping({ criteria: 'false' }).hasBaseGroupingCriteria()).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(grouping({ criteria: 'FALSE' }).hasBaseGroupingCriteria()).to.be.false;
        });

        it('does not fail if the criteria is invalid', () => {
            /* eslint-disable no-unused-expressions */
            expect(() => grouping({ criteria: undefined }).hasBaseGroupingCriteria()).to.not.throw;
            expect(() => grouping({ criteria: false }).hasBaseGroupingCriteria()).to.not.throw;
            expect(() => grouping({ criteria: 1.23 }).hasBaseGroupingCriteria()).to.not.throw;
            /* eslint-enable no-unused-expressions */
            return expect(() => grouping({ criteria: [1, 2, 3] }).hasBaseGroupingCriteria()).to.not.throw;
        });
    });

    context('having()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = grouping({ preparable: { forceRestart } });

            statement.having('foo');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });
    });
});
