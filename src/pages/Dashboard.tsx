import { useAuth } from '@/hooks/useAuth';
import { UserRoles } from '@/lib/enums';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MainNav } from '@/components/navigation/MainNav';
import {
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';

export const Dashboard = () => {
  const { profile } = useAuth();
  const userRole = profile?.role?.role_name;

  // Sample data - would come from API calls
  const sampleProgressData = [
    { label: 'JavaScript Fundamentals', value: 8, total: 10, color: 'success' as const },
    { label: 'React Development', value: 5, total: 12, color: 'warning' as const },
    { label: 'Database Design', value: 3, total: 8, color: 'error' as const },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Completed JavaScript Quiz',
      description: 'Scored 95% on Module 3 assessment',
      time: '2 hours ago',
      type: 'achievement'
    },
    {
      id: 2,
      title: 'New Project Assigned',
      description: 'E-commerce Website Development',
      time: '4 hours ago',
      type: 'assignment'
    },
    {
      id: 3,
      title: 'Training Session Reminder',
      description: 'React Hooks workshop tomorrow at 2 PM',
      time: '1 day ago',
      type: 'reminder'
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Award className="w-4 h-4 text-success" />;
      case 'assignment':
        return <Target className="w-4 h-4 text-primary" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderManagementDashboard = () => (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Employees"
          value="248"
          description="Active workforce"
          icon={Users}
          trend={{ value: 12, label: 'from last month' }}
        />
        <DashboardCard
          title="Training ROI"
          value="340%"
          description="Return on investment"
          icon={TrendingUp}
          trend={{ value: 23, label: 'improvement' }}
        />
        <DashboardCard
          title="Completion Rate"
          value="87%"
          description="Average course completion"
          icon={CheckCircle}
          trend={{ value: 5, label: 'this quarter' }}
        />
        <DashboardCard
          title="Skill Gaps"
          value="15"
          description="Identified areas"
          icon={AlertCircle}
          trend={{ value: -8, label: 'resolved' }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Engineering', 'Marketing', 'Sales', 'Support'].map((dept, idx) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="font-medium">{dept}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={idx < 2 ? 'default' : 'secondary'}>
                      {90 - idx * 5}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ProgressChart
          title="Training Effectiveness"
          data={[
            { label: 'Technical Skills', value: 185, total: 200, color: 'primary' },
            { label: 'Soft Skills', value: 150, total: 200, color: 'secondary' },
            { label: 'Leadership', value: 95, total: 150, color: 'success' },
          ]}
        />
      </div>
    </>
  );

  const renderTraineeDashboard = () => (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Active Courses"
          value="3"
          description="Currently enrolled"
          icon={BookOpen}
          trend={{ value: 1, label: 'new this week' }}
        />
        <DashboardCard
          title="Completed"
          value="12"
          description="Courses finished"
          icon={CheckCircle}
          trend={{ value: 20, label: 'this month' }}
        />
        <DashboardCard
          title="Certificates"
          value="8"
          description="Earned credentials"
          icon={Award}
        />
        <DashboardCard
          title="Next Session"
          value="Tomorrow"
          description="React Hooks Workshop"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressChart
          title="Learning Progress"
          data={sampleProgressData}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.first_name}!
          </h1>
          <p className="text-muted-foreground">
            {userRole === UserRoles.MANAGEMENT && "Monitor your organization's training performance and ROI."}
            {userRole === UserRoles.HR && "Manage employee onboarding and training programs."}
            {userRole === UserRoles.TEAM_LEAD && "Track your team's progress and assign new learning paths."}
            {userRole === UserRoles.TRAINEE && "Continue your learning journey and track your progress."}
          </p>
        </div>

        {/* Role-specific Dashboard Content */}
        {userRole === UserRoles.MANAGEMENT && renderManagementDashboard()}
        {userRole === UserRoles.TRAINEE && renderTraineeDashboard()}
        {(userRole === UserRoles.HR || userRole === UserRoles.TEAM_LEAD) && renderManagementDashboard()}

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {userRole === UserRoles.MANAGEMENT && (
                <>
                  <Button variant="outline">View Analytics Report</Button>
                  <Button variant="outline">Department Overview</Button>
                  <Button variant="outline">Budget Review</Button>
                </>
              )}
              {userRole === UserRoles.HR && (
                <>
                  <Button variant="outline">Add New Employee</Button>
                  <Button variant="outline">Schedule Training</Button>
                  <Button variant="outline">Generate Reports</Button>
                </>
              )}
              {userRole === UserRoles.TEAM_LEAD && (
                <>
                  <Button variant="outline">Create Course</Button>
                  <Button variant="outline">Assign Project</Button>
                  <Button variant="outline">View Team Progress</Button>
                </>
              )}
              {userRole === UserRoles.TRAINEE && (
                <>
                  <Button>Continue Learning</Button>
                  <Button variant="outline">View Certificates</Button>
                  <Button variant="outline">Join Session</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};