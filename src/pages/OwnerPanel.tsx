import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Crown, Users, TrendingUp, Wallet, Handshake, Phone, BarChart3, UserCheck,
  ShieldCheck, Building2, Target, Activity, Download, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["hsl(210,90%,45%)", "hsl(142,70%,45%)", "hsl(38,92%,50%)", "hsl(280,60%,55%)", "hsl(0,72%,51%)", "hsl(170,60%,45%)", "hsl(330,65%,50%)"];

interface TeamMember {
  user_id: string;
  full_name: string | null;
  designation: string | null;
  role: string;
  leadCount: number;
  dealCount: number;
  callCount: number;
}

export default function OwnerPanel() {
  const { hasRole } = useAuth();
  const isOwner = hasRole("owner");
  const isAdmin = hasRole("admin");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0, pipelineValue: 0, totalLeads: 0, convertedLeads: 0,
    totalDeals: 0, wonDeals: 0, totalCalls: 0, totalExpenses: 0,
    openTickets: 0, teamSize: 0, monthlyLeads: 0, monthlyRevenue: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dailyLeads, setDailyLeads] = useState<{ date: string; count: number }[]>([]);
  const [dealStages, setDealStages] = useState<{ name: string; value: number }[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; revenue: number; expense: number }[]>([]);

  useEffect(() => { if (isOwner || isAdmin) fetchAll(); }, []);

  const fetchAll = async () => {
    const today = new Date();
    const monthStart = startOfMonth(today).toISOString();
    const monthEnd = endOfMonth(today).toISOString();

    const [leadsRes, dealsRes, callsRes, expensesRes, ticketsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from("leads").select("id, status, created_at, assigned_to"),
      supabase.from("deals").select("id, stage, value, assigned_to, created_at"),
      supabase.from("call_logs").select("id, called_by, called_at"),
      supabase.from("expenses").select("amount, expense_date"),
      supabase.from("helpdesk_tickets").select("status"),
      supabase.from("profiles").select("user_id, full_name, designation"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const leads = leadsRes.data || [];
    const deals = dealsRes.data || [];
    const calls = callsRes.data || [];
    const expenses = expensesRes.data || [];
    const tickets = ticketsRes.data || [];
    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];

    const totalRevenue = deals.filter(d => d.stage === "closed_won").reduce((s, d) => s + Number(d.value), 0);
    const pipelineValue = deals.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost").reduce((s, d) => s + Number(d.value), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const monthlyLeads = leads.filter(l => l.created_at >= monthStart && l.created_at <= monthEnd).length;
    const monthlyRevenue = deals.filter(d => d.stage === "closed_won" && d.created_at >= monthStart).reduce((s, d) => s + Number(d.value), 0);

    setStats({
      totalRevenue, pipelineValue, totalLeads: leads.length,
      convertedLeads: leads.filter(l => l.status === "converted").length,
      totalDeals: deals.length, wonDeals: deals.filter(d => d.stage === "closed_won").length,
      totalCalls: calls.length, totalExpenses,
      openTickets: tickets.filter(t => t.status === "open" || t.status === "in_progress").length,
      teamSize: profiles.length, monthlyLeads, monthlyRevenue,
    });

    // Team performance
    const members: TeamMember[] = profiles.map(p => {
      const role = roles.find(r => r.user_id === p.user_id)?.role || "sales_rep";
      return {
        user_id: p.user_id, full_name: p.full_name, designation: p.designation, role,
        leadCount: leads.filter(l => l.assigned_to === p.user_id).length,
        dealCount: deals.filter(d => d.assigned_to === p.user_id).length,
        callCount: calls.filter(c => c.called_by === p.user_id).length,
      };
    });
    setTeamMembers(members.sort((a, b) => b.leadCount - a.leadCount));

    // Daily leads (last 30 days)
    const daily: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      daily[d] = 0;
    }
    leads.forEach(l => { const d = l.created_at.split("T")[0]; if (daily[d] !== undefined) daily[d]++; });
    setDailyLeads(Object.entries(daily).map(([date, count]) => ({ date: format(new Date(date), "dd MMM"), count })));

    // Deal stages
    const stageCount: Record<string, number> = {};
    deals.forEach(d => { stageCount[d.stage] = (stageCount[d.stage] || 0) + 1; });
    setDealStages(Object.entries(stageCount).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value
    })));

    // Revenue vs Expenses by month (last 6 months)
    const monthData: Record<string, { revenue: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const m = format(subDays(today, i * 30), "MMM yyyy");
      monthData[m] = { revenue: 0, expense: 0 };
    }
    deals.filter(d => d.stage === "closed_won").forEach(d => {
      const m = format(new Date(d.created_at), "MMM yyyy");
      if (monthData[m]) monthData[m].revenue += Number(d.value);
    });
    expenses.forEach(e => {
      const m = format(new Date(e.expense_date), "MMM yyyy");
      if (monthData[m]) monthData[m].expense += Number(e.amount);
    });
    setRevenueByMonth(Object.entries(monthData).map(([month, data]) => ({ month, ...data })));

    setLoading(false);
  };

  if (!isOwner && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-muted-foreground mt-2">This panel is only accessible to Owners and Admins.</p>
        </Card>
      </div>
    );
  }

  const conversionRate = stats.totalLeads ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) : "0";
  const profitMargin = stats.totalRevenue ? (((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue) * 100).toFixed(1) : "0";

  const roleColors: Record<string, string> = { owner: "bg-purple-100 text-purple-800", admin: "bg-blue-100 text-blue-800", manager: "bg-green-100 text-green-800", sales_rep: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-500" /> {isOwner ? "Owner" : "Admin"} Control Panel
          </h1>
          <p className="text-muted-foreground">Complete business overview & team performance</p>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />₹{stats.monthlyRevenue.toLocaleString()} this month</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold text-foreground">₹{stats.pipelineValue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg"><Handshake className="h-5 w-5 text-blue-600" /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.totalDeals} deals · {stats.wonDeals} won</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground">₹{stats.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg"><Wallet className="h-5 w-5 text-red-600" /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Profit margin: {profitMargin}%</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg"><Target className="h-5 w-5 text-purple-600" /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.convertedLeads} of {stats.totalLeads} leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Team Size", value: stats.teamSize, icon: Users, color: "text-blue-500" },
          { label: "Total Leads", value: stats.totalLeads, icon: UserCheck, color: "text-green-500" },
          { label: "This Month Leads", value: stats.monthlyLeads, icon: TrendingUp, color: "text-amber-500" },
          { label: "Total Calls", value: stats.totalCalls, icon: Phone, color: "text-orange-500" },
          { label: "Open Tickets", value: stats.openTickets, icon: Activity, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-3 pb-3 flex items-center gap-3">
              <s.icon className={`h-6 w-6 ${s.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold">{loading ? "—" : s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team"><Users className="mr-1.5 h-4 w-4" />Team Performance</TabsTrigger>
          <TabsTrigger value="charts"><BarChart3 className="mr-1.5 h-4 w-4" />Analytics</TabsTrigger>
          <TabsTrigger value="revenue"><TrendingUp className="mr-1.5 h-4 w-4" />Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <Card>
            <CardHeader><CardTitle className="text-base">Team Member Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead><TableHead>Role</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Deals</TableHead>
                    <TableHead className="text-center">Calls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map(m => (
                    <TableRow key={m.user_id}>
                      <TableCell>
                        <p className="font-medium">{m.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{m.designation || "—"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${roleColors[m.role] || ""}`}>{m.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{m.leadCount}</TableCell>
                      <TableCell className="text-center font-medium">{m.dealCount}</TableCell>
                      <TableCell className="text-center font-medium">{m.callCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Daily Lead Inflow (30 Days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyLeads}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(210,90%,45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Deal Pipeline Stages</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={dealStages} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {dealStages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue vs Expenses (6 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(142,70%,45%)" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(0,72%,51%)" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
