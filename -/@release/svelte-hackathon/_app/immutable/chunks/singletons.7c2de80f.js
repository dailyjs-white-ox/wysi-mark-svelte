import{C as d,aa as S,P as T,s as x,a3 as I}from"./index.9872a603.js";const f=[];function O(e,t){return{subscribe:p(e,t).subscribe}}function p(e,t=d){let n;const s=new Set;function r(a){if(x(e,a)&&(e=a,n)){const u=!f.length;for(const i of s)i[1](),f.push(i,e);if(u){for(let i=0;i<f.length;i+=2)f[i][0](f[i+1]);f.length=0}}}function o(a){r(a(e))}function l(a,u=d){const i=[a,u];return s.add(i),s.size===1&&(n=t(r)||d),a(e),()=>{s.delete(i),s.size===0&&(n(),n=null)}}return{set:r,update:o,subscribe:l}}function $(e,t,n){const s=!Array.isArray(e),r=s?[e]:e,o=t.length<2;return O(n,l=>{let a=!1;const u=[];let i=0,_=d;const h=()=>{if(i)return;_();const c=t(s?u[0]:u,l);o?l(c):_=I(c)?c:d},w=r.map((c,g)=>S(c,R=>{u[g]=R,i&=~(1<<g),a&&h()},()=>{i|=1<<g}));return a=!0,h(),function(){T(w),_()}})}var y;const U=((y=globalThis.__sveltekit_1xre3ug)==null?void 0:y.base)??"";var A;const L=((A=globalThis.__sveltekit_1xre3ug)==null?void 0:A.assets)??U,N="1684914830302",j="sveltekit:snapshot",q="sveltekit:scroll",C="sveltekit:index",v={tap:1,hover:2,viewport:3,eager:4,off:-1};function K(e){let t=e.baseURI;if(!t){const n=e.getElementsByTagName("base");t=n.length?n[0].href:e.URL}return t}function z(){return{x:pageXOffset,y:pageYOffset}}function b(e,t){return e.getAttribute(`data-sveltekit-${t}`)}const k={...v,"":v.hover};function E(e){let t=e.assignedSlot??e.parentNode;return(t==null?void 0:t.nodeType)===11&&(t=t.host),t}function D(e,t){for(;e&&e!==t;){if(e.nodeName.toUpperCase()==="A"&&e.hasAttribute("href"))return e;e=E(e)}}function G(e,t){let n;try{n=new URL(e instanceof SVGAElement?e.href.baseVal:e.href,document.baseURI)}catch{}const s=e instanceof SVGAElement?e.target.baseVal:e.target,r=!n||!!s||V(n,t)||(e.getAttribute("rel")||"").split(/\s+/).includes("external")||e.hasAttribute("download");return{url:n,external:r,target:s}}function X(e){let t=null,n=null,s=null,r=null,o=e;for(;o&&o!==document.documentElement;)n===null&&(n=b(o,"preload-code")),s===null&&(s=b(o,"preload-data")),t===null&&(t=b(o,"noscroll")),r===null&&(r=b(o,"reload")),o=E(o);return{preload_code:k[n??"off"],preload_data:k[s??"off"],noscroll:t==="off"?!1:t===""?!0:null,reload:r==="off"?!1:r===""?!0:null}}function m(e){const t=p(e);let n=!0;function s(){n=!0,t.update(l=>l)}function r(l){n=!1,t.set(l)}function o(l){let a;return t.subscribe(u=>{(a===void 0||n&&u!==a)&&l(a=u)})}return{notify:s,set:r,subscribe:o}}function P(){const{set:e,subscribe:t}=p(!1);let n;async function s(){clearTimeout(n);const r=await fetch(`${L}/_app/version.json`,{headers:{pragma:"no-cache","cache-control":"no-cache"}});if(r.ok){const l=(await r.json()).version!==N;return l&&(e(!0),clearTimeout(n)),l}else throw new Error(`Version check failed: ${r.status}`)}return{subscribe:t,check:s}}function V(e,t){return e.origin!==location.origin||!e.pathname.startsWith(t)}function B(e){e.client}const H={url:m({}),page:m({}),navigating:p(null),updated:P()};export{C as I,v as P,q as S,j as a,G as b,X as c,z as d,U as e,D as f,K as g,B as h,V as i,$ as j,H as s,p as w};
