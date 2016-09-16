const $ = document.querySelector.bind(document)

const packageJSON = require('../package.json')

$('title').innerText = `${packageJSON.name} v${packageJSON.version}`

// Prevent Electron app from redirecting when drag'n-dropping.
// http://stackoverflow.com/questions/31670803/prevent-electron-app-from-redirecting-when-dragdropping-items-in-window
window.onload = function () {
  document.addEventListener('dragover', (event) => {
    event.preventDefault()
    return false
  }, false)
  document.addEventListener('drop', (event) => {
    event.preventDefault()
    return false
  }, false)
}