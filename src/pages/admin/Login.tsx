import { useEffect, useState } from "react";
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

interface AdminPayload {
  id: number;
  username: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface LoginResponse {
  token?: string;
  admin?: AdminPayload;
  error?: string;
}

export default function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // reset forme pri ulasku na /login
  useEffect(() => {
    setUsername("");
    setPassword("");
    setError(null);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
        }),
      });

      const data: LoginResponse = await response.json().catch(() => ({}));

      if (!response.ok || !data.token || !data.admin) {
        throw new Error(data.error || "Invalid username or password.");
      }

      localStorage.setItem("fs_auth_token", data.token);
      localStorage.setItem("fs_admin_username", data.admin.username);

      if (data.admin.full_name) {
        localStorage.setItem("fs_admin_fullname", data.admin.full_name);
      } else {
        localStorage.removeItem("fs_admin_fullname");
      }

      if (data.admin.email) {
        localStorage.setItem("fs_admin_email", data.admin.email);
      } else {
        localStorage.removeItem("fs_admin_email");
      }

      if (data.admin.avatar_url) {
        localStorage.setItem("fs_admin_avatar_url", data.admin.avatar_url);
      } else {
        localStorage.removeItem("fs_admin_avatar_url");
      }

      navigate("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Login failed.");
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
              <CardDescription>Login to Hub</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {/* bitno: autoComplete off na formi pomaže protiv prefilla */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>

              <div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive mt-2 text-center">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
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
