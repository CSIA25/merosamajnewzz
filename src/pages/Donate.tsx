// src/pages/Donate.tsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Gift, DollarSign, PackagePlus, Users, Upload, MapPin, Info } from "lucide-react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../firebase";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";
import { DonationLeaderboardSection } from "@/components/sections/leaderboard-section"; // <-- Import Leaderboard

// --- FoodDonationForm Component (Keep as is) ---
const FoodDonationForm = () => {
    // ... existing FoodDonationForm code ...
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({ foodDescription: "", quantity: "", pickupLocation: "", pickupInstructions: "", contactName: "", contactPhone: "", });
    const auth = getAuth(app); const user = auth.currentUser; const db = getFirestore(app); const storage = getStorage(app);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
    const onDrop = useCallback((acceptedFiles: File[]) => { if (acceptedFiles.length > 0) { const selectedFile = acceptedFiles[0]; setFile(selectedFile); const reader = new FileReader(); reader.onloadend = () => { setImageUrl(reader.result as string); }; reader.readAsDataURL(selectedFile); } }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false });
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!user) { toast({ title: "Please Login", description: "You must be logged in to donate food.", variant: "destructive" }); return; } setLoading(true); setImageUrl(null); try { let uploadedImageUrl: string | null = null; if (file) { const storageRef = ref(storage, `foodDonations/${user.uid}/${Date.now()}_${file.name}`); const snapshot = await uploadBytes(storageRef, file); uploadedImageUrl = await getDownloadURL(snapshot.ref); } const donationData = { donorId: user.uid, donorName: user.displayName || user.email || 'Anonymous Donor', ...formData, imageUrl: uploadedImageUrl, status: 'available', createdAt: serverTimestamp(), }; await addDoc(collection(db, "foodDonations"), donationData); toast({ title: "Donation Listed", description: "Your food donation has been listed." }); setFormData({ foodDescription: "", quantity: "", pickupLocation: "", pickupInstructions: "", contactName: "", contactPhone:"" }); setFile(null); setImageUrl(null); } catch (error: any) { console.error("Error listing donation:", error); toast({ title: "Listing Failed", description: `An error occurred: ${error.message}`, variant: "destructive" }); } finally { setLoading(false); } };
    return (<motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-background rounded-xl shadow-lg p-6 md:p-8"><h2 className="text-2xl font-semibold mb-6">Offer Surplus Food</h2><form onSubmit={handleSubmit} className="space-y-6"> <div className="space-y-2"><Label htmlFor="foodDescription">Food Description *</Label><Textarea id="foodDescription" name="foodDescription" placeholder="..." value={formData.foodDescription} onChange={handleChange} required /></div> <div className="space-y-2"><Label htmlFor="quantity">Approximate Quantity *</Label><Input id="quantity" name="quantity" placeholder="..." value={formData.quantity} onChange={handleChange} required /></div> <div className="space-y-2"><Label htmlFor="pickupLocation">Pickup Location *</Label><Input id="pickupLocation" name="pickupLocation" placeholder="..." value={formData.pickupLocation} onChange={handleChange} required /></div> <div className="space-y-2"><Label htmlFor="pickupInstructions">Pickup Instructions (Optional)</Label><Textarea id="pickupInstructions" name="pickupInstructions" placeholder="..." value={formData.pickupInstructions} onChange={handleChange} /></div> <div className="space-y-2"><Label htmlFor="contactName">Contact Name (Optional)</Label><Input id="contactName" name="contactName" placeholder="..." value={formData.contactName} onChange={handleChange} /></div> <div className="space-y-2"><Label htmlFor="contactPhone">Contact Phone (Optional)</Label><Input id="contactPhone" name="contactPhone" type="tel" placeholder="..." value={formData.contactPhone} onChange={handleChange} /></div> <div className="space-y-2"><Label htmlFor="image">Upload Image (Optional)</Label><div {...getRootProps()} className={cn("border-2 ...", isDragActive && "...")}><input {...getInputProps()} /><Upload className="mx-auto ..."/> <p className="text-sm ...">{isDragActive ? "Drop..." : "Drag & drop..."}</p></div> {imageUrl && file && (<div className="mt-4"><p>Preview:</p><img src={imageUrl} alt="Preview"/></div>)} {!imageUrl && file && (<div className="mt-2"><p>Selected: {file.name}</p></div>)} </div> <div className="bg-blue-50 ..."><Info className="h-5 w-5 ..."/> <p className="text-sm ...">A volunteer will contact you...</p></div> <Button type="submit" variant="gradient" className="w-full" disabled={loading}>{loading ? "Submitting..." : "List Food Donation"}</Button></form></motion.div>);
};

// --- Main Donate Page Component ---
const DonatePage = () => {
  const { toast } = useToast();
  const [donationAmount, setDonationAmount] = useState<string>("50");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donationType, setDonationType] = useState<string>("oneTime");
  const [financialLoading, setFinancialLoading] = useState(false);

  const handleAmountSelect = (amount: string) => { /* ... */ };
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const handleFinancialSubmit = (e: React.FormEvent) => { /* ... */ };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
    >
      <Navbar />
      <main className="flex-grow pt-20 pb-10"> {/* Adjusted padding */}
        {/* Section 1: Donation Forms */}
        <section className="pt-12 md:pt-16 pb-10 md:pb-16"> {/* Adjusted padding */}
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Make a Difference</h1>
              <p className="text-muted-foreground">
                Your contributions help create lasting change. Choose to donate financially or offer surplus food.
              </p>
            </motion.div>

            <Tabs defaultValue="donateMoney" className="max-w-5xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="donateMoney">
                  <DollarSign className="mr-2 h-4 w-4" /> Financial Donation
                </TabsTrigger>
                <TabsTrigger value="donateFood">
                  <PackagePlus className="mr-2 h-4 w-4" /> Donate Food
                </TabsTrigger>
              </TabsList>

              <TabsContent value="donateMoney" className="mt-0">
                {/* ... Financial Donation Form and Impact Card ... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Financial Donation Form */}
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-background rounded-xl shadow-lg p-6 md:p-8">
                        <form onSubmit={handleFinancialSubmit} className="space-y-6">
                             {/* Amount Selection */} <div className="space-y-4"><Label>Donation Amount</Label><div className="grid grid-cols-3 gap-3">{["25", "50", "100", "250", "500", "custom"].map((amount) => (<Button key={amount} type="button" variant={donationAmount === amount ? "default" : "outline"} onClick={() => handleAmountSelect(amount)} className={amount === "custom" ? "col-span-3" : ""}>{amount === "custom" ? "Custom Amount" : `$${amount}`}</Button>))}</div>{donationAmount === "custom" && (<div className="pt-2"><Label htmlFor="customAmount">Enter Amount</Label><div className="relative mt-1"><DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="customAmount" type="number" min="1" step="1" placeholder="Enter custom amount" className="pl-10" value={customAmount} onChange={handleCustomAmountChange} required={donationAmount === 'custom'}/></div></div>)}</div>
                             {/* Donation Type */} <div className="space-y-3"><Label>Donation Type</Label><RadioGroup value={donationType} onValueChange={setDonationType} className="flex flex-col space-y-2"><div className="flex items-center space-x-2"><RadioGroupItem value="oneTime" id="oneTime" /><Label htmlFor="oneTime">One-time Donation</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="monthly" id="monthly" /><Label htmlFor="monthly">Monthly Recurring</Label></div></RadioGroup></div>
                             {/* Submit Button */} <div className="pt-6"><Button type="submit" variant="gradient" className="w-full" disabled={financialLoading}>{financialLoading ? "Processing..." : "Continue to Payment (Simulated)"}</Button><p className="text-xs text-muted-foreground mt-2 text-center">Payment gateway integration needed.</p></div>
                         </form>
                     </motion.div>
                     {/* Impact/Other Ways Side */}
                     <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-6">
                         <Card><CardHeader><CardTitle>Your Impact (Examples)</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-start space-x-3"><div className="bg-purple-100 p-2 rounded-lg"><Gift className="h-5 w-5 text-purple-600" /></div><div><h4 className="font-medium">$25</h4><p className="text-sm text-muted-foreground">Provides essential supplies</p></div></div><div className="flex items-start space-x-3"><div className="bg-teal-100 p-2 rounded-lg"><Gift className="h-5 w-5 text-teal-600" /></div><div><h4 className="font-medium">$50</h4><p className="text-sm text-muted-foreground">Supports a community workshop</p></div></div></CardContent></Card>
                         <Card><CardHeader><CardTitle>Other Ways to Help</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-start space-x-3"><div className="bg-muted p-2 rounded-lg"><PackagePlus className="h-5 w-5" /></div><div><h4 className="font-medium">Donate Food</h4><p className="text-sm text-muted-foreground">List surplus food in the next tab.</p></div></div><div className="flex items-start space-x-3"><div className="bg-muted p-2 rounded-lg"><Users className="h-5 w-5" /></div><div><h4 className="font-medium">Volunteer</h4><p className="text-sm text-muted-foreground">Join our volunteer program.</p></div></div></CardContent></Card>
                     </motion.div>
                 </div>
              </TabsContent>

              <TabsContent value="donateFood" className="mt-0">
                <FoodDonationForm />
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Section 2: Leaderboard */}
        <DonationLeaderboardSection /> {/* <-- Add Leaderboard Section Here */}

      </main>
      <Footer />
    </motion.div>
  );
};

export default DonatePage;