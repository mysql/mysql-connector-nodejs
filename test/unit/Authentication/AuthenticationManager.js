'use strict';

/* eslint-env node, mocha */

const authenticationManager = require('../../../lib/Authentication/AuthenticationManager');
const expect = require('chai').expect;

describe('authenticationManager', () => {
    context('registerPlugin()', () => {
        it('adds a given plugin to the list of available plugins', () => {
            const plugin = { Name: 'foo' };

            expect(authenticationManager.registerPlugin(plugin).getPlugin('foo')).to.deep.equal(plugin);
        });
    });

    context('getPluginNames()', () => {
        it('retrieves the list of names of available plugins', () => {
            authenticationManager.registerPlugin({ Name: 'foo' });
            authenticationManager.registerPlugin({ Name: 'bar' });

            expect(authenticationManager.getPluginNames()).to.include.members(['foo', 'bar']);
        });
    });
});
