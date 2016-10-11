const Hiragana = 'あいうえおかきくけこがぎぐげごさしすせそざじずぜぞたちつてとだぢづでどなにぬねのはひふへほぱぴぷぺぽばびぶべぼまみむめもやゆよゃゅょらりるれろわんぁぃぅぇぉっ'

const Katakana = 'アイウエオカキクケコガギグゲゴサシスセソザジズゼゾタチツテトダヂヅデドナニヌネノハヒフヘホパピプペポバビブベボマミムメモヤユヨャュョラリルレロワンァィゥェォッーヴ'

const toAssist = function (input) {
  let output = ''
  for (let i = 0; i < input.length; i++) {
    let c = input[i]
    if (Hiragana.indexOf(c) < 0) {
      let j = Katakana.indexOf(c)
      if (j > -1 && j < Hiragana.length) c = Hiragana[j]
      if (j < Hiragana.length) output += c
      // if (j >= Hiragana.length) continue
    }
  }
  if (output === '') {
    return input
  } else {
    return output
  }
}

const Datastore = require('nedb')
const db = new Datastore({
  filename: '../app/database.nedb',
  timestampDate: true
})

db.loadDatabase((err) => {
  if (err) console.log(`Error(loadDatabase): ${err}`)
  console.log('Successfully loaded.')
  const field = 'jp'
  let query = {}
  query[field] = {$exists: true}
  db.find(query, (err, docs) => {
    if (err) console.log(`Error(find): ${err}`)
    docs.forEach((doc) => {
      let assistWords = []
      doc[field].forEach((item) => {
        let assist = toAssist(item)
        if (assist !== item) {
          assistWords.push(assist)
        }
      })
      if (assistWords.length > 0) {
        db.update({_id: doc._id}, {$set: {assist: assistWords}}, {})
      }
    })
  })
})
