import { useAuth } from '@/hooks/auth-utils';
import { UserRoles } from '@/lib/enums';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MainNav } from '@/components/navigation/MainNav';
import { useNavigate } from 'react-router-dom';
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
  FolderOpen,
} from 'lucide-react';

export const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const userRole = profile?.role?.role_name;
  
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    activeCourses: 0,
    completedCourses: 0,
    totalCourses: 0,
    completionRate: 0,
    totalProjects: 0,
    departments: [],
    courseCompletionRates: [],
    nextSession: null,
    courseAssessments: [],
    loading: true
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const { id: userId, role } = profile || {};
      const userRoleName = role?.role_name;

      let data: any = { loading: false };

      if (userRoleName === UserRoles.MANAGEMENT || userRoleName === UserRoles.HR) {
        const { count: totalEmployees } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: totalCourses } = await supabase.from('courses').select('*', { count: 'exact', head: true });
        const { count: totalProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        const { data: enrollments } = await supabase.from('course_enrollments').select('status');
        const completed = enrollments?.filter(e => e.status === 'completed').length || 0;
        data.totalEmployees = totalEmployees || 0;
        data.totalCourses = totalCourses || 0;
        data.totalProjects = totalProjects || 0;
        data.completionRate = enrollments && enrollments.length > 0 ? (completed / enrollments.length) * 100 : 0;
      } else if (userRoleName === UserRoles.TRAINEE) {
        const { data: enrollments } = await supabase.from('course_enrollments').select('status').eq('employee_id', userId);
        const activeCourses = enrollments?.filter(e => e.status === 'enrolled').length || 0;
        data.activeCourses = activeCourses || 0;
      }

      setDashboardData(prev => ({ ...prev, ...data }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, profile?.id]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Award className="w-4 h-4 text-success" />;
      case 'enrollment':
        return <BookOpen className="w-4 h-4 text-primary" />;
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
          value={dashboardData.loading ? "..." : dashboardData.totalEmployees.toString()}
          description="Active workforce"
          icon={Users}
        />
        <DashboardCard
          title="Total Courses"
          value={dashboardData.loading ? "..." : dashboardData.totalCourses.toString()}
          description="Available in catalog"
          icon={BookOpen}
        />
        <DashboardCard
          title="Completion Rate"
          value={dashboardData.loading ? "..." : `${dashboardData.completionRate.toFixed(0)}%`}
          description="Average course completion"
          icon={CheckCircle}
        />
        <DashboardCard
          title="Total Projects"
          value={dashboardData.loading ? "..." : dashboardData.totalProjects.toString()}
          description="Available projects"
          icon={FolderOpen}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No department data available.</p>
          </CardContent>
        </Card>

        <ProgressChart
          title="Course Completion Rates"
          data={[]}
        />
      </div>
    </>
  );

  const renderTraineeDashboard = () => (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        <DashboardCard
          title="Active Courses"
          value={dashboardData.loading ? "..." : dashboardData.activeCourses.toString()}
          description="Currently enrolled"
          icon={BookOpen}
        />
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
                  <Button variant="outline" disabled>View Analytics Report</Button>
                  <Button variant="outline" disabled>Department Overview</Button>
                  <Button variant="outline" disabled>Budget Review</Button>
                </>
              )}
              {userRole === UserRoles.HR && (
                <>
                  <Button variant="outline" disabled>Add New Employee</Button>
                  <Button variant="outline" disabled>Schedule Training</Button>
                  <Button variant="outline" disabled>Generate Reports</Button>
                </>
              )}
              {userRole === UserRoles.TEAM_LEAD && (
                <>
                  <Button variant="outline" onClick={() => navigate('/courses/create')}>Create Course</Button>
                  <Button variant="outline" onClick={() => navigate('/projects')}>Assign Project</Button>
                  <Button variant="outline" disabled>View Team Progress</Button>
                </>
              )}
              {userRole === UserRoles.TRAINEE && (
                <>
                  <Button onClick={() => navigate('/courses')}>Continue Learning</Button>
                  <Button variant="outline" onClick={() => navigate('/training-sessions')}>Join Session</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};