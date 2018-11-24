import React, { Component } from 'react';
import './App.css';

require('dotenv').config();

console.log(process.env);


class ImageUpload extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = (e) => {
    e.preventDefault();
    var form = new FormData();
    form.append('image', e.target.files[0]);
    var url = URL.createObjectURL(e.target.files[0]);

    this.props.onChange(form, url);
  }

  render() {
    return (
      <div>
        <input type="file" name="image" accept="image/*" onChange={this.handleChange} />
      </div>
    );
  }
}

class ImagePreview extends Component {
  render() {
    if (this.props.fileUrl) {
      return (<img src={this.props.fileUrl} alt="preview"/>);
    }
    return null;
  }

}


class UpForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      comment:'',
      message:'画像を送ってください。',
      fileForm: null,
      fileUrl: null,
      filename: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileAttached = this.handleFileAttached.bind(this);
    this.handleSubmitComment = this.handleSubmitComment.bind(this);
  }

  handleUploadFile() {
    console.log('uploading file');

    fetch('/api/upload', {
      method: "POST",
      body: this.state.fileForm,
    }).then(
      response => response.json()
    ).then(
      data => {
        console.log(data.filename);
        this.setState({
          filename: data.filename,
        });

        console.log('image:' + data.filename + ' send done.');
        this.handleSubmitComment();
      }
    );
  }

  handleSubmit = (e) => {
    e.preventDefault();

    this.handleUploadFile();
  }

  handleSubmitComment() {
    fetch('/api/v1/Post', {
      method : "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        comment: this.state.comment,
        filename: this.state.filename
      })
    }).then(data => {
      console.log('metadata for image:' + this.state.filename + ' send done.');
      this.setState({
        message: '画像を送信しました。',
        filename: ''
      });
    });
  }

  handleChange = (e) => {
    this.setState({ message: '' });
    this.setState({ [e.target.name] :e.target.value});
  }

  handleFileAttached = (fileForm, fileUrl) => {
    this.setState({
      fileForm: fileForm,
      fileUrl: fileUrl,
    });
  }

  render() {
    return  (
      <div className="form">
        <p>{this.state.message}</p>
        <label>画像</label>
        <ImageUpload onChange={this.handleFileAttached}/>
        <ImagePreview fileUrl={this.state.fileUrl} />
        <form onSubmit={this.handleSubmit}>
          <label>コメント</label>
          <textarea name="comment" value={this.state.comment} 
                    onChange={(form, url) => this.handleChange(form, url)}></textarea>
          <button type="submit">投稿</button>
        </form>
      </div>
    );
  }
}

class Header extends Component {
  render() {
    return (
      <header>
      <h1>画像アップローダ</h1>
      </header>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
      <Header />
      <UpForm />
      </div>
    );
  }
}

export default App;

