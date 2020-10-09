MySQL Connector/Node.js is the official Node.js driver for MySQL. It is written in JavaScript, does not require compiling, and is, currently, the only driver with out-of-the-box support for the MySQL document-store, through the [X Protocol](https://dev.mysql.com/doc/refman/8.0/en/document-store.html) (it does not support the classic MySQL protocol).

### Requirements

 * MySQL 8.0.11 or higher
 * Node.js 12.0.0 or higher

Altough some of the latest MySQL `5.7` versions are partially supported, you will only take advantage of the entire feature set using, at least, MySQL `8.0.11`.

### Installation

Download and install directly from the [npm registry](https://www.npmjs.com/package/@mysql/xdevapi):

```sh
$ npm install @mysql/xdevapi
```

Alternatively, download the tarball from the official [website](https://dev.mysql.com/downloads/connector/nodejs/) and install the package by running the following command in the root directory of your project:

```sh
$ npm install /path/to/mysql-connector-nodejs-<version>.tar.gz
```

### Overview

The MySQL Connector/Node.js allows you, among other things, to [tap into]{@tutorial Connecting_to_a_Server} the MySQL document-store and write [schemaless]{@tutorial Working_with_Collections} data apps or plain old traditional [relational-flavored]{@tutorial Working_with_Tables} apps using a fluent API and an integrated small but expressive query language (for complex queries). Besides traditional document-store functionality, the MySQL Connector/Node.js provides additional support for features such as [transactions]{@tutorial Session_Management}, [savepoints]{@tutorial Session_Management} and [row-locking]{@tutorial Row_Locking}.

The API is entirely asynchronous and uses the JavaScript `Promise` interface for flow control, which means it also enables the use of `async-await` on Node.js `8.0.0` or above. Check the following links to learn how to use `Promise` and `async-await` in JavaScript and Node.js:

- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

Database operations encompassing the entire DML surface and some DDL surface as well, are constructed using a contextual query-builder implemented through a fluent API. This API follows the same design rules on every official MySQL connector and matches the underlying X Protocol constructs implemented using the [Google Protocol Buffers](https://developers.google.com/protocol-buffers/) open standard.

The API provides support for managing database [sessions]{@tutorial Session_Management} and [schemas]{@tutorial Connecting_to_a_Server}, working with document-store [collections]{@tutorial Working_with_Collections} and using raw SQL statements.

The following is an example encompassing the different sort of CRUD operations using the document-store:

```js
const mysqlx = require('@mysql/xdevapi');
const config = { collection: 'myCollection', schema: 'mySchema', user: 'root' };

mysqlx.getSession({ user: config.user })
    .then(session => {
        const schema = session.getSchema(config.schema);

        return schema.existsInDatabase()
            .then(exists => {
                if (exists) {
                    return schema;
                }

                return session.createSchema(config.schema);
            })
            .then(schema => {
                return schema.createCollection(config.collection, { reuseExisting: true });
            })
            .then(collection => {
                return collection.add([{ name: 'foo', age: 42 }])
                    .execute()
                    .then(() => {
                        return collection.find()
                            .fields('name', 'age')
                            .execute();
                    })
                    .then(res => {
                        console.log(res.fetchOne()); // { name: 'foo', age: 42 }
                    })
                    .then(() => {
                        return collection.modify('age = :value')
                            .bind('value', 42)
                            .set('name', 'bar')
                            .execute();
                    })
                    .then(() => {
                        return collection.find()
                            .fields('name', 'age')
                            .execute();
                    })
                    .then(res => {
                        console.log(res.fetchOne()); // { name: 'bar', age: 42 }
                    })
                    .then(() => {
                        return collection.remove('true')
                            .execute();
                    })
                    .then(() => {
                        return collection.find()
                            .fields('name', 'age')
                            .execute();
                    })
                    .then(res => {
                        console.log(res.fetchAll()); // []
                    });
            })
            .then(() => {
                return schema.dropCollection(config.collection);
            })
            .then(() => {
                return session.dropSchema(config.schema);
            })
            .then(() => {
                return session.close();
            });
    });
```

You can always fallback to plain-old raw SQL statements if you feel the need to. In fact, there's currently no support for relational DDL operations through the X DevAPI, which means you will most likely need some SQL to work with traditional tables and views.

The following is an example encompassing the different sort of CRUD operations using relational tables:

```js
const mysqlx = require('@mysql/xdevapi');
const config = { schema: 'mySchema', table: 'myTable', user: 'root' }

mysqlx.getSession({ user: config.user })
    .then(session => {
        return session.sql(`create database if not exists ${config.schema}`)
            .execute()
            .then(() => {
                return session.sql(`create table if not exists ${config.schema}.${config.table} (_id SERIAL, name VARCHAR(3), age TINYINT)`)
                    .execute()
            })
            .then(() => {
                const table = session.getSchema(config.schema).getTable(config.table);

                return table.insert('name', 'age')
                    .values('foo', 42)
                    .execute()
                    .then(() => {
                        return table.select('name', 'age')
                            .execute()
                    })
                    .then(res => {
                        console.log(res.fetchOne()); // ['foo', 42]
                    })
                    .then(() => {
                        return table.update()
                            .where('age = :v')
                            .bind('v', 42)
                            .set('name', 'bar')
                            .execute()
                    })
                    .then(() => {
                        return table.select('name', 'age')
                            .where('name = :v')
                            .bind('v', 'bar')
                            .execute()
                    })
                    .then(res => {
                        console.log(res.fetchOne()); // ['bar', 42]
                    })
                    .then(() => {
                        return table.delete()
                            .where('true')
                            .execute();
                    })
                    .then(() => {
                        return table.select()
                            .execute()
                    })
                    .then(res => {
                        console.log(res.fetchAll()); // []
                    });
            })
            .then(() => {
                return session.sql(`drop table if exists ${config.schema}.${config.table}`)
                    .execute();
            })
            .then(() => {
                return session.sql(`drop database if exists ${config.schema}`)
                    .execute();
            })
            .then(() => {
                return session.close();
            });
    });
```

Note: raw SQL statements are also sent to the server using a specialized protobuf message, again, since there is no support for the classic MySQL protocol.
