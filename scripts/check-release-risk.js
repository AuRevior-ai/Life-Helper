const fs = require('node:fs')
const path = require('node:path')

const scanArg = process.argv[2] || '.'
const targetDir = path.resolve(scanArg)

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/')
}

function isAllowedReferenceFile(relativePath) {
  const normalized = toPosix(relativePath)
  const basename = path.basename(normalized)
  return (
    normalized.startsWith('docs/') ||
    normalized.startsWith('tests/') ||
    /\.test\.js$/i.test(normalized) ||
    /\.example\./i.test(basename) ||
    /(^|[/._-])(mock|example)([/._-]|$)/i.test(normalized) ||
    normalized === 'cloudfunctions/payment/wechat-pay-client.js'
  )
}

function hasSensitivePaymentContent(fullPath, relativePath, entry) {
  if (entry.isDirectory() || isAllowedReferenceFile(relativePath)) {
    return false
  }

  const basename = path.basename(relativePath).toLowerCase()
  if (['apiclient_key.pem', 'apiclient_cert.pem'].includes(basename)) {
    return true
  }

  let content = ''
  try {
    content = fs.readFileSync(fullPath, 'utf8')
  } catch (error) {
    return false
  }

  return (
    /-----BEGIN (RSA |EC |)PRIVATE KEY-----/.test(content) ||
    /\b(?:mchid|merchant_id)\s*[:=]\s*['"]?\d{8,}['"]?/i.test(content) ||
    /\b(?:apiv3|api_v3|apiV3)Key\s*[:=]\s*['"][A-Za-z0-9_-]{32,}['"]/i.test(content) ||
    /\bWECHAT_PAY_(?:MCH_ID|API_V3_KEY|PRIVATE_KEY|CERT_SERIAL_NO)\s*=.+/i.test(content)
  )
}

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
  { label: 'real payment config', test: (relativePath, entry, fullPath) => hasSensitivePaymentContent(fullPath, relativePath, entry) }
]

function walk(dir, baseDir = dir, risks = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)

    for (const matcher of forbiddenMatchers) {
      if (matcher.test(relativePath, entry, fullPath)) {
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
  console.error(`待扫描目录不存在：${targetDir}`)
  console.error('用法：npm run check:release-risk -- <候选交付目录>')
  console.error('未传入目录时默认扫描当前工程。')
  process.exit(1)
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
