// Simplified version for Stack Overflow question
// http://jsfiddle.net/x5e4a/1/

$(function () {
  var element = $('#scene');

  //Three.js boilerplate
  var scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, element.innerWidth() / element.innerHeight(), 0.1, 1000),
      renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setClearColor(0xEEEEEE, 1.0);
  renderer.setSize(element.innerWidth(), element.innerHeight());

  camera.position = new THREE.Vector3(-30, 40, 30);
  camera.lookAt(scene.position);
  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);

  scene.add(new THREE.AxisHelper(20));
  scene.add(new THREE.AmbientLight(0xffffff));
  element.append(renderer.domElement);

  //Cube geometry
  var cubeSize = 3,
      dimensions = 3,
      spacing = 0.5;

  //Cube materials
  var colours = [0xC41E3A, 0x009E60, 0x0051BA, 0xFF5800, 0xFFD500, 0xFFFFFF],
      faceMaterials = colours.map(function(c) {
        return new THREE.MeshLambertMaterial({ color: c , ambient: c });
      });
      cubeMaterials = new THREE.MeshFaceMaterial(faceMaterials);

  //Cube construction
  var allCubes = [],
      pivot = new THREE.Object3D();

  function newCube(x, y, z) {
    var cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize),
        cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
        cube.position = new THREE.Vector3(x, y, z),
    
    scene.add(cube);
    allCubes.push(cube);
  }

  //Create the cubes
  var increment = cubeSize + spacing;
  for(var i = 0; i < dimensions; i ++) {
    for(var j = 0; j < dimensions; j ++) {
      for(var k = 0; k < dimensions; k ++) {
        var x = (i - 1) * increment,
            y = (j - 1) * increment,
            z = (k - 1) * increment;
        newCube(x, y, z);
      }
    }
  }

  function render() {
    renderer.render(scene, camera);
  }

  //Move all cubes with value 'v' on axis 'axis'
  function move(v, axis) {
    var activeCubes = [];

    allCubes.forEach(function(cube) {
      var cubePosition = cube.position.clone();

      if(Math.abs(cubePosition[axis] - v) < 0.0001)
        activeCubes.push(cube);
    });

    console.log(activeCubes);

    pivot.rotation.set(0,0,0);
    pivot.updateMatrixWorld();

    activeCubes.forEach(function(cube) {
      THREE.SceneUtils.attach(cube, scene, pivot);
    });

    pivot.rotation[axis] = Math.PI / 2;
    pivot.updateMatrixWorld();

    activeCubes.forEach(function(cube) {
      cube.updateMatrixWorld();
      THREE.SceneUtils.detach(cube, pivot, scene);
    });

    render();
  }

  //Render the initial state
  render();

  //Pre-canned demo moves
  $('#moveY0').on('click', function() { move(3.5, 'y') });
  $('#moveX1').on('click', function() { move(0, 'x') });
  $('#moveZ1').on('click', function() { move(0, 'z') });
});