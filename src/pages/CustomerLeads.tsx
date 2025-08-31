
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Users, Phone, Mail, Calendar, MessageCircle } from "lucide-react";

interface CustomerLead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  lead_source: string;
  dining_frequency?: string;
  favorite_cuisines?: string[];
  dietary_restrictions?: string[];
  marketing_consent: boolean;
  converted_to_order: boolean;
  first_order_id?: string;
  order_context: any;
  notes?: string;
  created_at: string;
}

export default function CustomerLeads() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [user, loading, navigate]);

  const fetchLeads = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingLeads(true);
      const { data, error } = await supabase
        .from('customer_leads')
        .select('*')
        .eq('restaurant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error loading leads",
        description: "Failed to load customer leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  const convertedLeads = leads.filter(lead => lead.converted_to_order);
  const unconvertedLeads = leads.filter(lead => !lead.converted_to_order);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Customer Leads</h1>
              <p className="text-muted-foreground">
                Manage and track potential customers who have shown interest in your restaurant.
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={fetchLeads}
              disabled={loadingLeads}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingLeads ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leads.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Converted</CardTitle>
                <Badge variant="default" className="text-xs">
                  {leads.length > 0 ? Math.round((convertedLeads.length / leads.length) * 100) : 0}%
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{convertedLeads.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unconvertedLeads.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Leads List */}
          <div className="space-y-6">
            {loadingLeads ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Customer leads will appear here when visitors show interest in your restaurant.
                  </p>
                  <Button onClick={() => navigate("/digital-menu")}>
                    View Your Digital Menu
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {leads.map((lead) => (
                  <Card key={lead.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{lead.customer_name}</CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.customer_phone}
                            </div>
                            {lead.customer_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.customer_email}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(lead.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={lead.converted_to_order ? "default" : "secondary"}>
                            {lead.converted_to_order ? "Converted" : "Potential"}
                          </Badge>
                          <Badge variant="outline">
                            {lead.lead_source}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {lead.dining_frequency && (
                          <div>
                            <span className="text-sm font-medium">Dining Frequency: </span>
                            <span className="text-sm text-muted-foreground">{lead.dining_frequency}</span>
                          </div>
                        )}
                        
                        {lead.favorite_cuisines && lead.favorite_cuisines.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Favorite Cuisines: </span>
                            <div className="flex gap-1 mt-1">
                              {lead.favorite_cuisines.map((cuisine, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {cuisine}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {lead.dietary_restrictions && lead.dietary_restrictions.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Dietary Restrictions: </span>
                            <div className="flex gap-1 mt-1">
                              {lead.dietary_restrictions.map((restriction, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {restriction}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {lead.order_context && lead.order_context.itemCount > 0 && (
                          <div>
                            <span className="text-sm font-medium">Interest: </span>
                            <span className="text-sm text-muted-foreground">
                              {lead.order_context.itemCount} items (KES {lead.order_context.subtotal})
                            </span>
                          </div>
                        )}

                        {lead.notes && (
                          <div>
                            <span className="text-sm font-medium">Notes: </span>
                            <p className="text-sm text-muted-foreground mt-1">{lead.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            {lead.marketing_consent && (
                              <Badge variant="outline" className="text-xs">
                                Marketing OK
                              </Badge>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`https://wa.me/${lead.customer_phone.replace(/\D/g, '')}`, '_blank')}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Customer leads are automatically captured when visitors interact with your digital menu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
