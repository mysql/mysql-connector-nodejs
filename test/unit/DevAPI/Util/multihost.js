'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const multihost = require('../../../../lib/DevAPI/Util/multihost');

describe('multihost', () => {
    context('getSortedAddressList()', () => {
        it('sorts by ascending priority', () => {
            const endpoints = [{
                host: 'foo',
                priority: 90
            }, {
                host: 'bar',
                priority: 80
            }, {
                host: 'baz',
                priority: 100
            }];

            const expected = [{
                host: 'baz',
                priority: 100
            }, {
                host: 'foo',
                priority: 90
            }, {
                host: 'bar',
                priority: 80
            }];

            expect(multihost.getSortedAddressList(endpoints)).to.deep.equal(expected);
        });

        it('favours addresses with priority', () => {
            const endpoints = [{
                host: 'foo'
            }, {
                host: 'bar',
                priority: 90
            }, {
                host: 'baz',
                priority: 100
            }];

            const expected = [{
                host: 'baz',
                priority: 100
            }, {
                host: 'bar',
                priority: 90
            }, {
                host: 'foo'
            }];

            expect(multihost.getSortedAddressList(endpoints)).to.deep.equal(expected);
        });

        it('randomly sorts addresses with the same priority', () => {
            const endpoints = [{
                host: 'foo'
            }, {
                host: 'bar',
                priority: 100
            }, {
                host: 'baz'
            }];

            const sortedList = multihost.getSortedAddressList(endpoints);

            expect(sortedList[0]).to.deep.equal(endpoints[1]);
            expect(sortedList.slice(1)).to.deep.include.all.members([{ host: 'foo' }, { host: 'baz' }]);
        });
    });
});
