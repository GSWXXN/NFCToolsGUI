const path = require("path");
const fs = require('fs');

module.exports = {
    packagerConfig: {
        packageManager: "npm",
        icon: "src/icons/icon",
        asar: true,
        overwrite: true,
        ignore: [
            "source",
            "compile.sh",
            "framework",
            "README*",
            "LICENSE",
            "doc",
            "dict.dic",
            ".gitignore",
            ".gitsubmodules",
            ".github",
            ".idea",
            ".vscode"
        ],
        extraResource: [
            "framework",
            "dict.dic"
        ]
    },
    makers: [
        {
            name: "@electron-forge/maker-zip",
            platforms: [
                "darwin",
                "linux",
                "win32"
            ]
        }
    ],
    hooks: {
        "packageAfterPrune": async (forgeConfig, buildPath) => {
            if (process.platform === "win32") return;
            const url = path.join(buildPath, 'node_modules/@serialport/bindings-cpp/build/node_gyp_bins')
            fs.unlink(path.join(url, "python3"), (err) => {
                if (err) throw err;

                fs.rmdir(url, (err) => {
                    if (err) throw err;
                })
            });
        }
    }
}