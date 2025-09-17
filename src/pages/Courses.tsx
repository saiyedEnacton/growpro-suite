import { MainNav } from '@/components/navigation/MainNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Star } from 'lucide-react';

export default function Courses() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Courses</h1>
          <p className="text-muted-foreground">
            Discover and enroll in training courses to enhance your skills.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sample course cards - will be replaced with real data */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <BookOpen className="h-8 w-8 text-primary" />
                <Badge variant="secondary">Beginner</Badge>
              </div>
              <CardTitle className="text-lg">JavaScript Fundamentals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Learn the basics of JavaScript programming language.
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  8 hours
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  45 enrolled
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  4.8
                </div>
              </div>
              <Button className="w-full">Enroll Now</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}