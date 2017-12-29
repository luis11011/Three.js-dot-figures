
var CTHREE = { Math: {} };

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
	projector = new THREE.Projector();

	
}


CTHREE.MorphObject3DInterface = function(obj,loads){
	
	obj.morphing = -1;
	obj.geometryMorphs = [];
	morphingIndex = -1;

	obj.morphNow = function(index){
		index = index || 0;

		if ( obj.morphing == -1 && Array.isArray(obj.geometryMorphs[index]) ) {
			
			morphingIndex = index;
			obj.morphing = morphingIndex ;

			obj.sharedGeometry.setDrawRange( 0, 6000*3 );

			for (var i = obj.sharedGeometry.attributes.position.array.length - 1; i >= 0; i--) {
				obj.sharedGeometry.attributes.target_position.array[i] = CTHREE.Math.normalRandom()*MAX_RANDOM*2 -MAX_RANDOM;
			}

			setTimeout( function(){
				// reorder
				obj.sharedGeometry.setDrawRange( 0, Math.min(obj.geometryMorphs[morphingIndex].length/3,obj.maxNodes) );
				obj.sharedGeometry.attributes.target_position.array
				for (var i = obj.geometryMorphs[morphingIndex].length - 1; i >= 0; i--) {
					obj.sharedGeometry.attributes.target_position.array[i] = obj.geometryMorphs[morphingIndex][i]
				}
			},2000);

			setTimeout( function(){
				obj.morphing = -1;
			},4500);
		}
	} 

	var loader = [];

	for (var index = 0; index < loads.length; index++)
	{

		loader[index] = new THREE.OBJLoader();

		(function(index){

			loader[index].load(
				// resource URL
				'https://raw.githubusercontent.com/luis11011/Three.js-dot-figures/master/assets/models/'+loads[index],
				function ( loadedObject ) {
					
					console.log("loadedObject");

					var c = 0;

					obj.geometryMorphs[index] = [];

					for (var i = loadedObject.children[0].geometry.attributes.position.array.length - 3; i >= 0; i-=3) {

						var add = true;

						if (obj.geometryMorphs[index].length>=3)
						for (var j = obj.geometryMorphs[index].length - 3; j >= 0; j-=3) {
							add = (Math.sqrt( 
								Math.pow(loadedObject.children[0].geometry.attributes.position.array[i]-obj.geometryMorphs[index][j],2) +
								Math.pow(loadedObject.children[0].geometry.attributes.position.array[i+1]-obj.geometryMorphs[index][j+1],2) +
								Math.pow(loadedObject.children[0].geometry.attributes.position.array[i+2]-obj.geometryMorphs[index][j+2],2)
							)>=0.00000000002);

							if (add==false){
								break;
							}
						}

						if (add){
							obj.geometryMorphs[index][c++] = loadedObject.children[0].geometry.attributes.position.array[i]
							obj.geometryMorphs[index][c++] = loadedObject.children[0].geometry.attributes.position.array[i+1]
							obj.geometryMorphs[index][c++] = loadedObject.children[0].geometry.attributes.position.array[i+2]
						}
					}

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


