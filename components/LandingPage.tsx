"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Radio, Car, Ticket, Map, Clock, Shield,
  Smartphone, ArrowRight, Zap, MapPin, Star,
  Code, ChevronRight, Navigation,
} from "lucide-react";
import AppShell from "@/components/AppShell";

/* ─── data ───────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "📡", color: "#f97316", title: "Live tracking",     desc: "Buses and metro on the map, updating every 5 seconds." },
  { icon: "🛺", color: "#f59e0b", title: "Auto booking",      desc: "Uber-style — driver, OTP, live tracking, fare upfront." },
  { icon: "🎫", color: "#7c3aed", title: "Digital tickets",   desc: "Buy from your phone. Scan and board. No queue." },
  { icon: "🗺",  color: "#3b82f6", title: "Route planner",    desc: "Best bus + metro + walk combo with live ETAs." },
  { icon: "⚡",  color: "#ec1c3c", title: "Real-time ETAs",   desc: "Actual arrival times, not the timetable." },
  { icon: "📶", color: "#f97316", title: "Works offline",     desc: "PWA — saved routes and tickets work without internet." },
];

const SCREENS = [
  {
    label: "Live tracking",
    color: "#ec1c3c",
    preview: [
      { icon: "🚌", name: "500D — Majestic", sub: "2 min away · 4 seats", badge: "2 min", badgeColor: "#ec1c3c" },
      { icon: "🚌", name: "335E — E-City",   sub: "8 min away · 12 seats", badge: "8 min", badgeColor: "#f59e0b" },
      { icon: "🚌", name: "G4 — Hebbal",     sub: "15 min away · full",    badge: "15 min", badgeColor: "#5b6470" },
    ],
    stat1: "4.2 ★", stat1l: "Rating",
    stat2: "92%",   stat2l: "On time",
    stat3: "4",     stat3l: "Seats",
    stat4: "₹15",   stat4l: "Fare",
  },
  {
    label: "Auto booking",
    color: "#f59e0b",
    preview: [
      { icon: "🛺", name: "Ravi · KA-01 AB 1234", sub: "₹120 · 4 min away",  badge: "4 min",  badgeColor: "#f97316" },
      { icon: "🛺", name: "Suresh · KA-03 CD 5678", sub: "₹135 · 6 min away", badge: "6 min", badgeColor: "#f59e0b" },
      { icon: "🛺", name: "Kumar · KA-05 EF 9012", sub: "₹110 · 9 min away",  badge: "9 min",  badgeColor: "#5b6470" },
    ],
    stat1: "4.8 ★", stat1l: "Driver",
    stat2: "OTP",   stat2l: "Verified",
    stat3: "Live",  stat3l: "Tracking",
    stat4: "Fixed", stat4l: "Fare",
  },
];

const STATS = [
  { value: "3",  label: "Transit modes",   sub: "Bus · Metro · Auto" },
  { value: "5s", label: "Update interval", sub: "Live positions" },
  { value: "8+", label: "Routes seeded",   sub: "Bengaluru GTFS" },
  { value: "∞",  label: "Cities coming",   sub: "Starting Bengaluru" },
];

/* ─── component ──────────────────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{
      background: "#07090c", color: "#fff",
      fontFamily: "'Sora', system-ui, sans-serif",
      overflowX: "hidden",
    }}>

      {/* ══ NAV ═══════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        height: 60, padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(7,9,12,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.25s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>🚌</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4 }}>Saarthi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Features","Screens","Download"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              style={{ color:"rgba(255,255,255,0.45)", fontSize:13, fontWeight:600, textDecoration:"none" }}
              onMouseEnter={e=>(e.currentTarget.style.color="#fff")}
              onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,0.45)")}
            >{l}</a>
          ))}
          <a href="#download" style={{
            background:"linear-gradient(135deg,#f97316,#ea580c)",
            color:"#fff", fontSize:13, fontWeight:700,
            padding:"8px 18px", borderRadius:20, textDecoration:"none",
            boxShadow:"0 4px 14px rgba(249,115,22,0.3)",
          }}>Get the app</a>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 72, padding: "60px 80px",
        position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse 80% 60% at 65% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)",
      }}>
        {/* Animated background orbs — same as app HomeScreen */}
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }}
          transition={{ duration:6, repeat:Infinity, ease:"easeInOut" }}
          style={{ position:"absolute", top:-100, right:100, width:400, height:400, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(249,115,22,0.12),transparent 70%)", pointerEvents:"none" }} />
        <motion.div animate={{ scale:[1,1.15,1], opacity:[0.15,0.3,0.15] }}
          transition={{ duration:8, repeat:Infinity, ease:"easeInOut", delay:2 }}
          style={{ position:"absolute", bottom:60, left:80, width:300, height:300, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(249,115,22,0.1),transparent 70%)", pointerEvents:"none" }} />

        {/* Subtle dot grid */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize:"28px 28px",
          maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
        }} />

        {/* ── Left copy ── */}
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.55, ease:"easeOut" }}
          style={{ flex:1, maxWidth:520, position:"relative" }}>

          {/* Live chip — same style as app */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:7,
            background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.28)",
            borderRadius:20, padding:"5px 14px",
            fontSize:12, fontWeight:700, color:"#f97316", marginBottom:28,
          }}>
            <motion.span animate={{ opacity:[1,0.2,1] }} transition={{ duration:1.6, repeat:Infinity }}>●</motion.span>
            Live in Bengaluru
          </div>

          <h1 style={{ fontSize:56, fontWeight:800, lineHeight:1.08, letterSpacing:-2.5, margin:"0 0 20px" }}>
            Transit tracking<br />
            <span style={{ background:"linear-gradient(120deg,#f97316,#fb923c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              made simple.
            </span>
          </h1>

          <p style={{ fontSize:17, lineHeight:1.75, color:"rgba(255,255,255,0.45)", margin:"0 0 36px", maxWidth:420 }}>
            Know where your bus is, book an auto, buy tickets — all in one app. Built for how people actually travel in Indian cities.
          </p>

          <div style={{ display:"flex", gap:12 }}>
            <motion.a href="#download" whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"linear-gradient(135deg,#f97316,#ea580c)",
                color:"#fff", fontWeight:700, fontSize:14,
                padding:"13px 24px", borderRadius:13, textDecoration:"none",
                boxShadow:"0 6px 28px rgba(249,115,22,0.35)",
              }}>
              <Smartphone size={16} /> Install free <ArrowRight size={15} />
            </motion.a>
            <motion.a href="#screens" whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                color:"#fff", fontWeight:600, fontSize:14,
                padding:"13px 24px", borderRadius:13, textDecoration:"none",
              }}>
              See screens
            </motion.a>
          </div>

          {/* Stats — same card style as app */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(4,1fr)",
            gap:10, marginTop:48,
          }}>
            {STATS.map((s,i) => (
              <motion.div key={s.label}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.3+i*0.07 }}
                style={{
                  background:"#12161c", border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:14, padding:"14px 12px",
                }}>
                <div style={{ fontSize:22, fontWeight:800, color:"#f97316", letterSpacing:-1 }}>{s.value}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#fff", marginTop:3 }}>{s.label}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Right: live phone mockup ── */}
        <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.65, delay:0.15, ease:"easeOut" }}
          style={{ flexShrink:0, position:"relative" }}>

          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:340, height:480,
            background:"radial-gradient(ellipse, rgba(249,115,22,0.13) 0%, transparent 65%)",
            pointerEvents:"none",
          }} />

          {/* Phone shell */}
          <div style={{
            width:290, height:600,
            background:"#060809",
            borderRadius:44,
            border:"1.5px solid #1e2229",
            boxShadow:"0 50px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03) inset",
            padding:7,
            position:"relative",
          }}>
            {/* Buttons */}
            {[{t:100,h:30},{t:140,h:55},{t:205,h:55}].map((b,i)=>(
              <div key={i} style={{ position:"absolute", left:-3, top:b.t, width:3, height:b.h, background:"#1a1e25", borderRadius:"2px 0 0 2px" }} />
            ))}
            <div style={{ position:"absolute", right:-3, top:140, width:3, height:80, background:"#1a1e25", borderRadius:"0 2px 2px 0" }} />

            {/* Screen */}
            <div style={{ width:"100%", height:"100%", borderRadius:37, overflow:"hidden", background:"#07090c", position:"relative" }}>
              <div style={{
                position:"absolute", top:0, left:0,
                width:392, height:820,
                transformOrigin:"top left",
                transform:`scale(${276/392})`,
              }}>
                <AppShell />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ FEATURES — app-card style ═════════════════════════════ */}
      <section id="features" style={{ padding:"100px 80px" }}>
        <SectionLabel icon={<Zap size={11}/>} text="FEATURES" />
        <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:-1.8, margin:"16px 0 12px" }}>
          Everything to move smarter
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.4)", maxWidth:480, margin:"0 0 52px", lineHeight:1.7 }}>
          Built for how people actually travel in Indian cities — multiple modes, live chaos, and all.
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, maxWidth:1060, margin:"0 auto" }}>
          {FEATURES.map((f,i) => (
            <motion.div key={f.title}
              initial={{ opacity:0, y:16 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:"-50px" }}
              transition={{ delay:i*0.07, type:"spring", stiffness:200, damping:24 }}
              whileHover={{ y:-4 }}
              style={{
                background:"#0e1117",
                border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:18, padding:"24px 22px",
                cursor:"default",
                transition:"border-color 0.2s",
              }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=`${f.color}35`)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.06)")}
            >
              <div style={{
                width:44, height:44, borderRadius:12,
                background:`${f.color}14`, border:`1px solid ${f.color}25`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20, marginBottom:16,
              }}>{f.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, margin:"0 0 8px" }}>{f.title}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.65 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ SCREENS SHOWCASE ══════════════════════════════════════ */}
      <section id="screens" style={{
        padding:"100px 80px",
        background:"linear-gradient(180deg,transparent,#0a0c10 15%,#0a0c10 85%,transparent)",
      }}>
        <SectionLabel icon={<Smartphone size={11}/>} text="SCREENS" />
        <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:-1.8, margin:"16px 0 12px" }}>
          See what's inside
        </h2>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.4)", maxWidth:460, margin:"0 0 60px", lineHeight:1.7 }}>
          Every screen designed for speed — get the info you need in under two taps.
        </p>

        <div style={{ display:"flex", gap:28, maxWidth:1060, margin:"0 auto" }}>
          {SCREENS.map((scr,si) => (
            <motion.div key={scr.label}
              initial={{ opacity:0, y:24 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay:si*0.15, type:"spring", stiffness:180, damping:22 }}
              style={{ flex:1 }}
            >
              {/* Screen label */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:scr.color }} />
                <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>{scr.label}</span>
              </div>

              {/* App-style card */}
              <div style={{
                background:"#0e1117", border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:22, overflow:"hidden",
              }}>
                {/* Mini map header */}
                <div style={{
                  height:100,
                  background:`linear-gradient(135deg, ${scr.color}18, #0a0c10)`,
                  borderBottom:"1px solid rgba(255,255,255,0.05)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  position:"relative", overflow:"hidden",
                }}>
                  <motion.div animate={{ opacity:[0.4,0.7,0.4] }} transition={{ duration:2, repeat:Infinity }}>
                    <MapPin size={28} color={scr.color} />
                  </motion.div>
                  {/* Animated dots */}
                  {[0,1,2].map(i=>(
                    <motion.div key={i}
                      animate={{ x:[0,20+i*10,0], opacity:[0.4,0.8,0.4] }}
                      transition={{ duration:3+i, repeat:Infinity, delay:i*0.8 }}
                      style={{ position:"absolute", fontSize:16, top:20+i*20, left:40+i*60 }}>
                      {scr.label==="Live tracking"?"🚌":"🛺"}
                    </motion.div>
                  ))}
                </div>

                {/* Vehicle / driver list */}
                <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                  {scr.preview.map((row,ri)=>(
                    <div key={ri} style={{
                      display:"flex", alignItems:"center", gap:10,
                      background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"10px 12px",
                      border:"1px solid rgba(255,255,255,0.05)",
                    }}>
                      <span style={{ fontSize:18, flexShrink:0 }}>{row.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{row.name}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{row.sub}</div>
                      </div>
                      <div style={{
                        background:`${row.badgeColor}18`, border:`1px solid ${row.badgeColor}35`,
                        borderRadius:7, padding:"3px 8px",
                        fontSize:11, fontWeight:700, color:row.badgeColor, flexShrink:0,
                      }}>{row.badge}</div>
                    </div>
                  ))}
                </div>

                {/* Stat strip */}
                <div style={{
                  display:"grid", gridTemplateColumns:"repeat(4,1fr)",
                  borderTop:"1px solid rgba(255,255,255,0.05)",
                  padding:"12px 14px", gap:6,
                }}>
                  {[{v:scr.stat1,l:scr.stat1l},{v:scr.stat2,l:scr.stat2l},{v:scr.stat3,l:scr.stat3l},{v:scr.stat4,l:scr.stat4l}].map((st,i)=>(
                    <div key={i} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{st.v}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{st.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Third card — Route planner */}
          <motion.div
            initial={{ opacity:0, y:24 }}
            whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }}
            transition={{ delay:0.3, type:"spring", stiffness:180, damping:22 }}
            style={{ flex:1 }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6" }} />
              <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>Route planner</span>
            </div>

            <div style={{ background:"#0e1117", border:"1px solid rgba(255,255,255,0.07)", borderRadius:22, overflow:"hidden" }}>
              {/* Header */}
              <div style={{
                height:100, background:"linear-gradient(135deg,#3b82f618,#0a0c10)",
                borderBottom:"1px solid rgba(255,255,255,0.05)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>MG Road → Electronic City</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:13 }}>🚶</span>
                    <div style={{ width:30, height:2, background:"rgba(255,255,255,0.15)", borderRadius:1 }} />
                    <span style={{ fontSize:13 }}>🚇</span>
                    <div style={{ width:30, height:2, background:"rgba(255,255,255,0.15)", borderRadius:1 }} />
                    <span style={{ fontSize:13 }}>🚌</span>
                    <div style={{ width:30, height:2, background:"rgba(255,255,255,0.15)", borderRadius:1 }} />
                    <span style={{ fontSize:13 }}>🚶</span>
                  </div>
                </div>
              </div>

              <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { mode:"🚶 Walk", detail:"8 min · 600m to Indiranagar", t:"8 min" },
                  { mode:"🚇 Purple Line", detail:"Indiranagar → Silk Board", t:"22 min" },
                  { mode:"🚌 Bus 500D",  detail:"Silk Board → E-City Phase 1", t:"35 min" },
                ].map((row,i)=>(
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:10,
                    background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"10px 12px",
                    border:"1px solid rgba(255,255,255,0.05)",
                  }}>
                    <span style={{ fontSize:13, flex:1, color:"rgba(255,255,255,0.8)", fontWeight:600 }}>{row.mode}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{row.detail}</span>
                    <div style={{
                      background:"#3b82f618", border:"1px solid #3b82f635",
                      borderRadius:7, padding:"3px 8px",
                      fontSize:11, fontWeight:700, color:"#3b82f6", flexShrink:0,
                    }}>{row.t}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderTop:"1px solid rgba(255,255,255,0.05)", padding:"12px 14px", gap:6 }}>
                {[{v:"65 min",l:"Total"},{v:"₹45",l:"Fare"},{v:"3",l:"Legs"},{v:"Live",l:"ETAs"}].map((st,i)=>(
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{st.v}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{st.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section id="download" style={{ padding:"80px 80px 120px", textAlign:"center" }}>
        <motion.div
          initial={{ opacity:0, y:30 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          style={{
            background:"#0e1117",
            border:"1px solid rgba(249,115,22,0.18)",
            borderRadius:28, padding:"64px 48px",
            maxWidth:660, margin:"0 auto", position:"relative", overflow:"hidden",
          }}
        >
          {/* Corner glow */}
          <div style={{
            position:"absolute", top:-80, right:-80,
            width:280, height:280, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(249,115,22,0.12),transparent 70%)", pointerEvents:"none",
          }} />

          <div style={{ fontSize:50, marginBottom:20 }}>🚌</div>
          <h2 style={{ fontSize:36, fontWeight:800, letterSpacing:-1.5, margin:"0 0 14px" }}>Ready to move smarter?</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.45)", margin:"0 0 36px", lineHeight:1.75, maxWidth:380, marginLeft:"auto", marginRight:"auto" }}>
            Install Saarthi as a PWA — no app store needed. Works on Android, iOS and desktop.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              onClick={()=>alert("Open this page on your phone in Chrome → tap ⋮ → Add to Home Screen")}
              style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"linear-gradient(135deg,#f97316,#ea580c)",
                color:"#fff", fontWeight:700, fontSize:14,
                padding:"13px 26px", borderRadius:13, border:"none", cursor:"pointer",
                boxShadow:"0 8px 28px rgba(249,115,22,0.35)",
              }}>
              <Smartphone size={17}/> Install PWA
            </motion.button>
            <motion.a href="https://github.com" whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                color:"#fff", fontWeight:600, fontSize:14,
                padding:"13px 26px", borderRadius:13, textDecoration:"none",
              }}>
              <Code size={15}/> View source
            </motion.a>
          </div>
          <div style={{ display:"flex", gap:24, justifyContent:"center", marginTop:28 }}>
            {["No sign up","100% free","Works offline"].map(t=>(
              <div key={t} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <Star size={11} color="#f97316" fill="#f97316" />
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer style={{
        borderTop:"1px solid rgba(255,255,255,0.06)",
        padding:"22px 80px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:16 }}>🚌</span>
          <span style={{ fontSize:14, fontWeight:700 }}>Saarthi</span>
          <span style={{ width:1, height:12, background:"rgba(255,255,255,0.1)", margin:"0 10px" }} />
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>Bengaluru · BMTC + Namma Metro + auto · prototype</span>
        </div>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>Built with ❤️ for Indian cities</span>
      </footer>
    </div>
  );
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:6,
      background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.2)",
      borderRadius:20, padding:"4px 13px",
      fontSize:11, fontWeight:700, color:"#f97316", letterSpacing:1.2,
    }}>
      {icon} {text}
    </div>
  );
}
