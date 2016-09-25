const {clipboard} = require('electron')
const fs = require('fs-extra')
const imgNodejs = './app/images/'
const imgChrome = './images/'
const Categories = ['jp', 'cn', 'en', 'tags', 'notes', 'img']
const MAX = 10

const Datastore = require('nedb')
const db = new Datastore({
  filename: './app/database.nedb',
  autoload: true,
  timestampData: true
})

db.count({}, (err, count) => {
  if (count === 0) {
    const dictionary = require('./database.json')
    console.log('New database. Initializing...')
    let dictArray = []
    for (let key in dictionary) {
      dictArray.push(dictionary[key])
    }
    db.insert(dictArray, (err) => {
      if (err) window.alert(err)
      db.count({}, (err, count) => {
        console.log(`Done. Now ${count} docs in database.`)
      })
    })
  } else {
    console.log(`${count} docs in database.`)
  }
})

