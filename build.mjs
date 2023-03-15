const fs = require('fs/promises')

await $`rm -rf publish`
await $`pnpm --parallel run build`
await $`cp -r ./packages/dev/dist/dev ./publish`
await $`cp -r ./packages/web/dist ./publish/public`

const json = JSON.parse(await fs.readFile('./packages/dev/package.json', 'utf-8'))
delete json.devDependencies
delete json.jest
delete json.scripts

await fs.writeFile('./publish/package.json', JSON.stringify(json, null, 2))