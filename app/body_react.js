var AhuiDict = React.createClass({
  getInitialState: function() {
    return {
      errorMsg: [],
      successMsg: [],
      continueButton: 'none',
      clicked: false // Use to hide AhuiDict.Info
    }
  },

  componentDidMount: function() {
    let request = indexedDB.open('dictDB')
    
    request.onerror = (event) => {
      let errorMsg = this.state.errorMsg
      errorMsg.push(event.target.error)
      this.setState({ errorMsg: errorMsg })
    }

    request.onupgradeneeded = (event) => {
      let db = event.target.result
      let store = db.createObjectStore('dictStore', {autoIncrement: true})
      store.createIndex('jp', 'jp', {unique: false, multiEntry: true})
      store.createIndex('cn', 'cn', {unique: false, multiEntry: true})
      store.createIndex('en', 'en', {unique: false, multiEntry: true})

      let successMsg = this.state.successMsg
      successMsg.push('on upgrade needed:')
      successMsg.push(
        `oldVersion: ${event.oldVersion}, newVersion: ${event.newVersion}`)
      this.setState({ successMsg: successMsg })
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let successMsg = this.state.successMsg
      successMsg.push('on success:')
      successMsg.push(`current version: ${db.version}`)

      let transaction = db.transaction('dictStore', 'readonly')

      transaction.onabort = (event) => {
        if (event.target.error === null) {
          alert('(null) The transaction is not finished\
          , is finished and successfully committed\
          , or was aborted with IDBTransaction.abort function.')
        } else {
          console.log(event.target.error)
          alert(event.target.error)
        }
      }

      let store = transaction.objectStore('dictStore')
      let requestCount = store.count()

      requestCount.onsuccess = () => {
        let count = requestCount.result
        const dbJSON = require('./database.json')
        let len = Object.keys(dbJSON).length
        successMsg.push('Open objectStore ... successful')
        successMsg.push(`How many records in   indexedDB  : ${count}`)
        successMsg.push(`How many records in database.json: ${len}`)

        if (count === len) {
          successMsg.push('Quantity checking ... OK!')
          successMsg.push('Click the "Continue" button to display all words.')
          this.setState({ continueButton: 'block' })
        } else {
          let errorMsg = this.state.errorMsg
          errorMsg.push(event.target.error)
          this.setState({ errorMsg: errorMsg })
          transaction.abort()
        }
      }
      
      this.setState({ successMsg: successMsg })
    }
  },

  handleClick: function() {
    this.setState({ clicked: true, continueButton: 'none' })
  },

  render: function() {
    return (
      <article>
        <header>
          <h1>{packageJSON.name}</h1>
          <p>{`${packageJSON.name} ${packageJSON.version}\
          , Node ${process.versions.node}, Chrome ${process.versions.chrome}\
          , Electron ${process.versions.electron}.`}</p>
        </header>
        <AhuiDict.Info errorMsg={this.state.errorMsg}
                       successMsg={this.state.successMsg}
                       clicked={this.state.clicked} />
        <AhuiDict.Words continueButton={this.state.continueButton}
                        onClick={this.handleClick} />
      </article>
    )
  }
})

AhuiDict.Info = React.createClass({
  render: function() {
    return (
      <section style={{display: this.props.clicked ? 'none' : 'block'}}>
        <h2>Loading...</h2>
        {
          this.props.successMsg.map(function(msg, i) {
            return <p key={i}>{msg}</p>
          })
        }
        {
          this.props.errorMsg.map(function(msg, i) {
            return <p key={i}
                      style={{color: 'red', fontWeight: 'bold'}}>{msg}</p> 
          })
        }
      </section>
    )
  }
})

AhuiDict.Words = React.createClass({
  getInitialState: function() {
    return {
      count: 0,
      words: [],
      done: false, // Use to show 'All words has been listed out.'
      showPic: new Set() // Send to AhuiDict.Words.Fieldset
    }
  },

  handleClick: function() {
    this.props.onClick() // AhuiDict.handleClick

    let request = indexedDB.open('dictDB')
    
    request.onerror = (event) => {
      console.log(event.target.error)
      alert(event.target.error)
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let store = db.transaction('dictStore').objectStore('dictStore')
      let requestCount = store.count()
      requestCount.onsuccess = () => {
        this.setState({ count: requestCount.result })
      }
      let words = []
      store.openCursor().onsuccess = (event) => {
        let cursor = event.target.result
        if (cursor) {
          let word = cursor.value
          word.key = cursor.key
          let imgFiles = []
          let suffix = 'a'.charCodeAt()
          for (let i = 0; i < word.img; i++) {
            suffix += i
            let filename = `./images/${word.key}${String.fromCharCode(suffix)}`
            imgFiles.push(filename)
          }
          word.imgFiles = imgFiles
          words.push(word)
          cursor.continue()
        } else {
          this.setState({ words: words, done: true })
        }
      }
    }
  },

  deleteItem: function(key, lang, k, pos) { // words[pos] -> word
    let words = this.state.words

    let request = indexedDB.open('dictDB')
    
    request.onerror = (event) => {
      console.log(event.target.error)
      alert(event.target.error)
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let transaction = db.transaction('dictStore', 'readwrite')

      transaction.onabort = (event) => {
        if (event.target.error === null) {
          alert('(null) The transaction is not finished\
          , is finished and successfully committed\
          , or was aborted with IDBTransaction.abort function.')
        } else {
          console.log(event.target.error)
          alert(event.target.error)
        }
      }

      let store = transaction.objectStore('dictStore')
      let requestGet = store.get(key)
      requestGet.onsuccess = (event) => {
        let entry = event.target.result
        entry[lang].splice(k, 1)

        let requestUpdate = store.put(entry, key)
        requestUpdate.onsuccess = () => {
          words[pos][lang] = entry[lang]
          this.setState({ words: words })
        }
      }
    }
  },

  render: function() {  
    return (
      <section>
        <input type='button'
               value='Continue'
               style={{display: this.props.continueButton}}
               onClick={this.handleClick} />
        <h2>{this.state.count
          ? `${this.state.count} words in the dictionary.`
          : ''}</h2>
        <AhuiDict.Words.Fieldset
            words={this.state.words} deleteItem={this.deleteItem} />
        <p>{this.state.done ? 'All words has been listed out.' : ''}</p>
      </section>
    )
  }
})

AhuiDict.Words.Fieldset = React.createClass({
  getInitialState: function() {
    return {
      newWord: '',
      popup: '', // Use to toggle `copy` and `delete` buttons.
      showPic: new Set(),

      // When the Show button is clicked, add it in to state.showButtons,
      // If the show button is in state.Buttons, hide it,
      // at the same time, show the toggle button.
      showButtons: new Set()
    }
  },

  popup: function(id) {
    this.setState({ popup: id })
  },

  copyToClip: function(item) {
    clipboard.writeText(item)
  },

  deleteItem: function(key, lang, k, pos) {
    if (confirm(`Delete【${this.props.words[pos][lang][k]}】?`)) {
      this.props.deleteItem(key, lang, k, pos)
    }
  },

  newWordText: function(event) {
    this.setState({ newWord: event.target.value })
  },

  jpCnEn: function(word, lang, pKey, pos) {
    return (
      <p key={pKey}>
        <strong>{lang}</strong>:
        {
          word[lang].map(function(item, k) {
            return <span key={k}>
              <code onClick={
                this.popup.bind(this, `word-${word.key}-${lang}-${k}`)}>{item}</code>
              <span style={{display:
                this.state.popup === `word-${word.key}-${lang}-${k}`
                ? 'inline' : 'none'}}>
                <input type='button' value='copy' onClick={
                  this.copyToClip.bind(this, item)} />
                <input type='button' value='delete' onClick={
                  this.deleteItem.bind(this, word.key, lang, k, pos)} />
              </span>
            </span>
          }.bind(this))
        }
        <input type='text' placeholder='New word' value={this.state.newWord}
               onChange={this.newWordText}
               style={{display:
                 this.state.popup.indexOf(`word-${word.key}-${lang}`) > -1
                 ? 'inline' : 'none'}} />
      </p>
    )
  },

  showPic: function(pic) {
    let showPic = this.state.showPic
    showPic.add(pic)
    let showButtons = this.state.showButtons
    showButtons.add(pic)
    this.setState({ showButtons: showButtons, showPic: showPic })
  },

  togglePic: function(pic) {
    let showPic = this.state.showPic
    if (showPic.has(pic)) {
      showPic.delete(pic)
    } else {
      showPic.add(pic)
    }
    this.setState({ showPic: showPic })
  },

  render: function() {
    return (
      <div>
        {
          this.props.words.map(function(word, pos) { // words[pos] -> word
            return <fieldset key={word.key}>
              <legend>{word.key}</legend>
              {
                ['jp', 'cn', 'en'].map(function(lang, key) {
                  return this.jpCnEn(word, lang, key, pos)
                }.bind(this))
              }
              <p><strong>img</strong>:
                <span>{word.img ? `${word.img} pictures` : 'No picture'}</span>
                <input
                  type='button'
                  value='Show'
                  onClick={this.showPic.bind(this, `showPic-${word.key}`)}
                  style={{display: word.img && !this.state.showButtons.has(`showPic-${word.key}`)
                      ? 'inline' : 'none'}} />
                <input
                  type='button'
                  value={this.state.showPic.has(`showPic-${word.key}`)
                      ? 'Hide' : 'Show'}
                  onClick={this.togglePic.bind(this, `showPic-${word.key}`)}
                  style={{display: this.state.showButtons.has(`showPic-${word.key}`)
                      ? 'inline' : 'none'}} />
              </p>
              <p style={{display: this.state.showPic.has(`showPic-${word.key}`)
                   ? 'block' : 'none'}}>
                {
                  word.imgFiles.map(function(imgFile, key) {
                    return <img key={key} src={imgFile}  />
                  })
                }
              </p>
            </fieldset>
          }.bind(this))
        }
      </div>
    )
  }
})

ReactDOM.render(<AhuiDict />, $('main'))