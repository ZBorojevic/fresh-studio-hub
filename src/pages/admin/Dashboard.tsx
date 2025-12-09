import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, FileText, TrendingUp } from "lucide-react";

const metrics = [
  {
    title: "New Leads (7 days)",
    value: "12",
    description: "+20% from last week",
    icon: Users,
    color: "text-primary",
  },
  {
    title: "Qualified Leads",
    value: "45",
    description: "Total qualified",
    icon: TrendingUp,
    color: "text-success",
  },
  {
    title: "Emails Sent (30 days)",
    value: "324",
    description: "Across all campaigns",
    icon: Mail,
    color: "text-info",
  },
  {
    title: "Published Posts",
    value: "18",
    description: "Blog articles",
    icon: FileText,
    color: "text-warning",
  },
];

const recentLeads = [
  { company: "Tech Solutions Ltd", email: "info@techsolutions.com", date: "2024-01-15" },
  { company: "Digital Marketing Co", email: "hello@digitalmark.hr", date: "2024-01-14" },
  { company: "Creative Agency", email: "contact@creative.com", date: "2024-01-14" },
  { company: "E-commerce Plus", email: "sales@ecomplus.hr", date: "2024-01-13" },
  { company: "Web Design Studio", email: "info@webdesign.hr", date: "2024-01-12" },
];

const recentMessages = [
  { name: "Ivan Horvat", email: "ivan@example.com", message: "Interested in web development services", date: "2024-01-15" },
  { name: "Ana Kovač", email: "ana@example.com", message: "Request for SEO consultation", date: "2024-01-14" },
  { name: "Marko Petrović", email: "marko@example.com", message: "Question about pricing", date: "2024-01-13" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to Fresh Studio Admin</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Leads</CardTitle>
            <CardDescription>Most recent leads added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{lead.company}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{lead.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Messages</CardTitle>
            <CardDescription>Recent contact form submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.map((message, index) => (
                <div key={index} className="flex flex-col border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{message.name}</p>
                    <p className="text-xs text-muted-foreground">{message.date}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{message.email}</p>
                  <p className="text-sm mt-1">{message.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
