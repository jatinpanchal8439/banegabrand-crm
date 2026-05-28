import { useEffect, useState, useRef } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Filter, Edit2, Trash2, Phone, Upload, Download, FileSpreadsheet, Image, FileText } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];
type LeadPriority = Database["public"]["Enums"]["lead_priority"];

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new_lead", label: "New Lead" }, { value: "callback", label: "Callback" },
  { value: "not_interested", label: "Not Interested" }, { value: "dp", label: "DP" },
  { value: "cbpc", label: "CBPC" }, { value: "pg", label: "PG" },
  { value: "dp_followup", label: "DP Followup" }, { value: "pg_followup", label: "PG Followup" },
  { value: "video_meeting", label: "Video Meeting" }, { value: "video_meeting_followup", label: "VM Followup" },
  { value: "converted", label: "Converted" }, { value: "dead", label: "Dead" },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
  { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
];

const STATUS_COLORS: Record<string, string> = {
  new_lead: "bg-info/10 text-info", callback: "bg-warning/10 text-warning",
  not_interested: "bg-destructive/10 text-destructive", converted: "bg-success/10 text-success",
  dead: "bg-muted text-muted-foreground", dp: "bg-primary/10 text-primary", pg: "bg-accent/10 text-accent",
};

const SOURCES = ["Website", "Facebook", "Google", "Referral", "Walk-in", "Phone", "WhatsApp", "Other"];

export default function LeadManager() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<LeadInsert>>({
    name: "", email: "", phone: "", company: "", city: "",
    category: "", source: "", status: "new_lead", priority: "medium", notes: "", next_followup: "",
  });

  useEffect(() => { fetchLeads(); }, [statusFilter]);

  const fetchLeads = async () => {
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter as LeadStatus);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setLeads(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editingLead) {
      const { error } = await supabase.from("leads").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editingLead.id);
      if (error) toast.error(error.message);
      else { toast.success("Lead updated"); setShowForm(false); fetchLeads(); }
    } else {
      const { error } = await supabase.from("leads").insert({ ...form, created_by: user.id, assigned_to: user.id } as LeadInsert);
      if (error) toast.error(error.message);
      else { toast.success("Lead created"); setShowForm(false); fetchLeads(); }
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", company: "", city: "", category: "", source: "", status: "new_lead", priority: "medium", notes: "", next_followup: "" });
    setEditingLead(null);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      name: lead.name, email: lead.email || "", phone: lead.phone || "",
      company: lead.company || "", city: lead.city || "", category: lead.category || "",
      source: lead.source || "", status: lead.status, priority: lead.priority || "medium",
      notes: lead.notes || "", next_followup: lead.next_followup?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Lead deleted"); fetchLeads(); }
  };

  // CSV/Excel Import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("File must have header + data rows"); setImporting(false); return; }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
      const nameIdx = headers.findIndex(h => h.includes("name"));
      const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("mobile"));
      const emailIdx = headers.findIndex(h => h.includes("email"));
      const companyIdx = headers.findIndex(h => h.includes("company") || h.includes("org"));
      const cityIdx = headers.findIndex(h => h.includes("city") || h.includes("location"));
      const sourceIdx = headers.findIndex(h => h.includes("source"));
      const notesIdx = headers.findIndex(h => h.includes("note") || h.includes("remark"));

      if (nameIdx === -1) { toast.error("CSV must have a 'Name' column"); setImporting(false); return; }

      const leadsToInsert: LeadInsert[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const name = cols[nameIdx]?.trim();
        if (!name) continue;
        leadsToInsert.push({
          name,
          phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() || null : null,
          email: emailIdx >= 0 ? cols[emailIdx]?.trim() || null : null,
          company: companyIdx >= 0 ? cols[companyIdx]?.trim() || null : null,
          city: cityIdx >= 0 ? cols[cityIdx]?.trim() || null : null,
          source: sourceIdx >= 0 ? cols[sourceIdx]?.trim() || null : null,
          notes: notesIdx >= 0 ? cols[notesIdx]?.trim() || null : null,
          created_by: user.id, assigned_to: user.id,
        });
      }

      if (leadsToInsert.length === 0) { toast.error("No valid leads found in file"); setImporting(false); return; }

      // Insert in batches of 50
      let inserted = 0;
      for (let i = 0; i < leadsToInsert.length; i += 50) {
        const batch = leadsToInsert.slice(i, i + 50);
        const { error } = await supabase.from("leads").insert(batch);
        if (error) { toast.error(`Batch error: ${error.message}`); break; }
        inserted += batch.length;
      }

      toast.success(`${inserted} leads imported successfully`);
      setShowImport(false);
      fetchLeads();
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Document/Image upload to file_uploads
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setImporting(true);
    for (const file of Array.from(files)) {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("crm-files").upload(filePath, file);
      if (uploadErr) { toast.error(`Upload failed: ${file.name}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from("crm-files").getPublicUrl(filePath);
      await supabase.from("file_uploads").insert({
        file_name: file.name, file_url: publicUrl, file_type: file.type,
        file_size: file.size, uploaded_by: user.id, related_to_type: "leads",
      } as any);
    }
    toast.success("Documents uploaded to File Manager");
    setImporting(false);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Company", "City", "Source", "Status", "Priority", "Notes"];
    const rows = leads.map(l => [l.name, l.phone || "", l.email || "", l.company || "", l.city || "", l.source || "", l.status, l.priority || "", l.notes || ""]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Leads exported");
  };

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Manager</h1>
          <p className="text-sm text-muted-foreground">{leads.length} total leads</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Import Dialog */}
          <Dialog open={showImport} onOpenChange={setShowImport}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Import Leads</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                  <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Upload CSV or Excel File</p>
                  <p className="text-xs text-muted-foreground">File must have a "Name" column. Optional: Phone, Email, Company, City, Source, Notes</p>
                  <Input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileImport} disabled={importing} />
                </div>
                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                  <Image className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Documents & Photos</p>
                  <p className="text-xs text-muted-foreground">Upload PDF, Word, Excel docs or photos related to leads</p>
                  <Input type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg" multiple onChange={handleDocUpload} disabled={importing} />
                </div>
                {importing && <p className="text-center text-sm text-muted-foreground">Processing...</p>}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export</Button>

          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Lead</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Company</Label><Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                  <div className="space-y-2"><Label>City</Label><Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Category</Label><Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={form.source || ""} onValueChange={(v) => setForm({ ...form, source: v })}>
                      <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LeadStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={form.priority || "medium"} onValueChange={(v) => setForm({ ...form, priority: v as LeadPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Next Followup</Label><Input type="date" value={form.next_followup || ""} onChange={(e) => setForm({ ...form, next_followup: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit">{editingLead ? "Update" : "Create"} Lead</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Company</TableHead>
                  <TableHead>City</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead><TableHead>Followup</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
                ) : filtered.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.phone || "—"}</TableCell>
                    <TableCell className="text-sm">{lead.company || "—"}</TableCell>
                    <TableCell className="text-sm">{lead.city || "—"}</TableCell>
                    <TableCell className="text-sm">{lead.source || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[lead.status] || "bg-muted"}>
                        {STATUS_OPTIONS.find((s) => s.value === lead.status)?.label || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.priority === "urgent" ? "destructive" : "outline"} className="text-xs">{lead.priority || "medium"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{lead.next_followup ? new Date(lead.next_followup).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lead)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete "{lead.name}". This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteLead(lead.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}
