To remove/drop a given database object (`schema`, `collection`, `table`, `view`), utility methods are provided one level up each abstraction layer:

| Database Object   | Method                                        |
| ----------------- | --------------------------------------------- |
| `schema`          | `session.createSchema('<schema_name>')`       |
| `schema`          | `session.dropSchema('<schema_name>')`         |

Each of these methods returns a `Promise` that gets fulfilled with `true` even if the given database object does not exist. So, the promise only gets rejected if some unexpected error occurs during the operation.

### Creating a Schema

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/foo')
    .then(session => {
        return session.createSchema('foo');
    });
```

### Dropping a schema

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/foo')
    .then(session => {
        return session.dropSchema('foo');
    });
```
