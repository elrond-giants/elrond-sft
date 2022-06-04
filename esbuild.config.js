const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    minify: true,
    outdir: "build",
    platform: "node",
    external: ["prompts", "@elrondnetwork/erdjs", "axios"],
  })
  .catch(() => process.exit(1));
