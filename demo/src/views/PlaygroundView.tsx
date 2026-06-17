import { useState, useEffect } from 'react';

const SCRIPT_PRESETS = {
  auth: `// AuthManager.ts - OAuth2 Authentication Flow
async function authenticateUser() {
  console.info("AuthManager: Requesting token exchange...");
  
  const response = await fetch("https://api.omnishop.io/v1/auth/token", {
    method: "POST",
    body: JSON.stringify({ grant_type: "client_credentials" })
  });
  
  if (response.status === 200) {
    console.log("AuthManager: Token exchanged successfully.");
    document.cookie = "session_user=apple_developer_tier; path=/";
    console.log("AuthManager: Session credentials cached.");
  }
}`,
  checkout: `// CheckoutService.ts - Payment Transaction
function processPayment() {
  console.log("CheckoutService: Starting transaction check...");
  
  fetch("https://api.omnishop.io/v1/checkout/verify");
  console.warn("CheckoutService: Legacy payment API is deprecated.");
  
  try {
    throw new Error("PaymentGatewayException: Connection timeout.");
  } catch (err) {
    console.error("CheckoutService: Checkout transaction failed.", err);
  }
}`,
  benchmark: `// Performance.ts - Virtual List Stress Test
function runBenchmark(limit) {
  console.log("Benchmark: List virtualization stress test initiated.");
  
  for (let i = 1; i <= limit; i++) {
    console.log(\`Virtualized log row #\${i} - scroll latency test.\`);
  }
  
  console.info("Benchmark: Stress test loop finished.");
}`
};

interface WorkbenchEvent {
  type: 'CONSOLE' | 'NETWORK' | 'STORAGE' | 'SYSTEM' | 'ERROR';
  msg: string;
  time: string;
  status: 'active' | 'success' | 'warning' | 'error';
}

export default function PlaygroundView() {
  // Playground state variables
  const [storageKey, setStorageKey] = useState('username');
  const [storageVal, setStorageVal] = useState('alex_dev');
  const [stressLogCount, setStressLogCount] = useState(1000);

  // Active workbench diagnostics state
  const [totalLogCount, setTotalLogCount] = useState(14);
  const [networkRequestCount, setNetworkRequestCount] = useState(5);
  const [storageCount, setStorageCount] = useState(4);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Telemetry Metrics
  const [cpuMetric, setCpuMetric] = useState(2.4);
  const [memoryMetric, setMemoryMetric] = useState(24.8);
  const [fpsMetric, setFpsMetric] = useState(60);
  const [fpsHistory, setFpsHistory] = useState<number[]>(Array(30).fill(60));
  
  // Simulation script state
  const [selectedScript, setSelectedScript] = useState<'auth' | 'checkout' | 'benchmark'>('auth');
  const [scriptRunning, setScriptRunning] = useState(false);
  const [scriptProgress, setScriptProgress] = useState(0);
  
  // Custom API Test States
  const [apiPath, setApiPath] = useState('/v1/products/studio-display');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [apiLatency, setApiLatency] = useState(120);
  const [apiStatus, setApiStatus] = useState<number>(200);
  const [apiPayload, setApiPayload] = useState('{\n  "inStock": true,\n  "quantity": 12\n}');
  const [apiSending, setApiSending] = useState(false);
  
  // Storage Sandbox Tab
  const [sandboxStorageTab, setSandboxStorageTab] = useState<'cookies' | 'local' | 'session'>('local');
  const [sandboxCookies, setSandboxCookies] = useState<{ key: string; value: string }[]>([]);
  const [sandboxLocal, setSandboxLocal] = useState<{ key: string; value: string }[]>([]);
  const [sandboxSession, setSandboxSession] = useState<{ key: string; value: string }[]>([]);
  
  // Event Feed for the active workbench
  const [workbenchEvents, setWorkbenchEvents] = useState<WorkbenchEvent[]>([
    { type: 'SYSTEM', msg: 'Developer Lab Simulator Initialized.', time: '13:08:00', status: 'active' },
    { type: 'CONSOLE', msg: 'Core interceptor bound to window console.', time: '13:08:01', status: 'success' }
  ]);

  // Sync sandbox state
  const syncSandboxStorage = () => {
    const local: { key: string; value: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('__')) {
        local.push({ key, value: localStorage.getItem(key) || '' });
      }
    }
    setSandboxLocal(local);

    const session: { key: string; value: string }[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        session.push({ key, value: sessionStorage.getItem(key) || '' });
      }
    }
    setSandboxSession(session);

    const cookies: { key: string; value: string }[] = [];
    document.cookie.split(';').forEach(c => {
      const parts = c.split('=');
      const name = parts[0]?.trim();
      const val = parts[1]?.trim();
      if (name) {
        cookies.push({ key: name, value: decodeURIComponent(val || '') });
      }
    });
    setSandboxCookies(cookies);
    
    setStorageCount(local.length + session.length + cookies.length);
  };

  // Sync on mount
  useEffect(() => {
    syncSandboxStorage();
  }, []);

  // Ambient telemetry loop
  useEffect(() => {
    const elapsedInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    const metricsInterval = setInterval(() => {
      setCpuMetric(prev => {
        if (prev > 8) return Number((prev - (prev - 2.5) * 0.15).toFixed(1));
        return Number((1.5 + Math.random() * 3).toFixed(1));
      });
      
      setMemoryMetric(prev => {
        if (prev > 30) return Number((prev - (prev - 24.8) * 0.1).toFixed(1));
        return Number((24.2 + Math.random() * 1.5).toFixed(1));
      });
      
      setFpsMetric(prev => {
        if (prev < 59) return Math.min(60, prev + Math.floor(Math.random() * 2) + 1);
        return 60;
      });
    }, 1000);
    
    return () => {
      clearInterval(elapsedInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  useEffect(() => {
    setFpsHistory(prev => [...prev.slice(1), fpsMetric]);
  }, [fpsMetric]);

  const addWorkbenchEvent = (type: WorkbenchEvent['type'], msg: string, status: WorkbenchEvent['status']) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setWorkbenchEvents(prev => [
      { type, msg, time: timeStr, status },
      ...prev.slice(0, 19)
    ]);
  };

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  // Preset Script executors
  const runSelectedScript = () => {
    if (scriptRunning) return;
    setScriptRunning(true);
    setScriptProgress(0);
    
    if (selectedScript === 'auth') {
      addWorkbenchEvent('SYSTEM', 'Running Authenticate Flow script...', 'active');
      setCpuMetric(14.8);
      
      setTimeout(() => {
        setScriptProgress(25);
        console.info("AuthManager: Requesting token exchange via OAuth2...");
        addWorkbenchEvent('CONSOLE', 'info: AuthManager: Requesting token exchange...', 'active');
        setTotalLogCount(prev => prev + 1);
      }, 600);
      
      setTimeout(() => {
        setScriptProgress(50);
        setCpuMetric(24.5);
        setMemoryMetric(26.2);
        
        fetch('https://jsonplaceholder.typicode.com/posts/1')
          .then(r => r.json())
          .then(() => {
            console.log("AuthManager: Token exchanged successfully. Session response ok.", {
              token_type: "Bearer",
              expires_in: 3600,
              user_id: 89402,
              roles: ["developer"]
            });
            addWorkbenchEvent('NETWORK', 'POST /v1/auth/token - 200 OK (32ms)', 'success');
            addWorkbenchEvent('CONSOLE', 'log: AuthManager: Token exchanged successfully.', 'success');
            setTotalLogCount(prev => prev + 1);
            setNetworkRequestCount(prev => prev + 1);
          });
      }, 1200);
      
      setTimeout(() => {
        setScriptProgress(75);
        setCpuMetric(18.2);
        document.cookie = "session_user=apple_developer_tier; path=/";
        console.log("AuthManager: Credentials cached. Storage cookie 'session_user' set.");
        addWorkbenchEvent('STORAGE', 'Cookie "session_user" updated -> "apple_developer_tier"', 'success');
        addWorkbenchEvent('CONSOLE', 'log: Credentials cached.', 'success');
        setTotalLogCount(prev => prev + 1);
        syncSandboxStorage();
      }, 1800);
      
      setTimeout(() => {
        setScriptProgress(100);
        setScriptRunning(false);
        addWorkbenchEvent('SYSTEM', 'Authenticate Flow script execution complete.', 'success');
      }, 2400);
      
    } else if (selectedScript === 'checkout') {
      addWorkbenchEvent('SYSTEM', 'Running E-Commerce Checkout script...', 'active');
      setCpuMetric(12.2);
      
      setTimeout(() => {
        setScriptProgress(25);
        console.log("CheckoutService: Starting processing check for studio-display...");
        addWorkbenchEvent('CONSOLE', 'log: CheckoutService: Starting processing check...', 'active');
        setTotalLogCount(prev => prev + 1);
      }, 600);
      
      setTimeout(() => {
        setScriptProgress(50);
        setCpuMetric(28.4);
        fetch('https://jsonplaceholder.typicode.com/posts/1')
          .then(r => r.json())
          .then(() => {
            console.warn("CheckoutService: Legacy payment gateway API endpoint is deprecated.");
            addWorkbenchEvent('NETWORK', 'GET /v1/checkout/verify - 200 OK (38ms)', 'success');
            addWorkbenchEvent('CONSOLE', 'warn: Legacy checkout endpoint is deprecated.', 'warning');
            setTotalLogCount(prev => prev + 1);
            setNetworkRequestCount(prev => prev + 1);
          });
      }, 1200);
      
      setTimeout(() => {
        setScriptProgress(75);
        setCpuMetric(45.6);
        setFpsMetric(42);
        
        console.error("CheckoutService: Checkout transaction failed.", new Error("PaymentGatewayTimeout"));
        addWorkbenchEvent('CONSOLE', 'error: Checkout transaction failed.', 'error');
        addWorkbenchEvent('ERROR', 'PaymentGatewayException: Processing timeout', 'error');
        setTotalLogCount(prev => prev + 1);
        
        setTimeout(() => {
          try {
            throw new Error("PaymentGatewayException: Processing connection refused by gateway provider.");
          } catch(e: any) {
            window.dispatchEvent(new ErrorEvent('error', { error: e, message: e.message }));
          }
        }, 50);
      }, 1800);
      
      setTimeout(() => {
        setScriptProgress(100);
        setScriptRunning(false);
        addWorkbenchEvent('SYSTEM', 'Checkout script finished with fatal runtime warning.', 'error');
      }, 2400);
      
    } else if (selectedScript === 'benchmark') {
      addWorkbenchEvent('SYSTEM', `Launching Virtualization Benchmark: logging ${stressLogCount} entries...`, 'active');
      setCpuMetric(88.4);
      setFpsMetric(26);
      setMemoryMetric(240);
      
      setTimeout(() => {
        setScriptProgress(40);
        setCpuMetric(96.2);
        setFpsMetric(18);
        setMemoryMetric(395);
        
        console.log(`Benchmark: Initiating rendering stress test of ${stressLogCount} rows...`);
        for (let i = 1; i <= stressLogCount; i++) {
          console.log(`Virtualized log row #${i} - OmniConsole frame stress validation test.`);
        }
        console.info(`Benchmark: Stress test loop complete. Emitted ${stressLogCount} logs.`);
        
        addWorkbenchEvent('CONSOLE', `log: Emitted ${stressLogCount} virtualized logs.`, 'success');
        setTotalLogCount(prev => prev + stressLogCount + 2);
      }, 500);
      
      setTimeout(() => {
        setScriptProgress(80);
        setCpuMetric(45.2);
        setFpsMetric(48);
        setMemoryMetric(84.3);
      }, 1300);
      
      setTimeout(() => {
        setScriptProgress(100);
        setScriptRunning(false);
        setCpuMetric(4.2);
        setFpsMetric(60);
        setMemoryMetric(25.1);
        addWorkbenchEvent('SYSTEM', `Virtualization Stress Test complete. List virtualization verified.`, 'success');
      }, 1800);
    }
  };

  // API Requester Dispatcher
  const sendCustomRequest = async () => {
    if (apiSending) return;
    setApiSending(true);
    addWorkbenchEvent('SYSTEM', `Sending ${apiMethod} request to ${apiPath}...`, 'active');
    
    setTimeout(async () => {
      let url = 'https://jsonplaceholder.typicode.com/posts';
      const options: any = {
        method: apiMethod,
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-Lab': 'OmniConsole-API-Requester'
        }
      };
      
      if (apiMethod === 'POST' || apiMethod === 'PUT') {
        options.body = apiPayload;
      }
      
      if (apiStatus === 404) {
        url = 'https://jsonplaceholder.typicode.com/posts/999999';
      } else if (apiStatus === 400) {
        url = 'https://jsonplaceholder.typicode.com/posts?invalid_param=1';
      } else if (apiStatus === 500) {
        url = 'https://jsonplaceholder.typicode.com/invalid-route-forces-network-500-error';
      } else if (apiMethod === 'GET') {
        url = 'https://jsonplaceholder.typicode.com/posts/1';
      }
      
      console.log(`API Requester: Dispatching fetch request: ${apiMethod} ${apiPath}`);
      
      try {
        await fetch(url, options);
        addWorkbenchEvent('NETWORK', `${apiMethod} ${apiPath} - ${apiStatus} (Simulated ${apiLatency}ms)`, apiStatus >= 400 ? 'error' : 'success');
        setNetworkRequestCount(prev => prev + 1);
        
        if (apiStatus >= 400) {
          console.error(`API Requester: Request failed with status code ${apiStatus}. Path: ${apiPath}`);
        } else {
          console.log(`API Requester: Request completed with status code ${apiStatus}. Response:`, {
            path: apiPath,
            method: apiMethod,
            status: apiStatus,
            ok: true,
            data: { id: 1, mockResult: "success" }
          });
        }
      } catch (err: any) {
        addWorkbenchEvent('NETWORK', `${apiMethod} ${apiPath} - Failed (Network Error)`, 'error');
        console.error('API Requester: Fetch execution failed:', err);
      } finally {
        setApiSending(false);
      }
    }, apiLatency);
  };

  // Storage Sandbox handlers
  const handleSandboxAdd = (key: string, val: string) => {
    if (!key) return;
    if (sandboxStorageTab === 'local') {
      localStorage.setItem(key, val);
      console.log(`Storage Action: Set localStorage key "${key}" = "${val}"`);
      addWorkbenchEvent('STORAGE', `localStorage: Set "${key}" = "${val}"`, 'success');
    } else if (sandboxStorageTab === 'session') {
      sessionStorage.setItem(key, val);
      console.log(`Storage Action: Set sessionStorage key "${key}" = "${val}"`);
      addWorkbenchEvent('STORAGE', `sessionStorage: Set "${key}" = "${val}"`, 'success');
    } else if (sandboxStorageTab === 'cookies') {
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(val)}; path=/`;
      console.log(`Storage Action: Set Cookie "${key}" = "${val}"`);
      addWorkbenchEvent('STORAGE', `Cookie: Set "${key}" = "${val}"`, 'success');
    }
    syncSandboxStorage();
    window.dispatchEvent(new Event('storage'));
  };

  const handleSandboxDelete = (key: string) => {
    if (sandboxStorageTab === 'local') {
      localStorage.removeItem(key);
      console.log(`Storage Action: Deleted localStorage key "${key}"`);
      addWorkbenchEvent('STORAGE', `localStorage: Deleted "${key}"`, 'success');
    } else if (sandboxStorageTab === 'session') {
      sessionStorage.removeItem(key);
      console.log(`Storage Action: Deleted sessionStorage key "${key}"`);
      addWorkbenchEvent('STORAGE', `sessionStorage: Deleted "${key}"`, 'success');
    } else if (sandboxStorageTab === 'cookies') {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      console.log(`Storage Action: Deleted Cookie "${key}"`);
      addWorkbenchEvent('STORAGE', `Cookie: Deleted "${key}"`, 'success');
    }
    syncSandboxStorage();
    window.dispatchEvent(new Event('storage'));
  };

  const handleSandboxClearAll = () => {
    if (sandboxStorageTab === 'local') {
      localStorage.clear();
      console.log(`Storage Action: Cleared all localStorage entries`);
      addWorkbenchEvent('STORAGE', `localStorage: Cleared sandbox`, 'warning');
    } else if (sandboxStorageTab === 'session') {
      sessionStorage.clear();
      console.log(`Storage Action: Cleared all sessionStorage entries`);
      addWorkbenchEvent('STORAGE', `sessionStorage: Cleared sandbox`, 'warning');
    } else if (sandboxStorageTab === 'cookies') {
      document.cookie.split(';').forEach(c => {
        const parts = c.split('=');
        const name = parts[0]?.trim();
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      console.log(`Storage Action: Cleared all sandbox cookies`);
      addWorkbenchEvent('STORAGE', `Cookies: Cleared sandbox`, 'warning');
    }
    syncSandboxStorage();
    window.dispatchEvent(new Event('storage'));
  };

  const triggerUncaughtException = () => {
    setTimeout(() => {
      try {
        throw new Error('Runtime NullPointerException: Cannot read property "id" of null');
      } catch(e: any) {
        window.dispatchEvent(new ErrorEvent('error', { error: e, message: e.message }));
      }
    }, 50);
  };
  
  const triggerUnhandledRejection = () => {
    Promise.reject(new Error('Promise Rejected: API Key is expired or invalid.'));
  };

  return (
          <div className="playground-container">
            {/* Playground Hero */}
            <div className="playground-hero" onMouseMove={handleHeroMouseMove}>
              <div className="hero-grid-background"></div>
              <div className="hero-grid-glow"></div>
              <div className="playground-hero-content">
                <span className="pill-announcement" style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#d4d4d8', borderColor: 'rgba(255, 255, 255, 0.08)' }}>Interactive Sandbox</span>
                <h1 className="playground-hero-title">Developer Lab</h1>
                <p className="playground-hero-subtitle">
                  Simulate. Instrument. Profile. A high-fidelity sandbox environment for testing telemetry captures, cookie keychains, and high-speed virtualization metrics.
                </p>
                <div className="cta-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button className="btn-primary" style={{ background: '#e4e4e7', color: '#18181b', border: 'none', fontWeight: 700 }} onClick={() => {
                    const el = document.getElementById('workbench-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Launch Active Workbench
                  </button>
                  <button className="btn-secondary" onClick={() => {
                    const el = document.getElementById('explainer-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Explore Telemetry Tools
                  </button>
                </div>
              </div>
            </div>

            {/* Section B: Explanatory Bento Grid */}
            <section id="explainer-section" className="playground-bento-section">
              <div className="section-title-wrapper" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 className="section-title" style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>Telemetry Instruments</h2>
                <p className="section-subtitle" style={{ color: '#86868b', fontSize: '14px' }}>How the OmniConsole intercept system hooks into standard browser layers.</p>
              </div>
              <div className="playground-bento-grid">
                
                {/* Bento Card 1: Console Hook */}
                <div className="playground-bento-card bento-1x1">
                  <div className="bento-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                  </div>
                  <h3 className="bento-card-title">Console Hook</h3>
                  <p className="bento-card-desc">Intercepts global console logs, wrapping JSON payloads in colored syntax trees.</p>
                  <div className="bento-illustration console-illustration">
                    <div className="bento-code-snippet">
                      <span className="code-keyword">const</span> raw = console.log;<br />
                      console.log = (...args) =&gt; &#123;<br />
                      &nbsp;&nbsp;syncToViewport(args);<br />
                      &nbsp;&nbsp;raw(...args);<br />
                      &#125;
                    </div>
                  </div>
                </div>

                {/* Bento Card 2: Network Tunnel */}
                <div className="playground-bento-card bento-2x1">
                  <div className="bento-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  </div>
                  <h3 className="bento-card-title">Network Tunnel</h3>
                  <p className="bento-card-desc">Hooks standard Fetch and XHR protocols to collect request status, headers, and latency metrics.</p>
                  <div className="bento-illustration network-illustration" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
                    <div className="net-stream-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>GET</span>
                      <span style={{ color: '#c8c8cc' }}>/auth/session</span>
                      <span style={{ color: '#34d399' }}>200 OK</span>
                      <span style={{ color: '#86868b' }}>22ms</span>
                    </div>
                    <div className="net-stream-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>POST</span>
                      <span style={{ color: '#c8c8cc' }}>/cart/add</span>
                      <span style={{ color: '#34d399' }}>201 Created</span>
                      <span style={{ color: '#86868b' }}>112ms</span>
                    </div>
                  </div>
                </div>

                {/* Bento Card 3: Storage Keychain (1x2) */}
                <div className="playground-bento-card bento-1x2">
                  <div className="bento-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>
                  </div>
                  <h3 className="bento-card-title">Keychain Storage</h3>
                  <p className="bento-card-desc">Monitors LocalStorage, SessionStorage, and Document Cookies dynamically with reactive delete hooks.</p>
                  <div className="bento-illustration storage-illustration" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="storage-mock-table" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px', fontSize: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#86868b' }}>
                        <span>Key</span>
                        <span>Value</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#34d399' }}>theme</span>
                        <span>"dark"</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ color: '#34d399' }}>session</span>
                        <span>"active"</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bento Card 4: List Recycler */}
                <div className="playground-bento-card bento-1x1">
                  <div className="bento-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <h3 className="bento-card-title">List Recycler</h3>
                  <p className="bento-card-desc">Uses virtual scroll recyclers to render 10,000+ logs at 60 FPS under 30MB RAM overhead.</p>
                  <div className="bento-illustration virtualization-illustration" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(251,191,36,0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>60</div>
                      <div style={{ fontSize: '9px', color: '#fbbf24' }}>FPS</div>
                    </div>
                  </div>
                </div>

                {/* Bento Card 5: Error Shield */}
                <div className="playground-bento-card bento-1x1">
                  <div className="bento-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <h3 className="bento-card-title">Exception Shield</h3>
                  <p className="bento-card-desc">Automatically catches window errors and unhandled rejections with exact trace sources.</p>
                  <div className="bento-illustration error-illustration" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                </div>

              </div>
            </section>

            {/* Section C: Xcode Diagnostic Workbench */}
            <section id="workbench-section" className="playground-workbench-section">
              <div className="section-title-wrapper" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 className="section-title" style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>Diagnostics Workspace</h2>
                <p className="section-subtitle" style={{ color: '#86868b', fontSize: '14px' }}>Real-time simulation engine. Mutate state, trigger calls, and inspect diagnostics.</p>
              </div>

              <div className="workbench-container">
                {/* Xcode Window Header */}
                <div className="workbench-header">
                  <div className="header-controls">
                    <span className="dot dot-close"></span>
                    <span className="dot dot-minimize"></span>
                    <span className="dot dot-expand"></span>
                  </div>
                  <div className="header-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                    <span>OmniConsole Simulator — workspace.xcworkspace</span>
                  </div>
                  <div className="header-status">
                    <span className="pulse-dot active"></span>
                    <span className="status-text">Simulating</span>
                  </div>
                </div>

                {/* Xcode diagnostics bar */}
                <div className="workbench-build-bar">
                  <div className="build-info-chunk">
                    <span className="label">TARGET:</span>
                    <span className="value">OmniConsole Intercept Engine</span>
                  </div>
                  <div className="build-divider">|</div>
                  <div className="build-info-chunk">
                    <span className="label">SESSION UPTIME:</span>
                    <span className="value">{elapsedTime}s</span>
                  </div>
                  <div className="build-divider">|</div>
                  <div className="build-info-chunk">
                    <span className="label">EVENT COUNTERS:</span>
                    <span className="value">
                      Logs: <span className="counter-val highlight">{totalLogCount}</span> &bull; 
                      Network: <span className="counter-val highlight">{networkRequestCount}</span> &bull; 
                      Storage: <span className="counter-val highlight">{storageCount}</span>
                    </span>
                  </div>
                </div>

                <div className="workbench-layout">
                  {/* Left Column: Controls */}
                  <div className="workbench-controls-column">
                    
                    {/* Console Script Runner */}
                    <div className="workbench-card">
                      <div className="card-header-row">
                        <span className="card-number">01</span>
                        <h3 className="card-title">Console Script Runner</h3>
                      </div>
                      <p className="card-desc">Select and execute a prebuilt javascript application flow in the sandbox environment.</p>
                      
                      <div className="script-selector-row" style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                        <select 
                          className="playground-select" 
                          value={selectedScript}
                          onChange={(e: any) => setSelectedScript(e.target.value)}
                          disabled={scriptRunning}
                          style={{ flex: 1 }}
                        >
                          <option value="auth">User Authentication Flow (auth.ts)</option>
                          <option value="checkout">E-Commerce Checkout (checkout.ts)</option>
                          <option value="benchmark">Virtual List Performance Benchmark (stressTest.ts)</option>
                        </select>
                        
                        <button 
                          className={`oc-btn-playground oc-btn-playground-primary ${scriptRunning ? 'loading' : ''}`}
                          onClick={runSelectedScript}
                          disabled={scriptRunning}
                          style={{ background: '#a78bfa', color: '#000', border: 'none' }}
                        >
                          {scriptRunning ? 'Executing...' : 'Run Script'}
                        </button>
                      </div>
                      
                      {scriptRunning && (
                        <div className="script-progress-bar-wrap" style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' }}>
                          <div className="script-progress-bar" style={{ width: `${scriptProgress}%`, height: '100%', background: '#a78bfa', transition: 'width 0.3s' }}></div>
                        </div>
                      )}
                      
                      <div className="mock-code-editor" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#c8c8cc', lineHeight: '1.4' }}>
                        <div className="editor-chrome-top" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px', color: '#86868b' }}>
                          <span>{selectedScript === 'auth' ? 'auth.ts' : selectedScript === 'checkout' ? 'checkout.ts' : 'stressTest.ts'}</span>
                          <span>TypeScript</span>
                        </div>
                        <pre style={{ margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                          <code>{SCRIPT_PRESETS[selectedScript]}</code>
                        </pre>
                      </div>
                    </div>

                    {/* Custom API Requester */}
                    <div className="workbench-card">
                      <div className="card-header-row">
                        <span className="card-number">02</span>
                        <h3 className="card-title">Custom API Requester</h3>
                      </div>
                      <p className="card-desc">Manually configure REST endpoint fetches. Intercept latency, headers, and status outcomes.</p>
                      
                      <div className="api-config-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="input-label" style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '6px' }}>Request Endpoint</label>
                          <div className="playground-input-wrap" style={{ marginBottom: 0 }}>
                            <span className="playground-input-icon">/</span>
                            <input 
                              type="text" 
                              className="playground-input-field" 
                              value={apiPath} 
                              onChange={(e) => setApiPath(e.target.value)}
                              placeholder="v1/products/studio-display"
                            />
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label className="input-label" style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '6px' }}>HTTP Method</label>
                            <div className="segmented-control" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                              {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(m => (
                                <button 
                                  key={m}
                                  className={`segment-btn ${apiMethod === m ? 'active' : ''}`}
                                  onClick={() => setApiMethod(m)}
                                  style={{ flex: 1, background: apiMethod === m ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', color: '#fff', padding: '6px 0', fontSize: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="input-label" style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '6px' }}>Response Status</label>
                            <select 
                              className="playground-select"
                              value={apiStatus}
                              onChange={(e) => setApiStatus(Number(e.target.value))}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '7px 10px', borderRadius: '8px', outline: 'none' }}
                            >
                              <option value="200">200 OK</option>
                              <option value="201">201 Created</option>
                              <option value="400">400 Bad Request</option>
                              <option value="404">404 Not Found</option>
                              <option value="500">500 Server Error</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="input-label" style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '6px' }}>Simulated Network Latency ({apiLatency}ms)</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input 
                              type="range" 
                              min="0" 
                              max="2000" 
                              step="50"
                              value={apiLatency}
                              onChange={(e) => setApiLatency(Number(e.target.value))}
                              style={{ flex: 1, accentColor: '#a78bfa' }}
                            />
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#86868b', width: '50px', textAlign: 'right' }}>
                              {apiLatency}ms
                            </span>
                          </div>
                        </div>
                        
                        {(apiMethod === 'POST' || apiMethod === 'PUT') && (
                          <div>
                            <label className="input-label" style={{ display: 'block', fontSize: '11px', color: '#86868b', marginBottom: '6px' }}>Request JSON Payload</label>
                            <textarea 
                              className="playground-textarea"
                              value={apiPayload}
                              onChange={(e) => setApiPayload(e.target.value)}
                              rows={3}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '8px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <button 
                        className="oc-btn-playground oc-btn-playground-primary" 
                        style={{ width: '100%', marginTop: '16px', background: '#a78bfa', color: '#000', border: 'none', padding: '10px 0' }}
                        onClick={sendCustomRequest}
                        disabled={apiSending}
                      >
                        {apiSending ? 'Sending HTTP Request...' : 'Dispatch HTTP Request'}
                      </button>
                    </div>

                    {/* Keychain Storage Sandbox */}
                    <div className="workbench-card">
                      <div className="card-header-row">
                        <span className="card-number">03</span>
                        <h3 className="card-title">Keychain Storage Sandbox</h3>
                      </div>
                      <p className="card-desc">Mutate storage values in real time to verify reactive updates in the OmniConsole UI.</p>
                      
                      <div className="storage-tabs-bar" style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px' }}>
                        <button 
                          className={`storage-tab-btn ${sandboxStorageTab === 'cookies' ? 'active' : ''}`}
                          onClick={() => setSandboxStorageTab('cookies')}
                          style={{ background: 'transparent', border: 'none', color: sandboxStorageTab === 'cookies' ? '#a78bfa' : '#86868b', fontSize: '11px', cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
                        >
                          Cookies ({sandboxCookies.length})
                        </button>
                        <button 
                          className={`storage-tab-btn ${sandboxStorageTab === 'local' ? 'active' : ''}`}
                          onClick={() => setSandboxStorageTab('local')}
                          style={{ background: 'transparent', border: 'none', color: sandboxStorageTab === 'local' ? '#a78bfa' : '#86868b', fontSize: '11px', cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
                        >
                          LocalStorage ({sandboxLocal.length})
                        </button>
                        <button 
                          className={`storage-tab-btn ${sandboxStorageTab === 'session' ? 'active' : ''}`}
                          onClick={() => setSandboxStorageTab('session')}
                          style={{ background: 'transparent', border: 'none', color: sandboxStorageTab === 'session' ? '#a78bfa' : '#86868b', fontSize: '11px', cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
                        >
                          SessionStorage ({sandboxSession.length})
                        </button>
                      </div>
                      
                      <div className="keychain-table-container" style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '12px' }}>
                        <table className="keychain-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <thead>
                            <tr style={{ textAlign: 'left', color: '#86868b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <th style={{ padding: '6px' }}>Key</th>
                              <th style={{ padding: '6px' }}>Value</th>
                              <th style={{ padding: '6px', width: '30px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {sandboxStorageTab === 'cookies' && (
                              sandboxCookies.length === 0 ? (
                                <tr><td colSpan={3} className="empty-row" style={{ padding: '12px', textAlign: 'center', color: '#555' }}>No cookies found.</td></tr>
                              ) : (
                                sandboxCookies.map(cookie => (
                                  <tr key={cookie.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td className="key-cell" style={{ padding: '6px', color: '#34d399', fontWeight: 500 }}>{cookie.key}</td>
                                    <td className="val-cell" style={{ padding: '6px', color: '#ffffff' }}>{cookie.value}</td>
                                    <td style={{ padding: '6px' }}>
                                      <button className="trash-btn" style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }} onClick={() => handleSandboxDelete(cookie.key)}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )
                            )}
                            {sandboxStorageTab === 'local' && (
                              sandboxLocal.length === 0 ? (
                                <tr><td colSpan={3} className="empty-row" style={{ padding: '12px', textAlign: 'center', color: '#555' }}>LocalStorage sandbox empty.</td></tr>
                              ) : (
                                sandboxLocal.map(item => (
                                  <tr key={item.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td className="key-cell" style={{ padding: '6px', color: '#34d399', fontWeight: 500 }}>{item.key}</td>
                                    <td className="val-cell" style={{ padding: '6px', color: '#ffffff' }}>{item.value}</td>
                                    <td style={{ padding: '6px' }}>
                                      <button className="trash-btn" style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }} onClick={() => handleSandboxDelete(item.key)}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )
                            )}
                            {sandboxStorageTab === 'session' && (
                              sandboxSession.length === 0 ? (
                                <tr><td colSpan={3} className="empty-row" style={{ padding: '12px', textAlign: 'center', color: '#555' }}>SessionStorage sandbox empty.</td></tr>
                              ) : (
                                sandboxSession.map(item => (
                                  <tr key={item.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td className="key-cell" style={{ padding: '6px', color: '#34d399', fontWeight: 500 }}>{item.key}</td>
                                    <td className="val-cell" style={{ padding: '6px', color: '#ffffff' }}>{item.value}</td>
                                    <td style={{ padding: '6px' }}>
                                      <button className="trash-btn" style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }} onClick={() => handleSandboxDelete(item.key)}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="sandbox-storage-form" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input 
                          type="text" 
                          placeholder="New Key" 
                          className="sandbox-form-input"
                          value={storageKey}
                          onChange={(e) => setStorageKey(e.target.value)}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '6px 10px', outline: 'none' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Value" 
                          className="sandbox-form-input"
                          value={storageVal}
                          onChange={(e) => setStorageVal(e.target.value)}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: '#fff', fontSize: '11px', padding: '6px 10px', outline: 'none' }}
                        />
                        <button 
                          className="oc-btn-playground" 
                          style={{ margin: 0, padding: '6px 12px', fontSize: '11px' }}
                          onClick={() => {
                            handleSandboxAdd(storageKey, storageVal);
                            setStorageKey('');
                            setStorageVal('');
                          }}
                        >
                          Add
                        </button>
                      </div>
                      
                      <button 
                        className="oc-btn-playground oc-btn-playground-error"
                        style={{ width: '100%', marginTop: '10px', padding: '6px 0', fontSize: '11px' }}
                        onClick={handleSandboxClearAll}
                      >
                        Clear Active Sandbox
                      </button>
                    </div>

                    {/* Exceptions & Failures */}
                    <div className="workbench-card workbench-card-alert">
                      <div className="card-header-row">
                        <span className="card-number" style={{ color: '#f87171' }}>04</span>
                        <h3 className="card-title" style={{ color: '#f87171' }}>Exceptions & Failures</h3>
                      </div>
                      <p className="card-desc">Simulate fatal uncaught runtime script exception boundaries and async promise rejections.</p>
                      
                      <div className="exception-btn-group" style={{ display: 'flex', gap: '10px' }}>
                        <button className="oc-btn-playground oc-btn-playground-error" style={{ flex: 1, margin: 0 }} onClick={triggerUncaughtException}>
                          Throw Script Error
                        </button>
                        <button className="oc-btn-playground oc-btn-playground-error" style={{ flex: 1, margin: 0 }} onClick={triggerUnhandledRejection}>
                          Reject Promise Auth
                        </button>
                      </div>
                    </div>

                  </div>
                  
                  {/* Right Column: Profiler */}
                  <div className="workbench-profiler-column">
                    
                    {/* Diagnostics Profiler */}
                    <div className="workbench-card">
                      <h3 className="profiler-section-title" style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Diagnostics Profiler</h3>
                      <p className="card-desc">Monitor hardware stress simulation metrics in real-time as logs flow.</p>
                      
                      {/* Dials Row */}
                      <div className="dials-container" style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0', gap: '20px' }}>
                        
                        {/* CPU Dial */}
                        <div className="metric-dial-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className="svg-dial" style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="70" height="70" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="none" />
                              <circle cx="50" cy="50" r="40" stroke={cpuMetric > 80 ? '#f87171' : '#a78bfa'} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * cpuMetric) / 100} fill="none" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }} />
                            </svg>
                            <div className="dial-value-text" style={{ position: 'absolute', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#fff' }}>{cpuMetric}%</div>
                          </div>
                          <span className="dial-label" style={{ fontSize: '10px', color: '#86868b', fontWeight: 600, marginTop: '8px', letterSpacing: '0.05em' }}>CPU LOAD</span>
                        </div>
                        
                        {/* Memory Dial */}
                        <div className="metric-dial-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className="svg-dial" style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="70" height="70" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="none" />
                              <circle cx="50" cy="50" r="40" stroke={memoryMetric > 300 ? '#fbbf24' : '#34d399'} strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * Math.min(500, memoryMetric)) / 500} fill="none" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }} />
                            </svg>
                            <div className="dial-value-text" style={{ position: 'absolute', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#fff' }}>{memoryMetric}MB</div>
                          </div>
                          <span className="dial-label" style={{ fontSize: '10px', color: '#86868b', fontWeight: 600, marginTop: '8px', letterSpacing: '0.05em' }}>RAM ALLOC</span>
                        </div>

                      </div>

                      {/* FPS Sparkline */}
                      <div className="fps-chart-wrapper" style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                        <div className="fps-chart-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#86868b', marginBottom: '8px' }}>
                          <span>Virtualization Frame Rate</span>
                          <span style={{ color: fpsMetric < 40 ? '#f87171' : '#a78bfa', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{fpsMetric} FPS</span>
                        </div>
                        
                        <div className="svg-sparkline-container" style={{ height: '50px' }}>
                          <svg width="100%" height="100%" viewBox="0 0 300 50" preserveAspectRatio="none">
                            <line x1="0" y1="12.5" x2="300" y2="12.5" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                            <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                            <line x1="0" y1="37.5" x2="300" y2="37.5" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                            
                            <path
                              d={`M ${fpsHistory.map((val, idx) => {
                                const x = (idx / 29) * 300;
                                const y = 50 - (val / 60) * 50;
                                return `${x} ${y}`;
                              }).join(' L ')}`}
                              fill="none"
                              stroke={fpsMetric < 40 ? '#f87171' : fpsMetric < 55 ? '#fbbf24' : '#a78bfa'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ transition: 'stroke 0.2s' }}
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Stress Test Range Slider */}
                      <div className="perf-benchmark-control-box" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#86868b', marginBottom: '8px' }}>
                          <span>Stress Benchmarking Scale</span>
                          <span style={{ color: '#a78bfa', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{stressLogCount} rows</span>
                        </div>
                        <input
                          type="range"
                          min="200"
                          max="10000"
                          step="200"
                          style={{ width: '100%', accentColor: '#a78bfa', cursor: 'pointer', marginBottom: '12px' }}
                          value={stressLogCount}
                          onChange={(e) => setStressLogCount(Number(e.target.value))}
                        />
                        <button 
                          className="oc-btn-playground oc-btn-playground-primary" 
                          style={{ width: '100%', margin: 0, padding: '8px 12px', borderRadius: '6px', background: '#a78bfa', color: '#000', border: 'none', fontSize: '11px', fontWeight: 600 }} 
                          onClick={() => {
                            setSelectedScript('benchmark');
                            setTimeout(() => {
                              runSelectedScript();
                            }, 100);
                          }}
                          disabled={scriptRunning}
                        >
                          Run Virtualization Benchmark
                        </button>
                      </div>
                    </div>

                    {/* Event Trace List */}
                    <div className="workbench-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 className="profiler-section-title" style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Simulator Event Feed</h3>
                      <p className="card-desc">Active trace list of events intercepted in the sandbox workspace.</p>
                      
                      <div className="workbench-events-list" style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                        {workbenchEvents.length === 0 ? (
                          <div style={{ color: '#555', textAlign: 'center', padding: '20px' }}>No events recorded.</div>
                        ) : (
                          workbenchEvents.map((evt, idx) => (
                            <div key={idx} className={`event-feed-row ${evt.status}`} style={{ display: 'flex', gap: '8px', padding: '4px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.01)', borderLeft: `2px solid ${evt.status === 'error' ? '#f87171' : evt.status === 'warning' ? '#fbbf24' : evt.status === 'success' ? '#34d399' : '#a78bfa'}` }}>
                              <span style={{ color: '#555' }}>{evt.time}</span>
                              <span style={{ 
                                color: evt.type === 'ERROR' ? '#f87171' : evt.type === 'NETWORK' ? '#a78bfa' : evt.type === 'STORAGE' ? '#34d399' : evt.type === 'CONSOLE' ? '#38bdf8' : '#86868b', 
                                fontWeight: 'bold',
                                minWidth: '60px'
                              }}>[{evt.type}]</span>
                              <span style={{ color: '#c8c8cc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.msg}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>
          </div>
  );
}
