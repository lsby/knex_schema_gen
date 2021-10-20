# knex_schema_gen

通过 schema 文件生成数据库表结构(仅支持 mysql), 同时生成 ts 类型描述.

## 能做什么

knex 是一个通过链式写法组装 sql 的库, 同时它提供了 schema 来通过链式写法构造数据库结构. 地址: https://github.com/knex/knex

这个库可以方便的让你通过 knex 的 schema 轻松构造表结构. schema 的语法参考: https://knexjs.org/#Schema-createTable

如果你使用 ts 且使用 knex 拼接 sql 语句, 这个库还可以通过数据库结构生成 ts 用的 types 文件. 参考: https://knexjs.org/#typescript-support

## 快速开始

### 命令行用法

**注意: 若带有-s 参数, 会清空数据库的所有数据, 请谨慎操作.**

```shell
npx @lsby/knex_schema_gen@latest -c ./dbconf.js -s ./schema.js -o ./types.ts
```

dbconf 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/doc/dbconf.js

schema 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/doc/schema.js

### 代码用法

安装:

```shell
npm i @lsby/knex_schema_gen
```

```typescript
import { 删除所有表, 新建表, 生成ts类型描述 } from '@lsby/knex_schema_gen'
import { schema } from './schema'
import { dbconf } from './dbconf'

async function main() {
  await 删除所有表(dbconf)
  await 新建表(dbconf, schema)
  var 类型描述 = await 生成ts类型描述(dbconf)
  console.log(类型描述)
}
main()
```

dbconf 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/test/dbconf.ts

schema 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/test/schema.ts
