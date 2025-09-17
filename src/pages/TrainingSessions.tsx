import { MainNav } from '@/components/navigation/MainNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Video } from 'lucide-react';

export default function TrainingSessions() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Training Sessions</h1>
          <p className="text-muted-foreground">
            Join live training sessions and workshops to enhance your learning.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sample session cards - will be replaced with real data */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Video className="h-8 w-8 text-primary" />
                <Badge variant="default">Upcoming</Badge>
              </div>
              <CardTitle className="text-lg">React Hooks Workshop</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Deep dive into React Hooks and modern functional component patterns.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  December 18, 2024
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  2:00 PM - 4:00 PM
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Virtual (Zoom)
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  12/20 registered
                </div>
              </div>
              <Button className="w-full">Join Session</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}