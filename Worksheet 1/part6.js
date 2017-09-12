var gl;
var numCirclePoints = 4000;
var radius = 0.25;
var centerX = 0.0;
var centerY = -0.65;
var dry = 0.1;
var speed = 0.02
var direction = 1.0;

var points = [];

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

    points.push(vec2(centerX, centerY));
    createCirclePoints(vec2(centerX, centerY), radius, numCirclePoints );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
};


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, points.length );

    moveCircle(dry);
    window.requestAnimFrame(render);

    if (dry > 1.4 && direction > 0) {
        direction = -1.0;
    } else if (dry < -0.1 && direction < 0) {
        direction = 1.0;
    }

    dry = dry + (speed * direction);
}

function createCirclePoints( cent, rad, k )
{
    var dAngle = 2*Math.PI/k;
    for( i=k; i>=0; i-- ) {
        a = i*dAngle;
        var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
        points.push(p);
        i--;
        var p = vec2( rad*Math.sin(a) + cent[0], rad*Math.cos(a) + cent[1] );
        points.push(p);
        i--;
    }
}

function moveCircle(dry) {
    points = [];

    points.push(vec2(centerX, (centerY+dry)));

    createCirclePoints(vec2(centerX, (centerY+dry)), radius, numCirclePoints );
        
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
}
