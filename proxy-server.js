var http = require('http');
var https = require('https');
var net = require('net');
var url = require('url');
var port = parseInt(process.env.PORT, 10) || 3000
console.log("--port--"+port);
function request(cReq, cRes) {
    var murl = cReq.url;
    console.log("-request-url-" + murl);
    get(cRes,murl);

}

function get(cRes,murl){

    if(murl.startsWith("/http")){
        murl=murl.slice(1);
    }
    if(murl==null || murl=="undefined" || murl.startsWith("/")){
        cRes.statusCode = 200 ;
        cRes.end("hello world,murl:"+murl);
        return;
    }
// 发送 HTTP GET 请求
    var httpclient=null;
    if(murl.startsWith("https://")){
        httpclient=https;
    }else{
        httpclient=http;
    }
    const req = httpclient.get(murl, (res) => {
        handleResponse(cRes,res);
    });

    req.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
    });

    req.end();

}

function handleResponse(cRes,res) {
    const { statusCode } = res;

    if (statusCode === 301 || statusCode === 302) {
        const redirectUrl = res.headers['location'];
        get(cRes,redirectUrl);
        return;
    }
    cRes.writeHead(res.statusCode, res.headers);
    res.pipe(cRes);
}

function connect(cReq, cSock) {
    var murl = cReq.url;
    console.log("-connect-url-" + murl);
    if(murl==null || murl.startsWith("/")){
        cSock.statusCode = 404 ;
        cSock.end();
        return;
    }
    var u = url.parse('http://' + murl);

    var pSock = net.connect(u.port, u.hostname, function () {
        try {
            cSock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            pSock.pipe(cSock);
            pSock.on('error', function (e) {
                console.error("-connect-pSock.on-error--url:" + murl, e);
                cSock.end();
            });
        } catch (e) {
            console.error("-connect-write-error--url:" + murl, e);
            cSock.end();
        }

    }).on('error', function (e) {
        console.error("-connect-error--url:" + murl, e);
        cSock.end();
    });
    try {
        cSock.pipe(pSock);
        cSock.on('error', function (e) {
            console.error("-connect-cSock.on-error--url:" + murl, e);
            cSock.end();
        });
    } catch (e) {
        console.error("-connect-pipe error--url:" + murl, e);
        cSock.end();
    }

}


http.createServer().on('error', (err) => console.error("--server--error", err)).on('request', request).on('connect', connect).listen(port);
console.log("---server--port:" + port);
