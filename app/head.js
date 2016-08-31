const $ = document.querySelector.bind(document)

const packageJSON = require('../package.json')

$('title').innerText = `${packageJSON.name} v${packageJSON.version}`