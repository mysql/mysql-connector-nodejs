## Id generation

When adding documents to a collection, if a document does not contain an `_id`, it will be automatically assigned a sequential UUID-like value. One can, however, override this behavior by providing a static `_id` for each document.

### Using automatically assigned values

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        return session.getSchema('mySchema').createCollection('myCollection');
    })
    .then(collection => {
        return collection.add({ name: 'foo' })
            .execute()
            .then(() => {
                return collection.find()
                    .execute(doc => docs.push(doc));
            })
    })
    .then(() => {
        // the `_id` value is just an example in this case
        console.log(docs); // [{ _id: '00005a640138000000000000002c', name: 'foo' }]
    });
```

### Using static values

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        return session.getSchema('mySchema').createCollection('myCollection');
    })
    .then(collection => {
        return collection.add({ _id: 1, name: 'foo' })
            .execute()
            .then(() => {
                return collection.find()
                    .execute(doc => docs.push(doc));
            });
    })
    .then(() => {
        console.log(docs); // [{ _id: 1, name: 'foo' }]
    });
```
## Single document CRUD

The connector provides a set of utility methods that can be used to add, remove, replace or retrieve a single specific document via its `_id` property.

Consider a collection `mySchema.myCollection` containing the following documents:

```json
[{
    "_id": "1",
    "name": "foo"
}, {
    "_id": "2",
    "name": "bar"
}]
```

The following scenarios are possible.

### Replacing a single document

If a document with a given `_id` already exists in the database, it can be replaced via the `Collection.replaceOne()` method.

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.replaceOne('1', { name: 'baz', age: 23 })
            .then(result => {
                console.log(result.getAffectedItemsCount()); // 1

                return collection.find()
                    .execute(doc => docs.push(doc));
            });
    })
    .then(() => {
        console.log(docs); // [ { _id: '1', age: 23 }, { _id: '2', name: 'bar' } ]
    });
```

If no such document exists, the method will neither fail nor have any effect.

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection')

        return collection.replaceOne('3', { name: 'baz', age: 23 })
            .then(result => {
                console.log(result.getAffectedItemsCount()); // 0

                return collection.find()
                    .execute(doc => docs.push(doc));
            });
    })
    .then(() => {
        console.log(docs); // [ { _id: '1', name: 'foo' }, { _id: '2', name: 'bar' } ]
    });
```

### Creating or updating a single document

The connector also provides an additional utility method - `Collection.addOrReplaceOne()` - that allows to seamlessly either create a document with a given `_id` and properties or automatically replace an existing matching document.

So, if a document with the given `_id` already exists in a collection, the behavior is the same as with `Collection.replaceOne()`.

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.addOrReplaceOne('1', { name: 'baz', age: 23 })
            .then(result => {
                // the existing row is re-created (leading to two different operations)
                // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                console.log(result.getAffectedItemsCount()); // 2

                return collection.find()
                    .execute(doc => docs.push(doc));
            });
    })
    .then(() => {
        console.log(docs); // [ { _id: '1', name: 'baz', age: 23 }, { _id: '2', name: 'bar' } ]
    });
```

If no such document exists, a new one will be created.

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.addOrReplaceOne('3', { name: 'baz', age: 23 })
            .then(result => {
                console.log(result.getAffectedItemsCount()); // 1

                return collection.find()
                    .execute(doc => docs.push(doc));
            });
    })
    .then(() => {
        console.log(docs); // [ { _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz', age: 23 } ]
    });
```

When additional unique key constraints exist for a collection, a few additional scenarios are brought up. Assuming, the `name` property has a unique key constraint established by a [auto-generated column](https://dev.mysql.com/doc/refman/8.0/en/create-table-secondary-indexes.html#json-column-indirect-index).

```sql
ALTER TABLE mySchema.myCollection ADD COLUMN name VARCHAR(3) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(doc, '$.name'))) VIRTUAL UNIQUE KEY NOT NULL
```

Existing documents will be updated with the given properties, provided that there are no unique key constraint violations with other documents.

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
         const collection = session.getSchema('mySchema').getCollection('myCollection');

         return collection.addOrReplaceOne('1', { name: 'baz' })
            .then(result => {
                // the existing row is re-created (leading to two different operations)
                // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                console.log(result.getAffectedItemsCount()); // 2

                return collection.find()
                    .execute(doc => docs.push(doc));
            });
    })
    .then(() => {
        console.log(docs); // [ { _id: '1', name: 'baz' }, { _id: '2', name: 'bar' } ]
    });
```

Unique key values themselves can also be updated with the same restrictions.

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.addOrReplaceOne('1', { name: 'foo', age: 23 })
            .then(result => {
                // the existing row is re-created (leading to two different operations)
                // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                console.log(result.getAffectedItemsCount()); // 2

                return collection.find()
                    .execute(doc => docs.push(doc));
            });
    })
    .then(() => {
        console.log(docs); // [ { _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar' } ]
    });
```

Unique key constraint violations will, of course, result in an error.

```js
const mysqlx = require('@mysql/xdevapi')

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
         return session.getSchema('mySchema').getCollection('myCollection')
            .addOrReplaceOne('1', { name: 'bar' });
    })
    .catch(err => {
        console.log(err.message);
    })
```

### Retrieving a single document

There's also an utility method to retrieve a single document from a collection, given its `id` - `Collection.getOne()`. The method returns a `Promise` which resolves to the document instance (in the form of a literal object), if it exists or `null`, if it does not.

```js
const mysqlx = require('@mysql/xdevapi')

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        return session.getSchema('mySchema').getCollection('myCollection')
            .getOne('1');
    })
    .then(doc => {
        console.log(doc); // { _id: '1', name: 'foo' }
    });
```

```js
const mysqlx = require('@mysql/xdevapi')

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        return session.getSchema('mySchema').getCollection('myCollection')
            .getOne('3');
    })
    .then(doc => {
        console.log(doc); // null
    });
```

### Removing a single document

One can also remove a specific document from a collection given its `id` - `Collection.removeOne()`. If no such document exists, the operation succeeds, but nothing really happens.

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.removeOne('1')
            .then(result => {
                console.log(result.getAffectedItemsCount()); // 1

                return collection.find()
                    .execute(doc => docs.push(doc));
            })
    })
    .then(() => {
        console.log(docs); // [ { _id: '2', name: 'bar' } ]
    });
```

```js
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.removeOne('3')
            .then(result => {
                console.log(result.getAffectedItemsCount()); // 0

                return collection.find()
                    .execute(doc => docs.push(doc));
            })
    })
    .then(() => {
        console.log(docs); // [ { _id: '1', name: 'foo' }, { _id: '2', name: 'bar' } ]
    });
```
