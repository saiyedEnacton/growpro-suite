import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, GripVertical, X } from 'lucide-react';

interface Question {
  id: string;
  assessment_template_id: string;
  question_text: string;
  question_type: string;
  points: number;
  question_order: number;
  explanation: string;
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

interface QuestionManagerProps {
  assessmentId: string;
}

export function QuestionManager({ assessmentId }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    explanation: '',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    fetchQuestions();
  }, [assessmentId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('assessment_questions')
        .select(`
          *,
          question_options (
            id,
            option_text,
            is_correct,
            option_order
          )
        `)
        .eq('assessment_template_id', assessmentId)
        .order('question_order');

      if (error) throw error;

      // Sort options by order and transform to match interface
      const questionsWithSortedOptions = data?.map(question => ({
        ...question,
        options: question.question_options?.map(opt => ({
          ...opt,
          question_id: question.id
        })).sort((a, b) => a.option_order - b.option_order) || []
      })) || [];

      setQuestions(questionsWithSortedOptions);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      explanation: '',
      options: [
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question text.",
        variant: "destructive",
      });
      return;
    }

    // Validate options for MCQ and True/False
    if (['multiple_choice', 'true_false'].includes(questionForm.question_type)) {
      const validOptions = questionForm.options.filter(opt => opt.option_text.trim());
      const correctOptions = validOptions.filter(opt => opt.is_correct);
      
      if (validOptions.length < 2) {
        toast({
          title: "Error",
          description: "Please provide at least 2 options.",
          variant: "destructive",
        });
        return;
      }
      
      if (correctOptions.length === 0) {
        toast({
          title: "Error",
          description: "Please mark at least one option as correct.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const questionData = {
        assessment_template_id: assessmentId,
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        points: questionForm.points,
        explanation: questionForm.explanation,
        question_order: editingQuestion ? editingQuestion.question_order : questions.length + 1
      };

      let questionId;
      if (editingQuestion) {
        // Update question
        const { error } = await supabase
          .from('assessment_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
        
        if (error) throw error;
        questionId = editingQuestion.id;

        // Delete existing options
        await supabase
          .from('question_options')
          .delete()
          .eq('question_id', questionId);
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('assessment_questions')
          .insert(questionData)
          .select()
          .single();
        
        if (error) throw error;
        questionId = data.id;
      }

      // Save options for MCQ and True/False
      if (['multiple_choice', 'true_false'].includes(questionForm.question_type)) {
        const validOptions = questionForm.options
          .filter(opt => opt.option_text.trim())
          .map((opt, index) => ({
            question_id: questionId,
            option_text: opt.option_text.trim(),
            is_correct: opt.is_correct,
            option_order: index + 1
          }));

        if (validOptions.length > 0) {
          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(validOptions);
          
          if (optionsError) throw optionsError;
        }
      }

      await fetchQuestions();
      setDialogOpen(false);
      setEditingQuestion(null);
      resetForm();

      toast({
        title: "Success",
        description: `Question ${editingQuestion ? 'updated' : 'created'} successfully.`,
      });

    } catch (error: any) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingQuestion ? 'update' : 'create'} question. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('assessment_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      await fetchQuestions();
      toast({
        title: "Success",
        description: "Question deleted successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { option_text: '', is_correct: false }]
    });
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length > 2) {
      const newOptions = questionForm.options.filter((_, i) => i !== index);
      setQuestionForm({ ...questionForm, options: newOptions });
    }
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'essay': return 'Essay';
      case 'practical': return 'Practical';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-semibold">Questions ({questions.length})</h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => {
              setEditingQuestion(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="question_text">Question *</Label>
                <Textarea
                  id="question_text"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="question_type">Question Type</Label>
                  <Select
                    value={questionForm.question_type}
                    onValueChange={(value) => {
                      setQuestionForm({ 
                        ...questionForm, 
                        question_type: value,
                        options: value === 'true_false' 
                          ? [
                              { option_text: 'True', is_correct: false },
                              { option_text: 'False', is_correct: false }
                            ]
                          : questionForm.options
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="practical">Practical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {['multiple_choice', 'true_false'].includes(questionForm.question_type) && (
                <div>
                  <Label>Answer Options</Label>
                  <div className="space-y-2 mt-2">
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Switch
                          checked={option.is_correct}
                          onCheckedChange={(checked) => updateOption(index, 'is_correct', checked)}
                        />
                        <Input
                          value={option.option_text}
                          onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                          placeholder={`Option ${index + 1}${questionForm.question_type === 'true_false' && index < 2 ? ' (auto-filled)' : ''}`}
                          disabled={questionForm.question_type === 'true_false' && index < 2}
                        />
                        {questionForm.question_type === 'multiple_choice' && questionForm.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {questionForm.question_type === 'multiple_choice' && (
                      <Button variant="outline" size="sm" onClick={addOption}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Option
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Explain the correct answer..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveQuestion}>
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No questions added yet</p>
            <p className="text-sm">Add your first question to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline">Q{index + 1}</Badge>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary">
                          {getQuestionTypeLabel(question.question_type)}
                        </Badge>
                        <Badge variant="outline">
                          {question.points} {question.points === 1 ? 'point' : 'points'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-2">{question.question_text}</p>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {question.options.map((option, optIndex) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <span className={option.is_correct ? 'text-green-600 font-medium' : ''}>
                                {String.fromCharCode(65 + optIndex)}. {option.option_text}
                                {option.is_correct && ' ✓'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question);
                        setQuestionForm({
                          question_text: question.question_text,
                          question_type: question.question_type,
                          points: question.points,
                          explanation: question.explanation || '',
                          options: question.options?.map(opt => ({
                            option_text: opt.option_text,
                            is_correct: opt.is_correct
                          })) || [
                            { option_text: '', is_correct: false },
                            { option_text: '', is_correct: false }
                          ]
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}