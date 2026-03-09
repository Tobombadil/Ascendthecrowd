import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
// ERCOT North Hub July 2024 -- weekly price data
// [hour, DAM, RTM, supplyShare, demandShare, crowdShare]
// ══════════════════════════════════════════════════════════════
const WEEK = {
  Mon: { label:"Monday", date:"Jul 15", note:"98F, moderate wind, typical summer day", d:[
    [0,22,20,.3,.5,.2],[1,20,18,.3,.5,.2],[2,18,17,.4,.4,.2],[3,17,16,.4,.4,.2],
    [4,18,19,.2,.6,.2],[5,22,24,.1,.7,.2],[6,28,30,.1,.7,.2],[7,33,31,.2,.5,.3],
    [8,27,24,.5,.2,.3],[9,20,16,.5,.1,.4],[10,14,12,.5,.1,.4],[11,10,9,.6,.1,.3],
    [12,8,7,.6,.1,.3],[13,11,10,.5,.1,.4],[14,17,20,.3,.5,.2],[15,26,29,.2,.5,.3],
    [16,38,14,.08,.02,.90],[17,55,28,.08,.02,.90],[18,72,52,.10,.05,.85],
    [19,65,48,.10,.05,.85],[20,48,24,.05,.02,.93],[21,38,18,.05,.02,.93],
    [22,30,28,.3,.4,.3],[23,25,23,.3,.4,.3]]},
  Tue: { label:"Tuesday", date:"Jul 16", note:"102F, light wind, heat building", d:[
    [0,24,22,.3,.5,.2],[1,22,20,.3,.5,.2],[2,20,18,.3,.5,.2],[3,19,17,.3,.5,.2],
    [4,20,21,.2,.6,.2],[5,26,28,.1,.7,.2],[6,34,36,.1,.7,.2],[7,40,37,.3,.4,.3],
    [8,32,27,.5,.2,.3],[9,24,18,.5,.1,.4],[10,16,13,.5,.1,.4],[11,12,10,.5,.1,.4],
    [12,10,8,.6,.1,.3],[13,14,12,.5,.2,.3],[14,22,24,.2,.6,.2],[15,35,38,.1,.6,.3],
    [16,55,18,.05,.02,.93],[17,82,38,.05,.02,.93],[18,110,72,.08,.04,.88],
    [19,98,65,.08,.04,.88],[20,68,28,.03,.02,.95],[21,48,22,.03,.02,.95],
    [22,35,32,.3,.4,.3],[23,28,25,.3,.4,.3]]},
  Wed: { label:"Wednesday", date:"Jul 17", note:"101F, strong wind, clouds PM", d:[
    [0,14,10,.6,.2,.2],[1,11,8,.6,.2,.2],[2,9,6,.6,.2,.2],[3,8,5,.6,.2,.2],
    [4,10,8,.5,.3,.2],[5,16,15,.3,.5,.2],[6,24,26,.2,.6,.2],[7,30,28,.3,.4,.3],
    [8,22,18,.5,.2,.3],[9,15,11,.5,.1,.4],[10,8,7,.5,.2,.3],[11,5,4,.6,.1,.3],
    [12,3,2,.6,.1,.3],[13,6,5,.5,.2,.3],[14,12,14,.3,.5,.2],[15,22,25,.2,.5,.3],
    [16,42,16,.06,.02,.92],[17,65,30,.06,.02,.92],[18,88,58,.08,.04,.88],
    [19,78,50,.08,.04,.88],[20,52,22,.04,.02,.94],[21,40,18,.04,.02,.94],
    [22,28,25,.3,.4,.3],[23,20,18,.3,.4,.3]]},
  Thu: { label:"Thursday", date:"Jul 18", note:"105F, record heat, low wind", d:[
    [0,28,26,.3,.5,.2],[1,25,23,.3,.5,.2],[2,22,20,.3,.5,.2],[3,20,18,.3,.5,.2],
    [4,22,23,.2,.6,.2],[5,30,33,.1,.7,.2],[6,40,43,.1,.7,.2],[7,48,44,.3,.4,.3],
    [8,38,32,.5,.2,.3],[9,28,22,.5,.1,.4],[10,20,16,.5,.1,.4],[11,15,12,.5,.1,.4],
    [12,12,10,.6,.1,.3],[13,18,15,.5,.2,.3],[14,28,32,.2,.6,.2],[15,42,48,.1,.6,.3],
    [16,72,22,.04,.01,.95],[17,120,52,.04,.01,.95],[18,165,98,.06,.03,.91],
    [19,140,82,.06,.03,.91],[20,95,35,.03,.01,.96],[21,65,28,.03,.01,.96],
    [22,42,38,.3,.4,.3],[23,32,28,.3,.4,.3]]},
  Fri: { label:"Friday", date:"Jul 19", note:"100F, wind returns, cooling trend", d:[
    [0,20,18,.4,.4,.2],[1,18,16,.4,.4,.2],[2,16,14,.4,.4,.2],[3,15,13,.4,.4,.2],
    [4,16,17,.3,.5,.2],[5,22,24,.2,.6,.2],[6,30,32,.2,.6,.2],[7,36,34,.3,.4,.3],
    [8,28,24,.5,.2,.3],[9,20,16,.5,.1,.4],[10,14,11,.5,.2,.3],[11,10,8,.6,.1,.3],
    [12,8,6,.6,.1,.3],[13,12,10,.5,.2,.3],[14,20,22,.3,.5,.2],[15,30,34,.2,.5,.3],
    [16,48,18,.06,.02,.92],[17,70,35,.06,.02,.92],[18,92,62,.08,.04,.88],
    [19,82,55,.08,.04,.88],[20,58,26,.04,.02,.94],[21,42,20,.04,.02,.94],
    [22,32,28,.3,.4,.3],[23,24,22,.3,.4,.3]]},
  Sat: { label:"Saturday", date:"Jul 20", note:"95F, breezy, weekend demand drop", d:[
    [0,16,14,.4,.4,.2],[1,14,12,.4,.4,.2],[2,12,10,.4,.4,.2],[3,11,10,.4,.4,.2],
    [4,12,12,.3,.5,.2],[5,16,17,.2,.6,.2],[6,22,23,.2,.6,.2],[7,28,26,.3,.4,.3],
    [8,22,19,.5,.2,.3],[9,16,13,.5,.1,.4],[10,11,9,.5,.2,.3],[11,8,7,.6,.1,.3],
    [12,6,5,.6,.1,.3],[13,9,8,.5,.2,.3],[14,15,16,.3,.5,.2],[15,22,24,.2,.5,.3],
    [16,35,14,.08,.02,.90],[17,50,26,.08,.02,.90],[18,65,45,.10,.05,.85],
    [19,58,40,.10,.05,.85],[20,42,20,.05,.02,.93],[21,32,16,.05,.02,.93],
    [22,24,22,.3,.4,.3],[23,20,18,.3,.4,.3]]},
  Sun: { label:"Sunday", date:"Jul 21", note:"92F, mild, lowest demand day", d:[
    [0,14,12,.4,.4,.2],[1,12,10,.4,.4,.2],[2,10,9,.4,.4,.2],[3,9,8,.4,.4,.2],
    [4,10,10,.3,.5,.2],[5,14,15,.2,.6,.2],[6,20,21,.2,.6,.2],[7,25,23,.3,.4,.3],
    [8,20,17,.5,.2,.3],[9,14,11,.5,.1,.4],[10,10,8,.5,.2,.3],[11,7,6,.6,.1,.3],
    [12,5,4,.6,.1,.3],[13,8,7,.5,.2,.3],[14,13,14,.3,.5,.2],[15,20,22,.2,.5,.3],
    [16,30,12,.08,.02,.90],[17,44,24,.08,.02,.90],[18,58,40,.10,.05,.85],
    [19,52,36,.10,.05,.85],[20,38,18,.05,.02,.93],[21,28,14,.05,.02,.93],
    [22,22,20,.3,.4,.3],[23,18,16,.3,.4,.3]]}
};
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── Presets ────────────────────────────────────────────────────
const ACC_PRESETS={
  "Naive":   {sup:0,  dem:0,  crd:0,  tip:"Zero forecast accuracy. Uses only day-ahead prices. Equivalent to no intelligence."},
  "Good Forecast":{sup:75, dem:60, crd:30, tip:"Decent supply/demand forecasting with limited crowd visibility. Typical of basic weather-informed models."},
  "Ascend":  {sup:85, dem:75, crd:70, tip:"High-quality forecasts including crowd behavior modeling. Represents Ascend's SmartBidder intelligence."},
  "Perfect": {sup:100,dem:100,crd:100, tip:"Perfect foresight. Theoretical maximum. Useful as an upper bound benchmark."},
};
const BATT_PRESETS={
  "2hr Peaker":   {mw:40, mwh:80,  chgMW:40,disMW:40,rte:87,minSoc:10,maxSoc:95},
  "4hr Baseload": {mw:40, mwh:160, chgMW:40,disMW:40,rte:87,minSoc:10,maxSoc:90},
  "4hr Rate-Ltd": {mw:40, mwh:160, chgMW:10,disMW:10,rte:87,minSoc:10,maxSoc:90},
  "100MW Utility":{mw:100,mwh:400, chgMW:100,disMW:100,rte:87,minSoc:5,maxSoc:95},
  "100MW Density":{mw:100,mwh:400, chgMW:25,disMW:25,rte:87,minSoc:10,maxSoc:90},
};

// ── Core constants ────────────────────────────────────────────
const FLOOR_MAR=3,CEIL_MAR=2; // SOC safety margins: eMin=minSoc+FLOOR_MAR, eMax=maxSoc-CEIL_MAR
const SPH=4; // sub-hourly slots per hour (15-min resolution)

// ── Core math ─────────────────────────────────────────────────
function fcast(dam,rtm,sS,dS,cS,sa,da,ca){return dam+(rtm-dam)*(sS*(sa/100)+dS*(da/100)+cS*(ca/100));}
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

function calcSOCTraj(sch,dayKey,b,s0){
  const arr=sch[dayKey],{mwh,chgMW,disMW,rte,minSoc,maxSoc,floorMar=FLOOR_MAR,ceilMar=CEIL_MAR}=b;
  const eMin=minSoc+floorMar,eMax=maxSoc-ceilMar;
  const out=[];let s=s0;
  for(let h=0;h<24;h++){const m=arr[h];let clip=false,clipHi=false,clipLo=false;
    if(m==="C"){const d=(chgMW*rte/mwh)*100,av=eMax-s;if(av<=0){clip=true;clipHi=true;}else{s+=Math.min(d,av);if(d>av){clip=true;clipHi=true;}}}
    else if(m==="D"){const d=(disMW/mwh)*100,av=s-eMin;if(av<=0){clip=true;clipLo=true;}else{s-=Math.min(d,av);if(d>av){clip=true;clipLo=true;}}}
    out.push({h,soc:s,mode:m,clip,clipHi,clipLo});}return out;}

// Chain SOC through the week up to (but not including) the target day.
// Returns the starting SOC for that day after simulating all prior days.
function daySoc(sch,targetDay,b,s0,subSch){
  const{mwh,chgMW,disMW,rte,minSoc,maxSoc,floorMar=FLOOR_MAR,ceilMar=CEIL_MAR}=b;
  const eMin=minSoc+floorMar,eMax=maxSoc-ceilMar;
  let s=s0;
  for(const dk of DAYS){
    if(dk===targetDay)break;
    if(subSch&&subSch[dk]&&subSch[dk].length===96){
      const sub=subSch[dk];
      const cP=(chgMW*rte/mwh)*100/SPH,dP=(disMW/mwh)*100/SPH;
      for(let slot=0;slot<96;slot++){
        if(sub[slot]==="C")s=Math.min(eMax,s+Math.min(cP,eMax-s));
        else if(sub[slot]==="D")s=Math.max(eMin,s-Math.min(dP,s-eMin));
      }
    } else {
      const arr=sch[dk];
      const cPct=(chgMW*rte/mwh)*100,dPct=(disMW/mwh)*100;
      for(let h=0;h<24;h++){
        if(arr[h]==="C")s=Math.min(eMax,s+Math.min(cPct,eMax-s));
        else if(arr[h]==="D")s=Math.max(eMin,s-Math.min(dPct,s-eMin));
      }
    }
  }
  return s;
}

function calcRev(sch,dayKey,b,sa,da,ca,src,s0,subSch){
  const data=WEEK[dayKey].d,{mwh,chgMW,disMW,rte,minSoc,maxSoc,floorMar=FLOOR_MAR,ceilMar=CEIL_MAR}=b;
  const eMin=minSoc+floorMar,eMax=maxSoc-ceilMar;
  let rev=0,s=s0;
  if(subSch&&subSch[dayKey]&&subSch[dayKey].length===96){
    const sub=subSch[dayKey];
    const cP=(chgMW*rte/mwh)*100/SPH,dP=(disMW/mwh)*100/SPH;
    const hourlyP=data.map(([h,dam,rtm,sS,dS,cS])=>src==="rtm"?rtm:src==="dam"?dam:fcast(dam,rtm,sS,dS,cS,sa,da,ca));
    const subP=interpPrices(hourlyP,SPH);
    for(let slot=0;slot<96;slot++){
      const p=subP[slot];
      if(sub[slot]==="D"){const a=Math.min(dP,s-eMin);if(a>0){rev+=p*(a/100)*mwh;s-=a;}}
      else if(sub[slot]==="C"){const a=Math.min(cP,eMax-s);if(a>0){rev-=p*((a/100)*mwh/rte);s+=a;}}
    }
  } else {
    const arr=sch[dayKey];
    const cPct=(chgMW*rte/mwh)*100,dPct=(disMW/mwh)*100;
    data.forEach(([h,dam,rtm,sS,dS,cS])=>{
      const p=src==="rtm"?rtm:src==="dam"?dam:fcast(dam,rtm,sS,dS,cS,sa,da,ca);
      if(arr[h]==="D"){const a=Math.min(dPct,s-eMin);if(a>0){rev+=p*(a/100)*mwh;s-=a;}}
      else if(arr[h]==="C"){const a=Math.min(cPct,eMax-s);if(a>0){rev-=p*((a/100)*mwh/rte);s+=a;}}
    });
  }
  return rev;}

// ── Interpolate hourly prices to sub-hourly (cosine for smooth transitions) ──
function interpPrices(hourlyPrices,slotsPerHour){
  const n=hourlyPrices.length,total=n*slotsPerHour;
  const out=new Array(total);
  for(let s=0;s<total;s++){
    const t=s/slotsPerHour;
    const h0=Math.floor(t),h1=Math.min(n-1,h0+1);
    const frac=t-h0;
    const mu=(1-Math.cos(frac*Math.PI))/2;
    out[s]=hourlyPrices[h0]*(1-mu)+hourlyPrices[h1]*mu;
  }
  return out;
}

// ── Sub-hourly DP optimizer (works for any number of hours) ──
function runDP(prices,b,s0){
  const{mwh,chgMW,disMW,rte,minSoc,maxSoc,floorMar=FLOOR_MAR,ceilMar=CEIL_MAR,termVal=0}=b;
  const eMin=minSoc+floorMar,eMax=maxSoc-ceilMar;
  const nH=prices.length;
  const cP=(chgMW*rte/mwh)*100/SPH,dP=(disMW/mwh)*100/SPH;
  const subPrices=interpPrices(prices,SPH);
  const nSlots=nH*SPH;
  const STEP=1,N=Math.max(1,Math.round((eMax-eMin)/STEP)+1);
  const si=s=>Math.min(N-1,Math.max(0,Math.round((s-eMin)/STEP)));
  const sv=i=>eMin+i*STEP;
  const dp=Array.from({length:nSlots+1},()=>new Float64Array(N));
  const act=Array.from({length:nSlots},()=>new Uint8Array(N));
  const avgP=prices.reduce((a,b)=>a+b,0)/nH;
  // Auto-compute terminal value from price spread
  let tv=termVal;
  if(tv===0&&nH>=2){
    const sorted=[...prices].sort((a,b)=>a-b);
    const nQ=Math.max(1,Math.floor(nH/6));
    const cheapAvg=sorted.slice(0,nQ).reduce((a,b)=>a+b,0)/nQ;
    const dearAvg=sorted.slice(-nQ).reduce((a,b)=>a+b,0)/nQ;
    const spread=Math.max(0,dearAvg-cheapAvg/rte);
    tv=avgP>0?spread*0.25/avgP:0;
  }
  for(let i=0;i<N;i++){dp[nSlots][i]=avgP*((sv(i)-eMin)/100)*mwh*tv;}
  for(let t=nSlots-1;t>=0;t--){const p=subPrices[t];
    for(let i=0;i<N;i++){const s=sv(i);
      let bv=dp[t+1][i],ba=0;
      const ca=Math.min(cP,eMax-s);
      if(ca>0.5){const v=-p*((ca/100)*mwh/rte)+dp[t+1][si(s+ca)];if(v>bv){bv=v;ba=1;}}
      const da=Math.min(dP,s-eMin);
      if(da>0.5){const v=p*((da/100)*mwh)+dp[t+1][si(s-da)];if(v>bv){bv=v;ba=2;}}
      dp[t][i]=bv;act[t][i]=ba;
    }
  }
  // Forward pass
  const M=["H","C","D"],subSch=Array(nSlots).fill("H");
  let s=Math.max(eMin,Math.min(eMax,s0));
  for(let t=0;t<nSlots;t++){
    const a=act[t][si(s)];
    subSch[t]=M[a];
    if(a===1)s=Math.min(eMax,s+Math.min(cP,eMax-s));
    else if(a===2)s=Math.max(eMin,s-Math.min(dP,s-eMin));
  }
  return{subSch,endSoc:s};
}

// ── Build full-day schedule (24 hours) ──
function buildDaySch(prices,b,s0){
  const res=runDP(prices,b,s0);
  // Derive hourly display schedule from majority vote of sub-hourly slots
  const sch=Array(24).fill("H");
  for(let h=0;h<24;h++){
    const v=[0,0,0];
    for(let q=0;q<SPH;q++)v[{H:0,C:1,D:2}[res.subSch[h*SPH+q]]||0]++;
    if(v[2]>=2)sch[h]="D";else if(v[1]>=2)sch[h]="C";
  }
  return{sch,subSch:res.subSch,endSoc:res.endSoc};
}

function buildWeekSch(b,s0,sa,da,ca,priceMode){
  const week={},subWeek={};let s=s0;
  DAYS.forEach(dk=>{
    const prices=WEEK[dk].d.map(([h,dam,rtm,sS,dS,cS])=>priceMode==="dam"?dam:fcast(dam,rtm,sS,dS,cS,sa,da,ca));
    const res=buildDaySch(prices,b,s);week[dk]=res.sch;subWeek[dk]=res.subSch;s=res.endSoc;
  });return{week,subWeek};
}

function getRec(hour,rt,forecast,soc,mode,sigTh,b){
  const sp=rt-forecast,vol=Math.max(Math.abs(forecast*.15),3),sig=sp/vol,abs=Math.abs(sig),{minSoc,maxSoc,floorMar=FLOOR_MAR,ceilMar=CEIL_MAR}=b;
  if(mode==="D"&&sig<-sigTh&&soc>minSoc+floorMar)return{mode:"HOLD",conf:Math.min(95,70+abs*8),reason:"Crowd compression: RT $"+rt.toFixed(0)+", "+abs.toFixed(1)+"\u03C3 below fc.",tag:"CROWD",tc:"#ef4444",ovr:true};
  if(mode==="H"&&sig>sigTh&&soc>minSoc+10&&hour>=14&&hour<=21)return{mode:"DISCHARGE",conf:Math.min(98,75+abs*10),reason:"Spike: RT $"+rt.toFixed(0)+", "+sig.toFixed(1)+"\u03C3 above fc.",tag:"SPIKE",tc:"#ef4444",ovr:true};
  if(mode==="C"&&rt>forecast*1.3&&hour>=14)return{mode:"HOLD",conf:65,reason:"RT elevated ($"+rt.toFixed(0)+"). Defer charge.",tag:"PRICE",tc:"#f59e0b",ovr:true};
  if(mode==="D"&&soc<=minSoc+floorMar)return{mode:"HOLD",conf:90,reason:"SOC "+soc.toFixed(0)+"% near floor ("+minSoc+"%).",tag:"SOC LOW",tc:"#ef4444",ovr:true};
  if(mode==="C"&&soc>=maxSoc-ceilMar)return{mode:"HOLD",conf:85,reason:"SOC "+soc.toFixed(0)+"% near ceiling ("+maxSoc+"%).",tag:"SOC HIGH",tc:"#22c55e",ovr:true};
  const mm={C:"CHARGE",D:"DISCHARGE",H:"HOLD"};return{mode:mm[mode]||"HOLD",conf:55,reason:"Following schedule. RT $"+rt.toFixed(0)+"/MWh.",tag:null,tc:null,ovr:false};}

const MC={C:"#22c55e",D:"#ef4444",H:"#1e293b",CHARGE:"#22c55e",DISCHARGE:"#ef4444",HOLD:"#94a3b8"};
const ML={C:"CHG",D:"DIS",H:""};const MCYC={H:"C",C:"D",D:"H"};
function fmtDol(v){const a=Math.abs(v),s=v<0?"-":"";if(a>=1e9)return s+"$"+(a/1e9).toFixed(1)+"B";if(a>=1e6)return s+"$"+(a/1e6).toFixed(1)+"M";if(a>=1e4)return s+"$"+(a/1e3).toFixed(0)+"K";if(a>=1e3)return s+"$"+(a/1e3).toFixed(1)+"K";return s+"$"+a.toFixed(0);}

// ══════════════════════════════════════════════════════════════
// TOP-LEVEL INPUT -- lives outside Dashboard so React keeps
// component identity stable across parent renders. This fixes
// the "can only type one character" bug.
// ══════════════════════════════════════════════════════════════
function NumField({label,value,setValue,min,max,step,unit,color}){
  const [txt,setTxt]=useState(String(value));
  const prev=useRef(value);
  // Sync from parent when value changes externally (presets, cascading)
  useEffect(()=>{if(prev.current!==value){prev.current=value;setTxt(String(value));}},[value]);
  const commit=useCallback(()=>{
    const nv=Number(txt);
    if(!isNaN(nv)&&isFinite(nv)){const c=Math.max(min,Math.min(max,nv));setValue(c);setTxt(String(c));}
    else setTxt(String(value));
  },[txt,min,max,setValue,value]);
  return(
    <div style={{display:"flex",alignItems:"center",gap:4,height:28}}>
      <span style={{fontSize:10,color:"#5a7a9a",fontWeight:600,width:72,flexShrink:0}}>{label}</span>
      <input type="text" inputMode="decimal" value={txt}
        onChange={e=>setTxt(e.target.value)}
        onBlur={commit}
        onKeyDown={e=>{
          if(e.key==="Enter")e.target.blur();
          if(e.key==="ArrowUp"){e.preventDefault();const nv=Math.min(max,value+(step||1));setValue(nv);setTxt(String(nv));}
          if(e.key==="ArrowDown"){e.preventDefault();const nv=Math.max(min,value-(step||1));setValue(nv);setTxt(String(nv));}
        }}
        style={{flex:1,minWidth:0,background:"#0d1a2e",border:"1px solid #1a2744",borderRadius:3,padding:"4px 6px",color:color||"#c8d6e5",fontFamily:"inherit",fontSize:13,fontWeight:700,textAlign:"right",outline:"none"}}/>
      <span style={{fontSize:10,color:"#3a5a7a",width:32,flexShrink:0,textAlign:"left"}}>{unit}</span>
    </div>);
}

// ══════════════════════════════════════════════════════════════
export default function Dashboard(){
  // ── Responsive ──────────────────────────────────────────────
  const [winW,setWinW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const h=()=>setWinW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const mob=winW<768,tab=winW>=768&&winW<1080;
  // Font scale: bumps all sizes for readability
  const f=(base)=>mob?Math.round(base*1.6):tab?Math.round(base*1.2):Math.round(base*1.15);
  const [selDay,setSelDay]=useState("Mon");

  // ── Battery state ──────────────────────────────────────────
  const [battMW,setBattMW_]=useState(40);
  const [battMWh,setBattMWh_]=useState(80);
  const [chgMW,setChgMW_]=useState(40);
  const [disMW,setDisMW_]=useState(40);
  const [rte,setRte]=useState(87);
  const [minSoc,setMinSoc_]=useState(10);
  const [maxSoc,setMaxSoc_]=useState(95);
  const [startSoc,setStartSoc_]=useState(50);
  const [battPreset,setBattPreset]=useState("2hr Peaker");
  const [fleetN,setFleetN]=useState(1);

  // Cascading setters
  const setBattMW=useCallback(v=>{const nv=Math.max(1,Math.min(500,v));setBattMW_(nv);setChgMW_(c=>Math.min(c,nv));setDisMW_(d=>Math.min(d,nv));setBattPreset(null);},[]);
  const setBattMWh=useCallback(v=>{setBattMWh_(Math.max(1,Math.min(2000,v)));setBattPreset(null);},[]);
  const setChgMW=useCallback(v=>{setChgMW_(Math.max(1,Math.min(v,battMW)));setBattPreset(null);},[battMW]);
  const setDisMW=useCallback(v=>{setDisMW_(Math.max(1,Math.min(v,battMW)));setBattPreset(null);},[battMW]);
  const setMinSoc=useCallback(v=>{const nv=Math.max(0,Math.min(maxSoc-1,v));setMinSoc_(nv);setStartSoc_(s=>Math.max(nv,Math.min(maxSoc,s)));setBattPreset(null);},[maxSoc]);
  const setMaxSoc=useCallback(v=>{const nv=Math.max(minSoc+1,Math.min(100,v));setMaxSoc_(nv);setStartSoc_(s=>Math.max(minSoc,Math.min(nv,s)));setBattPreset(null);},[minSoc]);
  const setStartSoc=useCallback(v=>{setStartSoc_(Math.max(minSoc,Math.min(maxSoc,v)));setBattPreset(null);},[minSoc,maxSoc]);
  const applyBP=useCallback((n,p)=>{setBattMW_(p.mw);setBattMWh_(p.mwh);setChgMW_(p.chgMW);setDisMW_(p.disMW);setRte(p.rte);setMinSoc_(p.minSoc);setMaxSoc_(p.maxSoc);setStartSoc_(s=>Math.max(p.minSoc,Math.min(p.maxSoc,s)));setBattPreset(n);},[]);

  // RT Learn tuning
  const [rlRebuildCad,setRlRebuildCad]=useState(4);
  const [rlOpen,setRlOpen]=useState(false);

  const batt=useMemo(()=>({mw:battMW,mwh:battMWh,chgMW,disMW,rte:rte/100,minSoc,maxSoc,floorMar:3,ceilMar:2,termVal:0}),[battMW,battMWh,chgMW,disMW,rte,minSoc,maxSoc]);
  const duration=battMWh/battMW;
  const chgPctHr=(chgMW*(rte/100)/battMWh)*100;
  const disPctHr=(disMW/battMWh)*100;
  const usableMWh=((maxSoc-minSoc)/100)*battMWh;
  const fullChgHr=chgPctHr>0?(maxSoc-minSoc)/chgPctHr:Infinity;
  const fullDisHr=disPctHr>0?(maxSoc-minSoc)/disPctHr:Infinity;
  const chgRatio=battMW>0?(chgMW/battMW*100):100;
  const disRatio=battMW>0?(disMW/battMW*100):100;

  // ── Forecast state ─────────────────────────────────────────
  const [supAcc,setSupAcc]=useState(85);
  const [demAcc,setDemAcc]=useState(75);
  const [crdAcc,setCrdAcc]=useState(70);
  const [mktVol,setMktVol]=useState(25); // market volatility 0-100 (0=deterministic, 100=high noise)
  const [accP,setAccP]=useState("Ascend");
  const [hovH,setHovH]=useState(null);

  // ── Schedule state (shared across both tabs) ───────────────
  const subSchRef=useRef({}); // {dayName: Array(96)} sub-hourly execution schedule
  const [subSchRev,setSubSchRev]=useState(0); // revision counter for triggering recalc
  const [sch,setSch]=useState(()=>{
    const ib={mw:40,mwh:80,chgMW:40,disMW:40,rte:0.87,minSoc:10,maxSoc:95};
    const r=buildWeekSch(ib,50,0,0,0,"dam");
    subSchRef.current=r.subWeek;
    return r.week;
  });
  const [schP,setSchP]=useState("Naive");
  const [painting,setPainting]=useState(false);
  const [paintM,setPaintM]=useState(null);

  // ── Trading state (shared across both tabs) ────────────────
  const [sigTh,setSigTh]=useState(2);
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(2000);
  const [ticks,setTicks]=useState([]);
  const [simD,setSimD]=useState(0);
  const [simH,setSimH]=useState(0);
  const [simM,setSimM]=useState(0);
  const [soc,setSoc]=useState(50);
  const socRef=useRef(50); // live SOC for tick engine (avoids stale closure)
  const [uPnl,setUPnl]=useState(0);
  const [sPnl,setSPnl]=useState(0);
  const [sSoc,setSSoc]=useState(50);
  const sSocRef=useRef(50); // live optimal SOC
  const [alerts,setAlerts]=useState([]);
  const [tlog,setTlog]=useState([]);
  const [rec,setRec]=useState(null);
  const [manual,setManual]=useState(null);
  const prevRT=useRef(null);const tickRef=useRef(null);
  const [rtLearn,setRtLearn]=useState(false);
  const rtOptLastH=useRef(-1);
  // RT Learning: simple hourly prices per day + cross-day hourly averages
  const learnedRef=useRef({}); // {dayName: {hour: {sum, n}}} day-specific hourly RT averages
  const crossDayRef=useRef({}); // {hour: {sum, n}} cross-day hourly RT averages
  const [colL,setColL]=useState(false);
  const [colR,setColR]=useState(false);
  const [battOpen,setBattOpen]=useState(true);
  const [profitOpen,setProfitOpen]=useState(true);
  const [mobPanel,setMobPanel]=useState("center"); // mobile: "trade","center","config"
  const learnLastDay=useRef(-1);
  const learnSeenRef=useRef(new Set());
  const lastRebuildTime=useRef(-999);

  // Sync day selection to sim when running
  useEffect(()=>{if(running)setSelDay(DAYS[simD]);},[running,simD]);

  const reset=useCallback(()=>{
    setRunning(false);setTicks([]);setSimD(0);setSimH(0);setSimM(0);
    setSoc(startSoc);socRef.current=startSoc;setUPnl(0);setSPnl(0);setSSoc(startSoc);sSocRef.current=startSoc;
    setAlerts([]);setTlog([]);setRec(null);setManual(null);prevRT.current=null;setRtLearn(false);rtOptLastH.current=-1;learnedRef.current={};crossDayRef.current={};learnLastDay.current=-1;learnSeenRef.current=new Set();lastRebuildTime.current=-999;
  },[startSoc]);

  // ── RT Learning ──────────────────────────────────────────────
  const learnAccumulate=useCallback(()=>{
    const lr=learnedRef.current;
    const xd=crossDayRef.current;
    const seen=learnSeenRef.current;
    for(let i=0;i<ticks.length;i++){
      const t=ticks[i];
      const tid=t.day+t.time;
      if(seen.has(tid))continue;
      seen.add(tid);
      // Use base hourly RTM (hrtm) for learning, not interpolated rt.
      // The DP plans against hourly prices then interpolates internally,
      // so learned prices must represent hourly settlement values.
      const price=t.hrtm!==undefined?t.hrtm:t.rt;
      if(!lr[t.day])lr[t.day]={};
      if(!lr[t.day][t.hr])lr[t.day][t.hr]={sum:0,n:0};
      lr[t.day][t.hr].sum+=price;
      lr[t.day][t.hr].n++;
      if(!xd[t.hr])xd[t.hr]={sum:0,n:0};
      xd[t.hr].sum+=price;
      xd[t.hr].n++;
    }
  },[ticks]);

  // Rebuild schedule: partial-day DP for current day (from actual SOC), full-day for future
  const learnRebuild=useCallback((silent)=>{
    const dk=DAYS[simD];
    const lr=learnedRef.current;
    const xd=crossDayRef.current;
    const buildPrices24=(dayName)=>{
      const rows=WEEK[dayName].d;
      const dayLr=lr[dayName]||{};
      return rows.map(([h,dam,rtm,sS,dS,cS])=>{
        if(dayLr[h]&&dayLr[h].n>=1)return dayLr[h].sum/dayLr[h].n;
        if(xd[h]&&xd[h].n>=1)return xd[h].sum/xd[h].n;
        return fcast(dam,rtm,sS,dS,cS,supAcc,demAcc,crdAcc);
      });
    };
    const newSch={...sch};const newSubSch={...subSchRef.current};
    const{mwh,chgMW:cMW,disMW:dMW,rte:rteV,minSoc:mn,maxSoc:mx,floorMar:fm=FLOOR_MAR,ceilMar:cm=CEIL_MAR}=batt;
    const eMn=mn+fm,eMx=mx-cm;
    const liveSoc=Math.max(eMn,Math.min(eMx,socRef.current));
    const startDayIdx=DAYS.indexOf(dk);
    const curPrices=buildPrices24(dk);
    const cP=(cMW*rteV/mwh)*100/SPH,dP=(dMW/mwh)*100/SPH;

    // CURRENT DAY: partial DP from simH forward using actual live SOC
    const nRemH=24-simH;
    if(nRemH>0){
      const remPrices=curPrices.slice(simH);
      const res=runDP(remPrices,batt,liveSoc);
      // Graft partial result onto existing schedule
      const curSub=newSubSch[dk]?[...newSubSch[dk]]:Array(96).fill("H");
      const startSlot=simH*SPH;
      for(let t=0;t<nRemH*SPH;t++)curSub[startSlot+t]=res.subSch[t];
      newSubSch[dk]=[...curSub];
      const curHr=[...newSch[dk]];
      for(let h=simH;h<24;h++){
        const v=[0,0,0];
        for(let q=0;q<SPH;q++)v[{H:0,C:1,D:2}[curSub[h*4+q]]||0]++;
        if(v[2]>=2)curHr[h]="D";else if(v[1]>=2)curHr[h]="C";else curHr[h]="H";
      }
      newSch[dk]=curHr;
    }
    // Chain SOC: simulate remaining current-day sub-slots from live SOC
    let chainSoc=liveSoc;
    const curSub=newSubSch[dk]||Array(96).fill("H");
    for(let s=simH*SPH;s<96;s++){
      if(curSub[s]==="C")chainSoc=Math.min(eMx,chainSoc+Math.min(cP,eMx-chainSoc));
      else if(curSub[s]==="D")chainSoc=Math.max(eMn,chainSoc-Math.min(dP,chainSoc-eMn));
    }
    // FUTURE DAYS: always rebuild using learned + forecast fallback
    for(let di=1;di<7;di++){
      const futDay=DAYS[(startDayIdx+di)%7];
      const fp=buildPrices24(futDay);
      const res=buildDaySch(fp,batt,chainSoc);
      newSch[futDay]=[...res.sch];
      newSubSch[futDay]=res.subSch;
      chainSoc=res.endSoc;
    }
    setSch(newSch);subSchRef.current=newSubSch;setSubSchRev(v=>v+1);
    setSchP("RT Learn");setManual(null);
    learnLastDay.current=simD;
    if(!silent){
      const dayLr=lr[dk]||{};
      const nObs=Object.keys(dayLr).filter(h=>dayLr[h].n>=1).length;
      const nXd=Object.values(xd).filter(v=>v.n>=1).length;
      setAlerts(prev=>[{id:Date.now(),time:DAYS[simD]+" "+String(simH).padStart(2,"0")+":"+String(simM).padStart(2,"0"),
        tag:"RT LEARN",tc:"#a855f7",msg:"Rebuilt from hr "+simH+". "+dk+": "+nObs+"/24 obs, "+nXd+"/24 cross-day."},...prev]);
    }
  },[simD,simH,simM,sch,batt,supAcc,demAcc,crdAcc]);

  const toggleRtLearn=useCallback(()=>{
    if(rtLearn){setRtLearn(false);rtOptLastH.current=-1;learnLastDay.current=-1;lastRebuildTime.current=-999;return;}
    setRtLearn(true);
    rtOptLastH.current=simH;
    lastRebuildTime.current=-999;
    learnAccumulate();
    learnRebuild(false);
  },[rtLearn,simH,learnAccumulate,learnRebuild]);

  // Cadence-based rebuilds
  useEffect(()=>{
    if(!rtLearn||!running||ticks.length<2)return;
    const curTime=simD*24+simH+simM/60;
    const elapsed=curTime-lastRebuildTime.current;
    // Accumulate on hour boundaries
    if(simH!==rtOptLastH.current){
      rtOptLastH.current=simH;
      learnAccumulate();
    }
    // Rebuild when enough time has passed per cadence, or on day change
    if(elapsed>=rlRebuildCad||learnLastDay.current!==simD||lastRebuildTime.current<0){
      learnAccumulate();
      learnRebuild(lastRebuildTime.current>=0);
      lastRebuildTime.current=curTime;
    }
  },[rtLearn,running,simH,simM,simD,ticks.length,rlRebuildCad,learnAccumulate,learnRebuild]);

  // ── Derived data ───────────────────────────────────────────
  const dayD=WEEK[selDay];
  const fcs=useMemo(()=>dayD.d.map(([h,dam,rtm,sS,dS,cS])=>({h,dam,rtm,fc:fcast(dam,rtm,sS,dS,cS,supAcc,demAcc,crdAcc)})),[dayD,supAcc,demAcc,crdAcc]);
  const crowdPct=useMemo(()=>{const g=dayD.d.map(r=>Math.abs(r[2]-r[1]));const c=dayD.d.map((r,i)=>g[i]*r[5]);return(c.reduce((a,b)=>a+b,0)/Math.max(1,g.reduce((a,b)=>a+b,0)))*100;},[dayD]);
  const mae=useMemo(()=>fcs.reduce((a,f)=>a+Math.abs(f.fc-f.rtm),0)/fcs.length,[fcs]);
  // RT Learning price curve (clean hourly)
  const rtBiasFcs=useMemo(()=>{
    if(!rtLearn||ticks.length<2)return null;
    const lr=learnedRef.current;
    const xd=crossDayRef.current;
    const dayLr=lr[selDay]||{};
    const nXd=Object.values(xd).filter(v=>v.n>=1).length;
    const nDay=Object.keys(dayLr).filter(h=>dayLr[h].n>=1).length;
    if(nXd<2&&nDay<2)return null;
    return fcs.map((f,h)=>{
      if(dayLr[h]&&dayLr[h].n>=1)return dayLr[h].sum/dayLr[h].n;
      if(xd[h]&&xd[h].n>=1)return xd[h].sum/xd[h].n;
      return f.fc;
    });
  },[rtLearn,ticks,selDay,fcs]);
  const socTraj=useMemo(()=>{
    const ds=daySoc(sch,selDay,batt,startSoc,subSchRef.current);
    return calcSOCTraj(sch,selDay,batt,ds);
  },[sch,selDay,batt,startSoc,subSchRev]);
  const clipN=socTraj.filter(t=>t.clip).length;

  // Revenue benchmarks -- each uses sub-hourly for accurate calculation
  const naiveSchR=useMemo(()=>buildWeekSch(batt,startSoc,0,0,0,"dam"),[batt,startSoc]);
  const naiveSch=naiveSchR.week;
  const naiveSubSch=naiveSchR.subWeek;
  const revNaive=useMemo(()=>{
    const ds=daySoc(naiveSch,selDay,batt,startSoc,naiveSubSch);
    return calcRev(naiveSch,selDay,batt,100,100,100,"rtm",ds,naiveSubSch);
  },[naiveSch,naiveSubSch,selDay,batt,startSoc]);
  const revYours=useMemo(()=>{
    const subW=subSchRef.current;
    const ds=daySoc(sch,selDay,batt,startSoc,subW);
    return calcRev(sch,selDay,batt,100,100,100,"rtm",ds,subW);
  },[sch,selDay,batt,startSoc,subSchRev]);
  const perfSchR=useMemo(()=>{const w={},sw={};let s=startSoc;DAYS.forEach(d=>{const r=buildDaySch(WEEK[d].d.map(r=>r[2]),batt,s);w[d]=r.sch;sw[d]=r.subSch;s=r.endSoc;});return{week:w,subWeek:sw};},[batt,startSoc]);
  const perfSch=perfSchR.week;
  const perfSubSch=perfSchR.subWeek;
  const revPerf=useMemo(()=>{
    const ds=daySoc(perfSch,selDay,batt,startSoc,perfSubSch);
    return calcRev(perfSch,selDay,batt,100,100,100,"rtm",ds,perfSubSch);
  },[perfSch,perfSubSch,selDay,batt,startSoc]);

  // ── Paint ──────────────────────────────────────────────────
  const cellDn=useCallback((d,h)=>{const c=sch[d][h],n=MCYC[c];setPaintM(n);setPainting(true);setSch(p=>{const cp={...p};cp[d]=[...cp[d]];cp[d][h]=n;return cp;});
    // Sync sub-hourly: expand this hour to 4 identical slots
    if(subSchRef.current[d]){for(let q=0;q<4;q++)subSchRef.current[d][h*4+q]=n;}
    setSchP(null);setRtLearn(false);},[sch]);
  const cellEn=useCallback((d,h)=>{if(!painting||paintM===null)return;setSch(p=>{if(p[d][h]===paintM)return p;const cp={...p};cp[d]=[...cp[d]];cp[d][h]=paintM;return cp;});
    if(subSchRef.current[d]){for(let q=0;q<4;q++)subSchRef.current[d][h*4+q]=paintM;}
    setSchP(null);},[painting,paintM]);
  useEffect(()=>{const u=()=>setPainting(false);window.addEventListener("mouseup",u);return()=>window.removeEventListener("mouseup",u);},[]);

  // ── Tick engine ────────────────────────────────────────────
  useEffect(()=>{
    if(!running){clearInterval(tickRef.current);return;}
    const rD=rte/100,tph=12,cpt=(chgMW*rD/battMWh)*100/tph,dpt=(disMW/battMWh)*100/tph;
    tickRef.current=setInterval(()=>{
      setSimM(prev=>{let nm=prev+5,ha=false;if(nm>=60){nm=0;ha=true;}
        if(ha)setSimH(ph=>{let nh=ph+1;if(nh>=24){nh=0;setSimD(pd=>(pd+1)%7);}return nh;});
        setSimD(cd=>{setSimH(ch=>{
          const hr=ch,dn=DAYS[cd],row=WEEK[dn].d[hr],[,dam,rtm,sS,dS,cS]=row;
          // Sub-hourly price interpolation: cosine blend between current and next hour
          const frac=nm/60;
          const nextHr=Math.min(23,hr+1);
          const nRow=WEEK[dn].d[nextHr];
          const mu=(1-Math.cos(frac*Math.PI))/2;
          const subRtm=rtm*(1-mu)+nRow[2]*mu;
          const subDam=dam*(1-mu)+nRow[1]*mu;
          const subSS=sS*(1-mu)+nRow[3]*mu;
          const subDS=dS*(1-mu)+nRow[4]*mu;
          const subCS=cS*(1-mu)+nRow[5]*mu;
          const fcV=fcast(subDam,subRtm,subSS,subDS,subCS,supAcc,demAcc,crdAcc);
          const volScale=mktVol/100;
          const noise=gauss()*Math.max(Math.abs(subRtm*.12),2)*0.25*volScale;
          const blend=volScale>0?0.3*volScale:0;
          const rt=Math.max(-5,(prevRT.current!==null?prevRT.current*blend+subRtm*(1-blend):subRtm)+noise);
          prevRT.current=rt;
          const sm=sch[dn][hr];
          // Sub-hourly execution: read 15-min slot
          const subSlot=hr*4+Math.floor(nm/15);
          const subSm=(subSchRef.current[dn]&&subSchRef.current[dn][subSlot])||sm;
          let r,em;
          const liveSoc=socRef.current;
          const dpOptimized=schP==="Naive"||schP==="Optimized"||schP==="RT Learn";
          if(dpOptimized||rtLearn){
            // Follow DP-optimized sub-hourly schedule directly (no getRec second-guessing)
            const schMode={C:"CHARGE",D:"DISCHARGE",H:"HOLD"}[subSm]||"HOLD";
            r={mode:schMode,conf:85,reason:"Following optimized schedule. RT $"+rt.toFixed(0)+"/MWh.",tag:null,tc:null,ovr:false};
            if(schMode==="DISCHARGE"&&liveSoc<=minSoc+3)r={mode:"HOLD",conf:95,reason:"SOC "+liveSoc.toFixed(0)+"% near floor ("+minSoc+"%).",tag:"SOC LOW",tc:"#ef4444",ovr:true};
            if(schMode==="CHARGE"&&liveSoc>=maxSoc-2)r={mode:"HOLD",conf:90,reason:"SOC "+liveSoc.toFixed(0)+"% near ceiling ("+maxSoc+"%).",tag:"SOC HIGH",tc:"#22c55e",ovr:true};
            em=manual||r.mode;
          }else{
            // Manual/custom schedule: use getRec for tick-level sigma intelligence
            r=getRec(hr,rt,fcV,liveSoc,subSm,sigTh,batt);
            em=manual||r.mode;
          }
          setRec(r);
          // Execute using live SOC ref with effective bounds matching DP
          const eMinRT=minSoc+3,eMaxRT=maxSoc-2;
          let pD=0,sD=0;
          if(em==="DISCHARGE"&&liveSoc>eMinRT){const a=Math.min(dpt,liveSoc-eMinRT);if(a>0.01){pD=rt*(a/100)*battMWh;sD=-a;}}
          else if(em==="CHARGE"&&liveSoc<eMaxRT){const a=Math.min(cpt,eMaxRT-liveSoc);if(a>0.01){pD=-(rt*(a/100)*battMWh/rD);sD=a;}}
          const newSoc=Math.max(eMinRT,Math.min(eMaxRT,liveSoc+sD));
          socRef.current=newSoc; // update ref synchronously
          setUPnl(p=>p+pD);setSoc(newSoc);
          // Naive baseline P&L using live ref
          const liveSSoc=sSocRef.current;
          const naiveSubSlot=hr*4+Math.floor(nm/15);
          const naiveAction=(naiveSubSch[dn]&&naiveSubSch[dn][naiveSubSlot])||naiveSch[dn][hr];
          const naiveMode0={C:"CHARGE",D:"DISCHARGE",H:"HOLD"}[naiveAction]||"HOLD";
          const naiveMode=(naiveMode0==="DISCHARGE"&&liveSSoc<=minSoc+3)?"HOLD":(naiveMode0==="CHARGE"&&liveSSoc>=maxSoc-2)?"HOLD":naiveMode0;
          let sp2=0,sd2=0;
          if(naiveMode==="DISCHARGE"&&liveSSoc>eMinRT){const a=Math.min(dpt,liveSSoc-eMinRT);if(a>0.01){sp2=rt*(a/100)*battMWh;sd2=-a;}}
          else if(naiveMode==="CHARGE"&&liveSSoc<eMaxRT){const a=Math.min(cpt,eMaxRT-liveSSoc);if(a>0.01){sp2=-(rt*(a/100)*battMWh/rD);sd2=a;}}
          const newSSoc=Math.max(eMinRT,Math.min(eMaxRT,liveSSoc+sd2));
          sSocRef.current=newSSoc;
          setSPnl(p=>p+sp2);setSSoc(newSSoc);
          const ts=String(hr).padStart(2,"0")+":"+String(nm).padStart(2,"0");
          setTicks(p=>[...p,{hr,mn:nm,time:ts,day:dn,dam:Math.round(subDam*10)/10,rtm:Math.round(subRtm*10)/10,hrtm:rtm,fv:Math.round(fcV*10)/10,rt:Math.round(rt*10)/10,sp:Math.round((rt-fcV)*10)/10,um:em,sm}].slice(-2100));
          if(r.tag)setAlerts(p=>[{time:dn+" "+ts,tag:r.tag,tc:r.tc,msg:r.reason,id:Date.now()},...p].slice(0,20));
          setTlog(p=>{const l=p[0];if(!l||l.mode!==em)return[{time:dn+" "+ts,mode:em,rt:Math.round(rt*10)/10,soc:Math.round(newSoc*10)/10,ovr:!!manual||r.ovr,id:Date.now()},...p].slice(0,40);return p;});
          return ch;});return cd;});return nm;});
    },speed);return()=>clearInterval(tickRef.current);
  },[running,speed,sigTh,sch,schP,naiveSch,naiveSubSch,manual,rtLearn,supAcc,demAcc,crdAcc,mktVol,batt,minSoc,maxSoc]);

  const last=ticks[ticks.length-1];
  const eMode=manual||(rec?rec.mode:"HOLD");

  // ── Chart data ─────────────────────────────────────────────
  const CW=540,CH=155,PD={t:14,r:10,b:20,l:36},pW=CW-PD.l-PD.r,pH=CH-PD.t-PD.b;
  const cp=useMemo(()=>{
    const volScale=mktVol/100;
    // Uncertainty band around FORECAST: forecast error + market noise
    const bandW=fcs.map(f=>{
      const fcErr=Math.abs(f.rtm-f.fc);
      const noise=Math.max(Math.abs(f.rtm*0.12),2)*0.25*volScale*3.5;
      return fcErr+noise;
    });
    const av=fcs.flatMap((f,i)=>[f.dam,f.fc+bandW[i],f.fc-bandW[i],f.rtm]);
    if(rtBiasFcs)rtBiasFcs.forEach(v=>av.push(v));
    const yMn=Math.min(...av)-3,yMx=Math.max(...av)+3,yR=yMx-yMn||1;
    const x=i=>PD.l+(i/23)*pW,y=v=>PD.t+pH-((v-yMn)/yR)*pH;
    const dP=fcs.map((f,i)=>(i?'L':'M')+x(i)+','+y(f.dam)).join('');
    const rP=fcs.map((f,i)=>(i?'L':'M')+x(i)+','+y(f.rtm)).join('');
    const fP=fcs.map((f,i)=>(i?'L':'M')+x(i)+','+y(f.fc)).join('');
    const bP=rtBiasFcs?rtBiasFcs.map((v,i)=>(i?'L':'M')+x(i)+','+y(v)).join(''):null;
    let volBand=null;
    if(bandW.some(w=>w>0.5)){
      const upper=fcs.map((f,i)=>(i?'L':'M')+x(i)+','+y(f.fc+bandW[i])).join('');
      const lower=fcs.slice().reverse().map((f,i)=>{const j=23-i;return'L'+x(j)+','+y(fcs[j].fc-bandW[j]);}).join('');
      volBand=upper+lower+'Z';
    }
    const gap=fcs.map((f,i)=>({i,x:x(i),u:y(Math.max(f.fc,f.rtm)),lo:y(Math.min(f.fc,f.rtm)),f:f.fc>f.rtm?"#3b82f6":"#ef4444"}));
    const yT=[];const st=yR>120?30:yR>60?15:yR>30?10:5;for(let v=Math.ceil(yMn/st)*st;v<=yMx;v+=st)yT.push({v,py:y(v)});
    return{dP,rP,fP,bP,volBand,bandW,gap,yT,x,y,sch:sch[selDay]};
  },[fcs,sch,selDay,rtBiasFcs,mktVol]);
  const rtC=useMemo(()=>{
    if(ticks.length<2)return null;const vis=ticks.slice(-80),av=vis.flatMap(t=>[t.fv,t.rt]);
    const yMn=Math.min(...av)-3,yMx=Math.max(...av)+3,yR=yMx-yMn||1;
    const w=520,h=110,pl=32,pt=8,pb=16,pr=8,pw=w-pl-pr,ph2=h-pt-pb;
    const x=i=>pl+(i/(vis.length-1))*pw,y=v=>pt+ph2-((v-yMn)/yR)*ph2;
    const fL=vis.map((t,i)=>(i?'L':'M')+x(i)+','+y(t.fv)).join('');
    const sg=[];for(let i=1;i<vis.length;i++)sg.push({d:'M'+x(i-1)+','+y(vis[i-1].rt)+' L'+x(i)+','+y(vis[i].rt),c:vis[i].rt>vis[i].fv?"#22c55e":"#ef4444"});
    const yT=[];const st=yR>80?20:yR>40?10:5;for(let v=Math.ceil(yMn/st)*st;v<=yMx;v+=st)yT.push({v,py:y(v)});
    return{fL,sg,yT,w,h,pl,pr,pt};
  },[ticks]);

  // ── Styles ─────────────────────────────────────────────────
  const P={background:"#0b1628",border:"1px solid #1a2744",borderRadius:"6px",padding:mob?"10px 12px":"8px"};
  const LB={fontSize:f(8),fontWeight:700,letterSpacing:".1em",color:"#4a6a8a",textTransform:"uppercase",marginBottom:mob?"6px":"4px"};
  const DR=({l,v,c})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:mob?"3px 0":"1.5px 0"}}><span style={{fontSize:f(7),color:"#3a5a7a"}}>{l}</span><span style={{fontSize:f(8),fontWeight:700,color:c}}>{v}</span></div>);

  // ── Shared schedule action buttons ─────────────────────────
  const SchBtns=()=>{const bs={flex:1,minWidth:0,borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:f(8),fontWeight:600,padding:"3px 0",textAlign:"center"};return(
    <div style={{display:"flex",gap:2,minWidth:0}}>
      <button title="Schedule using day-ahead market prices only. No forecast intelligence." onClick={()=>{const r=buildWeekSch(batt,startSoc,0,0,0,"dam");setSch(r.week);subSchRef.current=r.subWeek;setSubSchRev(v=>v+1);setSchP("Naive");setRtLearn(false);}} style={{...bs,border:schP==="Naive"?"1px solid #94a3b8":"1px solid #1a2744",background:schP==="Naive"?"#94a3b820":"#0d1a2e",color:schP==="Naive"?"#94a3b8":"#4a6a8a"}}>Naive</button>
      <button title="Optimize schedule using supply, demand, and crowd forecasts via dynamic programming." onClick={()=>{const r=buildWeekSch(batt,startSoc,supAcc,demAcc,crdAcc,"fc");setSch(r.week);subSchRef.current=r.subWeek;setSubSchRev(v=>v+1);setSchP("Optimized");setRtLearn(false);}} style={{...bs,border:schP==="Optimized"?"1px solid #22c55e":"1px solid #1a2744",background:schP==="Optimized"?"#22c55e20":"#0d1a2e",color:schP==="Optimized"?"#22c55e":"#4a6a8a"}}>{"\u2728"} Optimize</button>
      <button title="Clear all scheduled actions to HOLD." onClick={()=>{setSch(p=>{const c={...p};DAYS.forEach(d=>{c[d]=Array(24).fill("H");});return c;});subSchRef.current={};DAYS.forEach(d=>{subSchRef.current[d]=Array(96).fill("H");});setSubSchRev(v=>v+1);setSchP("Clear");setRtLearn(false);}} style={{...bs,border:schP==="Clear"?"1px solid #60a5fa":"1px solid #1a2744",background:schP==="Clear"?"#3b82f620":"#0d1a2e",color:schP==="Clear"?"#60a5fa":"#4a6a8a"}}>Clear</button>
    </div>);
  };

  // ── Shared override buttons ────────────────────────────────
  const OvrBtns=({compact})=>{
    const items=[{m:"CHARGE",s:"Charge",c:"#22c55e",dis:soc>=maxSoc,tip:"Manual override: force charging at "+chgMW+"MW. Click again to cancel."},{m:"DISCHARGE",s:"Discharge",c:"#ef4444",dis:soc<=minSoc,tip:"Manual override: force discharging at "+disMW+"MW. Click again to cancel."},{m:"HOLD",s:"HOLD",c:"#94a3b8",dis:false,tip:"Manual override: force idle (no charge/discharge). Click again to cancel."}];
    const canRtOpt=ticks.length>=2&&running;
    return(
    <div style={{display:"flex",flexDirection:"column",gap:compact?2:3,minWidth:0}}>
      <div style={{display:"flex",gap:2}}>
        {items.map(o=>(
          <button key={o.m} title={o.tip} disabled={o.dis} onClick={()=>setManual(manual===o.m?null:o.m)} style={{flex:1,minWidth:0,padding:compact?"2px 0":"3px 0",borderRadius:3,cursor:o.dis?"not-allowed":"pointer",fontFamily:"inherit",textAlign:"center",opacity:o.dis?0.35:1,border:manual===o.m?"1.5px solid "+o.c:"1px solid #1a2744",background:manual===o.m?o.c+"15":"#0d1a2e",fontSize:compact?6:7,fontWeight:700,color:manual===o.m?o.c:"#5a7a9a",lineHeight:1.2,overflow:"hidden"}}>{o.s}</button>))}
      </div>
      <div style={{display:"flex",gap:2}}>
        <button title="Follow the painted schedule. For DP-optimized schedules (Naive, Optimize, RT Learn), the sub-hourly DP decisions execute directly. For manually painted schedules, sigma-based overrides may adjust actions." onClick={()=>setManual(null)} style={{flex:1,minWidth:0,padding:compact?"2px 0":"3px 0",borderRadius:3,cursor:"pointer",border:!manual?"1.5px solid #a855f7":"1px solid #1a2744",background:!manual?"#a855f715":"#0d1a2e",fontFamily:"inherit",fontSize:compact?6:7,fontWeight:700,color:!manual?"#a855f7":"#4a6a8a",overflow:"hidden"}}>{compact?"\u23F5 SCHED":"\u23F5 SCHEDULE"}</button>
        <button title={rtLearn?"RT Learning is ON. Tracks actual RT prices per day+hour. Uses day-specific averages for today, cross-day averages for future days. Rebuilds the entire week schedule hourly. Click to disable.":"Enable RT Learning. Observes actual RT prices, builds day-specific and cross-day price models, then re-optimizes the entire week schedule against learned prices instead of forecast."} disabled={!canRtOpt} onClick={toggleRtLearn} style={{flex:1,minWidth:0,padding:compact?"2px 0":"3px 0",borderRadius:3,cursor:canRtOpt?"pointer":"not-allowed",border:rtLearn?"1.5px solid #f59e0b":"1px solid "+(canRtOpt?"#f59e0b60":"#1a2744"),background:rtLearn?"#f59e0b15":"#0d1a2e",fontFamily:"inherit",fontSize:compact?6:7,fontWeight:700,color:canRtOpt?(rtLearn?"#f59e0b":"#f59e0bcc"):"#2a4a6a",overflow:"hidden",opacity:canRtOpt?1:.4,boxShadow:rtLearn?"0 0 6px #f59e0b20":"none"}}>{rtLearn?(compact?"\u26A1 LEARN":"\u26A1 RT LEARN"):(compact?"\u26A1 LEARN":"\u26A1 RT LEARN")}</button>
      </div>
    </div>);
  };

  // ── Shared schedule grid ───────────────────────────────────
  const SchGrid=({compact})=>{
    const DAY_SHORT=["M","T","W","Th","F","Sa","Su"];
    const cellH=compact?(mob?14:9):mob?20:14;
    const headH=compact?(mob?14:10):mob?20:14;
    return(
    <div style={{display:"flex",gap:0,userSelect:"none"}}>
      <div style={{width:compact?14:mob?24:20,paddingTop:headH,display:"flex",flexDirection:"column"}}>
        {Array.from({length:24},(_,h)=>(<div key={h} style={{height:cellH,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:1}}><span style={{fontSize:compact?5:f(7),color:hovH===h?"#22d3ee":"#3a5a7a",fontWeight:hovH===h?700:400}}>{String(h).padStart(2,"0")}</span></div>))}
      </div>
      {DAYS.map((day,di)=>(
        <div key={day} style={{flex:1,minWidth:0}}>
          <div style={{textAlign:"center",height:headH,overflow:"hidden"}}><span style={{fontSize:compact?6:f(8),fontWeight:600,color:day===selDay?"#22d3ee":running&&di===simD?"#f59e0b":"#3a5a7a"}}>{compact?DAY_SHORT[di]:day}</span></div>
          {Array.from({length:24},(_,h)=>{
            const m=sch[day][h],cur=running&&di===simD&&h===simH,hov=hovH===h&&day===selDay;
            // Get sub-hourly actions
            const sub=subSchRef.current[day];
            const subs=sub?[sub[h*4],sub[h*4+1],sub[h*4+2],sub[h*4+3]]:[m,m,m,m];
            const mixed=subs.some(s=>s!==subs[0]);
            return(
            <div key={h} onMouseDown={e=>{e.preventDefault();cellDn(day,h);}} onMouseEnter={()=>cellEn(day,h)} style={{height:cellH,margin:"0.5px",borderRadius:1,cursor:"pointer",overflow:"hidden",border:cur?"1.5px solid #22d3ee":hov?"1px solid #f59e0b40":"1px solid "+(m==="H"?"#151f30":MC[m]+"40"),display:"flex"}}>
              {mixed?subs.map((s,qi)=>(
                <div key={qi} style={{flex:1,background:s==="H"?"#0d1a2e":MC[s]+"80",borderRight:qi<3?"0.5px solid #070e1a":"none"}}/>
              )):<div style={{flex:1,background:m==="H"?"#0d1a2e":MC[m]+"80",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:compact?4:f(6),fontWeight:700,color:m==="H"?"#1a2744":"#fff",opacity:m==="H"?0:.7}}>{ML[m]}</span>
              </div>}
            </div>);})}
        </div>))}
      {!compact&&<div style={{width:mob?70:60,marginLeft:4,paddingTop:headH}}>
        <div style={{fontSize:f(7),color:"#3a5a7a",textAlign:"center",fontWeight:600,marginBottom:1}}>SOC</div>
        {socTraj.map((t,h)=>(
          <div key={h} style={{height:cellH,display:"flex",alignItems:"center",gap:1,margin:"0.5px 0"}}>
            <div style={{flex:1,height:mob?8:6,background:"#0d1a2e",borderRadius:2,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",left:(minSoc+3)+"%",top:0,width:1,height:"100%",background:"#ef444440"}}/>
              <div style={{position:"absolute",left:(maxSoc-2)+"%",top:0,width:1,height:"100%",background:"#22c55e40"}}/>
              <div style={{height:"100%",width:t.soc+"%",borderRadius:2,background:t.clipHi?"#22c55e":t.clipLo?"#ef4444":t.soc>60?"#22c55e50":t.soc>30?"#f59e0b50":"#ef444450"}}/>
            </div>
            <span style={{fontSize:f(7),color:t.clipHi?"#22c55e":t.clipLo?"#ef4444":"#3a5a7a",fontWeight:t.clip?700:400,width:mob?22:18,textAlign:"right"}}>{t.soc.toFixed(0)}</span>
          </div>))}
      </div>}
    </div>);
  };

  // ══════════════════════════════════════════════════════════
  return(
    <div style={{background:"#070e1a",color:"#c8d6e5",fontFamily:"'JetBrains Mono','SF Mono','Fira Code',monospace",minHeight:"100vh",padding:mob?"8px":"10px",fontSize:f(10)}} onMouseUp={()=>setPainting(false)}>

      {/* HEADER */}
      <div style={{display:"flex",flexDirection:mob?"column":"row",alignItems:mob?"stretch":"center",justifyContent:"space-between",marginBottom:6,paddingBottom:5,borderBottom:"1px solid #1a2744",gap:mob?8:0}}>
        <div>
          <div style={{fontSize:f(14),fontWeight:800,letterSpacing:".08em",background:"linear-gradient(90deg,#22d3ee,#3b82f6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SmartBidder™ Crowd Optimized Trading Simulator</div>
          <div style={{fontSize:f(8),color:"#3a5a7a",marginTop:1}}>ERCOT North Hub Jul 2024 &middot; {battMW}MW / {battMWh}MWh ({duration.toFixed(1)}hr) &middot; {rte}% RTE &middot; Chg {chgMW} / Dis {disMW} MW/h &middot; SOC {minSoc}-{maxSoc}%{fleetN>1?<span style={{color:"#a855f7"}}> &middot; {fleetN} units = {(battMW*fleetN).toLocaleString()}MW fleet</span>:null}</div>
        </div>
      </div>

      {/* Mobile nav bar */}
      {mob&&<div style={{display:"flex",gap:0,marginBottom:8,background:"#0b1628",borderRadius:6,border:"1px solid #1a2744",overflow:"hidden"}}>
        {[{k:"trade",icon:"\u25B6",label:"Trade",c:"#22c55e"},{k:"center",icon:"\u2637",label:"Charts",c:"#22d3ee"},{k:"config",icon:"\u2699",label:"Config",c:"#f59e0b"}].map(t=>(
          <button key={t.k} onClick={()=>setMobPanel(t.k)} style={{flex:1,padding:"10px 0",border:"none",borderBottom:mobPanel===t.k?"2px solid "+t.c:"2px solid transparent",background:mobPanel===t.k?t.c+"10":"transparent",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
            <div style={{fontSize:16,lineHeight:1}}>{t.icon}</div>
            <div style={{fontSize:f(7),fontWeight:700,color:mobPanel===t.k?t.c:"#4a6a8a",marginTop:2,letterSpacing:".06em"}}>{t.label}</div>
          </button>))}
      </div>}

      {/* ══════════ UNIFIED LAYOUT ══════════ */}
      <div style={{display:"flex",gap:0,minHeight:0}}>

        {/* ═══ LEFT COLUMN: Live Trading ═══ */}
        {(mob?mobPanel==="trade":!colL)&&<div style={{width:mob?"100%":"180px",flexShrink:0,display:"flex",flexDirection:"column",gap:6,minWidth:0,overflow:"hidden"}}>
          {/* Run controls */}
          <div style={{...P,padding:"6px 8px"}}>
            <div style={{display:"flex",gap:3,marginBottom:4}}>
              <button title={running?"Stop the simulation.":"Start the 7-day ERCOT market simulation. Prices update every 5 simulated minutes."} onClick={()=>setRunning(!running)} style={{flex:1,padding:"4px 8px",borderRadius:3,border:"1px solid "+(running?"#ef4444":"#22c55e"),background:(running?"#ef4444":"#22c55e")+"20",color:running?"#ef4444":"#22c55e",fontFamily:"inherit",fontSize:f(9),fontWeight:700,cursor:"pointer"}}>{running?"\u25A0 STOP":"\u25B6 RUN"}</button>
              <button title="Reset simulation to hour 0, Monday. Clears all P&L, SOC, alerts, and trade history." onClick={reset} style={{padding:"4px 7px",borderRadius:3,border:"1px solid #1a2744",background:"#0d1a2e",color:"#4a6a8a",fontFamily:"inherit",fontSize:f(8),fontWeight:600,cursor:"pointer"}}>RESET</button>
            </div>
            <div style={{display:"flex",gap:2}}>
              {[{l:"1x",v:2000,tip:"Normal speed: 1 simulated hour per ~24 seconds."},{l:"5x",v:400,tip:"Fast: 1 simulated hour per ~5 seconds."},{l:"10x",v:200,tip:"Turbo: 1 simulated hour per ~2.4 seconds."}].map(s=>(
                <button key={s.v} title={s.tip} onClick={()=>setSpeed(s.v)} style={{flex:1,padding:"3px 0",borderRadius:3,border:speed===s.v?"1px solid #3b82f6":"1px solid #1a2744",background:speed===s.v?"#3b82f620":"#0d1a2e",color:speed===s.v?"#60a5fa":"#4a6a8a",fontFamily:"inherit",fontSize:f(8),fontWeight:600,cursor:"pointer",textAlign:"center"}}>{s.l}</button>))}
            </div>
          </div>
          {/* Active mode + system rec unified */}
          <div title="Current battery action. Shows the active mode (Charge/Discharge/Hold) and the system's recommendation. When RT Learning is active, the schedule is rebuilt hourly using accumulated forecast error corrections across the full week." style={{...P,background:(MC[eMode]||"#94a3b8")+"08",borderColor:(MC[eMode]||"#94a3b8")+"30"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{fontSize:f(14),fontWeight:900,color:MC[eMode]||"#94a3b8",lineHeight:1}}>{eMode}</div>
                {manual&&<div style={{fontSize:f(7),fontWeight:700,padding:"1px 4px",borderRadius:2,background:"#f59e0b15",border:"1px solid #f59e0b30",color:"#f59e0b"}}>OVERRIDE</div>}
              </div>
              <div style={{fontSize:f(7),color:"#5a7a9a",textAlign:"right"}}>
                {eMode==="CHARGE"?"Buying "+chgMW+"MW":eMode==="DISCHARGE"?"Selling "+disMW+"MW":"Idle"}{last?" @ $"+last.rt:""}
              </div>
            </div>
            {rec&&rec.tag&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
              <div style={{fontSize:f(7),fontWeight:700,padding:"1px 4px",borderRadius:2,background:(rec.tc||"#f59e0b")+"20",color:rec.tc||"#f59e0b"}}>{rec.tag}</div>
              <div style={{flex:1,height:3,background:"#0d1a2e",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:rec.conf+"%",borderRadius:2,background:MC[rec.mode],transition:"width .3s"}}/></div>
              <span style={{fontSize:f(7),color:"#5a7a9a"}}>{rec.conf}%</span>
            </div>}
            {rec&&<div style={{fontSize:f(7),color:"#5a7a9a",lineHeight:1.4,marginBottom:4}}>{rec.reason}</div>}
            {rec&&rec.ovr&&!manual&&<div style={{padding:"2px 4px",background:"#f59e0b10",borderRadius:2,border:"1px solid #f59e0b20",fontSize:f(7),color:"#f59e0b",marginBottom:4}}>Overriding schedule</div>}
            <div style={{borderTop:"1px solid #1a2744",paddingTop:5}}>
              <div style={{fontSize:f(7),fontWeight:600,color:"#4a6a8a",letterSpacing:".08em",marginBottom:4}}>OVERRIDE</div>
              <OvrBtns/>
              {rtLearn&&<div style={{marginTop:4}}>
                <div onClick={()=>setRlOpen(!rlOpen)} style={{display:"flex",alignItems:"center",gap:3,cursor:"pointer",padding:"3px 0"}}>
                  <span style={{fontSize:f(7),color:"#f59e0b",fontWeight:700,transition:"transform .15s",display:"inline-block",transform:rlOpen?"rotate(90deg)":"rotate(0deg)"}}>{"\u25B6"}</span>
                  <span style={{fontSize:f(7),fontWeight:700,color:"#f59e0b",letterSpacing:".08em"}}>LEARNING SETTINGS</span>
                </div>
                {rlOpen&&<div style={{marginTop:3,padding:"4px 0",borderTop:"1px solid #f59e0b15"}}>
                  <div title="How often the system rebuilds the trading schedule using learned price data. 24hr = once per day at midnight (most stable, least adaptive). 4hr = six times daily (good balance). 1hr = every hour (very adaptive, some churn). 15min = every quarter hour (maximum adaptation, mirrors real-time trading desk behavior). More frequent rebuilds capture intraday price shifts faster but may cause schedule instability.">
                    <div style={{fontSize:f(7),color:"#3a5a7a",fontWeight:700,letterSpacing:".06em",marginBottom:2,marginTop:4}}>REBUILD CADENCE</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:2}}>
                      {[{v:24,l:"24h"},{v:12,l:"12h"},{v:4,l:"4h"},{v:2,l:"2h"},{v:1,l:"1h"},{v:0.5,l:"30m"},{v:0.25,l:"15m"}].map(o=>(
                        <button key={o.v} onClick={()=>setRlRebuildCad(o.v)} style={{padding:"1px 4px",borderRadius:2,cursor:"pointer",fontFamily:"inherit",fontSize:f(7),fontWeight:600,textAlign:"center",border:rlRebuildCad===o.v?"1px solid #f59e0b":"1px solid #1a2744",background:rlRebuildCad===o.v?"#f59e0b15":"#0d1a2e",color:rlRebuildCad===o.v?"#f59e0b":"#4a6a8a"}}>{o.l}</button>
                      ))}
                    </div>
                  </div>
                </div>}
              </div>}
            </div>
          </div>
          {/* State of Charge */}
          <div title={"Current battery energy level. Red/green markers show effective operating SOC bounds (including safety buffers). Current: "+soc.toFixed(0)+"% = "+((soc/100)*battMWh).toFixed(0)+"MWh of "+battMWh+"MWh."} style={P}>
            <div style={LB}>STATE OF CHARGE (SoC)</div>
            <div style={{position:"relative",height:18,background:"#0d1a2e",borderRadius:3,overflow:"hidden",border:"1px solid #1a2744"}}>
              <div style={{position:"absolute",left:(minSoc+3)+"%",top:0,width:1,height:"100%",background:"#ef444460",zIndex:1}}/>
              <div style={{position:"absolute",left:(maxSoc-2)+"%",top:0,width:1,height:"100%",background:"#22c55e60",zIndex:1}}/>
              <div style={{position:"absolute",left:0,top:0,height:"100%",width:soc+"%",borderRadius:3,background:(soc>=maxSoc-2?"#22c55e":soc>60?"#22c55e":soc>30?"#f59e0b":"#ef4444")+"50",transition:"width .4s"}}/>
              <div style={{position:"absolute",width:"100%",textAlign:"center",fontSize:f(9),fontWeight:800,lineHeight:"18px",color:soc>=maxSoc-2?"#22c55e":soc>60?"#22c55e":soc>30?"#f59e0b":"#ef4444",zIndex:2}}>{soc.toFixed(0)}%</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
              <span style={{fontSize:f(7),color:"#ef4444"}}>{minSoc+3}% floor</span>
              <span style={{fontSize:f(7),color:"#3a5a7a",fontWeight:600}}>{((soc/100)*battMWh).toFixed(0)} / {battMWh} MWh</span>
              <span style={{fontSize:f(7),color:"#22c55e"}}>{maxSoc-2}% ceil</span>
            </div>
          </div>
          {/* P&L */}
          <div title="YOU = P&L from your strategy (schedule + RT Learning). NAIVE = P&L from the DAM-only baseline schedule with zero forecast intelligence. Difference shows the value added by your approach." style={P}>
            {fleetN<=1?<div>
              <div style={LB}>P&L: YOU vs NAIVE</div>
              <div style={{display:"flex",justifyContent:"space-around",alignItems:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:f(12),fontWeight:800,color:uPnl>=0?"#22c55e":"#ef4444"}}>${uPnl.toFixed(0)}</div><div style={{fontSize:f(7),color:"#4a6a8a",fontWeight:600}}>YOU</div></div>
                <div style={{width:1,height:24,background:"#1a2744"}}/>
                <div style={{textAlign:"center"}}><div style={{fontSize:f(12),fontWeight:800,color:sPnl>=0?"#22c55e":"#ef4444"}}>${sPnl.toFixed(0)}</div><div style={{fontSize:f(7),color:"#94a3b8",fontWeight:600}}>NAIVE</div></div>
              </div>
              {ticks.length>10&&(()=>{const d=uPnl-sPnl,pct=Math.abs(sPnl)>1?((d/Math.abs(sPnl))*100):0;return(<div style={{textAlign:"center",fontSize:f(8),marginTop:2,color:d>=0?"#22c55e":"#ef4444",fontWeight:600}}>{d>=0?"\u25B2 +$"+d.toFixed(0):"\u25BC -$"+(-d).toFixed(0)}{Math.abs(pct)>=0.1?" ("+(d>=0?"+":"")+pct.toFixed(1)+"%)":""} vs Naive</div>);})()}
            </div>:<div>
              <div style={LB}>P&L: FLEET ({fleetN} UNITS)</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"}}>
                <span style={{fontSize:f(7),color:"#4a6a8a"}}>You (per unit)</span>
                <span style={{fontSize:f(8),fontWeight:700,color:uPnl>=0?"#22c55e":"#ef4444"}}>${uPnl.toFixed(0)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"}}>
                <span style={{fontSize:f(7),color:"#a855f7",fontWeight:600}}>You (fleet)</span>
                <span style={{fontSize:f(12),fontWeight:800,color:uPnl>=0?"#22c55e":"#ef4444"}}>{fmtDol(uPnl*fleetN)}</span>
              </div>
              <div style={{height:1,background:"#1a2744",margin:"4px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"}}>
                <span style={{fontSize:f(7),color:"#94a3b8"}}>Naive (per unit)</span>
                <span style={{fontSize:f(8),fontWeight:700,color:sPnl>=0?"#22c55e":"#ef4444"}}>${sPnl.toFixed(0)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"}}>
                <span style={{fontSize:f(7),color:"#94a3b8",fontWeight:600}}>Naive (fleet)</span>
                <span style={{fontSize:f(12),fontWeight:800,color:sPnl>=0?"#22c55e":"#ef4444"}}>{fmtDol(sPnl*fleetN)}</span>
              </div>
              {ticks.length>10&&(()=>{const d=(uPnl-sPnl)*fleetN,pct=Math.abs(sPnl)>1?((uPnl-sPnl)/Math.abs(sPnl)*100):0;return(<div style={{textAlign:"center",fontSize:f(8),marginTop:4,paddingTop:4,borderTop:"1px solid #1a2744",color:d>=0?"#22c55e":"#ef4444",fontWeight:600}}>{d>=0?"\u25B2 +"+fmtDol(d):"\u25BC -"+fmtDol(-d)}{Math.abs(pct)>=0.1?" ("+(d>=0?"+":"")+pct.toFixed(1)+"%)":""} vs Naive</div>);})()}
            </div>}
          </div>
          {/* Revenue */}
          <div style={P}>
            <div onClick={()=>setProfitOpen(!profitOpen)} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",marginBottom:profitOpen?4:0}}>
              <span style={{fontSize:f(8),color:"#4a6a8a",fontWeight:700,transition:"transform .15s",display:"inline-block",transform:profitOpen?"rotate(90deg)":"rotate(0deg)"}}>{"\u25B6"}</span>
              <div style={{...LB,marginBottom:0}} title="Revenue projections based on your current schedule vs. Naive (DAM-only) and Perfect (hindsight) strategies. Values computed against actual RTM prices.">PROFIT BENCHMARKS</div>
              {!profitOpen&&<span style={{fontSize:f(7),fontWeight:700,color:"#22d3ee",marginLeft:"auto"}}>{fmtDol(revYours)}/d</span>}
            </div>
            {profitOpen&&<div>
            {[{l:"PER UNIT /day",items:[{n:"Naive",v:revNaive,c:"#94a3b8"},{n:"Yours",v:revYours,c:"#22d3ee"},{n:"Perfect",v:revPerf,c:"#22c55e"}]},
              ...(fleetN>1?[{l:"FLEET /day",items:[{n:"Naive",v:revNaive*fleetN,c:"#94a3b8"},{n:"Yours",v:revYours*fleetN,c:"#22d3ee"},{n:"Perfect",v:revPerf*fleetN,c:"#22c55e"}]}]:[]),
              {l:(fleetN>1?"FLEET":"ANNUAL")+" /year",items:[{n:"Naive",v:revNaive*fleetN*365,c:"#94a3b8"},{n:"Yours",v:revYours*fleetN*365,c:"#22d3ee"},{n:"Perfect",v:revPerf*fleetN*365,c:"#22c55e"}]}
            ].map((row,ri)=>(
              <div key={ri} style={{marginBottom:4,...(ri>0?{paddingTop:4,borderTop:"1px solid #1a2744"}:{})}}>
                <div style={{fontSize:f(7),fontWeight:700,color:ri>0&&fleetN>1?"#a855f7":"#4a6a8a",letterSpacing:".06em",marginBottom:2}}>{row.l}</div>
                {row.items.map(r=>(
                  <div key={r.n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1px 0"}}>
                    <span style={{fontSize:f(7),color:"#4a6a8a"}}>{r.n}</span>
                    <span style={{fontSize:f(8),fontWeight:700,color:r.c}}>{fmtDol(r.v)}</span>
                  </div>))}
              </div>))}
            {(()=>{const uplift=(revYours-revNaive)*fleetN*365,ceiling=(revPerf-revNaive)*fleetN*365,pct=ceiling>0?Math.min(100,Math.max(0,(uplift/ceiling)*100)):0;
              return(<div style={{paddingTop:4,borderTop:"1px solid #1a2744"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <span style={{fontSize:f(7),color:"#4a6a8a",fontWeight:600}}>VALUE CAPTURE</span>
                  <span style={{fontSize:f(7),fontWeight:700,color:uplift>=0?"#22c55e":"#ef4444"}}>{uplift>=0?"+":""}{fmtDol(uplift)}/yr</span>
                </div>
                <div style={{height:3,background:"#0d1a2e",borderRadius:2,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",height:"100%",width:pct+"%",borderRadius:2,background:uplift>=0?"linear-gradient(90deg,#22c55e80,#22c55e)":"#ef444480",transition:"width .3s"}}/>
                </div>
              </div>);
            })()}
            </div>}
          </div>
          {/* Alerts */}
          <div style={{...P,maxHeight:110,overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={LB}>ALERTS</div>
              {alerts.length>0&&<span style={{fontSize:f(7),padding:"1px 4px",borderRadius:8,background:"#ef444420",color:"#ef4444",fontWeight:700}}>{alerts.length}</span>}
            </div>
            {alerts.length===0?<div style={{color:"#2a4a6a",fontSize:f(9),textAlign:"center",padding:"4px 0"}}>No events yet</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {alerts.slice(0,8).map((a,idx)=>(<div key={a.id} style={{display:"flex",gap:3,padding:"2px 3px",borderBottom:"1px solid #1a274440",background:idx===0?a.tc+"06":"transparent"}}>
                  <span style={{fontSize:f(7),fontWeight:700,color:a.tc,flexShrink:0}}>{a.tag}</span>
                  <span style={{fontSize:f(7),color:"#5a7a9a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.msg}</span>
                </div>))}
              </div>)}
          </div>
          {/* Trade log */}
          <div style={{...P,maxHeight:100,overflowY:"auto"}}>
            <div style={LB}>TRADE LOG</div>
            {tlog.length===0?<div style={{color:"#2a4a6a",fontSize:f(8)}}>Mode changes logged here.</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:1}}>
                {tlog.map(t=>(<div key={t.id} style={{display:"flex",gap:3,padding:"2px 3px",borderLeft:"2px solid "+(MC[t.mode]||"#94a3b8"),fontSize:f(7)}}>
                  <span style={{color:"#4a6a8a",width:46,flexShrink:0}}>{t.time}</span>
                  <span style={{color:MC[t.mode],fontWeight:700,width:50,flexShrink:0}}>{t.mode}</span>
                  <span style={{color:"#4a6a8a",flex:1}}>${t.rt} | {t.soc}%</span>
                  {t.ovr&&<span style={{fontSize:f(7),color:"#f59e0b",fontWeight:700}}>OVR</span>}
                </div>))}
              </div>)}
          </div>
        </div>}

        {/* Left separator bar */}
        {!mob&&<div onClick={()=>setColL(!colL)} style={{width:colL?12:8,flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:colL?"#22d3ee08":"transparent",borderRadius:3,transition:"all .15s",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.background="#22d3ee10"} onMouseLeave={e=>e.currentTarget.style.background=colL?"#22d3ee08":"transparent"}>
          <div style={{width:2,height:"60%",minHeight:40,borderRadius:1,background:"#1a2744",transition:"background .15s"}}/>
          <div style={{position:"absolute",fontSize:8,fontWeight:700,color:"#3a5a7a",writingMode:"vertical-rl",textOrientation:"mixed",letterSpacing:".1em",opacity:.6}}>{colL?"\u25B6":"\u25C0"}</div>
        </div>}

        {/* ═══ CENTER COLUMN: Charts + Schedule ═══ */}
        {(mob?mobPanel==="center":true)&&<div style={{flex:1,display:"flex",flexDirection:"column",gap:6,minWidth:0,overflow:"hidden"}}>
          {/* Mobile compact run bar */}
          {mob&&<div style={{...P,display:"flex",alignItems:"center",gap:6,padding:"6px 10px"}}>
            <button onClick={()=>setRunning(!running)} style={{padding:"5px 12px",borderRadius:3,border:"1px solid "+(running?"#ef4444":"#22c55e"),background:(running?"#ef4444":"#22c55e")+"20",color:running?"#ef4444":"#22c55e",fontFamily:"inherit",fontSize:f(9),fontWeight:700,cursor:"pointer"}}>{running?"\u25A0 STOP":"\u25B6 RUN"}</button>
            <button onClick={reset} style={{padding:"5px 8px",borderRadius:3,border:"1px solid #1a2744",background:"#0d1a2e",color:"#4a6a8a",fontFamily:"inherit",fontSize:f(8),fontWeight:600,cursor:"pointer"}}>RESET</button>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:f(9),fontWeight:800,color:MC[eMode]||"#94a3b8",lineHeight:1}}>{eMode}</div><div style={{fontSize:f(7),color:"#4a6a8a"}}>MODE</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:f(9),fontWeight:800,color:soc>60?"#22c55e":soc>30?"#f59e0b":"#ef4444",lineHeight:1}}>{soc.toFixed(0)}%</div><div style={{fontSize:f(7),color:"#4a6a8a"}}>SOC</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:f(9),fontWeight:800,color:uPnl>=sPnl?"#22c55e":"#ef4444",lineHeight:1}}>{uPnl>=sPnl?"+":""}{(uPnl-sPnl).toFixed(0)}{Math.abs(sPnl)>1?" ("+(((uPnl-sPnl)/Math.abs(sPnl))*100).toFixed(0)+"%)":""}</div><div style={{fontSize:f(7),color:"#4a6a8a"}}>vs NAV</div></div>
            </div>
          </div>}
          {/* Day tabs */}
          <div style={{display:"flex",gap:3}}>
            {DAYS.map((d,i)=>(
              <button key={d} onClick={()=>setSelDay(d)} style={{flex:1,padding:mob?"6px 2px":"4px 2px",borderRadius:4,cursor:"pointer",fontFamily:"inherit",textAlign:"center",fontSize:f(9),fontWeight:700,border:selDay===d?"1px solid #22d3ee":"1px solid #1a2744",background:selDay===d?"#22d3ee15":"#0d1a2e",color:selDay===d?"#22d3ee":(running&&i===simD?"#f59e0b":"#4a6a8a")}}>
                <div>{d}</div><div style={{fontSize:f(7),fontWeight:400,color:"#3a5a7a"}}>{WEEK[d].date}</div>
              </button>))}
          </div>
          {/* Context row */}
          <div style={{display:"flex",gap:8,padding:mob?"6px 10px":"4px 8px",...P,flexWrap:"wrap"}}>
            {[{l:"DA Avg",v:"$"+(dayD.d.reduce((a,r)=>a+r[1],0)/24).toFixed(0),c:"#94a3b8"},{l:"RT Avg",v:"$"+(dayD.d.reduce((a,r)=>a+r[2],0)/24).toFixed(0),c:"#22d3ee"},{l:"Crowd",v:crowdPct.toFixed(0)+"%",c:"#ef4444"},{l:"MAE",v:"$"+mae.toFixed(1),c:"#f59e0b"},{l:"",v:dayD.note,c:"#5a7a9a",w:true}].map((m,i)=>(
              <div key={i} style={{display:"flex",gap:3,alignItems:"center",flex:m.w?1:0,whiteSpace:"nowrap"}}>
                {m.l&&<span style={{fontSize:f(7),color:"#3a5a7a",fontWeight:600}}>{m.l}</span>}
                <span style={{fontSize:f(9),fontWeight:700,color:m.c}}>{m.v}</span>
              </div>))}
          </div>
          {/* Price chart */}
          <div style={P}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
              <div style={LB}>{dayD.label} PRICE CURVES</div>
              <div style={{display:"flex",gap:10}}>
                {[{l:"DAM",c:"#94a3b8",d:true,tip:"Day-Ahead Market price. Set the prior day. Dashed line."},{l:"Forecast",c:"#f59e0b",tip:"System's blended forecast using supply, demand, and crowd signals at your accuracy settings."+(mktVol>0||supAcc<100||demAcc<100||crdAcc<100?" Shaded band shows total uncertainty: forecast error + market volatility.":"")},
                  ...(rtBiasFcs?[{l:"RT Learned",c:"#f97316",tip:"Learned market prices. Day-specific averages where observed, cross-day averages for unobserved hours. Converges to actual RTM pattern over time."}]:[]),
                  {l:"RTM",c:"#22d3ee",tip:"Real-Time Market price. Actual settlement price the battery trades against."}].map(x=>(
                  <div key={x.l} title={x.tip} style={{display:"flex",alignItems:"center",gap:3,cursor:"help"}}>
                    <svg width="12" height="2"><line x1="0" y1="1" x2="12" y2="1" stroke={x.c} strokeWidth="1.5" strokeDasharray={x.d?"3,2":"none"}/></svg>
                    <span style={{fontSize:f(7),color:"#4a6a8a"}}>{x.l}</span></div>))}
              </div>
            </div>
            <svg width="100%" viewBox={"0 0 "+CW+" "+CH} style={{display:"block"}}
              onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();const mx=(e.clientX-r.left)/r.width*CW;const h=Math.round(((mx-PD.l)/pW)*23);setHovH(h>=0&&h<=23?h:null);}}
              onMouseLeave={()=>setHovH(null)}>
              {cp.yT.map(t=><g key={t.v}><line x1={PD.l} y1={t.py} x2={CW-PD.r} y2={t.py} stroke="#1a2744" strokeWidth=".5"/><text x={PD.l-3} y={t.py+3} textAnchor="end" fill="#3a5a7a" fontSize="7" fontFamily="inherit">${t.v}</text></g>)}
              {[0,4,8,12,16,20].map(h=><text key={h} x={cp.x(h)} y={CH-3} textAnchor="middle" fill="#3a5a7a" fontSize="7" fontFamily="inherit">{String(h).padStart(2,"0")+":00"}</text>)}
              {(()=>{const sub=subSchRef.current[selDay];const qW=pW/23/4;
                return sub?Array.from({length:96},(_, qi)=>{const m=sub[qi];if(m==="H")return null;
                  const h=qi/4;const x=cp.x(h);
                  return <rect key={qi} x={x} y={PD.t} width={qW} height={pH} fill={MC[m]} opacity=".1"/>;
                }):fcs.map((f,i)=>{const m=cp.sch[i];return m!=="H"&&<rect key={i} x={cp.x(i)} y={PD.t} width={pW/23} height={pH} fill={MC[m]} opacity=".08"/>;});
              })()}
              {cp.gap.map((g,i)=>i<23&&<rect key={i} x={g.x} y={g.u} width={pW/23} height={Math.max(1,g.lo-g.u)} fill={g.f} opacity=".06"/>)}
              <path d={cp.dP} fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,3" opacity=".5"/>
              {cp.volBand&&<path d={cp.volBand} fill="#f59e0b" opacity=".08" stroke="none"/>}
              <path d={cp.fP} fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
              {cp.bP&&<path d={cp.bP} fill="none" stroke="#f97316" strokeWidth="1.5" opacity=".85"/>}
              <path d={cp.rP} fill="none" stroke="#22d3ee" strokeWidth="1.5"/>
              {hovH!==null&&(running?hovH!==simH:true)&&(()=>{const fc=fcs[hovH],hx=cp.x(hovH),bv=rtBiasFcs?rtBiasFcs[hovH]:null;
                const bw=cp.bandW[hovH];
                const fcHi=fc.fc+bw,fcLo=fc.fc-bw;
                return(<g>
                <line x1={hx} y1={PD.t} x2={hx} y2={PD.t+pH} stroke="#ffffff20" strokeWidth="1"/>
                {bw>0.5&&<><line x1={hx} y1={cp.y(fcHi)} x2={hx} y2={cp.y(fcLo)} stroke="#f59e0b" strokeWidth="1" opacity=".35"/>
                  <line x1={hx-2} y1={cp.y(fcHi)} x2={hx+2} y2={cp.y(fcHi)} stroke="#f59e0b" strokeWidth="1" opacity=".35"/>
                  <line x1={hx-2} y1={cp.y(fcLo)} x2={hx+2} y2={cp.y(fcLo)} stroke="#f59e0b" strokeWidth="1" opacity=".35"/></>}
                <circle cx={hx} cy={cp.y(fc.dam)} r="2.5" fill="#94a3b8"/><circle cx={hx} cy={cp.y(fc.fc)} r="2.5" fill="#f59e0b"/>{bv!==null&&<circle cx={hx} cy={cp.y(bv)} r="2.5" fill="#f97316"/>}<circle cx={hx} cy={cp.y(fc.rtm)} r="2.5" fill="#22d3ee"/>
                <text x={hx+4} y={PD.t+10} fill="#94a3b8" fontSize="7" fontFamily="inherit">DA ${fc.dam}</text>
                <text x={hx+4} y={PD.t+20} fill="#f59e0b" fontSize="7" fontFamily="inherit">FC ${fc.fc.toFixed(0)}{bw>0.5?" \u00B1"+bw.toFixed(0):""}</text>
                {bv!==null&&<text x={hx+4} y={PD.t+30} fill="#f97316" fontSize="7" fontFamily="inherit">LN ${bv.toFixed(0)}</text>}
                <text x={hx+4} y={PD.t+(bv!==null?40:30)} fill="#22d3ee" fontSize="7" fontFamily="inherit">RT ${fc.rtm}</text>
              </g>);})()}
              {/* Sim playhead */}
              {(running||ticks.length>0)&&selDay===DAYS[simD]&&(()=>{
                const simPos=simH+simM/60,px=cp.x(simPos),rtVal=last?last.rt:null;
                const rtY=rtVal!==null?Math.max(PD.t,Math.min(PD.t+pH,cp.y(rtVal))):PD.t+pH/2;
                const labelY=Math.max(PD.t+2,Math.min(PD.t+pH-8,rtY));
                const flipLabel=px>CW*0.7;
                const hx=cp.x(simH);
                const fc=fcs[simH];
                return(<g>
                  <rect x={PD.l} y={PD.t} width={Math.max(0,px-PD.l)} height={pH} fill="#22d3ee" opacity=".03"/>
                  <line x1={px} y1={PD.t-2} x2={px} y2={PD.t+pH+2} stroke="#22d3ee" strokeWidth="1.5" opacity=".7"/>
                  <line x1={px} y1={PD.t-2} x2={px} y2={PD.t+pH+2} stroke="#22d3ee" strokeWidth="4" opacity=".1"/>
                  <rect x={px-(flipLabel?36:0)} y={PD.t-12} width={36} height={11} rx="2" fill="#0b1628" stroke="#22d3ee" strokeWidth=".5" opacity=".9"/>
                  <text x={px-(flipLabel?36:0)+18} y={PD.t-3.5} textAnchor="middle" fill="#22d3ee" fontSize="7" fontWeight="700" fontFamily="inherit">{String(simH).padStart(2,"0")}:{String(simM).padStart(2,"0")}</text>
                  {fc&&<g>
                    <circle cx={hx} cy={cp.y(fc.dam)} r="2" fill="#94a3b8" opacity=".6"/>
                    <circle cx={hx} cy={cp.y(fc.fc)} r="2" fill="#f59e0b" opacity=".6"/>
                    <circle cx={hx} cy={cp.y(fc.rtm)} r="2" fill="#22d3ee" opacity=".6"/>
                  </g>}
                  {rtVal!==null&&<g>
                    <circle cx={px} cy={rtY} r="6" fill="#22d3ee" opacity=".15"/>
                    <circle cx={px} cy={rtY} r="3.5" fill="#22d3ee" opacity=".3"/>
                    <circle cx={px} cy={rtY} r="2" fill="#fff" stroke="#22d3ee" strokeWidth="1"/>
                    <rect x={flipLabel?px-52:px+6} y={labelY-6} width={46} height={13} rx="2" fill="#0b1628" stroke="#22d3ee40" strokeWidth=".5"/>
                    <text x={flipLabel?px-29:px+29} y={labelY+3} textAnchor="middle" fill="#22d3ee" fontSize="8" fontWeight="800" fontFamily="inherit">RT ${rtVal.toFixed(0)}</text>
                  </g>}
                  {rec&&<g>
                    <rect x={px-(flipLabel?32:0)} y={PD.t+pH+3} width={32} height={10} rx="2" fill={(MC[eMode]||"#94a3b8")+"20"} stroke={(MC[eMode]||"#94a3b8")+"40"} strokeWidth=".5"/>
                    <text x={px-(flipLabel?32:0)+16} y={PD.t+pH+10.5} textAnchor="middle" fill={MC[eMode]||"#94a3b8"} fontSize="6" fontWeight="700" fontFamily="inherit">{eMode==="CHARGE"?"CHG":eMode==="DISCHARGE"?"DIS":"HLD"}</text>
                  </g>}
                </g>);
              })()}
            </svg>
          </div>
          {/* Schedule grid */}
          <div style={P}>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={LB}>CHARGE / DISCHARGE SCHEDULE</div>
                {clipN>0&&<div style={{fontSize:f(7),fontWeight:700,padding:"1px 5px",borderRadius:2,background:"#f59e0b15",border:"1px solid #f59e0b30",color:"#f59e0b"}}>{clipN} partial</div>}
              </div>
              <SchBtns/>
            </div>
            <SchGrid compact={false}/>
            <div style={{fontSize:f(7),color:"#3a5a7a",marginTop:3}}>
              Click: <span style={{color:"#22c55e"}}>CHG</span> {"\u2192"} <span style={{color:"#ef4444"}}>DIS</span> {"\u2192"} HOLD. Drag to paint. Split cells show 15-min optimizer precision.
              {clipN>0&&<span style={{color:"#f59e0b"}}> {clipN}hr partial: SOC near {minSoc}% or {maxSoc}% limit, battery charges/discharges at reduced rate.</span>}
            </div>
          </div>
        </div>}

        {/* Right separator bar */}
        {!mob&&<div onClick={()=>setColR(!colR)} style={{width:colR?12:8,flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:colR?"#22d3ee08":"transparent",borderRadius:3,transition:"all .15s",position:"relative"}} onMouseEnter={e=>e.currentTarget.style.background="#22d3ee10"} onMouseLeave={e=>e.currentTarget.style.background=colR?"#22d3ee08":"transparent"}>
          <div style={{width:2,height:"60%",minHeight:40,borderRadius:1,background:"#1a2744",transition:"background .15s"}}/>
          <div style={{position:"absolute",fontSize:8,fontWeight:700,color:"#3a5a7a",writingMode:"vertical-rl",textOrientation:"mixed",letterSpacing:".1em",opacity:.6}}>{colR?"\u25C0":"\u25B6"}</div>
        </div>}

        {/* ═══ RIGHT COLUMN: Configuration (collapsible) ═══ */}
        {(mob?mobPanel==="config":!colR)&&<div style={{width:mob?"100%":"220px",flexShrink:0,display:"flex",flexDirection:"column",gap:6}}>
          {/* FORECAST ACCURACY */}
          <div style={P}>
            <div title="Controls how accurately the system forecasts real-time prices. Higher accuracy means smaller errors between forecast and actual RT price, leading to better schedule optimization." style={LB}>FORECAST ACCURACY</div>
            {[{k:"sup",v:supAcc,set:setSupAcc,l:"Supply",c:"#3b82f6",tip:"How well the system predicts generation supply (wind, solar, thermal). Higher = less forecast error on the supply side."},{k:"dem",v:demAcc,set:setDemAcc,l:"Demand",c:"#22c55e",tip:"How well the system predicts electricity demand (load). Higher = less forecast error on the demand side."},{k:"crd",v:crdAcc,set:setCrdAcc,l:"Crowd",c:"#ef4444",tip:"How well the system predicts other BESS operators' behavior. Higher = better anticipation of crowding effects that compress RT margins."}].map(s=>(
              <div key={s.k} style={{marginBottom:6}} title={s.tip}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:f(8),color:s.c,fontWeight:600}}>{s.l}</span>
                  <span style={{fontSize:f(9),fontWeight:800,color:s.c}}>{s.v}%</span>
                </div>
                <input type="range" min={0} max={100} value={s.v} onChange={e=>{s.set(+e.target.value);setAccP(null);}} style={{width:"100%",height:4,appearance:"none",WebkitAppearance:"none",background:"#1a2744",borderRadius:2,outline:"none",cursor:"pointer",accentColor:s.c}}/>
              </div>))}
            <div style={{display:"flex",gap:2,flexWrap:"wrap",marginTop:2}}>
              {Object.entries(ACC_PRESETS).map(([n,p])=>(
                <button key={n} title={p.tip} onClick={()=>{setSupAcc(p.sup);setDemAcc(p.dem);setCrdAcc(p.crd);setAccP(n);}} style={{padding:"2px 5px",borderRadius:3,fontSize:f(7),fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:accP===n?"1px solid #60a5fa":"1px solid #1a2744",background:accP===n?"#3b82f610":"#0d1a2e",color:accP===n?"#60a5fa":"#4a6a8a"}}>{n}</button>))}
            </div>
          </div>
          {/* MARKET VOLATILITY */}
          <div style={P}>
            <div title="Controls how much random noise the simulated RT price has around the true RTM value. At 0% the simulation is deterministic (RT = RTM exactly), showing theoretical alpha. At 100% the RT price has high variance around RTM, adding realistic execution slippage. Lower values make it easier to see the value of forecast intelligence. Higher values test robustness." style={LB}>MARKET VOLATILITY</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontSize:f(8),color:"#f59e0b",fontWeight:600}}>{mktVol===0?"Deterministic":mktVol<=15?"Low":mktVol<=40?"Moderate":mktVol<=70?"High":"Extreme"}</span>
              <span style={{fontSize:f(9),fontWeight:800,color:"#f59e0b"}}>{mktVol}%</span>
            </div>
            <input type="range" min={0} max={100} value={mktVol} onChange={e=>setMktVol(+e.target.value)} style={{width:"100%",height:4,appearance:"none",WebkitAppearance:"none",background:"#1a2744",borderRadius:2,outline:"none",cursor:"pointer",accentColor:"#f59e0b"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              {[{v:0,l:"0%"},{v:15,l:"15%"},{v:25,l:"25%"},{v:50,l:"50%"},{v:100,l:"100%"}].map(o=>(
                <button key={o.v} onClick={()=>setMktVol(o.v)} style={{padding:"1px 4px",borderRadius:2,cursor:"pointer",fontFamily:"inherit",fontSize:f(7),fontWeight:600,border:mktVol===o.v?"1px solid #f59e0b":"1px solid #1a2744",background:mktVol===o.v?"#f59e0b15":"#0d1a2e",color:mktVol===o.v?"#f59e0b":"#4a6a8a"}}>{o.l}</button>
              ))}
            </div>
          </div>
          {(()=>{const dpOpt=rtLearn||schP==="Naive"||schP==="Optimized"||schP==="RT Learn";return(
          <div style={{...P,opacity:dpOpt?0.5:1,transition:"opacity .2s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div title="Controls how far RT price must deviate from forecast before the system overrides the schedule. Only applies to manually painted schedules. DP-optimized schedules (Naive, Optimize, RT Learn) bypass sigma overrides." style={LB}>RISK TOLERANCE</div>
              {dpOpt&&<div style={{fontSize:f(7),fontWeight:700,padding:"1px 4px",borderRadius:2,background:"#3b82f615",border:"1px solid #3b82f630",color:"#3b82f6"}}>DP OPT</div>}
            </div>
            <div style={{display:"flex",gap:2}}>
              {[{v:1,l:"1\u03C3",c:"#ef4444",tip:"Aggressive: override schedule when RT deviates >1 standard deviation from forecast. More reactive to price moves, but may over-trade on noise."},{v:2,l:"2\u03C3",c:"#f59e0b",tip:"Balanced: override schedule when RT deviates >2 standard deviations. Filters most noise, responds to significant price dislocations."},{v:3,l:"3\u03C3",c:"#22c55e",tip:"Conservative: override schedule only on >3 sigma moves. Rarely intervenes. Trusts the schedule unless extreme conditions occur."}].map(o=>(
                <button key={o.v} title={dpOpt?"Disabled: DP-optimized schedule runs without sigma overrides.":o.tip} disabled={dpOpt} onClick={()=>setSigTh(o.v)} style={{flex:1,padding:"4px",borderRadius:3,cursor:dpOpt?"not-allowed":"pointer",fontFamily:"inherit",textAlign:"center",border:sigTh===o.v&&!dpOpt?"2px solid "+o.c:"1px solid #1a2744",background:sigTh===o.v&&!dpOpt?o.c+"15":"#0d1a2e"}}>
                  <div style={{fontSize:f(12),fontWeight:800,color:dpOpt?"#2a3a4a":(sigTh===o.v?o.c:"#3a5a7a")}}>{o.l}</div>
                </button>))}
            </div>
          </div>);})()}
          {/* BATTERY CONSTRAINTS (collapsible) */}
          <div style={{...P,border:"1px solid #22d3ee25"}}>
            <div onClick={()=>setBattOpen(!battOpen)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",marginBottom:battOpen?6:0}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:f(8),color:"#22d3ee",fontWeight:700,transition:"transform .15s",display:"inline-block",transform:battOpen?"rotate(90deg)":"rotate(0deg)"}}>{"\u25B6"}</span>
                <div title="Click to expand/collapse battery configuration." style={{...LB,color:"#22d3ee",marginBottom:0}}>BATTERY CONSTRAINTS</div>
              </div>
              {battPreset&&<div style={{fontSize:f(7),fontWeight:600,color:"#22d3ee",padding:"1px 5px",background:"#22d3ee10",borderRadius:2,border:"1px solid #22d3ee30"}}>{battPreset}</div>}
            </div>
            {battOpen&&<div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
              {Object.entries(BATT_PRESETS).map(([n,p])=>(
                <button key={n} onClick={()=>applyBP(n,p)} style={{padding:"3px 6px",borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:f(7),fontWeight:600,border:battPreset===n?"1px solid #22d3ee":"1px solid #1a2744",background:battPreset===n?"#22d3ee10":"#0d1a2e",color:battPreset===n?"#22d3ee":"#5a7a9a"}}>{n}</button>))}
            </div>
            <div style={{fontSize:f(7),color:"#3a5a7a",fontWeight:700,letterSpacing:".06em",marginBottom:3}}>NAMEPLATE</div>
            <NumField label="Power" value={battMW} setValue={setBattMW} min={1} max={500} step={5} unit="MW" color="#22d3ee"/>
            <NumField label="Capacity" value={battMWh} setValue={setBattMWh} min={1} max={2000} step={10} unit="MWh" color="#22d3ee"/>
            <NumField label="RTE" value={rte} setValue={v=>{setRte(Math.max(50,Math.min(100,v)));setBattPreset(null);}} min={50} max={100} step={1} unit="%" color="#f59e0b"/>
            <div style={{height:1,background:"#1a274480",margin:"6px 0"}}/>
            <div style={{fontSize:f(7),color:"#3a5a7a",fontWeight:700,letterSpacing:".06em",marginBottom:3}}>RATE LIMITS</div>
            <NumField label="Charge" value={chgMW} setValue={setChgMW} min={1} max={battMW} step={1} unit="MW/h" color="#22c55e"/>
            <NumField label="Discharge" value={disMW} setValue={setDisMW} min={1} max={battMW} step={1} unit="MW/h" color="#ef4444"/>
            {(chgMW<battMW||disMW<battMW)&&(<div style={{margin:"4px 0 0",padding:"3px 6px",background:"#f59e0b06",borderRadius:3,border:"1px solid #f59e0b15",fontSize:f(7),color:"#f59e0b",lineHeight:1.5}}>{chgMW<battMW&&<span>Chg {chgRatio.toFixed(0)}%</span>}{chgMW<battMW&&disMW<battMW&&" / "}{disMW<battMW&&<span>Dis {disRatio.toFixed(0)}%</span>} of nameplate</div>)}
            <div style={{height:1,background:"#1a274480",margin:"6px 0"}}/>
            <div style={{fontSize:f(7),color:"#3a5a7a",fontWeight:700,letterSpacing:".06em",marginBottom:3}}>SOC BOUNDS</div>
            <NumField label="Min SOC" value={minSoc} setValue={setMinSoc} min={0} max={maxSoc-1} step={1} unit="%" color="#ef4444"/>
            <NumField label="Max SOC" value={maxSoc} setValue={setMaxSoc} min={minSoc+1} max={100} step={1} unit="%" color="#22c55e"/>
            <NumField label="Start SOC" value={startSoc} setValue={setStartSoc} min={minSoc} max={maxSoc} step={1} unit="%" color="#94a3b8"/>
            <div style={{height:1,background:"#1a274480",margin:"6px 0"}}/>
            <div style={{padding:"4px 6px",background:"#0d1a2e",borderRadius:3,border:"1px solid #1a2744"}}>
              <DR l="Duration" v={duration.toFixed(1)+" hr"} c="#22d3ee"/>
              <DR l="Usable Energy" v={usableMWh.toFixed(0)+" MWh"} c="#f59e0b"/>
              <DR l="Start Energy" v={((startSoc/100)*battMWh).toFixed(0)+" MWh"} c="#94a3b8"/>
              <div style={{height:1,background:"#1a274430",margin:"2px 0"}}/>
              <DR l={"Chg "+chgPctHr.toFixed(1)+"%/hr"} v={fullChgHr.toFixed(1)+" hr full"} c="#22c55e"/>
              <DR l={"Dis "+disPctHr.toFixed(1)+"%/hr"} v={fullDisHr.toFixed(1)+" hr empty"} c="#ef4444"/>
            </div>
            </div>}
          </div>
          {/* FLEET SCALE */}
          <div style={{...P,border:"1px solid #a855f725"}}>
            <div title="Scale results across multiple identical BESS units. All units follow the same schedule. P&L and revenue projections multiply by fleet size." style={{...LB,color:"#a855f7",marginBottom:4}}>FLEET SCALE</div>
            <NumField label="Nodes" value={fleetN} setValue={v=>setFleetN(Math.max(1,Math.min(500,Math.round(v))))} min={1} max={500} step={1} unit="units" color="#a855f7"/>
            {fleetN>1&&<div style={{padding:"4px 6px",background:"#a855f708",borderRadius:3,border:"1px solid #a855f720",marginTop:4}}>
              <DR l="Fleet Power" v={(battMW*fleetN)>=1000?((battMW*fleetN)/1000).toFixed(1)+" GW":(battMW*fleetN)+" MW"} c="#a855f7"/>
              <DR l="Fleet Capacity" v={(battMWh*fleetN)>=1000?((battMWh*fleetN)/1000).toFixed(1)+" GWh":(battMWh*fleetN)+" MWh"} c="#a855f7"/>
              <DR l="Fleet Usable" v={(usableMWh*fleetN)>=1000?((usableMWh*fleetN)/1000).toFixed(1)+" GWh":(usableMWh*fleetN).toFixed(0)+" MWh"} c="#a855f7"/>
            </div>}
          </div>
        </div>}
      </div>
    </div>
  );
}