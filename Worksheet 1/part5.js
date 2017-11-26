var gl;
var canvas
var direction = 1.0;

var theta = 0.0
var thetaLoc;

var points = [];

window.onload = function init()
{
    canvas = document.getElementById("webgl");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log("WebGL isn't available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    createCirclePoints(0.25, 400);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta");

    render();
};


function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (theta > 0.8 || theta < -0.8) {
        direction *= -1;
    }

    theta += 0.009 * direction;
    gl.uniform1f(thetaLoc, theta);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length);

    window.requestAnimFrame(render);
}

function createCirclePoints(radius, numberOfPoints)
{
    for (var i = 0; i <= numberOfPoints; i++) {
        var point = vec2(radius * Math.cos((2 * Math.PI * i) / numberOfPoints), radius * Math.sin((2 * Math.PI * i) / numberOfPoints));
        points.push(point);
    }
}
