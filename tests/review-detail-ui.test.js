const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

test('user review detail page uses structured visual sections instead of plain text rows', () => {
  const wxml = read('miniprogram/pages/review/detail/detail.wxml')
  const wxss = read('miniprogram/pages/review/detail/detail.wxss')

  assert.match(wxml, /review-card/)
  assert.match(wxml, /rating-badge/)
  assert.match(wxml, /content-section/)
  assert.match(wxml, /section-label/)
  assert.match(wxml, /section-body/)
  assert.match(wxml, /追评/)
  assert.match(wxml, /师傅回复/)

  assert.match(wxss, /\.review-card/)
  assert.match(wxss, /\.rating-badge/)
  assert.match(wxss, /\.content-section/)
  assert.match(wxss, /border-bottom/)
  assert.match(wxss, /font-weight:\s*600/)
})
