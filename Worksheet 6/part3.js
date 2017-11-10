var canvas;
var gl;
var modelViewMatrixLoc;
var projectionMatrixLoc;
var normalMatrixLoc;

var eye = vec3(0.0, 0.0, 3.5);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var numTimesToSubdivide = 3;
var index = 0;
var pointsArray = [];

var lightPosition = vec4(0.0, 0.0, -1.0, 0.0 );
var lightEmission = vec4(1.0, 1.0, 1.0, 0.0 );

var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var points = [];

var ready = false;

function triangle(a, b, c) {
     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);

     index += 3;
}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
        var ab = normalize(mix( a, b, 0.5), true);
        var ac = normalize(mix( a, c, 0.5), true);
        var bc = normalize(mix( b, c, 0.5), true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

window.onload = function init()
{
    canvas = document.getElementById( "webgl" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        ready = true;
    };
    image.src = 'earth.jpg';

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // We link and initialize our light source and emission factor to the shader
    gl.emission = gl.getUniformLocation(program, "Le");
    gl.directionLight = gl.getUniformLocation(program, "le");

    gl.uniform3f(gl.emission, 1.0, 1.0, 1.0);
    gl.uniform3f(gl.directionLight, 0.0, 0.0, -1.0);

    // We link and initialize the material parameters
    gl.ambient = gl.getUniformLocation(program, "ka");
    gl.diffuse = gl.getUniformLocation(program, "kd");

    gl.uniform3f(gl.ambient, 1.0, 1.0, 1.0);
    gl.uniform3f(gl.diffuse, 1.0, 1.0, 1.0);

    document.getElementById("increaseSubdivision").onclick = function(){
        numTimesToSubdivide++;
        index = 0;
        pointsArray = [];
        init();
    };
    document.getElementById("decreaseSubdivison").onclick = function(){
        if(numTimesToSubdivide) numTimesToSubdivide--;
        index = 0;
        pointsArray = [];
        init();
    };

    render();
}

function render()
{
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var aspect = canvas.width/canvas.height;

      var projectionMatrix = perspective(45.0, aspect, 0.1, 10.0);
      gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

      // Rotate
      var t = Date.now()
      var rotation = radians(t * 0.05 % 360)
      var radius = 3.5;

      eye = vec3(radius * Math.sin(rotation), 0.0, radius * Math.cos(rotation));

      var modelViewMatrix = lookAt( eye, at, up ) ;
      gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

      for( var i=0; i<index; i+=3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );
      }

    window.requestAnimFrame(render);
}
