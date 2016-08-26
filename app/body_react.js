var AhuiDict = React.createClass({
  getInitialState: function() {
    return {
      errorMsg: [],
      successMsg: [],
      continueButton: 'none'
    }
  },
  componentDidMount: function() {
    let request = indexedDB.open('dictDB')
    
    request.onerror = (event) => {
      let errorMsg = this.state.errorMsg
      errorMsg.push(event.target.error)
      this.setState({
        errorMsg: errorMsg
      })
    }

    request.onsuccess = (event) => {
      let db = event.target.result
      let successMsg = this.state.successMsg
      successMsg.push('on success:')
      successMsg.push(`current version: ${db.version}`)
      // this.setState({
      //   successMsg: successMsg
      // })

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
        successMsg.push('Open objectStore ... successful')
        successMsg.push(`How many records in   indexedDB  : ${count}`)
        successMsg.push(`How many records in database.json: ${len}`)

        if (count === len) {
          successMsg.push('Quantity checking ... OK!')
          successMsg.push('Click the "Continue" button to display all words.')
          this.setState({
            continueButton: 'block'
          })
        } else {
          let errorMsg = this.state.errorMsg
          errorMsg.push(event.target.error)
          this.setState({
            errorMsg: errorMsg
          })
          transaction.abort()
        }
      }
      
      this.setState({
        successMsg: successMsg
      })
    }
  },

  render: function() {
    return (
      <article>
        <header>
          <h1>{packageJSON.name}</h1>
          <p>{`${packageJSON.name} ${packageJSON.version}, Node ${process.versions.node}, Chrome ${process.versions.chrome}, Electron ${process.versions.electron}.`}</p>
        </header>
        <AhuiDict.Info errorMsg={this.state.errorMsg}
                       successMsg={this.state.successMsg}
                       continueButton={this.state.continueButton} />
        <AhuiDict.Words />
      </article>
    )
  }
})

AhuiDict.Info = React.createClass({
  render: function() {
    return (
      <section>
        <h2>Loading...</h2>
        {
          this.props.successMsg.map(function(msg, i) {
            return <p key={i}>{msg}</p>
          })
        }
        <input type='button'
               value='Continue'
               style={{display: this.props.continueButton}} />
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
  render: function() {
    return (
      <section>
        <h2></h2>
      </section>
    )
  }
})

ReactDOM.render(<AhuiDict />, $('main'))