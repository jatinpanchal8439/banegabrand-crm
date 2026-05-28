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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Phone, Mail, Users, CheckSquare, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TYPES = [
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "task", label: "Task", icon: CheckSquare },
  { value: "email", label: "Email", icon: Mail },
];

interface Activity {
  id: string; title: string; activity_type: string; due_date: string | null;
  completed: boolean; notes: string | null; created_at: string; assigned_to: string; created_by: string;
}

export default function Activities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", activity_type: "task", due_date: "", notes: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("activities").select("*").order("created_at", { ascending: false });
    if (data) setActivities(data as Activity[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("activities").insert({
      title: form.title, activity_type: form.activity_type,
      due_date: form.due_date || null, notes: form.notes || null,
      assigned_to: user.id, created_by: user.id,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Activity added"); setShowForm(false); setForm({ title: "", activity_type: "task", due_date: "", notes: "" }); fetch(); }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from("activities").update({ completed } as any).eq("id", id);
    fetch();
  };

  const filtered = activities.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
  const pending = activities.filter(a => !a.completed).length;
  const today = activities.filter(a => a.due_date && format(new Date(a.due_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Activities</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Activity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Activity</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              <Select value={form.activity_type} onValueChange={v => setForm({ ...form, activity_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="datetime-local" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              <Textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <Button type="submit" className="w-full">Add Activity</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{activities.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{today}</p><p className="text-xs text-muted-foreground">Due Today</p></CardContent></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="space-y-2">
        {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> :
          filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No activities</p> :
          filtered.map(a => {
            const TypeIcon = TYPES.find(t => t.value === a.activity_type)?.icon || CheckSquare;
            return (
              <Card key={a.id} className={`transition-shadow hover:shadow-md ${a.completed ? "opacity-60" : ""}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Checkbox checked={a.completed} onCheckedChange={v => toggleComplete(a.id, !!v)} />
                  <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${a.completed ? "line-through" : ""}`}>{a.title}</p>
                    {a.due_date && <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(a.due_date), "MMM d, yyyy h:mm a")}</p>}
                  </div>
                  <Badge variant="outline">{TYPES.find(t => t.value === a.activity_type)?.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
