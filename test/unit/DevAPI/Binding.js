'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const td = require('testdouble');

describe('DevAPI Binding', () => {
    let binding, parse;

    beforeEach('create fakes', () => {
        parse = td.function();
        binding = proxyquire('lib/DevAPI/Binding', { '../ExprParser': { parse } });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('bind()', () => {
        it('should be fluent', () => {
            const query = binding().bind('foo', 'bar');

            expect(query.bind).to.be.a('function');
        });

        it('should do nothing if no argument is provided', () => {
            expect(binding().bind().getBindings()).to.deep.equal({});
        });

        context('using unordered mapping dictionaries', () => {
            it('should replace duplicates', () => {
                const query = binding().bind({ foo: 'qux' });

                expect(query.getBindings()).to.deep.equal({ foo: 'qux' });

                query.bind({ foo: 'quux' });

                expect(query.getBindings()).to.deep.equal({ foo: 'quux' });
            });
        });

        context('using multiple unordered calls', () => {
            it('should replace duplicates', () => {
                const query = binding().bind('foo', 'qux');

                expect(query.getBindings()).to.deep.equal({ foo: 'qux' });

                query.bind('foo', 'quux');

                expect(query.getBindings()).to.deep.equal({ foo: 'quux' });
            });
        });

        it('should mix and match both type of parameters', () => {
            const query = binding().bind('foo', 'qux').bind({ 'bar': 'quux' });

            expect(query.getBindings()).to.deep.equal({ foo: 'qux', bar: 'quux' });
        });
    });
});
