'use strict';

var http = require('http');
var url = require('url');
var mandelbrot = require('./mandelbrot');
var getIP = require('external-ip')();
var fs = require('fs');

const PORT = 8080;

//Module configuration
var destPath = "/home/eurie/writing/code/fractalier-rest";
mandelbrot.init_sync("/home/eurie/writing/code/fractalier/fractalier-gen");
mandelbrot.set_plte_sync("/home/eurie/writing/code/fractalier/blues.map");
mandelbrot.set_dest_path_sync(destPath);

var pubAddr;
getIP(function (err, ip) {
    if(err) { throw err; }
    pubAddr = ip;
    console.log("Public IP found: " + ip);
});

var queryParams;
function handleRestRequest(request, response) {
    queryParams = url.parse(request.url, true).query;
    console.log("Serving request from " + request.connection.remoteAddress
            + " (type '" + queryParams.t + "')");
     switch(queryParams.t) {
        case 'm':
            handleMandelbrotRequest(request, response);
            break;
        default:
            handleResourceRequest(request, response);
    }
}

function handleResourceRequest(request, response) {
    var parsed = url.parse(request.url, true);
    var resPath = destPath + parsed.pathname + ".png";

    try {
        fs.statSync(resPath);
    } catch (e) {
        response.writeHead(404, { "Content-Type" : "text/plain" });
        response.end("404: Cannot stat resource at '" + resPath + "'");
        return;
    }

    try {
        fs.accessSync(resPath, fs.constants.R_OK);
    } catch (e) {
        response.writeHead(500, { "Content-Type" : "text/plain" });
        response.end("500: Internal server error; resource inaccessible on system");
        return;
    }

    var buf;
    try {
        buf = fs.readFileSync(resPath)
    } catch(e) {
        response.writeHead(500, { "Content-Type" : "text/plain" });
        response.end("500: Internal server error; failed to read image at '" + resPath + "'");
    }
    response.writeHead(200, { "Content-Type" : "image/png" });
    response.end(buf);
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
        id              : Math.floor(new Date() / 1000) + ':' + 
                            Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)
    }

    mandelbrot.perform_request(req, function onRequestPerformed(err, outFilePath) {
        if(err) {
            response.writeHead(500, { "Content-Type" : "text/plain" });
            response.end("500: Internal server error; " + err);
        } else /*if (req.finished)*/ {
            //TODO: Redirect to a temporary resource matching the ID of the request
            response.writeHead(301, {
                "Location" : "http://" + pubAddr 
                    + ':' + PORT + '/' + req.id + ".png",
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
