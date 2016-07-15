'use strict';

var http = require('http');
var url = require('url');
var mandelbrot = require('./mandelbrot');
var unixtstsamp = require('unix-timestamp');
var math = require('math');
var getIP = require('external-ip')();
var fs = require('fs');

const PORT = 8080;

//Module configuration
mandelbrot.init_sync("/home/eurie/writing/code/fractalier/fractalier-gen");
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
    if(!params.id) {
        response.writeHead(400, { "Content-Type" : "text/plain" });
        response.end("400 Bad Request: Resource ID not specified");
    }
    var resPath = mandelbrot.path_dest + '/' + params.id + ".png";
    
    try {
        fs.statSync(resPath);
    } catch (e) {
        response.writeHead(404, { "Content-Type" : "text/plain" });
        response.end("404: Cannot stat resource '" + params.id + "'");
        return;
    }

    try {
        fs.accessSync(resPath, fs.constants.R_OK);
    } catch (e) {
        response.writeHead(500, { "Content-Type" : "text/plain" });
        response.end("500: Internal server error; resource inaccessible on system");
        return;
    }

    response.writeHead(200, { "Content-Type" : "image/png" });
    response.end(fs.readFile(resPath));
}

function handleMandelbrotRequest(request, response) {
    var params = url.parse(request.url, true);
    var req = {
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
            response.writeHead(500, { "Content-Type" : "text/plain" });
            response.end("Internal server error: " + err);
        } else /*if (req.finished)*/ {
            //TODO: Redirect to a temporary resource matching the ID of the request
            response.writeHead(301, {
                "Location" : "http://" + pubAddr + ':' + PORT + '/' + req.id,
                "Content-Type" : "text/plain"
            });
            response.end("Redirecting to resID " + req.id + "...");
        }
    });
}

var restServer = http.createServer(handleRestRequest);

restServer.listen(PORT, function() {
    console.log("Listening for requests at http://%s:%s", pubAddr, PORT);
});
