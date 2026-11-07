const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf'};
const root=path.resolve(process.argv[2]||__dirname),port=process.env.PORT||+process.argv[3]||5173;
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
  const f=path.join(root,p);if(!f.startsWith(root))return res.end();
  fs.stat(f,(e,st)=>{
    if(e||!st.isFile()){res.writeHead(404);return res.end('404')}
    const type=types[path.extname(f).toLowerCase()]||'application/octet-stream';
    const m=/bytes=(\d*)-(\d*)/.exec(req.headers.range||'');
    if(m){
      const start=m[1]?+m[1]:st.size-+m[2],end=m[1]&&m[2]?+m[2]:st.size-1;
      res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${st.size}`,'Content-Length':end-start+1});
      return fs.createReadStream(f,{start,end}).pipe(res);
    }
    res.writeHead(200,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':st.size});
    fs.createReadStream(f).pipe(res);
  });
}).listen(port,()=>console.log('http://localhost:'+port));
