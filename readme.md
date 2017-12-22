# tiny-entity2

## Table of Contents
* [Install](#install) 
* [Introduction](#introduction)
* [Define](#define)


## Install

```sh
$ npm install tiny-entity2
```

## Introduction

This is a ORM framework spport Mysql IndexedDB.

## Define

you can define entity like this:
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

