const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'public', 'css', 'tailwind-aegis.css');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

function collectCandidates() {
  const candidates = new Set();
  const files = walk(path.join(root, 'public')).filter((file) => /\.(html|js)$/.test(file));
  const token = /[A-Za-z0-9_:/.[\]%-]+/g;
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(token)) {
      const value = match[0];
      if (value.length <= 100 && !value.includes('/api/')) candidates.add(value);
    }
  }
  // Dynamic/escaped utilities that can otherwise be hard to discover from source text.
  [
    'ring-cyan-400/10', 'ring-cyan-400/20', 'focus:ring-cyan-400/30',
    'hover:scale-[1.01]', 'md:grid-cols-2', 'md:col-span-2'
  ].forEach((value) => candidates.add(value));
  return [...candidates];
}

async function main() {
  let entry;
  try {
    entry = require.resolve('tailwindcss');
  } catch {
    if (fs.existsSync(output) && fs.statSync(output).size > 500) {
      console.warn('Tailwind package is not installed; using the committed prebuilt stylesheet. Run npm install before deployment to enable recompilation.');
      return;
    }
    throw new Error('tailwindcss is unavailable and no prebuilt Tailwind stylesheet exists.');
  }

  const pkgRoot = path.resolve(path.dirname(entry), '..');
  const { compile } = require(entry);
  if (typeof compile !== 'function') {
    throw new Error('Installed tailwindcss package does not expose the expected compile() API. Use the pinned package version.');
  }

  const input = [
    '@layer theme, utilities;',
    '@import "tailwindcss/theme.css" layer(theme);',
    '@import "tailwindcss/utilities.css" layer(utilities);'
  ].join('\n');

  const compiler = await compile(input, {
    base: root,
    async loadStylesheet(id, base) {
      const stylesheet = id.startsWith('tailwindcss/')
        ? path.join(pkgRoot, id.slice('tailwindcss/'.length))
        : path.resolve(base, id);
      return {
        path: stylesheet,
        base: path.dirname(stylesheet),
        content: fs.readFileSync(stylesheet, 'utf8')
      };
    }
  });

  const css = compiler.build(collectCandidates());
  const banner = '/* Generated locally by scripts/build-tailwind.js. Do not edit by hand. */\n';
  fs.writeFileSync(output, banner + css, 'utf8');
  console.log(`Tailwind stylesheet generated: ${path.relative(root, output)} (${css.length} bytes)`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
