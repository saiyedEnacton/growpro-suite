import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BookOpen, Award, CheckCircle, Clock } from 'lucide-react';

interface CourseEnrollmentProps {
  courseId: string;
  courseName: string;
  courseDescription?: string;
  completionRule?: string;
  minimumPassingPercentage?: number;
  assessmentsCompleted?: number;
  totalAssessments?: number;
  isCompleted?: boolean;
  enrollmentDate?: string;
  completionDate?: string;
  onViewModules?: () => void;
  onTakeAssessment?: () => void;
}

export const CourseEnrollment = ({
  courseId,
  courseName,
  courseDescription,
  completionRule = 'pass_all_assessments',
  minimumPassingPercentage = 70,
  assessmentsCompleted = 0,
  totalAssessments = 0,
  isCompleted = false,
  enrollmentDate,
  completionDate,
  onViewModules,
  onTakeAssessment,
}: CourseEnrollmentProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const completionPercentage = totalAssessments > 0 
    ? (assessmentsCompleted / totalAssessments) * 100 
    : 0;

  const getCompletionRuleText = (rule: string) => {
    switch (rule) {
      case 'pass_all_assessments':
        return 'Pass all assessments to complete';
      case 'pass_minimum_percentage':
        return `Pass ${minimumPassingPercentage}% of assessments to complete`;
      case 'pass_mandatory_only':
        return 'Pass all mandatory assessments to complete';
      default:
        return 'Complete all requirements';
    }
  };

  const handleMarkComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
        })
        .eq('employee_id', user.id)
        .eq('course_id', courseId);

      if (error) throw error;
      
      toast.success('Course marked as completed!');
    } catch (error) {
      toast.error('Failed to update course status');
      console.error('Error updating course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant={isCompleted ? 'default' : 'secondary'}>
            {isCompleted ? 'Completed' : 'In Progress'}
          </Badge>
          {isCompleted && (
            <Award className="w-5 h-5 text-warning fill-current" />
          )}
        </div>
        
        <CardTitle className="text-xl font-semibold">
          {courseName}
        </CardTitle>
        
        {courseDescription && (
          <p className="text-sm text-muted-foreground">
            {courseDescription}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Assessment Progress</span>
            <span className="font-medium">
              {assessmentsCompleted}/{totalAssessments} completed
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          
          <p className="text-xs text-muted-foreground">
            {getCompletionRuleText(completionRule)}
          </p>
        </div>

        {/* Enrollment Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {enrollmentDate && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Enrolled: {new Date(enrollmentDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {completionDate && (
            <div className="flex items-center space-x-2 text-success">
              <CheckCircle className="w-4 h-4" />
              <span>Completed: {new Date(completionDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onViewModules}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            View Modules
          </Button>
          
          {!isCompleted && totalAssessments > 0 && (
            <Button
              className="flex-1"
              onClick={onTakeAssessment}
            >
              Take Assessment
            </Button>
          )}
          
          {!isCompleted && totalAssessments === 0 && (
            <Button
              className="flex-1"
              onClick={handleMarkComplete}
              disabled={isLoading}
            >
              {isLoading ? 'Marking...' : 'Mark Complete'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};