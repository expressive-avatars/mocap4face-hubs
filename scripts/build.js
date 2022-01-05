const esbuild = require("esbuild")

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    outdir: "dist",
    format: "esm",
    platform: "browser",
    minify: true,
  })
  .then((result) => {
    console.log("build finished")
  })
