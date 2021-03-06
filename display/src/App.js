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

    var tilt_css = shuffle(Array.from(["slide__img_left_tilt_small", "slide__img_left_tilt_large", "slide__img_right_tilt_small", "slide__img_right_tilt_large"]))[0];

    if (this.props.post.filename) {
      image = (<img src={`http://${apiHostPort}/api/file/${this.props.post.filename}`}
                    className={`slide__img slide__img--small ${tilt_css}`}
                    alt={this.props.post.filename} />);
      imageLarge = (<img src={`http://${apiHostPort}/api/file/${this.props.post.filename}`}
                    className="slide__img slide__img--large"
                    alt={this.props.post.filename} />);
    }
    var comment = this.props.post.comment;
    if (!comment || comment.length === 0) {
      comment = 'no message';
    }

    return (
      <div className="slide">
        <h2 className="slide__title slide__title--preview"><span className="slide__message"></span></h2>
        <div className="slide__item">
          <div className="slide__inner">
            {image}
            {/* <button className="action action--open" aria-label="View details" style='display: none;'></button> */}
            <button className="action action--open" aria-label="View details"></button>
          </div>
        </div>
        <div className="slide__content">
          <div className="slide__content-scroller">
            {imageLarge}
            <div className="slide__details">
              <h2 className="slide__title slide__title--main"> </h2>
              <div>
                <span className="slide__message slide__message--large"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class List extends Component {
  render() {
    const posts = this.props.posts;
    const idx = this.props.idx;
    var list = [];

    if (posts === null || posts.length < 1) {
      return list;
    }

    for (var i = 0; i < posts.length; i++) {
        list.push( <Post key={i} propKey={idx[i]} propListNum={posts.length} post={posts[i]} /> );
    }
    return (list);
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      idx: []
    };
    this.updatePosts();
    this.CircleSlideshow = null;

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
            // reset contents once
            this.prependNewImageAfterShuffling(filename, receiptData[0].comment);
            // this.setState({posts: posts});
          } else {
            console.log("metadata has something wrong.");
          }
        });
      }, 1000);
    });

    this.updatePosts = this.updatePosts.bind(this);
  }

  prependNewImageAfterShuffling(filename, comment) {
    console.log('prepend');
    const posts = this.state.posts.slice();
    const newIndex = posts.length;

    var idx = shuffle(Array.from({length: posts.length}, (v, k) => k));
    var orderedArray = [];
    for (var i = 0; i < posts.length; i++) {
      orderedArray.push(posts[idx[i]]);
    }
    orderedArray.unshift({
      filename: filename,
      comment: comment,
    });
    idx.unshift(newIndex);

    // force reset the rendered slides
    this.setState({posts: []});

    this.setState({
      posts: orderedArray, 
      idx: idx,
    });
  }

  updatePosts(e) {
    getPostList((data) => {
      // assume data is not null
      console.log('set state');
      console.log(data);
      
      this.setPostWithShuffling(data);
    });
  }

  setPostWithShuffling(posts) {
    var idx = shuffle(Array.from({length: posts.length}, (v, k) => k));
    var orderedArray = [];
    for (var i = 0; i < posts.length; i++) {
      orderedArray.push(posts[idx[i]]);
    }
    this.setState({
      posts: orderedArray, 
      idx: idx,
    });
  }

  componentDidUpdate() {
    var el = document.getElementById('slideshow');
    document.documentElement.className = 'js';
    this.CircleSlideshow = new window.CircleSlideshow(el);
  }

  componentWillUpdate() {
    console.log('componentWillUpdate called');
    // Since these components are not under control by React
    document.querySelectorAll('.navbutton').forEach((el) => {
      el.remove();
    });
    document.querySelectorAll('.deco').forEach((el) => {
      el.remove();
    });
  }

  render() {
    return (
      <span>
        <div id="slideshow" className="slideshow">
          <List posts={this.state.posts} idx={this.state.idx}/>
          <button className="action action--close" aria-label="Close"><i className="fa fa-close"></i></button>
        </div>
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

function shuffle(array) {
  var n = array.length, t, i;
  while (n) {
    i = Math.floor(Math.random() * n--);
    t = array[n];
    array[n] = array[i];
    array[i] = t;
  }
  return array;
}


export default App;

