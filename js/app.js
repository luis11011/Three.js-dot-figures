var LOAD_URL = 'https://raw.githubusercontent.com/luis11011/Three.js-dot-figures/master/assets/textures/';
//var LOAD_URL = '../assets/textures/';


var renderer;
var raycaster;
var mouse;
var scene;
var camera;

var stats;

var RESTITUTION_SPEED = 0.05

var OPACITY = 0.9;

var DOT_SIZE = 0.9;

var OBJECT_SCALE = 0.5;

var INIT_RATIO = 0.05;

var MAX_RANDOM = 250

var cameraFOV = 45;
var cameraDistance = 125;

window.onload = init;

var object = undefined;

function init(){

	WINDOW = new Window(window);

	scene = new THREE.Scene();

	renderer = new CTHREE.StandardRenderer(document.body,0x050505);

	mouse = { click: false , position: new THREE.Vector2() };

	raycaster = new THREE.Raycaster();

	var genDistance = Math.tan(cameraFOV*Math.PI/180)*cameraDistance;

	//camera = new CTHREE.Orthographic2DCamera(20,1000);
	camera = new CTHREE.Perspective2DCamera(cameraFOV,cameraDistance*2,cameraDistance);
	camera.lookAt(scene.position);

	camera.target = { position: new THREE.Vector3(camera.position.x,camera.position.y,camera.position.z), rSpeed: 0.01 };	

	camera.position.y+=0;

	addNodesObject( scene , 1200 , 3000, 12800 );

	control = new function() {
		this.rotationRSpeed = 0.05;
		this.opacity = 0.75;
		this.color = 0xFFFFFF;
	};

	addControlGui(control);
	
	stats = CTHREE.addStandardStatsObject(document.body);

	animate();

	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
}

function animate() {

	setTimeout( function() {

		requestAnimationFrame( animate );

	}, 1000 / 60 );

	if (object==undefined) {
		object = scene.getObjectByName( "nodes" );
	}
	else {
		object.rotation.y += (mouse.position.x - object.rotation.y) * control.rotationRSpeed
		object.rotation.x += (-mouse.position.y/32 - object.rotation.x) * control.rotationRSpeed

		object.children[0].material.opacity = control.opacity;
		object.children[0].material.color = new THREE.Color(control.color);
		//object.children[1].material.opacity = control.opacity/12;
		object.children[1].material.color = new THREE.Color(control.color);

		if ( Math.abs(camera.position.x-camera.target.position.x)>0.1 ){
			camera.position.x += (camera.target.position.x-camera.position.x)*camera.target.rSpeed;
			camera.lookAt(-camera.position.x,0,0);
		}

		if (mouse.click){
			mouse.click = false;

			if ( mouse.position.x<0.33 ){

				if (object.morphingIndex==0){
					object.morphNow(1);
					camera.target.position.x = 100;
				}
				else{
					object.morphNow(0);
					camera.target.position.x = -100;
				}
			}
		}

		object.updateGeometries(RESTITUTION_SPEED);
	}

	render();
	stats.update();

}

function render(){
	renderer.render(scene, camera);
}

function addNodesObject( scene, noiseNodes, maxNodes, maxNodesLines ){

	obj = new THREE.Object3D();

	obj.noiseNodes = noiseNodes;

	obj.maxNodes = maxNodes;

	obj.maxNodesLines = maxNodesLines;

	var material = new THREE.PointsMaterial({
		sizeAttenuation: true,
		size: DOT_SIZE,
		map: new THREE.TextureLoader().load(LOAD_URL + 'dot.png'),
		blending: THREE.AdditiveBlending,
		transparent: true,
		opacity: OPACITY,
		alphaTest: 0.0001
	});

	var lineMaterial = new THREE.LineBasicMaterial( {
		visible: true, //true,
		transparent: true,
		linecap: 'round', //ignored by WebGLRenderer
		linejoin:  'round', //ignored by WebGLRenderer
		//vertexColors: THREE.VertexColors
	} );

	obj.lineOpacity = 0.125;

	CTHREE.MorphObject3DInterface(obj,['human10.obj','bird10.obj']);

	obj.add(  new THREE.Points( obj.pointGeometry , material  ) , new THREE.Line( obj.lineGeometry , lineMaterial )  );
	obj.name = "nodes";
	obj.children[0].name = "nodes.points";
	obj.children[0].castShadow = false;
	obj.children[1].name = "nodes.lines";
	obj.children[1].castShadow = false;
	
	scene.add(obj);

}

function createPoints(rw,rh,rd,n){
	var geometry = new THREE.BufferGeometry();

	var vertices = new Float32Array(n*3);

	var targets = new Float32Array(n*3);

	var sizes = new Float32Array(n);

	for (var i = n-1 ; i >= 0; i--) {

		vertices[i*3+0] = CTHREE.Math.lerp(-rw,rw,CTHREE.Math.normalRandom());
		vertices[i*3+1] = CTHREE.Math.lerp(-rh,rh,Math.random());
		vertices[i*3+2] = CTHREE.Math.lerp(-rd,rd,CTHREE.Math.normalRandom());

		targets[i*3+0] = vertices[i*3+0];
		targets[i*3+1] = vertices[i*3+1];
		targets[i*3+2] = vertices[i*3+2];
	}

	for (var i = vertices.length-3; i>=0; i-=3) {
		var minDistance = 99999;
		var distance;
		var sdi = i-3; // smallest distance index
		var aux = [];

		for (var j = i-3; j>=0; j-=3)  {
			distance = Math.abs(vertices[i]-vertices[j]) + Math.abs(vertices[i+1]-vertices[j+1]) + Math.abs(vertices[i+2]-vertices[j+2]);
			if (distance<=minDistance){
				minDistance = distance;
				sdi = j;
			}
		}

		if (sdi!=i-3){
			targets  = CTHREE.swap3inArray( targets ,  i-3 , sdi );
		}
	}

	geometry.boundingBox = null;

	geometry.addAttribute('target_position',new THREE.BufferAttribute(targets,3))
	geometry.addAttribute('position',new THREE.BufferAttribute(vertices,3))
	geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

	geometry.computeBoundingSphere();

	geometry.clearGroups();
	geometry.addGroup( 0, Infinity, 0 );
	geometry.addGroup( 0, Infinity, 1 );

	var material = new THREE.PointsMaterial();
	material.sizeAttenuation = true;
	material.size = 1;
	material.map = new THREE.TextureLoader().load('../../assets/textures/dot.png');
	material.blending = THREE.AdditiveBlending;
	material.transparent = true;
	material.opacity = 1;
	material.alphaTest = 0.0001

	var material2 = new THREE.MeshBasicMaterial();
	material2.sizeAttenuation = true;
	material2.size = 2;
	material2.map = new THREE.TextureLoader().load('../../assets/textures/dot.png');
	material2.blending = THREE.AdditiveBlending;
	material2.transparent = true;
	material2.opacity = 0.5;
	material2.alphaTest = 0.0001

	var lineMaterial = new THREE.MeshBasicMaterial( {
		visible: true,
		transparent: true,
		opacity: 0.15,
	} );

	var ps = [ new THREE.Points( geometry , material  ) , new THREE.Line( geometry , lineMaterial ) ];
	ps[0].name = "nodes";
	ps[0].castShadow = false;
	ps[1].name = "lines";
	ps[1].castShadow = false;
	return ps;
}

function addControlGui(controlObject) {
	var gui = new dat.GUI();
	gui.add(controlObject, 'rotationRSpeed', 0.01, 0.99);
	gui.add(controlObject, 'opacity', 0.01, 1);
	gui.addColor(controlObject, 'color');
}

function onDocumentMouseDown( event ) {
	event.preventDefault();
	mouse.click = true;
	return mouse;
}

function onDocumentMouseMove( event ) {
	event.preventDefault();
	mouse.position.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.position.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	return mouse;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	WINDOW.recalculate( window );
	renderer.setSize( window.innerWidth, window.innerHeight );
}

//

function loadScript(url,id,type)
{    
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = type || 'text/javascript';
	script.src = url;
	if (id!==undefined)
		script.id = id;
	head.appendChild(script);
}
