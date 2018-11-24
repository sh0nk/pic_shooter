import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';


require('dotenv').config();

console.log(process.env);

const apiHostPort = process.env.REACT_APP_API_ADDR;
const ioHostPort = process.env.REACT_APP_API_ADDR;

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
      </div>
    );
  }
}

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


class Header extends Component {
  render() {
    return (
      <header>
      <h1>画像表示用</h1>
      </header>
    );
  }
}

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

      // delayed call to ensure the entry existence
      setTimeout(() => {
        getOnePost(filename, (receiptData) => {
          console.log('metadata receipt: ');
          console.log(receiptData);

          // TODO: change to load only one target image?
          if (receiptData != null && receiptData.length === 1) {
            this.prependNewImage(filename, receiptData[0].comment);
          } else {
            console.log("metadata has something wrong.");
          }
        });
      }, 1000);
    });

    this.updatePosts = this.updatePosts.bind(this);
  }

  prependNewImage(filename, comment) {
    console.log('prepend');
    const posts = this.state.posts.slice();
    posts.unshift({
      filename: filename,
      comment: comment,
    });
    this.setState({posts: posts});
  }

  updatePosts(e) {
    getPostList((data) => {
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

function getPostList(callback) {
  fetch('/api/v1/Post?sort={"_id":-1}')
    .then(response => response.json())
    .then((data) => {callback(data)});
}

function getOnePost(filename, callback) {
  fetch('/api/v1/Post?query={"filename":"' + filename + '"}')
    .then(response => response.json())
    .then((data) => {callback(data)});
}

export default App;

