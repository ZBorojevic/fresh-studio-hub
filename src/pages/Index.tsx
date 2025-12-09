// /var/www/fresh-studio-hub/src/pages/Index.tsx
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <button
        type="button"
        aria-label="Otvori hub login"
        onClick={() => navigate("/login")}
        className="flex flex-col items-center transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-xl"
      >
        <img src={logo} alt="Fresh Studio logo" className="w-40 h-40" />
      </button>
    </div>
  );
};

export default Index;
