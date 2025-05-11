import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import RoleSelectionForm from '@/components/career/RoleSelectionForm';
import { Briefcase, Compass } from 'lucide-react';

interface CareerTransitionsPageProps {
  user: any;
}

export default function CareerTransitionsPage({ user }: CareerTransitionsPageProps) {
  const [selectedRoles, setSelectedRoles] = useState<{currentRole?: number, targetRole?: number}>({});
  
  const handleRoleSelected = (currentRoleId: number, targetRoleId: number) => {
    setSelectedRoles({
      currentRole: currentRoleId,
      targetRole: targetRoleId
    });
  };
  
  return (
    <>
      <Helmet>
        <title>Career Options | Upcraft</title>
      </Helmet>
      
      <div className="container py-6 space-y-8">
        <PageHeader 
          heading="Career Options" 
          subheading="Explore potential career paths and plan your transition to your ideal position"
        />
        
        <Tabs defaultValue="role-transition">
          <TabsList className="w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger value="role-transition" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              <span>Role Transitions</span>
            </TabsTrigger>
            <TabsTrigger value="market-trends" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>Market Trends</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="role-transition" className="mt-6">
            <RoleSelectionForm 
              userId={user.id} 
              onRoleSelected={handleRoleSelected}
            />
          </TabsContent>
          
          <TabsContent value="market-trends" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
                <CardDescription>Explore current trends and demand for different roles in the job market</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This feature will provide insights on market demand, salary trends, and industry growth for different roles.
                  Data is updated monthly to ensure accuracy.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}