import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import { PasswordGate } from '@/components/password-gate';
import Dashboard from '@/pages/dashboard';
import Browse from '@/pages/browse';
import AddEntry from '@/pages/add-entry';
import EditEntry from '@/pages/edit-entry';
import MultipleChoicePractice from '@/pages/practice/multiple-choice';
import SentencePractice from '@/pages/practice/sentence';
import SpeedMemo from '@/pages/practice/speed-memo';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/browse" component={Browse} />
        <Route path="/add" component={AddEntry} />
        <Route path="/edit/:type/:id" component={EditEntry} />
        <Route path="/practice/multiple-choice" component={MultipleChoicePractice} />
        <Route path="/practice/sentence" component={SentencePractice} />
        <Route path="/practice/speed-memo" component={SpeedMemo} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PasswordGate>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </PasswordGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
