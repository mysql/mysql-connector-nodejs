'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('srv', () => {
    let srv, resolveSrv;

    beforeEach('create fakes', () => {
        resolveSrv = td.function();

        td.replace('../../../../lib/Adapters/dns', { resolveSrv });
        srv = require('../../../../lib/DevAPI/Util/srv');
    });

    context('getSortedAddressList()', () => {
        it('sorts by ascending priority', () => {
            const addresses = [{
                name: 'foo',
                priority: 2
            }, {
                name: 'bar',
                priority: 0
            }, {
                name: 'baz',
                priority: 1
            }, {
                name: 'qux',
                priority: 3
            }];

            td.when(resolveSrv('foobar')).thenResolve(addresses);

            return srv.getSortedAddressList('foobar')
                .then(result => {
                    expect(result).to.have.a.lengthOf(4);
                    expect(result[0].name).to.equal('bar');
                    expect(result[1].name).to.equal('baz');
                    expect(result[2].name).to.equal('foo');
                    expect(result[3].name).to.equal('qux');
                });
        });

        it('sorts by descending weight when the priority is the same', () => {
            const addresses = [{
                name: 'foo',
                priority: 0,
                weight: 5
            }, {
                name: 'bar',
                priority: 0,
                weight: 10
            }, {
                name: 'baz',
                priority: 1,
                weight: 15
            }, {
                name: 'qux',
                priority: 1,
                weight: 20
            }];

            td.when(resolveSrv('foobar')).thenResolve(addresses);

            return srv.getSortedAddressList('foobar')
                .then(result => {
                    expect(result).to.have.a.lengthOf(4);
                    expect(result[0].name).to.equal('bar');
                    expect(result[1].name).to.equal('foo');
                    expect(result[2].name).to.equal('qux');
                    expect(result[3].name).to.equal('baz');
                });
        });

        it('uses FIFO when both priority and weights are the same', () => {
            const addresses = [{
                name: 'foo',
                priority: 0,
                weight: 10
            }, {
                name: 'bar',
                priority: 0,
                weight: 10
            }, {
                name: 'baz',
                priority: 0,
                weight: 10
            }, {
                name: 'qux',
                priority: 0,
                weight: 10
            }];

            td.when(resolveSrv('foobar')).thenResolve(addresses);

            return srv.getSortedAddressList('foobar')
                .then(result => {
                    expect(result).to.have.a.lengthOf(4);
                    expect(result[0].name).to.equal('foo');
                    expect(result[1].name).to.equal('bar');
                    expect(result[2].name).to.equal('baz');
                    expect(result[3].name).to.equal('qux');
                });
        });
    });
});
