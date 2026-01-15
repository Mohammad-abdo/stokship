import { useState, useEffect } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { traderApi, offerApi, dealApi } from "@/lib/mediationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { Package, FileText, DollarSign, TrendingUp, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function TraderDashboard() {
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('trader');
  const [stats, setStats] = useState({
    offers: { total: 0, active: 0 },
    deals: { total: 0, active: 0 },
    recentOffers: [],
    recentDeals: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      const [offersRes, dealsRes] = await Promise.all([
        traderApi.getTraderOffers(user.id, { limit: 100 }),
        dealApi.getDeals({ limit: 100 })
      ]);

      const offers = offersRes.data.data || [];
      const deals = dealsRes.data.data || [];

      setStats({
        offers: {
          total: offers.length,
          active: offers.filter(o => o.status === 'ACTIVE').length
        },
        deals: {
          total: deals.length,
          active: deals.filter(d => ['NEGOTIATION', 'APPROVED', 'PAID'].includes(d.status)).length
        },
        recentOffers: offers.slice(0, 5),
        recentDeals: deals.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trader Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name} ({user?.traderCode})
          </p>
        </div>
        <Link
          to="/stockship/trader/offers/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Offer
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Offers"
          value={stats.offers.total}
          icon={Package}
          description="All offers"
        />
        <StatCard
          title="Active Offers"
          value={stats.offers.active}
          icon={TrendingUp}
          description="Currently active"
        />
        <StatCard
          title="Total Deals"
          value={stats.deals.total}
          icon={FileText}
          description="All deals"
        />
        <StatCard
          title="Active Deals"
          value={stats.deals.active}
          icon={DollarSign}
          description="In progress"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Offers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Recent Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOffers.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{offer.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {offer.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Items: {offer._count?.items || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No offers yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentDeals.length > 0 ? (
              <div className="space-y-4">
                {stats.recentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{deal.dealNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {deal.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Client: {deal.client?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${(Number(deal.negotiatedAmount) || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No deals yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

