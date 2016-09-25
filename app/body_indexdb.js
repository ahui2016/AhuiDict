const {clipboard} = require('electron')
const fs = require('fs-extra')
const imgNodejs = './app/images/'
const imgChrome = './images/'
const Categories = ['jp', 'cn', 'en', 'tags', 'notes', 'img']
const MAX = 10

var dictionary = require('./database.json')
Object.keys(dictionary).forEach((key) => {
  Categories.forEach((category) => {
    if (!dictionary[key][category]) dictionary[key][category] = []
  })
})

var AhuiDict = React.createClass({ // eslint-disable-line no-undef
  getInitialState: function () {
    return {
      errorMsg: [],
      successMsg: [],
      continueButton: 'none',
      clicked: false, // Use to hide AhuiDict.Info
      dbSize: 0
    }
  },

  componentDidMount: function () {
    let request = window.indexedDB.open('dictDB')

    request.onerror = (event) => {
      let errorMsg = this.state.errorMsg
      errorMsg.push(event.target.error)
      this.setState({ errorMsg: errorMsg })
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let successMsg = this.state.successMsg
      successMsg.push('on success:')
      successMsg.push(`current version: ${db.version}`)

      let transaction = db.transaction('dictStore', 'readonly')

      transaction.onabort = (event) => {
        if (event.target.error === null) {
          window.alert('(null) The transaction is not finished, is finished and successfully committed, or was aborted with IDBTransaction.abort function.')
        } else {
          console.log(event.target.error)
          window.alert(event.target.error)
        }
      }

      let store = transaction.objectStore('dictStore')
      let requestCount = store.count()

      requestCount.onsuccess = () => {
        let count = requestCount.result
        let len = Object.keys(dictionary).length
        this.setState({dbSize: count})
        successMsg.push('Open objectStore ... successful')
        successMsg.push(`How many records in   indexedDB  : ${count}`)
        successMsg.push(`How many records in database.json: ${len}`)

        if (count === len) {
          successMsg.push('Quantity checking ... OK!')
          successMsg.push('Click the "Continue" button to display all words.')
        } else {
          let errorMsg = this.state.errorMsg
          errorMsg.push(event.target.error)
          errorMsg.push('Quantity checking ... NG!')
          this.setState({ errorMsg: errorMsg })
          // transaction.abort()
        }
        this.setState({ continueButton: 'block' })
      }

      this.setState({ successMsg: successMsg })
    }
  },

  handleClick: function () {
    this.setState({ clicked: true, continueButton: 'none' })
  },

  render: function () {
    return (
      <article>
        <header>
          <h1>{
            packageJSON.name // eslint-disable-line no-undef
          }</h1>
          <p>{
            `${packageJSON.name} ${packageJSON.version}, Node ${process.versions.node}, Chrome ${process.versions.chrome}, Electron ${process.versions.electron}.` // eslint-disable-line no-undef
          }</p>
          {
            this.state.clicked
            ? <p>{`${this.state.dbSize} entries in database.`}</p>
            : ''
          }
        </header>
        <AhuiDict.Info
          errorMsg={this.state.errorMsg} successMsg={this.state.successMsg}
          clicked={this.state.clicked} />
        <AhuiDict.Words
          continueButton={this.state.continueButton} onClick={this.handleClick} />
      </article>
    )
  }
})

AhuiDict.Info = React.createClass({ // eslint-disable-line no-undef
  render: function () {
    return (
      <section style={{display: this.props.clicked ? 'none' : 'block'}}>
        <h2>Loading...</h2>
        {
          this.props.successMsg.map(function (msg, i) {
            return <p key={i}>{msg}</p>
          })
        }
        {
          this.props.errorMsg.map(function (msg, i) {
            return <p key={i} style={{color: 'red', fontWeight: 'bold'}}>{msg}</p>
          })
        }
      </section>
    )
  }
})

AhuiDict.Words = React.createClass({ // eslint-disable-line no-undef
  getInitialState: function () {
    return {
      count: 0,
      searchResult: [],
      done: false, // Set to true when the search result is shown.
      showPic: new Set() // Send to AhuiDict.Words.Fieldset
    }
  },

  handleClick: function () {
    this.props.onClick() // AhuiDict.handleClick
    this.refs.Search.handleContinue()
  },

  handleSearch: function (pattern, opt, categories) {
    let request = window.indexedDB.open('dictDB')

    request.onerror = (event) => {
      console.log(event.target.error)
      window.alert(event.target.error)
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let transaction = db.transaction('dictStore')
      let store = transaction.objectStore('dictStore')
      let resultCount = 0
      let result = {}
      let searchResult = []
      let keyRange = null

      transaction.onabort = (event) => {
        console.log(`Error(handleSearch): ${event.target.error}`)
      }

      transaction.oncomplete = (event) => {
        if (Object.keys(result).length === 0) {
          console.log(`Not Found.`)
        } else {
          searchResult = Object.keys(result).map(key => result[key])
          this.setState({ searchResult: searchResult, done: true })
        }
      }

      switch (opt) {
        case 'begin':
          keyRange = window.IDBKeyRange.lowerBound(pattern)
          break
        case 'exactly':
          keyRange = window.IDBKeyRange.only(pattern)
          break
        case 'end':
          pattern = new RegExp(`${pattern}$`)
          break
        case 'contain':
        case 'RegExp':
          pattern = new RegExp(pattern)
          break
      }

      switch (opt) {
        case 'begin':
        case 'exactly':
        case 'end':
          categories.forEach((category) => {
            let index = store.index(category.toLowerCase())
            index.openCursor(keyRange).onsuccess = (event) => {
              let cursor = event.target.result
              if (cursor) {
                let entry = cursor.value
                entry.key = cursor.primaryKey

                let addToResult = () => {
                  Categories.forEach((category) => {
                    if (!entry[category]) entry[category] = []
                  })
                  result[entry.key] = entry
                  resultCount += 1
                }

                if (!result[entry.key]) {
                  switch (opt) {
                    case 'begin':
                      if (cursor.key.startsWith(pattern)) addToResult()
                      break
                    case 'exactly':
                      addToResult()
                      break
                    case 'end':
                      if (pattern.test(cursor.key)) addToResult()
                      break
                  }
                }
                if (resultCount < MAX) {
                  cursor.continue()
                } else {
                  console.log(`${category} ${cursor.primaryKey}.`)
                }
              } else {
                console.log(`${category} done.`)
              }
            }
          })
          break
        case 'contain':
        case 'RegExp':
          store.openCursor().onsuccess = (event) => {
            let cursor = event.target.result
            if (cursor) {
              let entry = cursor.value
              entry.key = cursor.key
              let combine = []
              categories.forEach((category) => {
                if (entry[category.toLowerCase()]) {
                  entry[category.toLowerCase()].forEach((item) => {
                    combine.push(item)
                  })
                }
              })
              combine = combine.join(' | ')
              if (!result[entry.key] && pattern.test(combine)) {
                Categories.forEach((category) => {
                  if (!entry[category]) entry[category] = []
                })
                result[entry.key] = entry
                resultCount += 1
              }
              if (resultCount < MAX) {
                cursor.continue()
              } else {
                console.log(`Reach MAX ${cursor.key}.`)
              }
            } else {
              console.log(`Done.`)
            }
          }
          break
      }
    }
  },

  showAllEntries: function () {
    let request = window.indexedDB.open('dictDB')

    request.onerror = (event) => {
      console.log(event.target.error)
      window.alert(event.target.error)
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let store = db.transaction('dictStore').objectStore('dictStore')
      let requestCount = store.count()
      requestCount.onsuccess = () => {
        this.setState({ count: requestCount.result })
      }
      let searchResult = []
      store.openCursor().onsuccess = (event) => {
        let cursor = event.target.result
        if (cursor) {
          let entry = cursor.value
          entry.key = cursor.key
          Categories.forEach((category) => {
            if (!entry[category]) entry[category] = []
          })
          searchResult.push(entry)
          if (searchResult.length < MAX) {
            cursor.continue()
          } else {
            this.setState({ searchResult: searchResult, done: true })
          }
        } else {
          this.setState({ searchResult: searchResult, done: true })
        }
      }
    }
  },

  entryEdit: function (key, category, item, pos) { // searchResult[pos] -> entry
    let searchResult = this.state.searchResult

    let request = window.indexedDB.open('dictDB')

    request.onerror = (event) => {
      console.log(event.target.error)
      window.alert(event.target.error)
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let transaction = db.transaction('dictStore', 'readwrite')

      transaction.onabort = (event) => {
        if (event.target.error === null) {
          window.alert('(null) The transaction is not finished, is finished and successfully committed, or was aborted with IDBTransaction.abort function.')
        } else {
          console.log(event.target.error)
          window.alert(event.target.error)
        }
      }

      let store = transaction.objectStore('dictStore')
      if (category === 'ADD') {
        let requestAdd = store.add(item)
        requestAdd.onsuccess = () => {
          item.key = requestAdd.result
          searchResult.unshift(item)
          this.setState({searchResult: searchResult})
          this.refs.Fieldset.handleAddNewEntry(`entry-${item.key}`)
        }
      } else if (category === 'DELETE') {
        let requestDel = store.delete(key)
        requestDel.onsuccess = () => {
          searchResult.splice(pos, 1)
          this.setState({searchResult: searchResult})
        }
      } else {
        let requestGet = store.get(key)
        requestGet.onsuccess = (event) => {
          let entry = event.target.result
          switch (typeof item) {
            case 'string':
              if (!entry[category]) entry[category] = []
              if (category === 'img') {
                entry[category].unshift(item)
              } else {
                entry[category].push(item)
              }
              break
            case 'number':
              entry[category].splice(item, 1)
              break
            case 'object': // item -> [updateStart, updateValue]
              let updateStart = item[0]
              let updateValue = item[1]
              entry[category].splice(updateStart, 1, updateValue)
              break
          }

          let requestUpdate = store.put(entry, key)
          requestUpdate.onsuccess = () => {
            searchResult[pos][category] = entry[category]
            this.setState({ searchResult: searchResult })
          }
        }
      }
    }
  },

  render: function () {
    return (
      <section>
        <input type='button' value='Continue' onClick={this.handleClick}
          style={{display: this.props.continueButton}} />
        <h2 style={{display: 'inline'}}>{
          this.state.count
          ? `Found ${this.state.count} entries.`
          : ''
        }</h2>
        {
          this.state.done
          ? <span>
            <input type='button' value='Add' onClick={() => {
              let newEntry = {}
              Categories.forEach((category) => {
                newEntry[category] = []
              })
              this.entryEdit(null, 'ADD', newEntry, null)
            }} /> an new Entry.
          </span>
          : ''
        }
        <AhuiDict.Words.Search ref='Search' onSearch={this.handleSearch} />
        <AhuiDict.Words.Fieldset ref='Fieldset' entryEdit={this.entryEdit}
          searchResult={this.state.searchResult} />
        <p>{this.state.done ? 'All words has been listed out.' : ''}</p>
      </section>
    )
  }
})

AhuiDict.Words.Search = React.createClass({ // eslint-disable-line no-undef
  getInitialState: function () {
    return {
      checkboxes: new Set(['JP', 'CN', 'EN']),
      opt: 'exactly',
      continue: false
    }
  },

  handleContinue: function () {
    this.setState({continue: true})
  },

  render: function () {
    return (<div id='searchArea' style={{display: this.state.continue
      ? 'block' : 'none'}}>

      <input type='search' size='50' ref={
        (ref) => this.search = ref // eslint-disable-line no-return-assign
      } />
      <input type='button' value='Search' onClick={() => {
        this.props.onSearch(
          this.search.value, this.state.opt, this.state.checkboxes)
      }} />

      <table><tbody><tr>
      {
        ['JP', 'CN', 'EN', 'Tags', 'Notes'].map((category) => {
          return <td key={category}><label>
            <input type='checkbox' checked={this.state.checkboxes.has(category)}
              onChange={() => {
                let checkboxes = this.state.checkboxes
                if (checkboxes.has(category)) {
                  checkboxes.delete(category)
                  if (checkboxes.size === 0) {
                    checkboxes = new Set(['JP', 'CN', 'EN'])
                  }
                } else {
                  checkboxes.add(category)
                }
                this.setState({checkboxes: checkboxes})
              }} />
            {category}
          </label></td>
        })
      }
      </tr><tr>
      {
        ['exactly', 'begin', 'end', 'contain', 'RegExp'].map((opt) => {
          return <td key={opt}><label>
            <input type='radio' checked={this.state.opt === opt}
              onChange={() => {
                this.setState({opt: opt})
              }} />
            {opt}
          </label></td>
        })
      }
      </tr></tbody></table>
    </div>)
  }
})

AhuiDict.Words.Fieldset = React.createClass({ // eslint-disable-line no-undef
  getInitialState: function () {
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

  handleAddNewEntry: function (entryKey) {
    this.setState({edit: entryKey})
  },

  popup: function (id) {
    if (id.indexOf(this.state.edit) > -1) { // popup in the same fieldset
      this.setState({ popup: id })
    } else {                                // popup in another fieldset
      this.setState({ popup: id, edit: '', notes: '' })
    }
  },

  hidePopup: function () {
    this.setState({popup: '', notes: ''})
  },

  entryEdit: function (key, category, item, pos) {
    switch (typeof item) {
      case 'number':
        if (window.confirm(`Delete 【${this.props.searchResult[pos][category][item]}】?`)) {
          this.hidePopup()
          this.props.entryEdit(key, category, item, pos)
        }
        break
      case 'object': // item is an array or <input[type="text"]> or <textarea>
        if (Array.isArray(item)) {
          this.props.entryEdit(key, category, [item[0], item[1].value], pos)
        } else {
          this.props.entryEdit(key, category, item.value, pos)
        }
        item.value = ''
        this.hidePopup()
        break
    }
  },

  jpCnEn: function (entry, category, pKey, pos) {
    let refId = `${category}-${entry.key}`
    return (
      <p key={pKey} className={category} style={{display:
          entry[category].length > 0 || this.state.edit === `entry-${entry.key}`
          ? 'block' : 'none'}}>
        <strong>{category === 'tags' ? 'Tags' : category.toUpperCase()}</strong>:
        {
          entry[category].map(function (item, i) {
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
          <input type='text'
            ref={
              (ref) => this[refId] = ref // eslint-disable-line no-return-assign
            }
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                this.entryEdit(entry.key, category, this[refId], pos)
              } }} />
          <input type='button' value='add' onClick={() => {
            this.entryEdit(entry.key, category, this[refId], pos)
          }} />
        </span>
      </p>
    )
  },

  showPic: function (pic) {
    let showPic = this.state.showPic
    showPic.add(pic)
    let showButtons = this.state.showButtons
    showButtons.add(pic)
    this.setState({ showButtons: showButtons, showPic: showPic })
  },

  togglePic: function (pic) {
    let showPic = this.state.showPic
    if (showPic.has(pic)) {
      showPic.delete(pic)
    } else {
      showPic.add(pic)
    }
    this.setState({ showPic: showPic })
  },

  ignoreDrag: function (event) {
    event.stopPropagation()
    event.preventDefault()
  },

  render: function () {
    return (<div>
{
  this.props.searchResult.map(function (entry, pos) { // searchResult[pos] -> entry
    let imgCount = entry.img.length
    let entryId = `entry-${entry.key}`
    let editMode = {display: this.state.edit === entryId ? 'inline' : 'none'}
    return <fieldset key={entry.key}>
      <legend>
        {entry.key}
        <span>
          <input type='button'
            value={this.state.edit === entryId ? 'Done' : 'Edit'}
            onClick={() => {
              if (this.state.edit === entryId) {
                this.setState({edit: '', popup: '', notes: ''})
              } else {
                this.setState({edit: entryId, popup: '', notes: ''})
              }
            }} />
          <input type='button' value='Delete' style={editMode}
            onClick={() => {
              if (window.confirm(`Delete ** entry ${entry.key} ** ?`)) {
                this.props.entryEdit(entry.key, 'DELETE', null, pos)
              }
            }} />
        </span>
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
        <span style={editMode}>
          <textarea rows='2' cols='50'
            ref={
              (ref) => this[`notes-${entry.key}`] = ref // eslint-disable-line no-return-assign
            } />
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
          this.setState({notes: noteId})
        }}
        style={editMode} />
      <span style={{display: this.state.notes !== noteId ? 'inline' : 'none'}}>
        {item}
      </span>
      <span style={{display:
        this.state.notes === noteId && this.state.edit === entryId
        ? 'inline' : 'none'}}>
        <textarea rows='3' cols='50' defaultValue={item}
          ref={
            (ref) => this[noteId] = ref // eslint-disable-line no-return-assign
          } />
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
      <div style={{display: imgCount > 0 || this.state.edit === entryId
        ? 'block' : 'none'}}>
        <strong>Images</strong>:
        <span>{`${imgCount} picture${imgCount > 1 ? 's' : ''}`}</span>
        <input
          type='button'
          value='Show'
          onClick={this.showPic.bind(this, `showPic-${entry.key}`)}
          style={{display:
            imgCount > 0 && !this.state.showButtons.has(`showPic-${entry.key}`)
              ? 'inline' : 'none'}} />
        <input
          type='button'
          value={this.state.showPic.has(`showPic-${entry.key}`)
              ? 'Hide' : 'Show'}
          onClick={this.togglePic.bind(this, `showPic-${entry.key}`)}
          style={{display:
            this.state.showButtons.has(`showPic-${entry.key}`)
              ? 'inline' : 'none'}} />
        <div id='dropBox' onDragEnter={this.ignoreDrag} onDragOver={this.ignoreDrag}
          style={{display: this.state.edit === entryId ? 'block' : 'none'}}
          onDrop={(event) => {
            event.stopPropagation()
            event.preventDefault()
            let file = event.dataTransfer.files[0]
            let src = file.path
            let filename // initialize it
            if (!file.type.startsWith('image')) {
              return window.alert(`** ${src} ** is not an image file!
Acceptable file types: .jpg .png .gif etc.`)
            } else {
              let suffix = `.${file.type.match(/\/(.+)/)[1]}`
              filename = `${entry.key}-${Date.now()}${suffix}`
            }
            let dest = `${imgNodejs}${filename}`
            fs.copy(src, dest, (err) => {
              if (err) return window.alert(err)
              this.props.entryEdit(entry.key, 'img', filename, pos)
              this.hidePopup()
            })
          }}>
          <div>Drop your image here...</div>
        </div>
      </div>
      <div style={{display: this.state.showPic.has(`showPic-${entry.key}`)
            ? 'block' : 'none'}}>
        {
          entry.img.map((filename, key) => {
            return <div key={key} className='image'>
              <input type='button' value='↓ delete ↓' style={editMode}
                onClick={() => {
                  if (window.confirm(`Delete this photo? [${imgNodejs}${filename}]`)) {
                    fs.remove(`${imgNodejs}${filename}`, (err) => {
                      if (err) return window.alert(err)
                      this.props.entryEdit(entry.key, 'img', key, pos)
                      this.hidePopup()
                    })
                  }
                }} />
              <br />
              <img src={
                `${imgChrome}${filename}`
              } />
              <br />
            </div>
          })
        }
      </div>
    </fieldset>
  }.bind(this))
}
    </div>
    )
  }
})

ReactDOM.render(<AhuiDict />, $('main')) // eslint-disable-line no-undef
