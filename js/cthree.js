var LOAD_MODELS_URL = 'https://raw.githubusercontent.com/luis11011/Three.js-dot-figures/master/assets/models/';
//var LOAD_MODELS_URL = '../assets/models/';

var CTHREE = { Math: {} };

CTHREE.ArrayUtils = {};

CTHREE.swap3inArray = function(array,i,j){
	var aux = [];

	aux[0] = array[i]  ;
	aux[1] = array[i+1];
	aux[2] = array[i+2];

	array[i]   =  array[j] ;
	array[i+1] = array[j+1];
	array[i+2] = array[j+2];

	array[j]   = aux[0];
	array[j+1] = aux[1];
	array[j+2] = aux[2];

	return array;
}
 
CTHREE.MouseController = function(){
	
}


CTHREE.Morph = function(pointArray,lineArray){

	return {pointPosition: pointArray, linePosition: lineArray }
}

distanceToNext = function(array,i){
	return 	Math.pow(array[i  ]-array[i+3 ],2) +
			Math.pow(array[i+1]-array[i+4],2) +
			Math.pow(array[i+2]-array[i+5],2)
}

setIntervalLimited = function(foo, ms, iterations){
	var counter = 0;
	var looper = setInterval(function(){
		foo();
		if (++counter>iterations){
			clearInterval(looper);
		}
	}, ms);
}

setIntervalTimeout = function(foo, ms_interval, ms_timeout ){
	var looper = setInterval(foo, ms_interval);
	setTimeout( function(){clearInterval(looper)},ms_timeout)
}

setIntervalUntil = function(foo, ms_interval, until_function ){
	var looper = setInterval(function(){
		foo();
		if (until_function()){
			clearInterval(looper);
		}
	}, ms);
}

CTHREE.MorphObject3DInterface = function(obj,loads){

	// point geometry
	obj.pointGeometry = new THREE.BufferGeometry();
	obj.pointGeometry.setDrawRange( 0, obj.noiseNodes/2 );
	obj.pointGeometry.countTarget = obj.maxNodes;

	var positions = new Float32Array(obj.maxNodes*3);
	var targets = new Float32Array(obj.maxNodes*3);

	for (var i = obj.maxNodes*3 - 1 ; i >= obj.maxNodes; i--) {
		positions[i] = CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
		targets[i] = CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
	}
	for (var i = obj.maxNodes - 1 ; i >= 0; i--) {
		positions[i] = CTHREE.Math.normalRandom()*INIT_RATIO*2 -INIT_RATIO;
		targets[i] = CTHREE.Math.normalRandom()*INIT_RATIO*2 -INIT_RATIO;
	}

	obj.pointGeometry.addAttribute('position',new THREE.BufferAttribute(positions,3))
	obj.pointGeometry.addAttribute('target_position',new THREE.BufferAttribute(targets,3))
	obj.pointGeometry.boundingBox = null;
	obj.pointGeometry.computeBoundingSphere();

	// line geometry
	obj.lineGeometry = new THREE.BufferGeometry();
	obj.lineGeometry.setDrawRange( 0, obj.noiseNodes/2 );

	var positions = new Float32Array(obj.maxNodesLines*3);
	var targets = new Float32Array(obj.maxNodesLines*3);
	//var colors = new Float32Array(obj.maxNodesLines*3);

	obj.c_black = new THREE.Color( 0x000000 );
	obj.c_white = new THREE.Color( 0xffffff );

	/*for (var i = obj.maxNodesLines - 1 ; i >= 0; i--) {
		var color = !(i%40) ? obj.c_white : obj.c_black;
		colors[i*3-3] = color.r;
		colors[i*3-2] = color.g;
		colors[i*3-1] = color.b;
	}*/

	for (var i = obj.maxNodesLines*3 - 1 ; i >= 0; i--) {
		positions[i] = obj.pointGeometry.attributes.position.array[i] || CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
		targets[i] = obj.pointGeometry.attributes.target_position.array[i]  || CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
	}

	//obj.lineGeometry.addAttribute( 'color' , new THREE.Float32BufferAttribute( colors, 3 ) );
	obj.lineGeometry.addAttribute( 'position' , new THREE.Float32BufferAttribute(positions,3) );
	obj.lineGeometry.addAttribute( 'target_position' , new THREE.Float32BufferAttribute(targets,3) );
	obj.lineGeometry.boundingBox = null;
	obj.lineGeometry.computeBoundingSphere();
	// geometries end
	
	obj.morphing = -1;
	obj.geometryMorphs = [];
	morphingIndex = -1;

	obj.updateGeometries = function(speed){
		for (var i = obj.pointGeometry.attributes.position.array.length - 1; i >= 0; i--)
			obj.pointGeometry.attributes.position.array[i] += (obj.pointGeometry.attributes.target_position.array[i] - obj.pointGeometry.attributes.position.array[i])*speed;

		obj.pointGeometry.attributes.position.needsUpdate = true;

		obj.pointGeometry.drawRange.count += Math.sign((obj.pointGeometry.countTarget - obj.pointGeometry.drawRange.count));

		for (var i = obj.lineGeometry.attributes.position.array.length - 1; i >= 0; i--){
			obj.lineGeometry.attributes.position.array[i] += (obj.lineGeometry.attributes.target_position.array[i] - obj.lineGeometry.attributes.position.array[i])*speed;
		}

		/*for (var i = obj.lineGeometry.attributes.color.array.length - 3; i >= 0; i-=3){
			var color = i%9 ? obj.c_white : obj.c_black;
			// var color = (distanceToNext(obj.pointGeometry.attributes.position.array,i)<0.000000001) ? obj.c_white : obj.c_black;
			colors[i] = color.r;
			colors[i+1] = color.g;
			colors[i+2] = color.b;
		}*/

		obj.lineGeometry.attributes.position.needsUpdate = true;

		//for (var i = obj.maxNodesLines - 1 ; i >= 1; i--) {
		//	var color = /*(Math.abs(obj.pointGeometry.attributes.position.array[i]-obj.pointGeometry.attributes.position.array[i+3])<200.0)*/ i%2 ? obj.c_white : obj.c_black;
		//	colors[i*3-3] = color.r;
		//	colors[i*3-2] = color.g;
		//	colors[i*3-1] = color.b;
		//}

	}

	obj.morphNow = function(index){
		
		index = index || 0;

		if ( obj.morphing == -1 && Array.isArray(obj.geometryMorphs[index].pointPosition) ) {
			
			obj.morphingIndex = index;
			obj.morphing = obj.morphingIndex ;

			// mess up

			obj.lineGeometry.setDrawRange( 0, obj.pointGeometry.drawRange.count );
			obj.pointGeometry.setDrawRange( 0, obj.noiseNodes );
			
			obj.pointGeometry.countTarget = obj.noiseNodes;

			setIntervalUntil(
				function(){
					obj.children[1].material.opacity -= 0.01;
				},
				10,
				function(){
					return (obj.children[1].material.opacity<=0.0);
				}
				)
			
			for (var i = obj.pointGeometry.attributes.target_position.array.length - 1; i >= 0; i--)
				obj.pointGeometry.attributes.target_position.array[i] = CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;

			for (var i = obj.lineGeometry.attributes.target_position.array.length - 1; i >= 0; i--)
				obj.lineGeometry.attributes.target_position.array[i] = obj.pointGeometry.attributes.target_position.array[i] || CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
			
			setTimeout( function(){
				
				// reorder
				obj.pointGeometry.setDrawRange( 0, Math.min( obj.geometryMorphs[obj.morphingIndex].pointPosition.length/3,obj.maxNodes) );
				obj.lineGeometry.setDrawRange( 0, Math.min(  obj.geometryMorphs[obj.morphingIndex].linePosition.length/9 ,obj.maxNodesLines) );
				obj.pointGeometry.countTarget = Math.min( obj.geometryMorphs[obj.morphingIndex].pointPosition.length/3,obj.maxNodes  );

				// (!!!) la pata
				
				//obj.pointGeometry.attributes.target_position.array
				for (var i = obj.pointGeometry.attributes.target_position.array.length *3 - 1 ; i >= 0 ; i--)
					obj.pointGeometry.attributes.target_position.array[i] = obj.geometryMorphs[obj.morphingIndex].pointPosition[i];

				for (var i = obj.lineGeometry.attributes.target_position.array.length *3 - 1 ; i >= 0 ; i--)
					obj.lineGeometry.attributes.target_position.array[i] = obj.geometryMorphs[obj.morphingIndex].linePosition[i];

			},2000);

			setTimeout( function(){
				setIntervalUntil(
				function(){
					obj.children[1].material.opacity += 0.01;
				},
				20,
				function(){
					return (obj.children[1].material.opacity>=obj.lineOpacity);
				}
				)
			},5000);

			setTimeout( function(){
				// allow click
				obj.morphing = -1;
			},4500);
		}
	} 

	// loading OBJs

	var loader = [];

	for (var index = 0; index < loads.length; index++)
	{

		loader[index] = new THREE.OBJLoader();

		(function(index){

			loader[index].load(
				// resource URL
				LOAD_MODELS_URL+loads[index],
				function ( loadedObject ) {
					
					console.log("loadedObject");

					obj.geometryMorphs[index] = CTHREE.Morph([],[]); // (!) dos geometrias, una para las lineas 1 y otra para los puntos 0, evaluar alternativas

					var c = 0;

					for (var i = loadedObject.children[0].geometry.attributes.position.array.length - 3; i >= 0; i-=3) {

						var ignore = true;

						if (c>=3)
						for (var j = obj.geometryMorphs[index].pointPosition.length - 3; j >= 0; j-=3) {
							ignore = ( 
								Math.pow(loadedObject.children[0].geometry.attributes.position.array[i  ]-obj.geometryMorphs[index].pointPosition[j  ],2) +
								Math.pow(loadedObject.children[0].geometry.attributes.position.array[i+1]-obj.geometryMorphs[index].pointPosition[j+1],2) +
								Math.pow(loadedObject.children[0].geometry.attributes.position.array[i+2]-obj.geometryMorphs[index].pointPosition[j+2],2)
							>=0.000000002);

							if (ignore==false){
								break;
							}
						}

						if (ignore){
							obj.geometryMorphs[index].pointPosition[c++] = loadedObject.children[0].geometry.attributes.position.array[i  ];
							obj.geometryMorphs[index].pointPosition[c++] = loadedObject.children[0].geometry.attributes.position.array[i+1];
							obj.geometryMorphs[index].pointPosition[c++] = loadedObject.children[0].geometry.attributes.position.array[i+2];
						}
					}

					obj.geometryMorphs[index].linePosition = loadedObject.children[0].geometry.attributes.position.array;

					console.log(obj.geometryMorphs[index]);

				},

				function ( xhr ) {
					console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
				},

				function ( error ) {
					console.log( 'An error happened' );
					console.log( error );
				}
			);
		})(index);
	}
}

CTHREE.Orthographic2DCamera = function(cameraField, far){
	var th;
	var windowRatio = window.innerWidth / window.innerHeight;
	th = new THREE.OrthographicCamera(-cameraField,cameraField,-cameraField/windowRatio,cameraField/windowRatio, 0.1, far);
	th.position.x = 0;
	th.position.y = 0;
	th.position.z = -far/2;

	return th;
}

CTHREE.Perspective2DCamera = function(cameraField, far, distance){
	var th;
	var windowRatio = window.innerWidth / window.innerHeight;
	th = new THREE.PerspectiveCamera( cameraField, windowRatio, 0.1, far );
	th.position.x = 0;
	th.position.y = 0;
	th.position.z = distance;

	return th;
}

CTHREE.addStandardStatsObject = function(container ) {
	stats = new Stats();
	stats.setMode(0);
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild( stats.domElement );

	return stats;
}


CTHREE.StandardRenderer = function(container, color){
	renderer = new THREE.WebGLRenderer({antialias: false});
	renderer.setClearColor(color,1.0);
	renderer.setSize(window.innerWidth,window.innerHeight);
	renderer.setPixelRatio( 1 );

	container.appendChild(renderer.domElement);

	return renderer;
}

CTHREE.RendererClicker = function(renderer, camera, objects){
	renderer.domElement.addEventListener('mousedown', function(event) {
		var vector = new THREE.Vector3(
			renderer.devicePixelRatio * (event.pageX - this.offsetLeft) /  
			this.width * 2 - 1,
			-renderer.devicePixelRatio * (event.pageY - this.offsetTop) /  
			this.height * 2 + 1,
			0
			);
		projector.unprojectVector(vector, camera);
		var raycaster = new THREE.Raycaster(
			camera.position,
			vector.sub(camera.position).normalize()
			);
		var intersects = raycaster.intersectObjects(OBJECTS);
		if (intersects.length) {
	    // intersects[0] describes the clicked object
		}
	}, false);
}

class Window{

	recalculate (win){
		this.win = win || window;

		this.WIDTH = win.innerWidth;
		this.HEIGHT = win.innerHeight;
		this.HALF_WIDTH = this.WIDTH/2;
		this.HALF_HEIGHT = this.HEIGHT/2;
		this.ASPECT = win.innerWidth / win.innerHeight;
	}

	constructor (win){
		this.recalculate(win);
	}


}

CTHREE.Math.lerp = function(a, b, n) {
  //return (1 - n) * a + n * b;
  return a+(b-a)*n;
}

CTHREE.Math.inverseLerp = function(a, b, n) {
  return (a-n)/(b-n)
}

CTHREE.Math.normalRandom = function() {
	return ( Math.random() + Math.random() + Math.random() + Math.random()*(Math.PI-3) ) / Math.PI;
}

/*

CTHREE.TypedArrayUtils.quicksortDistance = function ( arr, eleSize, orderElement ) {

	/*var visited = [];

	var findUnvisitedNear = function ( arr , ind ) {

		for (var i = 0, il = arr.length ; i < il - eleSize; i-=eleSize) {
			if ( visited.includes(i) )
				continue;

		}
	}

	var metric = function(a, b){	return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2); } 

	for (var i = 0, jl = arr.length, il = arr.length - eleSize; i < il; i+=eleSize) {
		for (var j = i; j < jl; j+=eleSize) {
		arr[i]
	}

	var swapF = function ( a, b ) {

		for ( y = 0; y < eleSize; y ++ ) {

			tmp = arr[ a + y ];
			arr[ a + y ] = arr[ b + y ];
			arr[ b + y ] = tmp;

		}

	};

};
*/