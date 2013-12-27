function Rubik(element, background) {
  background = background || 0x303030;

  var debug = false;

  var width = element.innerWidth(),
      height = element.innerHeight();


  /*** three.js boilerplate ***/
  var scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000),
      renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setClearColor(background, 1.0);
  renderer.setSize(width, height);
  //renderer.shadowMapEnabled = true;
  element.append(renderer.domElement);

  camera.position = new THREE.Vector3(-30, 40, 30);
  camera.lookAt(scene.position);
  THREE.Object3D._threexDomEvent.camera(camera);

  /*** Lights ***/
  var light = new THREE.AmbientLight(0xffffff);
  scene.add(light);


  /*** Camera controls ***/
  var orbitControl = new THREE.OrbitControls(camera, renderer.domElement);

  function enableCameraControl() {
    orbitControl.noRotate = false;
  }

  function disableCameraControl() {
    orbitControl.noRotate = true;
  }

  /*** Debug aids ***/  
  if(debug) {
    scene.add(new THREE.AxisHelper( 20 ));
  }

  /*** Click handling ***/
  //Return the axis which has the greatest maginitude for the vector v
  function principalComponent(v) {
    var maxAxis = 'x',
        max = Math.abs(v.x);
    if(Math.abs(v.y) > max) {
      maxAxis = 'y';
      max = Math.abs(v.y);
    }
    if(Math.abs(v.z) > max) {
      maxAxis = 'z';
      max = Math.abs(v.z);
    }
    return maxAxis;
  }

  //The currently clicked cube's position
  // and the axis we will rotate around
  var clickVector, clickFace;

  var onCubeMouseDown = function(e, cube) {
    disableCameraControl();

    clickVector = cube.rubikPosition.clone();
    
    var centroid = e.targetFace.centroid.clone();
    centroid.applyMatrix4(cube.matrixWorld);

    //Which face (of the overall cube) did we click on?
    if(nearlyEqual(Math.abs(centroid.x), maxExtent))
      clickFace = 'x';
    else if(nearlyEqual(Math.abs(centroid.y), maxExtent))
      clickFace = 'y';
    else if(nearlyEqual(Math.abs(centroid.z), maxExtent))
      clickFace = 'z';      
  };

  //Matrix of the axis that we should rotate for 
  // each face-drag action
  //    F a c e
  // D    X Y Z
  // r  X - Z Y
  // a  Y Z - X
  // g  Z Y X -
  var transitions = {
    'x': {'y': 'z', 'z': 'y'},
    'y': {'x': 'z', 'z': 'x'},
    'z': {'x': 'y', 'y': 'x'}
  }

  //TODO: handle "exit cube whilst dragging" events too
  var onCubeMouseUp = function(e, cube) {

    //TODO: use the actual mouse end coordinates for finer drag control
    var dragVector = cube.rubikPosition.clone();
    dragVector.sub(clickVector);

    //Don't move if the "drag" was too small, to allow for 
    // click-and-change-mind.
    if(dragVector.length() > cubeSize) {
      //Rorate with the most significant component of the drag vector
      var maxAxis = principalComponent(dragVector),
          rotateAxis = transitions[clickFace][maxAxis],
          direction = dragVector[maxAxis] >= 0 ? 1 : -1;
      
      //Reverse direction of some rotations for intuitive control
      //TODO: find a general solution!
      if(clickFace == 'z' && rotateAxis == 'x' || 
         clickFace == 'x' && rotateAxis == 'z' ||
         clickFace == 'y' && rotateAxis == 'z')
        direction *= -1;

      if(clickFace == 'x' && clickVector.x > 0 ||
         clickFace == 'y' && clickVector.y < 0 ||
         clickFace == 'z' && clickVector.z < 0)
        direction *= -1;

      startMove(rotateAxis, direction);
      enableCameraControl();
    } else {
      console.log("Drag me some more please!");
    }
  };

  /*** Build 27 cubes ***/
  //TODO: colour the insides of all of the faces black
  // (probably colour all faces black to begin with, then "whitelist" exterior faces)
  var colours = [0xC41E3A, 0x009E60, 0x0051BA, 0xFF5800, 0xFFD500, 0xFFFFFF],
      faceMaterials = colours.map(function(c) {
        return new THREE.MeshLambertMaterial({ color: c , ambient: c });
      }),
      cubeMaterials = new THREE.MeshFaceMaterial(faceMaterials);

  var cubeSize = 3,
      dimensions = 3,
      spacing = 0.5;

  var increment = cubeSize + spacing,
      maxExtent = (cubeSize * dimensions + spacing * (dimensions - 1)) / 2, 
      allCubes = [];

  function newCube(x, y, z) {
    var cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    cube.castShadow = true;

    cube.position = new THREE.Vector3(x, y, z);
    cube.rubikPosition = cube.position.clone();

    cube.on('mousedown', function(e) {
      onCubeMouseDown(e, cube);
    });

    cube.on('mouseup', function(e) {
      onCubeMouseUp(e, cube);
    });

    scene.add(cube);
    allCubes.push(cube);
  }

  for(var i = 0; i < dimensions; i ++) {
    for(var j = 0; j < dimensions; j ++) {
      for(var k = 0; k < dimensions; k ++) {

        //TODO - generalise the -1 offset to work with any size RC (-1 is for 3*3*3). I think it's (n-1)/2.
        var x = (i - 1) * increment,
            y = (j - 1) * increment,
            z = (k - 1) * increment;

        newCube(x, y, z);
      }
    }
  }


  /*** Manage transition states ***/
  //Are we in the middle of a transition?
  var isMoving = false;
  var moveAxis, moveN, moveDirection;
  var rotationSpeed = 0.1;

  //http://stackoverflow.com/questions/20089098/three-js-adding-and-removing-children-of-rotated-objects
  var pivot = new THREE.Object3D(),
      activeGroup = [];

  function nearlyEqual(a, b, d) {
    d = d || 0.001;
    return Math.abs(a - b) <= d;
  }

  //Select the plane of cubes that aligns with clickVector
  // on the given axis
  function setActiveGroup(axis) {
    if(clickVector) {
      activeGroup = [];

      allCubes.forEach(function(cube) {
        if(nearlyEqual(cube.rubikPosition[axis], clickVector[axis])) { 
          activeGroup.push(cube);
        }
      });
    } else {
      console.log("Nothing to move!");
    }
  }


  var startMove = function(axis, direction) {
    if(clickVector) {
      var direction = direction || 1;

      if(!isMoving) {
        isMoving = true;
        moveAxis = axis;
        moveDirection = direction;

        setActiveGroup(axis);

        pivot.rotation.set(0,0,0);
        pivot.updateMatrixWorld();
        scene.add(pivot);

        activeGroup.forEach(function(e) {
          THREE.SceneUtils.attach(e, scene, pivot);
        });

      } else {
        console.log("Already moving!");
      }
    } else {
      console.log("Nothing to move!");
    }
  }

  function doMove() {
    //Move a quarter turn then stop
    if(pivot.rotation[moveAxis] >= Math.PI / 2) {
      //Compensate for overshoot. TODO: use a tweening library
      pivot.rotation[moveAxis] = Math.PI / 2;
      moveComplete();
    } else if(pivot.rotation[moveAxis] <= Math.PI / -2) {
      pivot.rotation[moveAxis] = Math.PI / -2;
      moveComplete()
    } else {
      pivot.rotation[moveAxis] += (moveDirection * rotationSpeed);
    }
  }

  var moveComplete = function() {
    isMoving = false;
    moveAxis, moveN, moveDirection = undefined;
    clickVector = undefined;

    pivot.updateMatrixWorld();
    scene.remove(pivot);
    activeGroup.forEach(function(cube) {
      cube.updateMatrixWorld();

      cube.rubikPosition = cube.position.clone();
      cube.rubikPosition.applyMatrix4(pivot.matrixWorld);

      THREE.SceneUtils.detach(cube, pivot, scene);
    });
  }


  function render() {

    //States
    if(isMoving) {
      doMove();
    } 

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  /*** Util ***/
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  //Go!
  render();
}

