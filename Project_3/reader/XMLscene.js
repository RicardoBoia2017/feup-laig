var DEGREE_TO_RAD = Math.PI / 180;

/**
 * XMLscene class, representing the scene that is to be rendered.
 * @constructor
 */
function XMLscene(interface) {
    CGFscene.call(this);

    this.interface = interface;

    this.lightValues = {};
    this.selectableValues={};

    //PROJECT2
    //valores iniciais da interface
    this.scaleFactor=1;
    this.redFactor=0.5;
    this.greenFactor=0.5;
    this.blueFactor=0.5;
    //PROJECT2
 
}

XMLscene.prototype = Object.create(CGFscene.prototype);
XMLscene.prototype.constructor = XMLscene;

/**
 * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis.
 */
XMLscene.prototype.init = function(application) {
    CGFscene.prototype.init.call(this, application);
    
    this.initCameras();

    this.enableTextures(true);
    
    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);
    
    this.axis = new CGFaxis(this);

    //PROJECT2
    this.setUpdatePeriod(20);

    //Shader
    this.testShader=new CGFshader(this.gl, "shaders/scale.vert", "shaders/color.frag");
    //PROJECT2

    //PROJECT3
    this.transparencyShader=new CGFshader(this.gl, "shaders/scale.vert", "shaders/transparency.frag");

    this.objects=[];
    for(let i =0; i < 11*11; i++){
        this.objects.push(new CGFplane(this));
    }

    this.setPickEnabled(true);
    
    makeRequest("handshake");
    //PROJECT3
}


/**
 * Initializes the scene lights with the values read from the LSX file.
 */
XMLscene.prototype.initLights = function() {
    var i = 0;
    // Lights index.
    
    // Reads the lights from the scene graph.
    for (var key in this.graph.lights) {
        if (i >= 8)
            break;              // Only eight lights allowed by WebGL.

        if (this.graph.lights.hasOwnProperty(key)) {
            var light = this.graph.lights[key];
            
            this.lights[i].setPosition(light[1][0], light[1][1], light[1][2], light[1][3]);
            this.lights[i].setAmbient(light[2][0], light[2][1], light[2][2], light[2][3]);
            this.lights[i].setDiffuse(light[3][0], light[3][1], light[3][2], light[3][3]);
            this.lights[i].setSpecular(light[4][0], light[4][1], light[4][2], light[4][3]);
            
            this.lights[i].setVisible(true);
            if (light[0])
                this.lights[i].enable();
            else
                this.lights[i].disable();
            
            this.lights[i].update();
            
            i++;
        }
    }
    
}

/**
 * Initializes the scene cameras.
 */
XMLscene.prototype.initCameras = function() {
    this.camera = new CGFcamera(0.4,0.1,500,vec3.fromValues(15, 15, 15),vec3.fromValues(0, 0, 0));
}

/* Handler called when the graph is finally loaded. 
 * As loading is asynchronous, this may be called already after the application has started the run loop
 */
XMLscene.prototype.onGraphLoaded = function() 
{
    this.camera.near = this.graph.near;
    this.camera.far = this.graph.far;
    this.axis = new CGFaxis(this,this.graph.referenceLength);
    
    this.setGlobalAmbientLight(this.graph.ambientIllumination[0], this.graph.ambientIllumination[1], 
    this.graph.ambientIllumination[2], this.graph.ambientIllumination[3]);
    
    this.gl.clearColor(this.graph.background[0], this.graph.background[1], this.graph.background[2], this.graph.background[3]);
    
    this.initLights();

    // Adds lights group.
    this.interface.addLightsGroup(this.graph.lights);

    //PROJECT2
    this.interface.addSelectablesGroup(this.graph.selectables);
    //PROJECT2
}


//PROJECT2
XMLscene.prototype.update = function(currTime) {
    
    this.lastTime = this.lastTime || 0.0;
    this.deltaTime = currTime - this.lastTime || 0.0;
    this.lastTime = currTime;

    this.deltaTime = this.deltaTime/1000; //in seconds

    for(let i =0; i < this.graph.animRefsToBeUpdated.length; i++){
        this.graph.animRefsToBeUpdated[i].updateMatrix(this.deltaTime);
    }

    this.timeFactor=Math.abs(Math.sin(currTime/1000));
    this.compTimeFactor=1-this.timeFactor;


    this.testShader.setUniformsValues({timeFactor: this.timeFactor});
    this.testShader.setUniformsValues({compTimeFactor: this.compTimeFactor});

    this.testShader.setUniformsValues({scaleFactor: this.scaleFactor});
    this.testShader.setUniformsValues({redFactor: this.redFactor});
    this.testShader.setUniformsValues({greenFactor: this.greenFactor});
    this.testShader.setUniformsValues({blueFactor: this.blueFactor});

}
//PROJECT2


/**
 * Displays the scene.
 */
XMLscene.prototype.display = function() {

    //PROJECT3
    this.logPicking();
    this.clearPickRegistration();
    //PROJECT3


    // ---- BEGIN Background, camera and axis setup
    
    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();

    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    this.pushMatrix();
    
    if (this.graph.loadedOk) 
    {        
        // Applies initial transformations.
        this.multMatrix(this.graph.initialTransforms);

		// Draw axis
		this.axis.display();

        var i = 0;
        for (var key in this.lightValues) {
            if (this.lightValues.hasOwnProperty(key)) {
                if (this.lightValues[key]) {
                    this.lights[i].setVisible(true);
                    this.lights[i].enable();
                }
                else {
                    this.lights[i].setVisible(false);
                    this.lights[i].disable();
                }
                this.lights[i].update();
                i++;
            }
        }

        // Displays the scene.
        this.graph.displayScene();

    }
	else
	{
		// Draw axis
		this.axis.display();
    }
    
    //PROJECT3
    // draw objects
	for (i =0; i<this.objects.length; i++) {

        let column= Math.ceil((i+1)/11);
        let row= (i+1)-(11*(column-1));

		this.pushMatrix();
        this.translate(row, 0.51+0.2, column);
        this.scale(0.7,1,0.7);
		this.registerForPick(i+1, this.objects[i]);
		this.setActiveShader(this.transparencyShader);
        this.objects[i].display();
        this.setActiveShader(this.defaultShader);
		this.popMatrix();
    }
    //PROJECT3
    

    this.popMatrix();
    
    // ---- END Background, camera and axis setup
    
}

//PROJECT3


XMLscene.prototype.logPicking = function ()
{

    let column= Math.ceil((i+1)/11);
    let row= (i+1)-(11*(column-1));



	if (this.pickMode == false) {
		if (this.pickResults != null && this.pickResults.length > 0) {
			for (var i=0; i< this.pickResults.length; i++) {
				var obj = this.pickResults[i][0];
				if (obj)
				{
                    var customId = this.pickResults[i][1];
                    let column = Math.ceil(customId/11);
                    let row = customId - (11*(column-1));				
					console.log("Picked object with row "+ row + " and column " + column);
				}
			}
			this.pickResults.splice(0,this.pickResults.length);
		}		
	}
}


/**
 * PROLOG SERVER
 */
function getPrologRequest(requestString, onSuccess, onError, port)
{
    var requestPort = port || 8081
    var request = new XMLHttpRequest();
    request.open('GET', 'http://localhost:'+requestPort+'/'+requestString, true);

    request.onload = onSuccess || function(data){console.log("Request successful. Reply: " + data.target.response);};
    request.onerror = onError || function(){console.log("Error waiting for response");};

    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.send();
}

function makeRequest(requestString)
{    
    // Make Request
    getPrologRequest(requestString, handleReply);
}

//Handle the Reply
function handleReply(data){
    //document.querySelector("#query_result").innerHTML=data.target.response;
    console.log(data.target.response);
}

//PROJECT3