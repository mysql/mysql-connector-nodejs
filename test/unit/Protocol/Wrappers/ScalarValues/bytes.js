/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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
let bytes = require('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');

describe('Protobuf bytes wrapper', () => {
    context('class methods', () => {
        context('create()', () => {
            it('creates a wrapper with a typed array of raw network data using shared memory', () => {
                const input = Buffer.from('foo');
                const output = bytes.create(input).valueOf();

                // strict equality to ensure it references the same memory
                expect(output.buffer).to.equal(input.buffer);
            });

            it('creates a wrapper with an empty typed array if the data is not valid', () => {
                const empty = new Uint8Array();

                expect(bytes.create().valueOf()).to.deep.equal(empty);
                expect(bytes.create(null).valueOf()).to.deep.equal(empty);
                expect(bytes.create('foo').valueOf()).to.deep.equal(empty);
            });
        });

        context('deserialize()', () => {
            it('converts binary networ raw data (Node.js Buffer) into binary protobuf raw data (JavaScript Uint8Array)', () => {
                const input = Buffer.from('foo');
                const output = bytes.deserialize(input);

                // strict equality to ensure it references the same memory
                expect(output.buffer).to.equal(input.buffer);
            });
        });
    });

    context('instance methods', () => {
        let wraps;

        beforeEach('create fakes', () => {
            wraps = td.replace('../../../../../lib/Protocol/Wrappers/Traits/Wraps');
            bytes = require('../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('toBuffer()', () => {
            it('converts the underlying typed array into a Node.js Buffer instance using shared memory', () => {
                const input = Uint8Array.from(Buffer.from('foo'));
                const output = bytes(input).toBuffer();

                // strict equality to ensure it references the same memory
                expect(input.buffer).to.equal(output.buffer);
            });

            it('returns an empty Node.js Buffer instance if the underlying typed array is not valid', () => {
                const empty = Buffer.alloc(0);

                expect(bytes().toBuffer()).to.deep.equal(empty);
                expect(bytes(null).toBuffer()).to.deep.equal(empty);
                expect(bytes('foo').toBuffer()).to.deep.equal(empty);
            });
        });

        context('toJSON()', () => {
            it('returns an object that can be directly serialized to JSON', () => {
                const input = Uint8Array.from(Buffer.from('foo'));
                const output = bytes(input).toJSON();

                expect(output).to.deep.equal({ type: 'Buffer', data: Array.from(input) });
            });
        });

        context('toString()', () => {
            it('converts the underlying typed array data into a string with a given encoding', () => {
                const input = 'foo';
                const wrapper = bytes(Uint8Array.from(Buffer.from(input)));

                expect(wrapper.toString()).to.equal(input);
                expect(wrapper.toString('base64')).to.equal((Buffer.from(input)).toString('base64'));
            });
        });

        context('valueOf()', () => {
            it('returns the underlying typed array', () => {
                const typedArray = new Uint8Array();
                const valueOf = td.function();

                td.when(valueOf()).thenReturn('foo');
                td.when(wraps(typedArray)).thenReturn({ valueOf });

                expect(bytes(typedArray).valueOf()).to.equal('foo');
            });
        });
    });
});
