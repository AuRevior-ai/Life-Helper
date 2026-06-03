const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const cloudfunctionsDir = path.join(rootDir, "cloudfunctions");
const rootSharedDir = path.join(cloudfunctionsDir, "_shared");

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(fullPath);
    }
    return [path.relative(dir, fullPath)];
  });
}

function listRelativeFiles(dir, baseDir = dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listRelativeFiles(fullPath, baseDir);
      }
      return [path.relative(baseDir, fullPath)];
    })
    .sort();
}

function fileHash(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function listCloudFunctionNames() {
  return fs
    .readdirSync(cloudfunctionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared")
    .filter((entry) =>
      fs.existsSync(path.join(cloudfunctionsDir, entry.name, "package.json")),
    )
    .map((entry) => entry.name)
    .sort();
}

function compareSharedCopy(functionName) {
  const localSharedDir = path.join(cloudfunctionsDir, functionName, "_shared");
  const problems = [];

  if (!fs.existsSync(localSharedDir)) {
    return [`${functionName}/_shared 缺失`];
  }

  const rootFiles = listRelativeFiles(rootSharedDir);
  const localFiles = listRelativeFiles(localSharedDir);
  const rootSet = new Set(rootFiles);
  const localSet = new Set(localFiles);

  for (const file of rootFiles) {
    if (!localSet.has(file)) {
      problems.push(`${functionName}/_shared/${file} 缺失`);
      continue;
    }

    const rootHash = fileHash(path.join(rootSharedDir, file));
    const localHash = fileHash(path.join(localSharedDir, file));
    if (rootHash !== localHash) {
      problems.push(`${functionName}/_shared/${file} 内容不一致`);
    }
  }

  for (const file of localFiles) {
    if (!rootSet.has(file)) {
      problems.push(`${functionName}/_shared/${file} 不在根共享目录中`);
    }
  }

  return problems;
}

if (!fs.existsSync(rootSharedDir)) {
  console.error("根共享目录不存在：cloudfunctions/_shared");
  process.exit(1);
}

const problems = listCloudFunctionNames().flatMap(compareSharedCopy);

if (problems.length > 0) {
  console.error("共享工具一致性检查失败：");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  console.error("可运行：node scripts/sync-cloudfunction-shared.js");
  process.exit(1);
}

console.log(
  "共享工具一致性检查通过：cloudfunctions/_shared 与各云函数 _shared 副本一致",
);

module.exports = {
  compareSharedCopy,
  listFiles,
  listRelativeFiles,
};
