#!/usr/bin/env node

/*
 * Simple build script for Portfolio B
 * - Cleans and recreates dist/
 * - Copies index.html and assets/
 * - Minifies JS in dist/assets/js using terser
 * - Minifies CSS (assets/css/main.css) into dist/assets/css/main.css using clean-css-cli
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { minify } = require('terser');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const srcAssetsDir = path.join(projectRoot, 'assets');
const distAssetsDir = path.join(distDir, 'assets');

function sh(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function minifyJsDir(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await minifyJsDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const source = fs.readFileSync(fullPath, 'utf8');
      const result = await minify(source, {
        compress: true,
        mangle: true,
      });
      if (result.error) {
        console.error(`Terser error in ${fullPath}:`, result.error);
        process.exitCode = 1;
        continue;
      }
      fs.writeFileSync(fullPath, result.code, 'utf8');
    }
  }
}

(async () => {
  // 1) Clean and recreate dist
  if (fs.existsSync(distDir)) {
    sh(`rm -rf ${distDir}`);
  }
  ensureDir(distDir);

  // 2) Copy index.html and assets/
  sh(`cp ${path.join(projectRoot, 'index.html')} ${distDir}`);
  sh(`cp -R ${srcAssetsDir} ${distDir}`);

  // 3) Minify JS under dist/assets/js
  const distJsDir = path.join(distAssetsDir, 'js');
  await minifyJsDir(distJsDir);

  // 4) Minify CSS main file into dist/assets/css/main.css
  const srcCss = path.join(srcAssetsDir, 'css', 'main.css');
  const distCssDir = path.join(distAssetsDir, 'css');
  ensureDir(distCssDir);
  const distCss = path.join(distCssDir, 'main.css');

  // Use local clean-css-cli via npx so no global install is required.
  sh(`npx cleancss -o ${distCss} ${srcCss}`);

  console.log('Build complete: dist/ ready.');
})();
