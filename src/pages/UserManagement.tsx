import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users, Shield, ShieldCheck, UserCog, Search, Mail, Phone,
  Crown, Briefcase, User as UserIcon, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  user_id: string;
  full_name: string | null;
  designation: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  admin: { label: "Admin", icon: Crown, color: "bg-destructive/10 text-destructive border-destructive/20" },
  manager: { label: "Manager", icon: ShieldCheck, color: "bg-warning/10 text-warning border-warning/20" },
  sales_rep: { label: "Sales Rep", icon: UserIcon, color: "bg-primary/10 text-primary border-primary/20" },
};

export default function UserManagement() {
  const { user, hasRole } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("sales_rep");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const isAdmin = hasRole("admin");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, designation, phone, avatar_url, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (rolesRes.data) setRoles(rolesRes.data);
    setLoading(false);
  };

  const getUserRole = (userId: string): AppRole => {
    return roles.find((r) => r.user_id === userId)?.role || "sales_rep";
  };

  const openRoleDialog = (profile: UserProfile) => {
    setSelectedUser(profile);
    setSelectedRole(getUserRole(profile.user_id));
    setShowRoleDialog(true);
  };

  const updateRole = async () => {
    if (!selectedUser || !isAdmin) return;

    const existingRole = roles.find((r) => r.user_id === selectedUser.user_id);
    if (existingRole) {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: selectedRole })
        .eq("user_id", selectedUser.user_id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: selectedUser.user_id, role: selectedRole });
      if (error) { toast.error(error.message); return; }
    }

    toast.success(`Role updated to ${ROLE_CONFIG[selectedRole].label}`);
    setShowRoleDialog(false);
    fetchUsers();
  };

  const filtered = profiles.filter((p) =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleCounts = {
    admin: roles.filter((r) => r.role === "admin").length,
    manager: roles.filter((r) => r.role === "manager").length,
    sales_rep: roles.filter((r) => r.role === "sales_rep").length,
  };

  const getInitials = (name: string | null) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in">
        <div className="rounded-full bg-destructive/10 p-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You need admin privileges to access User Management. Contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> User Management
        </h1>
        <p className="text-sm text-muted-foreground">Manage team members, assign roles, and control access</p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(ROLE_CONFIG) as [AppRole, typeof ROLE_CONFIG.admin][]).map(([role, config]) => (
          <Card key={role} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${config.color}`}>
                  <config.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{roleCounts[role]}</p>
                  <p className="text-sm text-muted-foreground">{config.label}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Team Members ({filtered.length})
          </CardTitle>
          <CardDescription>Click "Change Role" to update a user's access level</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((profile) => {
                    const role = getUserRole(profile.user_id);
                    const roleConfig = ROLE_CONFIG[role];
                    const isCurrentUser = profile.user_id === user?.id;

                    return (
                      <TableRow key={profile.user_id} className={isCurrentUser ? "bg-primary/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {getInitials(profile.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground flex items-center gap-1.5">
                                {profile.full_name || "Unnamed"}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">You</Badge>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5" />
                            {profile.designation || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {profile.phone ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {profile.phone}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${roleConfig.color} gap-1`}>
                            <roleConfig.icon className="h-3 w-3" />
                            {roleConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRoleDialog(profile)}
                            disabled={isCurrentUser}
                            className="gap-1.5"
                          >
                            <Shield className="h-3.5 w-3.5" />
                            Change Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Change User Role
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(selectedUser.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.designation || "No designation"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLE_CONFIG) as [AppRole, typeof ROLE_CONFIG.admin][]).map(([role, config]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-info/10 text-sm text-info">
                <p className="font-medium mb-1">Role Permissions:</p>
                {selectedRole === "admin" && <p>Full access to all features, user management, and settings.</p>}
                {selectedRole === "manager" && <p>Can view all leads, manage team data, and access reports.</p>}
                {selectedRole === "sales_rep" && <p>Can manage own leads, create quotations, and log calls.</p>}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
                <Button onClick={updateRole}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Update Role
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
