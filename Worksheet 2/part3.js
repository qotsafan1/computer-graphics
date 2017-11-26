var gl;
var canvas;

var colorIndex = 0;
var pointIndex = 0;
var triangleIndex = 501;

var pointArray = [];
var triangleArray = [];

var maxNumVertices  = 4509;

// Mode
// 0 - Point
// 1 - Triangle
var mode = 0;

var colors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

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

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    document.getElementById("clear").onclick = function(){
        clearCanvas();
    };

    document.getElementById("pointsButton").onclick = function(){
        changeMode(0);
    };

    document.getElementById("triangleButton").onclick = function(){
        changeMode(1);
    };

    var m = document.getElementById("colorMenu");
    m.addEventListener("click", function() {
        colorIndex = m.selectedIndex;
    });

    canvas.addEventListener("mousedown", function(e) {
        var point = vec2(2*(e.clientX-e.target.getBoundingClientRect().left)/canvas.width-1,
            2*(canvas.height-e.clientY+e.target.getBoundingClientRect().top)/canvas.height-1);

        if (mode === 1) {
            triangleIndex++;

            if (triangleIndex%3 === 0) {
                var v3 = point;
                var v2 = pointArray.pop();
                var v1 = pointArray.pop();
                triangleArray.push(v1);
                triangleArray.push(v2);
                triangleArray.push(v3);
                pointIndex -= 2;

                createTriangle(vBuffer, cBuffer, [v1,v2,v3]);
            }
            else {
                createPoint(vBuffer, cBuffer, point);
            }
        } else {
            createPoint(vBuffer, cBuffer, point);
        }
    });

    render();
};


function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (pointArray.length > 0) {
        gl.drawArrays(gl.POINTS, 0, pointArray.length);
    }

    if (triangleIndex > 501) {
        gl.drawArrays(gl.TRIANGLES, 501, triangleArray.length+3);
    }

    window.requestAnimFrame(render);
}

function clearCanvas() {
    pointIndex = 0;
    triangleIndex = 501;
    pointArray = [];
    triangleArray = [];

    gl.clearColor(parseFloat(colors[colorIndex][0]), parseFloat(colors[colorIndex][1]), parseFloat(colors[colorIndex][2]), 1.0);
}

function changeMode(newMode) {
    if (mode === 1 && triangleIndex%3 !== 0 && triangleIndex !== 501) {
        triangleIndex--;

        if (triangleIndex%3 !== 0) {
            triangleIndex--;
        }
    }

    mode = newMode;
}

function createPoint(vBuffer, cBuffer, point) {
    pointArray.push(point);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(pointArray.length-1), flatten(point));

    var t = vec4(colors[colorIndex]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*pointIndex, flatten(t));
    pointIndex++;
}

function createTriangle(vBuffer, cBuffer, points) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangleIndex+0), flatten(points[0]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangleIndex+1), flatten(points[1]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangleIndex+2), flatten(points[2]));

    var t = vec4(colors[colorIndex]);
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangleIndex+0), flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangleIndex+1), flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangleIndex+2), flatten(t));
}
