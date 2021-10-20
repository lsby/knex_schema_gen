# knex-schema-gen

通过 schema 文件生成数据库表结构(仅支持 mysql), 同时生成 ts 类型描述.

## 快速开始

### 命令行用法

```shell
npx @lsby/knex-schema-gen -c ./dbconf.js -s ./schema.js -o ./types.ts
```

dbconf 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/doc/conf.js
schema 文件示例: https://raw.githubusercontent.com/lsby/knex_schema_gen/master/doc/schema.js

### 代码用法

```typescript
import { 删除所有表, 新建表, 生成ts类型描述 } from '@lsby/knex_schema_gen'
import schema from './schema'
import conf from './conf'

async function main() {
  await 删除所有表(conf)
  await 新建表(conf, schema)
  var 类型描述 = await 生成ts类型描述(conf)
  console.log(类型描述)
}
main()
```
