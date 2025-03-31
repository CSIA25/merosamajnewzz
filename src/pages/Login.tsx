// src/pages/Login.tsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Lock, EyeOff, Eye, Key, Building, Phone, Globe, MapPin, Info, Hash, Link as LinkIcon } from "lucide-react"; // Added LinkIcon

// --- Remove Dropzone and Storage imports ---
// import { useDropzone } from 'react-dropzone';
// import { cn } from "@/lib/utils";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { app } from "../firebase";

const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app); // Remove storage initialization

const focusAreasOptions = [
    "environment", "social welfare", "education", "healthcare", "animal welfare", "disaster relief", "community development", "human rights", "technology", "arts & culture", "other"
];

const Login = () => {
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);

    // --- Registration State ---
    const [registerName, setRegisterName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerRole, setRegisterRole] = useState<"volunteer" | "ngo">("volunteer");
    // NGO Specific State
    const [orgName, setOrgName] = useState("");
    const [orgDescription, setOrgDescription] = useState("");
    const [orgAddress, setOrgAddress] = useState("");
    const [orgContactEmail, setOrgContactEmail] = useState("");
    const [orgContactPhone, setOrgContactPhone] = useState("");
    const [orgWebsite, setOrgWebsite] = useState("");
    const [orgFocusAreas, setOrgFocusAreas] = useState<string[]>([]);
    const [orgRegistrationNumber, setOrgRegistrationNumber] = useState("");
    // --- NEW state for the link ---
    const [registrationDocShareLink, setRegistrationDocShareLink] = useState("");
    // --- Remove registrationDoc state ---
    // const [registrationDoc, setRegistrationDoc] = useState<File | null>(null);

    const navigate = useNavigate();

    // --- Remove Dropzone Logic ---

    const handleFocusAreaChange = (area: string) => {
        setOrgFocusAreas((prev) =>
            prev.includes(area)
                ? prev.filter((a) => a !== area)
                : [...prev, area]
        );
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        // ... (keep existing login logic) ...
        e.preventDefault();
        setLoadingLogin(true);
         const email = (e.target as HTMLFormElement).email.value;
         const password = (e.target as HTMLFormElement).password.value;
         try {
             await signInWithEmailAndPassword(auth, email, password);
             toast({ title: "Login Successful", description: "Welcome back!" });
             navigate("/");
         } catch (error: any) {
             console.error("Login Error:", error.message);
             toast({ title: "Login Failed", description: error.message, variant: "destructive" });
         } finally {
             setLoadingLogin(false);
         }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingRegister(true);

        const fullName = registerName;
        const email = registerEmail;
        const password = registerPassword;

        if (password !== confirmPassword) {
            toast({ title: "Registration Failed", description: "Passwords do not match.", variant: "destructive" });
            setLoadingRegister(false);
            return;
        }

        // Additional validation for NGO role
        if (registerRole === 'ngo') {
             // Check required fields, including the new link field
            if (!orgName || !orgDescription || !orgAddress || !orgContactEmail || orgFocusAreas.length === 0 || !registrationDocShareLink) {
                 toast({ title: "Missing Information", description: "Please fill all required (*) NGO details, including the document link.", variant: "destructive" });
                 setLoadingRegister(false);
                 return;
             }
             // Basic URL validation (optional but recommended)
             try {
                new URL(registrationDocShareLink);
             } catch (_) {
                 toast({ title: "Invalid Link", description: "Please provide a valid URL for the registration document.", variant: "destructive" });
                 setLoadingRegister(false);
                 return;
             }
        }

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Auth Profile (Display Name)
            await updateProfile(user, { displayName: fullName });

            // 3. Create User Document in Firestore ('users' collection)
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                name: fullName,
                email: email,
                role: registerRole,
                createdAt: serverTimestamp(),
            });

            // 4. IF NGO, create NGO Profile Document ('ngo_profiles' collection)
            if (registerRole === 'ngo') {
                 // --- REMOVED Document Upload Logic ---

                 // Create NGO profile document (WITH registrationDocShareLink)
                 const ngoProfileRef = doc(db, "ngo_profiles", user.uid);
                 await setDoc(ngoProfileRef, {
                     userId: user.uid,
                     orgName: orgName,
                     description: orgDescription,
                     address: orgAddress,
                     contactEmail: orgContactEmail,
                     contactPhone: orgContactPhone,
                     website: orgWebsite,
                     focusAreas: orgFocusAreas,
                     orgRegistrationNumber: orgRegistrationNumber,
                     registrationDocShareLink: registrationDocShareLink, // Save the provided link
                     verificationStatus: "pending",
                     submittedAt: serverTimestamp(),
                 });

                 // Update toast message for NGO
                 toast({
                    title: "NGO Registration Submitted",
                    description: "Your application is under review. An admin will check your provided document link.",
                    duration: 7000,
                });

            } else {
                // Volunteer registration successful
                 toast({
                    title: "Registration Successful",
                    description: "Welcome to Mero Samaj!",
                 });
            }

            navigate("/"); // Redirect to home after registration

        } catch (error: any) {
            console.error("Registration Error:", error.message, error.code);
             let friendlyMessage = error.message;
             // ... (keep existing friendly error message logic) ...
              if (error.code === 'auth/email-already-in-use') {
                 friendlyMessage = "This email address is already registered. Please try logging in.";
             } else if (error.code === 'auth/weak-password') {
                 friendlyMessage = "Password is too weak. Please choose a stronger password.";
             }
            toast({
                title: "Registration Failed",
                description: friendlyMessage,
                variant: "destructive",
            });
        } finally {
            setLoadingRegister(false);
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
        >
            <Navbar />
            <main className="flex-grow pt-24 md:pt-32 pb-16">
                <section>
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-lg mx-auto bg-card rounded-xl shadow-lg overflow-hidden border"
                        >
                            <div className="p-6 md:p-8">
                                <div className="text-center mb-8">
                                    <h1 className="text-2xl font-bold text-foreground">Welcome to Mero Samaj</h1>
                                    <p className="text-muted-foreground">Sign in or create your account</p>
                                </div>

                                <Tabs defaultValue="login" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="login">Login</TabsTrigger>
                                        <TabsTrigger value="register">Register</TabsTrigger>
                                    </TabsList>

                                    {/* --- Login Form --- */}
                                    <TabsContent value="login">
                                        {/* ... Keep existing login form JSX ... */}
                                        <form onSubmit={handleLogin} className="space-y-4">
                                            <div className="space-y-1">
                                                 <Label htmlFor="email">Email</Label>
                                                 <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" name="email" placeholder="your@email.com" className="pl-10" required /></div>
                                            </div>
                                            <div className="space-y-1">
                                                 <div className="flex justify-between items-center"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link></div>
                                                 <div className="relative">
                                                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                     <Input id="password" type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" className="pl-10 pr-10" required />
                                                     <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                                                 </div>
                                            </div>
                                            <div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Checkbox id="remember" /><Label htmlFor="remember" className="text-sm font-normal">Remember me</Label></div></div>
                                            <Button type="submit" className="w-full btn-gradient" disabled={loadingLogin}>{loadingLogin ? "Signing in..." : "Sign In"}</Button>
                                        </form>
                                    </TabsContent>

                                    {/* --- Registration Form --- */}
                                    <TabsContent value="register">
                                        <form onSubmit={handleRegister} className="space-y-4">
                                             {/* Role Selection */}
                                             <div className="space-y-2">
                                                <Label>Registering as *</Label>
                                                <Select value={registerRole} onValueChange={(value) => setRegisterRole(value as "volunteer" | "ngo")} required>
                                                     <SelectTrigger className="w-full"><SelectValue placeholder="Select your role..." /></SelectTrigger>
                                                     <SelectContent>
                                                         <SelectItem value="volunteer">Volunteer</SelectItem>
                                                         <SelectItem value="ngo">Non-Governmental Organization (NGO)</SelectItem>
                                                     </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Common Fields */}
                                            {/* ... Keep Name, Email, Password, Confirm Password fields ... */}
                                             <div className="space-y-1"><Label htmlFor="reg-name">Full Name *</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="reg-name" placeholder="Your Full Name" className="pl-10" required value={registerName} onChange={(e) => setRegisterName(e.target.value)} /></div></div>
                                             <div className="space-y-1"><Label htmlFor="reg-email">Email Address *</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="reg-email" type="email" placeholder="your@email.com" className="pl-10" required value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} /></div></div>
                                             <div className="space-y-1"><Label htmlFor="reg-password">Create Password *</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" className="pl-10 pr-10" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div>
                                             <div className="space-y-1"><Label htmlFor="confirm-password">Confirm Password *</Label><div className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirm your password" className="pl-10" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div></div>


                                            {/* --- NGO Specific Fields --- */}
                                            {registerRole === 'ngo' && (
                                                <motion.div
                                                     initial={{ opacity: 0, height: 0 }}
                                                     animate={{ opacity: 1, height: 'auto' }}
                                                     transition={{ duration: 0.3 }}
                                                     className="space-y-4 border-t pt-4 mt-4"
                                                >
                                                     <h3 className="text-lg font-medium text-center text-primary">NGO Information</h3>
                                                    {/* ... Keep Org Name, Description, Address, ContactEmail, ContactPhone, Website, Focus Areas ... */}
                                                     <div className="space-y-1"><Label htmlFor="orgName">Organization Name *</Label><div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgName" placeholder="Official Name" className="pl-10" value={orgName} onChange={(e) => setOrgName(e.target.value)} required /></div></div>
                                                     <div className="space-y-1"><Label htmlFor="orgDescription">Description *</Label><Textarea id="orgDescription" placeholder="Mission, goals, activities..." value={orgDescription} onChange={(e) => setOrgDescription(e.target.value)} required /></div>
                                                     <div className="space-y-1"><Label htmlFor="orgAddress">Full Address *</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgAddress" placeholder="Street, City, District" className="pl-10" value={orgAddress} onChange={(e) => setOrgAddress(e.target.value)} required /></div></div>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1"><Label htmlFor="orgContactEmail">Contact Email *</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgContactEmail" type="email" placeholder="info@org.com" className="pl-10" value={orgContactEmail} onChange={(e) => setOrgContactEmail(e.target.value)} required /></div></div>
                                                        <div className="space-y-1"><Label htmlFor="orgContactPhone">Contact Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgContactPhone" type="tel" placeholder="Optional phone number" className="pl-10" value={orgContactPhone} onChange={(e) => setOrgContactPhone(e.target.value)} /></div></div>
                                                     </div>
                                                     <div className="space-y-1"><Label htmlFor="orgWebsite">Website (Optional)</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgWebsite" placeholder="https://your-org.org" className="pl-10" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} /></div></div>
                                                     <div className="space-y-2">
                                                         <Label>Focus Areas * (Select all that apply)</Label>
                                                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 max-h-40 overflow-y-auto border rounded p-3 bg-background">
                                                             {focusAreasOptions.map((area) => (<div key={area} className="flex items-center space-x-2"><Checkbox id={`focus-${area}`} checked={orgFocusAreas.includes(area)} onCheckedChange={() => handleFocusAreaChange(area)} /><Label htmlFor={`focus-${area}`} className="text-sm font-normal cursor-pointer">{area}</Label></div>))}
                                                         </div>
                                                         {orgFocusAreas.length === 0 && <p className="text-xs text-destructive">Please select at least one focus area.</p>}
                                                     </div>
                                                     <div className="space-y-1"><Label htmlFor="orgRegistrationNumber">Registration Number (Optional)</Label><div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="orgRegistrationNumber" placeholder="e.g., Reg-12345" className="pl-10" value={orgRegistrationNumber} onChange={(e) => setOrgRegistrationNumber(e.target.value)} /></div></div>

                                                    {/* --- NEW Link Input Field --- */}
                                                     <div className="space-y-1">
                                                         <Label htmlFor="registrationDocShareLink">Link to Registration Document *</Label>
                                                         <div className="relative">
                                                             <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                             <Input
                                                                id="registrationDocShareLink"
                                                                type="url"
                                                                placeholder="https://docs.google.com/..."
                                                                className="pl-10"
                                                                value={registrationDocShareLink}
                                                                onChange={(e) => setRegistrationDocShareLink(e.target.value)}
                                                                required
                                                            />
                                                         </div>
                                                         <p className="text-xs text-muted-foreground mt-1">
                                                             Provide a publicly shareable link (e.g., Google Drive, Dropbox 'anyone with link can view'). Admin will verify this.
                                                         </p>
                                                         {!registrationDocShareLink && <p className="text-xs text-destructive">Document link is required for NGOs.</p>}
                                                     </div>
                                                     {/* --- End Link Input Field --- */}

                                                    {/* --- REMOVED Document Upload UI --- */}

                                                </motion.div>
                                            )}
                                            {/* --- End NGO Specific Fields --- */}

                                            <div className="flex items-start space-x-2 pt-2">
                                                <Checkbox id="terms" required />
                                                <Label htmlFor="terms" className="text-xs font-normal leading-snug">
                                                    I agree to the Mero Samaj
                                                    <Link to="/terms-of-service" className="text-primary hover:underline ml-1">Terms</Link> and
                                                    <Link to="/privacy-policy" className="text-primary hover:underline ml-1">Privacy Policy</Link>.
                                                </Label>
                                            </div>

                                            <Button type="submit" variant="gradient" className="w-full" disabled={loadingRegister}>
                                                {loadingRegister ? "Submitting..." : "Create Account"}
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default Login;