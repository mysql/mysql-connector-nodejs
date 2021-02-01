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

describe('test tools', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('ping()', () => {
        let close, getSession, test;

        beforeEach('create fakes', () => {
            close = td.function();
            getSession = td.function();

            td.replace('../../../index.js', { getSession });
            test = require('../../../lib/tool/test');
        });

        it('does not fail when no servers are provided', () => {
            return test.ping()
                .then(() => expect(td.explain(close).callCount).to.equal(0));
        });

        it('does not fail when a list of empty servers is provided', () => {
            return test.ping([])
                .then(() => expect(td.explain(close).callCount).to.equal(0));
        });

        it('succeeds when it is able to create a session for all the servers', () => {
            const server1 = 'foo';
            const server2 = 'bar';

            td.when(getSession({ host: server1 })).thenResolve({ close });
            td.when(getSession({ host: server2 })).thenResolve({ close });

            return test.ping([server1, server2])
                .then(() => expect(td.explain(close).callCount).to.equal(2));
        });

        it('succeeds when it is able to connect to all the servers whilst some sessions are not created', () => {
            const server1 = 'foo';
            const server2 = 'bar';

            const error = { info: { code: 1 } };

            td.when(getSession({ host: server1 })).thenReject(error);
            td.when(getSession({ host: server2 })).thenResolve();

            return test.ping([server1, server2])
                .then(() => expect(td.explain(close).callCount).to.equal(0));
        });

        it('succeeds without an initial backoff when all servers eventually become available', () => {
            const server1 = 'foo';
            const server2 = 'bar';

            const error = { code: 'ECONNREFUSED' };

            td.when(getSession({ host: server1 })).thenResolve({ close });
            td.when(getSession({ host: server1 }), { times: 1 }).thenReject(error);
            td.when(getSession({ host: server2 })).thenResolve({ close });

            return test.ping([server1, server2])
                .then(() => expect(td.explain(close).callCount).to.equal(2));
        });

        it('succeeds with an initial backoff when all servers eventually become available', function () {
            const server1 = 'foo';
            const server2 = 'bar';
            const waitFor = this.timeout() / 3;

            const error = { code: 'ECONNREFUSED' };

            td.when(getSession({ host: server1 })).thenResolve({ close });
            td.when(getSession({ host: server1 }), { times: 1 }).thenReject(error);
            td.when(getSession({ host: server2 })).thenResolve({ close });

            return test.ping([server1, server2], waitFor)
                .then(() => expect(td.explain(close).callCount).to.equal(2));
        });

        it('fails when there is an unexpected error', () => {
            const server1 = 'foo';
            const server2 = 'bar';

            const error = new Error('foobar');

            td.when(getSession({ host: server1 })).thenReject(error);
            td.when(getSession({ host: server2 })).thenResolve();

            return test.ping([server1, server2])
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });
});
