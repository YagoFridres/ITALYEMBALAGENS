// imprime resultado em stderr e stdout para capturar no terminal
var https=require('https');
var jwt=require('./node_modules/jsonwebtoken');
var tok=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
var hdr={
  host:'adm.italyembalagens.com.br',
  path:'/api/_oneshot_fix_cores_sem_impressao',
  method:'GET',
  headers:{
    'Accept':'application/json',
    'Authorization':'Bearer '+tok
  },
  timeout:90000
};
var req=https.request(hdr,function(res){
  var b='';
  res.on('data',function(d){b+=d;});
  res.on('end',function(){
    var head='HTTP '+res.statusCode+'\n';
    process.stdout.write(head);
    process.stderr.write(head);
    try{
      var j=JSON.parse(b);
      var s=JSON.stringify(j,null,2);
      process.stdout.write(s+'\n');
      process.stderr.write(s+'\n');
    }catch(e){
      process.stdout.write('PARSE_ERR '+e.message+'\nRAW1000='+b.slice(0,1000)+'\n');
      process.stderr.write('PARSE_ERR '+e.message+'\nRAW1000='+b.slice(0,1000)+'\n');
    }
    process.exit(res.statusCode===200?0:1);
  });
});
req.on('error',function(e){
  process.stdout.write('NET_ERR '+e.message+'\n');
  process.stderr.write('NET_ERR '+e.message+'\n');
  process.exit(2);
});
req.on('timeout',function(){req.destroy(new Error('timeout'));});
req.end();
