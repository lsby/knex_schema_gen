import 'mocha'
import { 删除所有表, 新建数据库, 新建表, 生成ts类型描述, 配置格式 } from '../src/index'
import schema from './schema'

var conf: 配置格式 = {
    client: 'mysql',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'test',
    },
}

describe('测试组', function () {
    it('新建数据库', async function () {
        await 新建数据库(conf, 'test')
    })
    it('删除所有表', async function () {
        await 删除所有表(conf)
    })
    it('新建表', async function () {
        await 新建表(conf, schema)
    })
    it('生成ts类型描述', async function () {
        var 类型描述 = await 生成ts类型描述(conf)

        var s = `
            import { Knex } from "knex"

            interface 学生表 { id: number, 姓名: string, 性别: '男' | '女', 所属班级id: number, created_at: string }
            interface 班级表 { id: number, 名称: string, created_at: string }

            declare module "knex/types/tables" {
                interface Tables {
                    学生表: Knex.CompositeTableType<学生表, Pick<学生表, '姓名' | '性别' | '所属班级id'> & Partial<Pick<学生表, 'id' | 'created_at'>>, Partial<Omit<学生表, 'id'>>>
                    班级表: Knex.CompositeTableType<班级表, Pick<班级表, '名称'> & Partial<Pick<班级表, 'id' | 'created_at'>>, Partial<Omit<班级表, 'id'>>>
                }
            }
        `

        if (多行文本比较(归一化多行文本(类型描述), 归一化多行文本(s))) {
            throw '意外的输出'
        }
    })
})

function 多行文本比较(a: string, b: string) {
    var a_arr = a.split('\n')
    var b_arr = b.split('\n')
    return JSON.stringify(a_arr) == JSON.stringify(b_arr)
}
function 归一化多行文本(s: string) {
    return 归一化行尾(s)
        .split('\n')
        .map((a) => a.trim())
        .join('\n')
}
function 归一化行尾(s: string) {
    return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}
