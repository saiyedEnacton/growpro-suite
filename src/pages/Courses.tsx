import { useState, useEffect } from 'react';
import { MainNav } from '@/components/navigation/MainNav';
import { CourseCard } from '@/components/courses/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollments, setEnrollments] = useState(new Map());
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user enrollments if logged in
      if (profile?.id) {
        const { data: enrollmentsData } = await supabase
          .from('course_enrollments')
          .select('course_id, status')
          .eq('employee_id', profile.id);

        const enrollmentMap = new Map();
        enrollmentsData?.forEach(enrollment => {
          enrollmentMap.set(enrollment.course_id, enrollment.status);
        });
        setEnrollments(enrollmentMap);
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [profile?.id]);

  const handleEnroll = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          employee_id: profile?.id,
          course_id: courseId,
          status: 'enrolled'
        });

      if (error) throw error;

      setEnrollments(prev => new Map(prev).set(courseId, 'enrolled'));
      toast({
        title: "Success",
        description: "Successfully enrolled in course"
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: "Error", 
        description: "Failed to enroll in course",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const filteredCourses = courses.filter(course =>
    course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageCourses = profile?.role?.role_name === 'Team Lead' || 
                          profile?.role?.role_name === 'HR' ||
                          profile?.role?.role_name === 'Management';

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Courses</h1>
              <p className="text-muted-foreground">
                Discover and enroll in training courses to enhance your skills.
              </p>
            </div>
            {canManageCourses && (
              <Button onClick={() => navigate('/courses/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.course_name}
                description={course.course_description}
                type={course.course_type || 'Training'}
                difficulty={course.difficulty_level}
                isMandatory={course.is_mandatory}
                isEnrolled={enrollments.has(course.id)}
                onEnroll={handleEnroll}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}