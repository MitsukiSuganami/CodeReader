$(window).on('load', function() {
    startScanner();
});

// $(function () {
//     startScanner();
// });

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
        // var slipCode = document.getElementById("scanResult").value;
        // console.log(result.codeResult.code);
        var splitBefore = result.codeResult.code;
        var scanOriginalCode = document.getElementById("scanOriginal");
        scanOriginalCode.innerHTML = splitBefore;
        var scanSplitAfter = document.getElementById("scanSplit12"); // 数字部分出力（id設定）
        var scanResultCode = document.getElementById("scanResult");
        var codeLength = String(splitBefore).length;
        if (codeLength == 14) { // 読み取ったコードが14桁の場合（スタート・ストップキャラクタを含む）
            var startCode = splitBefore.substr(0, 1); // 0文字目から1文字分切り出す（スタートキャラクタ）
            var endCode = splitBefore.substr(13, 1); // 13文字目から1文字分切り出す（ストップキャラクタ）
            if (startCode.toUpperCase() === "A".toUpperCase() && endCode.toUpperCase() === "A".toUpperCase()) {
                var splitAfter = splitBefore.substr(1, 12); // 1文字目から12文字分切り出す（数字部分）
                scanSplitAfter.innerHTML = splitAfter; // 数字部分 HTML 出力
                var splitAllay = []; // 伝票番号格納配列 配列宣言
                for (let i = 0; i < 3; i++) { // 3回繰り返し
                    splitAllay.push(splitAfter.substr(i * 4, 4)); //0,4,8文字目から4文字ずつ切り出し その後配列へ順番に格納
                }
                var slipCode = document.getElementById("scanResult").textContent; // 更新前の伝票番号をHTMLより取得
                var scanSlipCode = splitAllay[0] + "-" + splitAllay[1] + "-" + splitAllay[2];
                scanResultCode.innerHTML = scanSlipCode; // 伝票番号形式に出力

                var displaySlipCode = document.getElementById("displaySlipCode");
                displaySlipCode.innerHTML = slipCode;
                var displayScanSlipCode = document.getElementById("displayScanSlipCode");
                displayScanSlipCode.innerHTML = scanSlipCode;

                if (slipCode == scanSlipCode) {
                    notSuccessProgram();
                } else {
                    successProgram();
                }

            } else {
                scanResultCode.innerHTML = "ERROR:Not slip number"; // 伝票番号ではない エラー出力
            }
        } else {
            scanSplitAfter.innerHTML = "ERROR:Not 12 numbers"; // 数字部分欄エラー出力
            scanResultCode.innerHTML = "ERROR:Not 12 numbers"; // 伝票番号欄エラー出力
        }
    });
}

function successProgram () {
    audioElement.currentTime = 0;
    document.getElementById("audioElement").play();
    var statusMessage = document.getElementById("statusMessage");
    statusMessage.innerHTML = "読み取り成功";

    // // ビジーwaitを使う方法
    // function sleep(waitMsec) {
    //     var startMsec = new Date();
   
    //     // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
    //     while (new Date() - startMsec < waitMsec);
    // }
   
    // sleep(3000);

    // setIntervalを使う方法
    function sleep(waitSec, callbackFunc) {
    
        // 経過時間（秒）
        var spanedSec = 0;
    
        // 1秒間隔で無名関数を実行
        var id = setInterval(function () {
    
            spanedSec++;
    
            // 経過時間 >= 待機時間の場合、待機終了。
            if (spanedSec >= waitSec) {
    
                // タイマー停止
                clearInterval(id);
    
                // 完了時、コールバック関数を実行
                if (callbackFunc) callbackFunc();
            }
        }, 1000);
    
    }
    
    sleep(3, function () {
        statusMessage.innerHTML = "読取できます";
        // console.log('5秒経過しました！');
    });

    // statusMessage.innerHTML = "読取できます";
}

function notSuccessProgram () {
    var statusMessage = document.getElementById("statusMessage");
    statusMessage.innerHTML = "同一データです";

    // ビジーwaitを使う方法
    function sleep(waitMsec) {
        var startMsec = new Date();
   
        // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
        while (new Date() - startMsec < waitMsec);
    }
   
    sleep(3000);

    statusMessage.innerHTML = "スリープ解除";
}