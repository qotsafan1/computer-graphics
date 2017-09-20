var gl;

var colorIndex = 0;
var pointIndex = 0;

var maxNumTriangles = 200;
var maxNumVertices  = 3 * maxNumTriangles;

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

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer);
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
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
        var t = vec2(2*(e.clientX-e.target.getBoundingClientRect().left)/canvas.width-1,
            2*(canvas.height-e.clientY+e.target.getBoundingClientRect().top)/canvas.height-1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8*pointIndex, flatten(t));

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        t = vec4(colors[colorIndex]);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16*pointIndex, flatten(t));
        pointIndex++;
    });

    render();
};


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (pointIndex > 0) {
        gl.drawArrays( gl.POINTS, 0, pointIndex );
    }

    window.requestAnimFrame(render);
}

function clearCanvas() {
    pointIndex = 0;
    gl.clearColor(parseFloat(colors[colorIndex][0]), parseFloat(colors[colorIndex][1]), parseFloat(colors[colorIndex][2]), 1.0);
}
