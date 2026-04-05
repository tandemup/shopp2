#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIRS = ["src", "app"]
  .map((dir) => path.join(process.cwd(), dir))
  .filter((dir) => fs.existsSync(dir));

// extensiones a procesar
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

// comprobar si es archivo válido
function isCodeFile(file) {
  return EXTENSIONS.includes(path.extname(file));
}

// obtener todos los archivos de un directorio
function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath));
    } else if (isCodeFile(filePath)) {
      results.push(filePath);
    }
  }

  return results;
}

// resolver alias "@/..." a ruta relativa real
function resolveAliasImport(filePath, importPath) {
  if (!importPath.startsWith("@/")) return null;

  const cleanPath = importPath.slice(2); // quita "@/"
  const targetPath = path.join(process.cwd(), cleanPath);

  let relative = path.relative(path.dirname(filePath), targetPath);
  relative = relative.replace(/\\/g, "/");

  if (!relative.startsWith(".")) {
    relative = "./" + relative;
  }

  return relative;
}

// procesar imports y exports con from
function processFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  let updated = original;
  let changed = false;

  const patterns = [
    /(import\s+[^'"]*?\s+from\s+["'])(@\/[^"']+)(["'])/g,
    /(export\s+[^'"]*?\s+from\s+["'])(@\/[^"']+)(["'])/g,
  ];

  for (const regex of patterns) {
    updated = updated.replace(regex, (_, prefix, importPath, suffix) => {
      const resolved = resolveAliasImport(filePath, importPath);
      if (!resolved) return `${prefix}${importPath}${suffix}`;

      if (resolved !== importPath) {
        changed = true;
        console.log(`FIX: ${filePath}`);
        console.log(`   ${importPath} -> ${resolved}`);
      }

      return `${prefix}${resolved}${suffix}`;
    });
  }

  if (changed) {
    fs.writeFileSync(filePath, updated, "utf8");
  }
}

const files = ROOT_DIRS.flatMap(getAllFiles);

for (const file of files) {
  processFile(file);
}

console.log("\n✅ Imports convertidos en src/ y app/");
