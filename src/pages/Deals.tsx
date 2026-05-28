import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit2, Trash2, DollarSign, TrendingUp, Target, Clock } from "lucide-react";
import { toast } from "sonner";

const STAGES = ["qualification", "proposal", "negotiation", "closed_won", "closed_lost"];
const STAGE_LABELS: Record<string, string> = {
  qualification: "Qualification", proposal: "Proposal", negotiation: "Negotiation",
  closed_won: "Closed Won", closed_lost: "Closed Lost",
};
const STAGE_COLORS: Record<string, string> = {
  qualification: "bg-blue-100 text-blue-800", proposal: "bg-yellow-100 text-yellow-800",
  negotiation: "bg-purple-100 text-purple-800", closed_won: "bg-green-100 text-green-800",
  closed_lost: "bg-red-100 text-red-800",
};

interface Deal {
  id: string; deal_name: string; value: number; stage: string;
  expected_close_date: string | null; notes: string | null;
  created_by: string; created_at: string;
}

export default function Deals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState({ deal_name: "", value: "", stage: "qualification", expected_close_date: "", notes: "" });

  useEffect(() => { fetchDeals(); }, []);

  const fetchDeals = async () => {
    setLoading(true);
    const { data } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
    if (data) setDeals(data as Deal[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = { deal_name: form.deal_name, value: parseFloat(form.value) || 0, stage: form.stage, expected_close_date: form.expected_close_date || null, notes: form.notes || null };
    const { error } = editing
      ? await supabase.from("deals").update(payload as any).eq("id", editing.id)
      : await supabase.from("deals").insert({ ...payload, created_by: user.id } as any);
    if (error) toast.error(error.message);
    else { toast.success(editing ? "Deal updated" : "Deal created"); setShowForm(false); setEditing(null); resetForm(); fetchDeals(); }
  };

  const resetForm = () => setForm({ deal_name: "", value: "", stage: "qualification", expected_close_date: "", notes: "" });
  const openEdit = (d: Deal) => { setEditing(d); setForm({ deal_name: d.deal_name, value: String(d.value), stage: d.stage, expected_close_date: d.expected_close_date || "", notes: d.notes || "" }); setShowForm(true); };

  const filtered = deals.filter(d => d.deal_name.toLowerCase().includes(search.toLowerCase()));
  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const wonValue = deals.filter(d => d.stage === "closed_won").reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Deals</h1>
        <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Deal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Deal" : "New Deal"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Deal name *" value={form.deal_name} onChange={e => setForm({ ...form, deal_name: e.target.value })} required />
              <Input type="number" placeholder="Value (₹)" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
              <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} />
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Button type="submit" className="w-full">{editing ? "Update" : "Create"} Deal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><Target className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{deals.length}</p><p className="text-xs text-muted-foreground">Total Deals</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Pipeline Value</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-emerald-600" /><div><p className="text-2xl font-bold">₹{wonValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Won Value</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">{deals.filter(d => d.stage === "negotiation").length}</p><p className="text-xs text-muted-foreground">In Negotiation</p></div></CardContent></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search deals..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid gap-3">
        {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> :
          filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No deals found</p> :
          filtered.map(d => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{d.deal_name}</h3>
                  <p className="text-sm text-muted-foreground">₹{d.value.toLocaleString()} {d.expected_close_date && `• Close: ${d.expected_close_date}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STAGE_COLORS[d.stage]}>{STAGE_LABELS[d.stage]}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Edit2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
