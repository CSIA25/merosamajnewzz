// src/pages/SuperAdminPanel.tsx
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { app } from "@/firebase";
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Import Link
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink, Mail, Phone, Hash, Link as LinkIcon, Ban } from 'lucide-react'; // Added Ban, LinkIcon
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Globe } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NgoProfile {
    id: string;
    orgName: string;
    description: string;
    address: string;
    contactEmail: string;
    contactPhone?: string;
    website?: string;
    focusAreas: string[];
    orgRegistrationNumber?: string;
    registrationDocShareLink?: string; // Using the share link
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'revoked';
    userId: string;
    submittedAt: Timestamp;
}

const SuperAdminPanel = () => {
    const { userRole, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [pendingNgos, setPendingNgos] = useState<NgoProfile[]>([]);
    const [approvedNgos, setApprovedNgos] = useState<NgoProfile[]>([]);
    const [loadingNgos, setLoadingNgos] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const db = getFirestore(app);

    // Fetch Pending and Approved NGOs
    useEffect(() => {
        const fetchNgos = async () => {
            if (userRole !== 'superadmin') return;
            setLoadingNgos(true); setError(null); console.log("SuperAdminPanel: Fetching NGOs...");
            try {
                const pendingQuery = query(collection(db, "ngo_profiles"), where("verificationStatus", "==", "pending"));
                const approvedQuery = query(collection(db, "ngo_profiles"), where("verificationStatus", "==", "approved"), orderBy("orgName")); // Order approved
                const [pendingSnapshot, approvedSnapshot] = await Promise.all([getDocs(pendingQuery), getDocs(approvedQuery)]);
                const pending: NgoProfile[] = []; pendingSnapshot.forEach((doc) => { pending.push({ id: doc.id, ...doc.data() } as NgoProfile); }); setPendingNgos(pending); console.log(`Found ${pending.length} pending NGOs.`);
                const approved: NgoProfile[] = []; approvedSnapshot.forEach((doc) => { approved.push({ id: doc.id, ...doc.data() } as NgoProfile); }); setApprovedNgos(approved); console.log(`Found ${approved.length} approved NGOs.`);
            } catch (err: any) { console.error("Error fetching NGOs:", err); setError("Failed to load NGO applications."); }
            finally { setLoadingNgos(false); console.log("NGO Fetching finished."); }
        };
        if (!authLoading) { fetchNgos(); }
    }, [db, userRole, authLoading]);

    // Handles Approve/Reject
     const handleVerification = async (ngoUserId: string, ngoOrgName: string, newStatus: 'approved' | 'rejected') => {
        setUpdatingId(ngoUserId);
        const ngoProfileRef = doc(db, "ngo_profiles", ngoUserId);
        const userRef = doc(db, "users", ngoUserId);
         console.log(`SuperAdminPanel: Updating status for ${ngoUserId} to ${newStatus}`);
        try {
            await updateDoc(ngoProfileRef, { verificationStatus: newStatus });
             if (newStatus === 'approved') {
                // IMPORTANT: Set the role in the users collection
                await updateDoc(userRef, { role: 'ngo' });
                console.log(`Updated user role for ${ngoUserId} to 'ngo'`);
             }
            toast({ title: `NGO ${newStatus}`, description: `Application for ${ngoOrgName} has been ${newStatus}.`, variant: newStatus === 'approved' ? 'default' : 'destructive' });
            // Update local state immediately
            const updatedNgo = pendingNgos.find(n => n.id === ngoUserId);
            setPendingNgos(prev => prev.filter(ngo => ngo.id !== ngoUserId));
            if (newStatus === 'approved' && updatedNgo) {
                setApprovedNgos(prev => [...prev, {...updatedNgo, verificationStatus: 'approved'} as NgoProfile].sort((a, b) => a.orgName.localeCompare(b.orgName)));
            }
        } catch (err: any) { console.error(`Error ${newStatus === 'approved' ? 'approving' : 'rejecting'} NGO:`, err); toast({ title: "Update Failed", description: err.message, variant: "destructive" }); }
        finally { setUpdatingId(null); }
    };

    // Handles Revoking Approval
     const handleRevokeApproval = async (ngoUserId: string, ngoOrgName: string) => {
          setUpdatingId(ngoUserId);
          const ngoProfileRef = doc(db, "ngo_profiles", ngoUserId);
          const userRef = doc(db, "users", ngoUserId);
          console.log(`SuperAdminPanel: Revoking approval for ${ngoUserId}`);
          try {
              await updateDoc(ngoProfileRef, { verificationStatus: 'revoked' });
              await updateDoc(userRef, { role: null }); // Reset role
              toast({ title: "NGO Approval Revoked", description: `Approval for ${ngoOrgName} has been revoked.`, variant: "destructive" });
              setApprovedNgos(prev => prev.filter(ngo => ngo.id !== ngoUserId));
          } catch (err: any) { console.error(`Error revoking NGO ${ngoUserId}:`, err); toast({ title: "Revoke Failed", description: err.message, variant: "destructive" }); }
          finally { setUpdatingId(null); }
     };

    // Loading and Access Denied Checks
     if (authLoading) { return (<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="ml-4 text-muted-foreground">Verifying Access...</span></div>); }
     if (userRole !== 'superadmin') { return ( <div className="min-h-screen flex flex-col"><Navbar /><main className="flex-grow flex items-center justify-center text-center p-4"><div><h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1><p className="text-muted-foreground">You do not have permission.</p><Button asChild className="mt-4"><Link to="/">Go Home</Link></Button></div></main><Footer /></div> )}


    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-24 pb-16">
             <section>
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Super Admin Panel</h1>

                     <Tabs defaultValue="pending" className="w-full">
                         <TabsList className="mb-6">
                             <TabsTrigger value="pending">Pending Approval ({pendingNgos.length})</TabsTrigger>
                             <TabsTrigger value="approved">Approved NGOs ({approvedNgos.length})</TabsTrigger>
                         </TabsList>

                         {/* Pending NGOs Tab */}
                         <TabsContent value="pending">
                            {loadingNgos && (<div className="flex justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>)}
                            {error && (<div className="text-destructive bg-destructive/10 p-4 rounded-md mb-6">{error}</div>)}
                            {!loadingNgos && !error && pendingNgos.length === 0 && (<p className="text-muted-foreground text-center py-8">No pending NGO applications.</p>)}
                            {!loadingNgos && !error && pendingNgos.length > 0 && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     {pendingNgos.map(ngo => (
                                        <Card key={ngo.id} className="flex flex-col bg-card border">
                                            <CardHeader><CardTitle>{ngo.orgName}</CardTitle><CardDescription>{ngo.address || 'Address not provided'}</CardDescription></CardHeader>
                                            <CardContent className="flex-grow space-y-3 text-sm">
                                                 <p><strong className="font-medium">Desc:</strong> {ngo.description || 'N/A'}</p>
                                                 <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactEmail}</span></div>
                                                 {ngo.contactPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactPhone}</span></div>}
                                                 {ngo.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{ngo.website}</a></div>}
                                                 {ngo.orgRegistrationNumber && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/> <span>{ngo.orgRegistrationNumber}</span></div>}
                                                 <div><strong className="font-medium block mb-1">Focus Areas:</strong><div className="flex flex-wrap gap-1">{ngo.focusAreas?.map(area => <Badge key={area} variant="secondary">{area}</Badge>) || <span className="text-muted-foreground text-xs">None</span>}</div></div>
                                                 <div className="pt-1">
                                                     <strong className="font-medium block mb-1">Document Link:</strong>
                                                     {ngo.registrationDocShareLink ? (
                                                         <a href={ngo.registrationDocShareLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all inline-flex items-center text-xs sm:text-sm">
                                                             <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0"/> Verify Document <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0"/>
                                                         </a>
                                                     ) : ( <span className="text-muted-foreground italic">No link provided.</span> )}
                                                 </div>
                                                 <p className="text-xs text-muted-foreground pt-2">Submitted: {ngo.submittedAt instanceof Timestamp ? format(ngo.submittedAt.toDate(), "PPp") : 'Unknown date'}</p>
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                 <AlertDialog>
                                                     <AlertDialogTrigger asChild><Button variant="outline" size="sm" disabled={updatingId === ngo.id} className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive">{updatingId === ngo.id && updatingId === ngo.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-1"/>}Reject</Button></AlertDialogTrigger>
                                                     <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Rejection</AlertDialogTitle><AlertDialogDescription>Reject application for "{ngo.orgName}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={updatingId === ngo.id}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleVerification(ngo.id, ngo.orgName, 'rejected')} disabled={updatingId === ngo.id} className={buttonVariants({variant: "destructive"})}>Confirm Reject</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                                 </AlertDialog>
                                                 <Button variant="default" size="sm" onClick={() => handleVerification(ngo.id, ngo.orgName, 'approved')} disabled={!ngo.registrationDocShareLink || updatingId === ngo.id} className="bg-green-600 hover:bg-green-700 text-white">
                                                    {updatingId === ngo.id && updatingId === ngo.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-1"/>}Approve
                                                 </Button>
                                            </CardFooter>
                                        </Card>
                                     ))}
                                 </div>
                             )}
                         </TabsContent>

                          {/* Approved NGOs Tab */}
                         <TabsContent value="approved">
                            {/* ... Loading/Error/Empty states ... */}
                            {loadingNgos && (<div className="flex justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>)}
                            {error && (<div className="text-destructive bg-destructive/10 p-4 rounded-md mb-6">{error}</div>)}
                            {!loadingNgos && !error && approvedNgos.length === 0 && (<p className="text-muted-foreground text-center py-8">No NGOs have been approved yet.</p>)}

                            {!loadingNgos && !error && approvedNgos.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     {approvedNgos.map(ngo => (
                                        <Card key={ngo.id} className="flex flex-col bg-card border">
                                            <CardHeader><CardTitle>{ngo.orgName}</CardTitle><CardDescription>{ngo.address || 'Address not provided'}</CardDescription></CardHeader>
                                            <CardContent className="flex-grow space-y-3 text-sm">
                                                 {/* ... Display other NGO details ... */}
                                                 <p><strong className="font-medium">Desc:</strong> {ngo.description || 'N/A'}</p>
                                                 <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactEmail}</span></div>
                                                 {ngo.contactPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> <span>{ngo.contactPhone}</span></div>}
                                                 {ngo.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground"/> <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{ngo.website}</a></div>}
                                                 {ngo.orgRegistrationNumber && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground"/> <span>{ngo.orgRegistrationNumber}</span></div>}
                                                 <div><strong className="font-medium block mb-1">Focus Areas:</strong><div className="flex flex-wrap gap-1">{ngo.focusAreas?.map(area => <Badge key={area} variant="secondary">{area}</Badge>) || <span className="text-muted-foreground text-xs">None</span>}</div></div>
                                                 {ngo.registrationDocShareLink && (
                                                     <div className="pt-1"><strong className="font-medium block mb-1">Reg Doc Link:</strong><a href={ngo.registrationDocShareLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all inline-flex items-center text-xs sm:text-sm"><LinkIcon className="h-4 w-4 mr-1 flex-shrink-0"/> View Document <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0"/></a></div>
                                                 )}
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={updatingId === ngo.id}>{updatingId === ngo.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Ban className="h-4 w-4 mr-1"/>}Revoke Approval</Button></AlertDialogTrigger>
                                                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Revocation</AlertDialogTitle><AlertDialogDescription>Revoke approval for "{ngo.orgName}"? Their role will be reset.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={updatingId === ngo.id}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRevokeApproval(ngo.id, ngo.orgName)} disabled={updatingId === ngo.id} className={buttonVariants({variant: "destructive"})}>Confirm Revoke</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                                </AlertDialog>
                                            </CardFooter>
                                        </Card>
                                     ))}
                                 </div>
                            )}
                         </TabsContent>
                     </Tabs>

                 </div>
             </section>
          </main>
          <Footer />
        </motion.div>
    );
};

export default SuperAdminPanel;