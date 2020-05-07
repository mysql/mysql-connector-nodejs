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
