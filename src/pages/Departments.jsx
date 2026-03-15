import React, { useState } from "react";
import { appClient } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Building2, Users, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Departments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", head: "", description: "" });
  const qc = useQueryClient();

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: () => appClient.entities.Department.list(),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => appClient.entities.Employee.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.Department.create(data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["departments"] }); 
      setDialogOpen(false); 
      setForm({ name: "", head: "", description: "" });
      toast.success("Department created successfully");
    },
    onError: (err) => toast.error(`Failed to create department: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.Department.update(id, data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["departments"] }); 
      setDialogOpen(false); 
      setEditing(null); 
      toast.success("Department updated successfully");
    },
    onError: (err) => toast.error(`Failed to update department: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.Department.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (err) => toast.error(`Failed to delete department: ${err.message}`),
  });

  const handleOpen = (dept = null) => {
    setEditing(dept);
    setForm(dept ? { name: dept.name, head: dept.head || "", description: dept.description || "" } : { name: "", head: "", description: "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    const data = { ...form };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const deptColors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-teal-500"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 mt-1">{departments.length} departments</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, i) => {
          const empCount = employees.filter((e) => e.department === dept.name).length;
          return (
            <Card key={dept.id} className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className={`h-2 ${deptColors[i % deptColors.length]}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 rounded-xl ${deptColors[i % deptColors.length]} bg-opacity-10 flex items-center justify-center`}>
                      <Building2 className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                      {dept.head && <p className="text-sm text-slate-500 mt-0.5">Head: {dept.head}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(dept)}>
                      <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-rose-400" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Department</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete {dept.name}?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-rose-600" onClick={() => deleteMutation.mutate(dept.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {dept.description && <p className="text-sm text-slate-400 mt-3 line-clamp-2">{dept.description}</p>}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-500">{empCount} employees</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={() => { setDialogOpen(false); setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Department Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Engineering" />
            </div>
            <div>
              <Label>Department Head</Label>
              <Input value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}