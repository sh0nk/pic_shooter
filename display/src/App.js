import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';

var apiHostPort = 'localhost:3000';
var ioHostPort = 'localhost:3000';

/**
* 書き込み１件
*/
class Post extends Component {
  render() {
    var image = '';
    if (this.props.post.filename) {
      image = (<img src={`http://${apiHostPort}/api/file/${this.props.post.filename}`}
                    alt={this.props.post.filename} />);
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
* ヘッダー
*/
class Header extends Component {
  render() {
    return (
      <header>
      <h1>画像表示用</h1>
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

    this.socket = io(ioHostPort);

    this.socket.on('image received', filename => {
      console.log('image received');
      console.log(filename);
      this.prependNewImage(filename); // TODO: change to load only one target image?
    });

    this.updatePosts = this.updatePosts.bind(this);
  }

  prependNewImage(filename) {
    console.log('prepend');
    const posts = this.state.posts.slice();
    posts.unshift({
      filename: filename
    });
    this.setState({posts: posts});
  }

  updatePosts(e) {
    getPost((data) => {
      console.log('set state');
      console.log(data);
      this.setState({posts: data});
    });
  }

  render() {
    // this.updatePosts();
    return (
      <div className="App">
      <Header />
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

