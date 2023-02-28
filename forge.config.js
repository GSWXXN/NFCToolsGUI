const path = require("path");
const fs = require('fs');
const { execSync } = require('child_process');
const os = require("os");

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
        "generateAssets": () => {
            const hash = execSync('git rev-parse --short HEAD').toString().trim();
            const version = require('./package.json').version;

            const data = {
                version: `v${version}-${hash}`,
                builder: process.env["NFCTOOLSGUI_COMPILER"] ? process.env["NFCTOOLSGUI_COMPILER"] : os.userInfo().username
            }

            fs.writeFileSync('./src/buildInfo.json', JSON.stringify(data, null, 2), 'utf-8');
        },
        "packageAfterPrune": async (forgeConfig, buildPath) => {
            const url = path.join(buildPath, 'node_modules/@serialport/bindings-cpp/build/node_gyp_bins')
            fs.unlink(path.join(url, "python3"), () => {
                fs.rmdir(url, () => {})
            });
        }
    }
}