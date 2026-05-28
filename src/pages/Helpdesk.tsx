import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, TicketCheck, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800", in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800", closed: "bg-gray-100 text-gray-800",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-800", medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800", urgent: "bg-red-100 text-red-800",
};

interface Ticket {
  id: string; subject: string; description: string | null; priority: string;
  status: string; created_by: string; created_at: string; resolved_at: string | null;
}

export default function Helpdesk() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" });

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from("helpdesk_tickets").select("*").order("created_at", { ascending: false });
    if (data) setTickets(data as Ticket[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("helpdesk_tickets").insert({
      subject: form.subject, description: form.description || null,
      priority: form.priority, created_by: user.id,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Ticket created"); setShowForm(false); setForm({ subject: "", description: "", priority: "medium" }); fetchTickets(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "resolved") update.resolved_at = new Date().toISOString();
    await supabase.from("helpdesk_tickets").update(update).eq("id", id);
    fetchTickets();
  };

  const filtered = tickets.filter(t => t.subject.toLowerCase().includes(search.toLowerCase()));
  const open = tickets.filter(t => t.status === "open").length;
  const inProgress = tickets.filter(t => t.status === "in_progress").length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Helpdesk</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Ticket</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Ticket</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="submit" className="w-full">Create Ticket</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><TicketCheck className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{tickets.length}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{open}</p><p className="text-xs text-muted-foreground">Open</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-600" /><div><p className="text-2xl font-bold">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{tickets.filter(t => t.status === "resolved").length}</p><p className="text-xs text-muted-foreground">Resolved</p></div></CardContent></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> :
              filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tickets</TableCell></TableRow> :
              filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.subject}</TableCell>
                  <TableCell><Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge></TableCell>
                  <TableCell><Badge className={STATUS_COLORS[t.status]}>{t.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-sm">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={v => updateStatus(t.id, v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
