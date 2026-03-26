import { useState } from "react";
import { SplashView, LoginForm } from "../../components/login";

const LoginPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-between bg-signature-gradient overflow-hidden font-body text-on-surface antialiased">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[80%] h-[80%] bg-primary-container/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {showForm ? (
        <LoginForm onBack={() => setShowForm(false)} />
      ) : (
        <SplashView onLoginClick={() => setShowForm(true)} />
      )}

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${
            showForm ? "w-2 bg-white/30" : "w-8 bg-white"
          }`}
        />
        <div
          className={`h-1 rounded-full transition-all duration-300 ${
            showForm ? "w-8 bg-white" : "w-2 bg-white/30"
          }`}
        />
      </div>
    </main>
  );
};

export default LoginPage;
