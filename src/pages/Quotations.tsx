import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Trash2, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
type QuotationStatus = Database["public"]["Enums"]["quotation_status"];

interface QuotationItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/10 text-info",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-warning/10 text-warning",
};

export default function Quotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<QuotationItem[]>([{ description: "", quantity: 1, unit_price: 0, tax_rate: 18, amount: 0 }]);
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [taxPercent, setTaxPercent] = useState(18);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [validUntil, setValidUntil] = useState("");
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);

  useEffect(() => { fetchQuotations(); }, []);

  const fetchQuotations = async () => {
    const { data, error } = await supabase.from("quotations").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setQuotations(data || []);
    setLoading(false);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    updated[index].amount = updated[index].quantity * updated[index].unit_price;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0, tax_rate: 18, amount: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("quotations").insert({
      items: items as any,
      subtotal,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total,
      terms,
      notes,
      valid_until: validUntil || null,
      created_by: user.id,
      quotation_number: "",
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Quotation created");
      setShowForm(false);
      setItems([{ description: "", quantity: 1, unit_price: 0, tax_rate: 18, amount: 0 }]);
      setTerms(""); setNotes(""); setDiscountPercent(0); setValidUntil("");
      fetchQuotations();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground">{quotations.length} quotations</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />New Quotation</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Quotation</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Items */}
              <div className="space-y-2">
                <Label className="font-medium">Items</Label>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} required />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Qty" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Price" min={0} value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="Tax %" value={item.tax_rate} onChange={(e) => updateItem(i, "tax_rate", Number(e.target.value))} />
                    </div>
                    <div className="col-span-1 text-sm font-medium text-foreground text-right">₹{item.amount.toFixed(2)}</div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax %</Label>
                  <Input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxPercent}%)</span><span className="text-foreground">₹{taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount ({discountPercent}%)</span><span className="text-destructive">-₹{discountAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Create Quotation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewQuotation} onOpenChange={() => setViewQuotation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Quotation {viewQuotation?.quotation_number}</DialogTitle></DialogHeader>
          {viewQuotation && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <Badge className={STATUS_COLORS[viewQuotation.status]}>{viewQuotation.status}</Badge>
                <span className="text-sm text-muted-foreground">{new Date(viewQuotation.created_at).toLocaleDateString()}</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead><TableHead>Qty</TableHead><TableHead>Price</TableHead><TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(viewQuotation.items as unknown as QuotationItem[])?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.unit_price}</TableCell>
                      <TableCell>₹{item.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right space-y-1 text-sm">
                <p>Subtotal: ₹{viewQuotation.subtotal}</p>
                <p>Tax: ₹{viewQuotation.tax_amount}</p>
                <p>Discount: -₹{viewQuotation.discount_amount}</p>
                <p className="font-bold text-lg">Total: ₹{viewQuotation.total}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
                <TableHead>Total</TableHead><TableHead>Valid Until</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : quotations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No quotations yet</TableCell></TableRow>
              ) : (
                quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.quotation_number}</TableCell>
                    <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={STATUS_COLORS[q.status]}>{q.status}</Badge></TableCell>
                    <TableCell className="font-medium">₹{q.total}</TableCell>
                    <TableCell>{q.valid_until ? new Date(q.valid_until).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewQuotation(q)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
