import{S as x,i as C,s as S,k as _,q as h,a as g,l as d,m as v,r as b,h as m,c as k,b as f,D as E,u as $,C as q,K as y}from"../chunks/index.7ff37955.js";import{p as D}from"../chunks/stores.5ac14489.js";function H(n){var u;let a,t=n[0].status+"",r,o,l,i=((u=n[0].error)==null?void 0:u.message)+"",c;return{c(){a=_("h1"),r=h(t),o=g(),l=_("p"),c=h(i)},l(e){a=d(e,"H1",{});var s=v(a);r=b(s,t),s.forEach(m),o=k(e),l=d(e,"P",{});var p=v(l);c=b(p,i),p.forEach(m)},m(e,s){f(e,a,s),E(a,r),f(e,o,s),f(e,l,s),E(l,c)},p(e,[s]){var p;s&1&&t!==(t=e[0].status+"")&&$(r,t),s&1&&i!==(i=((p=e[0].error)==null?void 0:p.message)+"")&&$(c,i)},i:q,o:q,d(e){e&&m(a),e&&m(o),e&&m(l)}}}function K(n,a,t){let r;return y(n,D,o=>t(0,r=o)),[r]}class w extends x{constructor(a){super(),C(this,a,K,H,S,{})}}export{w as default};