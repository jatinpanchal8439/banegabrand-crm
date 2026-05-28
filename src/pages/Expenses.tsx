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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Expense {
  id: string; category: string; amount: number; expense_date: string;
  description: string | null; created_by: string; created_at: string;
}

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [heads, setHeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: "", amount: "", expense_date: new Date().toISOString().split("T")[0], description: "" });

  useEffect(() => { fetchExpenses(); fetchHeads(); }, []);

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    if (error) toast.error(error.message); else setExpenses((data as Expense[]) || []);
    setLoading(false);
  };

  const fetchHeads = async () => {
    const { data } = await supabase.from("expense_heads").select("name").eq("is_active", true);
    if (data) setHeads(data.map(d => d.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = { category: form.category, amount: parseFloat(form.amount) || 0, expense_date: form.expense_date, description: form.description || null };
    if (editing) {
      const { error } = await supabase.from("expenses").update(payload as any).eq("id", editing.id);
      if (error) toast.error(error.message); else { toast.success("Updated"); setShowForm(false); fetchExpenses(); }
    } else {
      const { error } = await supabase.from("expenses").insert({ ...payload, created_by: user.id } as any);
      if (error) toast.error(error.message); else { toast.success("Added"); setShowForm(false); fetchExpenses(); }
    }
    resetForm();
  };

  const resetForm = () => { setForm({ category: "", amount: "", expense_date: new Date().toISOString().split("T")[0], description: "" }); setEditing(null); };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ category: e.category, amount: String(e.amount), expense_date: e.expense_date, description: e.description || "" });
    setShowForm(true);
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchExpenses(); }
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const filtered = expenses.filter(e => e.category.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Total: ₹{total.toLocaleString()}</p>
        </div>
        <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{heads.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                <Button type="submit">{editing ? "Update" : "Add"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0"><div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead>
            <TableHead>Description</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No expenses</TableCell></TableRow>
            : filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.category}</TableCell>
                <TableCell>₹{Number(e.amount).toLocaleString()}</TableCell>
                <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{e.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteExpense(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div></CardContent></Card>
    </div>
  );
}
