// /var/www/fresh-studio-hub/src/pages/admin/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";

interface AdminPayload {
  id: number;
  username: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface LoginResponse {
  token: string;
  admin: AdminPayload;
}

export default function Login() {
  const [username, setUsername] = useState("ironman");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.token || !data.admin) {
        const errMsg =
          (data as any)?.error ?? "Neispravni podaci za prijavu";
        setError(errMsg);
        return;
      }

      // Token
      localStorage.setItem("fs_auth_token", data.token);

      // Admin info
      localStorage.setItem("fs_admin_username", data.admin.username);
      if (data.admin.full_name) {
        localStorage.setItem("fs_admin_fullname", data.admin.full_name);
      }
      if (data.admin.email) {
        localStorage.setItem("fs_admin_email", data.admin.email);
      }
      if (data.admin.avatar_url) {
        localStorage.setItem("fs_admin_avatar_url", data.admin.avatar_url);
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
          <CardHeader className="space-y-4 items-center text-center">
            <img src={logo} alt="Fresh Studio" className="h-10 w-auto" />
            <div>
              <CardDescription>Prijava u hub</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Korisničko ime"
                  required
                />
              </div>

              <div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Lozinka"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive mt-2 text-center">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? "Prijava..." : "Prijavi se"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 text-xs text-muted-foreground pb-6">
            Fresh Studio · Private Hub Panel
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
