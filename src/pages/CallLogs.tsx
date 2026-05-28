import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, CalendarClock, BarChart3, Clock, CheckCircle2, Trash2, Upload, Play, Pause, Download, Mic } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface CallLog {
  id: string; lead_id: string | null; customer_id: string | null; phone: string | null;
  call_type: string; duration_seconds: number; outcome: string | null; notes: string | null;
  called_by: string; called_at: string; recording_url?: string | null;
}
interface ScheduledCall {
  id: string; contact_name: string; phone: string | null; scheduled_at: string;
  notes: string | null; status: string; lead_id: string | null; customer_id: string | null; created_by: string;
}
interface Lead { id: string; name: string; phone: string | null; }
interface Customer { id: string; name: string; phone: string | null; }

const CALL_TYPES = ["incoming", "outgoing", "missed"];
const OUTCOMES = ["Interested", "Not Interested", "Callback", "No Answer", "Busy", "Wrong Number", "Converted", "Other"];
const COLORS = ["hsl(210,90%,45%)", "hsl(142,70%,45%)", "hsl(0,72%,51%)", "hsl(38,92%,50%)", "hsl(280,60%,55%)", "hsl(170,60%,45%)", "hsl(330,65%,50%)", "hsl(199,89%,48%)"];

const CallIcon = ({ type }: { type: string }) => {
  if (type === "incoming") return <PhoneIncoming className="h-4 w-4 text-green-600" />;
  if (type === "missed") return <PhoneMissed className="h-4 w-4 text-destructive" />;
  return <PhoneOutgoing className="h-4 w-4 text-primary" />;
};

export default function CallLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledCall[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [form, setForm] = useState({ lead_id: "", customer_id: "", phone: "", call_type: "outgoing", duration_seconds: "", outcome: "", notes: "" });
  const [scheduleForm, setScheduleForm] = useState({ contact_name: "", phone: "", scheduled_at: "", notes: "", lead_id: "", customer_id: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => { fetchLogs(); fetchScheduled(); fetchLeads(); fetchCustomers(); };

  const fetchLogs = async () => {
    const { data, error } = await supabase.from("call_logs").select("*").order("called_at", { ascending: false }).limit(200);
    if (error) toast.error(error.message);
    else setLogs((data as CallLog[]) || []);
    setLoading(false);
  };

  const fetchScheduled = async () => {
    const { data } = await supabase.from("scheduled_calls").select("*").order("scheduled_at", { ascending: true }) as any;
    if (data) setScheduled(data);
  };

  const fetchLeads = async () => { const { data } = await supabase.from("leads").select("id, name, phone"); if (data) setLeads(data); };
  const fetchCustomers = async () => { const { data } = await supabase.from("customers").select("id, name, phone"); if (data) setCustomers(data); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let recording_url: string | null = null;
    if (recordingFile) {
      const filePath = `${user.id}/${Date.now()}_${recordingFile.name}`;
      const { error: upErr } = await supabase.storage.from("call-recordings").upload(filePath, recordingFile);
      if (upErr) { toast.error("Recording upload failed"); return; }
      const { data: { publicUrl } } = supabase.storage.from("call-recordings").getPublicUrl(filePath);
      recording_url = publicUrl;
    }

    const { error } = await supabase.from("call_logs").insert({
      lead_id: form.lead_id || null, customer_id: form.customer_id || null,
      phone: form.phone || null, call_type: form.call_type,
      duration_seconds: parseInt(form.duration_seconds) || 0,
      outcome: form.outcome || null, notes: form.notes || null, called_by: user.id,
      recording_url,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Call logged"); setShowForm(false); fetchLogs(); }
    setForm({ lead_id: "", customer_id: "", phone: "", call_type: "outgoing", duration_seconds: "", outcome: "", notes: "" });
    setRecordingFile(null);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await (supabase.from("scheduled_calls") as any).insert({
      contact_name: scheduleForm.contact_name, phone: scheduleForm.phone || null,
      scheduled_at: scheduleForm.scheduled_at, notes: scheduleForm.notes || null,
      lead_id: scheduleForm.lead_id || null, customer_id: scheduleForm.customer_id || null, created_by: user.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Call scheduled"); setShowScheduleForm(false); fetchScheduled(); }
    setScheduleForm({ contact_name: "", phone: "", scheduled_at: "", notes: "", lead_id: "", customer_id: "" });
  };

  const markCompleted = async (id: string) => {
    const { error } = await (supabase.from("scheduled_calls") as any).update({ status: "completed" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Marked complete"); fetchScheduled(); }
  };

  const deleteScheduled = async (id: string) => {
    const { error } = await (supabase.from("scheduled_calls") as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchScheduled(); }
  };

  const togglePlay = (id: string) => {
    if (playingId === id) {
      const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
      audio?.pause();
      setPlayingId(null);
    } else {
      if (playingId) {
        const prev = document.getElementById(`audio-${playingId}`) as HTMLAudioElement;
        prev?.pause();
      }
      const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
      audio?.play();
      setPlayingId(id);
    }
  };

  const getName = (log: CallLog) => {
    if (log.lead_id) { const l = leads.find(x => x.id === log.lead_id); return l?.name || "Unknown Lead"; }
    if (log.customer_id) { const c = customers.find(x => x.id === log.customer_id); return c?.name || "Unknown Customer"; }
    return log.phone || "—";
  };

  const formatDuration = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  const filtered = logs.filter(l => getName(l).toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search));
  const today = new Date().toISOString().split("T")[0];
  const todayCount = logs.filter(l => l.called_at.startsWith(today)).length;
  const pendingScheduled = scheduled.filter(s => s.status === "pending");
  const overdueScheduled = pendingScheduled.filter(s => new Date(s.scheduled_at) < new Date());
  const recordingsCount = logs.filter(l => l.recording_url).length;

  const outcomeCounts: Record<string, number> = {};
  logs.forEach(l => { if (l.outcome) outcomeCounts[l.outcome] = (outcomeCounts[l.outcome] || 0) + 1; });
  const outcomeData = Object.entries(outcomeCounts).map(([name, value]) => ({ name, value }));
  const typeCounts = { incoming: 0, outgoing: 0, missed: 0 };
  logs.forEach(l => { if (l.call_type in typeCounts) typeCounts[l.call_type as keyof typeof typeCounts]++; });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const totalDuration = logs.reduce((s, l) => s + (l.duration_seconds || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Call Tracking</h1>
          <p className="text-sm text-muted-foreground">{logs.length} total · {todayCount} today · {recordingsCount} recordings · {pendingScheduled.length} scheduled</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showScheduleForm} onOpenChange={setShowScheduleForm}>
            <DialogTrigger asChild><Button variant="outline"><CalendarClock className="mr-2 h-4 w-4" />Schedule</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Schedule a Call</DialogTitle></DialogHeader>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Contact Name *</Label><Input required value={scheduleForm.contact_name} onChange={e => setScheduleForm({ ...scheduleForm, contact_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={scheduleForm.phone} onChange={e => setScheduleForm({ ...scheduleForm, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Scheduled At *</Label><Input type="datetime-local" required value={scheduleForm.scheduled_at} onChange={e => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Lead</Label>
                  <Select value={scheduleForm.lead_id} onValueChange={v => setScheduleForm({ ...scheduleForm, lead_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={scheduleForm.notes} onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })} rows={2} /></div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Log Call</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Log a Call</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lead</Label>
                    <Select value={form.lead_id} onValueChange={v => setForm({ ...form, lead_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                      <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Or Customer</Label>
                    <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Call Type</Label>
                    <Select value={form.call_type} onValueChange={v => setForm({ ...form, call_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CALL_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Duration (seconds)</Label><Input type="number" value={form.duration_seconds} onChange={e => setForm({ ...form, duration_seconds: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select value={form.outcome} onValueChange={v => setForm({ ...form, outcome: v })}>
                      <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                      <SelectContent>{OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Recording Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mic className="h-4 w-4" /> Call Recording (optional)</Label>
                  <Input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a" onChange={e => setRecordingFile(e.target.files?.[0] || null)} />
                  {recordingFile && <p className="text-xs text-muted-foreground">Selected: {recordingFile.name}</p>}
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit">Log Call</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs"><Phone className="mr-1.5 h-4 w-4" />Call Logs</TabsTrigger>
          <TabsTrigger value="recordings"><Mic className="mr-1.5 h-4 w-4" />Recordings ({recordingsCount})</TabsTrigger>
          <TabsTrigger value="scheduled"><CalendarClock className="mr-1.5 h-4 w-4" />Scheduled ({pendingScheduled.length})</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="mr-1.5 h-4 w-4" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card><CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search calls..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent></Card>
          <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead>
                    <TableHead>Duration</TableHead><TableHead>Outcome</TableHead><TableHead>Recording</TableHead>
                    <TableHead>Notes</TableHead><TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No calls logged</TableCell></TableRow>
                  ) : filtered.map(log => (
                    <TableRow key={log.id}>
                      <TableCell><CallIcon type={log.call_type} /></TableCell>
                      <TableCell className="font-medium">{getName(log)}</TableCell>
                      <TableCell>{log.phone || "—"}</TableCell>
                      <TableCell>{formatDuration(log.duration_seconds)}</TableCell>
                      <TableCell>{log.outcome ? <Badge variant="outline">{log.outcome}</Badge> : "—"}</TableCell>
                      <TableCell>
                        {log.recording_url ? (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePlay(log.id)}>
                              {playingId === log.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={log.recording_url} download target="_blank" rel="noopener"><Download className="h-3.5 w-3.5" /></a>
                            </Button>
                            <audio id={`audio-${log.id}`} src={log.recording_url} onEnded={() => setPlayingId(null)} />
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{log.notes || "—"}</TableCell>
                      <TableCell className="text-sm">{new Date(log.called_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings" className="space-y-4">
          <div className="grid gap-3">
            {logs.filter(l => l.recording_url).length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                <Mic className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p>No recordings yet. Upload recordings when logging calls.</p>
              </CardContent></Card>
            ) : logs.filter(l => l.recording_url).map(log => (
              <Card key={log.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Mic className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="font-medium">{getName(log)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.called_at).toLocaleString()} · {formatDuration(log.duration_seconds)} · {log.call_type}</p>
                      {log.outcome && <Badge variant="outline" className="mt-1 text-xs">{log.outcome}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <audio id={`rec-audio-${log.id}`} src={log.recording_url!} onEnded={() => setPlayingId(null)} className="hidden" />
                    <Button variant="outline" size="sm" onClick={() => {
                      const audioEl = document.getElementById(`rec-audio-${log.id}`) as HTMLAudioElement;
                      if (playingId === `rec-${log.id}`) { audioEl?.pause(); setPlayingId(null); }
                      else { audioEl?.play(); setPlayingId(`rec-${log.id}`); }
                    }}>
                      {playingId === `rec-${log.id}` ? <Pause className="mr-1.5 h-4 w-4" /> : <Play className="mr-1.5 h-4 w-4" />}
                      {playingId === `rec-${log.id}` ? "Pause" : "Play"}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={log.recording_url!} download target="_blank" rel="noopener"><Download className="mr-1.5 h-4 w-4" />Download</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {pendingScheduled.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No scheduled calls</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {pendingScheduled.map(s => {
                const isOverdue = new Date(s.scheduled_at) < new Date();
                return (
                  <Card key={s.id} className={isOverdue ? "border-destructive/40" : ""}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarClock className={`h-5 w-5 ${isOverdue ? "text-destructive" : "text-primary"}`} />
                        <div>
                          <p className="font-medium">{s.contact_name} {s.phone && <span className="text-muted-foreground text-sm ml-1">{s.phone}</span>}</p>
                          <p className="text-xs text-muted-foreground">{new Date(s.scheduled_at).toLocaleString()} {isOverdue && <Badge variant="destructive" className="ml-1 text-[10px]">Overdue</Badge>}</p>
                          {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {s.phone && <Button size="sm" variant="ghost" asChild><a href={`tel:${s.phone}`}><Phone className="h-4 w-4" /></a></Button>}
                        <Button size="sm" variant="ghost" onClick={() => markCompleted(s.id)}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteScheduled(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{logs.length}</p><p className="text-xs text-muted-foreground">Total Calls</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{todayCount}</p><p className="text-xs text-muted-foreground">Today</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{formatDuration(totalDuration)}</p><p className="text-xs text-muted-foreground">Total Duration</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{recordingsCount}</p><p className="text-xs text-muted-foreground">Recordings</p></CardContent></Card>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Call Types</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {typeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Outcomes</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={outcomeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(210,90%,45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
