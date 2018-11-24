import React, { Component } from 'react';
import './App.css';

require('dotenv').config();

console.log(process.env);


function urlToFile(url) {
  var blobBin = atob(url.split(',')[1]);
  var array = [];
  for (var i = 0; i < blobBin.length; i++) {
    array.push(blobBin.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: 'image/jpeg', name:'somefile.jpeg'});
}

class ImageAttach extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  resizeImage = (file) => {
    console.log('resizing file' + file);
    
    var img = document.createElement("img");
    var reader = new FileReader();
    var onChange = this.props.onChange;
    reader.onload = function(e) {
      img.src = e.target.result;

      img.onload = function(e) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var FIXED_WIDTH = 1024;
        var FIXED_HEIGHT = 768;
        var w = img.width;
        var h = img.height;
        if (w > h) {
          h *= FIXED_WIDTH / w;
          w = FIXED_WIDTH;
        } else {
          w *= FIXED_HEIGHT / h;
          h = FIXED_HEIGHT;
        }
        canvas.width = w;
        canvas.height = h;
        console.log("height " + h + " width " + w);
  
        var ctx2 = canvas.getContext("2d");
        ctx2.drawImage(img, 0, 0, w, h);
  
        var url = canvas.toDataURL("image/jpeg");

        // console.log(url);
        onChange(url);
      }
    }
    reader.readAsDataURL(file);
  }

  handleChange = (e) => {
    e.preventDefault();
    var image = e.target.files[0];

    this.resizeImage(image);
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

  handleFileAttached = (fileUrl) => {
    var form = new FormData();
    form.append('image', urlToFile(fileUrl));

    this.setState({
      fileForm: form,
      fileUrl: fileUrl,
    });
  }

  render() {
    return  (
      <div className="form">
        <p>{this.state.message}</p>
        <label>画像</label>
        <ImageAttach onChange={this.handleFileAttached}/>
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

