var gl;
var canvas;

var vertices = [
    vec4(-4.0, -1.0, -1.0, 1.0),
    vec4(4.0, -1.0, -1.0, 1.0),
    vec4(4.0, -1.0, -21.0, 1.0),
    vec4(-4.0, -1.0, -21.0, 1.0)
]

var size = 64;
var rows = 8;
var columns = 8;

var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

window.onload = function init()
{
    canvas = document.getElementById( "webgl" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {
        console.log( "WebGL isn't available" );
        return;
    }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    gl.mvpMatrix = gl.getUniformLocation(program, "mvpMatrix");

    var checkerBoard = checkerboard(size, rows, columns);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, checkerBoard);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //Generate texture coordinates and push to array
    var texCoordsArray = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0)
    ]

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aspect = canvas.width/canvas.height;
    var projectionViewMatrix = perspective(90.0, aspect, 0.01, 10);
    var modelViewMatrix = lookAt(eye, at, up);
    var ctm = mult(projectionViewMatrix, modelViewMatrix);
    
    gl.uniformMatrix4fv(gl.mvpMatrix, false, flatten(ctm));

    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
}

function checkerboard(texSize, numRows, numCols) {
    var myTexels = new Uint8Array(4 * texSize * texSize);

    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j < texSize; j++) {
            var patchx = Math.floor(i / (texSize / numRows));
            var patchy = Math.floor(j / (texSize / numCols));

            var c = (patchx % 2 !== patchy % 2 ? 255 : 0);

            myTexels[4 * i * texSize + 4 * j]     = c;
            myTexels[4 * i * texSize + 4 * j + 1] = c;
            myTexels[4 * i * texSize + 4 * j + 2] = c;
            myTexels[4 * i * texSize + 4 * j + 3] = 255;
        }
    }
    return myTexels;
}
