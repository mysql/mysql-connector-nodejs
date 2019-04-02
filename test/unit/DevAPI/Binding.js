'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('Binding', () => {
    let binding, parse;

    beforeEach('create fakes', () => {
        parse = td.function();

        td.replace('../../../lib/ExprParser', { parse });
        binding = require('../../../lib/DevAPI/Binding');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('bind()', () => {
        it('is fluent', () => {
            const query = binding().bind('foo', 'bar');

            expect(query.bind).to.be.a('function');
        });

        it('does nothing if no argument is provided', () => {
            expect(binding().bind().getBindings()).to.deep.equal({});
        });

        context('using unordered mapping dictionaries', () => {
            it('replaces duplicates', () => {
                const query = binding().bind({ foo: 'qux' });

                expect(query.getBindings()).to.deep.equal({ foo: 'qux' });

                query.bind({ foo: 'quux' });

                expect(query.getBindings()).to.deep.equal({ foo: 'quux' });
            });
        });

        context('using multiple unordered calls', () => {
            it('replaces duplicates', () => {
                const query = binding().bind('foo', 'qux');

                expect(query.getBindings()).to.deep.equal({ foo: 'qux' });

                query.bind('foo', 'quux');

                expect(query.getBindings()).to.deep.equal({ foo: 'quux' });
            });
        });

        it('mixes and match both type of parameters', () => {
            const query = binding().bind('foo', 'qux').bind({ 'bar': 'quux' });

            expect(query.getBindings()).to.deep.equal({ foo: 'qux', bar: 'quux' });
        });
    });
});
