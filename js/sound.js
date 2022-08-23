// ウインドウが読み込まれた時にする処理
$(window).on('load', function() {
    // オーディオファイルを読み込む | 「preloadAudio」を実行
    preloadAudio();
    // スキャナーを起動する | 「startScanner」を実行
    startScanner();
});

// オーディオファイルをあらかじめ読み込んでおくための処理
function preloadAudio () {
    document.getElementById("audioElement").load();
} 

// スキャナーを起動するための処理
const startScanner = () => {
    // スキャナー設定
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#photo-area'), // カメラ映像表示エリア
            constraints: {
                decodeBarCodeRate: 3,
                successTimeout: 500,
                codeRepetition: true,
                tryVertical: true,
                frameRate: 60, // 映像フレームレート
                width: 640, // 映像横幅サイズ
                height: 480, // 映像縦幅サイズ
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "codabar_reader" // リーダーモード（読み込むバーコード）設定〔CODABARモード〕
            ]
        },

        // エラー処理
    }, function (err) {
        if (err) {
            // console.log(err);
            document.getElementById("errorMassage"); // エラーメッセージ出力id設定
            scanOriginalCode.innerHTML = splitBefore; // エラーメッセージ出力
            return
        }

        // console.log("Initialization finished. Ready to start");

        // スキャンスタート
        Quagga.start();

        // Set flag to is running
        _scannerIsRunning = true;
    });

    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {

            // 認識したバーコードを枠で囲む設定
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

            // 読み取ったバーコードを枠で囲む設定
            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {
                    x: 0,
                    y: 1
                }, drawingCtx, {
                    color: "#00F",
                    lineWidth: 2
                });
            }

            // 読み取ったバーコードの位置に線を引く設定
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
        var scanOriginalCode = document.getElementById("scanOriginal"); // 「取得結果」〔A000000000000A〕出力id設定
        scanOriginalCode.innerHTML = splitBefore; // 「取得結果 A000000000000A」出力
        var scanSplitAfter = document.getElementById("scanSplit12"); // 「取得結果（C抜き）」〔000000000000形式〕出力id設定
        var scanResultCode = document.getElementById("scanResult"); // 「伝票番号」〔0000-0000-0000形式〕出力id設定
        var codeLength = String(splitBefore).length; // 取得結果の文字列の長さを出力

        // （条件分岐）読み取ったコードが14桁かどうか判定（スタート・ストップキャラクタを含む）
        if (codeLength == 14) {
            // （分岐）14文字の場合
            var startCode = splitBefore.substr(0, 1); // 0文字目から1文字分切り出す（スタートキャラクタ）
            var endCode = splitBefore.substr(13, 1); // 13文字目から1文字分切り出す（ストップキャラクタ）

            // （条件分岐）読み取ったコードのスタート・ストップキャラクタが「A」または「a」であるか判定
            if (startCode.toUpperCase() === "A".toUpperCase() && endCode.toUpperCase() === "A".toUpperCase()) {
                // （分岐）スタート・ストップキャラクタが「A」または「a」であった場合
                var splitAfter = splitBefore.substr(1, 12); // 1文字目から12文字分切り出す（数字部分）
                scanSplitAfter.innerHTML = splitAfter; // 数字部分 HTML 出力
                var splitAllay = []; // 伝票番号格納配列 配列宣言

                // 数字を4つずつに切り分けるために3回繰り返し
                for (let i = 0; i < 3; i++) {
                    // 伝票番号形式〔0000-0000-0000〕にフォーマット
                    splitAllay.push(splitAfter.substr(i * 4, 4)); //0,4,8文字目から4文字ずつ切り出し その後配列へ順番に格納
                }
                var slipCode = document.getElementById("scanResult").textContent; // 更新前の伝票番号をHTMLより取得
                var scanSlipCode = splitAllay[0] + "-" + splitAllay[1] + "-" + splitAllay[2];
                scanResultCode.innerHTML = scanSlipCode; // 伝票番号形式に出力

                var displaySlipCode = document.getElementById("displaySlipCode");
                displaySlipCode.innerHTML = slipCode;
                var displayScanSlipCode = document.getElementById("displayScanSlipCode");
                displayScanSlipCode.innerHTML = scanSlipCode;

                // （条件分岐）前回読み取った伝票番号と今回読み込んだ伝票番号が同じかどうか
                if (slipCode == scanSlipCode) {
                    // （分岐）同じだった場合
                    notSuccessProgram();
                } else {
                    // （分岐）同じではなかった場合
                    successProgram();
                }

            } else {
                // （分岐）スタート・ストップキャラクタが「A」または「a」でなかった場合（B,b,C,c,D,dなどの場合）
                scanResultCode.innerHTML = "ERROR:Not slip number"; // 伝票番号ではない エラー出力
            }

        } else {
            // （分岐）14文字以外の場合（データ落ちなどがあった場合）
            scanSplitAfter.innerHTML = "ERROR:Not 12 numbers"; // 数字部分欄エラー出力
            scanResultCode.innerHTML = "ERROR:Not 12 numbers"; // 伝票番号欄エラー出力
        }
    });
}

// （条件分岐）前回読み取った伝票番号と今回読み込んだ伝票番号が同じだった場合の処理
function successProgram () {
    audioElement.currentTime = 0;
    document.getElementById("audioElement").play();
    var statusMessage = document.getElementById("statusMessage");
    statusMessage.innerHTML = "読み取り成功";

    $(document).ready(function(){
        setTimeout(function(){ statusMessage.innerHTML = "読取できます"; }, 3000);
    });
}

// （条件分岐）前回読み取った伝票番号と今回読み込んだ伝票番号が同じではなかった場合の処理
function notSuccessProgram () {
    var statusMessage = document.getElementById("statusMessage");
    statusMessage.innerHTML = "同一データです";

    $(document).ready(function(){
        setTimeout(function(){ statusMessage.innerHTML = "スリープ解除"; }, 3000);
    });
}