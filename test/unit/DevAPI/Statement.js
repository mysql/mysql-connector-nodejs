'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const expect = require('chai').expect;
const statement = require('lib/DevAPI/Statement');

describe('Statement', () => {
    context('addArgs()', () => {
        it('should append a single value to the list of placeholder assignments', () => {
            expect(statement().addArgs('foo').getArgs()).to.deep.equal(['foo']);
        });

        it('should append an array of values to the list of placeholder assignments', () => {
            expect(statement().addArgs(['foo', 'bar']).getArgs()).to.deep.equal(['foo', 'bar']);
        });
    });
});
