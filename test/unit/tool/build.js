'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');
const pkg = require('package.json');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('build tools', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('generateSourceMetadataFile()', () => {
        let exec, writeFile, build;

        beforeEach('setup fakes', () => {
            exec = td.function();
            writeFile = td.function();

            td.replace('child_process', { exec });
            td.replace('../../../lib/Adapters/fs', { writeFile });

            build = require('lib/tool/build');

            td.when(writeFile(), { ignoreExtraArgs: true }).thenResolve();
        });

        context('specific build environment', () => {
            beforeEach('setup environment', () => {
                process.env.BRANCH_NAME = 'master';
                process.env.PUSH_REVISION = '0123456789abcdef';
            });

            afterEach('reset environment', () => {
                delete process.env.BRANCH_NAME;
                delete process.env.PUSH_REVISION;
            });

            it('should create a valid metadata file when git is not available', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: master\ncommit: 0123456789abcdef\nshort: 0123456\n`;

                td.when(exec(cmd)).thenCallback(new Error());

                return expect(build.generateSourceMetadataFile()).to.be.fulfilled
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('should create a valid metadata file when the git command throws an error', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: master\ncommit: 0123456789abcdef\nshort: 0123456\n`;

                td.when(exec(cmd)).thenCallback(null, null, 'error');

                return expect(build.generateSourceMetadataFile()).to.be.fulfilled
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('should create a valid metadata file when the git command works', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: foo\ncommit: baz\nshort: qux\ndate: bar\n`;

                td.when(exec(cmd)).thenCallback(null, 'branch=HEAD -> foo&date=bar&commit=baz&short=qux');

                return expect(build.generateSourceMetadataFile()).to.be.fulfilled
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });
        });

        context('general build environment', () => {
            it('should create a valid metadata file when git is not available', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\n`;

                td.when(exec(cmd)).thenCallback(new Error());

                return expect(build.generateSourceMetadataFile()).to.be.fulfilled
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('should create a valid metadata file when the git command throws an error', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\n`;

                td.when(exec(cmd)).thenCallback(null, null, 'error');

                return expect(build.generateSourceMetadataFile()).to.be.fulfilled
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('should create a valid metadata file when the git command works', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: foo\ndate: bar\ncommit: baz\nshort: qux\n`;

                td.when(exec(cmd)).thenCallback(null, 'branch=HEAD -> foo&date=bar&commit=baz&short=qux');

                return expect(build.generateSourceMetadataFile()).to.be.fulfilled
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });
        });
    });

    context('generatePackageMetadataFile()', () => {
        let arch, build, release, type, writeFile;

        beforeEach('setup fakes', () => {
            writeFile = td.function();
            type = td.function();
            release = td.function();
            arch = td.function();

            td.replace('os', { arch, type, release });
            td.replace('../../../lib/Adapters/fs', { writeFile });

            build = require('lib/tool/build');
        });

        it('should create a valid metadata file', () => {
            const file = path.join('docs', 'INFO_BIN');
            const content = /^build-date: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\nos-info: foo bar.baz\n$/;

            td.when(type()).thenReturn('foo');
            td.when(release()).thenReturn('bar');
            td.when(arch()).thenReturn('baz');
            td.when(writeFile(), { ignoreExtraArgs: true }).thenResolve();

            return expect(build.generatePackageMetadataFile()).to.be.fulfilled
                .then(() => {
                    expect(td.explain(writeFile).callCount).to.equal(1);
                    expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                    expect(td.explain(writeFile).calls[0].args[1]).to.match(content);
                });
        });
    });
});
