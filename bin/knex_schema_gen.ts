#!/usr/bin/env node

import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import { cwd, exit } from 'process'
import { 删除所有表, 新建表, 生成ts类型描述 } from '../src/index'
import mkdirp from 'mkdirp'

var packageFile = null
try {
    packageFile = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json')).toString())
} catch (e) {
    throw '解析package文件失败'
}

var program = new Command()

program
    .name('lsby_knex_schema_gen')
    .usage('[options]')
    .addHelpText('beforeAll', '通过schema文件重建数据库')
    .requiredOption('-c, --conf <conf_file.js>', '数据库配置文件')
    .option('-s, --schema <schema_file.js>', 'schema文件')
    .option('-o, --out <types_file.ts>', 'ts类型文件输出路径')
    .version(packageFile.version, '-v, --ver', '输出版本号')
    .addHelpText(
        'after',
        `
命令示例:

    清空给定配置文件的数据库, 并通过schema文件重建表结构:
    lsby_knex_schema_gen -c ./dbConf.js -s ./schemaFile.js

    读取给定配置文件的数据库, 生成knex对应的ts类型描述文件:
    lsby_knex_schema_gen -c ./dbConf.js -o ./types.ts

    清空给定配置文件的数据库, 通过schema文件重建表结构, 同时生成knex对应的ts类型描述文件:
    lsby_knex_schema_gen -c ./dbConf.js -s ./schemaFile.js -o ./types.ts

文件示例:

    dbconf 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/doc/dbconf.js
    schema 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/doc/schema.js

也可以在代码中使用, 更多信息:
    https://github.com/lsby/knex_schema_gen
        `,
    )

async function main() {
    program.parse(process.argv)
    var opts = program.opts()

    var conf = path.resolve(cwd(), opts.conf)

    if (!fs.existsSync(conf)) {
        console.error(`配置文件不存在: ${conf}`)
        exit(1)
    }

    if (opts.schema == null && opts.out == null) {
        console.error('输入不正确, -s和-o必选一个, 请使用-h查看帮助.')
        exit(1)
    }

    var confObj = (await import(conf)).default
    if (opts.schema != null) {
        var schema = path.resolve(cwd(), opts.schema)
        if (!fs.existsSync(schema)) {
            console.error(`schema文件不存在: ${schema}`)
            exit(1)
        }
        var schemaObj = (await import(schema)).default

        await 删除所有表(confObj)
        console.log('删除表成功')

        await 新建表(confObj, schemaObj)
        console.log('重建表成功')
    }

    if (opts.out != null) {
        var out = path.resolve(cwd(), opts.out)
        var s = await 生成ts类型描述(confObj)
        await mkdirp(path.dirname(out))
        fs.writeFileSync(out, s)
        console.log('生成类型描述成功')
    }
}
main()
