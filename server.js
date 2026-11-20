const http=require('http'),fs=require('fs'),path=require('path');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf'};
const root=path.resolve(process.argv[2]||__dirname),port=process.env.PORT||+process.argv[3]||5173;
const inside=file=>{
  const rel=path.relative(root,file);
  return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));
};
http.createServer((req,res)=>{
  let raw;
  try{raw=decodeURIComponent(req.url.split('?')[0])}catch(e){res.writeHead(400);return res.end('400')}
  if(raw.includes('\0')){res.writeHead(400);return res.end('400')}
  const isDir=raw.endsWith('/');
  const file=path.join(root,isDir?raw+'index.html':raw);
  if(!inside(file)){res.writeHead(403);return res.end('403')}
  fs.stat(file,(err,st)=>{
    if(err){res.writeHead(404);return res.end('404')}
    if(st.isDirectory()){
      if(!isDir){res.writeHead(301,{Location:raw+'/'});return res.end()}
      res.writeHead(404);return res.end('404');
    }
    if(!st.isFile()){res.writeHead(404);return res.end('404')}
    const type=types[path.extname(file).toLowerCase()]||'application/octet-stream';
    const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
    if(m&&(m[1]||m[2])){
      let start,end;
      if(m[1]){start=+m[1];end=m[2]?+m[2]:st.size-1}
      else{start=st.size-+m[2];end=st.size-1}
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=st.size){
        res.writeHead(416,{'Content-Range':`bytes */${st.size}`});return res.end()
      }
      end=Math.min(end,st.size-1);start=Math.max(start,0);
      res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${st.size}`,'Content-Length':end-start+1});
      const stream=fs.createReadStream(file,{start,end});
      stream.on('error',()=>res.destroy());
      res.on('close',()=>stream.destroy());
      return stream.pipe(res);
    }
    res.writeHead(200,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':st.size});
    const stream=fs.createReadStream(file);
    stream.on('error',()=>res.destroy());
    res.on('close',()=>stream.destroy());
    stream.pipe(res);
  });
}).listen(port,()=>console.log('http://localhost:'+port));
