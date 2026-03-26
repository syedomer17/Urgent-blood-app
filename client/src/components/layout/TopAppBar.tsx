interface TopAppBarProps {
  onLogout: () => void;
}

const TopAppBar = ({ onLogout }: TopAppBarProps) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-6 h-16">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black tracking-tighter text-red-700 font-headline">
          LifeLink
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="hover:bg-gray-100 rounded-full transition-colors p-2 active:scale-95 duration-200">
          <span className="material-symbols-outlined text-gray-500">
            notifications
          </span>
        </button>
        <button
          onClick={onLogout}
          className="hover:bg-gray-100 rounded-full transition-colors p-2 active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined text-gray-500">
            logout
          </span>
        </button>
      </div>
    </header>
  );
};

export default TopAppBar;
