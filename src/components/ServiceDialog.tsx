import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Service {
  id?: number;
  name: string;
  description: string;
  baseUrl: string;
  healthcheckPath: string;
  processName: string;
}

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSave: (service: Service) => void;
}

export default function ServiceDialog({ open, onOpenChange, service, onSave }: ServiceDialogProps) {
  const [formData, setFormData] = useState<Service>({
    name: "",
    description: "",
    baseUrl: "",
    healthcheckPath: "/health",
    processName: "",
  });

  useEffect(() => {
    if (service) {
      setFormData(service);
    } else {
      setFormData({
        name: "",
        description: "",
        baseUrl: "",
        healthcheckPath: "/health",
        processName: "",
      });
    }
  }, [service, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Add New Service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthcheckPath">Health Check Path</Label>
              <Input
                id="healthcheckPath"
                value={formData.healthcheckPath}
                onChange={(e) => setFormData({ ...formData, healthcheckPath: e.target.value })}
                placeholder="/health"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processName">Process Name</Label>
              <Input
                id="processName"
                value={formData.processName}
                onChange={(e) => setFormData({ ...formData, processName: e.target.value })}
                placeholder="pm2-process-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
