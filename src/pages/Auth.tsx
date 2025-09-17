import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

const setMeta = (title: string, description: string, canonical?: string) => {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", description);
  else {
    const m = document.createElement("meta");
    m.name = "description";
    m.content = description;
    document.head.appendChild(m);
  }
  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
  }
};

const AuthPage = () => {
  useEffect(() => {
    setMeta(
      "Login & Sign Up - GrowPro LMS",
      "Access GrowPro LMS: log in to your account or create a new one in seconds.",
      window.location.href
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6">
        <h1 className="sr-only">GrowPro LMS Authentication</h1>
      </header>
      <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
        <section className="w-full max-w-2xl" aria-label="Authentication">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default AuthPage;
