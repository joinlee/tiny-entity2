# tiny-entity2

## Table of Contents
- [tiny-entity2](#tiny-entity2)
  - [Table of Contents](#table-of-contents)
  - [Install](#install)
  - [Introduction](#introduction)
  - [Define](#define)
  - [Query](#query)
  - [Command](#command)


## Install

```sh
$ npm install tiny-entity2
```

## Introduction

This is a ORM framework support Mysql and Sqlite3.

## Define

you can define an entity model like this:
``` ts
@Define.Table({ TableName: "person" })
export class Person extends EntityObjectMysql<Person> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column({ 
        DataType: Define.DataType.Decimal, 
        DataLength: 11, 
        DecimalPoint: 3 
    })
    weight: number;

    @Define.Column()
    name: string;

    @Define.Column({ 
        DataType: Define.DataType.INT, 
        DataLength: 11 
    })
    age: number;

    @Define.Column({ DataType: Define.DataType.BIGINT })
    birth: number;
}
```
you can use PrimaryKey() define a primarykey for an entity , and also use Column() define a field.
you can use some parameters for Column() like this:
```ts
@Define.Column({ 
        DataType: Define.DataType.Decimal, 
        DataLength: 11, 
        DecimalPoint: 3 
})
```
method list:
PrimaryKey(opt?: PropertyDefineOption):
define a primarykey faster then Column().

Column(opt?: PropertyDefineOption)
define a field. and also you can use this function define a primaryKey.

Mapping(opt: PropertyDefineOption)
define a mapping. it is used to deal with database foreignKey .
```ts
interface PropertyDefineOption{
    DataType?: DataType;
    DefaultValue?: any;
    NotAllowNULL?: boolean;
    DataLength?: number;
    ColumnName?: string;
    IsPrimaryKey?: boolean;
    ForeignKey?: { ForeignTable: string; ForeignColumn: string; IsPhysics?: boolean; };
    DecimalPoint?: number;
    IsIndex?: boolean;
    Mapping?: string;
    MappingType?: MappingType;
    MappingKey?: { FKey: string, MKey?: string } | string;
}

enum DataType {
        VARCHAR,
        TEXT,
        LONGTEXT,
        Decimal,
        INT,
        BIGINT,
        BOOL,
        Array,
        JSON
    }
```


---
## Query

query datas from table, return array.
``` ts
let list = await ctx.Person.Where(x => x.age > age, { age }).ToList();
```

``` ts
let list = await ctx.Person.Where(x => x.name.indexOf($args1), { $args1: params.name }).ToList();
```

using left join:
``` ts
let list = await ctx.Person
            .Join(ctx.Account)
            .On((m, f) => m.id == f.personId)
            .Contains<Account>(x => x.amount, values2, ctx.Account)
            .ToList();
```

query single entity
```ts
let list = await ctx.Person.First(x => x.name.indexOf($args1), { $args1: params.name });
```

using transcation:
``` ts
await Transaction(new TestDataContext(), async (ctx) => {
                //insert 10 persons to database;
                for (let i = 0; i < 10; i++) {
                    let person = new Person();
                    person.id = Guid.GetGuid();
                    person.name = "likecheng" + i;
                    person.age = 30 + i;
                    person.birth = new Date("1987-12-1").getTime();
                    if (i == 9)
                        throw ' transaction error';
                    await ctx.Create(person);
                }
            });
```

## Command
you need install tiny-entity2 global
```sh
$ npm install tiny-entity2 -g
```
at first you need to create the tinyconfig.json in your project.
this file provide some options to command.
```json
{
    "outDir": "./test",
    "modelLoadPath": [
        "./test/models"
    ],
    "modelExportPath": [
        "./models"
    ],
    "ctxExportPath": "",
    "configFilePath": "./config",
    "outFileName": "testDataContext.ts",
    "databaseType": "mysql",
    "packageName": "../mysql/dataContextMysql"
}
```
property description:
* outDir: directory of file output.
* modelLoadPath: directory of model file import.
* modelExportPath: directory of model file export.
* ctxExportPath: directory of data context file export.
* configFilePath: directory of database config file .
* outFileName: the name of data context file.
* databaseType: database type, 'mysql' or 'sqlite'.
* packageName: path of data context engine. now only support dataContextMysql and dataContextSqlite

use command 'gctx' create a dataContext.ts file. 
```sh
tiny --gctx ./tingconfig.json
```
use command 'gdb' create a new database file .
```sh
tiny --gdb ./tingconfig.json
```
use comman d 'gop' create a update log and excute to database.
```sh
tiny --gop ./tingconfig.json
```

you can create different tinyconfig.json  for different domain models.




