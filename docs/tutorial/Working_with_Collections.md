The X DevAPI provides an APIs for creating collections and relational tables. In this tutorial the Connector/Node.JS implementations of this API are presented.

All following examples assume a session was created and a `session` object exists. Check the appropriate [tutorial]{@tutorial Connecting_to_a_Server} if you don't know how to create a session. Additionally, the connector also provides an API for working with [single documents]{@tutorial Working_with_Documents}.

## Creating collections

A collection is a special-purpose table for storing documents. For creating a collection the user only has to provide a name to {@link Schema#createCollection}:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('test');
            .createCollection('collname');
    .then(collection => {
        // Use the Collection instance.
    }).catch(err => {
        // Something went wrong.
    });
```

As you can see the`createColletion` function returns a Promise which resolves to a {@link Collection} object on success.

## Listing all the existing collections

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        const schema = session.getSchema('foo');

        return Promise
            .all([
                schema.createCollection('bar'),
                schema.createCollection('baz')
            ])
            .then(() => schema);
    })
    .then(schema => {
        return schema.getCollections();
    })
    .then(collections => {
        console.log(collections[0].getName()); // 'bar'
        console.log(collections[1].getName()); // 'baz'
    })
```

## Dropping a collection

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        const schema = session.getSchema('foo');
        return schema.createCollection('bar').then(() => schema);
    })
    .then(schema => {
        return schema.dropCollection('bar');
    });
```

## Handling documents in existing collections

Considering a collection `testSchema.testCollection` containing the following documents:

```json
[{
    "_id": 1,
    "name": "foo",
    "meta": {
        "nested": "bar"
    }
}, {
    "_id": 2,
    "name": "bar",
    "meta": {
        "nested": "baz"
    }
}]
```

These documents can be modified or removed under some specific conditions, as shown below.

To modify/remove specific documents from a collection, one should provide the appropriate filtering condition when calling `modify()` or `remove()`. For more details about the expression format, please check the [user guide](https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchconditionstr).

To modify/remove all documents from a collection, one should provide any expression that evaluates to `true` (if no expression is provided, executing the operation will result in an error) when calling `modify()` or `remove()`.

### Removing documents that match a given criteria

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The criteria is defined through the expression.
            .remove('name = "foo"')
            .execute()
            .then(() => collection);
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // [{ _id: 2, name: 'bar', meta: { nested: 'baz' } }]
    });
```

### Removing all documents

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The expression should evaluate to `true`.
            .remove('true')
            .execute()
            .then(() => collection);
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result); // []
    });
```

### Modifying documents that match a given criteria

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The criteria is defined through the expression.
            .modify('_id = 1')
            .set('name', 'baz')
            .execute()
            .then(() => collection);
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result);
        // [
        //      { _id: 1, name: 'baz', meta: { nested: 'bar' } },
        //      { _id: 2, name: 'bar', meta: { nested: 'baz' } }
        // ]
    });
```

### Modifying all documents

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            // The expression should evaluate to `true`.
            .modify('true')
            .set('name', 'baz')
            .set('meta.nested', 'quux')
            .execute()
            .then(() => collection);
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result);
        // [
        //      { _id: 1, name: 'baz', meta: { nested: 'quux' } },
        //      { _id: 2, name: 'baz', meta: { nested: 'quux' } }
        // ]
    });
```

### Bulk-updating multiple document properties

Additionaly, instead of explicitly updating individual document properties using `set()`, you can update multiple properties in a single call, by using `patch()`.

Using `patch()` will, remove properties set to `null`, add previously nonexisting properties and update the existing ones. This behavior also applies to nested properties.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            .modify('_id = 1')
            .patch({ name: 'qux', meta: { nested: null, other: 'quux' } })
            .execute()
            .then(() => collection);
    })
    .then(collection => {
        const query = collection.find();
        let resultSet = [];

        return query.execute(doc => resultSet.push(doc)).then(() => resultSet);
    })
    .then(result => {
        console.log(result);
        // [
        //      { _id: 1, name: 'qux', meta: { other: 'quux' } },
        //      { _id: 2, name: 'bar', meta: { nested: 'baz' } }
        // ]
    });
```

Note: the criteria expression string provided via `modify()` establishes the filtering rules, thus any `_id` value provided as part of the properties to be updated will simply be ignored (and will not be updated).

## Collection indexes

Collection indexes are ordinary MySQL indexes on virtual columns that extract data from JSON document.
To create an Index, an index name and the index definition is required.

The Index Definition has the following properties:
```
{string} [type] - name of index's type INDEX (default) or SPATIAL.
{array} fields - Array of Index Field objects. Each has the following properties:
    {string} field - The Document path.
    {string} type - see list of available types below.
    {boolean} required - whether the generated column will be created as NOT NULL.
    {number} [options] - describes how to handle GeoJSON documents that contain geometries with coordinate dimensions higher than 2.
    {number} [srid] - unique value used to unambiguously identify projected, unprojected, and local spatial coordinate system definitions.
```

You can create an index with one of the following types:
```
INT [UNSIGNED]
TINYINT [UNSIGNED]
SMALLINT [UNSIGNED]
MEDIUMINT [UNSIGNED]
INTEGER [UNSIGNED]
BIGINT [UNSIGNED]
REAL [UNSIGNED]
FLOAT [UNSIGNED]
DOUBLE [UNSIGNED]
DECIMAL [UNSIGNED]
NUMERIC [UNSIGNED]
DATE
TIME
TIMESTAMP
DATETIME
TEXT[(length)]
GEOJSON (extra options: options, srid)
```

Additional details about spacial indexes can be found [here](https://dev.mysql.com/doc/refman/8.0/en/spatial-geojson-functions.html).

### Gotchas

Unique indexes are currently not supported by the xplugin, so, for now, you can only create non-unique indexes.

If a collection is not empty, you can't create `SPACIAL` indexes for `GEOJSON` fields and you can't also create regular required (`NOT NULL`) indexes for `DATE` or `DATETIME` fields, due to some limitations of the xplugin.

### Creating a regular index

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root@localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            .createIndex('zip', {
                fields: [{
                    field: '$.zip',
                    type: 'TEXT(10)',
                    required: false
                }]
            });
    })
    .then(status => {
        console.log(status); // true
    })
    .catch(err => {
        // the operation failed
    });
```

### Creating a spatial index

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root@localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            .createIndex('coords', {
                fields: [{
                    field: '$.coords',
                    type: 'GEOJSON',
                    required: true,
                    options: 1234,
                    srid: 1234
                }],
                type: 'SPATIAL'
            });
    })
    .then(status => {
        console.log(status); // true
    })
    .catch(err => {
        // the operation failed
    });
```

### Dropping an index

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root@localhost:33060')
    .then(session => {
        return session
            .getSchema('testSchema')
            .getCollection('testCollection')
            .dropIndex('zip');
    })
    .then(status => {
        console.log(status); // true
    })
    .catch(err => {
        // the operation failed
    });
```
