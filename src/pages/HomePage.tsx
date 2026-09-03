export function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] font-sans selection:bg-[#E65100] selection:text-white flex flex-col">
      {/* 
        NAVIGATION BAR 
      */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#161E2E] border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#E65100] rounded-sm flex items-center justify-center font-bold text-white text-lg tracking-tighter">
            RX
          </div>
          <span className="font-extrabold tracking-tight text-xl uppercase">Reflex</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[#6B7280] uppercase tracking-wide">
          <a href="#" className="hover:text-[#F3F4F6] transition-colors duration-150">Fleet Control</a>
          <a href="#" className="hover:text-[#F3F4F6] transition-colors duration-150">Telemetry</a>
          <a href="#" className="hover:text-[#F3F4F6] transition-colors duration-150">Architecture</a>
        </nav>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#6B7280]">
            <span className="w-2 h-2 rounded-none bg-green-500 animate-pulse"></span>
            SYS.STATUS_OK
          </div>
          <button className="bg-[#E65100] hover:bg-[#D9381E] text-white px-6 py-2.5 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors duration-150 ease-out border border-[#E65100]">
            System Login
          </button>
        </div>
      </header>

      {/* 
        MAIN HERO SECTION
      */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Core Messaging */}
          <div className="lg:col-span-7 flex flex-col justify-center items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161E2E] border border-gray-700 rounded-sm mb-8">
              <span className="text-[#E65100] font-mono text-xs font-bold">V 2.1.0</span>
              <span className="text-[#6B7280] font-mono text-xs uppercase">Edge Sync Activated</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6 uppercase">
              Sub-Millisecond <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3F4F6] to-[#6B7280]">
                State Control.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#6B7280] max-w-2xl font-medium leading-relaxed mb-10">
              Industrial-grade delivery coordination powered by Supabase. Reflex synchronizes riders, retailers, and dispatchers with zero-latency edge architecture.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button className="bg-[#E65100] hover:bg-[#D9381E] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors duration-150 ease-out border border-[#E65100] flex items-center justify-center gap-2">
                Initialize Deployment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
              <button className="bg-transparent hover:bg-[#161E2E] text-[#F3F4F6] px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-sm transition-colors duration-150 ease-out border border-gray-700 flex items-center justify-center">
                View Documentation
              </button>
            </div>
          </div>

          {/* Right Column: Technical Interface Graphic */}
          <div className="lg:col-span-5 relative">
            <div className="w-full h-full min-h-[400px] bg-[#161E2E] border border-gray-700 rounded-sm p-1 flex flex-col shadow-2xl">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#0B0F19]">
                <span className="text-xs font-mono text-[#6B7280]">terminal@reflex-edge</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gray-700 rounded-sm"></div>
                  <div className="w-2.5 h-2.5 bg-gray-700 rounded-sm"></div>
                  <div className="w-2.5 h-2.5 bg-[#E65100] rounded-sm"></div>
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="p-6 font-mono text-sm flex flex-col gap-3 overflow-hidden h-full text-[#6B7280]">
                <p><span className="text-[#E65100]">&gt;</span> [AUTH] Validating session token...</p>
                <p><span className="text-green-500">✓</span> Session established (8ms)</p>
                <p><span className="text-[#E65100]">&gt;</span> [SYNC] Connecting to Postgres pool...</p>
                <p><span className="text-green-500">✓</span> Database connected (12ms)</p>
                <p><span className="text-[#E65100]">&gt;</span> [STREAM] Subscribing to location_updates</p>
                <p className="text-[#F3F4F6] mt-4 border-l-2 border-[#E65100] pl-3 py-1 bg-[#0B0F19]">
                  payload: {"{"}<br/>
                  &nbsp;&nbsp;rider_id: 'R-7734',<br/>
                  &nbsp;&nbsp;lat: -1.2921, lng: 36.8219,<br/>
                  &nbsp;&nbsp;status: 'IN_TRANSIT'<br/>
                  {"}"}
                </p>
                <p className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-4 bg-[#E65100] animate-pulse"></span>
                  Listening for triggers...
                </p>
              </div>
            </div>
          </div>
          
        </div>

        {/* 
          DATA METRICS GRID
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          
          {/* Card 1 */}
          <div className="bg-[#161E2E] border border-gray-700 p-8 rounded-sm hover:border-[#6B7280] transition-colors">
            <h3 className="text-4xl font-extrabold text-[#F3F4F6] mb-2 tracking-tighter">99.9%</h3>
            <p className="text-sm font-bold text-[#E65100] uppercase tracking-wide mb-3">Uptime SLA</p>
            <p className="text-[#6B7280] text-sm font-medium leading-relaxed">
              Industrial-grade reliability for continuous dispatch operations.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#161E2E] border border-gray-700 p-8 rounded-sm hover:border-[#6B7280] transition-colors">
            <h3 className="text-4xl font-extrabold text-[#F3F4F6] mb-2 tracking-tighter">&lt;15ms</h3>
            <p className="text-sm font-bold text-[#E65100] uppercase tracking-wide mb-3">State Propagation</p>
            <p className="text-[#6B7280] text-sm font-medium leading-relaxed">
              Real-time database triggers reflect across all clients instantly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#161E2E] border border-gray-700 p-8 rounded-sm hover:border-[#6B7280] transition-colors">
            <h3 className="text-4xl font-extrabold text-[#F3F4F6] mb-2 tracking-tighter">0.0</h3>
            <p className="text-sm font-bold text-[#E65100] uppercase tracking-wide mb-3">Data Drift</p>
            <p className="text-[#6B7280] text-sm font-medium leading-relaxed">
              Absolute consistency between retailer queues and rider apps.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

export default HomePage;
