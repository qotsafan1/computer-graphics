var canvas;
var gl;
var modelViewMatrix;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio
var eye;
var at;
var up = vec3(0.0, 1.0, 0.0);

var points = [];

var vertices = [
    [0.0, 0.0, 0.0, 1.0],
    [1.0, 0.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0],
];

var indices = [
    // Front
    0, 1,
    1, 2,
    2, 3,
    3, 0,
    // Back
    4, 5,
    5, 6,
    6, 7,
    7, 4,
    // Sides
    0, 4,
    1, 5,
    2, 6,
    3, 7,
];

function addPoints() {
  for (var i = 0; i<indices.length; i++) {
      points.push(vec4(vertices[indices[i]]));
  }
}

window.onload = function init()
{
    canvas = document.getElementById( "webgl" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    addPoints();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    aspect = canvas.width/canvas.height;

    var projectionMatrix = perspective(fovy, aspect, 0.1, 0.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // One point
    eye = vec3([  0.5,  0.5,  8.0*Math.cos(radians(45.0)) ]) ;
    at = vec3(0.5, 1.8, 0.5);
    var ctm = lookAt( eye, at, up ) ;
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.LINES, 0, points.length );

    // Two points
    eye = vec3([  0.5,  6.0*Math.cos(radians(30.0)),  4.0*Math.cos(radians(30.0)) ]) ;
    at = vec3(0.5, 0.5, 0.5);
    var ctm = lookAt( eye, at, up ) ;
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.LINES, 0, points.length );

    // Three points
    eye = vec3([  6.0*Math.cos(radians(45.0)),  12.0*Math.cos(radians(60.0)),  4.0*Math.cos(radians(30.0)) ]) ;
    at = vec3(0.5, -4.0, 0.5);
    var ctm = lookAt( eye, at, up ) ;
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays( gl.LINES, 0, points.length );
}
