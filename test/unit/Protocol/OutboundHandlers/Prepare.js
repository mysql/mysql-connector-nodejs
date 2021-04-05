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
let prepareHandler = require('../../../../lib/Protocol/OutboundHandlers/Prepare');

describe('Mysqlx.Prepare outbound handler', () => {
    let deallocate, execute, info, logger, prepare;

    beforeEach('create fakes', () => {
        deallocate = td.replace('../../../../lib/Protocol/Wrappers/Messages/Prepare/Deallocate');
        execute = td.replace('../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
        prepare = td.replace('../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
        logger = td.replace('../../../../lib/logger');

        info = td.function();
        td.when(logger('protocol:outbound:Mysqlx.Prepare')).thenReturn({ info });

        prepareHandler = require('../../../../lib/Protocol/OutboundHandlers/Prepare');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('serializes and logs Mysqlx.Prepare.Deallocate messages', () => {
        const message = { serialize: td.function() };

        td.when(deallocate.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(prepareHandler.encodeDeallocate('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Deallocate');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Prepare.Execute messages', () => {
        const message = { serialize: td.function() };

        td.when(execute.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(prepareHandler.encodeExecute('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Execute');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Prepare.Prepare messages', () => {
        const message = { serialize: td.function() };

        td.when(prepare.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(prepareHandler.encodePrepare('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Prepare');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });
});
