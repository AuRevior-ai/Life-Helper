const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const cloudfunctionsDir = path.join(rootDir, 'cloudfunctions')
const rootSharedDir = path.join(cloudfunctionsDir, '_shared')

function listCloudFunctionNames() {
  return fs.readdirSync(cloudfunctionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '_shared')
    .filter((entry) => fs.existsSync(path.join(cloudfunctionsDir, entry.name, 'package.json')))
    .map((entry) => entry.name)
    .sort()
}

function copyDir(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true })
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
    } else {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

function syncSharedCopy(functionName) {
  const functionDir = path.join(cloudfunctionsDir, functionName)
  const targetDir = path.join(functionDir, '_shared')
  const resolvedTarget = path.resolve(targetDir)
  const resolvedFunctionDir = path.resolve(functionDir)

  if (!resolvedTarget.startsWith(resolvedFunctionDir + path.sep)) {
    throw new Error(`拒绝同步到云函数目录之外：${resolvedTarget}`)
  }

  fs.rmSync(targetDir, { recursive: true, force: true })
  copyDir(rootSharedDir, targetDir)
  return functionName
}

if (!fs.existsSync(rootSharedDir)) {
  console.error('根共享目录不存在：cloudfunctions/_shared')
  process.exit(1)
}

const synced = listCloudFunctionNames().map(syncSharedCopy)
console.log(`共享工具同步完成：${synced.join(', ')}`)

module.exports = {
  copyDir,
  syncSharedCopy
}
