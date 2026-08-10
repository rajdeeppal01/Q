import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SetupAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 4500); // 4.5 seconds per step
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      background: '#0a0a0c',
      border: '1px solid #27272a',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      fontFamily: 'var(--font-mono)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Window Header */}
      <div style={{ display: 'flex', background: '#111', padding: '8px 12px', borderBottom: '1px solid #27272a', gap: '8px', alignItems: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
        <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#666', fontWeight: 600, letterSpacing: '0.05em' }}>
          {step === 0 ? 'STEP 1: GET API KEY' : step === 1 ? 'STEP 2: INSTALL SDK' : 'STEP 3: DECORATE TOOLS'}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <AnimatePresence mode="wait">
          
          {/* Step 1: Dashboard / API Key */}
          {step === 0 && (
            <motion.div key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} style={{ width: '100%' }}>
               <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, padding: '1.5rem', margin: '0 auto', maxWidth: 400, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                   <div>
                     <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>Agent Registry</div>
                     <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Manage identities</div>
                   </div>
                   <motion.div 
                     initial={{ backgroundColor: '#27272a' }} 
                     animate={{ backgroundColor: '#FF5722' }} 
                     transition={{ delay: 1, duration: 0.2 }}
                     style={{ padding: '6px 12px', color: '#fff', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}
                   >
                     + Register
                   </motion.div>
                 </div>

                 <motion.div 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   transition={{ delay: 1.5, duration: 0.3 }}
                   style={{ padding: '1rem', border: '1px dashed #FF5722', background: 'rgba(255, 87, 34, 0.05)', borderRadius: 8, textAlign: 'center' }}
                 >
                   <div style={{ color: '#a1a1aa', fontSize: '0.7rem', marginBottom: '4px' }}>YOUR API KEY (COPY THIS)</div>
                   <div style={{ color: '#FF5722', fontSize: '1.1rem', fontWeight: 700 }}>q-sk-8x92nd74k...</div>
                 </motion.div>

               </div>
            </motion.div>
          )}

          {/* Step 2: Terminal */}
          {step === 1 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', maxWidth: 450 }}>
               <div style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>
                 <span style={{ color: '#FF5722' }}>$</span> pip install q-agent-sdk
               </div>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ color: '#d4d4d8', marginTop: '1rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                 Collecting q-agent-sdk...<br/>
                 Downloading q_agent_sdk-1.0.0-py3-none-any.whl (12 kB)<br/>
                 Installing collected packages: q-agent-sdk<br/>
                 <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} style={{ color: '#10b981' }}>
                   Successfully installed q-agent-sdk-1.0.0
                 </motion.span>
               </motion.div>
            </motion.div>
          )}

          {/* Step 3: IDE */}
          {step === 2 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ width: '100%', maxWidth: 450, fontSize: '0.95rem', lineHeight: 1.6 }}>
               <div><span style={{ color: '#c678dd' }}>from</span> q_sdk <span style={{ color: '#c678dd' }}>import</span> QAgent, require_approval</div>
               <br/>
               <div><span style={{ color: '#56b6c2' }}>agent</span> = QAgent(api_key=<span style={{ color: '#98c379' }}>"q-sk-8x92nd74k..."</span>)</div>
               <br/>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                 <div><span style={{ color: '#5c6370', fontStyle: 'italic' }}># Q acts as a security middleware here</span></div>
                 <motion.div initial={{ color: '#e5c07b' }} animate={{ color: '#FF5722', scale: [1, 1.05, 1] }} transition={{ delay: 1.6, duration: 0.4 }}>
                   @require_approval(agent)
                 </motion.div>
                 <div><span style={{ color: '#c678dd' }}>def</span> <span style={{ color: '#61afef' }}>execute_refund</span>(user_id, amount):</div>
                 <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#5c6370', fontStyle: 'italic' }}># High risk action</span></div>
                 <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>return</span> api.process_refund(amount)</div>
               </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: step === i ? '#FF5722' : '#333', transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  );
}
