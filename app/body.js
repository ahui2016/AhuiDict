$('header h1').innerText = 'Hello World!'
$('header').appendChild($CE('p'))
$('header p').innerText = `We are using node ${process.versions.node}, Chrome ${process.versions.chrome}, and Electron ${process.versions.electron}.`