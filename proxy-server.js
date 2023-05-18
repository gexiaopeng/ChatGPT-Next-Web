var http = require('http');
var net = require('net');
var url = require('url');

function request(cReq, cRes) {
  var murl=cReq.url;
  console.log("-request-url-"+murl);
  var u = url.parse(murl);
  var options = {
    hostname : u.hostname,
    port     : u.port || 80,
    path     : u.path,
    method     : cReq.method,
    headers     : cReq.headers
  };

  var pReq = http.request(options, function(pRes) {
    try{
      cRes.writeHead(pRes.statusCode, pRes.headers);
      pRes.pipe(cRes);
    }catch (e){
      console.error("-request-write-error--url:"+murl,e);
    }
  }).on('error', function(e) {
    console.error("-request-on -error--url:"+murl,e);
    cRes.end();
  });
 try{
    cReq.pipe(pReq);
  }catch (e){
    console.error("-request-pipe error-url:"+murl,e);
  }
}

function connect(cReq, cSock) {
  var murl=cReq.url;
  console.log("-connect-url-"+murl);
  var u = url.parse('http://' + murl);

  var pSock = net.connect(u.port, u.hostname, function() {
    try{
      cSock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      pSock.pipe(cSock);
    }catch (e){
      console.error("-connect-write-error--url:"+murl,e);
    }

  }).on('error', function(e) {
    console.error("-connect-error--url:"+murl,e);
    cSock.end();
  });
  try{
    cSock.pipe(pSock);
  }catch (e){
    console.error("-connect-pipe error--url:"+murl,e);
  }

}
var port=3888;
http.createServer().on('error', (err) => console.error("--server--error",err)).on('request', request).on('connect', connect).listen(port);
console.log("---server--port:"+port);
