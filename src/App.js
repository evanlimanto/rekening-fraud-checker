import React, { Component } from 'react';
import request from 'superagent';
import 'bulma/css/bulma.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { message: null, loading: false };
    this.check = this.check.bind(this);
  }

  check() {
    this.setState({ loading: true });
    const account = this.refs.account.value;
    const url = "/check/" + account;
    request.get(url).end((err, res) => {
      this.setState({ message: res.text, loading: false });
    });
  }

  render() {
    return (
      <div className="container">
        <section className="section">
          <div className="content">
            <h1>Rekening Fraud Checker</h1>
            <div className="columns">
              <div className="column is-half">
                <div className="field is-small">
                  <label className="label">Account</label>
                  <div className="control">
                    <input className="input" type="text" placeholder="Input Nomor Rekening" ref="account" />
                  </div>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="control">
                <button className="button is-primary" onClick={this.check}>
                  Check {!this.state.loading || <span className="loader" style={{ marginLeft: "5px" }}></span>}
                </button>
              </div>
            </div>
            <p>{this.state.message}</p>
          </div>
        </section>
      </div>
    );
  }
}

export default App;
