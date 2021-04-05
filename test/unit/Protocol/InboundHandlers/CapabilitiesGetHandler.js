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
let CapabilitiesGetHandler = require('../../../../lib/Protocol/InboundHandlers/CapabilitiesGetHandler');

describe('CapabilitiesGetHandler inbound handler', () => {
    let capabilities, info, logger;

    beforeEach('create fakes', () => {
        info = td.function();

        capabilities = td.replace('../../../../lib/Protocol/Wrappers/Messages/Connection/Capabilities');
        logger = td.replace('../../../../lib/logger');

        td.when(logger('protocol:inbound:Mysqlx.Connection')).thenReturn({ info });

        CapabilitiesGetHandler = require('../../../../lib/Protocol/InboundHandlers/CapabilitiesGetHandler');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('when a Mysqlx.Connection.Capabilities message is received', () => {
        it('finishes the associated job in the queue', () => {
            const handler = new CapabilitiesGetHandler();
            handler._resolve = () => {};

            const queueDone = td.function();
            const caps = { toObject: td.function() };

            td.when(capabilities.deserialize(), { ignoreExtraArgs: true }).thenReturn(caps);

            handler[capabilities.MESSAGE_ID]('foo', queueDone);

            expect(td.explain(queueDone).callCount).to.equal(1);
            return expect(td.explain(queueDone).calls[0].args).to.be.an('array').and.be.empty;
        });

        it('invokes the finishing handler', () => {
            const handler = new CapabilitiesGetHandler();
            handler._resolve = td.function();

            const caps = { toObject: td.function() };

            td.when(capabilities.deserialize(), { ignoreExtraArgs: true }).thenReturn(caps);
            td.when(caps.toObject()).thenReturn('bar');

            handler[capabilities.MESSAGE_ID]('foo', () => {});

            expect(td.explain(handler._resolve).callCount).to.equal(1);
            expect(td.explain(handler._resolve).calls[0].args[0]).to.equal('bar');
        });

        it('logs the protocol message', () => {
            const handler = new CapabilitiesGetHandler();
            handler._resolve = td.function();

            const caps = { toObject: td.function() };

            td.when(capabilities.deserialize('foo')).thenReturn(caps);

            handler[capabilities.MESSAGE_ID]('foo', () => {});

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Capabilities');
            expect(td.explain(info).calls[0].args[1]).to.equal(caps);
        });
    });
});
