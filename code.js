var video;
var canvas;
var context;
var type = 'original';

var boxKernel = [
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9],
        [1/9, 1/9, 1/9]
        ];
var sobelKernel = [
        [-1, 0, 1],
        [-2, 1, 2],
        [-1, 1, 1]
        ];
var laplaceKernel = [
        [0, 1, 0],
        [1, -4, 1],
        [0, 1, 0]
        ];
var gaussianKernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1]
        ];
var prewittKernel = [
        [-1, 0, 1],
        [-1, 0, 1],
        [-1, 0, 1]
        ];

function init() {
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
    setTimeout(draw,20);
}

function processImage() {
    if(type == 'original')
        return;
    else if(type == 'sw')
        sw();
    else if(type == 'box')
        convolve(blurKernel);
    else if(type == 'invert')
        invert();
    else if(type == 'flip')
        flip();
    else if(type == 'sobel')
        convolve(sobelKernel);
    else if(type == 'laplace')
        convolve(laplaceKernel);
    else if(type == 'gaussian')
        convolve(gaussianKernel);
    else if(type == 'prewitt')
        convolve(prewittKernel);
}

function setType(type) {
    this.type = type;
}

function normalizeKernel(kernel) {
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

function convolve(kernel) {
    if(kernel == null) return;
    kernel = normalizeKernel(kernel);
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    var output = context.createImageData(canvas.width, canvas.height);
    var inputData = pixels.data;
    var outputData = output.data;
    var w = pixels.width;
    var h = pixels.height;

    for (var y = 1; y < h-1; y += 1) {
       for (var x = 1; x < w-1; x += 1) {
         for (var c = 0; c < 3; c += 1) {
           var i = (y*w + x)*4 + c;
           outputData[i] =  kernel[0][0]*inputData[i - w*4 - 4] + kernel[0][1] *   inputData[i - w*4] + kernel[0][2] * inputData[i - w*4 + 4] +
                                 kernel[1][0] * inputData[i - 4]       + kernel[1][1] * inputData[i]       + kernel[1][2] * inputData[i + 4] +
                                 kernel[2][0] * inputData[i + w*4 - 4] + kernel[2][1] * inputData[i + w*4] + kernel[2][2] * inputData[i + w*4 + 4];
         }
         outputData[(y*w + x)*4 + 3] = 255; // alpha
       }
     }
     context.putImageData(output,0,0);
}

function flip() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    data = pixels.data;
    context.putImageData(pixels,0,0);
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
    for(var i = 0; i < data.length; i+=4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        var brightness = (3*r + 4*g + b) >>> 3;
        data[i] = brightness;
        data[i+1] = brightness;
        data[i+2] = brightness;
    }
    pixels.data = data;
    context.putImageData(pixels, 0, 0);
}

function processImageWithKernel() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    data = pixels.data;
    var kernel = [
        [0, 1, 0],
        [1, 2, 1],
        [0, 1, 0]
        ];
    var weight = 0;
    for(var i = 0; i < 3; i++)
        for(var j = 0; j < 3; j++)
            weight += kernel[i][j];

    weight = 1 / (weight * 2);

    var w = canvas.width;
    var h = canvas.width;
    var w4 = w*4;
    var y = h;

    do {
        var offsetY = (y-1) * w4;

        var prevY = ( y == 1 ) ? 0 : y-2;
        var nextY = ( y == h ) ? y - 1 : y;

        var offsetYPrev = prevY*w*4;
        var offsetYNext = nextY*w*4;

        var x = w;

        do {
            var offset = offsetY + (x*4 - 4);
            var offsetPrev = offsetYPrev + (( x == 1 ) ? 0 : x-2) * 4;
            var offsetNext = offsetYNext + (( x == w) ? x-1 : x) * 4;

            data[offset] = (
                            (data[offsetPrev]
                            + data[offset-4]
                            + data[offset+4]
                            + data[offsetNext]) * 2
                            + data[offset] * 4
                            ) * weight;

            data[offset+1] = (
                        (data[offsetPrev+1]
                        + data[offset-3]
                        + data[offset+5]
                        + data[offsetNext+1])   * 2
                        + data[offset+1]        * 4
                        ) * weight;

                    data[offset+2] = (
                        (data[offsetPrev+2]
                        + data[offset-2]
                        + data[offset+6]
                        + data[offsetNext+2])   * 2
                        + data[offset+2]        * 4
                        ) * weight;

        } while ( --x );
    } while ( --y );

    pixels.data = data;
    context.putImageData(pixels, 0, 0);
}

