'use strict';

var http = require('http');
var url = require('url');
var mandelbrot = require('mandelbrot');
var unixtstsamp = require('unix-timestamp');
var math = require('math');
var getIP = require('external-ip')();
var fs = require('fs');

const PORT = 8080;

//Module configuration
mandelbrot.init();
mandelbrot.set_plte_sync("/home/eurie/writing/code/fractalier/blues.map");
mandelbrot.set_dest_path_sync("/etc/fractalier/out");

var pubAddr = getIP();

function handleRestRequest(request, response) {
    var params = url.parse(request.url, true);
    switch(params.t) {
        case 'm':
            handleMandelbrotRequest(request, response);
            break;
        case 't':
            //Do nothing; descend to default case
        default:
            handleResourceRequest(request, response);
    }
}

function handleResourceRequest(request, response) {
    if(!params.id) [
        response.statusCode = 400;
        response.end("400 Bad Request: Resource ID not specified");
    }
    var resPath = mandelbrot.path_dest + '/' + params.id + ".png";
    if(!fs.statSync(resPath)) {
        response.statusCode = 404;
        response.end("404 Resource not found");
    } else if(!fs.accessSync(resPath) {
        response.statusCode = 500;
        response.end("500 Internal server error");
    } else {
        response.end(fs.readFile(resPath));
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
                            math.randomInt(1000, 9999)
    }
    mandelbrot.perform(req, function onRequestPerformed(err, outFilePath) {
        if(err) {
            response.statusCode = 500;
            response.end(err);
        } else if (req.finished) {
            //TODO: Redirect to a temporary resource matching the ID of the request
            response.writeHead(301, {
                "Location":"http://" + pubAddr + '/' + req.id
            });
            response.end();
        }
}

var restServer = http.createServer(handleRestRequest);

restServer.listen(PORT, function() {
    console.log("Listening for requests on http://%s:%s", pubAddr, PORT);
});
