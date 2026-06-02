const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const cloudfunctionsDir = path.join(rootDir, 'cloudfunctions')
const versions = new Map()

for (const entry of fs.readdirSync(cloudfunctionsDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === '_shared') {
    continue
  }

  const packagePath = path.join(cloudfunctionsDir, entry.name, 'package.json')
  if (!fs.existsSync(packagePath)) {
    continue
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  const version = pkg.dependencies && pkg.dependencies['wx-server-sdk']
  if (!version) {
    console.error(`云函数缺少 wx-server-sdk 依赖：${entry.name}`)
    process.exit(1)
  }

  if (!versions.has(version)) {
    versions.set(version, [])
  }
  versions.get(version).push(entry.name)
}

if (versions.size !== 1) {
  console.error('云函数 wx-server-sdk 版本不一致：')
  for (const [version, names] of versions.entries()) {
    console.error(`- ${version}: ${names.join(', ')}`)
  }
  process.exit(1)
}

const [version] = versions.keys()
console.log(`云函数 wx-server-sdk 版本一致：${version}`)
