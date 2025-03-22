import{_ as Q,r as m,i as X,c as i,h as f,j as k,f as h,t as c,F as B,k as L,w as Y,n as Z,l as ee}from"./index-PYIe12fk.js";const te={class:"minesweeper-container"},ne={key:0,class:"overlay"},le={class:"popup"},ae={class:"status-bar"},oe={class:"grid"},re=["onClick","onContextmenu"],se={key:1},ue={key:2},ie={key:3,class:"item-icon fading"},fe={key:4},ce={key:1,class:"toolbar"},ve=["onClick"],de={key:2},me={key:3},he={__name:"Game",setup(ge){const z={easy:{width:9,height:9,mines:10},medium:{width:16,height:16,mines:40},hard:{width:30,height:16,mines:99}},b=m(null),u=m([]),v=m(0),d=m(0),w=m(0),g=m(!1),p=m(!1),x=m(!1),I=m(0),_=m(0),y=m([]);let A=null;function F(l){M(),b.value=l;const n=z[l];v.value=n.width,d.value=n.height,w.value=n.mines,_.value=w.value,I.value=0,x.value=!1,g.value=!1,p.value=!1,u.value=Array.from({length:d.value},()=>Array.from({length:v.value},()=>({revealed:!1,flagged:!1,mine:!1,count:0,item:null})))}function D(l,n){const t=[];for(let e=0;e<d.value;e++){t[e]=[];for(let o=0;o<v.value;o++)t[e][o]={revealed:!1,flagged:!1,mine:!1,count:0,item:null}}let a=0;for(;a<w.value;){const e=Math.floor(Math.random()*v.value),o=Math.floor(Math.random()*d.value),r=Math.abs(e-l)<=1&&Math.abs(o-n)<=1;!t[o][e].mine&&!r&&(t[o][e].mine=!0,a++)}for(let e=0;e<d.value;e++)for(let o=0;o<v.value;o++)t[e][o].mine||(t[e][o].count=G(t,o,e));return t}function G(l,n,t){let a=0;for(let e=-1;e<=1;e++)for(let o=-1;o<=1;o++){const r=n+o,s=t+e;r>=0&&s>=0&&r<v.value&&s<d.value&&l[s][r].mine&&a++}return a}function N(l,n){var a,e,o;if(g.value||(e=(a=u.value[n])==null?void 0:a[l])!=null&&e.flagged)return;x.value||(u.value=D(l,n),x.value=!0,J());const t=(o=u.value[n])==null?void 0:o[l];t.revealed?t.count>0&&(W(l,n),T()):(C(l,n),T())}function E(l,n){if(g.value||u.value[n][l].revealed)return;const t=u.value[n][l];t.flagged=!t.flagged,_.value+=t.flagged?-1:1}function C(l,n){const t=u.value[n][l];if(!(t.revealed||t.flagged)){if(t.revealed=!0,t.mine){g.value=!0,M(),P();return}if(t.count===0&&!t.item&&Math.random()<.1){const a=["flag","reveal","robot"];t.item=a[Math.floor(Math.random()*a.length)],t.itemFade=!0,y.value.push(t.item),setTimeout(()=>{t.itemFade=!1},2e3)}t.count===0&&O(l,n)}}function O(l,n){for(let t=-1;t<=1;t++)for(let a=-1;a<=1;a++){const e=l+a,o=n+t;e>=0&&o>=0&&e<v.value&&o<d.value&&C(e,o)}}function R(l,n){let t=0;for(let a=-1;a<=1;a++)for(let e=-1;e<=1;e++){const o=l+e,r=n+a;if(o>=0&&r>=0&&o<v.value&&r<d.value){const s=u.value[r][o];!s.revealed&&!s.flagged&&t++}}return t}function U(l){const n=[0,0,0],t=[255,0,0],e=Math.min(l/5,1),o=Math.floor(n[0]+(t[0]-n[0])*e),r=Math.floor(n[1]+(t[1]-n[1])*e),s=Math.floor(n[2]+(t[2]-n[2])*e);return`rgb(${o},${r},${s})`}function V(){for(let l=0;l<d.value;l++)for(let n=0;n<v.value;n++){const t=u.value[l][n];if(t.revealed&&t.count>0){let a=0,e=[];for(let o=-1;o<=1;o++)for(let r=-1;r<=1;r++){const s=n+r,$=l+o;if(s>=0&&$>=0&&s<v.value&&$<d.value){const j=u.value[$][s];j.flagged?a++:j.revealed||e.push({x:s,y:$})}}if(a+e.length===t.count&&e.length>0){const{x:o,y:r}=e[Math.floor(Math.random()*e.length)];return E(o,r),!0}}}return!1}function W(l,n){const t=u.value[n][l];let a=0;for(let e=-1;e<=1;e++)for(let o=-1;o<=1;o++){const r=l+o,s=n+e;r>=0&&s>=0&&r<v.value&&s<d.value&&u.value[s][r].flagged&&a++}if(a===t.count)for(let e=-1;e<=1;e++)for(let o=-1;o<=1;o++){const r=l+o,s=n+e;r>=0&&s>=0&&r<v.value&&s<d.value&&!u.value[s][r].flagged&&!u.value[s][r].revealed&&C(r,s)}}function P(){for(let l of u.value)for(let n of l)n.revealed=!0}function S(l){switch(l){case"flag":return"🎯";case"reveal":return"🌟";case"robot":return"🤖";default:return"❓"}}function q(l){if(l==="flag"){const n=[];for(let t=0;t<d.value;t++)for(let a=0;a<v.value;a++){const e=u.value[t][a];e.mine&&!e.flagged&&n.push({x:a,y:t})}if(n.length>0){const{x:t,y:a}=n[Math.floor(Math.random()*n.length)];u.value[a][t].flagged=!0,_.value--}}else if(l==="reveal"){const n=[];for(let t=0;t<d.value;t++)for(let a=0;a<v.value;a++){const e=u.value[t][a];!e.mine&&!e.revealed&&e.count===0&&n.push({x:a,y:t})}if(n.length>0){const{x:t,y:a}=n[Math.floor(Math.random()*n.length)];C(t,a)}}else if(l==="robot"){let n=0;const t=10,a=setInterval(()=>{const e=V();n++,(!e||n>=t||g.value||p.value)&&clearInterval(a)},1e3)}}function H(l){const n=y.value[l];q(n),y.value.splice(l,1)}function T(){for(let l of u.value)for(let n of l)if(!n.mine&&!n.revealed)return;p.value=!0,M()}function J(){A=setInterval(()=>I.value++,1e3)}function M(){A&&clearInterval(A)}function K(){b.value=null,y.value=[]}return X(M),(l,n)=>(f(),i("div",te,[b.value?k("",!0):(f(),i("div",ne,[h("div",le,[h("h3",null,c(l.$t("selectDifficulty")),1),h("button",{onClick:n[0]||(n[0]=t=>F("easy"))},c(l.$t("easy")),1),h("button",{onClick:n[1]||(n[1]=t=>F("medium"))},c(l.$t("medium")),1),h("button",{onClick:n[2]||(n[2]=t=>F("hard"))},c(l.$t("hard")),1)])])),h("h2",null,c(l.$t("title")),1),h("div",ae,[h("span",null,c(l.$t("time"))+"："+c(I.value)+c(l.$t("seconds")),1),h("span",null,c(l.$t("flagsLeft"))+"："+c(_.value),1)]),h("div",oe,[(f(!0),i(B,null,L(u.value,(t,a)=>(f(),i("div",{key:a,class:"row"},[(f(!0),i(B,null,L(t,(e,o)=>(f(),i("div",{key:o,class:Z(["cell",{revealed:e.revealed,mine:e.revealed&&e.mine,flagged:e.flagged}]),onClick:r=>N(o,a),onContextmenu:Y(r=>E(o,a),["prevent"])},[e.revealed&&!e.mine&&e.count>0?(f(),i("span",{key:0,style:ee({color:U(R(o,a))})},c(e.count),5)):e.revealed&&e.mine?(f(),i("span",se,"💣")):!e.revealed&&e.flagged?(f(),i("span",ue,"🚩")):k("",!0),e.itemFade?(f(),i("span",ie,c(S(e.item)),1)):(f(),i("span",fe," "))],42,re))),128))]))),128))]),y.value.length?(f(),i("div",ce,[(f(!0),i(B,null,L(y.value,(t,a)=>(f(),i("span",{key:a,class:"tool",onClick:e=>H(a)},c(S(t))+" "+c(l.$t("tool_"+t)),9,ve))),128))])):k("",!0),g.value?(f(),i("p",de,c(l.$t("gameOver")),1)):p.value?(f(),i("p",me,c(l.$t("cleared")),1)):k("",!0),g.value||p.value?(f(),i("button",{key:4,onClick:K},c(l.$t("retry")),1)):k("",!0)]))}},pe=Q(he,[["__scopeId","data-v-e49bb04f"]]);export{pe as default};
