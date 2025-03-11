import "./App.css";
import { KanbanBoard } from "./components/KanbanBoard";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider } from "./components/theme-provider";
import { Button } from "./components/ui/button";

const FooterLink = ({ children }: { children: React.ReactNode }) => {
  return (
    <Button
      variant="link"
      asChild
      className="text-xl font-semibold tracking-tight scroll-m-20"
    >
      {children}
    </Button>
  );
};

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex flex-col min-h-screen min-w-full items-center">
          <main className="flex flex-col h-full gap-6 mx-4 w-[55%] bg-blue-300 rounded-lg p-4">
            <h1 className="text-4xl font-extrabold tracking-tight scroll-m-20 lg:text-5xl">
              Drag and Drop Kanban Board
            </h1>
            <ThemeToggle/>
            <KanbanBoard/>
          </main>
        </div>
      </ThemeProvider>
    </>
  );
}

export default App;
