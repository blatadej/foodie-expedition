import { useState, useEffect, useRef } from "react";
import { COUNTRIES } from "./countries.js";
import { roomRef, guestRef, set, update, onValue, get, generateRoomId } from "./firebase.js";

// ─────────────────────────────────────────────────────────────────────────────
// FLAG SVG RENDERERS  — inline, zero network requests
// ─────────────────────────────────────────────────────────────────────────────
const solid  = (bg) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill={bg}/></svg>;
const h2     = (a,b) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill={a}/><rect y={h/2} width={w} height={h/2} fill={b}/></svg>;
const h3     = (a,b,c) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/3} fill={a}/><rect y={h/3} width={w} height={h/3} fill={b}/><rect y={h*2/3} width={w} height={h/3} fill={c}/></svg>;
const h3u    = (a,b,c,t1,t2) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h*t1} fill={a}/><rect y={h*t1} width={w} height={h*(t2-t1)} fill={b}/><rect y={h*t2} width={w} height={h*(1-t2)} fill={c}/></svg>;
const h4     = (a,b,c,d) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/4} fill={a}/><rect y={h/4} width={w} height={h/4} fill={b}/><rect y={h/2} width={w} height={h/4} fill={c}/><rect y={h*3/4} width={w} height={h/4} fill={d}/></svg>;
const h5     = (a,b,c,d,e) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/5} fill={a}/><rect y={h/5} width={w} height={h/5} fill={b}/><rect y={h*2/5} width={w} height={h/5} fill={c}/><rect y={h*3/5} width={w} height={h/5} fill={d}/><rect y={h*4/5} width={w} height={h/5} fill={e}/></svg>;
const v2     = (a,b) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w/2} height={h} fill={a}/><rect x={w/2} width={w/2} height={h} fill={b}/></svg>;
const v3     = (a,b,c) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w/3} height={h} fill={a}/><rect x={w/3} width={w/3} height={h} fill={b}/><rect x={w*2/3} width={w/3} height={h} fill={c}/></svg>;
const v3u    = (a,b,c,s1,s2) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w*s1} height={h} fill={a}/><rect x={w*s1} width={w*(s2-s1)} height={h} fill={b}/><rect x={w*s2} width={w*(1-s2)} height={h} fill={c}/></svg>;
const cross  = (bg,cc) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill={bg}/><rect x={0} y={h*0.31} width={w} height={h*0.38} fill={cc}/><rect x={w*0.36} y={0} width={w*0.28} height={h} fill={cc}/></svg>;
const star   = (bg,sc) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill={bg}/><text x={w/2} y={h*0.68} textAnchor="middle" fontSize={h*0.55} fill={sc}>★</text></svg>;
const circle = (bg,cc,r=0.28) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill={bg}/><circle cx={w/2} cy={h/2} r={h*r} fill={cc}/></svg>;
const diag   = (a,b) => (w,h) => <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill={a}/><polygon points={`0,${h} ${w},0 ${w},${h}`} fill={b}/></svg>;

// Full 195-country flag + colours map, keyed by country name
const FLAGS = {
  // ── AFRICA ──
  "Algeria":               { colors:["#006233","#D21034"], render: v2("#006233","#D21034") },
  "Angola":                { colors:["#CC0000","#000000"], render: h2("#CC0000","#000000") },
  "Benin":                 { colors:["#008751","#FCE100","#DE2110"], render: v3("#008751","#FCE100","#DE2110") },
  "Botswana":              { colors:["#75AADB","#FFFFFF","#000000"], render: h3("#75AADB","#000000","#75AADB") },
  "Burkina Faso":          { colors:["#EF2B2D","#009A00","#FCD116"], render: h2("#EF2B2D","#009A00") },
  "Burundi":               { colors:["#CE1126","#FFFFFF","#1EB53A"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FFFFFF"/><polygon points={`0,0 ${w/2},${h/2} 0,${h}`} fill="#CE1126"/><polygon points={`${w},0 ${w/2},${h/2} ${w},${h}`} fill="#1EB53A"/></svg> },
  "Cameroon":              { colors:["#007A5E","#CE1126","#FCD116"], render: v3("#007A5E","#CE1126","#FCD116") },
  "Cape Verde":            { colors:["#003893","#CF2027","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#003893"/><rect y={h*0.45} width={w} height={h*0.13} fill="#CF2027"/><rect y={h*0.42} width={w} height={h*0.04} fill="#FFFFFF"/><rect y={h*0.58} width={w} height={h*0.04} fill="#FFFFFF"/></svg> },
  "Central African Republic": { colors:["#003082","#289728","#FFCB00","#BC0026"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/4} fill="#003082"/><rect y={h/4} width={w} height={h/4} fill="#FFFFFF"/><rect y={h/2} width={w} height={h/4} fill="#289728"/><rect y={h*3/4} width={w} height={h/4} fill="#FFCB00"/><rect x={w*0.46} width={w*0.08} height={h} fill="#BC0026"/></svg> },
  "Chad":                  { colors:["#002664","#FECB00","#C60C30"], render: v3("#002664","#FECB00","#C60C30") },
  "Comoros":               { colors:["#3A75C4","#3D8948","#FFC61E"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/4} fill="#FFC61E"/><rect y={h/4} width={w} height={h/4} fill="#FFFFFF"/><rect y={h/2} width={w} height={h/4} fill="#CE1126"/><rect y={h*3/4} width={w} height={h/4} fill="#3D8948"/><rect width={w*0.4} height={h} fill="#3A75C4"/></svg> },
  "Congo":                 { colors:["#009543","#DC241F","#FBDE4A"], render: diag("#009543","#DC241F") },
  "DR Congo":              { colors:["#007FFF","#F7D618","#CE1021"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#007FFF"/><line x1={0} y1={h} x2={w} y2={0} stroke="#F7D618" strokeWidth={h*0.18}/><rect width={w*0.25} height={h*0.25} fill="#CE1021"/></svg> },
  "Djibouti":              { colors:["#6AB2E7","#12AD2B","#D7141A"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill="#6AB2E7"/><rect y={h/2} width={w} height={h/2} fill="#12AD2B"/><polygon points={`0,0 ${w*0.42},${h/2} 0,${h}`} fill="#FFFFFF"/></svg> },
  "Egypt":                 { colors:["#CE1126","#FFFFFF","#000000"], render: h3("#CE1126","#FFFFFF","#000000") },
  "Equatorial Guinea":     { colors:["#3E9A00","#FFFFFF","#E32118"], render: h3("#3E9A00","#FFFFFF","#E32118") },
  "Eritrea":               { colors:["#4189DD","#4DC856","#D02B27"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill="#4189DD"/><rect y={h/2} width={w} height={h/2} fill="#4DC856"/><polygon points={`0,0 ${w*0.5},${h/2} 0,${h}`} fill="#D02B27"/></svg> },
  "Eswatini":              { colors:["#3E5EB9","#FFD900","#B10C0C"], render: h3u("#3E5EB9","#FFD900","#3E5EB9",0.25,0.75) },
  "Ethiopia":              { colors:["#078930","#FCDD09","#DA121A"], render: h3("#078930","#FCDD09","#DA121A") },
  "Gabon":                 { colors:["#009E60","#FCD116","#003189"], render: h3("#009E60","#FCD116","#003189") },
  "Gambia":                { colors:["#3A7728","#CE1126","#3E4095"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/5} fill="#3A7728"/><rect y={h/5} width={w} height={h/20} fill="#FFFFFF"/><rect y={h*5/20} width={w} height={h*6/20} fill="#CE1126"/><rect y={h*11/20} width={w} height={h/20} fill="#FFFFFF"/><rect y={h*12/20} width={w} height={h*8/20} fill="#3E4095"/></svg> },
  "Ghana":                 { colors:["#006B3F","#FCD116","#CE1126"], render: h3("#CE1126","#FCD116","#006B3F") },
  "Guinea":                { colors:["#CE1126","#FCD116","#009460"], render: v3("#CE1126","#FCD116","#009460") },
  "Guinea-Bissau":         { colors:["#CE1126","#FCD116","#009E49"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w*0.33} height={h} fill="#CE1126"/><rect x={w*0.33} width={w*0.67} height={h/2} fill="#FCD116"/><rect x={w*0.33} y={h/2} width={w*0.67} height={h/2} fill="#009E49"/></svg> },
  "Ivory Coast":           { colors:["#F77F00","#FFFFFF","#009A44"], render: v3("#F77F00","#FFFFFF","#009A44") },
  "Kenya":                 { colors:["#006600","#BB0000","#000000"], render: h3("#006600","#BB0000","#000000") },
  "Lesotho":               { colors:["#009A44","#FFFFFF","#003580"], render: h3("#009A44","#FFFFFF","#003580") },
  "Liberia":               { colors:["#BF0A30","#FFFFFF","#002868"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#BF0A30"/>{[1,3,5,7,9].map(i=><rect key={i} y={h*i/11} width={w} height={h/11} fill="#FFFFFF"/>)}<rect width={w*0.35} height={h*0.45} fill="#002868"/><text x={w*0.17} y={h*0.3} textAnchor="middle" fontSize={h*0.3} fill="#FFFFFF">★</text></svg> },
  "Libya":                 { colors:["#000000","#FFFFFF","#239E46"], render: h3("#000000","#FFFFFF","#239E46") },
  "Madagascar":            { colors:["#FC3D32","#FFFFFF","#007E3A"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w*0.33} height={h} fill="#FFFFFF"/><rect x={w*0.33} width={w*0.67} height={h/2} fill="#FC3D32"/><rect x={w*0.33} y={h/2} width={w*0.67} height={h/2} fill="#007E3A"/></svg> },
  "Malawi":                { colors:["#000000","#CE1126","#339E35"], render: h3("#000000","#CE1126","#339E35") },
  "Mali":                  { colors:["#14B53A","#FCD116","#CE1126"], render: v3("#14B53A","#FCD116","#CE1126") },
  "Mauritania":            { colors:["#006233","#FFD700"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#006233"/><rect y={0} width={w} height={h*0.12} fill="#FFD700"/><rect y={h*0.88} width={w} height={h*0.12} fill="#FFD700"/><text x={w/2} y={h*0.67} textAnchor="middle" fontSize={h*0.45} fill="#FFD700">☽</text></svg> },
  "Mauritius":             { colors:["#EA2839","#1A206D","#FFD500","#00A551"], render: h4("#EA2839","#1A206D","#FFD500","#00A551") },
  "Morocco":               { colors:["#C1272D","#006233"], render: star("#C1272D","#006233") },
  "Mozambique":            { colors:["#CE1126","#000000","#009A44"], render: h3("#CE1126","#000000","#009A44") },
  "Namibia":               { colors:["#003580","#009A44","#CC0000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#003580"/><polygon points={`0,0 ${w},0 ${w},${h}`} fill="#009A44"/><line x1={0} y1={0} x2={w} y2={h} stroke="#FFFFFF" strokeWidth={h*0.15}/><line x1={0} y1={0} x2={w} y2={h} stroke="#CC0000" strokeWidth={h*0.07}/></svg> },
  "Niger":                 { colors:["#E05206","#FFFFFF","#0DB02B"], render: h3("#E05206","#FFFFFF","#0DB02B") },
  "Nigeria":               { colors:["#008751","#FFFFFF"], render: v3("#008751","#FFFFFF","#008751") },
  "Rwanda":                { colors:["#20603D","#FAD201","#00A1DE"], render: h3("#20603D","#FAD201","#00A1DE") },
  "São Tomé & Príncipe":   { colors:["#12AD2B","#FFCE00","#D21034"], render: h3("#12AD2B","#FFCE00","#D21034") },
  "Senegal":               { colors:["#00853F","#FDEF42","#E31B23"], render: v3("#00853F","#FDEF42","#E31B23") },
  "Seychelles":            { colors:["#003F87","#FCD856","#D62828","#FFFFFF","#007A5E"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`0,${h} ${w},${h} ${w},0`} fill="#007A5E"/><polygon points={`0,${h} ${w},0 ${w*0.75},0`} fill="#FFFFFF"/><polygon points={`0,${h} ${w*0.75},0 ${w*0.5},0`} fill="#D62828"/><polygon points={`0,${h} ${w*0.5},0 ${w*0.25},0`} fill="#FCD856"/><polygon points={`0,${h} ${w*0.25},0 0,0`} fill="#003F87"/></svg> },
  "Sierra Leone":          { colors:["#1EB53A","#FFFFFF","#0072C6"], render: h3("#1EB53A","#FFFFFF","#0072C6") },
  "Somalia":               { colors:["#4189DD","#FFFFFF"], render: star("#4189DD","#FFFFFF") },
  "South Africa":          { colors:["#007A4D","#FFB81C","#E03C31","#002395"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#007A4D"/><rect y={0} width={w} height={h/3} fill="#E03C31"/><rect y={h*2/3} width={w} height={h/3} fill="#002395"/><polygon points={`0,0 ${w*0.45},${h/2} 0,${h}`} fill="#FFB81C"/><polygon points={`0,0 ${w*0.38},${h/2} 0,${h}`} fill="#000000"/></svg> },
  "South Sudan":           { colors:["#078930","#CE1126","#0F47AF"], render: h3("#078930","#000000","#CE1126") },
  "Sudan":                 { colors:["#D21034","#FFFFFF","#000000","#007229"], render: h3("#D21034","#FFFFFF","#000000") },
  "Tanzania":              { colors:["#1EB53A","#FCD116","#000000","#00A3DD"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#1EB53A"/><polygon points={`0,${h} ${w},0 ${w},${h*0.3} 0,${h}`} fill="#00A3DD"/><line x1={0} y1={h} x2={w} y2={0} stroke="#FCD116" strokeWidth={h*0.15}/><line x1={0} y1={h} x2={w} y2={0} stroke="#000000" strokeWidth={h*0.07}/></svg> },
  "Togo":                  { colors:["#006A4E","#FFCE00","#D21034"], render: h5("#006A4E","#FFCE00","#006A4E","#FFCE00","#006A4E") },
  "Tunisia":               { colors:["#E70013","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#E70013"/><circle cx={w/2} cy={h/2} r={h*0.32} fill="#FFFFFF"/><circle cx={w*0.52} cy={h/2} r={h*0.24} fill="#E70013"/></svg> },
  "Uganda":                { colors:["#000000","#FCDC04","#D90000"], render: h3("#000000","#FCDC04","#D90000") },
  "Zambia":                { colors:["#198A00","#EF7D00","#DE2010"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#198A00"/><rect x={w*0.72} width={w*0.09} height={h} fill="#000000"/><rect x={w*0.81} width={w*0.09} height={h} fill="#EF7D00"/><rect x={w*0.90} width={w*0.10} height={h} fill="#DE2010"/></svg> },
  "Zimbabwe":              { colors:["#006400","#FFD200","#D40000"], render: h3("#006400","#FFD200","#D40000") },
  // ── AMERICAS ──
  "Antigua & Barbuda":     { colors:["#CE1126","#0072C6","#FFD100"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#CE1126"/><polygon points={`0,${h} ${w/2},0 ${w},${h}`} fill="#000000"/><polygon points={`${w*0.15},${h} ${w/2},${h*0.3} ${w*0.85},${h}`} fill="#0072C6"/></svg> },
  "Argentina":             { colors:["#74ACDF","#FFFFFF","#F6B40E"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/3} fill="#74ACDF"/><rect y={h/3} width={w} height={h/3} fill="#FFFFFF"/><rect y={h*2/3} width={w} height={h/3} fill="#74ACDF"/><circle cx={w/2} cy={h/2} r={h*0.14} fill="#F6B40E"/></svg> },
  "Bahamas":               { colors:["#00778B","#FFC72C","#000000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/3} fill="#00778B"/><rect y={h/3} width={w} height={h/3} fill="#FFC72C"/><rect y={h*2/3} width={w} height={h/3} fill="#00778B"/><polygon points={`0,0 ${w*0.42},${h/2} 0,${h}`} fill="#000000"/></svg> },
  "Barbados":              { colors:["#00267F","#FFC726"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w/3} height={h} fill="#00267F"/><rect x={w/3} width={w/3} height={h} fill="#FFC726"/><rect x={w*2/3} width={w/3} height={h} fill="#00267F"/></svg> },
  "Belize":                { colors:["#003F87","#CE1126","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#003F87"/><rect y={0} width={w} height={h*0.12} fill="#CE1126"/><rect y={h*0.88} width={w} height={h*0.12} fill="#CE1126"/><circle cx={w/2} cy={h/2} r={h*0.3} fill="#FFFFFF"/></svg> },
  "Bolivia":               { colors:["#D52B1E","#F4E400","#007934"], render: h3("#D52B1E","#F4E400","#007934") },
  "Brazil":                { colors:["#009C3B","#FFDF00","#002776"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#009C3B"/><polygon points={`${w*0.5},${h*0.08} ${w*0.95},${h*0.5} ${w*0.5},${h*0.92} ${w*0.05},${h*0.5}`} fill="#FFDF00"/><circle cx={w/2} cy={h/2} r={h*0.25} fill="#002776"/></svg> },
  "Canada":                { colors:["#D52B1E","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w/4} height={h} fill="#D52B1E"/><rect x={w*3/4} width={w/4} height={h} fill="#D52B1E"/><rect x={w/4} width={w/2} height={h} fill="#FFFFFF"/><text x={w/2} y={h*0.72} textAnchor="middle" fontSize={h*0.65} fill="#D52B1E">🍁</text></svg> },
  "Chile":                 { colors:["#D52B1E","#FFFFFF","#003399"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill="#FFFFFF"/><rect y={h/2} width={w} height={h/2} fill="#D52B1E"/><rect width={w*0.25} height={h/2} fill="#003399"/><text x={w*0.125} y={h*0.36} textAnchor="middle" fontSize={h*0.28} fill="#FFFFFF">★</text></svg> },
  "Colombia":              { colors:["#FCD116","#003087","#CE1126"], render: h3u("#FCD116","#003087","#CE1126",0.4,0.7) },
  "Costa Rica":            { colors:["#002B7F","#FFFFFF","#CE1126"], render: h3u("#002B7F","#CE1126","#002B7F",0.22,0.78) },
  "Cuba":                  { colors:["#002A8F","#FFFFFF","#CF142B"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/5} fill="#CF142B"/><rect y={h/5} width={w} height={h/5} fill="#FFFFFF"/><rect y={h*2/5} width={w} height={h/5} fill="#CF142B"/><rect y={h*3/5} width={w} height={h/5} fill="#FFFFFF"/><rect y={h*4/5} width={w} height={h/5} fill="#CF142B"/><polygon points={`0,0 ${w*0.42},${h/2} 0,${h}`} fill="#002A8F"/></svg> },
  "Dominica":              { colors:["#006B3F","#FCD116","#D4001F"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#006B3F"/><rect x={w*0.44} width={w*0.12} height={h} fill="#000000"/><rect y={h*0.44} width={w} height={h*0.12} fill="#FCD116"/></svg> },
  "Dominican Republic":    { colors:["#002D62","#CF142B","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w/2} height={h/2} fill="#002D62"/><rect x={w/2} y={h/2} width={w/2} height={h/2} fill="#002D62"/><rect x={w/2} width={w/2} height={h/2} fill="#CF142B"/><rect y={h/2} width={w/2} height={h/2} fill="#CF142B"/><rect x={w*0.44} width={w*0.12} height={h} fill="#FFFFFF"/><rect y={h*0.44} width={w} height={h*0.12} fill="#FFFFFF"/></svg> },
  "Ecuador":               { colors:["#FFD100","#003893","#EF3340"], render: h3u("#FFD100","#003893","#EF3340",0.4,0.7) },
  "El Salvador":           { colors:["#0F47AF","#FFFFFF"], render: h3("#0F47AF","#FFFFFF","#0F47AF") },
  "Grenada":               { colors:["#CE1126","#FCD116","#007A5E"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#CE1126"/><polygon points={`${w*0.15},${h*0.15} ${w*0.85},${h*0.15} ${w*0.85},${h*0.85} ${w*0.15},${h*0.85}`} fill="#FCD116"/><polygon points={`${w*0.25},${h*0.25} ${w*0.75},${h*0.25} ${w*0.75},${h*0.75} ${w*0.25},${h*0.75}`} fill="#007A5E"/></svg> },
  "Guatemala":             { colors:["#4997D0","#FFFFFF"], render: v3("#4997D0","#FFFFFF","#4997D0") },
  "Guyana":                { colors:["#009E49","#FCD116","#CE1126"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#009E49"/><polygon points={`0,0 ${w*0.6},${h/2} 0,${h}`} fill="#FCD116"/><polygon points={`0,${h*0.15} ${w*0.4},${h/2} 0,${h*0.85}`} fill="#CE1126"/></svg> },
  "Haiti":                 { colors:["#00209F","#D21034"], render: h2("#00209F","#D21034") },
  "Honduras":              { colors:["#0073CF","#FFFFFF"], render: h3("#0073CF","#FFFFFF","#0073CF") },
  "Jamaica":               { colors:["#000000","#FED100","#007B40"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#007B40"/><polygon points={`0,0 ${w/2},${h/2} 0,${h}`} fill="#000000"/><polygon points={`${w},0 ${w/2},${h/2} ${w},${h}`} fill="#000000"/><line x1={0} y1={0} x2={w} y2={h} stroke="#FED100" strokeWidth={h*0.14}/><line x1={0} y1={h} x2={w} y2={0} stroke="#FED100" strokeWidth={h*0.14}/></svg> },
  "Mexico":                { colors:["#006847","#FFFFFF","#CE1126"], render: v3("#006847","#FFFFFF","#CE1126") },
  "Nicaragua":             { colors:["#3E4A9E","#FFFFFF"], render: h3("#3E4A9E","#FFFFFF","#3E4A9E") },
  "Panama":                { colors:["#FFFFFF","#D21034","#003893"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w/2} height={h/2} fill="#FFFFFF"/><rect x={w/2} y={h/2} width={w/2} height={h/2} fill="#FFFFFF"/><rect x={w/2} width={w/2} height={h/2} fill="#D21034"/><rect y={h/2} width={w/2} height={h/2} fill="#003893"/></svg> },
  "Paraguay":              { colors:["#D52B1E","#FFFFFF","#0038A8"], render: h3("#D52B1E","#FFFFFF","#0038A8") },
  "Peru":                  { colors:["#D91023","#FFFFFF"], render: v3("#D91023","#FFFFFF","#D91023") },
  "Saint Kitts & Nevis":   { colors:["#009E49","#FCD116","#000000","#CE1126"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#009E49"/><rect y={h*0.85} width={w} height={h*0.15} fill="#CE1126"/><rect y={0} width={w} height={h*0.15} fill="#CE1126"/><line x1={0} y1={h} x2={w} y2={0} stroke="#FCD116" strokeWidth={h*0.2}/><line x1={0} y1={h} x2={w} y2={0} stroke="#000000" strokeWidth={h*0.12}/></svg> },
  "Saint Lucia":           { colors:["#65CFFF","#FCD116","#000000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#65CFFF"/><polygon points={`${w/2},${h*0.05} ${w*0.35},${h*0.95} ${w*0.65},${h*0.95}`} fill="#000000"/><polygon points={`${w/2},${h*0.15} ${w*0.4},${h*0.88} ${w*0.6},${h*0.88}`} fill="#FCD116"/></svg> },
  "Saint Vincent":         { colors:["#009E60","#FCD116"], render: v3("#009E60","#FCD116","#009E60") },
  "Suriname":              { colors:["#377E3F","#B40A2D","#ECC81D"], render: h3u("#377E3F","#B40A2D","#377E3F",0.25,0.75) },
  "Trinidad & Tobago":     { colors:["#CE1126","#000000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#CE1126"/><line x1={w*0.1} y1={0} x2={w*0.9} y2={h} stroke="#FFFFFF" strokeWidth={h*0.2}/><line x1={w*0.1} y1={0} x2={w*0.9} y2={h} stroke="#000000" strokeWidth={h*0.12}/></svg> },
  "United States":         { colors:["#BF0A30","#FFFFFF","#002868"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#BF0A30"/>{[1,3,5,7,9,11].map(i=><rect key={i} y={h*i/13} width={w} height={h/13} fill="#FFFFFF"/>)}<rect width={w*0.4} height={h*0.54} fill="#002868"/></svg> },
  "Uruguay":               { colors:["#FFFFFF","#0038A8","#FCD116"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FFFFFF"/>{[1,3,5,7].map(i=><rect key={i} y={h*i/9} width={w} height={h/9} fill="#0038A8"/>)}<rect width={w*0.44} height={h*0.44} fill="#FFFFFF"/><circle cx={w*0.22} cy={h*0.22} r={h*0.14} fill="#FCD116"/></svg> },
  "Venezuela":             { colors:["#CF142B","#003893","#CF9A00"], render: h3("#CF142B","#CF9A00","#003893") },
  // ── ASIA ──
  "Afghanistan":           { colors:["#000000","#D32011","#007A36"], render: v3("#000000","#D32011","#007A36") },
  "Armenia":               { colors:["#D90012","#0033A0","#F2A800"], render: h3("#D90012","#0033A0","#F2A800") },
  "Azerbaijan":            { colors:["#0092BC","#E8192C","#3DB54A"], render: h3("#0092BC","#E8192C","#3DB54A") },
  "Bahrain":               { colors:["#CE1126","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#CE1126"/><path d={`M0,0 L${w*0.35},0 L${w*0.27},${h*0.2} L${w*0.35},${h*0.4} L${w*0.27},${h*0.6} L${w*0.35},${h*0.8} L${w*0.27},${h} L0,${h} Z`} fill="#FFFFFF"/></svg> },
  "Bangladesh":            { colors:["#006A4E","#F42A41"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#006A4E"/><circle cx={w*0.46} cy={h/2} r={h*0.3} fill="#F42A41"/></svg> },
  "Bhutan":                { colors:["#FF8000","#FF0000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`0,0 ${w},0 0,${h}`} fill="#FF8000"/><polygon points={`${w},0 ${w},${h} 0,${h}`} fill="#FF0000"/></svg> },
  "Brunei":                { colors:["#F7E017","#FFFFFF","#000000"], render: h3u("#F7E017","#FFFFFF","#F7E017",0.06,0.94) },
  "Cambodia":              { colors:["#032EA1","#E00025"], render: h3("#032EA1","#E00025","#032EA1") },
  "China":                 { colors:["#DE2910","#FFDE00"], render: star("#DE2910","#FFDE00") },
  "Georgia":               { colors:["#FFFFFF","#FF0000"], render: cross("#FFFFFF","#FF0000") },
  "India":                 { colors:["#FF9933","#FFFFFF","#138808"], render: h3("#FF9933","#FFFFFF","#138808") },
  "Indonesia":             { colors:["#CE1126","#FFFFFF"], render: h2("#CE1126","#FFFFFF") },
  "Iran":                  { colors:["#239F40","#FFFFFF","#DA0000"], render: h3("#239F40","#FFFFFF","#DA0000") },
  "Iraq":                  { colors:["#CE1126","#FFFFFF","#000000"], render: h3("#CE1126","#FFFFFF","#000000") },
  "Israel":                { colors:["#FFFFFF","#0038B8"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FFFFFF"/><rect y={h*0.15} width={w} height={h*0.1} fill="#0038B8"/><rect y={h*0.75} width={w} height={h*0.1} fill="#0038B8"/><polygon points={`${w/2},${h*0.32} ${w*0.38},${h*0.52} ${w*0.62},${h*0.52}`} fill="none" stroke="#0038B8" strokeWidth="2"/><polygon points={`${w/2},${h*0.68} ${w*0.38},${h*0.48} ${w*0.62},${h*0.48}`} fill="none" stroke="#0038B8" strokeWidth="2"/></svg> },
  "Japan":                 { colors:["#BC002D","#FFFFFF"], render: circle("#FFFFFF","#BC002D") },
  "Jordan":                { colors:["#007A3D","#FFFFFF","#CE1126","#000000"], render: h3("#000000","#FFFFFF","#007A3D") },
  "Kazakhstan":            { colors:["#00AFCA","#FFE900"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#00AFCA"/><circle cx={w*0.55} cy={h/2} r={h*0.24} fill="#FFE900"/></svg> },
  "Kuwait":                { colors:["#007A3D","#CE1126","#000000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/3} fill="#007A3D"/><rect y={h/3} width={w} height={h/3} fill="#FFFFFF"/><rect y={h*2/3} width={w} height={h/3} fill="#CE1126"/><polygon points={`0,0 ${w*0.33},${h/2} 0,${h}`} fill="#000000"/></svg> },
  "Kyrgyzstan":            { colors:["#E8112D","#FFD700"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#E8112D"/><circle cx={w/2} cy={h/2} r={h*0.3} fill="#FFD700"/><circle cx={w/2} cy={h/2} r={h*0.18} fill="#E8112D"/></svg> },
  "Laos":                  { colors:["#CE1126","#002868","#FFFFFF"], render: h3u("#CE1126","#002868","#CE1126",0.25,0.75) },
  "Lebanon":               { colors:["#EE161F","#FFFFFF","#00A550"], render: h3u("#EE161F","#FFFFFF","#EE161F",0.33,0.67) },
  "Malaysia":              { colors:["#CC0001","#FFFFFF","#010066","#FFCC00"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FFFFFF"/>{[0,2,4,6,8,10,12].map(i=><rect key={i} y={h*i/14} width={w} height={h/14} fill="#CC0001"/>)}<rect width={w*0.5} height={h*0.5} fill="#010066"/></svg> },
  "Maldives":              { colors:["#D21034","#007E3A","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#D21034"/><rect x={w*0.14} y={h*0.18} width={w*0.72} height={h*0.64} fill="#007E3A"/><circle cx={w*0.52} cy={h/2} r={h*0.22} fill="#FFFFFF"/><circle cx={w*0.56} cy={h/2} r={h*0.22} fill="#007E3A"/></svg> },
  "Mongolia":              { colors:["#C4272F","#015197","#F9CF02"], render: v3("#C4272F","#015197","#C4272F") },
  "Myanmar":               { colors:["#FECB00","#34B233","#EA2839"], render: h3("#FECB00","#34B233","#EA2839") },
  "Nepal":                 { colors:["#FFFFFF","#003893","#DC143C"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FFFFFF"/><polygon points={`${w*0.08},${h*0.05} ${w*0.58},${h*0.52} ${w*0.08},${h*0.52}`} fill="#003893"/><polygon points={`${w*0.08},${h*0.52} ${w*0.7},${h*0.52} ${w*0.08},${h*0.97}`} fill="#003893"/><polygon points={`${w*0.1},${h*0.07} ${w*0.56},${h*0.51} ${w*0.1},${h*0.51}`} fill="#DC143C"/><polygon points={`${w*0.1},${h*0.51} ${w*0.67},${h*0.51} ${w*0.1},${h*0.95}`} fill="#DC143C"/></svg> },
  "North Korea":           { colors:["#024FA2","#BE0027","#FFFFFF"], render: h3u("#024FA2","#BE0027","#024FA2",0.22,0.78) },
  "Oman":                  { colors:["#DB161B","#FFFFFF","#008000"], render: h3u("#FFFFFF","#DB161B","#008000",0.33,0.67) },
  "Pakistan":              { colors:["#01411C","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w*0.25} height={h} fill="#FFFFFF"/><rect x={w*0.25} width={w*0.75} height={h} fill="#01411C"/><circle cx={w*0.55} cy={h/2} r={h*0.26} fill="#FFFFFF"/><circle cx={w*0.61} cy={h/2} r={h*0.2} fill="#01411C"/></svg> },
  "Palestine":             { colors:["#000000","#FFFFFF","#CE1126"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/3} fill="#000000"/><rect y={h/3} width={w} height={h/3} fill="#FFFFFF"/><rect y={h*2/3} width={w} height={h/3} fill="#CE1126"/><polygon points={`0,0 ${w*0.4},${h/2} 0,${h}`} fill="#CE1126"/></svg> },
  "Philippines":           { colors:["#0038A8","#CE1126","#FCD116"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill="#0038A8"/><rect y={h/2} width={w} height={h/2} fill="#CE1126"/><polygon points={`0,0 ${w*0.4},${h/2} 0,${h}`} fill="#FFFFFF"/></svg> },
  "Qatar":                 { colors:["#8D1B3D","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#8D1B3D"/><rect width={w*0.3} height={h} fill="#FFFFFF"/></svg> },
  "Saudi Arabia":          { colors:["#006C35","#FFFFFF"], render: star("#006C35","#FFFFFF") },
  "Singapore":             { colors:["#EF3340","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill="#EF3340"/><rect y={h/2} width={w} height={h/2} fill="#FFFFFF"/><circle cx={w*0.22} cy={h*0.28} r={h*0.18} fill="#FFFFFF"/><circle cx={w*0.28} cy={h*0.28} r={h*0.18} fill="#EF3340"/></svg> },
  "South Korea":           { colors:["#FFFFFF","#CD2E3A","#003478"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FFFFFF"/><circle cx={w/2} cy={h/2} r={h*0.26} fill="#CD2E3A"/><path d={`M${w*0.35},${h*0.26} A${h*0.26},${h*0.26} 0 0,0 ${w*0.65},${h*0.74}`} fill="#003478"/></svg> },
  "Sri Lanka":             { colors:["#8D153A","#DF7900","#006B3F"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#8D153A"/><rect x={w*0.15} width={w*0.1} height={h} fill="#006B3F"/><rect x={w*0.25} width={w*0.1} height={h} fill="#DF7900"/><rect x={w*0.35} y={h*0.1} width={w*0.55} height={h*0.8} fill="#DF7900"/></svg> },
  "Syria":                 { colors:["#CE1126","#FFFFFF","#000000"], render: h3("#CE1126","#FFFFFF","#000000") },
  "Taiwan":                { colors:["#FE0000","#000095","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FE0000"/><rect width={w/2} height={h/2} fill="#000095"/><circle cx={w/4} cy={h/4} r={h*0.16} fill="#FFFFFF"/></svg> },
  "Tajikistan":            { colors:["#CC0000","#FFFFFF","#006600"], render: h3("#CC0000","#FFFFFF","#006600") },
  "Thailand":              { colors:["#A51931","#FFFFFF","#2D2A4A"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#A51931"/><rect y={h/5} width={w} height={h/5} fill="#FFFFFF"/><rect y={h*2/5} width={w} height={h/5} fill="#2D2A4A"/><rect y={h*3/5} width={w} height={h/5} fill="#FFFFFF"/></svg> },
  "Timor-Leste":           { colors:["#DC241F","#FFC726","#000000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#DC241F"/><polygon points={`0,0 ${w*0.5},${h/2} 0,${h}`} fill="#FFC726"/><polygon points={`0,0 ${w*0.4},${h/2} 0,${h}`} fill="#000000"/></svg> },
  "Turkey":                { colors:["#E30A17","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#E30A17"/><circle cx={w*0.42} cy={h/2} r={h*0.28} fill="#FFFFFF"/><circle cx={w*0.52} cy={h/2} r={h*0.22} fill="#E30A17"/><text x={w*0.64} y={h*0.62} textAnchor="middle" fontSize={h*0.3} fill="#FFFFFF">★</text></svg> },
  "Turkmenistan":          { colors:["#1C6B30","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#1C6B30"/><rect x={w*0.15} width={w*0.12} height={h} fill="#AD1F25"/></svg> },
  "United Arab Emirates":  { colors:["#00732F","#FFFFFF","#000000","#FF0000"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/3} fill="#00732F"/><rect y={h/3} width={w} height={h/3} fill="#FFFFFF"/><rect y={h*2/3} width={w} height={h/3} fill="#000000"/><rect width={w*0.25} height={h} fill="#FF0000"/></svg> },
  "Uzbekistan":            { colors:["#1EB53A","#FFFFFF","#CE1126"], render: h3("#1EB53A","#FFFFFF","#CE1126") },
  "Vietnam":               { colors:["#DA251D","#FFCD00"], render: star("#DA251D","#FFCD00") },
  "Yemen":                 { colors:["#CE1126","#FFFFFF","#000000"], render: h3("#CE1126","#FFFFFF","#000000") },
  // ── EUROPE ──
  "Albania":               { colors:["#E41E20","#000000"], render: star("#E41E20","#000000") },
  "Andorra":               { colors:["#003DA5","#FFCB00","#C7B37F"], render: v3("#003DA5","#FFCB00","#C7B37F") },
  "Austria":               { colors:["#ED2939","#FFFFFF"], render: h3("#ED2939","#FFFFFF","#ED2939") },
  "Belarus":               { colors:["#CF101A","#4AA657","#FFFFFF"], render: h3u("#CF101A","#FFFFFF","#4AA657",0.67,1.0) },
  "Belgium":               { colors:["#000000","#FAE042","#EF3340"], render: v3("#000000","#FAE042","#EF3340") },
  "Bosnia & Herzegovina":  { colors:["#002395","#FFCB00"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#002395"/><polygon points={`${w*0.2},0 ${w*0.8},0 ${w*0.8},${h}`} fill="#FFCB00"/></svg> },
  "Bulgaria":              { colors:["#FFFFFF","#00966E","#D62612"], render: h3("#FFFFFF","#00966E","#D62612") },
  "Croatia":               { colors:["#FF0000","#FFFFFF","#0000FF"], render: h3("#FF0000","#FFFFFF","#0000FF") },
  "Cyprus":                { colors:["#FFFFFF","#D47600"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FFFFFF"/><rect y={h*0.85} width={w} height={h*0.08} fill="#4CAF50"/><rect y={h*0.07} width={w} height={h*0.08} fill="#4CAF50"/></svg> },
  "Czech Republic":        { colors:["#D7141A","#FFFFFF","#11457E"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill="#FFFFFF"/><rect y={h/2} width={w} height={h/2} fill="#D7141A"/><polygon points={`0,0 ${w*0.45},${h/2} 0,${h}`} fill="#11457E"/></svg> },
  "Denmark":               { colors:["#C60C30","#FFFFFF"], render: cross("#C60C30","#FFFFFF") },
  "Estonia":               { colors:["#0072CE","#FFFFFF","#000000"], render: h3("#0072CE","#FFFFFF","#000000") },
  "Finland":               { colors:["#FFFFFF","#003580"], render: cross("#FFFFFF","#003580") },
  "France":                { colors:["#002395","#FFFFFF","#ED2939"], render: v3("#002395","#FFFFFF","#ED2939") },
  "Germany":               { colors:["#000000","#DD0000","#FFCE00"], render: h3("#000000","#DD0000","#FFCE00") },
  "Greece":                { colors:["#0D5EAF","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#0D5EAF"/>{[1,3,5,7].map(i=><rect key={i} y={h*i/9} width={w} height={h/9} fill="#FFFFFF"/>)}<rect width={w*0.38} height={h*0.44} fill="#0D5EAF"/><rect x={w*0.13} width={w*0.12} height={h*0.44} fill="#FFFFFF"/><rect y={h*0.16} width={w*0.38} height={h*0.12} fill="#FFFFFF"/></svg> },
  "Hungary":               { colors:["#CE2939","#FFFFFF","#436F4D"], render: h3("#CE2939","#FFFFFF","#436F4D") },
  "Iceland":               { colors:["#003897","#D72828","#FFFFFF"], render: cross("#003897","#D72828") },
  "Ireland":               { colors:["#169B62","#FFFFFF","#FF883E"], render: v3("#169B62","#FFFFFF","#FF883E") },
  "Italy":                 { colors:["#009246","#FFFFFF","#CE2B37"], render: v3("#009246","#FFFFFF","#CE2B37") },
  "Kosovo":                { colors:["#244AA5","#E4AA3E"], render: star("#244AA5","#E4AA3E") },
  "Latvia":                { colors:["#9E3039","#FFFFFF"], render: h3u("#9E3039","#FFFFFF","#9E3039",0.4,0.6) },
  "Liechtenstein":         { colors:["#002B7F","#CE1126","#FFD83D"], render: h2("#002B7F","#CE1126") },
  "Lithuania":             { colors:["#FDB913","#006A44","#C1272D"], render: h3("#FDB913","#006A44","#C1272D") },
  "Luxembourg":            { colors:["#EF3340","#FFFFFF","#00A3E0"], render: h3("#EF3340","#FFFFFF","#00A3E0") },
  "Malta":                 { colors:["#FFFFFF","#CF142B"], render: v2("#FFFFFF","#CF142B") },
  "Moldova":               { colors:["#003DA5","#FFD200","#CC0001"], render: v3("#003DA5","#FFD200","#CC0001") },
  "Monaco":                { colors:["#CE1126","#FFFFFF"], render: h2("#CE1126","#FFFFFF") },
  "Montenegro":            { colors:["#D4AF37","#D4101B"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#D4101B"/><rect x={w*0.03} y={h*0.06} width={w*0.94} height={h*0.88} fill="#D4AF37"/></svg> },
  "Netherlands":           { colors:["#AE1C28","#FFFFFF","#21468B"], render: h3("#AE1C28","#FFFFFF","#21468B") },
  "North Macedonia":       { colors:["#CE2028","#F7E34B"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#CE2028"/><circle cx={w/2} cy={h/2} r={h*0.18} fill="#F7E34B"/>{[0,1,2,3,4,5,6,7].map(i=><line key={i} x1={w/2} y1={h/2} x2={w/2+Math.cos(i*Math.PI/4)*w*0.5} y2={h/2+Math.sin(i*Math.PI/4)*h*0.5} stroke="#F7E34B" strokeWidth={h*0.04}/>)}</svg> },
  "Norway":                { colors:["#EF2B2D","#FFFFFF","#002868"], render: cross("#EF2B2D","#002868") },
  "Poland":                { colors:["#FFFFFF","#DC143C"], render: h2("#FFFFFF","#DC143C") },
  "Portugal":              { colors:["#006600","#FF0000"], render: v3u("#006600","#FF0000","#FF0000",0.38,1.0) },
  "Romania":               { colors:["#002B7F","#FCD116","#CE1126"], render: v3("#002B7F","#FCD116","#CE1126") },
  "Russia":                { colors:["#FFFFFF","#0039A6","#D52B1E"], render: h3("#FFFFFF","#0039A6","#D52B1E") },
  "San Marino":            { colors:["#5EB6E4","#FFFFFF"], render: h2("#5EB6E4","#FFFFFF") },
  "Serbia":                { colors:["#C6363C","#0C4077","#FFFFFF"], render: h3("#C6363C","#0C4077","#FFFFFF") },
  "Slovakia":              { colors:["#FFFFFF","#0B4EA2","#EE1C25"], render: h3("#FFFFFF","#0B4EA2","#EE1C25") },
  "Slovenia":              { colors:["#FFFFFF","#003DA5","#EF3340"], render: h3("#FFFFFF","#003DA5","#EF3340") },
  "Spain":                 { colors:["#AA151B","#F1BF00"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h*0.25} fill="#AA151B"/><rect y={h*0.25} width={w} height={h*0.5} fill="#F1BF00"/><rect y={h*0.75} width={w} height={h*0.25} fill="#AA151B"/></svg> },
  "Sweden":                { colors:["#006AA7","#FECC02"], render: cross("#006AA7","#FECC02") },
  "Switzerland":           { colors:["#FF0000","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#FF0000"/><rect x={w*0.38} y={h*0.2} width={w*0.24} height={h*0.6} fill="#FFFFFF"/><rect x={w*0.2} y={h*0.38} width={w*0.6} height={h*0.24} fill="#FFFFFF"/></svg> },
  "Ukraine":               { colors:["#005BBB","#FFD500"], render: h2("#005BBB","#FFD500") },
  "United Kingdom":        { colors:["#012169","#C8102E","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#012169"/><line x1={0} y1={0} x2={w} y2={h} stroke="#FFFFFF" strokeWidth={h*0.2}/><line x1={w} y1={0} x2={0} y2={h} stroke="#FFFFFF" strokeWidth={h*0.2}/><line x1={0} y1={0} x2={w} y2={h} stroke="#C8102E" strokeWidth={h*0.1}/><line x1={w} y1={0} x2={0} y2={h} stroke="#C8102E" strokeWidth={h*0.1}/><rect x={w*0.42} width={w*0.16} height={h} fill="#FFFFFF"/><rect y={h*0.42} width={w} height={h*0.16} fill="#FFFFFF"/><rect x={w*0.44} width={w*0.12} height={h} fill="#C8102E"/><rect y={h*0.44} width={w} height={h*0.12} fill="#C8102E"/></svg> },
  "Vatican City":          { colors:["#FFE000","#FFFFFF"], render: v2("#FFE000","#FFFFFF") },
  // ── OCEANIA ──
  "Australia":             { colors:["#00008B","#FF0000","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#00008B"/><rect width={w*0.44} height={h*0.44} fill="#00008B"/><line x1={0} y1={0} x2={w*0.44} y2={h*0.44} stroke="#FFFFFF" strokeWidth={h*0.16}/><line x1={w*0.44} y1={0} x2={0} y2={h*0.44} stroke="#FFFFFF" strokeWidth={h*0.16}/><line x1={0} y1={0} x2={w*0.44} y2={h*0.44} stroke="#FF0000" strokeWidth={h*0.08}/><line x1={w*0.44} y1={0} x2={0} y2={h*0.44} stroke="#FF0000" strokeWidth={h*0.08}/><rect x={w*0.19} width={w*0.06} height={h*0.44} fill="#FFFFFF"/><rect y={h*0.19} width={w*0.44} height={h*0.06} fill="#FFFFFF"/></svg> },
  "Fiji":                  { colors:["#68BFE5","#003F87","#CE1126"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#68BFE5"/><rect width={w*0.4} height={h*0.44} fill="#003F87"/></svg> },
  "Kiribati":              { colors:["#CE1126","#003F87","#FFD100"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h*0.5} fill="#CE1126"/><rect y={h*0.5} width={w} height={h*0.5} fill="#003F87"/><circle cx={w/2} cy={h*0.38} r={h*0.18} fill="#FFD100"/></svg> },
  "Marshall Islands":      { colors:["#003087","#FF8200","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#003087"/><line x1={0} y1={h} x2={w} y2={0} stroke="#FF8200" strokeWidth={h*0.15}/><line x1={0} y1={h*1.1} x2={w*1.1} y2={0} stroke="#FFFFFF" strokeWidth={h*0.08}/></svg> },
  "Micronesia":            { colors:["#75B2DD","#FFFFFF"], render: star("#75B2DD","#FFFFFF") },
  "Nauru":                 { colors:["#002B7F","#FFC61E","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#002B7F"/><rect y={h*0.46} width={w} height={h*0.08} fill="#FFC61E"/></svg> },
  "New Zealand":           { colors:["#00247D","#CC142B","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#00247D"/><rect width={w*0.44} height={h*0.44} fill="#00247D"/><line x1={0} y1={0} x2={w*0.44} y2={h*0.44} stroke="#FFFFFF" strokeWidth={h*0.16}/><line x1={w*0.44} y1={0} x2={0} y2={h*0.44} stroke="#FFFFFF" strokeWidth={h*0.16}/><line x1={0} y1={0} x2={w*0.44} y2={h*0.44} stroke="#CC142B" strokeWidth={h*0.08}/><line x1={w*0.44} y1={0} x2={0} y2={h*0.44} stroke="#CC142B" strokeWidth={h*0.08}/><rect x={w*0.19} width={w*0.06} height={h*0.44} fill="#FFFFFF"/><rect y={h*0.19} width={w*0.44} height={h*0.06} fill="#FFFFFF"/></svg> },
  "Palau":                 { colors:["#4AADD6","#FFDE00"], render: circle("#4AADD6","#FFDE00",0.25) },
  "Papua New Guinea":      { colors:["#000000","#CE1126","#FCD116"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`0,0 ${w},0 0,${h}`} fill="#000000"/><polygon points={`${w},0 ${w},${h} 0,${h}`} fill="#CE1126"/></svg> },
  "Samoa":                 { colors:["#CE1126","#002868","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#CE1126"/><rect width={w*0.44} height={h*0.44} fill="#002868"/></svg> },
  "Solomon Islands":       { colors:["#0120D3","#007F00","#FDE100"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`0,0 ${w},0 0,${h}`} fill="#0120D3"/><polygon points={`${w},0 ${w},${h} 0,${h}`} fill="#007F00"/><line x1={0} y1={0} x2={w} y2={h} stroke="#FDE100" strokeWidth={h*0.12}/></svg> },
  "Tonga":                 { colors:["#C10000","#FFFFFF"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#C10000"/><rect width={w*0.4} height={h*0.44} fill="#FFFFFF"/><rect x={w*0.17} y={h*0.06} width={w*0.06} height={h*0.32} fill="#C10000"/><rect x={w*0.08} y={h*0.18} width={w*0.24} height={h*0.06} fill="#C10000"/></svg> },
  "Tuvalu":                { colors:["#009FCA","#FFFFFF","#002868"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h} fill="#009FCA"/><rect width={w*0.44} height={h*0.44} fill="#002868"/><line x1={0} y1={0} x2={w*0.44} y2={h*0.44} stroke="#FFFFFF" strokeWidth={h*0.14}/><line x1={w*0.44} y1={0} x2={0} y2={h*0.44} stroke="#FFFFFF" strokeWidth={h*0.14}/></svg> },
  "Vanuatu":               { colors:["#009543","#D21034","#FFD100"], render: (w,h)=><svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect width={w} height={h/2} fill="#009543"/><rect y={h/2} width={w} height={h/2} fill="#D21034"/><polygon points={`0,0 ${w*0.42},${h/2} 0,${h}`} fill="#000000"/><polygon points={`0,${h*0.1} ${w*0.35},${h/2} 0,${h*0.9}`} fill="#FFD100"/></svg> },
};

// Helper: get render fn for a country name, fallback to solid grey
function getFlagRender(name) {
  return FLAGS[name]?.render || solid("#cccccc");
}
function getFlagColors(name) {
  return FLAGS[name]?.colors || ["#cccccc","#ffffff"];
}

// Small flag thumbnail for autocomplete / pills
function FlagThumb({ name, size = 32 }) {
  const render = getFlagRender(name);
  const w = size * (4/3), h = size;
  return (
    <div style={{ width: w, height: h, borderRadius: 3, overflow: "hidden", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
      {render(w, h)}
    </div>
  );
}

// Large flag for reveals / picker preview
function FlagLarge({ name, width = 240, height = 150 }) {
  const render = getFlagRender(name);
  return (
    <div style={{ width, height, borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", margin: "0 auto" }}>
      {render(width, height)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────────────────────
function Confetti({ trigger, colors }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cx = canvas.width / 2, cy = canvas.height * 0.28;
    const particles = Array.from({ length: 120 }, () => ({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 18,
      vy: Math.random() * -16 - 5,
      w: Math.random() * 10 + 5, h: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: Math.random() * 0.45 + 0.25,
    }));
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.98;
        p.rotation += p.rotSpeed; p.opacity -= 0.012;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color; ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger]);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 999 }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getRoomCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("join")?.toUpperCase() || null;
}
function setRoomInUrl(code) {
  const url = new URL(window.location.href);
  url.searchParams.set("join", code);
  window.history.pushState({}, "", url);
}
function clearRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("join");
  window.history.pushState({}, "", url);
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const G = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root {
    min-height: 100%;
    background: #FFFDF7;
    font-family: "Futura", "Century Gothic", "Trebuchet MS", sans-serif;
    color: #1a1a2e;
    -webkit-font-smoothing: antialiased;
  }
  .app { min-height: 100vh; display: flex; flex-direction: column; align-items: center; background: #FFFDF7; }
  .hdr { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 24px 0 8px; }
  .hdr-logo { font-size: 1.1rem; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: #1a1a2e; }
  .hdr-logo span { color: #e8624a; }
  .hdr-sub { font-size: 0.58rem; letter-spacing: 4px; text-transform: uppercase; color: #bbb; margin-top: 3px; }
  .page { width: 100%; max-width: 480px; padding: 0 20px 120px; flex: 1; display: flex; flex-direction: column; }
  .home-wrap { display: flex; flex-direction: column; align-items: center; padding-top: 32px; text-align: center; }
  .home-emoji { font-size: 3.5rem; margin-bottom: 20px; animation: float 3s ease-in-out infinite; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .home-title { font-size: clamp(1.8rem,6vw,2.4rem); font-weight: 500; letter-spacing: 1px; text-transform: uppercase; line-height: 1.1; margin-bottom: 10px; }
  .home-title span { color: #e8624a; }
  .home-desc { font-size: 0.9rem; color: #7a7a8a; line-height: 1.6; max-width: 320px; margin-bottom: 40px; letter-spacing: 0.3px; }
  .home-btns { display: flex; flex-direction: column; gap: 12px; width: 100%; }
  .home-btn { width: 100%; padding: 20px 24px; border-radius: 16px; border: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 16px; transition: transform 0.15s, box-shadow 0.15s; }
  .home-btn:active { transform: scale(0.98); }
  .home-btn-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
  .home-btn-text { flex: 1; }
  .home-btn-title { font-size: 1rem; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 3px; }
  .home-btn-sub { font-size: 0.78rem; opacity: 0.7; letter-spacing: 0.3px; }
  .home-btn-arrow { font-size: 1.2rem; opacity: 0.4; }
  .btn-host { background: #1a1a2e; color: #fff; box-shadow: 0 4px 20px rgba(26,26,46,0.2); }
  .btn-host .home-btn-icon { background: rgba(255,255,255,0.12); }
  .btn-join { background: #fff; color: #1a1a2e; border: 1.5px solid #eee; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
  .btn-join .home-btn-icon { background: #f3f5ff; }
  .btn-rand { background: #fff; color: #1a1a2e; border: 1.5px solid #eee; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
  .btn-rand .home-btn-icon { background: #fff5f3; }
  .topnav { display: flex; align-items: center; justify-content: space-between; padding: 14px 0 20px; }
  .back { width: 38px; height: 38px; border-radius: 50%; border: 1.5px solid #e8e8e8; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: #1a1a2e; transition: border-color 0.2s; }
  .back:hover { border-color: #ccc; }
  .room-pill { display: flex; align-items: center; gap: 7px; background: #1a1a2e; color: #fff; border-radius: 50px; padding: 7px 16px; font-size: 0.9rem; letter-spacing: 3px; cursor: pointer; user-select: none; font-weight: 500; }
  .pill-dot { width: 7px; height: 7px; border-radius: 50%; background: #4CAF50; animation: blink 1.5s ease-in-out infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .steps { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 28px; }
  .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #e0e0e0; transition: all 0.3s; }
  .step-dot.on { background: #e8624a; width: 24px; border-radius: 4px; }
  .step-dot.done { background: #4CAF50; }
  .sec-title { font-size: 1.6rem; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; line-height: 1.1; margin-bottom: 6px; }
  .sec-sub { font-size: 0.75rem; letter-spacing: 3px; text-transform: uppercase; color: #bbb; margin-bottom: 24px; }
  .card { background: #fff; border-radius: 16px; border: 1.5px solid #f0f0f0; padding: 20px; margin-bottom: 12px; }
  .card-label { font-size: 0.6rem; letter-spacing: 3px; text-transform: uppercase; color: #bbb; margin-bottom: 10px; }
  .field { width: 100%; background: #f7f7f7; border: 1.5px solid transparent; border-radius: 12px; padding: 15px 18px; margin-bottom: 10px; font-family: "Futura","Century Gothic","Trebuchet MS",sans-serif; font-size: 0.95rem; letter-spacing: 1px; color: #1a1a2e; outline: none; transition: border-color 0.2s, background 0.2s; }
  .field::placeholder { color: #c0c0c0; }
  .field:focus { border-color: #e8624a; background: #fff; }
  .field-code { text-align: center; font-size: 1.8rem; letter-spacing: 8px; text-transform: uppercase; padding: 18px; }
  .ac { position: relative; width: 100%; }
  .ac-drop { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border-radius: 12px; border: 1.5px solid #f0f0f0; box-shadow: 0 8px 28px rgba(0,0,0,0.08); max-height: 200px; overflow-y: auto; z-index: 300; }
  .ac-opt { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; font-size: 0.9rem; letter-spacing: 0.5px; transition: background 0.1s; border-bottom: 1px solid #f7f7f7; }
  .ac-opt:last-child { border-bottom: none; }
  .ac-opt:hover, .ac-opt.hi { background: #fff5f3; }
  .btn { width: 100%; padding: 17px; border: none; border-radius: 14px; font-family: "Futura","Century Gothic","Trebuchet MS",sans-serif; font-size: 0.82rem; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s, transform 0.12s; }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .btn-primary { background: #e8624a; color: #fff; }
  .btn-dark    { background: #1a1a2e; color: #fff; }
  .btn-ghost   { background: #f0f0f0; color: #1a1a2e; }
  .btn-share   { background: #25D366; color: #fff; }
  .share-box { background: #f7f7f7; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; cursor: pointer; transition: background 0.15s; }
  .share-box:hover { background: #f0f0f0; }
  .share-url { font-size: 0.78rem; color: #7a7a8a; letter-spacing: 0.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .share-copy { font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; color: #e8624a; font-weight: 500; flex-shrink: 0; }
  .guest-list { display: flex; flex-direction: column; }
  .guest-item { display: flex; align-items: center; padding: 13px 0; border-bottom: 1px solid #f5f5f5; gap: 12px; animation: fadeUp 0.3s ease both; }
  .guest-item:last-child { border-bottom: none; }
  .guest-avatar { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #f7f7f7; overflow: hidden; }
  .guest-info { flex: 1; }
  .guest-name { font-size: 0.9rem; font-weight: 500; letter-spacing: 0.5px; }
  .guest-status { font-size: 0.72rem; letter-spacing: 1px; text-transform: uppercase; color: #bbb; margin-top: 2px; }
  .guest-status.ready { color: #4CAF50; }
  .check { color: #4CAF50; font-size: 1.1rem; }
  .pending { color: #f0c040; font-size: 1rem; }
  .wait-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 40px; gap: 14px; }
  .wait-emoji { font-size: 3.5rem; animation: float 2s ease-in-out infinite; }
  .wait-title { font-size: 1.6rem; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; }
  .wait-sub { font-size: 0.82rem; color: #7a7a8a; letter-spacing: 0.5px; line-height: 1.5; max-width: 280px; }
  .wait-guess { background: #fff; border: 1.5px solid #f0f0f0; border-radius: 50px; padding: 10px 22px; font-size: 0.88rem; letter-spacing: 1px; }
  .progress-wrap { width: 80%; background: #f0f0f0; border-radius: 50px; height: 4px; overflow: hidden; }
  .progress-bar { height: 100%; background: #e8624a; border-radius: 50px; transition: width 0.5s; }
  .reveal-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 8px; }
  .reveal-name { font-size: 2rem; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; margin-top: 20px; margin-bottom: 16px; animation: fadeUp 0.35s 0.2s ease both; opacity: 0; }
  .reveal-verdict { padding: 10px 26px; border-radius: 50px; font-size: 0.88rem; letter-spacing: 1px; margin-bottom: 24px; animation: popIn 0.4s 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; opacity: 0; }
  .verdict-ok { background: rgba(76,175,80,0.1); color: #2e7d32; }
  .verdict-no { background: rgba(232,98,74,0.1); color: #c0392b; }
  .scores { width: 100%; animation: fadeUp 0.35s 0.55s ease both; opacity: 0; }
  .score-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid #f5f5f5; }
  .score-row:last-child { border-bottom: none; }
  .s-name { font-size: 0.9rem; font-weight: 500; letter-spacing: 0.5px; }
  .s-guess { font-size: 0.78rem; color: #aaa; margin-top: 2px; letter-spacing: 0.3px; display: flex; align-items: center; gap: 6px; }
  .s-ok { color: #2e7d32; font-size: 0.78rem; letter-spacing: 1.5px; text-transform: uppercase; }
  .s-no { color: #c0392b; font-size: 0.78rem; letter-spacing: 1.5px; text-transform: uppercase; }
  .reveal-actions { width: 100%; margin-top: 24px; animation: fadeUp 0.35s 0.7s ease both; opacity: 0; display: flex; flex-direction: column; gap: 10px; }
  .rand-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 20px; }
  .rand-name { font-size: 2.2rem; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; margin-top: 20px; margin-bottom: 4px; animation: fadeUp 0.35s 0.1s ease both; opacity: 0; }
  .rand-sub  { font-size: 0.68rem; letter-spacing: 4px; text-transform: uppercase; color: #bbb; margin-bottom: 28px; animation: fadeUp 0.35s 0.2s ease both; opacity: 0; }
  .rand-btns { display: flex; gap: 10px; width: 100%; animation: fadeUp 0.35s 0.3s ease both; opacity: 0; }
  .rand-btns .btn { flex: 1; }
  .invite-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 28px; }
  .invite-emoji { font-size: 3rem; margin-bottom: 16px; }
  .invite-title { font-size: 1.6rem; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .invite-sub { font-size: 0.85rem; color: #7a7a8a; line-height: 1.6; margin-bottom: 28px; max-width: 300px; }
  .invite-code { background: #f7f7f7; border-radius: 14px; padding: 14px 28px; margin-bottom: 24px; font-size: 1.8rem; letter-spacing: 6px; color: #e8624a; }
  .sticky { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px 20px 32px; background: linear-gradient(to top, #FFFDF7 60%, transparent); }
  .sticky-inner { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
  .or { display: flex; align-items: center; gap: 12px; margin: 4px 0; color: #ddd; font-size: 0.75rem; letter-spacing: 1px; }
  .or-line { flex: 1; height: 1px; background: #f0f0f0; }
  .err { color: #e8624a; font-size: 0.8rem; letter-spacing: 0.5px; text-align: center; margin: 4px 0 8px; }
  .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%) translateY(8px); background: #1a1a2e; color: #fff; padding: 10px 22px; border-radius: 50px; font-size: 0.82rem; letter-spacing: 1px; opacity: 0; transition: all 0.22s; pointer-events: none; z-index: 999; white-space: nowrap; }
  .toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes popIn  { from{opacity:0;transform:scale(0.75)} to{opacity:1;transform:scale(1)} }
  @keyframes flagReveal { 0%{opacity:0;transform:scale(0.6) rotate(-8deg)} 60%{transform:scale(1.08) rotate(2deg)} 100%{opacity:1;transform:scale(1) rotate(0deg)} }
  .fu { animation: fadeUp 0.32s ease both; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  const t = useRef(null);
  function toast(m) { clearTimeout(t.current); setMsg(m); setOn(true); t.current = setTimeout(() => setOn(false), 2200); }
  return { msg, on, toast };
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY AUTOCOMPLETE  (with SVG flag thumbs)
// ─────────────────────────────────────────────────────────────────────────────
function CountryField({ value, onChange, placeholder = "Search country…" }) {
  const [q, setQ] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(0);
  const wrap = useRef(null);
  const filtered = q.length > 0
    ? COUNTRIES.filter(c => c.name.toLowerCase().startsWith(q.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const fn = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  function pick(c) { setQ(c.name); setOpen(false); onChange(c); }

  return (
    <div className="ac" ref={wrap}>
      <input
        className="field"
        value={q}
        placeholder={placeholder}
        onChange={e => { setQ(e.target.value); setOpen(true); setCur(0); onChange(null); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setCur(c => Math.min(c + 1, filtered.length - 1)); }
          if (e.key === "ArrowUp")   { e.preventDefault(); setCur(c => Math.max(c - 1, 0)); }
          if (e.key === "Enter" && filtered[cur]) pick(filtered[cur]);
          if (e.key === "Escape") setOpen(false);
        }}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="ac-drop">
          {filtered.map((c, i) => (
            <div key={c.name} className={`ac-opt${i === cur ? " hi" : ""}`} onMouseDown={() => pick(c)}>
              <FlagThumb name={c.name} size={22} />
              {c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
function Header() {
  return (
    <div className="hdr">
      <div className="hdr-logo">FOODIE<span>EXPEDITION</span></div>
      <div className="hdr-sub">Randomizer</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVEAL SCREEN — flag SVG + confetti + scorecard
// ─────────────────────────────────────────────────────────────────────────────
function RevealScreen({ room, myGuess, isGuest, onDone, roomId, onCopy }) {
  const guests = room?.guests ? Object.values(room.guests) : [];
  const correct = myGuess?.toLowerCase?.() === room?.country?.toLowerCase?.();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setConfettiTrigger(1), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="page fu">
      <Confetti trigger={confettiTrigger} colors={getFlagColors(room.country)} />
      <div className="topnav">
        <button className="back" onClick={onDone}>←</button>
        {roomId && <div className="room-pill" onClick={onCopy}><span className="pill-dot" />{roomId}</div>}
      </div>
      <div className="reveal-wrap">

        {/* Animated SVG flag */}
        <div style={{ animation: "flagReveal 0.55s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
          <FlagLarge name={room.country} width={260} height={160} />
        </div>

        <div className="reveal-name">{room.country}</div>

        {isGuest && (
          <div className={`reveal-verdict ${correct ? "verdict-ok" : "verdict-no"}`}>
            {correct ? "🎉 You got it right!" : `😅 You guessed ${myGuess}`}
          </div>
        )}

        {guests.length > 0 && (
          <div className="scores">
            {guests.map(g => {
              const ok = g.guess?.toLowerCase() === room.country?.toLowerCase();
              return (
                <div className="score-row" key={g.name}>
                  <div>
                    <div className="s-name">{g.name}</div>
                    <div className="s-guess">
                      <FlagThumb name={g.guess} size={18} />
                      {g.guess}
                    </div>
                  </div>
                  <span className={ok ? "s-ok" : "s-no"}>{ok ? "Correct ✓" : "Wrong ✗"}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="reveal-actions">
          <button className="btn btn-dark" onClick={onDone}>
            {isGuest ? "Back to Home" : "New Expedition"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({ onHost, onJoin, onRand }) {
  return (
    <div className="page">
      <div className="home-wrap fu">
        <div className="home-emoji">🍽️</div>
        <div className="home-title">Foodie<br /><span>Expedition</span></div>
        <div className="home-desc">Cook a mystery cuisine, then let your guests guess where it's from.</div>
        <div className="home-btns">
          <button className="home-btn btn-host" onClick={onHost}>
            <div className="home-btn-icon">🗺️</div>
            <div className="home-btn-text">
              <div className="home-btn-title">Host Expedition</div>
              <div className="home-btn-sub">Create a room & invite guests</div>
            </div>
            <span className="home-btn-arrow">→</span>
          </button>
          <button className="home-btn btn-join" onClick={onJoin}>
            <div className="home-btn-icon">🎟️</div>
            <div className="home-btn-text">
              <div className="home-btn-title">Join Expedition</div>
              <div className="home-btn-sub">Enter a room code to join</div>
            </div>
            <span className="home-btn-arrow">→</span>
          </button>
          <button className="home-btn btn-rand" onClick={onRand}>
            <div className="home-btn-icon">🎲</div>
            <div className="home-btn-text">
              <div className="home-btn-title">Randomise</div>
              <div className="home-btn-sub">Spin for tonight's cuisine</div>
            </div>
            <span className="home-btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RANDOMISER — vertical slot machine with SVG flags
// ─────────────────────────────────────────────────────────────────────────────
const ITEM_H = 130, FLAG_W = 200, FLAG_H = 110, SPIN_DURATION = 3200;
const REEL_REPEAT = 6;
const REEL_DATA = [];
for (let r = 0; r < REEL_REPEAT; r++) COUNTRIES.forEach(c => REEL_DATA.push(c));

function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

function RandomiserScreen({ onBack }) {
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [offset, setOffset] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [confettiColors, setConfettiColors] = useState([]);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const { msg, on, toast } = useToast();

  function spin() {
    if (phase === "spinning") return;
    setResult(null); setConfettiTrigger(0); setPhase("spinning"); setOffset(0);
    const picked = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const idx = COUNTRIES.length * 3 + COUNTRIES.findIndex(c => c.name === picked.name);
    const target = idx * ITEM_H;
    startRef.current = null;
    function animate(ts) {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / SPIN_DURATION, 1);
      setOffset(target * easeOut(p));
      if (p < 1) { rafRef.current = requestAnimationFrame(animate); }
      else {
        setOffset(target); setResult(picked); setPhase("revealed");
        setConfettiColors(getFlagColors(picked.name));
        setConfettiTrigger(t => t + 1);
      }
    }
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => { spin(); return () => cancelAnimationFrame(rafRef.current); }, []);

  return (
    <div className="page fu">
      <Confetti trigger={confettiTrigger} colors={confettiColors} />
      <div className="topnav">
        <button className="back" onClick={onBack}>←</button>
      </div>
      <div className="rand-wrap">

        {/* Slot window */}
        <div style={{
          position: "relative", width: 240, height: ITEM_H,
          overflow: "hidden", borderRadius: 16, background: "#fff",
          boxShadow: phase === "spinning"
            ? "0 12px 48px rgba(232,98,74,0.18), 0 2px 12px rgba(0,0,0,0.06)"
            : "0 4px 24px rgba(0,0,0,0.07)",
          transition: "box-shadow 0.4s",
        }}>
          {/* Fades */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:44, background:"linear-gradient(to bottom,rgba(255,253,247,1),transparent)", zIndex:5, pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:44, background:"linear-gradient(to top,rgba(255,253,247,1),transparent)", zIndex:5, pointerEvents:"none" }} />
          {/* Reel */}
          <div style={{ transform:`translateY(${-offset}px)`, willChange:"transform" }}>
            {REEL_DATA.map((c, i) => (
              <div key={i} style={{ height:ITEM_H, display:"flex", alignItems:"center", justifyContent:"center", padding:"14px 22px" }}>
                <div style={{ width:"100%", borderRadius:6, overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.1)" }}>
                  {getFlagRender(c.name)(FLAG_W, FLAG_H)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {phase === "revealed" && result && (
          <>
            <div className="rand-name">{result.name}</div>
            <div className="rand-sub">Tonight's destination</div>
            <div className="rand-btns">
              <button className="btn btn-ghost" onClick={spin}>↩ Re-spin</button>
              <button className="btn btn-dark" onClick={() => { navigator.clipboard?.writeText(result.name); toast("Copied!"); }}>Copy</button>
            </div>
          </>
        )}
        {phase === "spinning" && (
          <div style={{ marginTop: 24, fontSize: "0.65rem", letterSpacing: "4px", textTransform: "uppercase", color: "#ddd" }}>
            Spinning…
          </div>
        )}
      </div>
      <div className={`toast${on ? " on" : ""}`}>{msg}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOST FLOW
// ─────────────────────────────────────────────────────────────────────────────
function HostFlow({ onBack }) {
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState(null);
  const [roomId] = useState(() => generateRoomId());
  const [room, setRoom] = useState({ guests: {}, phase: "waiting" });
  const { msg, on, toast } = useToast();
  const unsub = useRef(null);

  const shareUrl = `${window.location.origin}${window.location.pathname}?join=${roomId}`;

  useEffect(() => {
    set(roomRef(roomId), { phase: "waiting", guests: {}, country: "", flag: "" });
    unsub.current = onValue(roomRef(roomId), snap => { if (snap.exists()) setRoom(snap.val()); });
    return () => { if (unsub.current) unsub.current(); };
  }, []);

  function copyLink() { navigator.clipboard?.writeText(shareUrl); toast("Link copied! 🎉"); }
  function shareWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(`Join my Foodie Expedition dinner! Tap to guess the cuisine: ${shareUrl}`)}`); }

  async function reveal() {
    await update(roomRef(roomId), { country: country.name, flag: country.flag, phase: "revealed" });
    setStep(4);
  }

  function handleDone() { clearRoomFromUrl(); onBack(); }

  const guests = room?.guests ? Object.values(room.guests) : [];

  if (step === 4) {
    return <RevealScreen room={room} isGuest={false} onDone={handleDone} roomId={roomId} onCopy={copyLink} />;
  }

  return (
    <div className="page fu" style={{ paddingBottom: 120 }}>
      <div className="topnav">
        <button className="back" onClick={onBack}>←</button>
        {step >= 2 && <div className="room-pill" onClick={copyLink}><span className="pill-dot" />{roomId}</div>}
      </div>
      <div className="steps">
        {[1,2,3].map(s => <div key={s} className={`step-dot ${s === step ? "on" : s < step ? "done" : ""}`} />)}
      </div>

      {step === 1 && (
        <>
          <div className="sec-title">What did you<br />cook tonight?</div>
          <div className="sec-sub">Pick the secret country</div>
          <div className="card">
            <div className="card-label">Secret Destination</div>
            <CountryField value={country} onChange={setCountry} placeholder="Search for a country…" />
            {country && (
              <div style={{ textAlign:"center", padding:"16px 0 6px" }}>
                <FlagLarge name={country.name} width={220} height={136} />
                <div style={{ fontSize:"1.1rem", letterSpacing:"2px", textTransform:"uppercase", marginTop:12 }}>{country.name}</div>
                <div style={{ fontSize:"0.7rem", letterSpacing:"2px", textTransform:"uppercase", color:"#bbb", marginTop:4 }}>Keep this secret! 🤫</div>
              </div>
            )}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="sec-title">Invite your<br />guests</div>
          <div className="sec-sub">Share the link below</div>
          <div className="card">
            <div className="card-label">Your room link</div>
            <div className="share-box" onClick={copyLink}>
              <span className="share-url">{shareUrl}</span>
              <span className="share-copy">Copy</span>
            </div>
            <button className="btn btn-share" onClick={shareWhatsApp}>Share via WhatsApp</button>
          </div>
          <div className="card" style={{ marginTop: 8 }}>
            <div className="card-label">Or share the room code</div>
            <div style={{ textAlign:"center", fontSize:"2.5rem", letterSpacing:"8px", color:"#e8624a", padding:"8px 0" }}>{roomId}</div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="sec-title">The Departure<br />Lounge</div>
          <div className="sec-sub">Waiting for guests to check in</div>
          <div className="card">
            <div className="card-label">Share link</div>
            <div className="share-box" onClick={copyLink}>
              <span className="share-url">{shareUrl}</span>
              <span className="share-copy">Copy</span>
            </div>
          </div>
          <div className="card">
            <div className="card-label">{guests.length} guest{guests.length !== 1 ? "s" : ""} joined</div>
            <div className="guest-list">
              {guests.length === 0 && (
                <div style={{ textAlign:"center", color:"#bbb", fontSize:"0.82rem", letterSpacing:"1px", padding:"12px 0" }}>
                  Waiting for guests to join…
                </div>
              )}
              {guests.map(g => (
                <div className="guest-item" key={g.name}>
                  <div className="guest-avatar">
                    <FlagThumb name={g.guess} size={24} />
                  </div>
                  <div className="guest-info">
                    <div className="guest-name">{g.name}</div>
                    <div className={`guest-status ${g.guess ? "ready" : ""}`}>
                      {g.guess ? `Guessed ${g.guess}` : "Thinking…"}
                    </div>
                  </div>
                  {g.guess ? <span className="check">✓</span> : <span className="pending">⏳</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="sticky">
        <div className="sticky-inner">
          {step === 1 && <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!country}>Next — Share with Guests →</button>}
          {step === 2 && (
            <>
              <button className="btn btn-dark" onClick={() => setStep(3)}>Guests are joining →</button>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Change Country</button>
            </>
          )}
          {step === 3 && <button className="btn btn-primary" onClick={reveal} disabled={guests.length === 0}>🥁 Reveal the Answer!</button>}
        </div>
      </div>
      <div className={`toast${on ? " on" : ""}`}>{msg}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GUEST FLOW
// ─────────────────────────────────────────────────────────────────────────────
function GuestFlow({ prefillCode, onBack }) {
  const [phase, setPhase] = useState(prefillCode ? "name" : "code");
  const [code, setCode] = useState(prefillCode || "");
  const [name, setName] = useState("");
  const [guess, setGuess] = useState(null);
  const [room, setRoom] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestId] = useState(() => Math.random().toString(36).slice(2, 8));
  const unsub = useRef(null);

  useEffect(() => { return () => { if (unsub.current) unsub.current(); }; }, []);

  async function joinRoom() {
    if (!name.trim()) { setErr("Enter your name"); return; }
    if (!guess) { setErr("Pick a country"); return; }
    setErr(""); setLoading(true);
    const id = code.trim().toUpperCase();
    try {
      const snap = await get(roomRef(id));
      if (!snap.exists()) { setErr("Room not found. Check the code!"); setLoading(false); return; }
      await set(guestRef(id, guestId), { name: name.trim(), guess: guess.name, flag: guess.flag });
      unsub.current = onValue(roomRef(id), s => { if (s.exists()) setRoom(s.val()); });
      setPhase("waiting");
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  async function validateCode() {
    if (code.length < 4) { setErr("Enter the 4-letter room code"); return; }
    setErr(""); setLoading(true);
    try {
      const snap = await get(roomRef(code.toUpperCase()));
      if (!snap.exists()) { setErr("Room not found. Check the code!"); setLoading(false); return; }
      setLoading(false); setPhase("name");
    } catch(e) { setErr(e.message); setLoading(false); }
  }

  const guests = room?.guests ? Object.values(room.guests) : [];
  const guessedCount = guests.filter(g => g.guess).length;
  const revealed = room?.phase === "revealed";

  function handleDone() { clearRoomFromUrl(); onBack(); }

  if (revealed && room) {
    return <RevealScreen room={room} myGuess={guess?.name} isGuest={true} onDone={handleDone} roomId={code.toUpperCase()} />;
  }

  if (phase === "code") {
    return (
      <div className="page fu">
        <div className="topnav"><button className="back" onClick={onBack}>←</button></div>
        <div className="invite-wrap">
          <div className="invite-emoji">🎟️</div>
          <div className="invite-title">Enter Room Code</div>
          <div className="invite-sub">Ask your host for the 4-letter code</div>
          <input className="field field-code" value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0,4))} placeholder="ABCD" autoFocus />
          {err && <p className="err">{err}</p>}
        </div>
        <div className="sticky">
          <div className="sticky-inner">
            <button className="btn btn-primary" onClick={validateCode} disabled={loading || code.length < 4}>
              {loading ? "Checking…" : "Join Room →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "name") {
    return (
      <div className="page fu">
        <div className="topnav">
          <button className="back" onClick={() => { prefillCode ? onBack() : setPhase("code"); }}>←</button>
          <div className="room-pill"><span className="pill-dot" />{code.toUpperCase()}</div>
        </div>
        <div className="invite-wrap" style={{ alignItems:"stretch", textAlign:"left" }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div className="invite-emoji">✈️</div>
            <div className="invite-title">You're In!</div>
            <div className="invite-sub">Enter your name and take a guess at the cuisine</div>
          </div>
          <div className="card">
            <div className="card-label">Your name</div>
            <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sofia" autoFocus />
          </div>
          <div className="card">
            <div className="card-label">Your guess — what cuisine did you eat?</div>
            <CountryField value={guess} onChange={setGuess} placeholder="Search for a country…" />
            {guess && (
              <div style={{ textAlign:"center", padding:"16px 0 4px" }}>
                <FlagLarge name={guess.name} width={220} height={136} />
                <div style={{ fontSize:"1rem", letterSpacing:"1.5px", textTransform:"uppercase", marginTop:10 }}>{guess.name}</div>
              </div>
            )}
          </div>
          {err && <p className="err">{err}</p>}
        </div>
        <div className="sticky">
          <div className="sticky-inner">
            <button className="btn btn-primary" onClick={joinRoom} disabled={loading || !name || !guess}>
              {loading ? "Joining…" : "Lock in my Guess 🔒"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting
  return (
    <div className="page fu">
      <div className="topnav">
        <button className="back" onClick={handleDone}>←</button>
        <div className="room-pill"><span className="pill-dot" />{code.toUpperCase()}</div>
      </div>
      <div className="wait-wrap">
        <div className="wait-emoji">✈️</div>
        <div className="wait-title">On the Runway</div>
        <div className="wait-sub">Your guess is locked in. Waiting for the host to reveal…</div>
        <div className="wait-guess" style={{ display:"flex", alignItems:"center", gap:10 }}>
          <FlagThumb name={guess?.name} size={22} />
          {guess?.name}
        </div>
        {guests.length > 0 && (
          <>
            <div style={{ fontSize:"0.78rem", color:"#aaa", letterSpacing:"1px" }}>
              {guessedCount} of {guests.length} guests ready
            </div>
            <div className="progress-wrap">
              <div className="progress-bar" style={{ width:`${(guessedCount/guests.length)*100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const inviteCode = getRoomCodeFromUrl();

  useEffect(() => { if (inviteCode) setScreen("guest"); }, []);

  return (
    <div className="app">
      <style>{G}</style>
      <Header />
      {screen === "home"  && <HomeScreen onHost={() => setScreen("host")} onJoin={() => setScreen("guest")} onRand={() => setScreen("rand")} />}
      {screen === "rand"  && <RandomiserScreen onBack={() => setScreen("home")} />}
      {screen === "host"  && <HostFlow onBack={() => { clearRoomFromUrl(); setScreen("home"); }} />}
      {screen === "guest" && <GuestFlow prefillCode={inviteCode} onBack={() => { clearRoomFromUrl(); setScreen("home"); }} />}
    </div>
  );
}
