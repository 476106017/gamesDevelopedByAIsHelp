import{_ as Z,r as I,o as D,i as J,c as K,h as T,f as h,t as U}from"./index-PYIe12fk.js";const j={class:"tetris-container"},c=10,p=20,s=20,H={__name:"Game",setup(N){const k=I(null),d=I(0);let f,a=[],r,O=500,l;const E={I:[[1,1,1,1]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1]],L:[[1,0,0],[1,1,1]],J:[[0,0,1],[1,1,1]],S:[[0,1,1],[1,1,0]],Z:[[1,1,0],[0,1,1]]},b={I:"#00bcd4",O:"#ffc107",T:"#9c27b0",L:"#ff9800",J:"#3f51b5",S:"#4caf50",Z:"#f44336"};function g(){return Array.from({length:p},()=>Array(c).fill(""))}function x(e,t,n){f.fillStyle=n,f.fillRect(e*s,t*s,s-1,s-1)}function i(){f.clearRect(0,0,c*s,p*s),a.forEach((e,t)=>{e.forEach((n,o)=>{n&&x(o,t,b[n])})}),B()}function B(){r.shape.forEach((e,t)=>{e.forEach((n,o)=>{n&&x(r.x+o,r.y+t,b[r.type])})})}function L(){const e=Object.keys(E),t=e[Math.floor(Math.random()*e.length)],n=E[t];r={x:Math.floor((c-n[0].length)/2),y:0,shape:n,type:t},y(r,0,0)&&(alert("ゲームオーバー！"),a=g(),d.value=0)}function y(e,t,n){return e.shape.some((o,v)=>o.some((w,G)=>{if(w){const _=e.x+G+t,u=e.y+v+n;return _<0||_>=c||u>=p||u>=0&&a[u]&&a[u][_]}return!1}))}function R(){r.shape.forEach((e,t)=>{e.forEach((n,o)=>{n&&(a[r.y+t][r.x+o]=r.type)})})}function C(){let e=0;for(a=a.filter(t=>t.every(n=>n)?(e++,!1):!0);a.length<p;)a.unshift(Array(c).fill(""));d.value+=e*100}function m(e,t){return y(r,e,t)?!1:(r.x+=e,r.y+=t,i(),!0)}function S(){m(0,1)||(R(),C(),L())}function P(){const e=r.shape,t=e[0].map((o,v)=>e.map(w=>w[v]).reverse()),n={...r,shape:t};y(n,0,0)||(r.shape=t,i())}function M(){a=g(),L(),i(),l&&clearInterval(l),l=setInterval(()=>{S(),i()},O)}function A(e){switch(e.key){case"ArrowLeft":m(-1,0);break;case"ArrowRight":m(1,0);break;case"ArrowDown":S();break;case"ArrowUp":P();break}}return D(()=>{f=k.value.getContext("2d"),window.addEventListener("keydown",A)}),J(()=>{clearInterval(l),window.removeEventListener("keydown",A)}),(e,t)=>(T(),K("div",j,[t[0]||(t[0]=h("h2",null,"テトリス",-1)),h("canvas",{ref_key:"canvasRef",ref:k,width:"200",height:"400",class:"tetris-canvas"},null,512),h("p",null,"スコア："+U(d.value),1),h("button",{onClick:M},"開始")]))}},W=Z(H,[["__scopeId","data-v-90068974"]]);export{W as default};
