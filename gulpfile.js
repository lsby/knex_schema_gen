var { watch } = require('gulp')
var path = require('path')
var exec = require('@lsby/exec_cmd').default

exports.编译ts = async function 编译ts() {
    process.stdout.write('编译ts...')
    await exec(
        `node ${path.resolve(__dirname, './node_modules/typescript/bin/tsc')} -p ${path.resolve(
            __dirname,
            './tsconfig.json',
        )}`,
        { cwd: path.resolve(__dirname, '.') },
    )
    console.log('ok')
}
exports.持续编译ts = async function 持续编译ts() {
    process.stdout.write('持续编译ts...')
    watch('src/**/*.ts', { ignoreInitial: false }, exports.编译ts)
    console.log('ok')
}
exports.测试 = async function 测试() {
    await exports.编译ts()

    process.stdout.write('测试...')
    var r = await exec(
        `node ${path.resolve(__dirname, './node_modules/mocha/bin/mocha')} --colors --bail dist/test/**/*.test.js`,
        { cwd: path.resolve(__dirname, '.') },
    )

    console.log('ok')
    console.log('测试信息:\n', r.join('\n'))
}
exports.清理一切 = async function 清理一切() {
    process.stdout.write('清理一切...')
    await exec(`rm -rf ./dist`, { cwd: path.resolve(__dirname, '.') })
    await exec(`rm -rf ./node_modules`, { cwd: path.resolve(__dirname, '.') })
    await exec(`rm -rf ./.nyc_output`, { cwd: path.resolve(__dirname, '.') })
    await exec(`rm -rf ./coverage`, { cwd: path.resolve(__dirname, '.') })
    console.log('ok')
}
exports.发布到npm = async function 发布到npm() {
    await exports.测试()

    process.stdout.write('发布到npm...')
    var r = await exec(`npm publish --access=public`, { cwd: path.resolve(__dirname, '.') })

    console.log('ok')
    console.log('发布信息:\n', r.join('\n'))
}
