// src/components/layout/navbar.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, UserCircle, LogOut, Settings, LayoutDashboard } from "lucide-react"; // Added icons
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { getAuth, signOut } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, loading } = useAuth(); // Use the context

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Report Issue", path: "/report" },
    { name: "Organizations", path: "/organizations" },
    { name: "Volunteer", path: "/volunteer" },
    { name: "Donate", path: "/donate" },
    { name: "How It Works", path: "/how-it-works"}, // Add How It Works link
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/login"); // Redirect to login page
    } catch (error: any) {
      console.error("Logout Error:", error.message);
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    }
     setIsOpen(false); // Close mobile menu on logout
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };


  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 via-teal-500 to-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">MS</span>
          </div>
          <span className="font-bold text-xl hidden sm:block text-gradient">Mero Samaj</span>
        </Link>

        {/* Desktop Navigation */}
        <motion.div
          className="hidden md:flex items-center gap-6"
          variants={navVariants}
          initial="hidden"
          animate="visible"
        >
          {navLinks.map((link) => (
            <motion.div key={link.name} variants={itemVariants}>
              <Link
                to={link.path}
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.name}
              </Link>
            </motion.div>
          ))}

          {/* Conditionally render login or user icon */}
          {loading ? (
             <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div> // Loading skeleton
          ) : user ? (
            <motion.div variants={itemVariants}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                     <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mr-4 mt-2" align="end">
                   <DropdownMenuLabel>
                     <div className="font-medium">{user.displayName || user.email}</div>
                     <div className="text-xs text-muted-foreground capitalize">
                         {userRole || 'User'} {/* Display Role */}
                     </div>
                    </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                     <LayoutDashboard className="mr-2 h-4 w-4"/>
                    Dashboard
                  </DropdownMenuItem>
                   {/* Add more common items like Settings if needed */}
                   {/* <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                     <Settings className="mr-2 h-4 w-4"/>
                     Settings
                   </DropdownMenuItem> */}
                   {/* Add Role Specific Items Here If Necessary - But keeping it simple for now */}
                   {/* {userRole === 'ngo' && (
                       <DropdownMenuItem onClick={() => navigate("/dashboard/issues")}>View Issues</DropdownMenuItem>
                   )} */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4"/>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <Button asChild variant="gradient" className="btn-gradient rounded-full text-sm">
                <Link to="/login">Login / Register</Link>
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Mobile Navigation Toggle */}
        <div className="md:hidden flex items-center">
           {/* User Icon/Login for Mobile - Simplified */}
           {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse mr-2"></div>
           ) : !user ? (
               <Button asChild size="sm" variant="ghost" className="mr-1 px-2">
                   <Link to="/login">Login</Link>
               </Button>
           ) : null }
           {/* Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden border-t border-border bg-background" // Added bg-background
        >
          <div className="container mx-auto py-4 flex flex-col space-y-2 px-4"> {/* Reduced padding/space */}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-foreground/80 hover:text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors text-base" // Larger text for mobile
              >
                {link.name}
              </Link>
            ))}
             {/* Separator */}
             {user && <DropdownMenuSeparator className="my-1 bg-border"/>}

              {/* User specific mobile links */}
              {user && (
                  <>
                      <Link
                          to="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="text-foreground/80 hover:text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors text-base flex items-center"
                      >
                           <LayoutDashboard className="mr-2 h-4 w-4"/> Dashboard
                      </Link>
                      {/* <Link
                          to="/settings"
                          onClick={() => setIsOpen(false)}
                          className="text-foreground/80 hover:text-foreground px-4 py-2 rounded-md hover:bg-muted transition-colors text-base flex items-center"
                      >
                           <Settings className="mr-2 h-4 w-4"/> Settings
                      </Link> */}
                      <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:text-destructive px-4 py-2 rounded-md hover:bg-destructive/10 transition-colors text-base justify-start flex items-center w-full">
                           <LogOut className="mr-2 h-4 w-4"/> Logout
                      </Button>
                  </>
              )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}