var gl;
var canvas;

var vertices = [
  // Large ground quad
  vec4(-2.0, -1.0, -1.0, 1.0),
  vec4(-2.0, -1.0, -5.0, 1.0),
  vec4(2.0, -1.0, -5.0, 1.0),
  vec4(2.0, -1.0, -1.0, 1.0),
  vec4(-2.0, -1.0, -1.0, 1.0),
  vec4(2.0, -1.0, -5.0, 1.0),

  // Left red quad
  vec4(-1.0, -1.0, -2.5, 1.0),
  vec4(-1.0, -1.0, -3.0, 1.0),
  vec4(-1.0, 0.0, -3.0, 1.0),
  vec4(-1.0, 0.0, -3.0, 1.0),
  vec4(-1.0, -1.0, -2.5, 1.0),
  vec4(-1.0, 0.0, -2.5, 1.0),

  // Right red quad
  vec4(0.25, -0.5, -1.25, 1.0),
  vec4(0.75, -0.5, -1.25, 1.0),
  vec4(0.75, -0.5, -1.75, 1.0),
  vec4(0.75, -0.5, -1.75, 1.0),
  vec4(0.25, -0.5, -1.25, 1.0),
  vec4(0.25, -0.5, -1.75, 1.0)
]

var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var radius = 2;
var light = vec3(0.0, 2.0, -2.0);
var m = mat4();
    m[3][3] = 0;
    m[3][1] = -1/light[1];

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
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    gl.mvpMatrix = gl.getUniformLocation(program, "mvpMatrix");
    gl.texMap = gl.getUniformLocation(program, "texMap");
    gl.visibility = gl.getUniformLocation(program, "visibility");

    // Setup the texture of the ground
    var texture0 = gl.createTexture();
    var image0 = document.createElement('img');
    image0.crossOrigin = 'anonymous';

    // We load the image into the texture
    image0.onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image0.src = 'xamp23.png';

    // We create the second red texture
    var texture1 = gl.createTexture();
    var image1 = new Uint8Array([255, 0, 0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, image1);

    // Shadow texture
    var texture2 = gl.createTexture();
    var image2 = new Uint8Array([0, 0, 0]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, image2);

    //Generate texture coordinates and push to array
    var texCoordsArray = [
      // Large ground quad
      vec2(0.0, 0.0),
      vec2(0.0, 1.0),
      vec2(1.0, 0.0),
      vec2(1.0, 1.0),
      vec2(0.0, 0.0),
      vec2(1.0, 0.0),

      // Left red quad
      vec2(0.0, 0.0),
      vec2(0.0, 1.0),
      vec2(1.0, 0.0),
      vec2(1.0, 1.0),
      vec2(0.0, 0.0),
      vec2(1.0, 0.0),

      // Right red quad
      vec2(0.0, 0.0),
      vec2(0.0, 1.0),
      vec2(1.0, 0.0),
      vec2(1.0, 1.0),
      vec2(0.0, 0.0),
      vec2(1.0, 0.0)
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

    //gl.depthFunc(gl.LESS);
    gl.uniform1i(gl.texMap, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Rotate
    var t = Date.now()
    var rotation = radians(t * 0.05 % 360)
    //var rotation = 0.01;
    light[0] = Math.sin(rotation) * radius;
    light[2] = Math.cos(rotation) * radius - radius;

    var shadowMatrix = mult(modelViewMatrix, translate(light[0], light[1] - 1.001, light[2]));
    shadowMatrix = mult(shadowMatrix, m);
    shadowMatrix = mult(shadowMatrix, translate(-light[0], -(light[1] - 1.001), -light[2]));
    ctmShadow = mult(projectionViewMatrix, shadowMatrix);

    gl.uniformMatrix4fv(gl.mvpMatrix, false, flatten(ctmShadow));
    gl.uniform1f(gl.visibility, 0.0);
    gl.depthFunc(gl.GREATER);
    gl.drawArrays(gl.TRIANGLES, 6, 12);
    gl.depthFunc(gl.LESS);

    gl.uniform1f(gl.visibility, 1.0);
    gl.uniformMatrix4fv(gl.mvpMatrix, false, flatten(ctm));
    gl.uniform1i(gl.texMap, 1);
    gl.drawArrays(gl.TRIANGLES, 6, 12);

    requestAnimFrame(render);
}
