/*
 * Copyright (c) 2017, 2022, Oracle and/or its affiliates.
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
const td = require('testdouble');
const warnings = require('../../../lib/constants/warnings');

// subject under test needs to be reloaded with replacement fakes
let limiting = require('../../../lib/DevAPI/Limiting');

describe('Limiting', () => {
    let warning;

    beforeEach('create fakes', () => {
        const logger = td.replace('../../../lib/logger');

        warning = td.function();
        td.when(logger('api')).thenReturn({ warning });

        limiting = require('../../../lib/DevAPI/Limiting');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('limit()', () => {
        it('does not have default thresholds', () => {
            return expect(limiting().getCount_()).to.not.exist;
        });

        it('sets limit `row_count` if one argument is provided', () => {
            return expect(limiting().limit(10).getCount_()).to.equal(10);
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
                const statement = limiting();
                statement.offset = td.function();

                statement.limit(2);

                expect(td.explain(statement.offset).callCount).to.equal(1);
                return expect(td.explain(statement.offset).calls[0].args[0]).to.equal(0);
            });

            it('sets any provided value for the offset', () => {
                const statement = limiting();
                statement.offset = td.function();

                statement.limit(2, 3);

                expect(td.explain(statement.offset).callCount).to.equal(1);
                return expect(td.explain(statement.offset).calls[0].args[0]).to.equal(3);
            });

            it('generates a deprecation warning', () => {
                const statement = limiting();
                statement.offset = td.function();

                statement.limit(2, 3);

                expect(td.explain(warning).callCount).to.equal(1);
                return expect(td.explain(warning).calls[0].args).to.deep.equal(['limit', warnings.MESSAGES.WARN_DEPRECATED_LIMIT_WITH_OFFSET, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
            });
        });
    });
});
