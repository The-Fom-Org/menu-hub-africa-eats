
import { LeadManagementTable } from "@/components/leads/LeadManagementTable";

export default function CustomerLeads() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Customer Leads</h1>
            <p className="text-muted-foreground">
              View and manage leads captured from your customers. Export data for marketing campaigns.
            </p>
          </div>
          
          <LeadManagementTable />
        </div>
      </div>
    </div>
  );
}
