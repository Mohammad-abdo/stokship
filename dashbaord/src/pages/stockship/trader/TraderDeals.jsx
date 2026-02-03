import { useState, useEffect } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { dealApi } from "@/lib/mediationApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { FileText, Search, Eye, CheckCircle, User, DollarSign, Calendar, Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import showToast from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function TraderDeals() {
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvingDealId, setApprovingDealId] = useState(null);

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

  const getNegotiatedAmount = (deal) => {
    if (deal.negotiatedAmount != null && Number(deal.negotiatedAmount) > 0) {
      return Number(deal.negotiatedAmount);
    }
    if (deal.items?.length) {
      const total = deal.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || Number(item.cartons) || 0;
        const price = Number(item.negotiatedPrice) || Number(item.offerItem?.unitPrice) || Number(item.unitPrice) || 0;
        return sum + qty * price;
      }, 0);
      if (total > 0) return total;
    }
    return null;
  };

  const handleApprove = async (deal) => {
    let amount = getNegotiatedAmount(deal);
    let dealToUse = deal;
    if (amount == null || amount <= 0) {
      try {
        const res = await dealApi.getDealById(deal.id);
        const fullDeal = res?.data?.data?.deal ?? res?.data?.deal;
        if (fullDeal) {
          dealToUse = fullDeal;
          amount = getNegotiatedAmount(fullDeal);
        }
      } catch (e) {
        console.error('Error fetching deal:', e);
      }
    }
    if (amount == null || amount <= 0) {
      showToast.error(
        t("mediation.deals.negotiatedAmountRequired") || "لم يتم تحديد مبلغ الصفقة. أضف عناصر للصفقة أو حدّث المبلغ من صفحة الصفقة.",
        t("mediation.deals.addItemsOrSetAmount") || "Add deal items or set amount in deal details"
      );
      return;
    }
    setApprovingDealId(deal.id);
    try {
      const body = { negotiatedAmount: Number(amount) };
      if (dealToUse.notes != null && String(dealToUse.notes).trim() !== "") body.notes = dealToUse.notes;
      await dealApi.approveDeal(deal.id, body);
      showToast.success(t("mediation.deals.approveSuccess") || "تم قبول الصفقة بنجاح");
      loadDeals();
    } catch (error) {
      console.error('Error approving deal:', error);
      const msg = error.response?.data?.message || error.message || (t("mediation.deals.approveFailed") || "فشل قبول الصفقة");
      showToast.error(msg);
    } finally {
      setApprovingDealId(null);
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

  const getStatusBadge = (status) => {
    const config = {
      NEGOTIATION: { className: "bg-amber-100 text-amber-800 border-amber-200", label: t("mediation.deals.negotiation") || "Negotiation" },
      APPROVED: { className: "bg-blue-100 text-blue-800 border-blue-200", label: t("mediation.deals.approved") || "Approved" },
      PAID: { className: "bg-emerald-100 text-emerald-800 border-emerald-200", label: t("mediation.deals.paid") || "Paid" },
      SETTLED: { className: "bg-slate-100 text-slate-700 border-slate-200", label: t("mediation.deals.settled") || "Settled" },
      CANCELLED: { className: "bg-red-100 text-red-800 border-red-200", label: t("mediation.deals.cancelled") || "Cancelled" }
    };
    const { className, label } = config[status] || { className: "bg-gray-100 text-gray-700 border-gray-200", label: status };
    return <Badge variant="outline" className={cn("font-medium border", className)}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-4 sm:p-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t("mediation.deals.myDeals") || "My Deals"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("mediation.deals.manageDealsFromOffers") || "Manage deals from your offers"}
          </p>
        </div>
        {filteredDeals.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" />
            {filteredDeals.length} {filteredDeals.length === 1 ? "deal" : "deals"}
          </span>
        )}
      </div>

      <Card className="border border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                type="text"
                placeholder={t("mediation.deals.searchDeals") || "Search by deal number, client, or offer..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("h-10 pl-10 pr-4", isRTL && "pl-4 pr-10")}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full sm:w-[180px]"
            >
              <option value="all">{t("mediation.deals.allStatus") || "All Status"}</option>
              <option value="NEGOTIATION">{t("mediation.deals.negotiation") || "Negotiation"}</option>
              <option value="APPROVED">{t("mediation.deals.approved") || "Approved"}</option>
              <option value="PAID">{t("mediation.deals.paid") || "Paid"}</option>
              <option value="SETTLED">{t("mediation.deals.settled") || "Settled"}</option>
              <option value="CANCELLED">{t("mediation.deals.cancelled") || "Cancelled"}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => (
            <Card key={deal.id} className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 sm:p-6">
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="font-mono text-base font-semibold text-gray-900 truncate">
                        {deal.dealNumber}
                      </h3>
                      {getStatusBadge(deal.status)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs uppercase tracking-wider">{t("mediation.deals.offer") || "Offer"}</p>
                          <p className="font-medium text-gray-900 truncate">{deal.offer?.title || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs uppercase tracking-wider">{t("mediation.deals.client") || "Client"}</p>
                          <p className="font-medium text-gray-900 truncate">{deal.client?.name || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs uppercase tracking-wider">{t("mediation.deals.amount") || "Amount"}</p>
                          <p className="font-medium text-gray-900">${(Number(deal.negotiatedAmount) || getNegotiatedAmount(deal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs uppercase tracking-wider">{t("mediation.deals.created") || "Created"}</p>
                          <p className="font-medium text-gray-900">
                            {new Date(deal.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={cn("flex flex-wrap items-center gap-2 shrink-0", isRTL && "flex-row-reverse")}>
                    {deal.status === "NEGOTIATION" && (
                      <Button
                        onClick={() => handleApprove(deal)}
                        disabled={approvingDealId === deal.id}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {approvingDealId === deal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        <span className={isRTL ? "mr-2" : "ml-2"}>
                          {approvingDealId === deal.id ? (t("common.loading") || "Loading...") : (t("mediation.deals.approve") || "Approve")}
                        </span>
                      </Button>
                    )}
                    <Link
                      to={`/stockship/trader/deals/${deal.id}`}
                      className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-3 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      {t("mediation.deals.view") || "View"}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {t("mediation.deals.noDealsFound") || "No deals found"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {searchTerm || statusFilter !== "all"
                  ? (t("mediation.deals.tryAdjustingFilters") || "Try adjusting your search or filters.")
                  : (t("mediation.deals.dealsAppearWhenClientsRequest") || "Deals will appear here when clients request negotiations on your offers.")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

