const fs = require('fs/promises')

await $`rm -rf publish`

await $`nest build`

await $`cd dev-web && yarn && yarn build`

await $`cp -r ./dist/dev ./publish`

const json = JSON.parse(await fs.readFile('./package.json', 'utf-8'))
delete json.devDependencies
delete json.jest
delete json.scripts

await fs.writeFile('./publish/package.json', JSON.stringify(json, null, 2))