
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { QrCode, Clock, MapPin, Search } from 'lucide-react';
import { useCustomerMenuData } from '@/hooks/useCustomerMenuData';
import { useCart } from '@/hooks/useCart';
import { MenuItemCard } from '@/components/customer/MenuItemCard';
import { CartDrawer } from '@/components/customer/CartDrawer';

const CustomerMenu = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const { categories, restaurantInfo, loading, error } = useCustomerMenuData(restaurantId!);
  const { setOrderType } = useCart(restaurantId!);
  const [customerFlow, setCustomerFlow] = useState<'qr' | 'direct'>('direct');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Detect customer flow based on URL parameters or referrer
    const qrParam = searchParams.get('qr');
    const tableParam = searchParams.get('table');
    
    if (qrParam === 'true' || tableParam) {
      setCustomerFlow('qr');
      setOrderType('now');
    } else {
      setCustomerFlow('direct');
      setOrderType('later');
    }
  }, [searchParams, setOrderType]);

  // Filter items based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    menu_items: category.menu_items?.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
  })).filter(category => 
    // Show category if it has matching items OR if no search term
    !searchTerm || category.menu_items.length > 0
  );

  // Use filtered categories for display
  const categoriesToShow = searchTerm ? filteredCategories : categories;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {restaurantInfo?.logo_url ? (
                <img 
                  src={restaurantInfo.logo_url} 
                  alt={restaurantInfo.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {customerFlow === 'qr' ? (
                    <QrCode className="h-6 w-6 text-primary" />
                  ) : (
                    <Clock className="h-6 w-6 text-primary" />
                  )}
                </div>
              )}
              <div>
                <h1 className="font-bold text-xl text-foreground">
                  {restaurantInfo?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {restaurantInfo?.tagline || (customerFlow === 'qr' ? 'Order for now' : 'Pre-order for later')}
                </p>
              </div>
            </div>
            
            <CartDrawer restaurantId={restaurantId!} />
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Flow Indicator */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Card className={`border-l-4 ${customerFlow === 'qr' ? 'border-l-primary' : 'border-l-secondary'}`}>
          <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              {customerFlow === 'qr' ? (
                <>
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Dining In</p>
                    <p className="text-xs text-muted-foreground">Your order will be prepared for immediate service</p>
                  </div>
                  <Badge variant="default" className="ml-auto">Now</Badge>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-medium text-sm">Pre-ordering</p>
                    <p className="text-xs text-muted-foreground">Schedule your meal for pickup or delivery</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">Later</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {searchTerm && categoriesToShow.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No items found matching "{searchTerm}"</p>
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No menu items available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={categoriesToShow[0]?.id} className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto">
              {categoriesToShow.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="whitespace-nowrap">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categoriesToShow.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    {category.description && (
                      <p className="text-muted-foreground">{category.description}</p>
                    )}
                  </CardHeader>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  {category.menu_items?.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      restaurantId={restaurantId!}
                    />
                  )) || (
                    <Card className="sm:col-span-2">
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No items in this category yet.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default CustomerMenu;
