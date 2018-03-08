# MySQL Connector/Node.js with X DevAPI

The Node.js Connector is an asynchronous promise-based client library for the X DevAPI (using the X Protocol) that was introduced in MySQL 5.7.12.

MySQL is an open-source relational database that is secure, high performing, and easy to use. The X DevAPI supports relational tables and JSON documents making it possible to use both tables and collections at the same time.

For general information about the X DevAPI, please refer to documentation on [https://dev.mysql.com/doc/x-devapi-userguide/en/](https://dev.mysql.com/doc/x-devapi-userguide/en/).

## Requirements

This library requires Node.js 4.2.0 or higher and MySQL 8.0.11 or higher. You are able to use recent MySQL 5.7.x versions (with some limitations), however, MySQL 5.7 does not take advantage of the entire set of features provided by the connector.

## Installation

This library is organized in a way that it can be installed into your project using Node.js's npm tool. Choose one of the following methods to get and install MySQL Connector/node.js:

* manually download the package from [https://dev.mysql.com/downloads/connector/nodejs/](https://dev.mysql.com/downloads/connector/nodejs/) and import the library using npm:
```sh
$ npm install mysql-connector-nodejsmysql-xdevapi-8.0.11.tar.gz
```
* use the @mysql/xdevapi package from [https://npmjs.com](https://npmjs.com) and install it:
```sh
$ npm install @mysql/xdevapi
```

Please refer to [https://npmjs.com](https://npmjs.com) for more information on npm.

## Getting Started

Using the MySQL document-store is as easy as follows:

```js
'use strict';

const mysqlx = require('@mysql/xdevapi');

const options = {
    host: 'localhost',
    port: 33060,
    password: '<passwd>',
    user: 'root'
};

mysqlx
    .getSession(options)
    .then(session => {
        return session
            .createSchema('mySchema')
            .then(schema => ({ schema, session }))
    })
    .then(ctx => {
        return ctx.schema
            .createCollection('myCollection')
            .then(collection => Object.assign(ctx, { collection }))
    })
    .then(ctx => {
        return Promise
            .all([
                ctx.collection
                    .add({ baz: { foo: 'bar' } }, { foo: { bar: 'baz' } })
                    .execute(),
                ctx.collection
                    .find('baz.foo = "bar"')
                    .execute(row => console.log(row)),
                ctx.collection
                    .remove('foo.bar = "baz"')
                    .execute(),
                ctx.schema
                    .dropCollection('myCollection')
            ])
            .then(() => ctx)
    })
    .then(ctx => {
        return ctx.session
            .dropSchema('mySchema')
            .then(() => ctx);
    })
    .then(ctx => {
        ctx.session.close();
        process.exit(0);
    })
    .catch(err => {
        console.log(err.stack);
        process.exit(1);
    });
```

Check out the official [documentation](https://dev.mysql.com/doc/dev/connector-nodejs/) for more details.

## License

Copyright (c) 2015, 2018, Oracle and/or its affiliates. All rights reserved.

This is a release of MySQL Connector/Node.js, Oracle's Node.js driver for MySQL.

License information can be found in the LICENSE file.

This distribution may include materials developed by third parties.
For license and attribution notices for these materials, please refer to the LICENSE file.

For more information on MySQL Connector/Node.js, visit
http://dev.mysql.com/doc/dev/connector-nodejs/8.0/

For additional downloads and the source of MySQL Connector/Node.js, visit
http://dev.mysql.com/downloads

MySQL Connector/Node.js is brought to you by the MySQL team at Oracle.
