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
