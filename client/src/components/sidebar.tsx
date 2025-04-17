import { useState } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart4,
  Box,
  Users,
  DollarSign,
  FileText,
  Settings,
  Menu,
} from "lucide-react";

const Sidebar = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const routes = [
    {
      path: "/",
      name: "Dashboard",
      icon: <BarChart4 className="h-5 w-5 mr-2" />,
    },
    {
      path: "/inventory",
      name: "Inventori",
      icon: <Box className="h-5 w-5 mr-2" />,
    },
    {
      path: "/consignment",
      name: "Konsinyasi",
      icon: <Users className="h-5 w-5 mr-2" />,
    },
    {
      path: "/sales",
      name: "Penjualan",
      icon: <DollarSign className="h-5 w-5 mr-2" />,
    },
    {
      path: "/reports",
      name: "Laporan",
      icon: <FileText className="h-5 w-5 mr-2" />,
    },
    {
      path: "/settings",
      name: "Pengaturan",
      icon: <Settings className="h-5 w-5 mr-2" />,
    },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <aside className="w-full md:w-64 bg-neutral-800 text-white md:min-h-screen">
      <div className="p-4 flex justify-between items-center md:justify-center md:py-6">
        <h1 className="font-bold text-xl">Kaos Inventory</h1>
        <button className="md:hidden" onClick={toggleMobileMenu}>
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <nav className={cn(mobileMenuOpen ? "block" : "hidden", "md:block")}>
        <ul className="p-2">
          {routes.map((route) => (
            <li key={route.path}>
              <Link href={route.path}>
                <a
                  className={cn(
                    "block py-2 px-4 rounded mb-1 flex items-center",
                    location === route.path
                      ? "text-neutral-100 bg-primary"
                      : "text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {route.icon}
                  {route.name}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
