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

let logger = require('../../../lib/tool/log');

describe('log tools', () => {
    let util;

    beforeEach('create fakes', () => {
        util = td.replace('util');
        logger = require('../../../lib/tool/log');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('info()', () => {
        context('when debug mode is disabled', () => {
            it('does not log any message to the system via util.debuglog', () => {
                const log = logger('foo');
                const work = td.function();

                log.info('bar', work);

                expect(td.explain(work).callCount).to.equal(0);
                expect(td.explain(util.debuglog).callCount).to.equal(0);
            });
        });

        context('when debug mode is enabled', () => {
            beforeEach('enable debug mode', () => {
                process.env.NODE_DEBUG = true;
            });

            afterEach('disable debug mode', () => {
                process.env.NODE_DEBUG = undefined;
            });

            it('deffers logging a message to the system via util.debuglog', () => {
                const log = logger('foo');
                const debug = td.function();

                td.when(debug('"baz"')).thenReturn('qux');
                td.when(util.debuglog('foo.bar')).thenReturn(debug);

                expect(log.info('bar', 'baz')).to.equal('qux');
            });
        });
    });
});
