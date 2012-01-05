var video;
var canvas;
var context;
var type = 'original';
var slider = 0;
var saturation = 0;

var boxKernel;
var sobelKernel;
var laplaceKernel;
var laplaceKernelDiagonal;
var gaussianKernel;
var prewittKernel;
var sharpenKernel;
var varSharpenKernel;
var reliefKernel;
var gaussX;
var gaussY;
var sobelX;
var sobelY;
var boxX;
var boxY;
var gaussiangross;

function initKernel() {
    boxKernel = [
            [1/9, 1/9, 1/9],
            [1/9, 1/9, 1/9],
            [1/9, 1/9, 1/9]
            ];
    laplaceKernel = [
            [0, 1, 0],
            [1, -4, 1],
            [0, 1, 0]
            ];
    laplaceKernelDiagonal = [
            [1, 1, 1],
            [1, -8, 1],
            [1, 1, 1]
            ];
    laplace5x5 = [
            [-1,-3,-4,-3,-1],
            [-3,0,6,0,-3],
            [-4,6,20,6,-4],
            [-3,0,6,0,-3],
            [-1,-3,-4,-3,-1]
            ];
    gaussianKernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
            ];
    prewittX = [
            [-1, 0, 1],
            [-1, 0, 1],
            [-1, 0, 1]
            ];
    prewittY = [
            [-1,-1,-1],
            [0,0,0],
            [1,1,1]
            ];
    sharpenKernel = [
            [0, -2, 0],
            [-2, 15, -2],
            [0, -2, 0]
            ];
    varSharpenKernel = [
            [0, -slider/20, 0],
            [-slider/20, 4*(slider/15)+1, -slider/20],
            [0, -slider/20, 0]
            ];
    reliefKernel = [
            [-2, -1, 0],
            [-1, 1, 1],
            [0, 1, 2]
            ];
    gaussiangross = [
            [1,4,7,4,1],
            [4,16,26,16,4],
            [7,26,41,26,6],
            [4,16,26,16,4],
            [1,4,7,4,1]
            ];
    highpass = [
            [-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1],
            [-1,-1,24,-1,-1],
            [-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1]
            ];
    sobelcross = [
            [-1,-2,0,2,1],
            [-2,-4,0,4,0],
            [0,0,0,0,0],
            [2,4,0,-4,-2],
            [1,2,0,-2,1]
            ];
    sobelvert = [
            [1,0,-2,0,1],
            [4,0,-8,0,4],
            [6,0,-12,0,6],
            [4,0,-8,0,4],
            [1,0,-2,0,1]
            ];
    sobelhor = [
            [1,4,6,4,1],
            [0,0,0,0,0],
            [-2,-8,-12,-8,-2],
            [0,0,0,0,0],
            [1,4,6,4,1]
            ];
    gaussX = [1, 2, 1];
    gaussY = [1, 2, 1];
    sobelX = [1, 0, -1];
    sobelY = [1, 2, 1];
    boxX = [1, 1, 1];
    boxY = [1, 1, 1];
}


var drawInterval = 1;
var frameCount = 0;
var fps = 0;
var maxfps = 1 / (drawInterval / 1000);
var lastTime = new Date();

function init() {
    $("#slider").slider({
        max: 100,
        min: 0,
        slide: function(event, ui) {
            slider = ui.value;
            initKernel();
        }
    });
    $("#slider").hide();
    $("#saturation").slider({
        max: 100,
        min: 0,
        slide: function(event, ui) {
            saturation = ui.value;
        }
    });
    initKernel();

    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    video.addEventListener('play', function() {
        canvas.height = video.clientHeight;
        canvas.width = video.clientWidth;
        draw();
    }, false);
}

function draw() {
    if(video.paused || video.ended) return false;
    context.drawImage(video,0,0);
    processImage();
    var nowTime = new Date();
    var diffTime = Math.ceil((nowTime.getTime() - lastTime.getTime()));
    if (diffTime >= 1000) {
        fps = frameCount;
        frameCount = 0.0;
        lastTime = nowTime;
    }

    context.fillStyle = '#000000';
    context.fillRect(0, context.width - 15, 0, 15);
    context.fillStyle = '#FFF';
    context.font = 'bold 14px helvetica';
    context.fillText('FPS: ' + fps + '/' + maxfps, 4, canvas.height - 4);
    context.restore();
    frameCount++;
    setTimeout(draw,drawInterval);
}

function processImage() {
    sw();
    if(type == 'original')
        return;
    else if(type == 'box')
        convolve(boxKernel);
    else if(type == 'invert')
        invert();
    else if(type == 'sobel')
        convolve((sobelKernel));
    else if(type == 'laplace')
        convolve(normalizeKernel2D(laplaceKernel));
    else if(type == 'laplacedia')
        convolve(normalizeKernel2D(laplaceKernelDiagonal));
    else if(type == 'laplace5x5')
        convolveVariable(normalizeKernel2D(laplace5x5));
    else if(type == 'gaussian') {
        $("#slider").show();
        for(var i = 0; i <= slider; i++) {
            convolve(normalizeKernel2D(gaussianKernel));
        }
    } else if(type == 'prewittX') {
        convolve(normalizeKernel2D(prewittX));
    } else if(type == 'prewittY') {
        convolve(normalizeKernel2D(prewittY));
    } else if(type == 'sharpen')
        convolve(normalizeKernel2D(sharpenKernel));
    else if(type == 'relief') {
        convolve(normalizeKernel2D(reliefKernel));
    } else if(type == 'gausssep')
        convolveSeperable(normalizeKernel1D(gaussX), normalizeKernel1D(gaussY));
    else if(type == 'sobelsep')
        convolveSeperable(normalizeKernel1D(sobelX), normalizeKernel1D(sobelY));
    else if(type == 'boxsep')
        convolveSeperable(normalizeKernel1D(boxX), normalizeKernel1D(boxY));
    else if(type == 'varsharpen') {
        $("#slider").show();
        convolve(normalizeKernel2D(varSharpenKernel));
    } else if(type == 'mosaic') {
        $("#slider").show();
        mosaic();
    } else if(type == 'gauss5x5') {
        convolveVariable(normalizeKernel2D(gaussiangross));
    } else if(type == 'highpass') {
        convolveVariable(normalizeKernel2D(highpass));
    } else if(type == 'sobelcross') {
        convolveVariable(normalizeKernel2D(sobelcross));
    } else if(type == 'sobelvert') {
        convolveVariable(normalizeKernel2D(sobelvert));
    } else if(type == 'sobelhor') {
        convolveVariable(normalizeKernel2D(sobelhor));
    }
}

function setType(type) {
    this.type = type;
    $("#slider").hide();
}

function normalizeKernel1D(kernel) {
    var sum = 0;
    for(var i = 0; i < kernel.length; i++)
        sum += kernel[i];
    if(sum == 1 || sum == 0) return kernel;

    var pre = 1/sum;
    for(var i = 0; i < kernel.length; i++)
        kernel[i] *= pre;

    return kernel;
}

function normalizeKernel2D(kernel) {
    var sum = 0;
    for(var i = 0; i < kernel.length; i++) {
        for(var j = 0; j < kernel.length; j++) {
            sum += kernel[i][j];
        }
    }
    if(sum == 1 || sum == 0) return kernel;

    var pre = 1/sum;

    for(var i =0; i < kernel.length; i++) {
        for(var j = 0; j < kernel.length; j++) {
            kernel[i][j] *= pre;
        }
    }
    return kernel;
}

function mosaic() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    var output = context.createImageData(canvas.width, canvas.height);
    var inputData = pixels.data;
    var outputData = output.data;
    var w = pixels.width;
    var h = pixels.height;

    var k = Math.floor(slider/3);
    if(k <= 2) return;
    if(k % 2 == 0) k++;
    var length = Math.floor(k/2);

    for(var i = 1; i <= outputData.length; i++)
        if(i % 4 == 0) outputData[i-1] = 255;

    for (var y = length; y < h-length; y += length) {
        for (var x = length; x < w-length; x += length) {
            for(var c = 0; c < 3; c++) {

                var i = (y*w + x) * 4 + c;
                var sum = 0;
                for(var a = -length; a <= length; a++) {
                    for(var b = -length; b <= length; b++) {
                        sum += inputData[i + b*w*4 + a*4];
                    }
                }
                sum /= (k*k);

                for(var a = -length; a <= length; a++) {
                    for(var b = -length; b <= length; b++) {
                        outputData[i + b*w*4 + a*4] = sum;
                    }
                }
            }
        }
    }
    context.putImageData(output,0,0);
}

function convolveVariable(kernel) {
    if(kernel == null) return;
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    var output = context.createImageData(canvas.width, canvas.height);
    var inputData = pixels.data;
    var outputData = output.data;
    var w = pixels.width;
    var h = pixels.height;

    var length = Math.floor(Math.sqrt(kernel.length));

    for (var y = length; y < h-length; y++) {
        for (var x = length; x < w-length; x++) {
            for(var c = 0; c < 3; c++) {
                var i = (y*w + x) * 4 + c;

                var sum = 0;
                for(var a = -length; a <= length; a++) {
                    for(var b = -length; b <= length; b++) {
                        sum += kernel[a+length][b+length] * inputData[i + b*w*4 + a*4];
                    }
                }
                outputData[i] = sum;
            }
            outputData[(y*w + x) * 4 + 3] = 255;
        }
    }
    context.putImageData(output,0,0);
}

function convolve(kernel) {
    if(kernel == null) return;
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    var output = context.createImageData(canvas.width, canvas.height);
    var inputData = pixels.data;
    var outputData = output.data;
    var w = pixels.width;
    var h = pixels.height;

    for (var y = 1; y < h-1; y++) {
       for (var x = 1; x < w-1; x++) {
         for (var c = 0; c < 3; c++) {
           var i = (y*w + x)*4 + c;
           outputData[i] = kernel[0][0]*inputData[i - w*4 - 4] + kernel[0][1] *   inputData[i - w*4] + kernel[0][2] * inputData[i - w*4 + 4] +
                                 kernel[1][0] * inputData[i - 4]       + kernel[1][1] * inputData[i]       + kernel[1][2] * inputData[i + 4] +
                                 kernel[2][0] * inputData[i + w*4 - 4] + kernel[2][1] * inputData[i + w*4] + kernel[2][2] * inputData[i + w*4 + 4];
         }
         outputData[(y*w + x)*4 + 3] = 255; // alpha
       }
     }
     context.putImageData(output,0,0);
}

function convolveSeperable(kernelX, kernelY) {
    if(kernelX == null || kernelY == null) return;
    pixels = context.getImageData(0,0,canvas.width,canvas.height);
    var output = context.createImageData(canvas.width, canvas.height);
    var inputData = pixels.data;
    var outputData = output.data;
    var w = pixels.width;
    var h = pixels.height;

    for(var y = 1; y < h-1; y++) {
        for(var x = 1; x < w-1; x++) {
            for(var c = 0; c < 3; c++) {
                var i = (y*w + x) * 4 + c;
                outputData[i] = kernelX[0] * inputData[i - 4] + kernelX[1] * inputData[i] + kernelX[2] * inputData[i + 4];
            }
        }
    }

    for(var y = 1; y < h-1; y++) {
        for(var x = 1; x < w-1; x++) {
            for(var c = 0; c < 3; c++) {
                var i = (y*w + x) * 4 + c;
                outputData[i] = kernelY[0] * outputData[i - w*4] + kernelY[1] * outputData[i] + kernelY[2] * outputData[i + w*4];
            }
            outputData[(y*w + x) * 4 + 3] = 255;
        }
    }

    context.putImageData(output,0,0);
}

function invert() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    data = pixels.data;
    for(var i = 0; i < data.length; i+=4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2 ]= 255 - data[i + 2];
    }
    pixels.data = data;
    context.putImageData(pixels,0,0);
}

function sw() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    data = pixels.data;
    if(saturation == 0) return;
    for(var i = 0; i < data.length; i+=4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        var faktor =  100/saturation;
        if(g > r && g > b) {
            b += (g - b) / faktor;
            r += (g - r) / faktor;
        } else if(r > g && r > b) {
            g += (r - g) / faktor;
            b += (r - b) / faktor;
        } else {
            r += (b - r) / faktor;
            g += (b - g) / faktor;
        }
        data[i] = r;
        data[i+1] = g;
        data[i+2] = b;
    }
    pixels.data = data;
    context.putImageData(pixels, 0, 0);
}

function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    },0);
}