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

const ContentType = require('../../../../../../lib/Protocol/Stubs/mysqlx_resultset_pb').ContentType_BYTES;
const OctetsStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar.Octets;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let octets = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Octets');

describe('Mysqlx.Datatypes.Scalar.Octets wrapper', () => {
    let bytes;

    beforeEach('create fakes', () => {
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        octets = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Octets');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getContentType()', () => {
        it('returns the name of the data Content-Type', () => {
            const proto = new OctetsStub();
            proto.setValue('foo');
            proto.setContentType(ContentType.JSON);

            expect(octets(proto).getContentType()).to.equal('JSON');
        });

        it('returns undefined if the Content-Type is not available', () => {
            return expect(octets(new OctetsStub()).getContentType()).to.not.exist;
        });
    });

    context('toBuffer()', () => {
        it('returns the output of the bytes wrapper toBuffer() method', () => {
            const toBuffer = td.function();
            const proto = new OctetsStub();
            proto.setValue('foo');

            td.when(toBuffer()).thenReturn('bar');
            td.when(bytes('foo')).thenReturn({ toBuffer });

            expect(octets(proto).toBuffer()).to.equal('bar');
        });
    });

    context('toJSON()', () => {
        let getContentType;

        context('when the Content-Type is available', () => {
            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.Octets stub instance', () => {
                const toJSON = td.function();
                const proto = new OctetsStub();
                proto.setValue('foo');

                const wrapper = octets(proto);
                getContentType = td.replace(wrapper, 'getContentType');

                td.when(getContentType()).thenReturn('bar');
                td.when(toJSON()).thenReturn('baz');
                td.when(bytes('foo')).thenReturn({ toJSON });

                expect(wrapper.toJSON()).to.deep.equal({ content_type: 'bar', value: 'baz' });
            });
        });

        context('when the Content-Type is not available', () => {
            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.Octets stub instance', () => {
                const toJSON = td.function();
                const proto = new OctetsStub();
                proto.setValue('foo');

                const wrapper = octets(proto);
                getContentType = td.replace(wrapper, 'getContentType');

                td.when(getContentType()).thenReturn();
                td.when(toJSON()).thenReturn('bar');
                td.when(bytes(), { ignoreExtraArgs: true }).thenReturn({ toJSON });

                expect(wrapper.toJSON()).to.deep.equal({ content_type: undefined, value: 'bar' });
            });
        });
    });
});
