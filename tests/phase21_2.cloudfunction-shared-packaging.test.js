const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const cloudfunctionsDir = path.join(rootDir, 'cloudfunctions')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function listCloudFunctionNames() {
  return fs.readdirSync(cloudfunctionsDir)
    .filter((name) => fs.statSync(path.join(cloudfunctionsDir, name)).isDirectory())
    .filter((name) => fs.existsSync(path.join(cloudfunctionsDir, name, 'package.json')))
}

function listJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') return []
      return listJsFiles(fullPath)
    }
    return entry.name.endsWith('.js') ? [fullPath] : []
  })
}

test('cloudfunctions do not depend on parent directories when uploaded as single function packages', () => {
  const offenders = []
  for (const functionName of listCloudFunctionNames()) {
    const functionDir = path.join(cloudfunctionsDir, functionName)
    const files = listJsFiles(functionDir)
      .map((file) => path.relative(rootDir, file))

    for (const file of files) {
      const source = read(file)
      if (/require\(['"]\.\.\//.test(source)) {
        offenders.push(file)
      }
    }
  }

  assert.deepEqual(offenders, [])
})

test('cloudfunctions that use shared utilities carry a local _shared copy for WeChat upload', () => {
  const requiredFiles = ['response.js', 'payload.js', 'time.js', 'pagination.js', 'lbs-utils.js']
  const missing = []
  for (const functionName of listCloudFunctionNames()) {
    const functionDir = path.join(cloudfunctionsDir, functionName)
    const localFiles = fs.readdirSync(functionDir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => read(path.join('cloudfunctions', functionName, file)))

    if (!localFiles.some((source) => /require\(['"]\.\/_shared\//.test(source))) {
      continue
    }

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(functionDir, '_shared', file))) {
        missing.push(`${functionName}/_shared/${file}`)
      }
    }
  }

  assert.deepEqual(missing, [])
})
