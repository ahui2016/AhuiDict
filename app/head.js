const $ = document.querySelector.bind(document)
const $A = document.querySelectorAll.bind(document)
const $CE = document.createElement.bind(document)

const package = require('../package.json')

$('title').innerText = `${package.name} v${package.version}`
