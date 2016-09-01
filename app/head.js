const $ = document.querySelector.bind(document)

const {clipboard} = require('electron')

const packageJSON = require('../package.json')

$('title').innerText = `${packageJSON.name} v${packageJSON.version}`