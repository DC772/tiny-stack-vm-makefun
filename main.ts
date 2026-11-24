import{mkdirSync as M,readdirSync as R,readFileSync as F,writeFileSync as W}from"node:fs";
const T="0Aq46:;?!!!!!!!!999999959995999!999!!!!!!!!!!!!!PTTP0!!!!!!!!!!!58!!!!!!!!!!!!!!4414";
const H=[(a,b)=>a+b,(a,b)=>a-b,Math.imul,(a,b)=>a/b,(a,b)=>a%b,(a,b)=>(a>>>0)/(b>>>0),(a,b)=>(a>>>0)%(b>>>0),0,(a,b)=>a&b,(a,b)=>a|b,(a,b)=>a^b,0,(a,b)=>a<<b,(a,b)=>a>>b,(a,b)=>a>>>b,0,(a,b)=>+(a==b),(a,b)=>+(a<b),(a,b)=>+((a>>>0)<(b>>>0))];
function run(p,q){
const D=new Int32Array(256);let s=0;const C=new Int32Array(64);let t=0;const G=new Int32Array(256);
const o=new Uint8Array(65536);let l=0,i=0,c=0,n=0;
const d=k=>({out:o.slice(0,l),code:k});
for(;;){
if(n==1e6)return d(10);
if(c<0||c>=p.length)return d(9);
let op=p[c],v=T.charCodeAt(op)-48;
if(!(v>=0)||v>65)return d(5);
let m=(v/16)|0,po=((v%16)/4)|0,pu=v%4;
if(c+m>=p.length)return d(9);
n++;
let x=c+1+m;
if(s<po)return d(2);
if(s-po+pu>256)return d(3);
c=x;
if(op<8){
if(op==0)return d(0);
if(op==1)D[s++]=(p[x-1]<<24)>>24;
else if(op==2)D[s++]=p[x-4]|p[x-3]<<8|p[x-2]<<16|p[x-1]<<24;
else if(op==3)s--;
else if(op==4){D[s]=D[s-1];s++}
else if(op==5){let a=D[s-1];D[s-1]=D[s-2];D[s-2]=a}
else if(op==6){D[s]=D[s-2];s++}
else{let a=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=a}
}else if(op<0x23){
if(op==0x17)D[s-1]=-D[s-1];
else if(op==0x1b)D[s-1]=~D[s-1];
else{let b=D[s-1],a=D[s-2];if(op>0x12&&op<0x17&&!b)return d(4);s-=2;D[s++]=H[op-16](a,b)}
}else if(op<0x35){
if(op==0x34){if(!t)return d(8);c=C[--t]}
else if(op==0x33){if(t==64)return d(7);C[t++]=x;c=p[x-2]|p[x-1]<<8}
else{let g=((p[x-2]|p[x-1]<<8)<<16)>>16;if(op==0x30||(op==0x31?D[--s]==0:D[--s]!=0))c=x+g}
}else if(op<0x42){
let a=D[s-1];
if(a<0||a>255)return d(6);
if(op==0x40)D[s-1]=G[a];else{s-=2;G[a]=D[s]}
}else{
if(op==0x50){let g=String(D[--s]);if(l+g.length>65536)return d(11);for(let j=0;j<g.length;)o[l++]=g.charCodeAt(j++)}
else if(op==0x51){if(l+1>65536)return d(11);o[l++]=D[--s]&255}
else if(op==0x52)D[s++]=i<q.length?q[i++]:-1;
else return d(D[--s]&255);
}
}
}
const I=process.env.MAKEFUN_INPUT_DIR??"/input",O=process.env.MAKEFUN_OUTPUT_DIR??"/output";
for(const f of R(I).sort()){const z=run(F(I+"/"+f+"/program.bin"),F(I+"/"+f+"/input.bin"));M(O+"/"+f,{recursive:true});W(O+"/"+f+"/stdout.bin",z.out);W(O+"/"+f+"/exit.txt",z.code+"\n")}
