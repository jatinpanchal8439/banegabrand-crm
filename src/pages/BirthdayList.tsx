import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Cake, Gift } from "lucide-react";

interface Customer { id: string; name: string; phone: string | null; email: string | null; birthday: string | null; company: string | null; }

export default function BirthdayList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("customers").select("id, name, phone, email, birthday, company").not("birthday", "is", null).order("birthday");
      if (data) setCustomers(data as Customer[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcoming = customers.filter(c => {
    if (!c.birthday) return false;
    const bd = new Date(c.birthday);
    const bdStr = `${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`;
    return bdStr >= todayStr;
  }).slice(0, 50);

  const todayBirthdays = customers.filter(c => {
    if (!c.birthday) return false;
    const bd = new Date(c.birthday);
    return bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate();
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Cake className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Birthday List</h1>
          <p className="text-sm text-muted-foreground">{todayBirthdays.length} birthdays today</p>
        </div>
      </div>

      {todayBirthdays.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gift className="h-5 w-5 text-primary" />Today's Birthdays 🎉</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {todayBirthdays.map(c => (
                <Badge key={c.id} variant="default" className="text-sm py-1 px-3">{c.name} {c.phone && `• ${c.phone}`}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming Birthdays</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Phone</TableHead><TableHead>Birthday</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              : upcoming.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No birthdays recorded. Add birthday dates in customer profiles.</TableCell></TableRow>
              : upcoming.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.company || "—"}</TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell>{c.birthday ? new Date(c.birthday).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
