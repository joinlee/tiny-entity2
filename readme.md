# tiny-entity2

## Table of Contents
- [tiny-entity2](#tiny-entity2)
  - [Table of Contents](#table-of-contents)
  - [Install](#install)
  - [Introduction](#introduction)
  - [Define](#define)
  - [Query](#query)


## Install

```sh
$ npm install tiny-entity2
```

## Introduction

This is a ORM framework support Mysql IndexedDB, and Sqlite3.

## Define

you can define an entity model like this:
``` ts
@Define.Table({ TableName: "person" })
export class Person extends EntityObjectMysql<Person> {
    @Define.PrimaryKey()
    id: string;

    @Define.Column({ DataType: Define.DataType.Decimal, DataLength: 11, DecimalPoint: 3 })
    weight: number;

    @Define.Column()
    name: string;

    @Define.Column({ DataType: Define.DataType.INT, DataLength: 11 })
    age: number;

    @Define.Column({ DataType: Define.DataType.BIGINT })
    birth: number;
}
```

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


