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
    if(!req.depth)              req.depth = "255";
    if(!req.width)              req.width = "1024";
    if(!req.height)             req.height = "768";
    //canonical Mandelbrot properties
    if(!req.anchor_real)        req.anchor_real = "-2.2"; 
    if(!req.anchor_imag)        req.anchor_imag = "-1.7";
    if(!req.extense_real)       req.extense_real = "3.4"; 
    if(!req.extense_imag)       req.extense_imag = "2.9";

    if(!req.mapFilePath)        req.mapFilePath = path_plte;
    if(!req.outFileName)        req.outFileName = req.id + ".png";
    
    var outFilePath = path_dest + '/' + req.outFileName;
    var err = execFile(path_bin, ["--anchor_real", req.anchor_real,
                        "--anchor_imag", req.anchor_imaginary,
                        "--extense_real", req.anchor_real,
                        "--extense_imag", req.anchor_imaginary,
                        "--depth", req.depth,
                        "--height", req.height,
                        "--width", req.width,
                        "--output", outFilePath]);
    //TODO: implement uploads of generated files to resource hosts for archive in database by ID
    if(!err) {
        req.finished = true;
    } else {
        req.finished = false;
        throw err;
    }
    if(typeof(callback) === "function") {
        callback(err, req.outFileName);
    } 
}
