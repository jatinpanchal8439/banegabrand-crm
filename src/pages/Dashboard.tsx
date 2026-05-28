import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserX, UserCheck, Clock, CalendarDays, TrendingUp,
  Handshake, TicketCheck, Wallet, Phone, ShieldCheck, Crown,
  BarChart3, Building2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const STATUS_LABELS: Record<string, string> = {
  new_lead: "New Lead", callback: "Callback", not_interested: "Not Interested",
  dp: "DP", cbpc: "CBPC", pg: "PG", dp_followup: "DP Followup",
  pg_followup: "PG Followup", video_meeting: "Video Meeting",
  video_meeting_followup: "VM Followup", converted: "Converted", dead: "Dead",
};

const CHART_COLORS = [
  "hsl(210, 90%, 45%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(142, 70%, 45%)",
  "hsl(199, 89%, 48%)", "hsl(330, 65%, 50%)", "hsl(60, 70%, 45%)",
  "hsl(210, 40%, 60%)", "hsl(15, 80%, 55%)", "hsl(250, 50%, 60%)"
];

export default function Dashboard() {
  const { profile, roles, hasRole } = useAuth();
  const isOwner = hasRole("owner");
  const isAdmin = hasRole("admin");
  const isManager = hasRole("manager");
  const isHighLevel = isOwner || isAdmin || isManager;

  const [loading, setLoading] = useState(true);
  const [leadStats, setLeadStats] = useState({ total: 0, dead: 0, converted: 0, newLeads: 0, todayCreated: 0, tomorrowFollowup: 0, statusCounts: {} as Record<string, number> });
  const [dealStats, setDealStats] = useState({ total: 0, totalValue: 0, wonValue: 0, stages: {} as Record<string, number> });
  const [teamStats, setTeamStats] = useState({ totalUsers: 0, admins: 0, managers: 0, salesReps: 0 });
  const [ticketStats, setTicketStats] = useState({ open: 0, resolved: 0, total: 0 });
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [callStats, setCallStats] = useState({ today: 0, total: 0 });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const [leadsRes, dealsRes, ticketsRes, expensesRes, callsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from("leads").select("status, created_at, next_followup"),
      supabase.from("deals").select("stage, value"),
      supabase.from("helpdesk_tickets").select("status"),
      supabase.from("expenses").select("amount"),
      supabase.from("call_logs").select("called_at"),
      supabase.from("profiles").select("user_id"),
      supabase.from("user_roles").select("role"),
    ]);

    // Leads
    const leads = leadsRes.data || [];
    const statusCounts: Record<string, number> = {};
    let dead = 0, converted = 0, newLeads = 0, todayCreated = 0, tomorrowFollowup = 0;
    leads.forEach((l) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      if (l.status === "dead") dead++;
      if (l.status === "converted") converted++;
      if (l.status === "new_lead") newLeads++;
      if (l.created_at?.startsWith(today)) todayCreated++;
      if (l.next_followup?.startsWith(tomorrow)) tomorrowFollowup++;
    });
    setLeadStats({ total: leads.length, dead, converted, newLeads, todayCreated, tomorrowFollowup, statusCounts });

    // Deals
    const deals = dealsRes.data || [];
    const stages: Record<string, number> = {};
    let totalValue = 0, wonValue = 0;
    deals.forEach((d) => {
      stages[d.stage] = (stages[d.stage] || 0) + 1;
      totalValue += Number(d.value);
      if (d.stage === "closed_won") wonValue += Number(d.value);
    });
    setDealStats({ total: deals.length, totalValue, wonValue, stages });

    // Tickets
    const tickets = ticketsRes.data || [];
    setTicketStats({ open: tickets.filter(t => t.status === "open" || t.status === "in_progress").length, resolved: tickets.filter(t => t.status === "resolved").length, total: tickets.length });

    // Expenses
    setExpenseTotal((expensesRes.data || []).reduce((s, e) => s + Number(e.amount), 0));

    // Calls
    const calls = callsRes.data || [];
    setCallStats({ today: calls.filter(c => c.called_at?.startsWith(today)).length, total: calls.length });

    // Team
    const allRoles = rolesRes.data || [];
    setTeamStats({
      totalUsers: (profilesRes.data || []).length,
      admins: allRoles.filter(r => r.role === "admin").length,
      managers: allRoles.filter(r => r.role === "manager").length,
      salesReps: allRoles.filter(r => r.role === "sales_rep").length,
    });

    setLoading(false);
  };

  const roleLabel = isOwner ? "Owner" : isAdmin ? "Admin" : isManager ? "Manager" : "Sales Rep";
  const roleIcon = isOwner ? Crown : isAdmin ? ShieldCheck : isManager ? Building2 : Users;
  const RoleIcon = roleIcon;

  const kpis = [
    { label: "Total Leads", value: leadStats.total, icon: Users, color: "text-primary" },
    { label: "Converted", value: leadStats.converted, icon: UserCheck, color: "text-green-600" },
    { label: "New Leads", value: leadStats.newLeads, icon: TrendingUp, color: "text-blue-500" },
    { label: "Today Calls", value: callStats.today, icon: Phone, color: "text-orange-500" },
    { label: "Today Created", value: leadStats.todayCreated, icon: CalendarDays, color: "text-amber-500" },
    { label: "Tomorrow F/U", value: leadStats.tomorrowFollowup, icon: Clock, color: "text-purple-500" },
  ];

  const pieData = Object.entries(leadStats.statusCounts).filter(([, v]) => v > 0).map(([key, value]) => ({ name: STATUS_LABELS[key] || key, value }));
  const barData = Object.entries(leadStats.statusCounts).filter(([k]) => k !== "dead" && k !== "converted").map(([key, value]) => ({ name: STATUS_LABELS[key] || key, count: value }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with role badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || "User"}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <RoleIcon className="h-4 w-4" />
          {roleLabel} Panel
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="kpi-card">
            <div className="flex items-center gap-3">
              <kpi.icon className={`h-8 w-8 ${kpi.color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{loading ? "—" : kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Owner/Admin exclusive: Team & Financial Overview */}
      {(isOwner || isAdmin) && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-purple-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{teamStats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                <span>{teamStats.admins} Admin</span>·
                <span>{teamStats.managers} Mgr</span>·
                <span>{teamStats.salesReps} Rep</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Handshake className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{dealStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Deals</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Pipeline: ₹{dealStats.totalValue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <TicketCheck className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{ticketStats.open}</p>
                  <p className="text-xs text-muted-foreground">Open Tickets</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{ticketStats.resolved} resolved of {ticketStats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">₹{expenseTotal.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Owner exclusive: Revenue summary */}
      {isOwner && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Crown className="h-4 w-4 text-purple-500" /> Owner Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">₹{dealStats.wonValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue (Won)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">₹{dealStats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{leadStats.total ? ((leadStats.converted / leadStats.total) * 100).toFixed(1) : 0}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{callStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Calls Made</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Lead Stages</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(210, 90%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Lead Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stage Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Stage Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(leadStats.statusCounts).map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg bg-muted text-center">
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{STATUS_LABELS[key] || key}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
