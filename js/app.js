loadScript('libs/three.min.js');
loadScript('libs/stats.min.js');
loadScript('libs/dat.gui.min.js');
loadScript('libs/loaders/OBJLoader.js');
loadScript('js/cthree.js');


// global variables
//var threshold = 0.1;

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
	//raycaster.params.Points.threshold = threshold;

	var genDistance = Math.tan(cameraFOV*Math.PI/180)*cameraDistance;

	//camera = new CTHREE.Orthographic2DCamera(20,1000);
	camera = new CTHREE.Perspective2DCamera(cameraFOV,cameraDistance*2,cameraDistance);
	camera.lookAt(scene.position);

	camera.position.y+=0;


	addNodesObject( scene , 1200 , 1200 );//createPoints(genDistance,genDistance/WINDOW.ASPECT,genDistance,40,0xff0000);

	control = new function() {
		this.rotationSpeed = 0.001;
		this.opacity = 0.75;
		this.color = 0xFFFFFF;
	};

	addControlGui(control);
	
	stats = CTHREE.addStandardStatsObject(document.body);

	animate();

	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
}

function animate() {

	setTimeout( function() {

        requestAnimationFrame( animate );

    }, 1000 / 60 );

	if (object==undefined) {
		object = scene.getObjectByName( "nodes" );
		console.log("object defined");
		//console.log(object)//*/
	}
	else {
		//console.log(object)
		object.rotation.y += control.rotationSpeed;
		object.children[0].material.color = new THREE.Color(control.color);
		object.children[0].material.opacity = control.opacity;
		object.children[1].material.opacity = control.opacity;
		object.children[1].material.color = new THREE.Color(control.color);
	
		if (mouse.click){
			mouse.click = false;
			/*raycaster.setFromCamera( mouse.position, camera );
			intersects = raycaster.intersectObject( object.children[0] );*/

			if (morphingIndex==0)
				object.morphNow(1);
			else
				object.morphNow(0);

			console.log("click")

			if ( /*intersects.length > 0*/ false ) {
				console.log("intersect");
				var index = intersects[0].index;

				console.log(intersects[0]);

				var vertex = new THREE.Vector3();
				var vtarget = new THREE.Vector3();

				vertex.x = object.sharedGeometry.attributes.position.array[ index*3 ];
				vertex.y = object.sharedGeometry.attributes.position.array[ index*3 + 1 ];
				vertex.z = object.sharedGeometry.attributes.position.array[ index*3 + 2 ];

				vtarget.copy(vertex);		

				vtarget.add(vertex.sub(object.children[0].worldToLocal(intersects[0].point)).multiplyScalar(1));

				object.sharedGeometry.attributes.target_position.array[ index*3 ] 		= vtarget.x;
				object.sharedGeometry.attributes.target_position.array[ index*3 + 1 ] 	= vtarget.y;
				object.sharedGeometry.attributes.target_position.array[ index*3 + 2 ] 	= vtarget.z;

				console.log(vtarget);
			}
		}

		for (var i = object.sharedGeometry.attributes.position.array.length - 1; i >= 0; i--) {
			object.sharedGeometry.attributes.position.array[i] += (object.sharedGeometry.attributes.target_position.array[i] - object.sharedGeometry.attributes.position.array[i])*RESTITUTION_SPEED;
		}

		object.sharedGeometry.attributes.position.needsUpdate = true; // (!!!!!)
	}

	render();
	stats.update();

}

function render(){
	renderer.render(scene, camera);
}

function addNodesObject( scene, noiseNodes, maxNodes ){

	var geometry = new THREE.BufferGeometry();

	obj = new THREE.Object3D();

	obj.noiseNodes = noiseNodes;

	obj.maxNodes = maxNodes;

	var material = new THREE.PointsMaterial();
	material.sizeAttenuation = true;
	material.size = DOT_SIZE;
	material.map = new THREE.TextureLoader().load('../../assets/textures/dot.png');
	material.blending = THREE.AdditiveBlending;
	material.transparent = true;
	material.opacity = OPACITY;
	material.alphaTest = 0.0001

	// var material2 = new THREE.MeshBasicMaterial();
	// material2.sizeAttenuation = true;
	// material2.size = 2;
	// material2.map = new THREE.TextureLoader().load('../../assets/textures/dot.png');
	// material2.blending = THREE.AdditiveBlending;
	// material2.transparent = true;
	// material2.opacity = 0.5;
	// material2.alphaTest = 0.0001

	var lineMaterial = new THREE.MeshBasicMaterial( {
		visible: false, //true,
		transparent: true,
		opacity: 0.15,
	} );

	var positions = new Float32Array(obj.maxNodes*3);
	var targets = new Float32Array(obj.maxNodes*3);

	for (var i = maxNodes - 1 ; i >= 0; i--) {
		positions[i] = CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
		targets[i] = CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
	}

	geometry.addAttribute('position',new THREE.BufferAttribute(positions,3))
	geometry.addAttribute('target_position',new THREE.BufferAttribute(targets,3))

	geometry.boundingBox = null;

	geometry.computeBoundingSphere();

	obj.sharedGeometry = geometry;

	CTHREE.MorphObject3DInterface(obj,['human10.obj','bird10.obj']);

	obj.add(  new THREE.Points( geometry , material  ) , new THREE.Line( geometry , lineMaterial )  );
	obj.name = "nodes";
	obj.children[0].name = "nodes.dots";
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
		//geometry.vertices.push(	new THREE.Vector3( CTHREE.Math.lerp(-rw,rw,CTHREE.Math.normalRandom()) , CTHREE.Math.lerp(-rh,rh,CTHREE.Math.normalRandom()) , CTHREE.Math.lerp(-rd,rd,CTHREE.Math.normalRandom()) ) );
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
			//vertices = CTHREE.swap3inArray( vertices , i , sdi );
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
	gui.add(controlObject, 'rotationSpeed', -0.05, 0.05);
	gui.add(controlObject, 'opacity', 0.01, 1);
	gui.addColor(controlObject, 'color');
}

function onDocumentMouseDown( event ) {
	event.preventDefault();
	mouse.click = true;
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