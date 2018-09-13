MySQL Connector/Node.js is the official Node.js driver for MySQL. It is written in JavaScript, does not require compiling, and is, currently, the only driver with out-of-the-box support for the MySQL document-store, through the [X Protocol](https://dev.mysql.com/doc/refman/8.0/en/document-store.html) (it does not support the classic MySQL protocol).

### Requirements

 * MySQL 8.0.11 or higher
 * Node.js 4.2 or higher

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

mysqlx.getSession('root@localhost:33060')
    .then(session => {
        return session.createSchema('mySchema')
            .then(() => {
                return session.getSchema('mySchema').createCollection('myCollection');
            })
            .then(() => {
                return session.getSchema('mySchema').getCollection('myCollection')
                    .add([{ name: 'foo', age: 42 }])
                    .execute()
            })
            .then(() => {
                return session.getSchema('mySchema').getCollection('myCollection')
                    .find()
                    .fields(['name', 'age'])
                    .execute(row => {
                        console.log(row); // { name: 'foo', age: 42 }
                    });
            })
            .then(() => {
                return session.getSchema('mySchema').getCollection('myCollection')
                    .modify('age = :value')
                    .bind('value', 42);
                    .set('name', 'bar')
                    .execute();
            })
            .then(() => {
                return session.getSchema('mySchema').getCollection('myCollection')
                    .find()
                    .fields(['name', 'age'])
                    .execute(row => {
                        console.log(row); // { name: 'bar', age: 42 }
                    });
            })
            .then(() => {
                return session.getSchema('mySchema').getCollection('myCollection')
                    .remove('true')
                    .execute();
            })
            .then(() => {
                return session.getSchema('mySchema').dropCollection('myCollection');
            })
            .then(() => {
                return session.dropSchema('mySchema');
            })
            .then(() => {
                return session.close();
            })
            .catch(err => {
                return session.close()
                    .then(() => {
                        throw err;
                    })
                    .catch(err => {
                        throw err;
                    });
            });
    })
    .catch(err => {
        console.log(err);
    });
```

You can always fallback to plain-old raw SQL statements if you feel the need to. In fact, there's currently no support for relational DDL operations through the X DevAPI, which means you will most likely need some SQL to work with traditional tables and views.

The following is an example encompassing the different sort of CRUD operations using relational tables:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('root@localhost:33060')
    .then(session => {
        return session.createSchema('mySchema')
            .then(() => {
                return session.sql('CREATE TABLE mySchema.myTable (_id SERIAL, name VARCHAR(3), age TINYINT)')
                    .execute();
            })
            .then(() => {
                return session.getSchema('mySchema').getTable('myTable')
                    .insert(['name', 'age'])
                    .values(['foo', 42])
                    .execute();
            })
            .then(() => {
                return session.getSchema('mySchema').getTable('myTable')
                    .select(['name', 'age'])
                    .execute(row => {
                        console.log(row); // ['foo', 42]
                    });
            })
            .then(() => {
                return session.getSchema('mySchema').getTable('myTable')
                    .update()
                    .where('age = 42')
                    .set('name', 'bar')
                    .execute();
            })
            .then(() => {
                return session.getSchema('mySchema').getTable('myTable')
                    .select(['name', 'age'])
                    .where('name = :value')
                    .bind('value', 'bar')
                    .execute(row => {
                        console.log(row); // ['bar', 42]
                    });
            })
            .then(() => {
                return session.getSchema('mySchema').getTable('myTable')
                    .delete()
                    .where('true')
                    .execute();
            })
            .then(() => {
                return session.sql('DROP TABLE mySchema.myTable')
                    .execute();
            })
            .then(() => {
                return session.dropSchema('mySchema');
            })
            .then(() => {
                return session.close();
            })
            .catch(err => {
                return session.close()
                    .then(() => {
                        throw err;
                    })
                    .catch(err => {
                        throw err;
                    });
            });
    })
    .catch(err => {
        console.log(err);
    });
```

Note: raw SQL statements are also sent to the server using a specialized protobuf message, again, since there is no support for the classic MySQL protocol.
