import * as _knex from 'knex'
import { Knex } from 'knex'

export default function (knex: Knex<any, unknown[]>): Knex.SchemaBuilder {
    var r = knex.schema
        .createTable('学生表', function (table) {
            table.increments()
            table.string('姓名').notNullable()
            table.enum('性别', ['男', '女']).notNullable()
            table.integer('所属班级id').unsigned().notNullable().references('班级表.id')
            table.timestamp('created_at').defaultTo(knex.fn.now())
        })
        .createTable('班级表', function (table) {
            table.increments()
            table.string('名称').notNullable()
            table.timestamp('created_at').defaultTo(knex.fn.now())
        })

    return r
}
