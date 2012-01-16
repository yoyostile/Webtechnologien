/*
 * Deklarierung diverser globaler Variablen
 */
var video;
var canvas;
var context;
var type = 'original';
var slider = 0;
var saturation = 100;

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

// Tonwertkorrektur
var high = 255;
var low = 0;


/*
 * Methode initialisiert die diversen Kernel, wenn nötig wird der Kernel normalisiert.
 * ... eigentlich schwachsinn, das so zu machen.
 */
function initKernel() {
    laplaceKernel = [
            [0, 1, 0],
            [1, -4, 1],
            [0, 1, 0]
            ];
    laplaceKernel = normalizeKernel2D(laplaceKernel);

    laplaceKernelDiagonal = [
            [1, 1, 1],
            [1, -8, 1],
            [1, 1, 1]
            ];
    laplaceKernelDiagonal = normalizeKernel2D(laplaceKernelDiagonal);

    laplace5x5 = [
            [-1,-3,-4,-3,-1],
            [-3,0,6,0,-3],
            [-4,6,20,6,-4],
            [-3,0,6,0,-3],
            [-1,-3,-4,-3,-1]
            ];
    laplace5x5 = normalizeKernel2D(laplace5x5);

    gaussianKernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
            ];
    gaussianKernel = normalizeKernel2D(gaussianKernel);

    prewittX = [
            [-1, 0, 1],
            [-1, 0, 1],
            [-1, 0, 1]
            ];
    prewittX = normalizeKernel2D(prewittX);

    prewittY = [
            [-1,-1,-1],
            [0,0,0],
            [1,1,1]
            ];
    prewittY = normalizeKernel2D(prewittY);

    sharpenKernel = [
            [0, -2, 0],
            [-2, 15, -2],
            [0, -2, 0]
            ];
    sharpenKernel = normalizeKernel2D(sharpenKernel);

    reliefKernel = [
            [-2, -1, 0],
            [-1, 1, 1],
            [0, 1, 2]
            ];
    reliefKernel = normalizeKernel2D(reliefKernel);

    gaussiangross = [
            [1,4,7,4,1],
            [4,16,26,16,4],
            [7,26,41,26,6],
            [4,16,26,16,4],
            [1,4,7,4,1]
            ];
    gaussiangross = normalizeKernel2D(gaussiangross);

    highpass = [
            [-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1],
            [-1,-1,24,-1,-1],
            [-1,-1,-1,-1,-1],
            [-1,-1,-1,-1,-1]
            ];
    highpass = normalizeKernel2D(highpass);

    sobelcross = [
            [-1,-2,0,2,1],
            [-2,-4,0,4,0],
            [0,0,0,0,0],
            [2,4,0,-4,-2],
            [1,2,0,-2,1]
            ];
    sobelcross = normalizeKernel2D(sobelcross);

    sobelvert = [
            [1,0,-2,0,1],
            [4,0,-8,0,4],
            [6,0,-12,0,6],
            [4,0,-8,0,4],
            [1,0,-2,0,1]
            ];
    sobelvert = normalizeKernel2D(sobelvert);

    sobelhor = [
            [1,4,6,4,1],
            [0,0,0,0,0],
            [-2,-8,-12,-8,-2],
            [0,0,0,0,0],
            [1,4,6,4,1]
            ];
    sobelhor = normalizeKernel2D(sobelhor);

    gaussX = [1, 2, 1];
    gaussX = normalizeKernel1D(gaussX);
    gaussY = [1, 2, 1];
    gaussY = normalizeKernel1D(gaussY);
    sobelX = [1, 0, -1];
    sobelX = normalizeKernel1D(sobelX);
    sobelY = [1, 2, 1];
    sobelY = normalizeKernel1D(sobelY);
    boxX = [1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121];
    boxX = normalizeKernel1D(boxX);
    boxY = [1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121,1/121];
    boxY = normalizeKernel1D(boxY);
}

/*
 * Aktualisiert den Sharpen-Kernel, der über einen Slider reguliert werden kann.
 */
function changeKernel() {
    varSharpenKernel = [
            [0, -slider/20, 0],
            [-slider/20, 4*(slider/15)+1, -slider/20],
            [0, -slider/20, 0]
            ];
    varSharpenKernel = normalizeKernel2D(varSharpenKernel);
}

/*
 * Instanzvariablen, die für den FPS-Counter notwendig sind
 */
var drawInterval = 1;
var frameCount = 0;
var fps = 0;
var maxfps = 1 / (drawInterval / 1000);
var lastTime = new Date();

/*
 * Initialisiert die Anwendung. Slider werden erstellt und falls notwendig versteckt.
 * Kernel werden initialisiert.
 * Video- und Canvas-Elemente werden aus der HTML gefetched, ein EventListener wird auf den
 * Video-Spieler gelegt, sodass die draw()-Methode ausschließlich ausgeführt wird, wenn das Video läuft.
 */
function init() {
    $("#slider").slider({
        max: 100,
        min: 0,
        slide: function(event, ui) {
            slider = ui.value;
            changeKernel();
        }
    });
    $("#slider").hide();
    $("#saturation").slider({
        max: 100,
        min: 0,
        value: 100,
        slide: function(event, ui) {
            saturation = ui.value;
        }
    });
    $("#contrast").slider({
        range: true,
        max: 255,
        min: 0,
        values: [0, 255],
        slide: function(event, ui) {
            low = ui.values[0];
            high = ui.values[1];
        }
    });
    initKernel();
    changeKernel();

    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    video.addEventListener('play', function() {
        canvas.height = video.clientHeight;
        canvas.width = video.clientWidth;
        draw();
    }, false);
}

/*
 * Returned wenn das Video pausiert / beendet ist.
 * FPS-Berechnungen und Ausgabe.
 * processImage() prozessiert das aktuelle Bild.
 */
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

/*
 * Nicht schön, funktioniert aber.
 * Startet den zugehörigen Effekt, abhängig von der Auswahl im Dropdown-Menü.
 * Iteration bspw. bei Gaussian Blur.
 */
function processImage() {
    if(saturation < 100) sw();
    if(low > 0 || high < 255)
        contrast();
    if(type == 'original')
        return;
    else if(type == 'box')
        convolve(boxKernel);
    else if(type == 'invert')
        invert();
    else if(type == 'sobel')
        convolve(sobelKernel);
    else if(type == 'laplace')
        convolve(laplaceKernel);
    else if(type == 'laplacedia')
        convolve(laplaceKernelDiagonal);
    else if(type == 'laplace5x5')
        convolveVariable((laplace5x5));
    else if(type == 'gaussian') {
        $("#slider").show();
        for(var i = 0; i <= slider; i++) {
            convolve((gaussianKernel));
        }
    } else if(type == 'prewittX') {
        convolve((prewittX));
    } else if(type == 'prewittY') {
        convolve((prewittY));
    } else if(type == 'sharpen')
        convolve((sharpenKernel));
    else if(type == 'relief') {
        convolve((reliefKernel));
    } else if(type == 'gausssep')
        convolveSeperable((gaussX), (gaussY));
    else if(type == 'sobelsep')
        convolveSeperable((sobelX), (sobelY));
    else if(type == 'boxsep')
        convolveSeperable((boxX), (boxY));
    else if(type == 'varsharpen') {
        $("#slider").show();
        convolve((varSharpenKernel));
    } else if(type == 'mosaic') {
        $("#slider").show();
        mosaic();
    } else if(type == 'gauss5x5') {
        convolveVariable((gaussiangross));
    } else if(type == 'highpass') {
        convolveVariable((highpass));
    } else if(type == 'sobelcross') {
        convolveVariable((sobelcross));
    } else if(type == 'sobelvert') {
        convolveVariable((sobelvert));
    } else if(type == 'sobelhor') {
        convolveVariable((sobelhor));
    }
}

/*
 * Setzt Type aus Dropdown. Slider wird versteckt.
 */
function setType(type) {
    this.type = type;
    $("#slider").hide();
}

/*
 * Normalisiert eindimensionale Kernel. Ist eigentlich quatsch,
 * da der Vorfaktor nicht für die Zusammengesetzte Matrix Hx * Hy stimmt.
 */
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

/*
 * Normalisiert zweidimensionale Kernel, falls nötig.
 */
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


/*
 * Effekt baut ein wunderbares Mosaik.
 * Kann über Slider in der größe der Rechtecke variiert werden.
 */
function mosaic() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    var output = context.createImageData(canvas.width, canvas.height);
    var inputData = pixels.data;
    var outputData = output.data;
    var w = pixels.width;
    var h = pixels.height;

    var k = Math.floor(slider/2);
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

/*
 * Lineare Faltung für beliebig große Filterkerne.
 * Optimierungsbedarf: Performance.
 */
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

/*
 * Leicht optimierte Variante der linearen Faltung ausschließlich für 3x3-Filterkerne.
 */
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

/*
 * Lineare Faltung für separierbare Filter.
 * Superlangsam durch zahlreiche Schleifen! Besserer Algorithmus nötig.
 */
function convolveSeperable(kernelX, kernelY) {
    if(kernelX == null || kernelY == null) return;
    pixels = context.getImageData(0,0,canvas.width,canvas.height);
    var output = context.createImageData(canvas.width, canvas.height);
    var inputData = pixels.data;
    var outputData = output.data;
    var w = pixels.width;
    var h = pixels.height;

    var lengthX = Math.floor(kernelX.length/2);
    var lengthY = Math.floor(kernelY.length/2);

    for(var y = lengthY; y < h-lengthY; y++) {
        for(var x = lengthX; x < w-lengthX; x++) {
            for(var c = 0; c < 3; c++) {
                var i = (y*w + x) * 4 + c;

                var sum = 0;
                for(var a = -lengthX; a <= lengthX; a++)
                    sum += kernelX[a+lengthX] * inputData[i + a*4];
                outputData[i] = sum;

                /* outputData[i] = kernelX[0] * inputData[i - 4]
                            + kernelX[1] * inputData[i]
                            + kernelX[2] * inputData[i + 4]; */
            }
        }
    }

    for(var y = 1; y < h-1; y++) {
        for(var x = 1; x < w-1; x++) {
            for(var c = 0; c < 3; c++) {
                var i = (y*w + x) * 4 + c;

                var sum = 0;
                for(var a = -lengthY; a <= lengthY; a++)
                    sum += kernelY[a+lengthY] * outputData[i + a*w*4];
                outputData[i] = sum;

                /* outputData[i] = kernelY[0] * outputData[i - w*4]
                            + kernelY[1] * outputData[i]
                            + kernelY[2] * outputData[i + w*4]; */
            }
            outputData[(y*w + x) * 4 + 3] = 255;
        }
    }

    context.putImageData(output,0,0);
}

/*
 * Invertiert das aktuelle Bild und gibt es zurück.
 */
function invert() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    data = pixels.data;
    for(var i = 0; i < data.length; i+=4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2 ]= 255 - data[i + 2];
    }
    context.putImageData(pixels,0,0);
}

/*
 * Entsättigt das Bild in Abhängigkeit vom Slider.
 * Gewichtung der Grauwerte wird vernachlässigt.
 */
function sww() {
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
    context.putImageData(pixels, 0, 0);
}

/*
 * Entsättigt das Bild in Abhängig vom Slider.
 * Gewichtung der Grauwerte stimmt.
 */
function sw() {
    pixels = context.getImageData(0,0,canvas.width, canvas.height);
    data = pixels.data;
    var s = saturation/100;
    for(var i = 0; i < data.length; i+=4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];

        var y = 0.299 * r + 0.587 * g + 0.114 * b;

        data[i] = y + s * (r - y);
        data[i + 1] = y + s * (g - y);
        data[i + 2] = y + s * (b - y);
    }
    context.putImageData(pixels, 0, 0);
}

/*
 * Setzt alle Pixel, die unterhalb des Schwellenwerts low liegen auf 0,
 * und alle Pixel, die oberhalb des Schewellenwerts high liegen auf 255.
 */

function contrast() {
    pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    data = pixels.data;
    for(var i = 0; i < data.length; i++) {
        if((i+1) % 4 == 0) continue;
        if(data[i] < low) data[i] = 0;
        else if(data[i] > high) data[i] = 255;
    }
    context.putImageData(pixels, 0, 0);
}

/*
 * Methode gibt msg auf der Error-Konsole aus. Ersatz für das in Java beliebte System.out.print();
 */
function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    },0);
}