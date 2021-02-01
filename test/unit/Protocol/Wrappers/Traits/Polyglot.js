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

const CrudStub = require('../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
const expect = require('chai').expect;
const polyglot = require('../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
const td = require('testdouble');

describe('Polyglot trait', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getDataModel()', () => {
        it('returns the data model name of a valid protobuf stub instance', () => {
            const proto = new CrudStub.Find();
            proto.setDataModel(CrudStub.DataModel.DOCUMENT);
            expect(polyglot(proto).getDataModel()).to.equal('DOCUMENT');

            proto.setDataModel(CrudStub.DataModel.TABLE);
            expect(polyglot(proto).getDataModel()).to.equal('TABLE');
        });

        it('returns undefined if the data model is not available', () => {
            const getDataModel = td.function();
            const proto = { getDataModel };

            td.when(getDataModel()).thenReturn(CrudStub.DataModel[CrudStub.DataModel.length - 1] + 1);
            // eslint-disable-next-line no-unused-expressions
            expect(polyglot(proto).getDataModel()).to.not.exist;

            td.when(getDataModel()).thenReturn();
            return expect(polyglot(proto).getDataModel()).to.not.exist;
        });
    });
});
