var gl;

var colorIndex = 0;
var pointIndex = 0;
var triangleIndex = 501;
var circleIndex = 1002;

var pointArray = [];
var triangleArray = [];
var circleArray = [];

var maxNumTriangles = 1503;
var maxNumVertices  = 3 * maxNumTriangles;

var verticesInCircle = 102;
var circleCount = 0; 

// Mode
// 0 - Point,
// 1 - Triangle
// 2 - Circle
var mode = 0;

var colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

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

    var pointBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxNumVertices, gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 16*maxNumVertices, gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

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
                
                createTriangle(pointBuffer, colorBuffer, [v1,v2,v3]);
            }
            else {
                createPoint(pointBuffer, colorBuffer, point);
            }
        } else if (mode == 2) {
            circleIndex++;

            if (circleIndex%2 === 0) {
                circleCount++;

                var midPoint = pointArray.pop();
                var outPoint = point;
                
                pointIndex--;

                circleArray.push(midPoint);
                circleArray.push(outPoint);
                
                //Calculate radius
                var radius = Math.hypot(outPoint[0]-midPoint[0], outPoint[1]-midPoint[1]);

                var circlePoints = createCirclePoints( midPoint, radius, verticesInCircle );
                for (var i=0; i<circlePoints.length; i++) {
                    gl.bindBuffer( gl.ARRAY_BUFFER, pointBuffer );
                    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(1002+i+(verticesInCircle*(circleCount-1))), flatten(circlePoints[i]));
                    
                    t = vec4(colors[colorIndex]);
                    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(1002+i+(verticesInCircle*(circleCount-1))), flatten(t));
                }
            } else {
                createPoint(pointBuffer, colorBuffer, point);
            }
        } else {
            createPoint(pointBuffer, colorBuffer, point);
        }
    });

    render();
};


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (pointArray.length > 0) {
        gl.drawArrays( gl.POINTS, 0, pointArray.length);
    }

    if (triangleIndex > 501) {
        gl.drawArrays( gl.TRIANGLES, 501, triangleArray.length+3);
    }

    for (var i = 0; i < circleCount; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, 1002 + verticesInCircle*i, verticesInCircle);
    }
    
    window.requestAnimFrame(render);
}

function clearCanvas() {
    pointIndex = 0;
    triangleIndex = 501;
    circleIndex = 1002;
    circleCount = 0;
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
    } else if (mode === 2 && circleIndex%2 !== 0 && circleIndex !== 1002) {
        circleIndex--;
    }
    
    mode = newMode;
}

function createPoint(pointBuffer, colorBuffer, point) {
    pointArray.push(point);
    gl.bindBuffer( gl.ARRAY_BUFFER, pointBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(pointArray.length-1), flatten(point));
    
    var t = vec4(colors[colorIndex]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*pointIndex, flatten(t));
    pointIndex++;
}

function createTriangle(pointBuffer, colorBuffer, points) {
    gl.bindBuffer( gl.ARRAY_BUFFER, pointBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangleIndex+0), flatten(points[0]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangleIndex+1), flatten(points[1]));
    gl.bufferSubData(gl.ARRAY_BUFFER, 8*(triangleIndex+2), flatten(points[2]));

    var t = vec4(colors[colorIndex]);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangleIndex+0), flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangleIndex+1), flatten(t));
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*(triangleIndex+2), flatten(t));
}

function createCirclePoints( cent, rad, k )
{
    var circlePoints = [];
    circlePoints.push(cent);
    for (i = 0; i <= k-3; i++){
        circlePoints.push(vec2(
            rad*Math.cos(i*2*Math.PI/k) + cent[0],
            rad*Math.sin(i*2*Math.PI/k) + cent[1] 
        ));
    }

    circlePoints.push(vec2(
        rad*Math.cos(0) + cent[0],
        rad*Math.sin(0) + cent[1] 
    ));

    return circlePoints;
}
