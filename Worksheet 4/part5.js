var gl;
var canvas;

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

var lightPosition = vec4(0.0, 0.0, -1.0, 0.0);
var lightEmission = vec4(1.0, 1.0, 1.0, 1.0);
var lightAmbient = lightEmission;
var lightDiffuse = lightEmission;
var lightSpecular = lightEmission;

var materialAmbientFirst = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuseFirst = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecularFirst = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

var materialAmbient, materialDiffuse, materialSpecular;

var ambientProduct, diffuseProduct, specularProduct;

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
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle(a, b, c);
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
    canvas = document.getElementById("webgl");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.FRONT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var colorArray = [];
    for (var i = 0; i < pointsArray.length; i++) {
        colorArray.push(vec4(
          pointsArray[i][0]*0.5+0.5,
          pointsArray[i][1]*0.5+0.5,
          pointsArray[i][2]*0.5+0.5,
          1.0
      ));
    }

    gl.ambient =  gl.getUniformLocation(program, "ambientProduct");
    var ambientProductValue = document.getElementById("ambientProduct").valueAsNumber;
    materialAmbient = scale(ambientProductValue, materialAmbientFirst);

    gl.diffuse = gl.getUniformLocation(program, "diffuseProduct");
    var diffuseProductValue = document.getElementById("diffuseProduct").valueAsNumber;
    materialDiffuse = scale(diffuseProductValue, materialDiffuseFirst);

    gl.specular = gl.getUniformLocation(program, "specularProduct");
    var specularProductValue = document.getElementById("specularProduct").valueAsNumber;
    materialSpecular = scale(specularProductValue, materialSpecularFirst);

    gl.shininess = gl.getUniformLocation(program, "shininess");
    materialShininess = document.getElementById("shininess").valueAsNumber;

    gl.lightEmission = gl.getUniformLocation(program, "lightEmission");
    var lightEmissionValue = document.getElementById("lightEmission").valueAsNumber;
    lightEmission = vec4(lightEmissionValue, lightEmissionValue, lightEmissionValue, 1.0);

    calculateLight();

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

    document.getElementById("ambientProduct").oninput = function (event) {
        var ambientProductValue = event.target.valueAsNumber;
        materialAmbient = scale(ambientProductValue, materialAmbientFirst);
        calculateLight();
    };

    document.getElementById("diffuseProduct").oninput = function (event) {
        var diffuseProductValue = event.target.valueAsNumber;
        materialDiffuse = scale(diffuseProductValue, materialDiffuseFirst);
        calculateLight();
    };

    document.getElementById("specularProduct").oninput = function (event) {
        var specularProductValue = event.target.valueAsNumber;
        materialSpecular = scale(specularProductValue, materialSpecularFirst);
        calculateLight();
    };

    document.getElementById("shininess").oninput = function (event) {
        materialShininess = event.target.valueAsNumber;
        calculateLight();
    };

    document.getElementById("lightEmission").oninput = function (event) {
        var lightEmissionValue = document.getElementById("lightEmission").valueAsNumber;
        lightEmission = vec4(lightEmissionValue, lightEmissionValue, lightEmissionValue, 1.0);
        lightAmbient = lightEmission;
        lightDiffuse = lightEmission;
        lightSpecular = lightEmission;
        calculateLight();
    };

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition));

    render();
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aspect = canvas.width/canvas.height;

    var projectionMatrix = perspective(45.0, aspect, 0.1, 10.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Rotate
    var t = Date.now()
    var rotation = radians(t * 0.025 % 360)
    var radius = 3.5;

    eye = vec3(radius * Math.sin(rotation), 0.0, radius * Math.cos(rotation));

    var modelViewMatrix = lookAt(eye, at, up) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    normMatrix = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normMatrix));

    for(var i=0; i<index; i+=3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }

    window.requestAnimFrame(render);
}

function calculateLight() {
    ambientProduct = mult(lightAmbient, materialAmbient);
    gl.uniform4fv(gl.ambient, flatten(ambientProduct));

    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(gl.diffuse, flatten(diffuseProduct));

    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.specular, flatten(specularProduct));

    gl.uniform1f(gl.shininess, materialShininess);

    gl.uniform4fv(gl.lightEmission, flatten(lightEmission));
}
