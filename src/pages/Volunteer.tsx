// src/pages/Volunteer.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Check, Loader2, AlertCircle, PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { TiltCard } from "@/components/ui/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, arrayUnion, getDoc, arrayRemove, limit } from "firebase/firestore";
import { app } from "../firebase";
import { useAuth } from "@/context/AuthContext";

interface Opportunity {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    date: string | Timestamp;
    time: string;
    spots: number;
    orgId: string;
    orgName: string;
    createdAt: Timestamp;
    status: 'open' | 'full' | 'closed';
    signedUpVolunteers?: string[];
}

const VolunteerPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [loadingOpps, setLoadingOpps] = useState(true);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    const db = getFirestore(app);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                } else {
                    console.warn("Volunteer.tsx: User profile not found in Firestore for UID:", user.uid);
                }
            } else {
                setUserProfile(null);
            }
        };
        fetchUserProfile();
    }, [user, db]);

    useEffect(() => {
        const fetchOpportunities = async () => {
            setLoadingOpps(true);
            setError(null);
            console.log("Volunteer.tsx: Starting to fetch opportunities...");
            try {
                const q = query(
                    collection(db, "opportunities"),
                    where("status", "==", "open"),
                    orderBy("createdAt", "desc")
                );

                const querySnapshot = await getDocs(q);
                console.log(`Volunteer.tsx: Firestore query returned ${querySnapshot.docs.length} documents.`);

                const opps: Opportunity[] = [];
                querySnapshot.forEach((doc) => {
                    console.log("Volunteer.tsx: Processing doc:", doc.id, doc.data());
                    const data = doc.data();
                    if (data.title && data.orgId && data.createdAt && data.status) {
                        opps.push({
                            id: doc.id,
                            title: data.title,
                            description: data.description,
                            category: data.category,
                            location: data.location,
                            date: data.date,
                            time: data.time,
                            spots: data.spots || 0,
                            orgId: data.orgId,
                            orgName: data.orgName || 'Unknown Organization',
                            createdAt: data.createdAt,
                            status: data.status,
                            signedUpVolunteers: data.signedUpVolunteers || []
                        } as Opportunity);
                    } else {
                        console.warn("Volunteer.tsx: Skipping document with missing essential fields:", doc.id, data);
                    }
                });
                setOpportunities(opps);
                console.log("Volunteer.tsx: Opportunities state updated:", opps);
            } catch (err: any) {
                console.error("Volunteer.tsx: Error fetching opportunities:", err);
                setError("Failed to load opportunities. Please try again later.");
            } finally {
                setLoadingOpps(false);
                console.log("Volunteer.tsx: Fetching finished.");
            }
        };

        fetchOpportunities();
    }, []);

    const handleSignUp = async (opportunityId: string, currentSpots: number, signedUpVolunteers: string[] = []) => {
        if (!user) {
            toast({ title: "Please Login", description: "You need to be logged in to sign up.", variant: "destructive" });
            return;
        }

        if (signedUpVolunteers.includes(user.uid)) {
            toast({ title: "Already Signed Up", description: "You are already registered for this opportunity.", variant: "default" });
            return;
        }

        if (signedUpVolunteers.length >= currentSpots) {
            toast({ title: "Opportunity Full", description: "Sorry, all volunteer spots are filled.", variant: "destructive" });
            return;
        }

        const opportunityRef = doc(db, "opportunities", opportunityId);
        try {
            const newSignupArray = arrayUnion(user.uid);
            let newStatus: Opportunity['status'] | undefined = undefined;

            if ((signedUpVolunteers?.length || 0) + 1 >= currentSpots) {
                newStatus = 'full';
                console.log(`Volunteer.tsx: Opportunity ${opportunityId} will be full after signup.`);
            }

            const updateData: { signedUpVolunteers: any; status?: Opportunity['status'] } = {
                signedUpVolunteers: newSignupArray
            };
            if (newStatus) {
                updateData.status = newStatus;
            }

            await updateDoc(opportunityRef, updateData);

            toast({ title: "Sign Up Successful!", description: "You're registered for the opportunity." });
            setOpportunities(prevOpps => prevOpps.map(opp =>
                opp.id === opportunityId
                    ? { ...opp, signedUpVolunteers: [...signedUpVolunteers, user.uid], status: newStatus || opp.status }
                    : opp
            ));
        } catch (err: any) {
            console.error("Volunteer.tsx: Error signing up:", err);
            toast({ title: "Sign Up Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleCancelSignUp = async (opportunityId: string) => {
        if (!user) return;

        const opportunityRef = doc(db, "opportunities", opportunityId);
        try {
            const updateData = {
                signedUpVolunteers: arrayRemove(user.uid),
                status: 'open' as Opportunity['status']
            };

            await updateDoc(opportunityRef, updateData);

            toast({ title: "Sign Up Cancelled", description: "You are no longer registered for this opportunity." });
            setOpportunities(prevOpps => prevOpps.map(opp =>
                opp.id === opportunityId
                    ? { ...opp, signedUpVolunteers: (opp.signedUpVolunteers || []).filter(uid => uid !== user.uid), status: 'open' }
                    : opp
            ));
        } catch (err: any) {
            console.error("Volunteer.tsx: Error cancelling sign up:", err);
            toast({ title: "Cancellation Failed", description: err.message, variant: "destructive" });
        }
    };

    const isUserSignedUp = (opportunity: Opportunity): boolean => {
        return !!user && !!opportunity.signedUpVolunteers?.includes(user.uid);
    };

    const formatDate = (dateInput: string | Timestamp | undefined): string => {
        if (!dateInput) return "Date not specified";
        if (dateInput instanceof Timestamp) {
            try {
                return format(dateInput.toDate(), "PPP");
            } catch (e) {
                console.error("Error formatting timestamp:", e);
                return "Invalid Date";
            }
        }
        if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            try {
                return format(new Date(dateInput + 'T00:00:00'), "PPP");
            } catch (e) {
                console.error("Error formatting date string:", e);
                return dateInput;
            }
        }
        return String(dateInput);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
        >
            <Navbar />
            <main className="flex-grow pt-20">
                <section className="py-12 md:py-20">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-3xl mx-auto text-center mb-12"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">Volunteer Opportunities</h1>
                            <p className="text-muted-foreground">
                                Make a difference in your community by volunteering your time and skills.
                                Find opportunities that match your interests and availability.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="mb-10 flex flex-col md:flex-row justify-start max-w-5xl mx-auto gap-4"
                        >
                            <div className="flex flex-col md:flex-row gap-4 flex-grow">
                                <Input placeholder="Search opportunities..." className="md:max-w-xs" />
                                <Select>
                                    <SelectTrigger className="md:w-[180px]">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="Environment">Environment</SelectItem>
                                        <SelectItem value="Social Welfare">Social Welfare</SelectItem>
                                        <SelectItem value="Education">Education</SelectItem>
                                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                                        <SelectItem value="Animal Welfare">Animal Welfare</SelectItem>
                                        <SelectItem value="Event Support">Event Support</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                        >
                            {loadingOpps && (
                                <div className="md:col-span-2 lg:col-span-3 flex justify-center items-center p-16">
                                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {error && (
                                <div className="md:col-span-2 lg:col-span-3 flex items-center text-destructive bg-destructive/10 p-4 rounded-md">
                                    <AlertCircle className="h-5 w-5 mr-2" /> {error}
                                </div>
                            )}
                            {!loadingOpps && !error && opportunities.length === 0 && (
                                <p className="md:col-span-2 lg:col-span-3 text-muted-foreground text-center py-8">No open volunteer opportunities found at the moment.</p>
                            )}
                            {!loadingOpps && !error && opportunities.map((opportunity, index) => (
                                <TiltCard key={opportunity.id} className="h-full">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-card border rounded-xl overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md"
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-lg leading-tight">{opportunity.title}</h3>
                                                <Badge variant={
                                                    opportunity.category === "Environment" ? "teal" :
                                                    opportunity.category === "Social Welfare" ? "purple" :
                                                    opportunity.category === "Education" ? "orange" : "secondary"
                                                } className="text-xs flex-shrink-0 ml-2">{opportunity.category}</Badge>
                                            </div>

                                            <p className="text-muted-foreground mb-3 text-sm line-clamp-3">{opportunity.description}</p>

                                            <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                                                <div className="flex items-center">
                                                    <Users className="h-3.5 w-3.5 mr-1.5 text-foreground/70" />
                                                    <span className="text-foreground/90 font-medium">{opportunity.orgName}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                                    <span>{opportunity.location}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                                    <span>{formatDate(opportunity.date)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                    <span>{opportunity.time}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Users className="h-3.5 w-3.5 mr-1.5" />
                                                    <span>
                                                        {opportunity.spots - (opportunity.signedUpVolunteers?.length || 0)} / {opportunity.spots} spots left
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-auto p-4 pt-0">
                                            {isUserSignedUp(opportunity) ? (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleCancelSignUp(opportunity.id)}
                                                >
                                                    Cancel Sign Up
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleSignUp(opportunity.id, opportunity.spots, opportunity.signedUpVolunteers)}
                                                    disabled={(opportunity.signedUpVolunteers?.length || 0) >= opportunity.spots || opportunity.status === 'full' || opportunity.status === 'closed'}
                                                >
                                                    {opportunity.status === 'full' ? 'Opportunity Full' : opportunity.status === 'closed' ? 'Closed' : 'Sign Up'}
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                </TiltCard>
                            ))}
                        </motion.div>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default VolunteerPage;