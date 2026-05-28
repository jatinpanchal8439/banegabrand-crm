import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, PhoneCall, FileText, IndianRupee, TrendingUp, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = [
  "hsl(210,90%,45%)", "hsl(170,60%,45%)", "hsl(38,92%,50%)", "hsl(280,60%,55%)",
  "hsl(0,72%,51%)", "hsl(142,70%,45%)", "hsl(199,89%,48%)", "hsl(330,65%,50%)",
];

const STATUS_LABELS: Record<string, string> = {
  new_lead: "New Lead", callback: "Callback", not_interested: "Not Interested",
  dp: "DP", cbpc: "CBPC", pg: "PG", dp_followup: "DP Followup",
  pg_followup: "PG Followup", video_meeting: "Video Meeting",
  video_meeting_followup: "VM Followup", converted: "Converted", dead: "Dead",
};

export default function Reports() {
  const [period, setPeriod] = useState("this_month");
  const [leadsByStatus, setLeadsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<{ name: string; value: number }[]>([]);
  const [leadsByDay, setLeadsByDay] = useState<{ date: string; count: number }[]>([]);
  const [callStats, setCallStats] = useState({ total: 0, incoming: 0, outgoing: 0, missed: 0 });
  const [quotationStats, setQuotationStats] = useState({ total: 0, sent: 0, accepted: 0, totalValue: 0 });
  const [expenseTotal, setExpenseTotal] = useState(0);

  useEffect(() => { fetchAll(); }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    if (period === "this_month") { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (period === "last_month") { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); now.setDate(0); }
    else if (period === "last_3") { start = new Date(now.getFullYear(), now.getMonth() - 3, 1); }
    else { start = new Date(now.getFullYear(), now.getMonth() - 6, 1); }
    return { start: start.toISOString(), end: now.toISOString() };
  };

  const fetchAll = async () => {
    const { start, end } = getDateRange();

    const [leadsRes, callsRes, quotRes, expRes] = await Promise.all([
      supabase.from("leads").select("status, source, created_at").gte("created_at", start).lte("created_at", end),
      supabase.from("call_logs").select("call_type, called_at").gte("called_at", start).lte("called_at", end),
      supabase.from("quotations").select("status, total, created_at").gte("created_at", start).lte("created_at", end),
      supabase.from("expenses").select("amount").gte("created_at", start).lte("created_at", end),
    ]);

    if (leadsRes.data) {
      const sc: Record<string, number> = {};
      const src: Record<string, number> = {};
      const daily: Record<string, number> = {};
      leadsRes.data.forEach(l => {
        sc[l.status] = (sc[l.status] || 0) + 1;
        if (l.source) src[l.source] = (src[l.source] || 0) + 1;
        const d = l.created_at.split("T")[0];
        daily[d] = (daily[d] || 0) + 1;
      });
      setLeadsByStatus(Object.entries(sc).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v })));
      setLeadsBySource(Object.entries(src).map(([k, v]) => ({ name: k, value: v })));
      setLeadsByDay(Object.entries(daily).sort().map(([k, v]) => ({ date: k.slice(5), count: v })));
    }

    if (callsRes.data) {
      const cs = { total: callsRes.data.length, incoming: 0, outgoing: 0, missed: 0 };
      callsRes.data.forEach((c: any) => { if (c.call_type in cs) (cs as any)[c.call_type]++; });
      setCallStats(cs);
    }

    if (quotRes.data) {
      setQuotationStats({
        total: quotRes.data.length,
        sent: quotRes.data.filter((q: any) => q.status === "sent").length,
        accepted: quotRes.data.filter((q: any) => q.status === "accepted").length,
        totalValue: quotRes.data.reduce((s: number, q: any) => s + Number(q.total), 0),
      });
    }

    if (expRes.data) setExpenseTotal(expRes.data.reduce((s: number, e: any) => s + Number(e.amount), 0));
  };

  const kpis = [
    { label: "Leads", value: leadsByStatus.reduce((s, x) => s + x.value, 0), icon: Users, color: "text-primary" },
    { label: "Calls", value: callStats.total, icon: PhoneCall, color: "text-info" },
    { label: "Quotations", value: quotationStats.total, icon: FileText, color: "text-warning" },
    { label: "Revenue", value: `₹${quotationStats.totalValue.toLocaleString()}`, icon: IndianRupee, color: "text-success" },
    { label: "Expenses", value: `₹${expenseTotal.toLocaleString()}`, icon: TrendingUp, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">MIS Reports</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48"><Calendar className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_3">Last 3 Months</SelectItem>
            <SelectItem value="last_6">Last 6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="kpi-card">
            <div className="flex items-center gap-3">
              <k.icon className={`h-8 w-8 ${k.color} shrink-0`} />
              <div>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="calls">Calls</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Leads by Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={leadsByStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {leadsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={leadsBySource}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(210,90%,45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Daily Lead Creation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={leadsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(210,90%,45%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Incoming", value: callStats.incoming, color: "text-success" },
              { label: "Outgoing", value: callStats.outgoing, color: "text-primary" },
              { label: "Missed", value: callStats.missed, color: "text-destructive" },
            ].map(c => (
              <Card key={c.label} className="p-6 text-center">
                <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Quotations", value: quotationStats.total },
              { label: "Sent", value: quotationStats.sent },
              { label: "Accepted", value: quotationStats.accepted },
            ].map(s => (
              <Card key={s.label} className="p-6 text-center">
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
