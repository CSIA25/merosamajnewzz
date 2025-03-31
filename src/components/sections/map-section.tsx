
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { IssueMap } from "../map/issue-map";

export const MapSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl font-bold mb-6">
              <span className="text-gradient">Track and Locate</span> Issues in Real-Time
            </h2>
            <p className="text-xl text-foreground/80 mb-6">
              Our interactive map visualizes reported issues across communities, 
              helping organizations identify hotspots and allocate resources efficiently.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "View issue distribution with heat map visualization",
                "Filter issues by category, status, and timeframe",
                "Get detailed information about specific reports",
                "Track progress as issues move from reported to resolved"
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  viewport={{ once: true }}
                  className="flex items-start"
                >
                  <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-foreground/80">{item}</span>
                </motion.li>
              ))}
            </ul>
            <Button asChild size="lg" className="btn-gradient rounded-full">
              <Link to="/map">
                Explore Full Map <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="w-full h-[500px] relative rounded-xl overflow-hidden shadow-xl"
          >
            <IssueMap height="500px" interactive={false} />
            
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Issue Categories</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Homelessness</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-teal-500"></div>
                  <span className="text-sm">Food Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Animal Welfare</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
