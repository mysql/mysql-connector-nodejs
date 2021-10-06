/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
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

// subject under test needs to be reloaded with replacement fakes
let versions = require('../../../lib/tls/versions');

describe('TLS version utilities', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('allowed()', () => {
        it('returns the list of TLS versions that are allowed by the client', () => {
            return expect(versions.allowed()).to.deep.equal(['TLSv1.2', 'TLSv1.3']);
        });
    });

    context('latest()', () => {
        it('returns the latest TLS version supported by the Node.js engine when it is available', () => {
            const maxVersion = 'foo';

            td.replace('tls', { DEFAULT_MAX_VERSION: maxVersion });

            versions = require('../../../lib/tls/versions');

            return expect(versions.latest()).to.equal('foo');
        });

        it('returns TLSv1.2 when the latest TLS version supported by the Node.js engine is not available', () => {
            td.replace('tls', { DEFAULT_MAX_VERSION: undefined });

            versions = require('../../../lib/tls/versions');

            return expect(versions.latest()).to.equal('TLSv1.2');
        });
    });

    context('supported()', () => {
        it('returns the list of TLS versions that are supported by the Node.js engine', () => {
            const allowed = td.replace(versions, 'allowed');
            const latest = td.replace(versions, 'latest');

            td.when(allowed()).thenReturn(['foo', 'bar', 'baz']);
            td.when(latest()).thenReturn('baz');

            expect(versions.supported()).to.deep.equal(['foo', 'bar', 'baz']);

            td.when(allowed()).thenReturn(['foo', 'bar', 'baz']);
            td.when(latest()).thenReturn('bar');

            expect(versions.supported()).to.deep.equal(['foo', 'bar']);

            td.when(allowed()).thenReturn(['foo', 'bar', 'baz']);
            td.when(latest()).thenReturn('foo');

            expect(versions.supported()).to.deep.equal(['foo']);
        });
    });

    context('unsupported()', () => {
        it('returns the list of valid TLS versions that are not supported', () => {
            return expect(versions.unsupported()).to.deep.equal(['TLSv1', 'TLSv1.1']);
        });
    });
});
