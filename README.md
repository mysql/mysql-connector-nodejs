MySQL Connector/Node.js with X DevAPI
=====================================

The Node.js Connector is an asynchronous promise-based client library for the
X DevAPI and he X Protocol that was introduced in MySQL 5.7.12.

MySQL 5.7 is an open-source relational database that is secure, high
performing, and easy to use. The X DevAPI supports relational tables and JSON 
documents making it possible to use both tables and collections at the same
time.

For general information about the X DevAPI, please refer to documentation on
http://dev.mysql.com/doc/x-devapi-userguide/en/

Requirements
------------
This library requires at least Node.js 4.2 and MySQL 5.7.12.

Installation
------------
This library is organized in a way that it can be installed using Node.js's npm
tool into your project:
  `npm install mysql-connector-nodejs-1.0.4.tar.gz`
or diectly from npmjs.com:
  `npm install @mysql/xdevapi`
Please refer to http://npmjs.com for more information on npm.

Getting Started
---------------
A simple JavaScript file using this library follows:


    const xdevapi = require('@mysql/xdevapi');

    xdevapi.getSession({
        host: 'localhost',
        port: 33060,
        dbUser: 'root',
        dbPassword: ''
    }).then(function (session) {
        return session.createSchema("test_schema").then(function (schema) {
            return schema.createCollection("myCollection");
        }).then(function (collection) {
            return Promise.all([
                collection.add(
                    {baz: { foo: "bar"}},
                    {foo: { bar: "baz"}}
                ).execute(),
                collection.find("$.baz.foo == 'bar'").execute(function (row) {
                    console.log("Row: %j", row);
                }).then(function (res) {
                    console.log("Collection find done!");
                }),
                collection.remove("($.foo.bar) == 'baz'").execute().then(function () {
                    console.log("Document deleted");
                }),
                collection.drop()
            ]);
        }).then(function () {
            return session.dropSchema("test_schema");
        }).then(function () {
            return session.close();
        });
    }).catch(function (err) {
        console.log(err.stack);
        process.exit();
    });


License
-------
This is a release of MySQL Connector for Node.js, Oracle's dual-
license Node.js Driver for MySQL. For the avoidance of
doubt, this particular copy of the software is released
under the version 2 of the GNU General Public License.

MySQL Connector for Node.js is brought to you by Oracle.

Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.

License information can be found in the COPYING file.

MySQL FOSS License Exception
We want free and open source software applications under
certain licenses to be able to use the GPL-licensed MySQL
Connector for Node.js despite the fact that not all such FOSS licenses are
compatible with version 2 of the GNU General Public License.
Therefore there are special exceptions to the terms and
conditions of the GPLv2 as applied to these client libraries,
which are identified and described in more detail in the
FOSS License Exception at
<http://www.mysql.com/about/legal/licensing/foss-exception.html>

This software is OSI Certified Open Source Software.
OSI Certified is a certification mark of the Open Source Initiative.

This distribution may include materials developed by third
parties. For license and attribution notices for these
materials, please refer to the documentation that accompanies
this distribution (see the "Licenses for Third-Party Components"
appendix) or view the online documentation at
<http://dev.mysql.com/doc/>

A copy of the license/notices is also reproduced below.

GPLv2 Disclaimer
For the avoidance of doubt, except that if any license choice
other than GPL or LGPL is available it will apply instead,
Oracle elects to use only the General Public License version 2
(GPLv2) at this time for any software where a choice of GPL
license versions is made available with the language indicating
that GPLv2 or any later version may be used, or where a choice
of which version of the GPL is applied is otherwise unspecified.


APPENDIX: Licenses for Third-Party Components
---------------------------------------------
### protobuf.js

Use of any of this software is governed by the terms of
the license below:

Copyright (c) Nathan LaFreniere <quitlahok@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


