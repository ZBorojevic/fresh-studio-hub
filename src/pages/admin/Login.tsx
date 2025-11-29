import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import logo from "@/assets/logo.svg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "Neispravni podaci za prijavu");
        return;
      }

      localStorage.setItem("fs_auth_token", data.token);

      if (data.admin?.username) {
        localStorage.setItem("fs_admin_username", data.admin.username);
      }

      navigate("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setError("Došlo je do greške pri prijavi. Pokušaj ponovno.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/60 shadow-lg">

          {/* LOGO + TEXT */}
          <CardHeader className="flex flex-col items-center space-y-4 pt-8">
            <img src={logo} alt="Fresh Studio" className="h-14 opacity-90" />
            <CardDescription className="text-center">
              Prijava
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username */}
              <Input
                type="text"
                placeholder="Korisničko ime"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              {/* Password */}
              <Input
                type="password"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && (
                <p className="text-sm text-destructive mt-2 text-center">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "Prijava..." : "Prijavi se"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2 text-xs text-muted-foreground pb-6">
            Fresh Studio • Private Panel
          </CardFooter>

        </Card>
      </div>
    </div>
  );
}
