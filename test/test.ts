import { DeskTable } from './models/table';
import { TableParty } from './models/tableParty';
import { Order } from './models/order';
import { TestDataContext } from './testDataContext';
import { Guid } from './guid';
import * as assert from "assert";
import { Person } from './models/person';

// describe("CreateDatabase and Tables", () => {
//     let ctx = new TestDataContext();
//     it("when database exist", async () => {
//         let r = await ctx.CreateDatabase();
//         console.log(r);
//     })
// });

describe("query data", () => {
    let ctx = new TestDataContext();
    let personList: Person[] = [];

    before(async () => {
        //insert 10 persons to database;
        for (let i = 0; i < 10; i++) {
            let person = new Person();
            person.id = Guid.GetGuid();
            person.name = "likecheng" + i;
            person.age = 30 + i;
            person.birth = new Date("1987-12-1").getTime();

            await ctx.Create(person);
            personList.push(person);
        }
    })

    it("no query criteria", async () => {
        let list = await ctx.Person.ToList();
        assert.equal(list.length, 10);
    })

    it("inculde query criteria", async () => {
        let age = 35;
        let list = await ctx.Person.Where(x => x.age > age, { age }).ToList();

        assert.equal(list.length, personList.filter(x => x.age > age).length);
        assert.equal(list.filter(x => x.age < 35), 0);
    })
    it("fuzzy query ", async () => {
        let params = {
            name: "likecheng"
        };
        let list = await ctx.Person.Where(x => x.name.indexOf(params.name), { "params.name": params.name }).ToList();
        assert.equal(list.length, 10);
    })
    it("select part ", async () => {
        let age = 35;
        let list = await ctx.Person.Where(x => x.age > age, { age }).Select(x => x.name).ToList();

        // assert.equal()
    })

    it("no data", async () => {
        await ctx.Delete<Person>(x => x.id != null, ctx.Person);
        let result = await ctx.Person.ToList();
        assert.equal(result.length, 0);
    })

    after(async () => {
        // clean person table from database;
        let list = await ctx.Person.ToList();
        for (let item of list) {
            await ctx.Delete(item);
        }
    })
})



