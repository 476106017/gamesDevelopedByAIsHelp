const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Game-Du5uKIoC.js","assets/index-PYIe12fk.js","assets/index-NGmNsV5L.css","assets/Game-hmKO-Lgn.css","assets/Game-qmiF_iRt.js","assets/Game-7fltOTAZ.css","assets/Game-JL5YTbOK.js","assets/Game-B-VnyV4V.css","assets/Game-0ssnbH75.js","assets/Game-B5dDs37Y.css"])))=>i.map(i=>d[i]);
import{_ as m,u,r as c,o as l,d as p,a as t,c as _,b as v,e as d,f,t as y,g,h as s}from"./index-PYIe12fk.js";const E=(n,a,o)=>{const e=n[a];return e?typeof e=="function"?e():Promise.resolve(e):new Promise((r,i)=>{(typeof queueMicrotask=="function"?queueMicrotask:setTimeout)(i.bind(null,new Error("Unknown variable dynamic import: "+a+(a.split("/").length!==o?". Note that variables only represent file names one level deep.":""))))})},k={key:0},G={key:1},w={__name:"GameWrapperView",setup(n){const o=u().params.name,e=c(null);return l(async()=>{try{e.value=p(()=>E(Object.assign({"../games/minesweeper/Game.vue":()=>t(()=>import("./Game-Du5uKIoC.js"),__vite__mapDeps([0,1,2,3])),"../games/snake/Game.vue":()=>t(()=>import("./Game-qmiF_iRt.js"),__vite__mapDeps([4,1,2,5])),"../games/tetris/Game.vue":()=>t(()=>import("./Game-JL5YTbOK.js"),__vite__mapDeps([6,1,2,7])),"../games/warehouse/Game.vue":()=>t(()=>import("./Game-0ssnbH75.js"),__vite__mapDeps([8,1,2,9]))}),`../games/${o}/Game.vue`,4))}catch(r){console.error(`ゲーム「${o}」の読み込みに失敗しました`,r)}}),(r,i)=>e.value?(s(),_("div",k,[(s(),v(d(e.value)))])):(s(),_("div",G,[f("p",null,"ゲーム「"+y(g(o))+"」が見つかりませんでした。",1)]))}},P=m(w,[["__scopeId","data-v-38f0101f"]]);export{P as default};
