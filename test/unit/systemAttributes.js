'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('system attributes', () => {
    let os, systemAttributes;

    beforeEach('create fakes', () => {
        os = td.replace('os');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('FreeBSD', () => {
        beforeEach('create fakes', () => {
            td.when(os.platform()).thenReturn('freebsd');
            td.when(os.release()).thenReturn('11.02.0-foo');
        });

        context('32 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('ia32');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'i386',
                    _os: 'FreeBSD-11.02'
                });
            });
        });

        context('64 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('x64');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'x86_64',
                    _os: 'FreeBSD-11.02'
                });
            });
        });

        context('ARM systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('arm');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'ARM',
                    _os: 'FreeBSD-11.02'
                });
            });
        });
    });

    context('Linux', () => {
        beforeEach('create fakes', () => {
            td.when(os.platform()).thenReturn('linux');
            td.when(os.release()).thenReturn('4.15.0-foo');
        });

        context('32 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('ia32');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'i386',
                    _os: 'Linux-4.15.0'
                });
            });
        });

        context('64 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('x64');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'x86_64',
                    _os: 'Linux-4.15.0'
                });
            });
        });

        context('ARM systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('arm');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'ARM',
                    _os: 'Linux-4.15.0'
                });
            });
        });
    });

    context('macOS', () => {
        beforeEach('create fakes', () => {
            td.when(os.platform()).thenReturn('darwin');
            td.when(os.release()).thenReturn('18.2.0-foo');
        });

        context('32 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('ia32');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'i386',
                    _os: 'macOS-10.14'
                });
            });
        });

        context('64 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('x64');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'x86_64',
                    _os: 'macOS-10.14'
                });
            });
        });

        context('ARM systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('arm');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'ARM',
                    _os: 'macOS-10.14'
                });
            });
        });
    });

    context('Solaris', () => {
        beforeEach('create fakes', () => {
            td.when(os.platform()).thenReturn('sunos');
            td.when(os.release()).thenReturn('5.11.4-foo');
        });

        context('32 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('ia32');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'i386',
                    _os: 'Solaris-11.4'
                });
            });
        });

        context('64 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('x64');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'x86_64',
                    _os: 'Solaris-11.4'
                });
            });
        });

        context('ARM systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('arm');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'ARM',
                    _os: 'Solaris-11.4'
                });
            });
        });
    });

    context('Windows', () => {
        beforeEach('create fakes', () => {
            td.when(os.platform()).thenReturn('win32');
            td.when(os.release()).thenReturn('10.0.16299-foo');
        });

        context('32 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('ia32');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'i386',
                    _os: 'Windows-10.0.16299'
                });
            });
        });

        context('64 bit systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('x64');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'x86_64',
                    _os: 'Windows-10.0.16299'
                });
            });
        });

        context('ARM systems', () => {
            beforeEach('create fakes', () => {
                td.when(os.arch()).thenReturn('arm');
            });

            it('uses the system attribute naming convention', () => {
                systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

                expect(systemAttributes()).to.deep.include({
                    _platform: 'ARM',
                    _os: 'Windows-10.0.16299'
                });
            });
        });
    });

    context('other', () => {
        beforeEach('create fakes', () => {
            td.when(os.platform()).thenReturn('foo');
            td.when(os.release()).thenReturn('bar');
            td.when(os.arch()).thenReturn('baz');
        });

        it('uses the system attribute naming convention', () => {
            systemAttributes = require('../../lib/Protocol/Util/systemAttributes');

            expect(systemAttributes()).to.deep.include({
                _platform: 'baz',
                _os: 'foo-bar'
            });
        });
    });
});
