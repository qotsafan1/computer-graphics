var gl;
var canvas;

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
    canvas = document.getElementById("webgl");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    addPoints();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var eye = vec3(0.5, 0.5, 0.5);
    var at  = vec3(0.0, 0.0, 0.0);
    var up  = vec3(0.0, 1.0, 0.0);
    var modelViewMatrix = lookAt(eye, at, up);

    var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, points.length);
}
