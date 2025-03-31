import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase"; // Adjust path if needed

// --- Define the possible roles ---
type UserRole = 'volunteer' | 'ngo' | 'superadmin' | null;

interface AuthUser extends User {
  role?: UserRole; // Use the UserRole type here
  // Add other custom user properties if needed from Firestore
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: UserRole; // Use the UserRole type here
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null, // Default remains null
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null); // Use the UserRole type here
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userRef = doc(db, "users", authUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            // Explicitly cast the data role to UserRole
            const userData = docSnap.data() as { role?: UserRole; name?: string };
            const combinedUser: AuthUser = {
              ...authUser,
              // Ensure the role fits the UserRole type, default to null if undefined/invalid
              role: ['volunteer', 'ngo', 'superadmin'].includes(userData.role as string) ? userData.role : null,
              name: userData.name || authUser.displayName || undefined,
            };
            setUser(combinedUser);
            setUserRole(combinedUser.role || null);
             console.log(`AuthContext: User ${authUser.uid} logged in. Role fetched: ${combinedUser.role}`); // Added log
          } else {
            // User exists in Auth but not Firestore (e.g., incomplete registration)
            console.warn("AuthContext: User data not found in Firestore for UID:", authUser.uid);
             const basicUser: AuthUser = {
                ...authUser,
                role: null, // explicitly set role to null
                name: authUser.displayName || undefined,
             }
            setUser(basicUser);
            setUserRole(null);
          }
        } catch (error) {
            console.error("AuthContext: Error fetching user data from Firestore:", error);
            // Still set basic auth user even if Firestore fetch fails
             const basicUser: AuthUser = {
                ...authUser,
                role: null, // explicitly set role to null
                name: authUser.displayName || undefined,
             }
            setUser(basicUser);
            setUserRole(null);
        }
      } else {
        console.log("AuthContext: No user logged in."); // Added log
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = { user, userRole, loading };

  // Log the context value whenever it changes (optional for debugging)
  // useEffect(() => {
  //   console.log("AuthContext value updated:", value);
  // }, [value]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};