import { useState, useEffect } from 'react';
import { MainNav } from '@/components/navigation/MainNav';
import { CourseCard } from '@/components/courses/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth-utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Course {
    id: string;
    course_name: string;
    course_description: string;
    course_type: string;
    difficulty_level: string;
    is_mandatory: boolean;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollments, setEnrollments] = useState(new Map());
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [profile?.id, fetchCourses]);

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
      toast.success("Successfully enrolled in course");
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error("Failed to enroll in course");
    }
  };

  const handleViewDetails = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const openDeleteDialog = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        setCourseToDelete(course);
        setDeleteDialogOpen(true);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    const { error } = await supabase.from('courses').delete().eq('id', courseToDelete.id);

    if (error) {
        toast.error(`Failed to delete course: ${error.message}`);
    } else {
        toast.success(`Course "${courseToDelete.course_name}" deleted.`);
        fetchCourses();
    }
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
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
                isAdmin={canManageCourses}
                onEnroll={handleEnroll}
                onViewDetails={handleViewDetails}
                onDelete={openDeleteDialog}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              <strong> {courseToDelete?.course_name}</strong> and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}