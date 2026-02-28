import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "dist/index.js",
  banner: { js: "#!/usr/bin/env node\nimport { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
  external: [],
});

if (watch) {
  await ctx.watch();
  console.error("Watching for changes...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.error("Build complete: dist/index.js");
}
