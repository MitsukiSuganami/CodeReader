$(function () {
    startScanner();
});

const startScanner = () => {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#photo-area'),
            constraints: {
                decodeBarCodeRate: 3,
                successTimeout: 500,
                codeRepetition: true,
                tryVertical: true,
                frameRate: 60,
                width: 640,
                height: 480,
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "codabar_reader"
            ]
        },

    }, function (err) {
        if (err) {
            console.log(err);
            return
        }

        console.log("Initialization finished. Ready to start");
        Quagga.start();

        // Set flag to is running
        _scannerIsRunning = true;
    });

    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {
                        x: 0,
                        y: 1
                    }, drawingCtx, {
                        color: "green",
                        lineWidth: 2
                    });
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {
                    x: 0,
                    y: 1
                }, drawingCtx, {
                    color: "#00F",
                    lineWidth: 2
                });
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {
                    x: 'x',
                    y: 'y'
                }, drawingCtx, {
                    color: 'red',
                    lineWidth: 3
                });
            }
        }
    });

    //barcode read call back
    Quagga.onDetected(function (result) {
        var slipCode = document.getElementById("scanResult").value;
        // console.log(result.codeResult.code);
        var splitBefore = result.codeResult.code;
        var scanOriginalCode = document.getElementById("scanOriginal");
        scanOriginalCode.innerHTML = splitBefore;
        var scanSplitAfter = document.getElementById("scanSplit12"); // ?????????????????????id?????????
        var scanResultCode = document.getElementById("scanResult");
        var codeLength = String(splitBefore).length;
        if (codeLength == 14) { // ???????????????????????????14?????????????????????????????????????????????????????????????????????
            var startCode = splitBefore.substr(0, 1); // 0???????????????1??????????????????????????????????????????????????????
            var endCode = splitBefore.substr(13, 1); // 13???????????????1??????????????????????????????????????????????????????
            if (startCode.toUpperCase() === "A".toUpperCase() && endCode.toUpperCase() === "A".toUpperCase()) {
                var splitAfter = splitBefore.substr(1, 12); // 1???????????????12???????????????????????????????????????
                scanSplitAfter.innerHTML = splitAfter; // ???????????? HTML ??????
                var splitAllay = []; // ???????????????????????? ????????????
                for (let i = 0; i < 3; i++) { // 3???????????????
                    splitAllay.push(splitAfter.substr(i * 4, 4)); //0,4,8???????????????4???????????????????????? ?????????????????????????????????
                }
                var scanSlipCode = splitAllay[0] + "-" + splitAllay[1] + "-" + splitAllay[2];
                scanResultCode.innerHTML = scanSlipCode; // ???????????????????????????

                if (slipCode != scanSlipCode) {
                    audioElement.currentTime = 0;
                    document.getElementById("audioElement").play();
                } else {
                    ;
                }

            } else {
                scanResultCode.innerHTML = "ERROR:Not slip number"; // ???????????????????????? ???????????????
            }
        } else {
            scanSplitAfter.innerHTML = "ERROR:Not 12 numbers"; // ??????????????????????????????
            scanResultCode.innerHTML = "ERROR:Not 12 numbers"; // ??????????????????????????????
        }
    });
}