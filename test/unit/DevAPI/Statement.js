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
const statement = require('../../../lib/DevAPI/Statement');

describe('Statement', () => {
    context('addArgs()', () => {
        context('when the statement is not frozen', () => {
            it('appends a single value to the list of placeholder assignments', () => {
                expect(statement().addArgs('foo').getArgs()).to.deep.equal(['foo']);
                expect(statement().addArgs('foo').addArgs('bar').getArgs()).to.deep.equal(['foo', 'bar']);
            });

            it('appends an array of values to the list of placeholder assignments', () => {
                expect(statement().addArgs(['foo', 'bar']).getArgs()).to.deep.equal(['foo', 'bar']);
                expect(statement().addArgs(['foo']).addArgs(['bar', 'baz']).getArgs()).to.deep.equal(['foo', 'bar', 'baz']);
            });
        });

        context('when the statement is not frozen', () => {
            it('replaces the list of placeholder assignments with a given value', () => {
                expect(statement().freeze().addArgs('foo').getArgs()).to.deep.equal(['foo']);
                expect(statement().addArgs('foo').freeze().addArgs('bar').getArgs()).to.deep.equal(['bar']);
            });

            it('replaces the list of placeholder assignments with a given list of values', () => {
                expect(statement().freeze().addArgs(['foo', 'bar']).getArgs()).to.deep.equal(['foo', 'bar']);
                expect(statement().addArgs(['foo']).freeze().addArgs(['bar', 'baz']).getArgs()).to.deep.equal(['bar', 'baz']);
            });
        });
    });
});
