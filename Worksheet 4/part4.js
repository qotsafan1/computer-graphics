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
var normalsArray = [];

var lightPosition = vec4(0.0, 0.0, -1.0, 0.0 );

var va = vec4(0.0, 0.0, 1.0, 1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333, 1);

var points = [];

function triangle(a, b, c) {
     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);

     normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
     normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
     normalsArray.push(vec4(c[0], c[1], c[2], 0.0));

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
    gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.FRONT);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var colorArray = [];
    for (var i = 0; i < pointsArray.length; i++) {
        colorArray.push(vec4(
          pointsArray[i][0]*0.5+0.5,
          pointsArray[i][1]*0.5+0.5,
          pointsArray[i][2]*0.5+0.5,
          1.0
        ));
    }

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    gl.ambient =  gl.getUniformLocation(program, "ka");
    var ka = document.getElementById("ka").valueAsNumber;
    gl.uniform4f(gl.ambient, ka, ka, ka, 0.0);

    gl.diffuse = gl.getUniformLocation(program, "kd");
    var kd = document.getElementById("kd").valueAsNumber;
    gl.uniform4f(gl.diffuse, kd, kd, kd, 0.0);

    gl.specular = gl.getUniformLocation(program, "ks");
    var kd = document.getElementById("ks").valueAsNumber;
    gl.uniform4f(gl.specular, ks, ks, ks, 0.0);

    gl.alpha = gl.getUniformLocation(program, "alpha");
    var alpha = document.getElementById("alpha").valueAsNumber;
    gl.uniform4f(gl.alpha, alpha, alpha, alpha, 0.0);

    gl.lightEmission = gl.getUniformLocation(program, "lightEmission");
    var lightEmission = document.getElementById("lightEmission").valueAsNumber;
    gl.uniform4f(gl.lightEmission, lightEmission, lightEmission, lightEmission, 0.0);

    document.getElementById("increaseSubdivision").onclick = function(){
        numTimesToSubdivide++;
        index = 0;
        pointsArray = [];
        normalsArray = [];
        init();
    };
    document.getElementById("decreaseSubdivison").onclick = function(){
        if(numTimesToSubdivide) numTimesToSubdivide--;
        index = 0;
        pointsArray = [];
        normalsArray = [];
        init();
    };

    document.getElementById("ka").oninput = function (event) {
        var ka = event.target.valueAsNumber;
        gl.uniform4f(gl.alpha, ka, ka, ka, 0.0);
    };

    document.getElementById("kd").oninput = function (event) {
        var kd = event.target.valueAsNumber;
        gl.uniform4f(gl.diffuse, kd, kd, kd, 0.0);
    };

    document.getElementById("ks").oninput = function (event) {
        var ks = event.target.valueAsNumber;
        gl.uniform4f(gl.specular, ks, ks, ks, 0.0);
    };

    document.getElementById("alpha").oninput = function (event) {
        var alpha = event.target.valueAsNumber;
        gl.uniform4f(gl.specular, alpha, alpha, alpha, 0.0);
    };

    document.getElementById("lightEmission").oninput = function (event) {
        var lightEmission = event.target.valueAsNumber;
        gl.uniform4f(gl.lightEmission, lightEmission, lightEmission, lightEmission, 0.0);
    };

    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition));

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

    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

    for( var i=0; i<index; i+=3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );
    }

    window.requestAnimFrame(render);
}
