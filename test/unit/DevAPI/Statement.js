'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const statement = require('../../../lib/DevAPI/Statement');

describe('Statement', () => {
    context('addArgs()', () => {
        it('appends a single value to the list of placeholder assignments', () => {
            expect(statement().addArgs('foo').getArgs()).to.deep.equal(['foo']);
        });

        it('appends an array of values to the list of placeholder assignments', () => {
            expect(statement().addArgs(['foo', 'bar']).getArgs()).to.deep.equal(['foo', 'bar']);
        });
    });
});
