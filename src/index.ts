import _knex from 'knex'
import { Knex } from 'knex'
var mysql = require('mysql')

export type 配置格式 = {
    host: string
    user: string
    password: string
    database: string
}
export async function 新建数据库(conf: 配置格式, 数据库名称: string) {
    var connection = mysql.createConnection({
        host: conf.host,
        user: conf.user,
        password: conf.password,
    })

    connection.connect()

    await new Promise((res, rej) => {
        connection.query(
            `create database If Not Exists ${数据库名称} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
            function (error: any, results: any, fields: any) {
                if (error) return rej(error)
                res(null)
            },
        )
    })

    connection.end()
}
export async function 删除所有表(conf: 配置格式) {
    var knex = _knex({
        client: 'mysql',
        connection: conf,
    })

    try {
        var 所有表: string[] = (
            await knex.select('TABLE_NAME').from('information_schema.TABLES').where({ table_schema: conf.database })
        ).map((a: any) => a.TABLE_NAME)

        var 删除所有外键约束: string[] = (
            await knex.raw(`
            SELECT concat('alter table ',table_schema,'.',table_name,' DROP FOREIGN KEY ',constraint_name,';')
            FROM information_schema.table_constraints
            WHERE constraint_type='FOREIGN KEY'
            AND table_schema='${conf.database}'
        `)
        )[0].map((a: any) => (Object.values(a)[0] as string).trim())
        for (var sql of 删除所有外键约束) {
            await knex.raw(sql)
        }

        var 删除所有表 = await Promise.all(所有表.map((a) => knex.schema.dropTable(a)))
        await knex.destroy()
    } catch (e) {
        await knex.destroy()
        throw e
    }
}
export async function 新建表(conf: 配置格式, schema: (knex: Knex<any, unknown[]>) => Knex.SchemaBuilder) {
    var knex = _knex({
        client: 'mysql',
        connection: conf,
    })

    try {
        var cmd = await schema(knex).generateDdlCommands()
        var sqlarr: string[] = cmd.sql
            .map((a) => (a as any).sql)
            .sort((a, b) => {
                if (a.indexOf('create table') != -1) {
                    return -1
                }
                if (b.indexOf('create table') != -1) {
                    return 1
                }
                if (a.indexOf('foreign key') != -1) {
                    return 1
                }
                if (b.indexOf('foreign key') != -1) {
                    return -1
                }
                return a - b
            })

        for (var sql of sqlarr) {
            await knex.raw(sql)
        }

        await knex.destroy()
    } catch (e) {
        await knex.destroy()
        throw e
    }
}
export async function 生成ts类型描述(conf: 配置格式) {
    var knex = _knex({
        client: 'mysql',
        connection: conf,
    })

    try {
        var 描述 = await knex
            .select<
                {
                    TABLE_NAME: string
                    COLUMN_NAME: string
                    COLUMN_DEFAULT: null | 'CURRENT_TIMESTAMP'
                    IS_NULLABLE: 'NO' | 'YES'
                    DATA_TYPE: 'timestamp' | 'int' | 'varchar' | 'enum' | 'double' | 'tinyint' | 'decimal'
                    COLUMN_TYPE: string
                    EXTRA: 'DEFAULT_GENERATED' | 'auto_increment' | ''
                    COLUMN_COMMENT: string
                }[]
            >()
            .from('information_schema.columns')
            .where({ table_schema: conf.database })

        var 整理 = 描述
            .map((a) => a.TABLE_NAME)
            .map((a) => ({ 表名: a, 描述: 描述.filter((b) => b.TABLE_NAME == a) }))
            .map((a) => ({
                ...a,
                描述: a.描述.map((b) => ({
                    ...b,
                    翻译类型: (function () {
                        var 结果 = ''
                        var 空补充 = b.IS_NULLABLE == 'YES' ? ' | null' : ''

                        if (b.DATA_TYPE == 'int') {
                            结果 = 'number'
                        } else if (b.DATA_TYPE == 'double') {
                            结果 = 'number'
                        } else if (b.DATA_TYPE == 'varchar') {
                            结果 = 'string'
                        } else if (b.COLUMN_TYPE == 'tinyint(1)') {
                            结果 = '0 | 1'
                        } else if (b.DATA_TYPE == 'tinyint') {
                            结果 = 'number'
                        } else if (b.DATA_TYPE == 'decimal') {
                            结果 = 'number'
                        } else if (b.DATA_TYPE == 'enum') {
                            结果 = (b.COLUMN_TYPE as string)
                                .replace(/enum\((.*)\)/, '$1')
                                .split(',')
                                .join(' | ')
                        } else {
                            结果 = 'string'
                        }

                        return 结果 + 空补充
                    })(),
                })),
            }))

        var ts描述 = [
            ['import { Knex } from "knex"'],
            [''],
            [
                ...new Set(
                    整理.map(
                        (a) =>
                            `interface ${a.表名} { ${a.描述
                                .map((b) => `${b.COLUMN_NAME}: ${b.翻译类型}`)
                                .join(', ')} }`,
                    ),
                ),
            ],
            [''],
            ['declare module "knex/types/tables" {'],
            ['    interface Tables {'],
            [
                ...new Set(
                    整理.map(
                        (a) =>
                            `        ${a.表名}: Knex.CompositeTableType<${a.表名}, Pick<${a.表名}, ${
                                [
                                    ...new Set(
                                        a.描述
                                            .filter(
                                                (a) =>
                                                    a.IS_NULLABLE == 'NO' &&
                                                    a.COLUMN_DEFAULT == null &&
                                                    a.EXTRA != 'DEFAULT_GENERATED' &&
                                                    a.EXTRA != 'auto_increment',
                                            )
                                            .map((a) => `'${a.COLUMN_NAME}'`),
                                    ),
                                ].join(' | ') || 'never'
                            }> & Partial<Pick<${a.表名}, ${
                                [
                                    ...new Set(
                                        a.描述
                                            .filter(
                                                (a) =>
                                                    !(
                                                        a.IS_NULLABLE == 'NO' &&
                                                        a.COLUMN_DEFAULT == null &&
                                                        a.EXTRA != 'DEFAULT_GENERATED' &&
                                                        a.EXTRA != 'auto_increment'
                                                    ),
                                            )
                                            .map((a) => `'${a.COLUMN_NAME}'`),
                                    ),
                                ].join(' | ') || 'never'
                            }>>, Partial<Omit<${a.表名}, 'id'>>>`,
                    ),
                ),
            ],
            ['    }'],
            ['}'],
            [''],
        ]
            .map((a) => a.join('\n'))
            .join('\n')

        await knex.destroy()
        return ts描述
    } catch (e) {
        await knex.destroy()
        throw e
    }
}
