const esbuild = require("esbuild")
const server = require("live-server")

esbuild
  .build({
    entryPoints: ["index.js"],
    bundle: true,
    outdir: "dist",
    format: "esm",
    platform: "browser",
    watch: {
      onRebuild(error, result) {
        if (error) console.error("watch build failed:", error)
        else console.log("watch build succeeded")
      },
    },
  })
  .then((result) => {
    server.start({
      port: 3000,
      root: "dist",
      open: false,
      cors: true,
    })
  })
  .catch(() => process.exit(1))
