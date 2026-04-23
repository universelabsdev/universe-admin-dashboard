import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlobalRole, OrganizationalRoleDef } from "@/services/role.service";

interface EditRoleDialogProps {
  role: GlobalRole | OrganizationalRoleDef | null;
  type: 'global' | 'org';
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
}

export function EditRoleDialog({ role, type, isOpen, onClose, onUpdate }: EditRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organizationType: "",
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || "",
        description: role.description || "",
        organizationType: (role as OrganizationalRoleDef).organizationType || "",
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setLoading(true);
    const success = await onUpdate(role.id, formData);
    setLoading(false);

    if (success) {
      toast.success("Role updated successfully");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl bg-card text-card-foreground">
        <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
          <DialogTitle className="text-xl font-bold">Edit {type === 'global' ? 'Global' : 'Organizational'} Role</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update the basic details of this system role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold text-slate-500 ml-1">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Super Admin"
              className="rounded-2xl border-slate-200 h-12 focus:ring-primary/20"
              disabled={role?.isSystem}
            />
            {role?.isSystem && <p className="text-[10px] text-amber-600 font-medium ml-1">System role names cannot be changed.</p>}
          </div>

          {type === 'org' && (
            <div className="space-y-2">
              <Label htmlFor="orgType" className="text-sm font-bold text-slate-500 ml-1">Organization Type</Label>
              <Input
                id="orgType"
                value={formData.organizationType}
                onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                placeholder="e.g. CLUB, DEPARTMENT"
                className="rounded-2xl border-slate-200 h-12 focus:ring-primary/20"
                disabled={role?.isSystem}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-bold text-slate-500 ml-1">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What can this role do?"
              className="min-h-[100px] rounded-2xl border-slate-200 p-4 focus:ring-primary/20"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-full px-6 border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-bold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <span className="material-symbols-rounded mr-2 text-[20px]">save</span>}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
