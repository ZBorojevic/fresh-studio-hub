import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-primary">Fresh Studio</h1>
        <p className="text-xl text-muted-foreground">Admin Dashboard</p>
        <Button onClick={() => navigate("/admin/login")} size="lg">
          Access Admin Panel
        </Button>
      </div>
    </div>
  );
};

export default Index;
