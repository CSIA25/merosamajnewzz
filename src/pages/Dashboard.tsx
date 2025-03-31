
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';


import NgoIssuesView from '@/components/dashboard/NgoIssuesView';
import AddOpportunityForm from '@/components/dashboard/AddOpportunityForm';
import MyReportedIssues from '@/components/dashboard/MyReportedIssues';
import NgoMyOpportunitiesView from '@/components/dashboard/NgoMyOpportunitiesView'; 


const MyDonationsPlaceholder = () => (
    <Card>
        <CardHeader><CardTitle>My Donations</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm">Donation tracking coming soon!</p></CardContent>
    </Card>
);


const Dashboard = () => {
    const { user, userRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <span className="ml-4 text-muted-foreground">Loading Dashboard...</span>
            </div>
        );
    }

    if (!user) {
        
        return (
            <div className="min-h-screen flex flex-col">
                 <Navbar />
                 <main className="flex-grow flex items-center justify-center">
                    <p className="text-muted-foreground">Please log in to view your dashboard.</p>
                 </main>
                 <Footer />
            </div>
        );
    }

    const renderDashboardContent = () => {
        switch (userRole) {
            case 'volunteer':
                
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Volunteer Dashboard</h2>
                        {/* Display reported issues by this volunteer */}
                        <MyReportedIssues />
                        {/* Display donations made by this volunteer */}
                        <MyDonationsPlaceholder />
                        {/* Add quick links/actions */}
                         <div className="mt-6 flex gap-4">
                            <Button asChild><Link to="/volunteer">Find Opportunities</Link></Button>
                            <Button variant="secondary" asChild><Link to="/report">Report New Issue</Link></Button>
                         </div>
                    </div>
                );
                
            case 'ngo':
                return (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold">NGO Dashboard</h2>
                        {/* Show opportunities created by this NGO and who signed up */}
                        <NgoMyOpportunitiesView ngoId={user.uid} />
                        {/* Show issues matching this NGO's focus areas */}
                        <NgoIssuesView ngoId={user.uid} />
                        {/* Form to add new opportunities */}
                        <AddOpportunityForm ngoId={user.uid} ngoName={user.name || user.displayName || 'NGO'} />
                    </div>
                );
            case 'superadmin':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Super Admin Overview</h2>
                        <p className="text-muted-foreground">Admin functionalities are available via specific links.</p>
                        <Button asChild>
                            <Link to="/superadmin/verify-ngos">Verify NGOs</Link>
                        </Button>
                        {/* Add more admin links/stats here if needed */}
                    </div>
                );
            default:
                
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold">Welcome, {user.displayName || user.email}!</h2>
                        <p className="text-muted-foreground">Your account is active. Explore Mero Samaj or complete your profile if applicable.</p>
                        {/* Still show reported issues even if role isn't set */}
                        <MyReportedIssues />
                        <MyDonationsPlaceholder />
                    </div>
                );
        }
    };

    return (
        
        
        <motion.div className="min-h-screen flex flex-col" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <Navbar />
            <main className="flex-grow pt-24 pb-16"> {/* Adjusted padding */}
                <section>
                    <div className="container mx-auto px-4">
                        <h1 className="text-3xl md:text-4xl font-bold mb-8">Dashboard</h1>
                        {renderDashboardContent()}
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
};

export default Dashboard;