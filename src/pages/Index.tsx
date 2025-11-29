import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105"
        onClick={() => navigate("/login")}
      >
        <img
          src={logo}
          alt="Fresh Studio logo"
          className="w-40 h-40"
        />
      </div>
    </div>
  );
};

export default Index;
