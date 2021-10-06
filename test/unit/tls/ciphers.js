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
const ciphers = require('../../../lib/tls/ciphers');
const cipherRef = require('../../../lib/tls/OSSA_CRB_TLSCiphersuites.json');

describe('TLS ciphersuite utilities', () => {
    context('overlaps()', () => {
        it('returns the list of overlapping mandatory and approved OpenSSL cipher names for a given list of IANA cipher names', () => {
            const input = [
                'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', // mandatory
                'TLS_AES_128_CCM_SHA256' // approved
            ];

            const expected = [
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'TLS_AES_128_CCM_SHA256'
            ];

            expect(ciphers.overlaps(input)).to.deep.equal(expected);
        });

        it('returns deprecated OpenSSL cipher names that are requested in the provided ciphersuite', () => {
            const input = [
                'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', // mandatory
                'TLS_AES_128_CCM_SHA256', // approved
                'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA' // deprecated
            ];

            const expected = [
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'TLS_AES_128_CCM_SHA256',
                'ECDHE-ECDSA-AES256-SHA'
            ];

            expect(ciphers.overlaps(input)).to.deep.equal(expected);
        });

        it('excludes any provided unacceptable cipher', () => {
            const input = [
                'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', // mandatory
                'TLS_AES_128_CCM_SHA256', // approved
                'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA', // deprecated
                'TLS_ECDHE_ECDSA_WITH_NULL_SHA' // unnaceptable
            ];

            const expected = [
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'TLS_AES_128_CCM_SHA256',
                'ECDHE-ECDSA-AES256-SHA'
            ];

            expect(ciphers.overlaps(input)).to.deep.equal(expected);
        });

        it('returns an empty list when no cipher is provided', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(ciphers.overlaps()).to.be.an('array').and.be.empty;
        });
    });

    context('defaults()', () => {
        it('returns the list containing the mandatory, approved and deprecated compatibility OpenSSL cipher names', () => {
            const totalSize = cipherRef.mandatory_tls_ciphersuites.length +
                cipherRef.approved_tls_ciphersuites.length;

            expect(ciphers.defaults()).to.have.lengthOf(totalSize);
        });
    });
});
