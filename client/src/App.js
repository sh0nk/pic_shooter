import React, { Component } from 'react';
import {Grid, Row, Col} from 'react-bootstrap';
import { Animate } from 'react-move';
import { easePolyIn } from 'd3-ease';  // For react-move
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
    this.state = {
      selectButtonMsg: "送信する写真を選んでください",
      selectButtonDisabled: false,
      selectButtonId: "imgselect"
    }
    this.handleChange = this.handleChange.bind(this);
  }

  resizeImage = (file) => {
    console.log('resizing file' + file);
    // FIXME: exif orientation https://qiita.com/simiraaaa/items/ee243b69bb0e52af069a
    
    var img = document.createElement("img");
    var reader = new FileReader();

    var orientation;
    document.EXIF.getData(file, function(){
      orientation = file.exifdata.Orientation;
    });

    var onChange = this.props.onChange;
    reader.onload = function(e) {
      img.src = e.target.result;

      img.onload = function(e) {

        //アスペクト取得
        var draw_width, draw_height;
 
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

        // EXIF Orientation
        draw_width = w;
        draw_height = h;
        console.log("EXIF orientation: " + orientation);
        switch(orientation){
          case 2:
            ctx.transform(-1, 0, 0, 1, w, 0);
          break;

          case 3:
            ctx.transform(-1, 0, 0, -1, w, h);
          break;

          case 4:
            ctx.transform(1, 0, 0, -1, 0, h);
          break;

          case 5:
            ctx.transform(-1, 0, 0, 1, 0, 0);
            ctx.rotate((90 * Math.PI) / 180);
            draw_width = h;
            draw_height = w;
          break;

          case 6:
            ctx.transform(1, 0, 0, 1, w, 0);
            ctx.rotate((90 * Math.PI) / 180);
            draw_width = h;
            draw_height = w;
          break;

          case 7:
            ctx.transform(-1, 0, 0, 1, w, h);
            ctx.rotate((-90 * Math.PI) / 180);
            draw_width = h;
            draw_height = w;
          break;

          case 8:
            ctx.transform(1, 0, 0, 1, 0, h);
            ctx.rotate((-90 * Math.PI) / 180);
            draw_width = h;
            draw_height = w;
          break;

          default:
          break;
        }
  
        var ctx2 = canvas.getContext("2d");
        ctx2.drawImage(img, 0, 0, draw_width, draw_height);
  
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

    if (image) {
      this.resizeImage(image);
      this.setState({
        selectButtonMsg: "写真をタップしてアップロード",
        selectButtonDisabled: true,
        selectButtonId: "imgselect_disabled",
      });
    }
  }

  render() {
    return (
      <Col md={12}>
        <div className="center-block text-center">
          <label id={this.state.selectButtonId} htmlFor="imgcont">{this.state.selectButtonMsg}
            <input type="file" id="imgcont" className="imgselect_inner"
                    disabled={this.state.selectButtonDisabled}
                    name="image" accept="image/*" onChange={this.handleChange} />
          </label>
        </div>
      </Col>
    );
  }
}

class ImagePreview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deltaY: 0,
      animationStarted: false
    };
    this.handleClick = this.handleClick.bind(this);
  }

  onPan(ev) {
    console.log('panning now: ' + ev.deltaX);
    this.setState({
      deltaY: ev.deltaY,
    });
  }

  handleClick(e) {
    if (!this.state.animationStarted) {
      this.props.onClick(e);
      this.setState({
        animationStarted: true
      });
      console.log("animation started");
    } else {
      console.log("animation was already started. nothing to do.");
    }
  }

  render() {
    if (this.props.fileUrl) {

      return (
        <Col md={12}>
          <Animate
            start={() => ({
              y: 0,
              opacity: 1
            })}
            update={() => ({
              y: [this.state.animationStarted ? -1000 : 0],
              opacity: [this.state.animationStarted ? 0 : 1],
              timing: { 
                delay: 500,
                duration: 2000, 
                ease: easePolyIn
              }
            })}
            leave={() => ({
              opacity: 0
            })}
            >
            {(innerState) => (
              <div id='preview' class="text-center"
                style={{
                  transform: `translate(0, ${innerState.y}px)`,
                  WebkitTransform: `translate(0, ${innerState.y}px)`,
                  opacity: innerState.opacity
                }}
              >
                <img src={this.props.fileUrl} alt="preview" id="preview"
                    onClick={this.handleClick} 
                />
              </div>
            )}
          </Animate>
        </Col>
        
      );
    } else {
      return (
        <Col md={12}>
          <div id='preview'></div>
        </Col>
      );
    }
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
      textAreaReadOnly: false,
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
    console.log('uploading file2');
    e.preventDefault();

    console.log("freezing text area");
    this.setState({ textAreaReadOnly: true });

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

      setTimeout(() => {
        window.location.reload();
      }, 5000);
    });
  }

  handleChange = (e) => {
    this.setState({ message: '' });
    this.setState({ [e.target.name]: e.target.value });
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
        <Row>
          <ImagePreview fileUrl={this.state.fileUrl}
                        onClick={this.handleSubmit} />
        </Row>
        <Row>
          <ImageAttach onChange={this.handleFileAttached}/>
        </Row>
        <Row>
          <form>
            <div className="text-center">
              <input name="comment" value={this.state.comment}
                        placeholder="コメントを入力..." 
                        className="textform"
                        type="hidden"
                        readOnly={this.state.textAreaReadOnly}
                        onChange={(form, url) => this.handleChange(form, url)}></input>
              送信がうまくいかない場合や、複数枚送信したい場合はページをリロードして下さい。
            </div>
          </form>
        </Row>
      </div>
    );
  }
}

class Header extends Component {
  render() {
    return (
      <Row><Col md={12}>
        <header>
          <h2 className="text-center">○○&△△'s Wedding</h2>
        </header>
      </Col></Row>
    );
  }
}

class App extends Component {
  render() {
    return (
      <Grid>
        <div className="App">
          <Header />
          <UpForm />
        </div>
      </Grid>
    );
  }
}

export default App;

