import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LightbulbIcon, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", values);
      setSuccess(true);
      
      toast({
        title: "Password reset email sent",
        description: "If this email exists in our system, you'll receive instructions to reset your password.",
      });
      
      // For development mode, extract resetUrl from response
      if (response && typeof response === 'object' && 'debugResetUrl' in response) {
        setResetLink(response.debugResetUrl as string);
        console.log("Reset URL found in response:", response.debugResetUrl);
      } else {
        console.log("Check server logs for the password reset link");
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary text-white p-2 rounded-lg">
              <LightbulbIcon className="h-6 w-6" />
            </div>
            <h1 className="ml-2 text-xl font-bold">Upcraft</h1>
          </div>
          <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  We've sent password reset instructions to your email address. Please check your inbox.
                </AlertDescription>
              </Alert>
              
              {/* For development environment only */}
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Development Mode</h3>
                {resetLink ? (
                  <>
                    <p className="text-xs text-gray-600 mb-2">
                      Here is your password reset link:
                    </p>
                    <div className="text-xs break-all border border-gray-300 p-2 rounded bg-white mb-2">
                      {resetLink}
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resetLink, "_blank")}
                      >
                        Open Link
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-600 mb-2">
                      In development mode, the actual reset link is logged to the server console.
                    </p>
                    <div className="text-xs text-gray-500 break-all border border-gray-300 p-2 rounded bg-white">
                      Check the server logs for a line containing: "Reset URL: http://..."
                    </div>
                  </>
                )}
              </div>
              
              <Button 
                className="w-full"
                variant="outline" 
                onClick={() => setLocation("/login")}
              >
                Return to login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="text-sm text-gray-500"
            onClick={() => setLocation("/login")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}