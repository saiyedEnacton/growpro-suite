import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainNav } from '@/components/navigation/MainNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CourseModule } from '@/components/courses/CourseModule';
import { CourseEnrollment } from '@/components/courses/CourseEnrollment';
import { CourseAssessment } from '@/components/courses/CourseAssessment';
import { ArrowLeft, Clock, Users, BookOpen, Award, Edit, UserPlus, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CourseAssignmentDialog } from '@/components/courses/CourseAssignmentDialog';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  useEffect(() => {
    if (courseId && profile?.id) {
      fetchCourseData();
    }
  }, [courseId, profile?.id]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules
      const { data: modulesData } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');

      // Fetch enrollment status
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', profile?.id)
        .single();

      // Fetch assessments (user's assessment results)
      const { data: assessmentsData } = await supabase
        .from('course_assessments')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', profile?.id);

      // Fetch assessment templates (available assessments for the course)
      const { data: templateData } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('course_id', courseId);

      setCourse(courseData);
      setModules(modulesData || []);
      setEnrollment(enrollmentData);
      setAssessments(assessmentsData || []);
      setAssessmentTemplates(templateData || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          employee_id: profile?.id,
          course_id: courseId,
          status: 'enrolled'
        });

      if (error) throw error;

      await fetchCourseData();
      toast({
        title: "Success",
        description: "Successfully enrolled in course"
      });
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive"
      });
    }
  };

  const handleStartModule = (moduleId: string) => {
    navigate(`/courses/${courseId}/modules/${moduleId}`);
  };

  const handleViewContent = (moduleId: string) => {
    navigate(`/courses/${courseId}/modules/${moduleId}`);
  };

  const handleTakeAssessment = (assessmentId: string) => {
    const template = assessmentTemplates.find(t => t.id === assessmentId);
    if (!template) return;

    if (template.assessment_type === 'quiz') {
      navigate(`/courses/${courseId}/assessments/${template.id}`);
    } else {
      toast({
        title: "Coming Soon!",
        description: `The '${template.assessment_type}' assessment type is not yet implemented.`,
        variant: "default",
      });
    }
  };

  const handleMarkAsComplete = async (assessmentId: string) => {
    try {
      const { error } = await supabase
        .from('course_assessments')
        .update({ status: 'Completed', completion_date: new Date().toISOString() })
        .eq('assessment_template_id', assessmentId)
        .eq('employee_id', profile.id);

      if (error) throw error;

      await fetchCourseData();
      toast({
        title: "Success",
        description: "Assessment marked as complete."
      });
    } catch (error) {
      console.error('Error marking as complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark assessment as complete.",
        variant: "destructive"
      });
    }
  };

  // Check if user can manage courses
  const canManageCourses = profile?.role?.role_name === 'Team Lead' || 
                          profile?.role?.role_name === 'HR' ||
                          profile?.role?.role_name === 'Management';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Course not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>

        {/* Course Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{course.course_name}</CardTitle>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={course.is_mandatory ? 'destructive' : 'secondary'}>
                    {course.is_mandatory ? 'Mandatory' : 'Optional'}
                  </Badge>
                  <Badge variant="outline">{course.difficulty_level}</Badge>
                  {course.course_type && (
                    <Badge variant="outline">{course.course_type}</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {canManageCourses && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/courses/${courseId}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Course
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssignmentDialog(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign to Employees
                    </Button>
                  </>
                )}
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{course.course_description}</p>
            
            {course.learning_objectives && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Learning Objectives</h3>
                <p className="text-sm text-muted-foreground">{course.learning_objectives}</p>
              </div>
            )}

            {!enrollment ? (
              <Button onClick={handleEnroll} size="lg">
                Enroll in Course
              </Button>
            ) : (
              <div className="space-y-4">
                <CourseEnrollment
                  courseId={course.id}
                  courseName={course.course_name}
                  courseDescription={course.course_description}
                  completionRule={course.completion_rule}
                  minimumPassingPercentage={course.minimum_passing_percentage}
                  isCompleted={enrollment.status === 'completed'}
                  enrollmentDate={enrollment.enrolled_date}
                  completionDate={enrollment.completion_date}
                  assessmentsCompleted={assessments.filter(a => a.status === 'completed').length}
                  totalAssessments={assessments.length}
                  onViewModules={() => {}} // Scroll to modules section
                  onTakeAssessment={() => {}} // Handle assessment
                />
              </div>
            )}
          </CardContent>
        </Card>

        {enrollment && (
          <>
            {/* Modules Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Course Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {modules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No modules available for this course.
                  </p>
                ) : (
                  modules.map((module) => (
                    <CourseModule
                      key={module.id}
                      id={module.id}
                      name={module.module_name}
                      description={module.module_description}
                      order={module.module_order}
                      contentType={module.content_type}
                      contentUrl={module.content_url}
                      contentPath={module.content_path}
                      estimatedDuration={module.estimated_duration_minutes}
                      onStartModule={handleStartModule}
                      onViewContent={handleViewContent}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Assessments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Assessments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  {assessmentTemplates.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No assessments available for this course.
                    </p>
                  ) : (
                    assessmentTemplates.map((template) => {
                      // Find user's assessment result for this template
                      const userAssessment = assessments.find(a => a.assessment_template_id === template.id);
                      
                      return (
                        <CourseAssessment
                          key={template.id}
                          id={template.id}
                          courseId={courseId!}
                          employeeId={profile?.id!}
                          assessmentType={template.assessment_type}
                          status={userAssessment?.status}
                          totalScore={userAssessment?.total_score}
                          percentage={userAssessment?.percentage}
                          passingScore={template.passing_score}
                          isMandatory={template.is_mandatory}
                          grade={userAssessment?.grade}
                          feedback={userAssessment?.feedback}
                          certificateUrl={userAssessment?.certificate_url}
                          completionDate={userAssessment?.completion_date}
                          title={template.title}
                          description={template.description}
                          timeLimit={template.time_limit_minutes}
                          onRetakeAssessment={handleTakeAssessment}
                          onMarkAsComplete={handleMarkAsComplete}
                        />
                      );
                    })
                  )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Assignment Dialog */}
        <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Course to Employees</DialogTitle>
            </DialogHeader>
            {course && (
              <CourseAssignmentDialog
                courseId={course.id}
                courseName={course.course_name}
                onClose={() => setShowAssignmentDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}