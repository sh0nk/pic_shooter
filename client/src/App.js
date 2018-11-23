import React, { Component } from 'react';
import './App.css';

var apiHostPort = 'localhost:3000';

/**
* 書き込み１件
*/
class Post extends Component {
  render() {
    var image = '';
    if (this.props.post.filename) {
      image = (<img src={`http://${apiHostPort}/api/file/${this.props.post.filename}`} alt={this.props.post.filename} />);
    }
    return (
      <div className="comment">
        <div>{this.props.post.comment}</div>
        {image}
        <p className="name">{this.props.post.name}</p>
      </div>
    );
  }
}

/**
* 書き込みリスト
*/
class List extends Component {
  // 書き込みリスト
  render() {
    const posts = this.props.posts;
    var list = [];
    for (var i in posts) {
      list.push( <li key={i}><Post post={posts[i]} /></li> );
    }
    return (<ul>{list}</ul>);
  }
}

/**
* 画像アップ用のコントロール
*/
class ImageUpload extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = (e) => {
    e.preventDefault();
    var form = new FormData();
    form.append('image', e.target.files[0]);

    this.props.onChange(form);
  }

  render() {
    return (
      <div>
        <input type="file" name="image" accept="image/*" onChange={this.handleChange} />
      </div>
    );
  }
}


/**
* 投稿フォーム
*/
class UpForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      comment:'',
      message:'画像を送ってください。',
      fileForm: null,
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
      this.setState({
        message:'画像を送信しました。',
        filename: ''
      });
    }).then(() => {this.props.onSubmit()});
  }

  handleChange = (e) => {
    this.setState({ message: '' });
    this.setState({ [e.target.name] :e.target.value});
  }

  handleFileAttached = (fileForm) => {
    this.setState({
      fileForm: fileForm,
    });
  }

  render() {
    return  (
      <div className="form">
        <p>{this.state.message}</p>
        <form onSubmit={this.handleSubmit}>
          <label>コメント</label>
          <textarea name="comment" value={this.state.comment} onChange={this.handleChange}></textarea>
          <button type="submit">投稿</button>
        </form>
        <label>画像</label>
        <ImageUpload onChange={this.handleFileAttached}/>
      </div>
    );
  }
}

/**
* ヘッダー
*/
class Header extends Component {
  render() {
    return (
      <header>
      <h1>画像アップローダ</h1>
      </header>
    );
  }
}

/**
* 全画面
*/
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      posts: []
    };
    this.updatePosts();

    this.updatePosts = this.updatePosts.bind(this);
  }

  updatePosts(e) {
    getPost((data) => {
      this.setState({posts: data});
    });
  }

  render() {
    // this.updatePosts();
    return (
      <div className="App">
      <Header />
      <UpForm onSubmit={this.updatePosts}/>
      <List posts={this.state.posts}/>
      </div>
    );
  }
}

/**
* サーバーから書き込み一覧を取得する
* @method getPost
* @param  {Function} callback データ取得後のコールバック
* @return {[type]}
*/
function getPost(callback) {
  fetch('/api/v1/Post?sort={"_id":-1}')
    .then(response => response.json())
    .then((data) => {callback(data)});
}

export default App;

