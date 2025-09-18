import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, User, BookOpen, FileText, Upload, Check, X, Plus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { UserRoleType } from '@/lib/enums';
import { DocumentUploadDialog } from '@/components/employees/DocumentUploadDialog';
import { CourseEnrollmentDialog } from '@/components/employees/CourseEnrollmentDialog';

interface Employee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  employee_code: string | null;
  department: string | null;
  designation: string | null;
  current_status: string;
  phone: string | null;
  date_of_joining: string | null;
  manager_id: string | null;
  role: {
    id: string;
    role_name: UserRoleType;
    role_description: string | null;
  } | null;
  manager?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Course {
  id: string;
  course_name: string;
  course_description: string | null;
  status: string;
  enrolled_date: string;
  completion_date: string | null;
}

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  is_verified: boolean;
  created_at: string;
  uploaded_by: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface TeamLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export default function EmployeeDetail() {
  const { employeeId } = useParams();
  const { profile } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);

  // Check permissions
  const canManage = profile?.role?.role_name && ['HR', 'Management'].includes(profile.role.role_name);
  const isOwnProfile = profile?.id === employeeId;

  useEffect(() => {
    if (employeeId) {
      fetchEmployee();
      fetchCourses();
      fetchDocuments();
      if (canManage) {
        fetchTeamLeads();
      }
    }
  }, [employeeId, canManage]);

  const fetchEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, employee_code, department, designation,
          current_status, phone, date_of_joining, manager_id,
          role:roles(id, role_name, role_description),
          manager:profiles!profiles_manager_id_fkey(first_name, last_name)
        `)
        .eq('id', employeeId)
        .maybeSingle();

      if (error) throw error;
      setEmployee(data as Employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to load employee details');
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id, status, enrolled_date, completion_date, course_id
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;
      
      // Get course details separately
      if (data && data.length > 0) {
        const courseIds = data.map(enrollment => enrollment.course_id);
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, course_name, course_description')
          .in('id', courseIds);

        if (coursesError) throw coursesError;

        const coursesWithEnrollment = data.map(enrollment => {
          const courseInfo = coursesData?.find(c => c.id === enrollment.course_id);
          return {
            id: courseInfo?.id || '',
            course_name: courseInfo?.course_name || '',
            course_description: courseInfo?.course_description || '',
            status: enrollment.status || '',
            enrolled_date: enrollment.enrolled_date,
            completion_date: enrollment.completion_date
          };
        });
        
        setCourses(coursesWithEnrollment);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load enrolled courses');
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select(`
          id, document_name, document_type, file_path, is_verified, created_at,
          uploaded_by:profiles!employee_documents_uploaded_by_fkey(first_name, last_name)
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const fetchTeamLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role.role_name', 'Team Lead');

      if (error) throw error;
      setTeamLeads(data || []);
    } catch (error) {
      console.error('Error fetching team leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateManager = async (managerId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: managerId || null })
        .eq('id', employeeId);

      if (error) throw error;
      toast.success('Manager updated successfully');
      fetchEmployee();
    } catch (error) {
      console.error('Error updating manager:', error);
      toast.error('Failed to update manager');
    }
  };

  const verifyDocument = async (documentId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('employee_documents')
        .update({ is_verified: verified, verified_by: profile?.id })
        .eq('id', documentId);

      if (error) throw error;
      toast.success(`Document ${verified ? 'verified' : 'unverified'} successfully`);
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <User className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Employee Not Found</h2>
              <p className="text-muted-foreground">
                The employee profile you're looking for doesn't exist.
              </p>
              <Link to="/employees">
                <Button>Back to Employees</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Link to="/employees">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employees
              </Button>
            </Link>
          </div>
        </div>

        {/* Employee Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'No Name'}
                  </h1>
                  <p className="text-muted-foreground">{employee.designation || 'No Designation'}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {employee.role && (
                      <Badge variant="outline">{employee.role.role_name}</Badge>
                    )}
                    <Badge variant={employee.current_status === 'Active' ? 'default' : 'secondary'}>
                      {employee.current_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Details</TabsTrigger>
            <TabsTrigger value="courses">Enrolled Courses</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Employee Code</label>
                    <p className="text-muted-foreground">{employee.employee_code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <p className="text-muted-foreground">{employee.department || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-muted-foreground">{employee.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Joining</label>
                    <p className="text-muted-foreground">
                      {employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Manager</label>
                    {canManage ? (
                      <Select 
                        value={employee.manager_id || ''} 
                        onValueChange={updateManager}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Manager</SelectItem>
                          {teamLeads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {`${lead.first_name || ''} ${lead.last_name || ''}`.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-muted-foreground">
                        {employee.manager 
                          ? `${employee.manager.first_name || ''} ${employee.manager.last_name || ''}`.trim()
                          : '-'
                        }
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Enrolled Courses</h3>
              {canManage && (
                <Button onClick={() => setCourseDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll in Course
                </Button>
              )}
            </div>
            
            <Card>
              <CardContent>
                {courses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrolled Date</TableHead>
                        <TableHead>Completion Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            <Link 
                              to={`/courses/${course.id}`}
                              className="text-primary hover:underline"
                            >
                              {course.course_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>
                              {course.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {course.enrolled_date ? new Date(course.enrolled_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {course.completion_date ? new Date(course.completion_date).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No courses enrolled</h3>
                    <p className="text-sm text-muted-foreground">
                      This employee hasn't been enrolled in any courses yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documents</h3>
              {(canManage || isOwnProfile) && (
                <Button onClick={() => setDocumentDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </div>
            
            <Card>
              <CardContent>
                {documents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                        {canManage && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell className="font-medium">{document.document_name}</TableCell>
                          <TableCell>{document.document_type}</TableCell>
                          <TableCell>
                            {document.uploaded_by 
                              ? `${document.uploaded_by.first_name || ''} ${document.uploaded_by.last_name || ''}`.trim()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {new Date(document.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={document.is_verified ? 'default' : 'secondary'}>
                              {document.is_verified ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => verifyDocument(document.id, !document.is_verified)}
                                >
                                  {document.is_verified ? (
                                    <X className="h-4 w-4" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No documents uploaded</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload important documents like contracts, ID scans, etc.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <DocumentUploadDialog
          open={documentDialogOpen}
          onOpenChange={setDocumentDialogOpen}
          employeeId={employeeId!}
          onSuccess={() => {
            fetchDocuments();
            setDocumentDialogOpen(false);
          }}
        />

        <CourseEnrollmentDialog
          open={courseDialogOpen}
          onOpenChange={setCourseDialogOpen}
          employeeId={employeeId!}
          onSuccess={() => {
            fetchCourses();
            setCourseDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
}