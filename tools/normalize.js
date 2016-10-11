const abnormalChars = {
  'ｧ': 'ァ', 'ｱ': 'ア', 'ｨ': 'ィ', 'ｲ': 'イ', 'ｩ': 'ゥ', 'ｳ': 'ウ', 'ｪ': 'ェ', 'ｴ': 'エ', 'ｫ': 'ォ', 'ｵ': 'オ', 'ｶ': 'カ', 'ｶﾞ': 'ガ', 'ｷ': 'キ', 'ｷﾞ': 'ギ', 'ｸ': 'ク', 'ｸﾞ': 'グ', 'ｹ': 'ケ', 'ｹﾞ': 'ゲ', 'ｺ': 'コ', 'ｺﾞ': 'ゴ', 'ｻ': 'サ', 'ｻﾞ': 'ザ', 'ｼ': 'シ', 'ｼﾞ': 'ジ', 'ｽ': 'ス', 'ｽﾞ': 'ズ', 'ｾ': 'セ', 'ｾﾞ': 'ゼ', 'ｿ': 'ソ', 'ｿﾞ': 'ゾ', 'ﾀ': 'タ', 'ﾀﾞ': 'ダ', 'ﾁ': 'チ', 'ﾁﾞ': 'ヂ', 'ｯ': 'ッ', 'ﾂ': 'ツ', 'ﾂﾞ': 'ヅ', 'ﾃ': 'テ', 'ﾃﾞ': 'デ', 'ﾄ': 'ト', 'ﾄﾞ': 'ド', 'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ', 'ﾊ': 'ハ', 'ﾊﾞ': 'バ', 'ﾊﾟ': 'パ', 'ﾋ': 'ヒ', 'ﾋﾞ': 'ビ', 'ﾋﾟ': 'ピ', 'ﾌ': 'フ', 'ﾌﾞ': 'ブ', 'ﾌﾟ': 'プ', 'ﾍ': 'ヘ', 'ﾍﾞ': 'ベ', 'ﾍﾟ': 'ペ', 'ﾎ': 'ホ', 'ﾎﾞ': 'ボ', 'ﾎﾟ': 'ポ', 'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ', 'ｬ': 'ャ', 'ﾔ': 'ヤ', 'ｭ': 'ュ', 'ﾕ': 'ユ', 'ｮ': 'ョ', 'ﾖ': 'ヨ', 'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ', 'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン', 'ｳﾞ': 'ヴ', '０': '0', '１': '1', '２': '2', '３': '3', '４': '4', '５': '5', '６': '6', '７': '7', '８': '8', '９': '9', 'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g', 'ｈ': 'h', 'ｉ': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o', 'ｐ': 'p', 'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', 'ｕ': 'u', 'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x', 'ｙ': 'y', 'ｚ': 'z', 'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E', 'Ｆ': 'F', 'Ｇ': 'G', 'Ｈ': 'H', 'Ｉ': 'I', 'Ｊ': 'J', 'Ｋ': 'K', 'Ｌ': 'L', 'Ｍ': 'M', 'Ｎ': 'N', 'Ｏ': 'O', 'Ｐ': 'P', 'Ｑ': 'Q', 'Ｒ': 'R', 'Ｓ': 'S', 'Ｔ': 'T', 'Ｕ': 'U', 'Ｖ': 'V', 'Ｗ': 'W', 'Ｘ': 'X', 'Ｙ': 'Y', 'Ｚ': 'Z', '･': '・', 'ｰ': 'ー', '｢': '「', '｣': '」', '､': '、', '／': '/'
} // Excluding 'ヮ', 'ヵ', 'ヶ', 'ヷ'

let abnormal = (input) => {
  for (let i = 0; i < input.length; i++) {
    if (abnormalChars.hasOwnProperty(input[i])) {
      return true
    }
  }
  return false
}

const normalize = (input) => {
  input = input.trim()
  let output = []
  let jump = false
  for (let i = 0; i < input.length; i++) {
    if (jump) {
      jump = false
    } else {
      let c = input[i]
      let cc = input.slice(i, i + 2)
      switch (abnormalChars.hasOwnProperty(cc)) {
        case true:
          output.push(abnormalChars[cc])
          jump = true
          break
        case false:
          if (abnormalChars.hasOwnProperty(c)) {
            output.push(abnormalChars[c])
          } else {
            output.push(c)
          }
          break
      }
    }
  }
  return output.join('')
}

const Datastore = require('nedb')
const db = new Datastore({
  filename: '../app/database.nedb',
  timestampDate: true
})

db.loadDatabase((err) => {
  if (err) window.alert(`Error(loadDatabase): ${err}`)
  console.log('Successfully loaded.')
  let abnormalDocs = new Set()
  const field = 'jp' // or 'notes'
  let query = {}
  query[field] = {$exists: true}
  db.find(query, (err, docs) => {
    if (err) window.alert(`Error(find): ${err}`)
    docs.forEach((doc) => {
      let id = doc._id
      doc[field].forEach((item) => {
        if (abnormal(item)) abnormalDocs.add(id)
      })
    })
    abnormalDocs.forEach((id) => {
      db.findOne({_id: id}, (err, doc) => {
        let newField = {}
        newField[field] = []
        for (let i in doc[field]) {
          newField[field][i] = normalize(doc[field][i])
        }
        db.update({_id: id}, {$set: newField}, {})
      })
    })
  })
})
