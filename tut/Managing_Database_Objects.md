To remove/drop a given database object (`schema`, `collection`, `table`, `view`), utility methods are provided one level up each abstraction layer:

| Database Object   | Method                                        |
| ----------------- | --------------------------------------------- |
| `schema`          | `session.dropSchema('<schema_name>')`         |
| `collection`      | `schema.dropCollection('<collection_name>')`  |
| `table`           | `schema.dropTable('<table_name>')`            |
| `view`            | `schema.dropView('<view_name>')`              |

Each of these methods returns a `Promise` that gets fulfilled with `true` even if the given database object does not exist. So, the promise only gets rejected if some unexpected error occurs during the operation.

### Dropping a collection

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/foo')
    .then(session => {
        const schema = session.getSchema('foo');

        return schema.createCollection('bar').then(() => schema);
    })
    .then(schema => {
        return schema.dropCollection('bar');
    });
```
