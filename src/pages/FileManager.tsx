import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Search, Trash2, Download, FileText, FileSpreadsheet, Image, File, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface FileRecord {
  id: string; file_name: string; file_url: string; file_type: string | null;
  file_size: number | null; uploaded_by: string; created_at: string;
  related_to_type: string | null; related_to_id: string | null;
}

const getFileIcon = (type: string | null) => {
  if (!type) return File;
  if (type.includes("pdf")) return FileText;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet;
  if (type.includes("image")) return Image;
  return File;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export default function FileManager() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    setLoading(true);
    const { data } = await supabase.from("file_uploads").select("*").order("created_at", { ascending: false });
    if (data) setFiles(data as FileRecord[]);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !user) return;
    setUploading(true);

    for (const file of Array.from(fileList)) {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("crm-files").upload(filePath, file);
      if (uploadErr) { toast.error(`Upload failed: ${file.name}`); continue; }

      const { data: { publicUrl } } = supabase.storage.from("crm-files").getPublicUrl(filePath);

      await supabase.from("file_uploads").insert({
        file_name: file.name, file_url: publicUrl, file_type: file.type,
        file_size: file.size, uploaded_by: user.id,
      } as any);
    }

    toast.success("Files uploaded");
    setUploading(false);
    fetchFiles();
    e.target.value = "";
  };

  const deleteFile = async (f: FileRecord) => {
    const pathMatch = f.file_url.match(/crm-files\/(.+)$/);
    if (pathMatch) await supabase.storage.from("crm-files").remove([pathMatch[1]]);
    await supabase.from("file_uploads").delete().eq("id", f.id);
    toast.success("Deleted");
    fetchFiles();
  };

  const filtered = files.filter(f => f.file_name.toLowerCase().includes(search.toLowerCase()));
  const totalSize = files.reduce((s, f) => s + (f.file_size || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">File Manager</h1>
        <div>
          <Input type="file" id="file-upload" className="hidden" multiple accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg" onChange={handleUpload} />
          <Button onClick={() => document.getElementById("file-upload")?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : "Upload Files"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><File className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{files.length}</p><p className="text-xs text-muted-foreground">Total Files</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><HardDrive className="h-8 w-8 text-blue-600" /><div><p className="text-2xl font-bold">{formatSize(totalSize)}</p><p className="text-xs text-muted-foreground">Total Size</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="h-8 w-8 text-red-600" /><div><p className="text-2xl font-bold">{files.filter(f => f.file_type?.includes("pdf")).length}</p><p className="text-xs text-muted-foreground">PDFs</p></div></CardContent></Card>
      </div>

      <p className="text-sm text-muted-foreground">Supported: PDF, Excel, CSV, Word, Images (PNG, JPG)</p>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search files..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>File</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Uploaded</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow> :
              filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No files</TableCell></TableRow> :
              filtered.map(f => {
                const Icon = getFileIcon(f.file_type);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground shrink-0" /><span className="font-medium truncate max-w-[200px]">{f.file_name}</span></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{f.file_type?.split("/").pop() || "unknown"}</Badge></TableCell>
                    <TableCell className="text-sm">{formatSize(f.file_size)}</TableCell>
                    <TableCell className="text-sm">{format(new Date(f.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild><a href={f.file_url} target="_blank" rel="noopener"><Download className="h-3.5 w-3.5" /></a></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteFile(f)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
