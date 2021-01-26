/*
 * Copyright (c) 2018, 2021, Oracle and/or its affiliates.
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
const client = require('../../../lib/DevAPI/Client');
const td = require('testdouble');

describe('DevAPI Client', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('factory', () => {
        it('throws an error when unknown options are provided', () => {
            expect(() => client({ foo: 'bar' })).to.throw('Client option \'foo\' is not recognized as valid.');
        });

        it('throws an error when invalid option values are provided', () => {
            const nonObjects = [undefined, true, false, 1, 2.2, 'foo', [], () => {}];

            nonObjects.forEach(invalid => {
                expect(() => client({ pooling: invalid })).to.throw(`Client option 'pooling' does not support value '${invalid}'.`);
            });
        });
    });

    context('getSession()', () => {
        let acquire, destroy, start;

        beforeEach('create fakes', () => {
            acquire = td.function();
            destroy = td.function();
            start = td.function();
        });

        it('retrieves a connection from the pool', () => {
            const options = { pool: { acquire, start }, uri: { name: 'foo' } };
            const cli = client(options);

            td.when(start(options.uri)).thenReturn();
            td.when(acquire()).thenResolve('bar');

            return cli.getSession()
                .then(actual => {
                    expect(actual).to.equal('bar');
                    expect(td.explain(start).callCount).to.equal(1);
                    expect(td.explain(start).calls[0].args).to.deep.equal([options.uri]);
                });
        });

        it('fails if the pool has been destroyed', () => {
            const pool = { destroy };
            const cli = client({ pool });
            const error = 'Cannot retrieve a connection from the pool. Maybe it has been destroyed already.';

            td.when(destroy()).thenResolve();

            return cli.close()
                .then(() => cli.getSession())
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.deep.equal(error));
        });
    });

    context('close()', () => {
        let destroy;

        beforeEach('create fakes', () => {
            destroy = td.function();
        });

        it('destroys the existing pool reference', () => {
            const pool = { destroy };
            const cli = client({ pool });

            td.when(destroy()).thenResolve();

            return cli.close()
                .then(() => expect(td.explain(destroy).callCount).to.equal(1));
        });

        it('fails if the pool has been destroyed', () => {
            const pool = { destroy };
            const cli = client({ pool });
            const error = 'Cannot close the pool. Maybe it has been destroyed already.';

            td.when(destroy()).thenResolve();

            return cli.close()
                .then(() => cli.close())
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.deep.equal(error));
        });
    });
});
