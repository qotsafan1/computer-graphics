var gl;
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

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 10000, gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    canvas.addEventListener("mousedown", function(e) {  
        points.push(vec2(2*(e.clientX-e.target.getBoundingClientRect().left)/canvas.width-1,
            2*(canvas.height-e.clientY+e.target.getBoundingClientRect().top)/canvas.height-1));

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    } );

    render();
};


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    if (points.length > 0) {
        gl.drawArrays( gl.POINTS, 0, points.length );
    }

    window.requestAnimFrame(render);
}
