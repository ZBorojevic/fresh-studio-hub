import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Activity, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ServiceDialog from "@/components/ServiceDialog";

const mockServices = [
  {
    id: 1,
    name: "Fresh Studio Website",
    description: "Main company website",
    baseUrl: "https://freshstudio.hr",
    healthcheckPath: "/api/health",
    processName: "freshstudio-web",
    status: "up",
  },
  {
    id: 2,
    name: "Contact API",
    description: "Contact form processing service",
    baseUrl: "https://dev.freshstudio.hr",
    healthcheckPath: "/contact/health",
    processName: "contact-api",
    status: "up",
  },
  {
    id: 3,
    name: "Admin Dashboard API",
    description: "Backend API for admin dashboard",
    baseUrl: "https://dev.freshstudio.hr",
    healthcheckPath: "/api/admin/health",
    processName: "admin-api",
    status: "down",
  },
];

export default function ServicesList() {
  const { toast } = useToast();
  const [services, setServices] = useState(mockServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const handleHealthCheck = async (serviceId: number) => {
    toast({
      title: "Checking health...",
      description: "Testing service availability",
    });

    // Simulate API call
    setTimeout(() => {
      const randomStatus = Math.random() > 0.3 ? "up" : "down";
      setServices(services.map(s => 
        s.id === serviceId ? { ...s, status: randomStatus } : s
      ));
      
      toast({
        title: randomStatus === "up" ? "Service is healthy" : "Service is down",
        description: randomStatus === "up" 
          ? "The service is responding correctly" 
          : "The service is not responding",
        variant: randomStatus === "up" ? "default" : "destructive",
      });
    }, 1000);
  };

  const handleRestart = (processName: string) => {
    toast({
      title: "Restarting service...",
      description: `Sending restart command for ${processName}`,
    });
  };

  const handleSaveService = (service: any) => {
    if (service.id) {
      setServices(services.map(s => s.id === service.id ? service : s));
      toast({ title: "Service updated successfully" });
    } else {
      const newService = { ...service, id: services.length + 1, status: "down" };
      setServices([...services, newService]);
      toast({ title: "Service added successfully" });
    }
    setEditingService(null);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Monitor and manage your API services</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
                <Badge 
                  variant={service.status === "up" ? "default" : "destructive"}
                  className={service.status === "up" ? "bg-success" : ""}
                >
                  {service.status === "up" ? "UP" : "DOWN"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span className="font-mono text-xs">{service.baseUrl}</span>
                </div>
                {service.processName && (
                  <div className="text-muted-foreground">
                    Process: <span className="font-mono text-xs">{service.processName}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleHealthCheck(service.id)}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Check Health
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(service)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {service.processName && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRestart(service.processName)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editingService}
        onSave={handleSaveService}
      />
    </div>
  );
}
