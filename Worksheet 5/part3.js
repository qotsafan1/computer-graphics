var gl;
var canvas;

var modelViewMatrixLoc;
var projectionMatrixLoc;
var model;

var eye = vec3(0.0, 0.0, 9.5);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var g_objDoc = null;         // The information of OBJ file
var g_drawingInfo = null;    // The information for drawing 3D model
var gobjDoc;

window.onload = function init() {
    canvas = document.getElementById( "webgl" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        alert( "WebGL isn't available" );
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);

    main();
}

function main() {
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix")

    // Get the storage locations of attribute and uniform variables
    //var program = gl.program;
    program.vPosition = gl.getAttribLocation(program, 'vPosition');
    program.vNormal = gl.getAttribLocation(program, 'vNormal');
    program.vColor = gl.getAttribLocation(program, 'vColor');

    // Prepare empy buffer objects for vertex coordinates
    model = initVertexBuffers(gl, program);

    // Start reading the OBJ file
    readOBJFile("teapot.obj", gl, model, 1, true);

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    window.requestAnimFrame(render);

    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
      // OBJ and all MTLs are available
      g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }
    if (!g_drawingInfo) return;

    var aspect = canvas.width/canvas.height;

    var projectionMatrix = perspective(45.0, aspect, 0.1, 10.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    var modelViewMatrix = lookAt( eye, at, up ) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

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

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(v_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(v_attribute); // Enable the assignment

    return buffer;
}

//Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
        }
    }

    request.open('GET', fileName, true); // Create a request to get file
    request.send();                      // Send the request
}

// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse);
    if (!result) {
        g_objDoc = null; gDrawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

// OBJ File has been read completely
function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();

    //Write data into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    //Write indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}
