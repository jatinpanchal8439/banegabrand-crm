import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { LogIn, LogOut, Clock, CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string; user_id: string; date: string; check_in: string | null;
  check_out: string | null; status: string; notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-800", absent: "bg-red-100 text-red-800",
  half_day: "bg-yellow-100 text-yellow-800", leave: "bg-purple-100 text-purple-800",
};

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchRecords(); }, [user]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase.from("attendance").select("*").eq("user_id", user!.id).order("date", { ascending: false }).limit(30);
    if (data) {
      setRecords(data as AttendanceRecord[]);
      const today = format(new Date(), "yyyy-MM-dd");
      setTodayRecord((data as AttendanceRecord[]).find(r => r.date === today) || null);
    }
    setLoading(false);
  };

  const checkIn = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const { error } = await supabase.from("attendance").insert({
      user_id: user.id, date: today, check_in: new Date().toISOString(), status: "present",
    } as any);
    if (error) { if (error.code === "23505") toast.error("Already checked in today"); else toast.error(error.message); }
    else { toast.success("Checked in!"); fetchRecords(); }
  };

  const checkOut = async () => {
    if (!todayRecord) return;
    const { error } = await supabase.from("attendance").update({ check_out: new Date().toISOString() } as any).eq("id", todayRecord.id);
    if (error) toast.error(error.message);
    else { toast.success("Checked out!"); fetchRecords(); }
  };

  const presentDays = records.filter(r => r.status === "present").length;
  const absentDays = records.filter(r => r.status === "absent").length;

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Attendance</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><CalendarDays className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{records.length}</p><p className="text-xs text-muted-foreground">Total Days</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-600" /><div><p className="text-2xl font-bold">{presentDays}</p><p className="text-xs text-muted-foreground">Present</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><XCircle className="h-8 w-8 text-red-600" /><div><p className="text-2xl font-bold">{absentDays}</p><p className="text-xs text-muted-foreground">Absent</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">{todayRecord ? "Active" : "—"}</p><p className="text-xs text-muted-foreground">Today</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Today's Attendance</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          {!todayRecord ? (
            <Button onClick={checkIn} className="gap-2"><LogIn className="h-4 w-4" />Check In</Button>
          ) : !todayRecord.check_out ? (
            <div className="flex items-center gap-4">
              <Badge className="bg-green-100 text-green-800">Checked in at {format(new Date(todayRecord.check_in!), "h:mm a")}</Badge>
              <Button variant="outline" onClick={checkOut} className="gap-2"><LogOut className="h-4 w-4" />Check Out</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">In: {format(new Date(todayRecord.check_in!), "h:mm a")}</Badge>
              <Badge className="bg-blue-100 text-blue-800">Out: {format(new Date(todayRecord.check_out), "h:mm a")}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Attendance History (Last 30 days)</CardTitle></CardHeader>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow> :
              records.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow> :
              records.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{format(new Date(r.date), "MMM d, yyyy (EEE)")}</TableCell>
                  <TableCell>{r.check_in ? format(new Date(r.check_in), "h:mm a") : "—"}</TableCell>
                  <TableCell>{r.check_out ? format(new Date(r.check_out), "h:mm a") : "—"}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[r.status] || ""}>{r.status.replace("_", " ")}</Badge></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
