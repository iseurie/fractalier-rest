module.exports.init_sync = initModuleSync;
module.exports.perform_request = performRequest;
module.exports.set_plte_sync = setPaletteSync;
module.exports.set_dest_path_sync = setDestPathSync;

module.exports.path_dest = path_dest
const execFile = require('child_process').execFile;
const fs = require('fs');

var path_bin = "/usr/bin/fractalier-gen";
var path_dest = "/etc/fractalier/out";
var path_plte = "/etc/fractalier/map/blues.map";
var initialized = false;

function initModuleSync(binPath) {
    fs.accessSync(binPath, fs.constants.X_OK);
    path_bin = binPath;
}

function setPaletteSync(palettePath) {
    fs.accessSync(palettePath, fs.constants.R_OK);
    path_plte = palettePath;
}

function setDestPathSync(destPath) {
    fs.accessSync(destPath, fs.constants.W_OK);
    var stat = fs.statSync(destPath);
    
    if(stat.isDirectory) {
        path_dest = destPath;
    } else {
        throw Error("Specified path is not a directory");
    }
}
        
function performRequest(req, callback) {
    req.finished = false;
    //Set undefined parameters to their default values
    if(typeof(req.depth) === "undefined")              req.depth = "255";
    if(typeof(req.width) === "undefined") req.width = "1024";
    if(typeof(req.height) === "undefined") req.height = "768";
    //canonical Mandelbrot properties
    if(typeof(req.anchor_real) === "undefined") req.anchor_real = "-2.2"; 
    if(typeof(req.anchor_imag) === "undefined") req.anchor_imag = "-1.7";
    if(typeof(req.extense_real) === "undefined") req.extense_real = "3.4"; 
    if(typeof(req.extense_imag) === "undefined") req.extense_imag = "2.9";

    if(typeof(req.mapFilePath) === "undefined") req.mapFilePath = path_plte;
    if(typeof(req.outFileName) === "undefined") req.outFileName = req.id + ".png";
    
    var outFilePath = path_dest + '/' + req.outFileName;
    execFile(path_bin, ["--anchor_real", req.anchor_real,
                        "--anchor_imag", req.anchor_imaginary,
                        "--extense_real", req.anchor_real,
                        "--extense_imag", req.anchor_imaginary,
                        "--depth", req.depth,
                        "--height", req.height,
                        "--width", req.width,
                        "--output", outFilePath],
            function(error, stdout, sterr) {
                if(!error) req.finished = true;
                if(typeof(callback) === "function") {
                    callback(error, req.outFileName);
                }
            });
    //TODO: implement uploads of generated files to resource hosts for archive in database by ID
}
