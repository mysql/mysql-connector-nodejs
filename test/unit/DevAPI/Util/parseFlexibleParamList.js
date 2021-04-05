/*
 * Copyright (c) 2016, 2021, Oracle and/or its affiliates.
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

const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const parseFlexibleParamList = require('../../../../lib/DevAPI/Util/parseFlexibleParamList');

describe('parseFlexibleParamList', () => {
    it('mirrors an expression array', () => {
        expect(parseFlexibleParamList(['foo', 42])).to.deep.equal(['foo', 42]);
    });

    it('returns an empty list if no argumentd are provided', () => {
        return expect(parseFlexibleParamList()).to.be.an('array').and.be.empty;
    });

    it('flattens an array of expression arrays', () => {
        expect(parseFlexibleParamList([['foo', 'bar'], [42, 'qux']])).to.deep.equal(['foo', 'bar', 42, 'qux']);
    });

    it('throws an error if an expression is not valid', () => {
        expect(function () { parseFlexibleParamList([() => {}]); }).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_FLEXIBLE_PARAMETER_EXPRESSION);
    });

    it('allows falsy values', () => {
        expect(parseFlexibleParamList([0, false, null, undefined])).to.deep.equal([0, false, null, undefined]);
    });
});
