import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, Permissions, FaceDetector, DangerZone } from 'expo';

class SelfieCam extends React.Component {

  static defaultProps = {
    type: Camera.Constants.Type.front,
    countDown: 5, //s
    motionInterval: 500, //ms
    motionTolerance: 5  //if the device moves no more than 5 degrees in any axis between updates, it's consider to be still
  };

  state = {
    hasCameraPermission: null,
    faceDetecting: false,
    faceDetected: false,
    pictureTaken: false,
    countDownStarted: false,
    countDownStartingSecond: 5, //count down starts from 5 and decrements
    motion: null,  //captures device motion
    detectMotion: false
  };

  countDownTimer = null;

  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  componentDidMount() {
    this.motionListener = DangerZone.DeviceMotion.addListener(this.onDeviceMotion);
    setTimeout(() => {
      this.detectMotion = true
    }, 5000);
  }

  componentWillUpdate(nextProps, nextState) {
    if(this.state.detectMotion && nextState.motion && this.state.motion) {
      if(
          Math.abs(nextState.motion.x - this.state.motion.x < this.props.motionTolerance) &&
          Math.abs(nextState.motion.y - this.state.motion.y < this.props.motionTolerance) &&
          Math.abs(nextState.motion.z - this.state.motion.z < this.props.motionTolerance)
      ) { //this means if the phone is held still,
        this.detectFaces(true);
        this.detectMotion(false);
      } else {
        //means its still moving
      }
    }
  }


  onDeviceMotion = (movements) => {
    this.setState({
      motion: movements.accelerationIncludingGravity
    })
  };

  detectFaces(didItDetect) {
    this.setState({
      faceDetecting: true
    })
  }

  detectMotion(didItDetect) {
    this.setState({
      detectMotion: didItDetect
    });

    if(didItDetect) {
      DangerZone.DeviceMotion.setUpdateInterval(this.props.motionInterval);

    } else if(!didItDetect && this.state.faceDetecting) {
      this.motionListener.remove()
    }
  }

  handleFaceDetectionError() {
  }

  handleFaceDetected({faces}) {
    if(faces.length === 1){
      this.setState({
        faceDetected: true
      });
      if(!this.state.faceDetected && !this.state.countDownStarted) {
        this.startCountDown();
      } else {
        this.setState({
          faceDetected: false
        });
        this.cancelCountDown();
      }
    }
  }

  startCountDown() {
    this.setState({
      countDownStarted: true
    });
    this.countDownTimer = setInterval(this.handleCountDown, 1000);

  }

  cancelCountDown() {
    clearInterval(this.countDownTimer);
    this.setState({
      countDownSeconds: this.props.countDownSeconds,
      countDownStarted: false
    })
  }

  handleCountDown = () => {
    if(this.state.countDownStartingSecond > 0 ){
      let newSecond = this.state.countDownStartingSecond - 1;
      this.setState({
        countDownStartingSecond: newSecond
      });
    } else {
      this.cancelCountDown();
      this.takePicture();
    }
  };

  takePicture = () => {
    this.setState({
      pictureTaken: true
    });

    if(this.camera) {
      console.log('take picture');
      this.camera.takePictureAsync({ onPictureSaved: this.onPictureSaved });
    }
  };

  onPictureSaved = () => {
    this.detectFaces(false);
  };

  render() {
    const {hasCameraPermission} = this.state;
    if (hasCameraPermission === null) {
      return <View/>
    } else if (hasCameraPermission === false) {
      return <Text>NO PERMISSION TO ACCESS CAMERA</Text>
    } else {
      return (
          <View style={{flex: 1}}>
            <Camera
              style={{flex: 1}}
              ref = {ref => {this.camera = ref}}
              type = {this.props.type}
              onFacesDetected: {this.state.faceDetecting ? this.handleFaceDetected : undefined}
              onFaceDetectionError={this.handleFaceDetectionError.bind(this)}
              faceDetectorSettings={{
                mode: FaceDetector.Constants.Mode.fast,
                detectLandmarks: FaceDetector.Constants.Mode.none,
                runClassifications: FaceDetector.Constants.Mode.none,
              }}
            >
              <View
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    flexDirection: 'row',
                    position: 'absolute',
                    bottom: 0,
                  }}>
                <Text
                    style={styles.textStandard}>
                  {this.state.faceDetected ? 'Face Detected' : 'No Face Detected'}
                </Text>
              </View>
              <View
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    flexDirection: 'row',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: this.state.faceDetected && !this.state.pictureTaken ? 'flex' : 'none',
                  }}>
                <Text
                    style={styles.countdown}
                >
                  {this.state.countDownStartingSecond}
                </Text>
              </View>

            </Camera>
          </View>
      );
    }
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStandard: {
    fontSize: 18,
    marginBottom: 10,
    color: 'white'
  },
  countdown: {
    fontSize: 40,
    color: 'white'
  }
});

export default SelfieCam;
