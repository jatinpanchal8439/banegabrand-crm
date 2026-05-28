import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, MessageSquare, Users, FileText, Plus, Phone } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type MessageTemplate = Database["public"]["Tables"]["message_templates"]["Row"];
interface LeadOption { id: string; name: string; phone: string | null; }

export default function WhatsAppMessaging() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [bulkPhones, setBulkPhones] = useState("");
  const [bulkContent, setBulkContent] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [msgRes, tplRes, leadRes] = await Promise.all([
      supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("message_templates").select("*"),
      supabase.from("leads").select("id, name, phone").not("phone", "is", null),
    ]);
    setMessages(msgRes.data || []);
    setTemplates(tplRes.data || []);
    setLeads(leadRes.data || []);
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("messages").insert({
      phone,
      content,
      message_type: "whatsapp",
      sent_by: user.id,
      lead_id: selectedLeadId || null,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Message sent via WhatsApp API");
      // Also open WhatsApp web as fallback
      window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(content)}`, "_blank");
      setPhone(""); setContent(""); setSelectedLeadId("");
      fetchData();
    }
  };

  const sendBulkMessages = async () => {
    if (!user) return;
    const phones = bulkPhones.split("\n").map(p => p.trim()).filter(Boolean);
    if (phones.length === 0) { toast.error("Add phone numbers"); return; }

    const records = phones.map(p => ({
      phone: p,
      content: bulkContent,
      message_type: "whatsapp" as const,
      sent_by: user.id,
      status: "sent",
      sent_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("messages").insert(records);
    if (error) toast.error(error.message);
    else {
      toast.success(`${phones.length} messages queued`);
      setBulkPhones(""); setBulkContent("");
      fetchData();
    }
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("message_templates").insert({
      name: templateName,
      content: templateContent,
      category: templateCategory,
      created_by: user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Template saved");
      setShowTemplateForm(false);
      setTemplateName(""); setTemplateContent(""); setTemplateCategory("");
      fetchData();
    }
  };

  const applyTemplate = (template: MessageTemplate) => {
    setContent(template.content);
    setBulkContent(template.content);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing 360° — WhatsApp</h1>
        <p className="text-sm text-muted-foreground">Send messages, bulk broadcasts, and manage templates</p>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send"><MessageSquare className="mr-1.5 h-4 w-4" />Send Message</TabsTrigger>
          <TabsTrigger value="bulk"><Users className="mr-1.5 h-4 w-4" />Bulk Broadcast</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="mr-1.5 h-4 w-4" />Templates</TabsTrigger>
          <TabsTrigger value="history"><Send className="mr-1.5 h-4 w-4" />History</TabsTrigger>
        </TabsList>

        {/* Single message */}
        <TabsContent value="send">
          <Card>
            <CardHeader><CardTitle className="text-base">Send WhatsApp Message</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={sendMessage} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>Select Lead (optional)</Label>
                  <Select value={selectedLeadId} onValueChange={(v) => {
                    setSelectedLeadId(v);
                    const lead = leads.find(l => l.id === v);
                    if (lead?.phone) setPhone(lead.phone);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Choose a lead" /></SelectTrigger>
                    <SelectContent>
                      {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} — {l.phone}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" required />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Type your message..." required />
                </div>
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Quick Templates</Label>
                    <div className="flex flex-wrap gap-2">
                      {templates.map(t => (
                        <Button key={t.id} type="button" variant="outline" size="sm" onClick={() => applyTemplate(t)}>
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <Button type="submit"><Send className="mr-2 h-4 w-4" />Send via WhatsApp</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader><CardTitle className="text-base">Bulk WhatsApp Broadcast</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>Phone Numbers (one per line)</Label>
                  <Textarea value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} rows={6} placeholder={"+91 9876543210\n+91 9876543211\n+91 9876543212"} />
                  <p className="text-xs text-muted-foreground">{bulkPhones.split("\n").filter(Boolean).length} numbers</p>
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea value={bulkContent} onChange={(e) => setBulkContent(e.target.value)} rows={4} placeholder="Broadcast message..." />
                </div>
                {templates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {templates.map(t => (
                      <Button key={t.id} type="button" variant="outline" size="sm" onClick={() => applyTemplate(t)}>
                        {t.name}
                      </Button>
                    ))}
                  </div>
                )}
                <Button onClick={sendBulkMessages}><Send className="mr-2 h-4 w-4" />Send Broadcast</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Message Templates</CardTitle>
              <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-1 h-3 w-3" />Add Template</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
                  <form onSubmit={saveTemplate} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} placeholder="e.g., Follow Up, Greeting" />
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} rows={4} required placeholder="Hello {{name}}, ..." />
                    </div>
                    <Button type="submit">Save Template</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No templates yet</p>
              ) : (
                <div className="grid gap-3">
                  {templates.map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-foreground">{t.name}</span>
                        {t.category && <Badge variant="outline">{t.category}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead><TableHead>Type</TableHead><TableHead>Content</TableHead>
                    <TableHead>Status</TableHead><TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No messages yet</TableCell></TableRow>
                  ) : messages.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.phone}</TableCell>
                      <TableCell><Badge variant="outline">{m.message_type}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate">{m.content}</TableCell>
                      <TableCell><Badge variant={m.status === "sent" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                      <TableCell className="text-sm">{m.sent_at ? new Date(m.sent_at).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
