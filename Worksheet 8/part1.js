var gl;
var canvas;

var g_objDoc = null;
var g_drawingInfo = null;

var groundVertices = [
  // Large ground quad
  vec4(-2.0, -1.0, -1.0, 1.0),
  vec4(-2.0, -1.0, -5.0, 1.0),
  vec4(2.0, -1.0, -5.0, 1.0),
  vec4(2.0, -1.0, -1.0, 1.0),
  vec4(-2.0, -1.0, -1.0, 1.0),
  vec4(2.0, -1.0, -5.0, 1.0),
];

var texCoordsArray = [
    vec2(0.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 0.0)
]

var projectionMatrix;
var modelViewMatrix;
var mvp;
var model;

var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var rotating = true;
var theta = 0.0;

var move = false;
var height = -1.0;
var direction = 0.02;

var light;
var shadow;

var textureLoaded = false;

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

    gl.enable(gl.DEPTH_TEST);

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.groundProgram = initShaders(gl, "ground-vertex-shader", "ground-fragment-shader");

    gl.useProgram(gl.groundProgram);
    gl.groundProgram.vPosition = gl.getAttribLocation(gl.groundProgram, "vPosition");
    gl.groundProgram.vTexCoord = gl.getAttribLocation(gl.groundProgram, "vTexCoord");
    gl.groundProgram.mvpMatrix = gl.getUniformLocation(gl.groundProgram, "mvpMatrix");
    gl.groundProgram.texMap = gl.getUniformLocation(gl.groundProgram, "texMap");

    var texture0 = gl.createTexture();
    var image0 = document.createElement('img');
    image0.crossOrigin = 'anonymous';

    image0.onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        textureLoaded = true;
    };
    image0.src = 'xamp23.png';
    gl.uniform1i(gl.groundProgram.texMap, 0);

    gl.ground_vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.ground_vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(groundVertices), gl.STATIC_DRAW);

    gl.ground_tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.ground_tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);


    gl.useProgram(gl.program);
    gl.program.vPosition = gl.getAttribLocation(gl.program, 'vPosition');
    gl.program.vNormal = gl.getAttribLocation(gl.program, 'vNormal');
    gl.program.vColor = gl.getAttribLocation(gl.program, 'vColor');
    gl.program.lightPosition = gl.getUniformLocation(gl.program, "lightPosition");
    gl.program.mvpMatrix = gl.getUniformLocation(gl.program, "mvpMatrix");

    model = initVertexBuffers(gl, gl.program);
    readOBJFile('teapot.obj', 0.25, true);

    document.getElementById("Spin").onclick = function () {
        rotating = !rotating;
    };

    document.getElementById("Jump").onclick = function () {
        move = !move;
    };

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    requestAnimFrame(render);

    if (textureLoaded) {

        // OBJ and all MTLs are available
        if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
            g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        }
        if (!g_drawingInfo) return;

        // Setup camera
        projectionMatrix = perspective(90.0, canvas.width / canvas.height, 0.01, 10);
        modelViewMatrix = lookAt(eye, at, up);
        mvp = mult(projectionMatrix, modelViewMatrix);

        // We calculate the light and the projection matrix
        light = vec3(0, 2.0, -2.0);
        var m = mat4();
        m[3][3] = 0.0;
        m[3][1] = -1.0 / (light[1] + 1.001);

        if (move) {
            height += direction;
        }

        if (rotating) {
            theta += 0.02;
        }

        if (theta > 2 * Math.PI) {
            theta -= 2 * Math.PI;
        }

        if (Math.abs(height) > 1.0)
        {
            direction = -direction;
        }

        light = vec3(3.0 * Math.cos(theta), 2.0, -2.0 * Math.sin(theta) - 2.0);

        shadow = mult(m, translate(-light[0], -light[1], -light[2]));
        shadow = mult(translate(light[0], light[1], light[2]), shadow);

        gl.useProgram(gl.groundProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.ground_vBuffer);
        gl.vertexAttribPointer(gl.groundProgram.vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.groundProgram.vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.ground_tBuffer);
        gl.vertexAttribPointer(gl.groundProgram.vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.groundProgram.vTexCoord);

        gl.uniformMatrix4fv(gl.groundProgram.mvpMatrix, false, flatten(mvp));
        gl.drawArrays(gl.TRIANGLES, 0, groundVertices.length);

        gl.useProgram(gl.program);

        initAttributeVariable(gl, gl.program.vPosition, model.vertexBuffer)
        initAttributeVariable(gl, gl.program.vNormal, model.normalBuffer)
        initAttributeVariable(gl, gl.program.vColor, model.colorBuffer)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);

        var translation = translate(0.0, height, -3.0);

        var im = inverse(translation);
        var lightw = vec4(light, 1.0);
        gl.uniform3f(gl.program.lightPosition, dot(im[0], lightw), dot(im[1], lightw), dot(im[2], lightw));

        var ctm = mult(mvp, mult(shadow, translation));
        gl.uniformMatrix4fv(gl.program.mvpMatrix, false, flatten(ctm));
        gl.uniform1f(gl.getUniformLocation(gl.program, "visibility"), 0.0);
        gl.depthFunc(gl.GREATER);
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

        gl.depthFunc(gl.LESS);
        ctm = mult(mvp, translation);
        gl.uniformMatrix4fv(gl.program.mvpMatrix, false, flatten(ctm));
        gl.uniform1f(gl.getUniformLocation(gl.program, "visibility"), 1.0);
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

//Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.vPosition, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.vNormal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.vColor, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();

    return o;
}

//Create a buffer object, assign it to attribute variables and enable the assignment
function createEmptyArrayBuffer(gl, v_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create buffer object
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

// Read a file
function readOBJFile(fileName, scale, reverse) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, scale, reverse);
        }
    }
    request.open('GET', fileName, true); // Create a request to acquire the file
    request.send();                      // Send the request
}

// OBJ File has been read
function onReadOBJFile(fileString, fileName, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse);
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}
