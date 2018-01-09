## Creating a Table

`Session.sql()` API is exposed to execute raw SQL commands on the server. MySQL tables can be created using this API as shown below:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .sql('CREATE TABLE schemaName.tableName (column INT)')
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

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        const schema = session.getSchema('foo');

        return Promise
            .all([
                session.sql('CREATE TABLE foo.bar (_id SERIAL)').execute(),
                session.sql('CREATE TABLE foo.baz (_id SERIAL)').execute()
            ])
            .then(() => schema);
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

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .sql('CREATE TABLE schemaName.tableName (column INT)')
            .execute()
            .then(() => session);
    })
    .then(session => {
        return session
            .sql('DROP TABLE testSchema.testTable')
            .execute();
    })
    .then(() => {
        // do other things
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
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .delete('name = "foo"')
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // [ [ 'bar', 42 ] ]
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .delete()
            .where('name = "foo"')
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // [ [ 'bar', 42 ] ]
    });
```

### Deleting all rows

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .delete('true')
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // []
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .delete()
            .where('true')
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // []
    });
```

### Updating rows that match a given criteria

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .update('name = "foo"')
            .set('age', 50)
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('name ASC').execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // [ [ 'foo', 50 ], [ 'bar', 42 ] ]
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The criteria is defined through the expression.
            .update()
            .where('name = "bar"')
            .set('age', 50)
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('name ASC').execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // [ [ 'foo', 23 ] [ 'bar', 50 ] ]
    });
```

### Deleting all rows

#### Without `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .update('true')
            .set('age', 50)
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('name ASC').execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // [ [ 'foo', 50 ] [ 'bar', 50 ] ]
    });
```

#### With `where()`

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getTable('testTable')
            // The expression should evaluate to `true`.
            .update()
            .where('true')
            .set('name', 'qux')
            .execute()
            .then(() => table);
    })
    .then(table => {
        let resultSet = [];

        return table.select().orderBy('age ASC').execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // [ [ 'qux', 23 ] [ 'qux', 50 ] ]
    });
```

## Column Types

It's important to understand how MySQL column types are translated to JavaScript/Node.js native types. One case worth a special mention is the fact every possible `number` higher than 2^53 - 1 (the maximum safest integer in JavaScript) or lower than -2^53 + 1 (the minimum safest integer in JavaScript) will be preserved as a `string` in order to avoid loosing precision. The following table depicts a comprehensive mapping between data types.

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
| Spacial           | `Buffer`              |
