'use strict';

/* eslint-env node, mocha */

const configManager = require('lib/DevAPI/SessionConfigManager');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const td = require('testdouble');
const parseUri = require('lib/DevAPI/Util/URIParser');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('SessionConfigManager', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('get()', () => {
        let load;

        beforeEach('create fakes', () => {
            load = td.function();
        });

        context('without a registered password handler', () => {
            it('should return the configuration object of a given session', () => {
                const sessionName = 'foo';
                const uri = 'bar';

                td.when(load(sessionName)).thenResolve({ uri });

                const config = configManager();
                config.setPersistenceHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled.then(session => {
                    expect(session.getName()).to.equal(sessionName);
                    expect(session.getUri()).to.equal(uri);
                });
            });
        });

        context('with a registered password handler', () => {
            it('should return the configuration object of a given session', () => {
                const address = 'baz:qux';
                const sessionName = 'foo';
                const username = 'bar';
                const password = 'quux';

                td.when(load(username, address)).thenResolve(password);
                td.when(load(sessionName), { times: 1 }).thenResolve({ uri: `${username}@${address}` });

                const config = configManager();
                config.setPersistenceHandler({ load });
                config.setPasswordHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled.then(session => {
                    expect(session.getName()).to.equal(sessionName);
                    expect(session.getUri()).to.equal(`${username}:${password}@${address}`);
                    expect(parseUri(session.getUri()).dbPassword).to.equal(password);
                });
            });

            it('should use the default port to identify the service when the URI does not contain it', () => {
                const host = 'baz';
                const address = `${host}:33060`;
                const sessionName = 'foo';
                const username = 'bar';
                const password = 'qux';

                td.when(load(username, address)).thenResolve(password);
                td.when(load(sessionName), { times: 1 }).thenResolve({ uri: `${username}@${host}` });

                const config = configManager();
                config.setPersistenceHandler({ load });
                config.setPasswordHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled.then(session => {
                    expect(session.getName()).to.equal(sessionName);
                    expect(session.getUri()).to.equal(`${username}:${password}@${host}`);
                    expect(parseUri(session.getUri()).dbPassword).to.equal(password);
                });
            });

            it('should not retrieve password from handler if no user is provided', () => {
                const address = 'baz:qux';
                const sessionName = 'foo';

                td.when(load(sessionName), { times: 1 }).thenResolve({ uri: address });

                const config = configManager();
                config.setPersistenceHandler({ load });
                config.setPasswordHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled.then(session => {
                    expect(td.explain(load).callCount).to.equal(1);
                    expect(session.getName()).to.equal(sessionName);
                    expect(session.getUri()).to.equal(address);
                    expect(parseUri(session.getUri()).dbPassword).to.not.exist;
                });
            });
        });

        it('should return a configuration object containing application-specific data', () => {
            const sessionName = 'foo';
            const appdata = { bar: 'baz' };

            td.when(load(sessionName)).thenResolve({ appdata });

            const config = configManager();
            config.setPersistenceHandler({ load });

            return expect(config.get(sessionName)).to.be.fulfilled.then(session => {
                expect(session.getAppData('bar')).to.equal('baz');
            });
        });

        it('should fail if no IPersistenceHandler implementation is available', () => {
            const config = configManager().setPersistenceHandler(undefined);

            return expect(config.get('foo')).to.be.rejectedWith('No IPersistenceHandler implementation available');
        });
    });

    context('list()', () => {
        let list;

        beforeEach('create fakes', () => {
            list = td.function();
        });

        it('should return an array containing the names of the available persistent sessions', () => {
            const expected = ['foo', 'bar'];

            td.when(list()).thenResolve(expected);

            const config = configManager().setPersistenceHandler({ list });

            return expect(config.list()).to.be.fulfilled
                .then(sessions => {
                    expect(sessions).to.deep.equal(expected);
                });
        });

        it('should fail if no IPersistenceHandler implementation is available', () => {
            const config = configManager().setPersistenceHandler(undefined);

            return expect(config.list()).to.be.rejectedWith('No IPersistenceHandler implementation available');
        });
    });
});
