var jwt=require('./node_modules/jsonwebtoken');
var tok=jwt.sign({id:'t',perfil:'admin'},'italy_secret_2026',{expiresIn:'2h'});
console.log('TOKEN_JWT='+tok);
