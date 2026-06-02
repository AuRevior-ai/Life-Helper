const fs = require('node:fs')
const path = require('node:path')

const targetDir = path.resolve(process.argv[2] || 'release')

const forbiddenMatchers = [
  { label: '.git directory', test: (relativePath, entry) => relativePath === '.git' && entry.isDirectory() },
  { label: 'node_modules directory', test: (relativePath, entry) => /(^|[\\/])node_modules$/.test(relativePath) && entry.isDirectory() },
  { label: 'miniprogram_npm directory', test: (relativePath, entry) => relativePath === 'miniprogram_npm' && entry.isDirectory() },
  { label: 'env file', test: (relativePath) => /(^|[\\/])\.env(\..*)?$/.test(relativePath) },
  { label: 'private project config', test: (relativePath) => path.basename(relativePath) === 'project.private.config.json' },
  { label: 'log file', test: (relativePath) => /\.log$/i.test(relativePath) },
  { label: 'certificate or private key', test: (relativePath) => /\.(pem|key|crt|cer|p12|pfx)$/i.test(relativePath) },
  { label: 'temporary archive', test: (relativePath) => /\.(zip|tar|tar\.gz|rar|7z)$/i.test(relativePath) },
  { label: 'test output', test: (relativePath) => /(^|[\\/])(coverage|test-results|playwright-report|\.nyc_output)([\\/]|$)/.test(relativePath) },
  { label: 'real payment config', test: (relativePath) => /wechat-pay|apiclient_|mchid|apiv3/i.test(relativePath) }
]

function walk(dir, baseDir = dir, risks = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)

    for (const matcher of forbiddenMatchers) {
      if (matcher.test(relativePath, entry)) {
        risks.push({ type: matcher.label, path: relativePath })
      }
    }

    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walk(fullPath, baseDir, risks)
    }
  }

  return risks
}

if (!fs.existsSync(targetDir)) {
  console.log(`交付风险检查跳过：目录不存在 ${targetDir}`)
  process.exit(0)
}

const risks = walk(targetDir)
if (risks.length > 0) {
  console.log('交付风险检查失败：候选交付目录包含以下敏感或本地生成文件：')
  for (const risk of risks) {
    console.log(`- ${risk.type}: ${risk.path}`)
  }
  process.exit(1)
}

console.log(`交付风险检查通过：${targetDir}`)
