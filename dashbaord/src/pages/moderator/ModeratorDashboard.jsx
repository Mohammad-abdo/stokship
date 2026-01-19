import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart2, 
  Bell,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ModeratorDashboard() {
  const { auths, logout, getActiveToken } = useMultiAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = auths.moderator?.user;
  const token = getActiveToken('moderator');

  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    reports: 0
  });
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const tradersRes = await api.get('/admin/traders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allTraders = tradersRes.data?.data || [];
      const pending = allTraders.filter(t => !t.isVerified);
      const active = allTraders.filter(t => t.isVerified);
      
      setTraders(pending);
      
      const employeesRes = await api.get('/admin/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(employeesRes.data?.data || []);

      setStats({
        pending: pending.length,
        active: active.length,
        reports: 0 
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (traderId) => {
    try {
      await api.put(`/traders/${traderId}`, { isVerified: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Trader verified successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to verify trader");
    }
  };
  
  const handleAssignClick = (trader) => {
    setSelectedTrader(trader);
    setSelectedEmployee(trader.employeeId || "");
    setIsAssignOpen(true);
  };

  const submitAssignment = async () => {
    if (!selectedEmployee) return;
    
    try {
      setAssignLoading(true);
      await api.put(`/traders/${selectedTrader.id}/assign`, { 
        employeeId: selectedEmployee 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Employee assigned successfully");
      setIsAssignOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to assign employee");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
           <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</h3>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                 </div>
              </div>
           </CardContent>
        </Card>
        <Card>
           <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-gray-500">Active Traders</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</h3>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                 </div>
              </div>
           </CardContent>
        </Card>
        <Card>
           <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-sm font-medium text-gray-500">Reports Today</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.reports}</h3>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Recent Registrations Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Trader Registrations</CardTitle>
          <CardDescription>Review and approve new trader accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : traders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending trader registrations.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Trader Name</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3">Phone</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Assigned To</th>
                    <th scope="col" className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {traders.map((trader) => (
                    <tr key={trader.id} className="bg-white border-b hover:bg-gray-50">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {trader.name}
                        <div className="text-xs text-gray-400 font-normal">{trader.companyName}</div>
                      </th>
                      <td className="px-6 py-4">{trader.email}</td>
                      <td className="px-6 py-4">{trader.phone}</td>
                      <td className="px-6 py-4">
                        <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded border border-amber-400">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {trader.employee ? (
                          <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded">
                            {trader.employee.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleAssignClick(trader)} className="h-8 text-xs">
                              {trader.employee ? 'Reassign' : 'Assign'}
                            </Button>
                            <Button size="sm" onClick={() => handleApprove(trader.id)} className="h-8 text-xs bg-green-600 hover:bg-green-700">
                              Approve
                            </Button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Assignment Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee</DialogTitle>
            <DialogDescription>
              Assign a dedicated employee to manage {selectedTrader?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedEmployee ? selectedEmployee.toString() : ""} 
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="" disabled>Select an employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button onClick={submitAssignment} disabled={assignLoading || !selectedEmployee}>
              {assignLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign Employee
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
