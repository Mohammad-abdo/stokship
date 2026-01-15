import { useState, useEffect } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { dealApi } from "@/lib/mediationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Eye, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function TraderDeals() {
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('trader');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user?.id) {
      loadDeals();
    }
  }, [user]);

  const loadDeals = async () => {
    try {
      const response = await dealApi.getDeals({ traderId: user.id });
      setDeals(response.data.data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (dealId) => {
    try {
      await dealApi.approveDeal(dealId);
      loadDeals(); // Reload deals
    } catch (error) {
      console.error('Error approving deal:', error);
      alert('Failed to approve deal');
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.dealNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.offer?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      NEGOTIATION: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      PAID: "bg-green-100 text-green-800",
      SETTLED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Deals</h1>
        <p className="text-muted-foreground mt-1">
          Manage deals from your offers
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals by number, client, or offer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="SETTLED">Settled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Deals List */}
      <div className="space-y-4">
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold">{deal.dealNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                        {deal.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Offer</p>
                        <p className="font-medium">{deal.offer?.title || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Client</p>
                        <p className="font-medium">{deal.client?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">${(Number(deal.negotiatedAmount) || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deal.status === 'NEGOTIATION' && (
                      <button
                        onClick={() => handleApprove(deal.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    <Link
                      to={`/stockship/trader/deals/${deal.id}`}
                      className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">No deals found</p>
              <p className="text-muted-foreground mt-2">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Deals will appear here when clients request negotiations on your offers"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

