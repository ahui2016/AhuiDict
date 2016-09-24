const {clipboard} = require('electron')
const fs = require('fs-extra')
const imgNodejs = './app/images/'
const imgChrome = './images/'
const Categories = ['jp', 'cn', 'en', 'tags', 'notes', 'img']
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
      checkboxes: new Set(['JP', 'CN', 'EN']),
      opt: 'exactly',
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

  entryDel: function(id, category, item, i, pos) {
    if (window.confirm(`Delete ** ${this.state.searchResult[pos][category][i]}  ** ?`)) {
      let obj = {}
      obj[category] = item
      db.update({_id: id}, {$pull: obj}, {}, (err) => {
        if (err) window.alert(err)
        let searchResult = this.state.searchResult
        searchResult[pos][category].splice(i, 1)
        this.setState({searchResult: searchResult})
        this.hidePopup()
      })
    }
  },

  entryUpdate: function(id, category, item, i, pos) {
    let searchResult = this.state.searchResult
    let newCategory = searchResult[pos][category]
    newCategory.splice(i, 1, item)
    let obj = {}
    obj[category] = newCategory
    db.update({_id: id}, {$set: obj}, {}, (err) => {
      if (err) window.alert(err)
      searchResult[pos][category] = newCategory
      this.setState({searchResult: searchResult})
      this.hidePopup()
    })
  },

  entryAdd: function(id, category, element, pos) {
    let obj = {}
    obj[category] = element.value
    db.update({_id: id}, {$push: obj}, {}, (err) => {
      if (err) window.alert(err)
      let searchResult = this.state.searchResult
      searchResult[pos][category].push(element.value)
      this.setState({searchResult: searchResult})
      element.value = ''
      this.hidePopup()
    })
  },

  jpCnEn: function (entry, category, pKey, pos) {
    let entryId = entry['_id']
    let refId = `${category}-${entryId}`
    return (
      <p key={pKey} className={category} style={{display:
          entry[category].length > 0 || this.state.edit === `entry-${entryId}`
          ? 'block' : 'none'}}>
        <strong>{category === 'tags' ? 'Tags' : category.toUpperCase()}</strong>:
{
  entry[category].map(function (item, i) {
    let popupId = `${category}-${i}-${entryId}`
    return <span key={i}>
      <code onClick={this.popup.bind(this, popupID)}>{item}</code>
      <span className='popup' style={{display: this.state.popup === popupID
        ? 'inline' : 'none'}}>
        <input type='button' value='copy' onClick={() => {
          clipboard.writeText(item)
        }} />
        <input type='button' value='delete' onClick={
          this.entryDel.bind(this, entryId, category, item, i, pos)
        } />
      </span>
    </span>
  }.bind(this))
}
        <span style={{display: this.state.edit === `entry-${entryId}`
                ? 'inline' : 'none'}}>
          <input type='text'
            ref={
              (ref) => this[refId] = ref // eslint-disable-line no-return-assign
            }
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                this.entryAdd(entryId, category, this[refId], pos)
              } }} />
          <input type='button' value='add' onClick={() => {
            this.entryAdd(entryId, category, this[refId], pos)
          }} />
        </span>
      </p>
    )
  },

  render: function () {
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
          ? <p>{`${this.state.dbSize} documents in database.`}</p>
          : <h3>Loading ...</h3>
        }
      </header>

      <section id='searchSection'
        style={{display: this.state.dbSize > 0 ? 'block' : 'none'}}>

        <input type='search' size='50' ref={
          (ref) => this.search = ref // eslint-disable-line no-return-assign
        } />
        <input type='button' value='Search' onClick={() => {
          this.onSearch(this.search.value, this.state.opt, this.state.checkboxes)
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
  this.state.searchResult.map((entry, pos) => { // searchResult[pos] -> entry
    let imgCount = entry.img.length
    let entryId = `entry-${entry['_id']}`
    let editMode = {display: this.state.edit === entryId ? 'inline' : 'none'}
    return <fieldset key={pos}>
      <legend>
        {entry['_id']}
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
              if (window.confirm(`Delete ** entry ${entry['_id']} ** ?`)) {
                db.remove({_id: entry['_id']}, {}, (err) => {
                  if (err) window.alert(err)
                  let searchResult = this.state.searchResult
                  searchResult.splice(pos, 1)
                  this.setState({searchResult: searchResult})
                })
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
              (ref) => this[`notes-${entry['_id']}`] = ref // eslint-disable-line no-return-assign
            } />
          <input type='button' value='add' onClick={this.entryAdd.bind(
            this, entry['_id'], 'notes', this[`notes-${entry['_id']}`], pos)} />
        </span>
        <ul style={{listStyle: this.state.edit === entryId ? 'none' : 'disc'}}>
{
  entry.notes.map((item, i) => {
    let noteId = `entry-${entry['_id']}-notes-${i}`
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
          this.entryDel.bind(this, entry['_id'], 'notes', item, i, pos)} />
        <input type='button' value='update' onClick={this.entryUpdate.bind(
          this, entry['_id'], 'notes', this[noteId].value, i, pos)} />
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
          onClick={this.showPic.bind(this, `showPic-${entry['_id']}`)}
          style={{display:
            imgCount > 0 && !this.state.showButtons.has(`showPic-${entry['_id']}`)
              ? 'inline' : 'none'}} />
        <input
          type='button'
          value={this.state.showPic.has(`showPic-${entry['_id']}`)
              ? 'Hide' : 'Show'}
          onClick={this.togglePic.bind(this, `showPic-${entry['_id']}`)}
          style={{display:
            this.state.showButtons.has(`showPic-${entry['_id']}`)
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
              filename = `${entry['_id']}-${Date.now()}${suffix}`
            }
            let dest = `${imgNodejs}${filename}`
            fs.copy(src, dest, (err) => {
              if (err) return window.alert(err)
              this.props.entryEdit(entry['_id'], 'img', filename, pos)
              this.hidePopup()
            })
          }}>
          <div>Drop your image here...</div>
        </div>
      </div>
      <div style={{display: this.state.showPic.has(`showPic-${entry['_id']}`)
            ? 'block' : 'none'}}>
        {
          entry.img.map((filename, key) => {
            return <div key={key} className='image'>
              <input type='button' value='↓ delete ↓' style={editMode}
                onClick={() => {
                  if (window.confirm(`Delete this photo? [${imgNodejs}${filename}]`)) {
                    fs.remove(`${imgNodejs}${filename}`, (err) => {
                      if (err) return window.alert(err)
                      this.props.entryEdit(entry['_id'], 'img', key, pos)
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
  })
}
      </section>

    </article>)
  }
})

AhuiDict.Words = React.createClass({ // eslint-disable-line no-undef
  render: function () {
    return <div>AhuiDict.Words</div>
  }
})

ReactDOM.render(<AhuiDict />, $('main')) // eslint-disable-line no-undef
