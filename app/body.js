$('header h1').innerText = `${packageJSON.name}`
$('header').appendChild($CE('p'))
$('header p').innerText = `${packageJSON.name} ${packageJSON.version}, Node ${process.versions.node}, Chrome ${process.versions.chrome}, Electron ${process.versions.electron}.`

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
  store.createIndex('ja', 'ja', {unique: false, multiEntry: true})
  store.createIndex('cn', 'cn', {unique: false, multiEntry: true})
  store.createIndex('en', 'en', {unique: false, multiEntry: true})
  $('#info').appendChild($P('on upgrade needed:'))
  $('#info').appendChild($P(`oldVersion: ${event.oldVersion}, newVersion: ${event.newVersion}`))
}

request.onsuccess = (event) => {
  let db = event.target.result
  $('#info').appendChild($P('on success:'))
  $('#info').appendChild($P(`current version: ${db.version}`))

  let transaction = db.transaction('dictStore', 'readonly')
  
  transaction.onabort = (event) => {
    if (event.target.error === null) {
      alert('(null) The transaction is not finished, is finished and successfully committed, or was aborted with IDBTransaction.abort function.')
    } else {
      alert(event.target.error)
    }
  }
  
  let store = transaction.objectStore('dictStore')
  let countRequest = store.count()

  countRequest.onsuccess = () => {
    let count = countRequest.result
    const dbJSON = require('./database.json')
    let len = Object.keys(dbJSON).length
    $('#info').appendChild($P('Open objectStore ... successful'))
    $('#info').appendChild($P(`How many records in   indexedDB  : ${count}`))
    $('#info').appendChild($P(`How many records in database.json: ${len}`))

    if (count === len) {
      $('#info').appendChild($P('Quantity checking ... OK!'))
      $('#info').appendChild($P('Click the "Continue" button to display all words.'))
      let button = $CE('input')
      $('#info').appendChild(button)
      button.setAttribute('type', 'button')
      button.value = 'Continue'

      button.onclick = () => {
        $('#info').style.display = 'none'
        $('#words h2').innerText = `${count} words in the dictionary.`
        
        let store = db.transaction('dictStore').objectStore('dictStore')
        store.openCursor().onsuccess = (event) => {
          let cursor = event.target.result
          if (cursor) {
            let fieldset = wordFieldset(cursor.key, cursor.value)
            $('#words').appendChild(fieldset)
            cursor.continue()
          } else {
            $('#words').appendChild($P('All words has been listed out.'))
          }
        }
      }
    } else {
      let p = $P('Quantity checking ... NG!')
      p.style.color = 'red'
      $('#info').appendChild(p)
      transaction.abort()
    }
  }
}

function wordFieldset(id, word) {
  let fieldset = $CE('fieldset')
  fieldset.setAttribute('id', `fieldset-${id}`)
  let legend = $CE('legend')
  legend.innerText = id
  fieldset.appendChild(legend)
  for (item in word) {
    let p = $CE('p')
    let label = $CE('strong')
    label.innerText = `${item}:`
    p.appendChild(label)
    fieldset.appendChild(p)
    let content = undefined
    let code = undefined
    let span = undefined
    switch(item) {
      case 'ja':
      case 'cn':
      case 'en':
        word[item].forEach((v) => {
          code = $CE('code')
          code.innerText = v
          p.appendChild(code)
        })
        break;      
      case 'img':
        span = $CE('span')
        span.innerText = `${word[item]} pictures`
        p.appendChild(span)
        let showImages = $CE('input')
        showImages.setAttribute('type', 'button')
        showImages.setAttribute('value', 'show images')
        showImages.setAttribute('data-pic', word[item])
        showImages.setAttribute('data-id', id)
        p.appendChild(showImages)
        showImages.onclick = (event) => {
          let n = event.target.getAttribute('data-pic')
          let dataId = event.target.getAttribute('data-id')
          let suffix = 'a'.charCodeAt()
          for (let i = 0; i < n; i++) {
            suffix += i
            let filename = `./images/${dataId}${String.fromCharCode(suffix)}`
            let img = $CE('img')
            img.setAttribute('src', filename)
            $(`#fieldset-${dataId}`).appendChild(img)
          }
          event.target.style.display = 'none'
        }
        break;
      default:
        span = $CE('span')
        span.innerText = word[item]
        break;
    }
  }
  return fieldset
}