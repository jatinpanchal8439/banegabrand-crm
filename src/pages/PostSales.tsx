import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2, IndianRupee, Calendar } from "lucide-react";
import { toast } from "sonner";

interface PostSale {
  id: string;
  customer_id: string | null;
  lead_id: string | null;
  sale_type: string;
  total_amount: number;
  due_amount: number;
  tenure: string | null;
  sale_date: string | null;
  due_date: string | null;
  observer: string | null;
  notes: string | null;
  status: string;
  allocated_to: string | null;
  created_by: string;
  created_at: string;
}

interface Customer { id: string; name: string; phone: string | null; }

const SALE_TYPES = ["amc", "renewal", "emi", "one_time"];
const STATUSES = ["active", "expired", "paid", "overdue"];

export default function PostSales() {
  const { user } = useAuth();
  const [records, setRecords] = useState<PostSale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PostSale | null>(null);
  const [form, setForm] = useState({
    customer_id: "", sale_type: "amc", total_amount: "", due_amount: "",
    tenure: "", sale_date: "", due_date: "", observer: "", notes: "", status: "active",
  });

  useEffect(() => { fetch(); fetchCustomers(); }, []);

  const fetch = async () => {
    const { data, error } = await supabase.from("post_sales").select("*").order("due_date", { ascending: true });
    if (error) toast.error(error.message);
    else setRecords((data as PostSale[]) || []);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("id, name, phone");
    if (data) setCustomers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = {
      ...form,
      total_amount: parseFloat(form.total_amount) || 0,
      due_amount: parseFloat(form.due_amount) || 0,
      customer_id: form.customer_id || null,
      sale_date: form.sale_date || null,
      due_date: form.due_date || null,
    };

    if (editing) {
      const { error } = await supabase.from("post_sales").update(payload as any).eq("id", editing.id);
      if (error) toast.error(error.message); else { toast.success("Updated"); setShowForm(false); fetch(); }
    } else {
      const { error } = await supabase.from("post_sales").insert({ ...payload, created_by: user.id } as any);
      if (error) toast.error(error.message); else { toast.success("Created"); setShowForm(false); fetch(); }
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ customer_id: "", sale_type: "amc", total_amount: "", due_amount: "", tenure: "", sale_date: "", due_date: "", observer: "", notes: "", status: "active" });
    setEditing(null);
  };

  const openEdit = (r: PostSale) => {
    setEditing(r);
    setForm({
      customer_id: r.customer_id || "", sale_type: r.sale_type, total_amount: String(r.total_amount),
      due_amount: String(r.due_amount), tenure: r.tenure || "", sale_date: r.sale_date || "",
      due_date: r.due_date || "", observer: r.observer || "", notes: r.notes || "", status: r.status,
    });
    setShowForm(true);
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from("post_sales").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetch(); }
  };

  const filtered = records.filter(r => {
    const cust = customers.find(c => c.id === r.customer_id);
    return cust?.name.toLowerCase().includes(search.toLowerCase()) || r.sale_type.includes(search.toLowerCase());
  });

  const todayDue = records.filter(r => r.due_date === new Date().toISOString().split("T")[0] && r.status === "active");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Sales</h1>
          <p className="text-sm text-muted-foreground">{records.length} records · {todayDue.length} due today</p>
        </div>
        <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Record</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Post Sale</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sale Type</Label>
                  <Select value={form.sale_type} onValueChange={v => setForm({ ...form, sale_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SALE_TYPES.map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <Input type="number" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Due Amount</Label>
                  <Input type="number" value={form.due_amount} onChange={e => setForm({ ...form, due_amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tenure</Label>
                  <Input value={form.tenure} onChange={e => setForm({ ...form, tenure: e.target.value })} placeholder="e.g. 12 months" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sale Date</Label>
                  <Input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Observer</Label>
                  <Input value={form.observer} onChange={e => setForm({ ...form, observer: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                <Button type="submit">{editing ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search post sales..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Tenure</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
                ) : filtered.map(r => {
                  const cust = customers.find(c => c.id === r.customer_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{cust?.name || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{r.sale_type.toUpperCase()}</Badge></TableCell>
                      <TableCell>₹{Number(r.total_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-destructive font-medium">₹{Number(r.due_amount).toLocaleString()}</TableCell>
                      <TableCell>{r.tenure || "—"}</TableCell>
                      <TableCell>{r.sale_date ? new Date(r.sale_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>{r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "paid" ? "default" : r.status === "overdue" ? "destructive" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRecord(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
