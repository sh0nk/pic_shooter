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
    var imageLarge = '';
    if (this.props.post.filename) {
      image = (<img src={`http://${apiHostPort}/api/file/${this.props.post.filename}`}
                    class="slide__img slide__img--small"
                    alt={this.props.post.filename} />);
      imageLarge = (<img src={`http://${apiHostPort}/api/file/${this.props.post.filename}`}
                    class="slide__img slide__img--large"
                    alt={this.props.post.filename} />);
    }
    var comment = this.props.post.comment;
    if (!comment || comment.length === 0) {
      comment = 'no message';
    }
    return (
      <div class="slide">
        <h2 class="slide__title slide__title--preview">#{this.props.propKey} <span class="slide__message">{comment}</span></h2>
        <div class="slide__item">
          <div class="slide__inner">
            {image}
            <button class="action action--open" aria-label="View details"></button>
            {/* <button class="action action--open" aria-label="View details" style='display: none;'></button> */}
          </div>
        </div>
        <div class="slide__content">
          <div class="slide__content-scroller">
            {imageLarge}
            <div class="slide__details">
              <h2 class="slide__title slide__title--main">#{this.props.propKey}</h2>
              <div>
                <span class="slide__message slide__message--large">{comment}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class List extends Component {
  // 書き込みリスト
  render() {
    const posts = this.props.posts;
    var list = [];
    // for (var i in posts.slice(0, 5)) {  // FIXME
    for (var i in posts) {  // FIXME
        list.push( <Post key={i} propKey={i} post={posts[i]} /> );
    }
    return (list);
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

  componentDidUpdate() {
    var el = document.getElementById('slideshow');
    document.documentElement.className = 'js';
    new window.CircleSlideshow(el);
  }

  render() {
    return (
      <span>
        <div id="slideshow" class="slideshow">
          <List posts={this.state.posts}/>
          <button class="action action--close" aria-label="Close"><i class="fa fa-close"></i></button>
        </div>
        {/* {new window.CircleSlideshow(document.getElementById('slideshow'))} */}
        {/* <script type='javascript' dangerouslySetInnerHTML={{ __html: script }}></script> */}
      </span>
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

