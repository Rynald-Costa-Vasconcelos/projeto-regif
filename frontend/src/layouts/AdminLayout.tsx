import { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Menu, LogOut, User } from "lucide-react";
import { clearSession, getSessionUser } from "../shared/auth/session";

import logoBranca from "../assets/icons/icon_branco.png";

export function AdminLayout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = getSessionUser();
  if (!user) return null;

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50 w-full overflow-hidden font-sans">
      
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        closeMobile={() => setIsMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="h-16 bg-regif-blue shadow-md flex items-center justify-between px-4 z-30 relative shrink-0">
          <div className="flex items-center w-20">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-white hover:bg-white/10 p-2 rounded-md"
            >
              <Menu size={24} />
            </button>
          </div>

          <Link to="/admin/dashboard" className="flex items-center justify-center hover:opacity-90 transition-opacity">
            <img 
              src={logoBranca} 
              alt="REGIF Logo" 
              className="h-10 w-auto object-contain" 
            />
          </Link>

          <div className="flex items-center justify-end w-20 gap-3">
             <div className="hidden md:flex items-center justify-center h-9 w-9 rounded-full bg-regif-dark text-white text-sm font-bold border-2 border-regif-green" title={user.email}>
                {user.name ? user.name.charAt(0).toUpperCase() : <User size={16}/>}
             </div>
             <button onClick={handleLogout} className="text-white/80 hover:text-regif-red hover:bg-white/10 p-2 rounded-full transition-colors" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 relative w-full custom-scrollbar">
          <div className="max-w-7xl mx-auto">
             {/* O Outlet renderiza Dashboard, NewsList, etc. */}
             <Outlet />
          </div>
        </main>
      
      </div>
    </div>
  );
}