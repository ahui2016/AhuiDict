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
          alert('(null) The transaction is not finished, is finished and\
 successfully committed, or was aborted with IDBTransaction.abort function.')
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
          <p>{`${packageJSON.name} ${packageJSON.version},\
 Node ${process.versions.node}, Chrome ${process.versions.chrome},\
 Electron ${process.versions.electron}.`}</p>
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
      dictionary: [],
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
      let dictionary = []
      store.openCursor().onsuccess = (event) => {
        let cursor = event.target.result
        if (cursor) {
          let entry = cursor.value
          entry.key = cursor.key
          let imgFiles = []
          let suffix = 'a'.charCodeAt()
          for (let i = 0; i < entry.img; i++) {
            suffix += i
            let filename = `./images/${entry.key}${String.fromCharCode(suffix)}`
            imgFiles.push(filename)
          }
          entry.imgFiles = imgFiles
          ;['jp', 'cn', 'en', 'tags', 'notes'].forEach((category) => {
            if (!entry[category]) entry[category] = []
          })
          dictionary.push(entry)
          cursor.continue()
        } else {
          this.setState({ dictionary: dictionary, done: true })
        }
      }
    }
  },

  entryEdit: function(key, category, item, pos) { // dictionary[pos] -> entry
    let dictionary = this.state.dictionary

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
          alert('(null) The transaction is not finished, is finished and\
 successfully committed, or was aborted with IDBTransaction.abort function.')
        } else {
          console.log(event.target.error)
          alert(event.target.error)
        }
      }

      let store = transaction.objectStore('dictStore')
      let requestGet = store.get(key)
      requestGet.onsuccess = (event) => {
        let entry = event.target.result
        if (typeof item === 'string') {
          if (!entry[category]) {
            entry[category] = []
          }
          entry[category].push(item)
        } else if (typeof item === 'number') {
          entry[category].splice(item, 1)
        } else { // item -> [updateStart, updateValue]
          let updateStart = item[0]
          let updateValue = item[1]
          entry[category].splice(updateStart, 1, updateValue)
        }

        let requestUpdate = store.put(entry, key)
        requestUpdate.onsuccess = () => {
          dictionary[pos][category] = entry[category]
          this.setState({ dictionary: dictionary })
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
          ? `${this.state.count} entries in the dictionary.`
          : ''}</h2>
        <AhuiDict.Words.Fieldset
            dictionary={this.state.dictionary} entryEdit={this.entryEdit} />
        <p>{this.state.done ? 'All words has been listed out.' : ''}</p>
      </section>
    )
  }
})

AhuiDict.Words.Fieldset = React.createClass({
  getInitialState: function() {
    return {
      popup: '', // Use to toggle `copy` and `delete` buttons.
      edit: '',
      notes: '',
      showPic: new Set(),

      // When the Show button is clicked, add it in to state.showButtons,
      // If the show button is in state.Buttons, hide it,
      // at the same time, show the toggle button.
      showButtons: new Set()
    }
  },

  popup: function(id) {
    if (id.indexOf(this.state.edit) > -1) { // popup in the same fieldset
      this.setState({ popup: id })
    } else {                                // popup in another fieldset
      this.setState({ popup: id, edit: '', notes: '' })
    }
  },

  copyToClip: function(item) {
    clipboard.writeText(item)
  },

  entryEdit: function(key, category, item, pos) {
    if (typeof item === 'number') {
      if (confirm(`Delete【${this.props.dictionary[pos][category][item]}】?`)) {
        this.setState({popup: '', notes: ''})
        this.props.entryEdit(key, category, item, pos)
      }
    } else { // item is an array or a HTML-Element
      if (Array.isArray(item)) { // item -> [updateStart, <textarea>]
        this.props.entryEdit(key, category, [item[0], item[1].value], pos)
      } else { // item -> <input[type="text"]> or <textarea>
        this.props.entryEdit(key, category, item.value, pos)
        item.value = ''
      }
      this.setState({popup: '', notes: ''})
    } 
  },

  jpCnEn: function(entry, category, pKey, pos) {
    let refId = `${category}-${entry.key}`
    return (
      <p key={pKey} className={category} style={{display:
          entry[category].length > 0 || this.state.edit === `entry-${entry.key}`
          ? 'block' : 'none'}}>
        <strong>{category === 'tags' ? 'Tags' : category.toUpperCase()}</strong>:
        {
          entry[category].map(function(item, i) {
            return <span key={i}>
              <code onClick={
                this.popup.bind(
                  this, `entry-${entry.key}-${category}-${i}`)}>{item}</code>
              <span className='popup' style={{display:
                this.state.popup === `entry-${entry.key}-${category}-${i}`
                ? 'inline' : 'none'}}>
                <input type='button' value='copy' onClick={() => {
                  clipboard.writeText(item)
                }} />
                <input type='button' value='delete' onClick={
                  this.entryEdit.bind(this, entry.key, category, i, pos)} />
              </span>
            </span>
          }.bind(this))
        }
        <span style={{display: this.state.edit === `entry-${entry.key}`
                ? 'inline' : 'none'}}>
          <input type='text' ref={(ref) => this[refId] = ref}
            onKeyPress={(event) => {if (event.key === 'Enter') {
              this.entryEdit(entry.key, category, this[refId], pos)
            }}} />
          <input type='button' value='add' onClick={
            this.entryEdit.bind(this, entry.key, category, this[refId], pos)} />
        </span>
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

  ignoreDrag: function(event) {
    event.stopPropagation()
    event.preventDefault()
  },

  render: function() {
    return (
<div>
{
  this.props.dictionary.map(function(entry, pos) { /* dictionary[pos] -> entry */
    let entryId = `entry-${entry.key}`
    return <fieldset key={entry.key}>
      <legend>
        {entry.key}
        <input type='button' value='Edit' onClick={(event) => {
          if (this.state.edit === entryId) {
            this.setState({edit: '', popup: '', notes: ''})
          } else {
            this.setState({edit: entryId, popup: '', notes: ''})
          }}} />
      </legend>
      {
        ['jp', 'cn', 'en', 'tags'].map((category, key) => {
          return this.jpCnEn(entry, category, key, pos)
        })
      }
      <div style={{display:
        entry.notes.length > 0 || this.state.edit === entryId
        ? 'block' : 'none'}}>
        <strong>Notes</strong>:
        <span style={{display: this.state.edit === entryId ? 'inline' : 'none'}}>
          <textarea rows='2' cols='50'
            ref={(ref) => this[`notes-${entry.key}`] = ref} />
          <input type='button' value='add' onClick={this.entryEdit.bind(
            this, entry.key, 'notes', this[`notes-${entry.key}`], pos)} />
        </span>
        <ul style={{listStyle: this.state.edit === entryId ? 'none' : 'disc'}}>
{
  entry.notes.map((item, i) => {
    let noteId = `entry-${entry.key}-notes-${i}`
    return <li key={i}>
      <input type='radio' value={noteId} checked={this.state.notes === noteId}
        onChange={() => {
          this[noteId].value = item
          this.setState({notes: noteId})}}
        style={{display: this.state.edit === entryId ? 'inline' : 'none'}} />
      <span style={{display: this.state.notes !== noteId ? 'inline' : 'none'}}>
        {item}
      </span>
      <span style={{display:
        this.state.notes === noteId && this.state.edit === entryId
        ? 'inline' : 'none'}}>
        <textarea rows='3' cols='50' defaultValue={item} ref={
          (ref) => this[noteId] = ref} />
        <input type='button' value='delete' onClick={
          this.entryEdit.bind(this, entry.key, 'notes', i, pos)} />
        <input type='button' value='update' onClick={this.entryEdit.bind(
          this, entry.key, 'notes', [i, this[noteId]], pos)} />
      </span>
    </li>
  })
}
        </ul>
      </div>
      <div style={{display: entry.img || this.state.edit === entryId
        ? 'block' : 'none'}}>
        <strong>Images</strong>:
        <span>{entry.img ? `${entry.img} pictures` : 'No picture'}</span>
        <input
          type='button'
          value='Show'
          onClick={this.showPic.bind(this, `showPic-${entry.key}`)}
          style={{display:
            entry.img && !this.state.showButtons.has(`showPic-${entry.key}`)
              ? 'inline' : 'none'}} />
        <div id='dropBox' onDragEnter={this.ignoreDrag} onDragOver={this.ignoreDrag}
          onDrop={(event) => {
            event.stopPropagation()
            event.preventDefault()
            let file = event.dataTransfer.files[0]
            let reader = new FileReader()
            console.log(file.path)
          }}>
          <div>Drop your image here...</div>
        </div>
        <input
          type='button'
          value={this.state.showPic.has(`showPic-${entry.key}`)
              ? 'Hide' : 'Show'}
          onClick={this.togglePic.bind(this, `showPic-${entry.key}`)}
          style={{display:
            this.state.showButtons.has(`showPic-${entry.key}`)
              ? 'inline' : 'none'}} />
      </div>
      <p style={{display: this.state.showPic.has(`showPic-${entry.key}`)
            ? 'block' : 'none'}}>
        {
          entry.imgFiles.map(function(imgFile, key) {
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