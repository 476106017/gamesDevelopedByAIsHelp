import{_ as C,r as v,o as G,i as z,c as U,h as F,f as k,t as H,n as K}from"./index-D2_iUkOV.js";const N={class:"game-container"},o=20,V={__name:"Game",setup(W){const p=v(null),b=v(0);let l,f=null,m=null;const s=v([{x:5,y:5}]),n=v({x:1,y:0});let u={x:10,y:10},a=null,y=0,h=v(!1),c=null,i=0;const d=v(!1);let x=150;function I(){if(l.clearRect(0,0,400,400),c==="ghost"&&T(),l.fillStyle=E(),s.value.forEach(e=>{l.fillRect(e.x*o,e.y*o,o-2,o-2)}),l.fillStyle="#f44336",l.fillRect(u.x*o,u.y*o,o-2,o-2),a){const e=Date.now(),t=Math.floor(e/300)%2===0;l.fillStyle=t?R(a.type):"#ddd",l.fillRect(a.x*o,a.y*o,o-2,o-2)}}function T(){const e=Math.floor(Date.now()/200)%2===0;l.strokeStyle=e?"#ab47bc":"#ce93d8",l.lineWidth=4,l.setLineDash([6,6]),l.strokeRect(0,0,400,400),l.setLineDash([])}function E(){if(!c)return"#4caf50";if(i-Date.now()<1e3&&Math.floor(Date.now()/150)%2===0)return"#ffffff";switch(c){case"slow":return"#a1887f";case"fast":return"#00acc1";case"ghost":return"#ab47bc";case"bonus":return"#ffa000";default:return"#4caf50"}}function g(){const e={x:s.value[0].x+n.value.x,y:s.value[0].y+n.value.y};if(h.value)e.x=(e.x+20)%20,e.y=(e.y+20)%20;else if(e.x<0||e.y<0||e.x>=20||e.y>=20||s.value.some(t=>t.x===e.x&&t.y===e.y)){alert("ゲームオーバー！"),s.value=[{x:5,y:5}],n.value={x:1,y:0},b.value=0,y=0,a=null,_();return}s.value.unshift(e),e.x===u.x&&e.y===u.y?(b.value+=d.value?3:1,y++,L(),y>=1&&Math.random()<.5&&!a&&(B(),y=0)):s.value.pop(),a&&e.x===a.x&&e.y===a.y&&(A(a.type),a=null),I()}function L(){let e,t;do e=Math.floor(Math.random()*20),t=Math.floor(Math.random()*20);while(s.value.some(r=>r.x===e&&r.y===t)||a&&a.x===e&&a.y===t);u={x:e,y:t}}function R(e){switch(e){case"slow":return"#c2b280";case"fast":return"#00bcd4";case"ghost":return"#9c27b0";case"bonus":return"gold";default:return"#aaa"}}function B(){let e,t;do e=Math.floor(Math.random()*20),t=Math.floor(Math.random()*20);while(s.value.some(D=>D.x===e&&D.y===t)||u.x===e&&u.y===t);const r=["slow","fast","ghost","bonus"],w=r[Math.floor(Math.random()*r.length)];a={x:e,y:t,type:w}}function A(e){const t={slow:5e3,fast:3e3,ghost:5e3,bonus:5e3}[e],r=Date.now(),w=r+t;c===e&&i>r?i=Math.max(i,w):(c=e,i=w,e==="ghost"?h.value=!0:e==="bonus"&&(d.value=!0),setTimeout(()=>{i<=Date.now()&&(c=null,e==="ghost"&&(h.value=!1),e==="bonus"&&(d.value=!1))},t)),e==="slow"?M(300,t):e==="fast"?M(80,t):e==="ghost"?(h.value=!0,setTimeout(()=>{h.value=!1},t)):e==="bonus"&&(d.value=!0,setTimeout(()=>{d.value=!1},t)),setTimeout(()=>{c=null},t)}function M(e,t){clearInterval(f),x=e,f=setInterval(g,x),m&&clearTimeout(m),m=setTimeout(()=>{_()},t)}function _(){clearInterval(f),x=150,f=setInterval(g,x)}function S(e){switch(e.key){case"ArrowUp":n.value.y===0&&(n.value={x:0,y:-1});break;case"ArrowDown":n.value.y===0&&(n.value={x:0,y:1});break;case"ArrowLeft":n.value.x===0&&(n.value={x:-1,y:0});break;case"ArrowRight":n.value.x===0&&(n.value={x:1,y:0});break}}return G(()=>{l=p.value.getContext("2d"),window.addEventListener("keydown",S),f=setInterval(g,x)}),z(()=>{window.removeEventListener("keydown",S),clearInterval(f),clearTimeout(m)}),(e,t)=>(F(),U("div",N,[t[0]||(t[0]=k("h2",null,"スネークゲーム",-1)),k("canvas",{ref_key:"canvasRef",ref:p,width:"400",height:"400",class:"game-canvas"},null,512),k("p",{class:K({score:!0,bonus:d.value})}," スコア："+H(b.value),3)]))}},q=C(V,[["__scopeId","data-v-c1227695"]]);export{q as default};
