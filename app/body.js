const {clipboard} = require('electron')
const fs = require('fs-extra')
const imgNodejs = './app/images/'
const imgChrome = './images/'
const Fields = ['jp', 'cn', 'en', 'tags', 'notes', 'img']
const MAX = 10

const Datastore = require('nedb')
const db = new Datastore({
  filename: './app/database.nedb',
  timestampData: true
})

var AhuiDict = React.createClass({ // eslint-disable-line no-undef
  getInitialState: function () {
    return {
      dbSize: 0,
      checkboxes: new Set(['JP', 'CN', 'EN', 'Tags', 'Notes']),
      opt: 'contain',
      searchResult: [],
      popup: '',
      edit: '',
      notes: '',
      showPic: new Set(),

      // When the Show button is clicked, add it in to state.showButtons,
      // If the show button is in state.Buttons, hide it,
      // at the same time, show the toggle button.
      showButtons: new Set()
    }
  },

  componentDidMount: function () {
    db.loadDatabase((err) => {
      if (err) window.alert(`Error(loadDatabase): ${err}`)
      db.count({}, (err, count) => {
        if (err) window.alert(err)
        this.setState({dbSize: count, continueButton: 'block'})
      })
    })
    this.search.focus()
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

  entryDel: function (id, field, item, i, pos) {
    let obj = {}
    obj[field] = item
    db.update({_id: id}, {$pull: obj}, {}, (err) => {
      if (err) window.alert(err)
      let searchResult = this.state.searchResult
      searchResult[pos][field].splice(i, 1)
      searchResult[pos]['updatedAt'] = new Date()
      this.setState({searchResult: searchResult})
      this.hidePopup()
    })
  },

  entryUpdate: function (id, field, element, i, pos) {
    let searchResult = this.state.searchResult
    let newfield = searchResult[pos][field]
    newfield.splice(i, 1, element.value)
    let obj = {}
    obj[field] = newfield
    db.update({_id: id}, {$set: obj}, {}, (err) => {
      if (err) window.alert(err)
      searchResult[pos][field] = newfield
      searchResult[pos]['updatedAt'] = new Date()
      this.setState({searchResult: searchResult})
      this.hidePopup()
    })
  },

  entryAdd: function (id, field, element, pos) {
    let obj = {}
    obj[field] = element.value
    db.update({_id: id}, {$push: obj}, {}, (err) => {
      if (err) window.alert(err)
      let searchResult = this.state.searchResult
      searchResult[pos][field].push(element.value)
      searchResult[pos]['updatedAt'] = new Date()
      this.setState({searchResult: searchResult})
      element.value = ''
      this.hidePopup()
    })
  },

  imgAdd: function (id, field, filename, pos) {
    let obj = {}
    obj[field] = filename
    db.update({_id: id}, {$push: obj}, {}, (err) => {
      if (err) window.alert(err)
      let searchResult = this.state.searchResult
      searchResult[pos][field].unshift(filename)
      searchResult[pos]['updatedAt'] = new Date()
      this.setState({searchResult: searchResult})
    })
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

  onSearch: function (pattern, opt, fields) {
    if (pattern === '') {
      this.setState({searchResult: []})
      return
    }
    switch (opt) {
      case 'begin':
        pattern = new RegExp(`^${pattern}`)
        break
      case 'end':
        pattern = new RegExp(`${pattern}$`)
        break
      case 'contain':
      case 'RegExp':
        pattern = new RegExp(pattern)
        break
    }
    fields = Array.from(fields)
    fields = fields.map((field) => field.toLowerCase())
    let queries = []
    for (let key in fields) {
      let query = {}
      let field = fields[key]
      query[field] = pattern
      queries.push(query)
    }
    db.find({$or: queries}).limit(MAX).exec((err, docs) => {
      if (err) window.alert(err)
      for (let key in docs) {
        let doc = docs[key]
        for (let key in Fields) {
          let field = Fields[key]
          if (!doc[field]) doc[field] = []
        }
      }
      this.setState({searchResult: docs})
    })
  },

  render: function () {
    let resultCount = this.state.searchResult.length
    return (<article>
      <header>
        <h1>{
          packageJSON.name // eslint-disable-line no-undef
        }</h1>
        <p>{
          `${packageJSON.name} ${packageJSON.version}, Node ${process.versions.node}, Chrome ${process.versions.chrome}, Electron ${process.versions.electron}.` // eslint-disable-line no-undef
        }</p>
        {
          this.state.dbSize > 0
          ? <p>
            {this.state.dbSize} entries in database.
            <span>
              <input type='button' value='Add' onClick={() => {
                let newEntry = {}
                Fields.forEach((field) => {
                  newEntry[field] = []
                })
                db.insert(newEntry, (err, newDoc) => {
                  if (err) window.alert(err)
                  let searchResult = this.state.searchResult
                  searchResult.unshift(newDoc)
                  let dbSize = this.state.dbSize + 1
                  this.setState({
                    searchResult: searchResult,
                    edit: `entry-${newDoc._id}`,
                    dbSize: dbSize
                  })
                })
              }} /> a new Entry.
            </span>
          </p>
          : <h3>Loading ...</h3>
        }
      </header>

      <section id='searchSection'
        style={{display: this.state.dbSize > 0 ? 'block' : 'none'}}>

        <input type='search' size='50'
          ref={
            (ref) => this.search = ref // eslint-disable-line no-return-assign
          }
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              this.onSearch(this.search.value, this.state.opt, this.state.checkboxes)
            }
          }} />
        <input type='button' value='Search' onClick={() => {
          this.onSearch(this.search.value, this.state.opt, this.state.checkboxes)
        }} />

        <table><tbody><tr>
{
  ['JP', 'CN', 'EN', 'Tags', 'Notes'].map((field) => {
    return <td key={field}><label>
      <input type='checkbox' checked={this.state.checkboxes.has(field)}
        onChange={() => {
          let checkboxes = this.state.checkboxes
          if (checkboxes.has(field)) {
            checkboxes.delete(field)
            if (checkboxes.size === 0) {
              checkboxes = new Set(['JP', 'CN', 'EN'])
            }
          } else {
            checkboxes.add(field)
          }
          this.setState({checkboxes: checkboxes})
        }} />
      {field}
    </label></td>
  })
}
        </tr><tr>
{
  ['exactly', 'begin', 'end', 'contain', 'RegExp'].map((opt) => {
    return <td key={opt}><label>
      <input type='radio' checked={this.state.opt === opt} onChange={() => {
        this.setState({opt: opt})
      }} />
      {opt}
    </label></td>
  })
}
        </tr></tbody></table>

      </section>

      <section id='resultSection'>
      {
        this.search && this.search.value !== ''
        ? resultCount > 0
          ? <p>[ {this.search.value} ] : Found {resultCount} {resultCount > 1 ? 'entries' : 'entry'}.</p>
          : <p>[ {this.search.value} ] : Not found.</p>
        : ''
      }
{
  this.state.searchResult.map((entry, pos) => { // searchResult[pos] -> entry
    let imgCount = entry.img.length
    let entryId = `entry-${entry._id}`
    let editMode = {display: this.state.edit === entryId ? 'inline' : 'none'}
    return <fieldset key={pos}>
      <legend>
        {pos + 1}
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
              if (window.confirm(`Delete ** entry ${entry._id} ** ?`)) {
                db.remove({_id: entry._id}, {}, (err) => {
                  if (err) window.alert(err)
                  let searchResult = this.state.searchResult
                  searchResult.splice(pos, 1)
                  let dbSize = this.state.dbSize - 1
                  this.setState({searchResult: searchResult, dbSize: dbSize})
                })
              }
            }} />
        </span>
      </legend>
{
  ['_id', 'createdAt', 'updatedAt'].map((field, key) => {
    return <p key={key} className='moreInfo' style={{display:
      this.state.edit === entryId ? 'block' : 'none'}}>
      {`${field}: ${entry[field] instanceof Date
        ? entry[field].toDateString() : entry[field]}`}
    </p>
  })
}
{
  ['jp', 'cn', 'en', 'tags'].map((field, key) => {
    let refId = `${field}-${entry._id}`
    return <p key={key} className={field} style={{display:
      entry[field].length > 0 || this.state.edit === entryId
      ? 'block' : 'none'}}>
      <strong>{field === 'tags' ? 'Tags' : field.toUpperCase()}</strong>:
      {
        entry[field].map(function (item, i) {
          let popupId = `${entryId}-${field}-${i}`
          return <span key={i}>
            <code onClick={this.popup.bind(this, popupId)}>{item}</code>
            <span className='popup' style={{display:
              this.state.popup === popupId ? 'inline' : 'none'}}>
              <input type='button' value='copy' onClick={() => {
                clipboard.writeText(item)
              }} />
              <input type='button' value='delete' onClick={() => {
                if (window.confirm(`Delete ** ${item}  ** ?`)) {
                  this.entryDel(entry._id, field, item, i, pos)
                }
              }} />
            </span>
          </span>
        }.bind(this))
      }
      <span style={{display: this.state.edit === entryId
              ? 'inline' : 'none'}}>
        <input type='text'
          ref={
            (ref) => this[refId] = ref // eslint-disable-line no-return-assign
          }
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              this.entryAdd(entry._id, field, this[refId], pos)
            } }} />
        <input type='button' value='add' onClick={() => {
          this.entryAdd(entry._id, field, this[refId], pos)
        }} />
      </span>
    </p>
  })
}
      <div style={{display:
        entry.notes.length > 0 || this.state.edit === entryId
        ? 'block' : 'none'}}>
        <strong>Notes</strong>:
        <span style={editMode}>
          <textarea rows='2' cols='50'
            ref={
              (ref) => this[`notes-${entry._id}`] = ref // eslint-disable-line no-return-assign
            } />
          <input type='button' value='add' onClick={this.entryAdd.bind(
            this, entry._id, 'notes', this[`notes-${entry._id}`], pos)} />
        </span>
        <ul style={{listStyle: this.state.edit === entryId ? 'none' : 'disc'}}>
{
  entry.notes.map((item, i) => {
    let noteId = `entry-${entry._id}-notes-${i}`
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
        <input type='button' value='delete' onClick={() => {
          if (window.confirm(`Delete ** ${item}  ** ?`)) {
            this.entryDel(entry._id, 'notes', item, i, pos)
          }
        }} />
        <input type='button' value='update' onClick={this.entryUpdate.bind(
          this, entry._id, 'notes', this[noteId], i, pos)} />
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
          onClick={this.showPic.bind(this, `showPic-${entry._id}`)}
          style={{display:
            imgCount > 0 && !this.state.showButtons.has(`showPic-${entry._id}`)
              ? 'inline' : 'none'}} />
        <input
          type='button'
          value={this.state.showPic.has(`showPic-${entry._id}`)
              ? 'Hide' : 'Show'}
          onClick={this.togglePic.bind(this, `showPic-${entry._id}`)}
          style={{display:
            this.state.showButtons.has(`showPic-${entry._id}`)
              ? 'inline' : 'none'}} />
        <div id='dropBox' onDragEnter={this.ignoreDrag} onDragOver={this.ignoreDrag}
          style={{display: this.state.edit === entryId ? 'block' : 'none'}}
          onDrop={(event) => {
            event.stopPropagation()
            event.preventDefault()
            let file = event.dataTransfer.files[0]
            let src = file.path
            let filename // initialize
            if (!file.type.startsWith('image')) {
              return window.alert(`** ${src} ** is not an image file! \
Acceptable file types: .jpg .png .gif etc.`)
            } else {
              let suffix = `.${file.type.match(/\/(.+)/)[1]}`
              filename = `${entry._id}${suffix}`
            }
            let dest = `${imgNodejs}${filename}`
            fs.copy(src, dest, (err) => {
              if (err) return window.alert(err)
              this.imgAdd(entry._id, 'img', filename, pos)
              this.hidePopup()
            })
          }}>
          <div>Drop your image here...</div>
        </div>
      </div>
      <div style={{display: this.state.showPic.has(`showPic-${entry._id}`)
            ? 'block' : 'none'}}>
{
  entry.img.map((filename, key) => {
    return <div key={key} className='image'>
      <input type='button' value='↓ delete ↓' style={editMode}
        onClick={() => {
          if (window.confirm(`Delete this photo? [${imgNodejs}${filename}]`)) {
            fs.remove(`${imgNodejs}${filename}`, (err) => {
              if (err) return window.alert(err)
              this.entryDel(entry._id, 'img', filename, key, pos)
            })
          }
        }} />
      <br /><img src={`${imgChrome}${filename}`} /><br />
    </div>
  })
}
      </div>
    </fieldset>
  })
}
      </section>

    </article>)
  }
})

ReactDOM.render(<AhuiDict />, $('main')) // eslint-disable-line no-undef
