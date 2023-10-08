import { NextRequest } from "next/server";


export function getIP(req: NextRequest) {
  let ip = req.headers.get("x-real-ip") || req.ip;
  const forwardedFor = req.headers.get("x-forwarded-for");
  console.log("x-real-ip:",req.headers.get("x-real-ip"));
  console.log("x-forwarded-for:",req.headers.get("x-forwarded-for"));
  console.log("req.ip:",req.ip);
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }
  if(ip){
     const ips=ip.split(":");
      ip=ips[ips.length-1];
      if(ip.length<7){
        ip="127.0.0.1";
      }
  }
  return ip;
}

export function ipToDecimal(ip:string) {
    let parts = ip.split(".");
    let decimal = 0;
    for (let i = 0; i < parts.length; i++) {
        decimal += parseInt(parts[i]) * Math.pow(256, 3 - i);
    }
    return decimal;
}

export function getDateTime() {
    const date = new Date();
    return  date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/[/]/g, '-');
}

