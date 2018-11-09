## Creating a Table

`Session.sql()` API is exposed to execute raw SQL commands on the server. MySQL tables can be created using this API as shown below:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.sql('CREATE TABLE schemaName.tableName (column INT)')
            .execute()
            .then(() => {
                return session.getSchema('schemaName').getTable('tableName');
            });
    })
    .then(table => {
        // work with the Table object
    })
    .catch(err => {
        // something went wrong
    });
```

## Listing all the existing tables

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return Promise
            .all([
                session.sql('CREATE TABLE foo.bar (_id SERIAL)').execute(),
                session.sql('CREATE TABLE foo.baz (_id SERIAL)').execute()
            ])
            .then(() => session.getSchema('foo'));
    })
    .then(schema => {
        return schema.getTables();
    })
    .then(tables => {
        console.log(tables[0].getName()); // 'bar'
        console.log(tables[1].getName()); // 'baz'
    })
```

## Dropping a Table

Consider a table `testSchema.testTable`. We can drop this table using the `Session.sql()` API similar to above.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.sql('CREATE TABLE schemaName.tableName (column INT)')
            .execute()
            .then(() => {
                return session.sql('DROP TABLE testSchema.testTable')
                    .execute();
            });
    })
    .catch(err => {
        // something went wrong
    });
```

## Handling data in existing tables

Considering a table `testSchema.testTable` such as the following:

```
+------+------+
| name | age  |
+------+------+
| foo  |   23 |
| bar  |   42 |
+------+------+
```

Table rows can be updated or deleted under some specific conditions, as shown below.

To update/delete specific rows from a table, one should provide the appropriate filtering condition when calling `update()` or by additionally calling the `where()` method. For more details about the expression format, please check the [guide](https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchconditionstr).

To update/delete all rows from a table, one should provide any expression that evaluates to `true` (if no expression is provided, executing the operation will result in an error) when calling `delete()` or by appending a call to  `where()`.

### Deleting rows that match a given criteria

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.delete().where('name = "foo"')
            .execute()
            .then(() => {
                return table.select().execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // [ [ 'bar', 42 ] ]
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.delete().where('name = "foo"')
            .execute()
            .then(() => {
                return table.select().execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // [ [ 'bar', 42 ] ]
    });
```

### Deleting all rows

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        // The expression should evaluate to `true`.
        return table.delete().where('true')
            .execute()
            .then(() => {
                return table.select().execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // []
    });
```

### Updating rows that match a given criteria

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        // The criteria is defined through the expression.
        return table.update().where('name = "bar"').set('age', 50)
            .execute()
            .then(() => {
                return table.select().orderBy('name ASC').execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // [ [ 'foo', 23 ] [ 'bar', 50 ] ]
    });
```

### Deleting all rows

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        // The expression should evaluate to `true`.
        return table.update().where('true').set('name', 'qux')
            .execute()
            .then(() => {
                return table.select().orderBy('age ASC').execute();
            });
    })
    .then(result => {
        console.log(result.fetchAll()); // [ [ 'qux', 23 ] [ 'qux', 50 ] ]
    });
```

### Cursors

Similarly to the document-based API, iterating over result-sets originating from regular relational tables can be done either with `fetchAll()` (as depicted up until now) and with the pull-based `fetchOne()` cursor or the push-based API using callbacks. The only difference in the later is the fact that you can provide an additional callback function to handle column metadata.

**Pull-based approach**

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.select().orderBy('age ASC').execute();
    })
    .then(result => {
        console.log(result.fetchOne()); // [ 'qux', 23 ]
        console.log(result.fetchOne()); // [ 'qux', 50 ]
    });
```

**Push-based approach**

```js
const mysqlx = require('@mysql/xdevapi');
const data = [];
const metadata = [];

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.select().orderBy('age ASC')
            .execute(row => data.push(row), meta => metadata.push(meta));
    })
    .then(() => {
        console.log(rows); // [['qux', 23], ['qux', 50]]
        console.log(metadata.map(column => column.getColumnName()); // ['name', 'age']
    });
```

### Iterating over multiple result-sets

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.sql(`
            CREATE PROCEDURE proc() BEGIN
                SELECT name, age FROM testSchema.testTable;
                SELECT name, age from testSchema.testTable;
            END`)
        .execute()
        .then(() => {
            return session.sql(`CALL proc()`).execute()
        })
        .then(result => {
            let item = result.fetchAll();
            console.log(item); // [['qux', 23]]

            result.nextResult();

            item = result.fetchOne();
            console.log(item); // ['qux', 50]
        });
    });
```

### Handling column metadata

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const table = session.getSchema('testSchema').getTable('testTable');

        return table.select().orderBy('age ASC').execute();
    })
    .then(result => {
        const columns = result.getColumns();

        console.log(columns[0].getColumnName()); // 'name'
        console.log(columns[1].getColumnName()); // 'age'
    });
```

### Retrieving the table size

You can also retrieve the table size at any point in time, using the `count()` method.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.getSchema('testSchema').getTable('testTable').count();
    })
    .then(count => {
        console.log(count); // 2
    });
```

## Column Types

It's important to understand how MySQL column types are translated to JavaScript/Node.js native types. One case worth a special mention is the fact every possible `number` higher than 2^53 - 1 (the maximum safest integer in JavaScript) or lower than -2^53 + 1 (the minimum safest integer in JavaScript) will be preserved as a `string` in order to avoid loosing precision. The following table depicts a non-comprehensive and possible mapping between data types.

| MySQL             | JavaScript/Node.js    |
|-------------------|-----------------------|
| `INTEGER`         | `Number`              |
| `INT`             | `Number`              |
| `SMALLINT`        | `Number`              |
| `TINYINT`         | `Number`              |
| `MEDIUMINT`       | `Number`              |
| `BIGINT`          | `Number` or `String`  |
| `DECIMAL`         | `Number` or `String`  |
| `NUMERIC`         | `Number` or `String`  |
| `FLOAT`           | `Number`              |
| `DOUBLE`          | `Number`              |
| `BIT`             | `String`              |
| `DATE`            | `Date`                |
| `DATETIME`        | `Date`                |
| `TIMESTAMP`       | `Number`              |
| `TIME`            | `String`              |
| `CHAR`            | `String`              |
| `VARCHAR`         | `String`              |
| `BINARY`          | `String`              |
| `VARBINARY`       | `String`              |
| `BLOB`            | `String`              |
| `TEXT`            | `String`              |
| `ENUM`            | `String`              |
| `SET`             | `Array`               |
| `JSON`            | `Object`              |
| `SPATIAL`         | `Buffer`              |

Additionally, except for `JSON` fields, you should also account for the following:

- `Boolean` values (`true` and `false`) will be coerced into any kind of [numeric](https://dev.mysql.com/doc/refman/8.0/en/numeric-types.html) type
- `null` or `undefined` will be coerced into the MySQL [`NULL`](https://dev.mysql.com/doc/refman/8.0/en/working-with-null.html) value
