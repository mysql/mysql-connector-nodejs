'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const binding = require('lib/DevAPI/Binding');
const expect = require('chai').expect;

describe('DevAPI Binding', () => {
    context('bind()', () => {
        it('should assign a value to parameter when both are provided as arguments', () => {
            const query = binding({ bindings: { foo: 'bar' } }).bind('baz', 'qux');

            expect(query.getBindings()).to.deep.equal({ foo: 'bar', baz: 'qux' });
        });

        it('should merge key-valye object to the current mappings', () => {
            const query = binding({ bindings: { foo: 'bar' } }).bind({ baz: 'qux' });

            expect(query.getBindings()).to.deep.equal({ foo: 'bar', baz: 'qux' });
        });
    });
});
