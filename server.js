'use strict';

var http = require('http');
var url = require('url');
var mandelbrot = require('./mandelbrot');
var unixtstamp = require('unix-timestamp');
var math = require('math');
var getIP = require('external-ip')();
var fs = require('fs');

const PORT = 8080;

//Module configuration
mandelbrot.init_sync("/home/eurie/writing/code/fractalier/fractalier-gen");
mandelbrot.set_plte_sync("/home/eurie/writing/code/fractalier/blues.map");
mandelbrot.set_dest_path_sync("/home/eurie/writing/code/");

var pubAddr;
getIP(function (err, ip) {
    if(err) { throw err; }
    pubAddr = ip;
    console.log("Public IP found: " + ip);
});

var queryParams;
function handleRestRequest(request, response) {
    queryParams = url.parse(request.url, true).query;
    switch(queryParams.t) {
        case 'm':
            handleMandelbrotRequest(request, response);
            break;
        default:
            handleResourceRequest(request, response);
    }
}

function handleResourceRequest(request, response) {
    if(!queryParams.id) {
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
        anchor_real     : params.query.ctr_r,
        anchor_imag     : params.query.ctr_i,
        extense_real    : params.query.ext_r,
        extense_imag    : params.query.ext_i,
        width           : params.query.w,
        height          : params.query.h,
        depth           : params.query.d, 
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
            while(typeof(pubAddr) === "undefined") {
                //block until pubAddr is found
            }
            response.end("Redirecting to resID " + req.id + "...");
        }
    });
}

var restServer = http.createServer(handleRestRequest);

restServer.listen(PORT, function() {
    console.log("Listening for requests at http://%s:%s", pubAddr, PORT);
});
