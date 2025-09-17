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
import { ArrowLeft, Clock, Users, BookOpen, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch assessments
      const { data: assessmentsData } = await supabase
        .from('course_assessments')
        .select('*')
        .eq('course_id', courseId)
        .eq('employee_id', profile?.id);

      setCourse(courseData);
      setModules(modulesData || []);
      setEnrollment(enrollmentData);
      setAssessments(assessmentsData || []);
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
    navigate(`/courses/${courseId}/assessments/${assessmentId}`);
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
              <BookOpen className="h-8 w-8 text-primary" />
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
                  {assessments.length === 0 ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-center py-4">
                        No assessments taken yet.
                      </p>
                      {/* Show default assessment option if no assessments exist */}
                      <CourseAssessment
                        id="default-assessment"
                        courseId={courseId!}
                        employeeId={profile?.id!}
                        assessmentType="Course Assessment"
                        isMandatory={true}
                        passingScore={70}
                        onRetakeAssessment={handleTakeAssessment}
                      />
                    </div>
                  ) : (
                    assessments.map((assessment) => (
                      <CourseAssessment
                        key={assessment.id}
                        id={assessment.id}
                        courseId={courseId!}
                        employeeId={profile?.id!}
                        assessmentType={assessment.assessment_type}
                        status={assessment.status}
                        totalScore={assessment.total_score}
                        percentage={assessment.percentage}
                        passingScore={assessment.passing_score}
                        isMandatory={assessment.is_mandatory}
                        grade={assessment.grade}
                        feedback={assessment.feedback}
                        certificateUrl={assessment.certificate_url}
                        completionDate={assessment.completion_date}
                        onRetakeAssessment={handleTakeAssessment}
                      />
                    ))
                  )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}