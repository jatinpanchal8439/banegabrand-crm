import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CalendarHeart, PartyPopper, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format, isPast, isFuture } from "date-fns";

const TYPES = ["national", "optional", "company"];
const TYPE_COLORS: Record<string, string> = {
  national: "bg-red-100 text-red-800", optional: "bg-blue-100 text-blue-800", company: "bg-green-100 text-green-800",
};

interface Holiday { id: string; name: string; date: string; holiday_type: string; is_active: boolean; }

export default function Holidays() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", holiday_type: "company" });

  useEffect(() => { fetchHolidays(); }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    const { data } = await supabase.from("holidays").select("*").order("date");
    if (data) setHolidays(data as Holiday[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("holidays").insert(form as any);
    if (error) toast.error(error.message);
    else { toast.success("Holiday added"); setShowForm(false); setForm({ name: "", date: "", holiday_type: "company" }); fetchHolidays(); }
  };

  const deleteHoliday = async (id: string) => {
    const { error } = await supabase.from("holidays").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchHolidays(); }
  };

  const upcoming = holidays.filter(h => isFuture(new Date(h.date))).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Holidays</h1>
        {isAdmin && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Holiday</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input placeholder="Holiday name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                <Select value={form.holiday_type} onValueChange={v => setForm({ ...form, holiday_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="submit" className="w-full">Add Holiday</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><CalendarHeart className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{holidays.length}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><PartyPopper className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{upcoming}</p><p className="text-xs text-muted-foreground">Upcoming</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Building2 className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{holidays.filter(h => h.holiday_type === "national").length}</p><p className="text-xs text-muted-foreground">National</p></div></CardContent></Card>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Holiday</TableHead><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Type</TableHead>
            {isAdmin && <TableHead>Actions</TableHead>}
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> :
              holidays.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No holidays</TableCell></TableRow> :
              holidays.map(h => (
                <TableRow key={h.id} className={isPast(new Date(h.date)) ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{format(new Date(h.date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{format(new Date(h.date), "EEEE")}</TableCell>
                  <TableCell><Badge className={TYPE_COLORS[h.holiday_type]}>{h.holiday_type}</Badge></TableCell>
                  {isAdmin && <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteHoliday(h.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
