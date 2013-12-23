function Rubik(element) {

  var scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000),
      renderer = new THREE.WebGLRenderer({ antialias: true });

  //Set up new THREEX DOM helper
  //https://github.com/jeromeetienne/threex/issues/16 
  THREE.Object3D._threexDomEvent.camera(camera);

  //TODO: look at Trackball controls instead, enable keyboard
  new THREE.OrbitControls(camera, renderer.domElement);

  renderer.setClearColor(0xEEEEEE, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.shadowMapEnabled = true;

  var cubeSize = 3,
      dimensions = 3,
      spacing = 0.5;

  //TODO: colour the insides of all of the faces black
  // (probably colour all faces black to begin with, then "whitelist" exterior faces)
  var colours = [0xC41E3A, 0x009E60, 0x0051BA, 0xFF5800, 0xFFD500, 0xFFFFFF];
  var faceMaterials = colours.map(function(c) {
    return new THREE.MeshLambertMaterial({ color: c , ambient: c });
  });


  //The currently clicked cube's position
  var clickVector;

  var cubeMaterials = new THREE.MeshFaceMaterial(faceMaterials);

  var allCubes = [];

  function newCube(x, y, z) {
    var cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    cube.castShadow = true;

    cube.position = new THREE.Vector3(x, y, z);

    cube.on('click', function(e) {
      clickVector = cube.rubikPosition.clone();
    });

    cube.rubikPosition = cube.position.clone();

    scene.add(cube);
    allCubes.push(cube);
  }



  this.allCubes = allCubes;

  //Create the cubes!
  var increment = cubeSize + spacing;

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

  var axes = new THREE.AxisHelper( 20 );
  scene.add(axes);

  //Set up the camera and spotlight
  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 30;
  camera.lookAt(scene.position);

  // add spotlight for the shadows
  var light = new THREE.AmbientLight(0xffffff);
  scene.add(light);

  //Show some stuff!
  element.append(renderer.domElement);

  //Are we in the middle of a transition?
  var isMoving = false;
  var moveAxis, moveN, moveDirection;
  var rotationSpeed = 0.1;

  //http://stackoverflow.com/questions/20089098/three-js-adding-and-removing-children-of-rotated-objects
  var pivot = new THREE.Object3D();

  function render() {

    if(isMoving) {

      //Move a quarter turn then stop
      if(pivot.rotation[moveAxis] >= Math.PI / 2) {
        //Compensate for overshoot. TODO: use a tweening library
        pivot.rotation[moveAxis] = Math.PI / 2;

        moveComplete();
      } else {
        pivot.rotation[moveAxis] += (moveDirection * rotationSpeed);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  
  }

  var activeGroup;
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

  this.setActiveGroup = setActiveGroup;

  function nearlyEqual(a, b, d) {
    d = d || 1;
    return Math.abs(a - b) <= d;
  }

  var debug = false;
  this.setDebug = function() {
    debug = true;
  }

  this.startMove = function(axis, direction) {
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

  moveComplete = function() {
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

  var step = 0;
  render();
}

$(function() {
  RUBIK = new Rubik($('#scene'));
})