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

describe('Binding', () => {
    let binding, parse;

    beforeEach('create fakes', () => {
        parse = td.function();

        td.replace('../../../lib/ExprParser', { parse });
        binding = require('../../../lib/DevAPI/Binding');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('bind()', () => {
        it('is fluent', () => {
            const query = binding().bind('foo', 'bar');

            expect(query.bind).to.be.a('function');
        });

        it('does nothing if no argument is provided', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(binding().bind().getPlaceholders_()).to.be.an('array').and.be.empty;
            return expect(binding().bind().getPlaceholderValues_()).to.be.an('array').and.be.empty;
        });

        context('using unordered mapping dictionaries', () => {
            it('replaces duplicates', () => {
                const query = binding().bind({ foo: 'qux' });

                expect(query.getPlaceholders_()).to.deep.equal(['foo']);
                expect(query.getPlaceholderValues_()).to.deep.equal(['qux']);

                query.bind({ foo: 'quux' });

                expect(query.getPlaceholders_()).to.deep.equal(['foo']);
                return expect(query.getPlaceholderValues_()).to.deep.equal(['quux']);
            });
        });

        context('using multiple unordered calls', () => {
            it('replaces duplicates', () => {
                const query = binding().bind('foo', 'qux');

                expect(query.getPlaceholders_()).to.deep.equal(['foo']);
                expect(query.getPlaceholderValues_()).to.deep.equal(['qux']);

                query.bind('foo', 'quux');

                expect(query.getPlaceholders_()).to.deep.equal(['foo']);
                expect(query.getPlaceholderValues_()).to.deep.equal(['quux']);
            });
        });

        it('mixes and match both type of parameters', () => {
            const query = binding().bind('foo', 'qux').bind({ bar: 'quux' });

            expect(query.getPlaceholders_()).to.deep.equal(['foo', 'bar']);
            expect(query.getPlaceholderValues_()).to.deep.equal(['qux', 'quux']);
        });
    });
});
