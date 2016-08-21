const $ = document.querySelector.bind(document)
const $A = document.querySelectorAll.bind(document)
const $CE = document.createElement.bind(document)
const $log = console.log.bind(console)

function $P (text) {
  let p = $CE('p')
  p.innerText = text
  return p
}

const packageJSON = require('../package.json')

$('title').innerText = `${packageJSON.name} v${packageJSON.version}`