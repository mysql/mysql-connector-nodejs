/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('system attributes', () => {
    let os, getSystemAttributes;

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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
                getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

                expect(getSystemAttributes()).to.deep.include({
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
            getSystemAttributes = require('../../../lib/Protocol/Util/getSystemAttributes');

            expect(getSystemAttributes()).to.deep.include({
                _platform: 'baz',
                _os: 'foo-bar'
            });
        });
    });
});
