var http = require('http');
var url = require('url');
var mandelbrot = require('mandelbrot');
var unixtstsamp = require('unix-timestamp');
var math = require('math');
var PORT = 8080;

//Module configuration
mandelbrot.init();
mandelbrot.set_plte_sync("/home/eurie/writing/code/fractalier/blues.map");
mandelbrot.set_dest_path_sync("/etc/fractalier/out");

function handleHttpRequest(request, response) {
    var params = url.parse(request.url, true);
    switch(params.t) {
        case 'm':
            handleMandelbrotRequest(request, response);
            break;
        default:
            response.statusCode = 400;
            response.end("Invalid request");
            
    }
}

function handleMandelbrotRequest(request, response) {
    var params = url.parse(request.url, true);
    var req {
        anchor_real     : params.ctr_r,
        anchor_imag     : params.ctr_i,
        extense_real    : params.ext_r,
        extense_imag    : params.ext_i,
        width           : params.w,
        height          : params.h,
        depth           : params.d, 
        id              : unixtstamp.now() + ':' + 
                            math.randomInt(1024, 8192)
    }
    mandelbrot.perform(req, function onRequestPerformed(err, outFilePath) {
        if(err) {
            response.statusCode = 500;
            response.end(err);
        } else if (req.finished) {
            //TODO: Redirect to a temporary resource matching the ID of the request
            
        }
}
