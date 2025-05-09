import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signIn, registerUser, signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Define the auth context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  logout: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signIn: () => Promise.reject("AuthContext not initialized"),
  signUp: () => Promise.reject("AuthContext not initialized"),
  logout: () => Promise.reject("AuthContext not initialized"),
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Listen for auth state changes when the provider mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Sign in handler
  const handleSignIn = async (email: string, password: string) => {
    try {
      const user = await signIn(email, password);
      toast({
        title: "Sign In Successful",
        description: "Welcome back to EstablishmentDir!",
      });
      return user;
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign up handler
  const handleSignUp = async (email: string, password: string, displayName?: string) => {
    try {
      const user = await registerUser(email, password, displayName);
      toast({
        title: "Sign Up Successful",
        description: "Your account has been created!",
      });
      return user;
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
