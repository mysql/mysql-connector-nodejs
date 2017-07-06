
The X DevAPI provides an APIs for creating collections and relational
tables. In this tutorial the Connector/Node.JS implementations of this
API are presented.

All following examples assume a session was created and a `session`
object exists. If you don't know how to create a session see the
{@tutorial Getting_Started} tutorial.

## Creating Collections

A collection is a special-purpose table for storing documents. For
creating a collection the user only has to provide a name to
{@link Schema#createCollection}:

```
const schema = session.getSchema("test");
schema.createCollection("collname").then(coll => {
   /* ... work with the Collection object ... */
}).catch(err => {
   /* ... something went wrong ... */
});
```

As you can see the`createColletion` function returns a Promise
which resolves to a {@link Collection} object on success.

## Creating Relational Tables

For creating relational tables more options are available. Therefore
a builder object of type {@link TableFactory} has to be used. The easiest
way to get such an object is via {@link Schema#createTable}. On this object
the table structure is defined before the creation is invoked using
{@link TableFactory#execute}.

```
const schema = session.getSchema("test");

schema.createTable("testtable").
   addColumn(schema.columnDef("field1", schema.Type.Integer).notNull().primaryKey()).
   addColumn(schema.columnDef("field2", schema.Type.Varchar, 255)).
   addColumn(schema.columnDef("field3", schema.Type.Year)).
   addIndex("indexname", "field2").
   addUniqueIndex("uniquename", "field2", "field3")
   addForeignKey(schema.foreignKey().fields("field2").refersTo("other_table", "some_field")).
   execute().
then(table => {
   /* ... work with the Table object ... */
}).catch(err => {
   /* ... something went wrong ... */
});
```

In this example a table with three fields of different types is created. Field
definitions are created using {@link ColumnDefinition} objects, which are created
via {@link Schema#columnDef}. Type aliases are available via {@link Schema#Type}.
For creating a foreign key
{@link Schema#foreignKey} provides a {@link ForeignKeyDefinition} object which
allows setting the detailed reference.

Similar to the example above the execution returns a Promise which resolves
to a {@link Table} object or is being rejected.
