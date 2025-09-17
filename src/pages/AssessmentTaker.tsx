import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MainNav } from '@/components/navigation/MainNav';
import { ArrowLeft, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay' | 'true_false';
  options?: string[];
  correct_answer?: string;
  points: number;
}

interface Assessment {
  id: string;
  course_id: string;
  assessment_type: string;
  passing_score: number;
  is_mandatory: boolean;
  questions: Question[];
}

interface Answer {
  questionId: string;
  answer: string;
}

export default function AssessmentTaker() {
  const { courseId, assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (courseId && assessmentId) {
      fetchAssessmentData();
    }
  }, [courseId, assessmentId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // For demo purposes, create sample assessment data
      // In a real app, you'd have an assessments table with questions
      const mockAssessment: Assessment = {
        id: assessmentId!,
        course_id: courseId!,
        assessment_type: 'Module Assessment',
        passing_score: 70,
        is_mandatory: true,
        questions: [
          {
            id: '1',
            question_text: `What is the main objective of the "${courseData.course_name}" course?`,
            question_type: 'multiple_choice',
            options: [
              'To learn basic concepts',
              'To gain practical skills',
              'To understand theoretical frameworks',
              'All of the above'
            ],
            correct_answer: 'All of the above',
            points: 25
          },
          {
            id: '2',
            question_text: 'True or False: This course requires completion of all modules before taking the assessment.',
            question_type: 'true_false',
            options: ['True', 'False'],
            correct_answer: 'True',
            points: 25
          },
          {
            id: '3',
            question_text: 'Describe how you would apply the concepts learned in this course to your work.',
            question_type: 'essay',
            points: 50
          }
        ]
      };

      setCourse(courseData);
      setAssessment(mockAssessment);
      setTimeRemaining(60 * 30); // 30 minutes

    } catch (error: any) {
      console.error('Error fetching assessment:', error);
      toast({
        title: "Error",
        description: "Failed to load assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitAssessment();
    }
  }, [timeRemaining]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a);
      } else {
        return [...prev, { questionId, answer }];
      }
    });
  };

  const getCurrentAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.answer || '';
  };

  const calculateScore = () => {
    if (!assessment) return 0;
    
    let totalScore = 0;
    let maxPoints = 0;

    assessment.questions.forEach(question => {
      maxPoints += question.points;
      const answer = getCurrentAnswer(question.id);
      
      if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        if (answer === question.correct_answer) {
          totalScore += question.points;
        }
      } else if (question.question_type === 'essay') {
        // For demo, give full points if answered
        if (answer.trim().length > 10) {
          totalScore += question.points;
        }
      }
    });

    return Math.round((totalScore / maxPoints) * 100);
  };

  const handleSubmitAssessment = async () => {
    if (!assessment || !user) return;

    try {
      setSubmitting(true);
      const percentage = calculateScore();
      const passed = percentage >= assessment.passing_score;

      // Save assessment result
      const { error } = await supabase
        .from('course_assessments')
        .insert({
          employee_id: user.id,
          course_id: courseId,
          assessment_type: assessment.assessment_type,
          total_score: percentage,
          percentage: percentage,
          passing_score: assessment.passing_score,
          is_mandatory: assessment.is_mandatory,
          status: 'completed',
          grade: passed ? 'Pass' : 'Fail',
          completion_date: new Date().toISOString(),
          feedback: `Assessment completed with ${percentage}% score. ${passed ? 'Congratulations!' : 'Please review the material and retake if needed.'}`
        });

      if (error) throw error;

      toast({
        title: passed ? "Assessment Passed!" : "Assessment Completed",
        description: `You scored ${percentage}%. ${passed ? 'Well done!' : 'You can retake this assessment.'}`,
        variant: passed ? "default" : "destructive",
      });

      navigate(`/courses/${courseId}`);

    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <div className="container mx-auto py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!assessment || !course) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Assessment not found</p>
              <Button onClick={() => navigate(`/courses/${courseId}`)} className="mt-4">
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{course.course_name}</h1>
              <p className="text-muted-foreground">{assessment.assessment_type}</p>
            </div>
          </div>
          
          {timeRemaining && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className={timeRemaining < 300 ? 'text-destructive font-medium' : ''}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestionIndex + 1} of {assessment.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg leading-relaxed pr-4">
                {currentQuestion.question_text}
              </CardTitle>
              <Badge variant="outline">{currentQuestion.points} pts</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {currentQuestion.question_type === 'multiple_choice' && (
              <RadioGroup
                value={getCurrentAnswer(currentQuestion.id)}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <RadioGroup
                value={getCurrentAnswer(currentQuestion.id)}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="True" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="False" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">False</Label>
                </div>
              </RadioGroup>
            )}

            {currentQuestion.question_type === 'essay' && (
              <Textarea
                placeholder="Enter your answer here..."
                value={getCurrentAnswer(currentQuestion.id)}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={6}
                className="resize-none"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {currentQuestionIndex < assessment.questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={!getCurrentAnswer(currentQuestion.id)}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitAssessment}
              disabled={submitting || answers.length !== assessment.questions.length}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          )}
        </div>

        {/* Assessment Info */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Passing Score:</span>
                <span className="ml-2">{assessment.passing_score}%</span>
              </div>
              <div>
                <span className="font-medium">Questions Answered:</span>
                <span className="ml-2">{answers.length} / {assessment.questions.length}</span>
              </div>
              <div className="flex items-center">
                {assessment.is_mandatory && (
                  <>
                    <Badge variant="destructive" className="mr-2">Mandatory</Badge>
                    <span className="text-xs text-muted-foreground">Must pass to complete course</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}