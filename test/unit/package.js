/*
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let pkg = require('../../lib/package');

describe('package details', () => {
    const details = { version: 'foo', license: 'bar' };

    beforeEach('create fakes', () => {
        td.replace('../../package.json', details);
        pkg = require('../../lib/package');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('name()', () => {
        it('returns the official "slugified" package name', () => {
            expect(pkg.name()).to.equal('mysql-connector-nodejs');
        });
    });

    context('version()', () => {
        it('returns the npm package version', () => {
            expect(pkg.version()).to.equal(details.version);
        });
    });

    context('license()', () => {
        it('returns the npm package license name', () => {
            expect(pkg.license()).to.equal(details.license);
        });
    });
});
