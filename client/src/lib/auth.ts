import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { auth } from "./firebase";

// Register new user
export const registerUser = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName
      });
    }
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to register");
  }
};

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in");
  }
};

// Sign out user
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return true;
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out");
  }
};

// Get current authenticated user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};
