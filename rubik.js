$(function() {

  var scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000),
      renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setClearColorHex(0xEEEEEE, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.shadowMapEnabled = true;

  var cubeSize = 3,
      dimensions = 3,
      spacing = 0.1;

  var colours = [0xC41E3A, 0x009E60, 0x0051BA, 0xFF5800, 0xFFD500, 0xFFFFFF];
  var faceMaterials = colours.map(function(c) {
    return new THREE.MeshLambertMaterial({ color: c , ambient: c, overdraw: true });
  });

  var cubeMaterials = new THREE.MeshFaceMaterial(faceMaterials);

  var cubeGeometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);

  function addCube(x, y, z) {
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    cube.castShadow = true;

    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;
    scene.add(cube);
  }


  //Create the cubes!
  var increment = cubeSize + spacing;

  for(var i = 0; i < dimensions; i ++) {
    for(var j = 0; j < dimensions; j ++) {
      for(var k = 0; k < dimensions; k ++) {
        addCube(i * increment, j * increment, k * increment);
      }
    }
  }

  //Set up the camera and spotlight
  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 30;
  camera.lookAt(scene.position);

  // add spotlight for the shadows
  var light = new THREE.AmbientLight(0xffffff);
  scene.add(light);

  //Show some stuff!
  $("#scene").append(renderer.domElement);
  renderer.render(scene, camera);

});