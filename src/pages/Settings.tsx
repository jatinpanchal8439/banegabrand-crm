import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, Upload, Download } from "lucide-react";
import { toast } from "sonner";

interface ConfigItem { id: string; name: string; is_active: boolean; }
interface CustomField { id: string; field_name: string; field_type: string; options: any; applies_to: string; is_required: boolean; is_active: boolean; sort_order: number; }
interface TermsCondition { id: string; name: string; content: string; is_default: boolean; }

export default function Settings() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const [sources, setSources] = useState<ConfigItem[]>([]);
  const [categories, setCategories] = useState<ConfigItem[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ConfigItem[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [termsConditions, setTermsConditions] = useState<TermsCondition[]>([]);
  const [newSource, setNewSource] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newHead, setNewHead] = useState("");
  const [newField, setNewField] = useState({ field_name: "", field_type: "text", applies_to: "leads", is_required: false });
  const [newTC, setNewTC] = useState({ name: "", content: "", is_default: false });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [s, c, e, f, t] = await Promise.all([
      supabase.from("lead_sources_config").select("*").order("name"),
      supabase.from("lead_categories_config").select("*").order("name"),
      supabase.from("expense_heads").select("*").order("name"),
      supabase.from("custom_fields").select("*").order("sort_order"),
      supabase.from("terms_conditions").select("*").order("name"),
    ]);
    if (s.data) setSources(s.data as ConfigItem[]);
    if (c.data) setCategories(c.data as ConfigItem[]);
    if (e.data) setExpenseHeads(e.data as ConfigItem[]);
    if (f.data) setCustomFields(f.data as CustomField[]);
    if (t.data) setTermsConditions(t.data as TermsCondition[]);
  };

  const addItem = async (table: string, name: string, setter: () => void) => {
    if (!name.trim()) return;
    const { error } = await supabase.from(table as any).insert({ name: name.trim() } as any);
    if (error) toast.error(error.message); else { toast.success("Added"); setter(); fetchAll(); }
  };

  const toggleActive = async (table: string, id: string, is_active: boolean) => {
    const { error } = await supabase.from(table as any).update({ is_active } as any).eq("id", id);
    if (error) toast.error(error.message); else fetchAll();
  };

  const deleteItem = async (table: string, id: string) => {
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchAll(); }
  };

  const addCustomField = async () => {
    if (!newField.field_name.trim()) return;
    const { error } = await supabase.from("custom_fields").insert(newField as any);
    if (error) toast.error(error.message);
    else { toast.success("Field added"); setNewField({ field_name: "", field_type: "text", applies_to: "leads", is_required: false }); fetchAll(); }
  };

  const addTC = async () => {
    if (!newTC.name.trim() || !newTC.content.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("terms_conditions").insert({ ...newTC, created_by: user.id } as any);
    if (error) toast.error(error.message);
    else { toast.success("T&C added"); setNewTC({ name: "", content: "", is_default: false }); fetchAll(); }
  };

  const ConfigTable = ({ items, table, newVal, setNewVal, label }: {
    items: ConfigItem[]; table: string; newVal: string; setNewVal: (v: string) => void; label: string;
  }) => (
    <Card>
      <CardHeader><CardTitle className="text-base">{label}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {isAdmin && (
          <div className="flex gap-2">
            <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={`New ${label.toLowerCase()}`} className="flex-1" />
            <Button size="sm" onClick={() => addItem(table, newVal, () => setNewVal(""))}><Plus className="h-4 w-4" /></Button>
          </div>
        )}
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
              <span className={`text-sm ${!item.is_active ? "text-muted-foreground line-through" : ""}`}>{item.name}</span>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active} onCheckedChange={v => toggleActive(table, item.id, v)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(table, item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      {!isAdmin && <p className="text-sm text-muted-foreground">View-only mode. Admin access required for changes.</p>}

      <Tabs defaultValue="sources">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="expense_heads">Expense Heads</TabsTrigger>
          <TabsTrigger value="custom_fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="terms">T & C</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <ConfigTable items={sources} table="lead_sources_config" newVal={newSource} setNewVal={setNewSource} label="Lead Sources" />
        </TabsContent>
        <TabsContent value="categories">
          <ConfigTable items={categories} table="lead_categories_config" newVal={newCategory} setNewVal={setNewCategory} label="Lead Categories" />
        </TabsContent>
        <TabsContent value="expense_heads">
          <ConfigTable items={expenseHeads} table="expense_heads" newVal={newHead} setNewVal={setNewHead} label="Expense Heads" />
        </TabsContent>

        <TabsContent value="custom_fields">
          <Card>
            <CardHeader><CardTitle className="text-base">Custom Fields</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input value={newField.field_name} onChange={e => setNewField({ ...newField, field_name: e.target.value })} placeholder="Field name" />
                  <Select value={newField.field_type} onValueChange={v => setNewField({ ...newField, field_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newField.applies_to} onValueChange={v => setNewField({ ...newField, applies_to: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addCustomField}><Plus className="mr-2 h-4 w-4" />Add</Button>
                </div>
              )}
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Applies To</TableHead><TableHead>Required</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow></TableHeader>
                <TableBody>
                  {customFields.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No custom fields</TableCell></TableRow>
                  ) : customFields.map(f => (
                    <TableRow key={f.id}>
                      <TableCell>{f.field_name}</TableCell>
                      <TableCell><Badge variant="outline">{f.field_type}</Badge></TableCell>
                      <TableCell>{f.applies_to}</TableCell>
                      <TableCell>{f.is_required ? "Yes" : "No"}</TableCell>
                      {isAdmin && <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem("custom_fields", f.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader><CardTitle className="text-base">Terms & Conditions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <Input value={newTC.name} onChange={e => setNewTC({ ...newTC, name: e.target.value })} placeholder="Template name" />
                  <Textarea value={newTC.content} onChange={e => setNewTC({ ...newTC, content: e.target.value })} placeholder="Terms content..." rows={4} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={newTC.is_default} onCheckedChange={v => setNewTC({ ...newTC, is_default: v })} />
                      <Label className="text-sm">Set as default</Label>
                    </div>
                    <Button onClick={addTC}><Plus className="mr-2 h-4 w-4" />Add T&C</Button>
                  </div>
                </div>
              )}
              {termsConditions.map(tc => (
                <div key={tc.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{tc.name} {tc.is_default && <Badge className="ml-2">Default</Badge>}</h3>
                    {isAdmin && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem("terms_conditions", tc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tc.content}</p>
                </div>
              ))}
              {termsConditions.length === 0 && <p className="text-center text-muted-foreground py-4">No templates</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader><CardTitle className="text-base">Lead Import / Export</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium">Import Leads (CSV)</h3>
                  <p className="text-sm text-muted-foreground">Upload a CSV file with columns: name, phone, email, company, city, category, source</p>
                  <Input type="file" accept=".csv" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    const lines = text.split("\n").filter(l => l.trim());
                    if (lines.length < 2) { toast.error("Empty CSV"); return; }
                    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const rows = lines.slice(1).map(line => {
                      const vals = line.split(",").map(v => v.trim());
                      const row: any = { created_by: user.id, assigned_to: user.id };
                      headers.forEach((h, i) => { if (vals[i]) row[h] = vals[i]; });
                      return row;
                    });
                    const { error } = await supabase.from("leads").insert(rows);
                    if (error) toast.error(error.message);
                    else toast.success(`${rows.length} leads imported`);
                  }} />
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium">Export Leads (CSV)</h3>
                  <p className="text-sm text-muted-foreground">Download all leads as a CSV file</p>
                  <Button variant="outline" onClick={async () => {
                    const { data } = await supabase.from("leads").select("name, phone, email, company, city, category, source, status, priority, next_followup, notes");
                    if (!data || data.length === 0) { toast.error("No leads"); return; }
                    const headers = Object.keys(data[0]);
                    const csv = [headers.join(","), ...data.map(r => headers.map(h => `"${(r as any)[h] || ""}"`).join(","))].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = "leads_export.csv"; a.click();
                    toast.success("Exported");
                  }}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
