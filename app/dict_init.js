$('header h1').innerText = `${packageJSON.name}`
$('header').appendChild(document.createElement('p'))
$('header p').innerText = `${packageJSON.name} ${packageJSON.version}, Node ${process.versions.node}, Chrome ${process.versions.chrome}, Electron ${process.versions.electron}.`

function $P (text) {
  let p = document.createElement('p')
  p.innerText = text
  return p
}

const transactionOnabort = (event) => {
  if (event.target.error === null) {
    alert('(null) The transaction is not finished, is finished and successfully committed, or was aborted with IDBTransaction.abort function.')
  } else {
    alert(event.target.error)
  }
}

let request = indexedDB.open('dictDB')

request.onerror = (event) => {
  alert(event.target.error)
  let p = $P(`event.target.error`)
  p.style.color = 'red'
  p.style.fontWeight = 'bold'
  $('#info').appendChild(p)
}

request.onupgradeneeded = (event) => {
  let db = event.target.result
  let store = db.createObjectStore('dictStore', {autoIncrement: true})
  store.createIndex('jp', 'jp', {unique: false, multiEntry: true})
  store.createIndex('cn', 'cn', {unique: false, multiEntry: true})
  store.createIndex('en', 'en', {unique: false, multiEntry: true})
  $('#info').appendChild($P('on upgrade needed:'))
  $('#info').appendChild($P(`oldVersion: ${event.oldVersion}, newVersion: ${event.newVersion}`))
}

request.onsuccess = (event) => {
  let db = event.target.result
  $('#info').appendChild($P('on success:'))
  $('#info').appendChild($P(`current version: ${db.version}`))

  let countTransaction = db.transaction('dictStore', 'readwrite')
  countTransaction.onabort = transactionOnabort
  let store = countTransaction.objectStore('dictStore')
  let countRequest = store.count()

  countRequest.onsuccess = () => {
    let count = countRequest.result
    const dbJSON = require('./database.json')
    let len = Object.keys(dbJSON).length
    $('#info').appendChild($P('Open objectStore ... successful'))
    $('#info').appendChild($P(`How many records in   indexedDB  : ${count}`))
    $('#info').appendChild($P(`How many records in database.json: ${len}`))

    for (key in dbJSON) {
      store.add(dbJSON[key], parseInt(key))
    }

  }

  db.close()
  let transaction2 = db.transaction('dictStore', 'readonly')
}